package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"nhooyr.io/websocket"
)

var startTime = time.Now()

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "*"
	}

	hub := NewHub()

	// Evict idle rooms older than 24h every hour
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	hub.StartJanitor(ctx, 1*time.Hour, 24*time.Hour)

	mux := http.NewServeMux()

	// Health check endpoint
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "ok",
			"uptime": time.Since(startTime).String(),
			"rooms":  hub.RoomCount(),
		})
	})

	// WebSocket relay endpoint
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		role := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("role")))
		roomID := strings.TrimSpace(r.URL.Query().Get("room"))
		token := strings.TrimSpace(r.URL.Query().Get("token"))

		if role != "player" && role != "controller" {
			http.Error(w, "invalid or missing 'role' parameter (must be 'player' or 'controller')", http.StatusBadRequest)
			return
		}

		var room *Room
		var err error

		if role == "player" {
			room = hub.GetOrCreateRoomForPlayer(roomID)
		} else {
			if roomID == "" {
				http.Error(w, "missing 'room' parameter for controller", http.StatusBadRequest)
				return
			}
			room, err = hub.ValidateController(roomID, token)
			if err != nil {
				if err == ErrRoomNotFound {
					http.Error(w, "room not found", http.StatusNotFound)
				} else {
					http.Error(w, "invalid controller token", http.StatusUnauthorized)
				}
				return
			}
		}

		// Configure origin patterns
		var acceptOpts websocket.AcceptOptions
		if allowedOrigin != "*" {
			origins := strings.Split(allowedOrigin, ",")
			patterns := make([]string, 0, len(origins))
			for _, o := range origins {
				clean := strings.TrimSpace(o)
				if clean != "" {
					patterns = append(patterns, clean)
				}
			}
			acceptOpts.OriginPatterns = patterns
		} else {
			acceptOpts.InsecureSkipVerify = true
		}

		conn, err := websocket.Accept(w, r, &acceptOpts)
		if err != nil {
			log.Printf("[Relay] WebSocket upgrade error: %v", err)
			return
		}

		client := &Client{
			conn: conn,
			role: role,
			send: make(chan []byte, sendQueueCap),
			room: room,
		}

		room.AddClient(client)
		log.Printf("[Relay] Client connected: role=%s room=%s", role, room.ID)

		// Send initial greeting and shadow state
		room.SendHello(client)
		room.SendSync(client)

		clientCtx, clientCancel := context.WithCancel(r.Context())
		defer clientCancel()

		// Launch write pump
		go func() {
			client.WritePump(clientCtx)
			_ = conn.Close(websocket.StatusNormalClosure, "bye")
		}()

		// Block in read pump
		client.ReadPump(clientCtx)

		// Cleanup on disconnect
		room.RemoveClient(client)
		log.Printf("[Relay] Client disconnected: role=%s room=%s", role, room.ID)
	})

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	// Server shutdown listener
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("[Relay] Hydralisk WebSocket relay listening on port %s (allowed_origin=%s)", port, allowedOrigin)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[Relay] Listen error: %v", err)
		}
	}()

	<-stop
	log.Println("[Relay] Shutting down relay server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("[Relay] Shutdown error: %v", err)
	}
	log.Println("[Relay] Server gracefully stopped.")
}

package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"math/big"
	"strings"
	"sync"
	"time"
)

// Human-friendly alphabet without confusing characters (0, O, 1, I, L)
const roomAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

var (
	ErrRoomNotFound = errors.New("room not found")
	ErrInvalidToken = errors.New("invalid controller token")
)

// Hub maintains the in-memory registry of all active rooms
type Hub struct {
	mu    sync.RWMutex
	rooms map[string]*Room
}

// NewHub initializes an empty room registry
func NewHub() *Hub {
	return &Hub{
		rooms: make(map[string]*Room),
	}
}

// generateRoomID produces a short 4-character room code
func generateRoomID() string {
	b := make([]byte, 4)
	alphaLen := big.NewInt(int64(len(roomAlphabet)))
	for i := 0; i < 4; i++ {
		n, err := rand.Int(rand.Reader, alphaLen)
		if err != nil {
			b[i] = roomAlphabet[i%len(roomAlphabet)]
		} else {
			b[i] = roomAlphabet[n.Int64()]
		}
	}
	return string(b)
}

// generateToken produces a secure random 32-character hex string
func generateToken() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// GetOrCreateRoomForPlayer returns an existing room if valid or creates a new one
func (h *Hub) GetOrCreateRoomForPlayer(requestedID string) *Room {
	h.mu.Lock()
	defer h.mu.Unlock()

	cleanID := strings.ToUpper(strings.TrimSpace(requestedID))
	if cleanID != "" {
		if existing, ok := h.rooms[cleanID]; ok {
			return existing
		}
	}

	// Generate a unique 4-character room code
	var id string
	for {
		if cleanID != "" && h.rooms[cleanID] == nil {
			id = cleanID
			break
		}
		candidate := generateRoomID()
		if _, exists := h.rooms[candidate]; !exists {
			id = candidate
			break
		}
	}

	token := generateToken()
	room := NewRoom(id, token)
	h.rooms[id] = room
	return room
}

// GetRoom retrieves a room by ID
func (h *Hub) GetRoom(id string) *Room {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.rooms[strings.ToUpper(strings.TrimSpace(id))]
}

// ValidateController checks that the room exists and the controller token matches if provided
func (h *Hub) ValidateController(roomID, token string) (*Room, error) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	cleanID := strings.ToUpper(strings.TrimSpace(roomID))
	room, ok := h.rooms[cleanID]
	if !ok {
		return nil, ErrRoomNotFound
	}

	cleanToken := strings.TrimSpace(token)
	if cleanToken != "" && room.ControllerToken != "" && room.ControllerToken != cleanToken {
		return nil, ErrInvalidToken
	}

	return room, nil
}

// RoomCount returns the number of active rooms in the hub
func (h *Hub) RoomCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.rooms)
}

// CleanIdleRooms evicts rooms with no activity older than maxAge
func (h *Hub) CleanIdleRooms(maxAge time.Duration) int {
	h.mu.Lock()
	defer h.mu.Unlock()

	cutoff := time.Now().Add(-maxAge)
	evicted := 0

	for id, room := range h.rooms {
		room.mu.RLock()
		clientCount := len(room.clients)
		lastAct := room.lastActivity
		room.mu.RUnlock()

		if clientCount == 0 && lastAct.Before(cutoff) {
			delete(h.rooms, id)
			evicted++
		}
	}
	return evicted
}

// StartJanitor runs a periodic cleanup loop in the background
func (h *Hub) StartJanitor(ctx context.Context, interval, maxAge time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				h.CleanIdleRooms(maxAge)
			case <-ctx.Done():
				return
			}
		}
	}()
}

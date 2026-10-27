package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"nhooyr.io/websocket"
)

func TestEndToEndRelayPairingAndIntents(t *testing.T) {
	hub := NewHub()

	// Set up test server
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		role := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("role")))
		roomID := strings.TrimSpace(r.URL.Query().Get("room"))
		token := strings.TrimSpace(r.URL.Query().Get("token"))

		var room *Room
		var err error

		if role == "player" {
			room = hub.GetOrCreateRoomForPlayer(roomID)
		} else {
			room, err = hub.ValidateController(roomID, token)
			if err != nil {
				http.Error(w, err.Error(), http.StatusUnauthorized)
				return
			}
		}

		conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{InsecureSkipVerify: true})
		if err != nil {
			return
		}

		client := &Client{
			conn: conn,
			role: role,
			send: make(chan []byte, 32),
			room: room,
		}
		room.AddClient(client)
		room.SendHello(client)
		room.SendSync(client)

		ctx, cancel := context.WithCancel(r.Context())
		defer cancel()

		go client.WritePump(ctx)
		client.ReadPump(ctx)
		room.RemoveClient(client)
	})

	server := httptest.NewServer(mux)
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws"

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Connect Player
	playerConn, _, err := websocket.Dial(ctx, wsURL+"?role=player", nil)
	if err != nil {
		t.Fatalf("failed to connect player: %v", err)
	}
	defer playerConn.Close(websocket.StatusNormalClosure, "")

	// Read player HELLO message
	_, helloMsg, err := playerConn.Read(ctx)
	if err != nil {
		t.Fatalf("failed to read player HELLO: %v", err)
	}
	var playerHello Envelope
	if err := json.Unmarshal(helloMsg, &playerHello); err != nil {
		t.Fatalf("failed to unmarshal player HELLO: %v", err)
	}
	var helloPayload HelloPayload
	if err := json.Unmarshal(playerHello.Payload, &helloPayload); err != nil {
		t.Fatalf("failed to unmarshal hello payload: %v", err)
	}
	roomID := helloPayload.RoomID
	token := helloPayload.ControllerToken
	if len(roomID) != 4 || token == "" {
		t.Fatalf("invalid roomID (%s) or token (%s)", roomID, token)
	}

	// Read player initial SYNC
	_, syncMsg, err := playerConn.Read(ctx)
	if err != nil {
		t.Fatalf("failed to read player initial SYNC: %v", err)
	}
	var playerSync Envelope
	json.Unmarshal(syncMsg, &playerSync)
	if playerSync.Type != TypeSync {
		t.Fatalf("expected TypeSync, got %s", playerSync.Type)
	}

	// 2. Player registers scenes
	regPayload, _ := json.Marshal(map[string]interface{}{
		"scenes": []SceneMeta{
			{ID: "sketch_1", Name: "Neon Pulse", BPM: 128},
			{ID: "sketch_2", Name: "Cosmic Glitch", BPM: 140},
		},
	})
	regEnv := Envelope{
		V:       1,
		Type:    TypeIntent,
		Action:  ActionRegisterScenes,
		Payload: regPayload,
	}
	regBytes, _ := json.Marshal(regEnv)
	if err := playerConn.Write(ctx, websocket.MessageText, regBytes); err != nil {
		t.Fatalf("failed to write REGISTER_SCENES: %v", err)
	}

	// 3. Controller attempts connect with invalid token
	_, _, err = websocket.Dial(ctx, wsURL+"?role=controller&room="+roomID+"&token=bad-token", nil)
	if err == nil {
		t.Fatalf("expected controller connection with bad token to fail")
	}

	// 4. Controller connects with valid room and token
	ctrlConn, _, err := websocket.Dial(ctx, wsURL+"?role=controller&room="+roomID+"&token="+token, nil)
	if err != nil {
		t.Fatalf("failed to connect valid controller: %v", err)
	}
	defer ctrlConn.Close(websocket.StatusNormalClosure, "")

	// Controller reads HELLO
	_, ctrlHelloMsg, err := ctrlConn.Read(ctx)
	if err != nil {
		t.Fatalf("failed to read controller HELLO: %v", err)
	}
	var ctrlHello Envelope
	json.Unmarshal(ctrlHelloMsg, &ctrlHello)
	if ctrlHello.Type != TypeHello {
		t.Fatalf("expected controller TypeHello, got %s", ctrlHello.Type)
	}

	// Controller reads SYNC with ShadowState
	_, ctrlSyncMsg, err := ctrlConn.Read(ctx)
	if err != nil {
		t.Fatalf("failed to read controller SYNC: %v", err)
	}
	var ctrlSync Envelope
	json.Unmarshal(ctrlSyncMsg, &ctrlSync)
	var syncedState ShadowState
	json.Unmarshal(ctrlSync.Payload, &syncedState)
	if len(syncedState.SceneList) != 2 || syncedState.SceneList[0].Name != "Neon Pulse" {
		t.Fatalf("controller sync did not include registered scenes: %+v", syncedState.SceneList)
	}

	// 5. Controller sends AUTO_MUTATE intent
	mutatePayload, _ := json.Marshal(map[string]interface{}{"beats": 8})
	mutateEnv := Envelope{
		V:       1,
		Type:    TypeIntent,
		Action:  ActionAutoMutate,
		Payload: mutatePayload,
	}
	mutateBytes, _ := json.Marshal(mutateEnv)
	if err := ctrlConn.Write(ctx, websocket.MessageText, mutateBytes); err != nil {
		t.Fatalf("failed to write AUTO_MUTATE: %v", err)
	}

	// Player receives AUTO_MUTATE
	_, playerRecvMsg, err := playerConn.Read(ctx)
	if err != nil {
		t.Fatalf("player failed to receive intent: %v", err)
	}
	var playerReceived Envelope
	json.Unmarshal(playerRecvMsg, &playerReceived)
	if playerReceived.Action != ActionAutoMutate {
		t.Fatalf("expected ActionAutoMutate, got %s", playerReceived.Action)
	}
	var recBeats struct{ Beats int }
	json.Unmarshal(playerReceived.Payload, &recBeats)
	if recBeats.Beats != 8 {
		t.Fatalf("expected 8 beats, got %d", recBeats.Beats)
	}

	// 6. Controller sends MIDI_CC
	ccPayload, _ := json.Marshal(map[string]interface{}{"cc": "b2", "val": 0.92})
	ccEnv := Envelope{
		V:       1,
		Type:    TypeIntent,
		Action:  ActionMidiCC,
		Payload: ccPayload,
	}
	ccBytes, _ := json.Marshal(ccEnv)
	if err := ctrlConn.Write(ctx, websocket.MessageText, ccBytes); err != nil {
		t.Fatalf("failed to write MIDI_CC: %v", err)
	}

	// Player receives MIDI_CC
	_, playerCCMsg, err := playerConn.Read(ctx)
	if err != nil {
		t.Fatalf("player failed to receive MIDI_CC: %v", err)
	}
	var playerReceivedCC Envelope
	json.Unmarshal(playerCCMsg, &playerReceivedCC)
	if playerReceivedCC.Action != ActionMidiCC {
		t.Fatalf("expected ActionMidiCC, got %s", playerReceivedCC.Action)
	}
}

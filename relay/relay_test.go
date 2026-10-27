package main

import (
	"encoding/json"
	"testing"
	"time"
)

func TestHubRoomLifecycle(t *testing.T) {
	hub := NewHub()

	// Create room for player
	room1 := hub.GetOrCreateRoomForPlayer("")
	if room1 == nil || len(room1.ID) != 4 {
		t.Fatalf("expected 4-character room ID, got %v", room1)
	}
	if room1.ControllerToken == "" {
		t.Fatalf("expected non-empty controller token")
	}

	// Idempotent retrieval with same room ID
	room2 := hub.GetOrCreateRoomForPlayer(room1.ID)
	if room2.ID != room1.ID || room2 != room1 {
		t.Fatalf("expected to retrieve the same room instance")
	}

	// Validate valid controller
	validRoom, err := hub.ValidateController(room1.ID, room1.ControllerToken)
	if err != nil || validRoom != room1 {
		t.Fatalf("expected controller validation to succeed, got %v", err)
	}

	// Validate controller with wrong token
	_, err = hub.ValidateController(room1.ID, "wrong-token")
	if err != ErrInvalidToken {
		t.Fatalf("expected ErrInvalidToken, got %v", err)
	}

	// Validate non-existent room
	_, err = hub.ValidateController("ZZZZ", "token")
	if err != ErrRoomNotFound {
		t.Fatalf("expected ErrRoomNotFound, got %v", err)
	}
}

func TestRoomShadowStateMutations(t *testing.T) {
	room := NewRoom("TEST", "secret-token")

	c1 := &Client{role: "player", send: make(chan []byte, 10), room: room}
	c2 := &Client{role: "controller", send: make(chan []byte, 10), room: room}

	room.AddClient(c1)
	room.AddClient(c2)

	// 1. Send AUTO_MUTATE intent from controller
	payloadMutate, _ := json.Marshal(map[string]interface{}{"beats": 4})
	env1 := Envelope{
		V:       1,
		Type:    TypeIntent,
		Action:  ActionAutoMutate,
		Payload: payloadMutate,
	}
	envBytes, _ := json.Marshal(env1)
	room.HandleMessage(c2, envBytes)

	// Verify shadow state updated
	room.mu.RLock()
	if room.state.MutateBeats != 4 {
		t.Errorf("expected MutateBeats=4, got %d", room.state.MutateBeats)
	}
	if room.state.Seq != 1 {
		t.Errorf("expected Seq=1, got %d", room.state.Seq)
	}
	room.mu.RUnlock()

	// Verify c1 (player) received broadcast, c2 (sender) did not
	select {
	case msg := <-c1.send:
		var received Envelope
		if err := json.Unmarshal(msg, &received); err != nil {
			t.Fatalf("failed to unmarshal message: %v", err)
		}
		if received.Action != ActionAutoMutate || received.Seq != 1 {
			t.Errorf("unexpected broadcast message: %+v", received)
		}
	case <-time.After(100 * time.Millisecond):
		t.Fatal("expected c1 to receive broadcast")
	}

	select {
	case <-c2.send:
		t.Fatal("sender c2 should not receive its own broadcast")
	default:
		// Expected
	}

	// 2. Send MIDI_CC intent
	payloadCC, _ := json.Marshal(map[string]interface{}{"cc": "b1", "val": 0.85})
	env2 := Envelope{
		V:       1,
		Type:    TypeIntent,
		Action:  ActionMidiCC,
		Payload: payloadCC,
	}
	env2Bytes, _ := json.Marshal(env2)
	room.HandleMessage(c2, env2Bytes)

	room.mu.RLock()
	if room.state.CCValues["b1"] != 0.85 {
		t.Errorf("expected CCValues[b1]=0.85, got %f", room.state.CCValues["b1"])
	}
	room.mu.RUnlock()

	// 3. Send TAP_TEMPO
	payloadBPM, _ := json.Marshal(map[string]interface{}{"bpm": 134.0})
	env3 := Envelope{
		V:       1,
		Type:    TypeIntent,
		Action:  ActionTapTempo,
		Payload: payloadBPM,
	}
	env3Bytes, _ := json.Marshal(env3)
	room.HandleMessage(c2, env3Bytes)

	room.mu.RLock()
	if room.state.BPM != 134.0 {
		t.Errorf("expected BPM=134.0, got %f", room.state.BPM)
	}
	room.mu.RUnlock()

	// 4. Test SendSync to a new client
	c3 := &Client{role: "controller", send: make(chan []byte, 10), room: room}
	room.AddClient(c3)
	room.SendSync(c3)

	select {
	case syncMsg := <-c3.send:
		var syncEnv Envelope
		if err := json.Unmarshal(syncMsg, &syncEnv); err != nil {
			t.Fatalf("failed to unmarshal sync message: %v", err)
		}
		if syncEnv.Type != TypeSync || syncEnv.Action != ActionFullState {
			t.Errorf("unexpected sync env: %+v", syncEnv)
		}
		var syncedState ShadowState
		if err := json.Unmarshal(syncEnv.Payload, &syncedState); err != nil {
			t.Fatalf("failed to unmarshal synced state: %v", err)
		}
		if syncedState.BPM != 134.0 || syncedState.MutateBeats != 4 || syncedState.CCValues["b1"] != 0.85 {
			t.Errorf("synced state mismatch: %+v", syncedState)
		}
	case <-time.After(100 * time.Millisecond):
		t.Fatal("expected c3 to receive sync message")
	}
}

func TestHubJanitorCleanup(t *testing.T) {
	hub := NewHub()
	room := hub.GetOrCreateRoomForPlayer("IDLE")

	// Set last activity in the past
	room.mu.Lock()
	room.lastActivity = time.Now().Add(-25 * time.Hour)
	room.mu.Unlock()

	evicted := hub.CleanIdleRooms(24 * time.Hour)
	if evicted != 1 {
		t.Fatalf("expected 1 room evicted, got %d", evicted)
	}
	if hub.GetRoom("IDLE") != nil {
		t.Fatalf("room IDLE should have been evicted")
	}
}

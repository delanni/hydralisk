package main

import (
	"encoding/json"
)

// Message envelope types
const (
	TypeIntent = "INTENT"
	TypeSync   = "SYNC"
	TypeHello  = "HELLO"
	TypeError  = "ERROR"
	TypePing   = "PING"
	TypePong   = "PONG"
)

// Supported Intent actions
const (
	ActionLoadScene      = "LOAD_SCENE"
	ActionAutoMutate     = "AUTO_MUTATE"
	ActionMutateNow      = "MUTATE_NOW"
	ActionUndo5X         = "UNDO_5X"
	ActionSpeedDial      = "SPEED_DIAL"
	ActionTapTempo       = "TAP_TEMPO"
	ActionMidiCC         = "MIDI_CC"
	ActionBlackout       = "BLACKOUT"
	ActionRegisterScenes = "REGISTER_SCENES"
	ActionFullState      = "FULL_STATE"
)

// SceneMeta describes a sketch available in the player
type SceneMeta struct {
	ID     string  `json:"id"`
	Name   string  `json:"name"`
	Author string  `json:"author,omitempty"`
	BPM    float64 `json:"bpm,omitempty"`
	Code   string  `json:"code,omitempty"`
}

// ShadowState retains the authoritative real-time state for a room
type ShadowState struct {
	Seq         uint64             `json:"seq"`
	CurrentCode string             `json:"current_code"`
	SceneID     string             `json:"scene_id"`
	MutateBeats int                `json:"mutate_beats"`
	Speed       float64            `json:"speed"`
	Reverse     bool               `json:"reverse"`
	BPM         float64            `json:"bpm"`
	Blackout    bool               `json:"blackout"`
	CCValues    map[string]float64 `json:"cc_values"` // e.g. "b1".."b8" -> 0.0..1.0
	SceneList   []SceneMeta        `json:"scene_list"`
}

// Envelope wraps all messages exchanged over the WebSocket relay
type Envelope struct {
	V       int             `json:"v"`
	Seq     uint64          `json:"seq"`
	Ts      int64           `json:"ts"`
	Type    string          `json:"type"`             // "INTENT", "SYNC", "HELLO", "ERROR"
	Action  string          `json:"action,omitempty"` // "LOAD_SCENE", "MIDI_CC", etc.
	Payload json.RawMessage `json:"payload,omitempty"`
}

// HelloPayload is sent to clients immediately after connection
type HelloPayload struct {
	Role            string `json:"role"`
	RoomID          string `json:"room_id"`
	ControllerToken string `json:"controller_token,omitempty"` // only revealed to player or valid controller
	PlayerActive    bool   `json:"player_active"`
	ControllerCount int    `json:"controller_count"`
}

// ErrorPayload describes errors sent back to a client
type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

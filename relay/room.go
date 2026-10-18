package main

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"nhooyr.io/websocket"
)

const (
	writeTimeout = 3 * time.Second
	pingInterval = 15 * time.Second
	sendQueueCap = 64
)

// Client represents a connected WebSocket peer
type Client struct {
	conn *websocket.Conn
	role string // "player" | "controller"
	send chan []byte
	room *Room
}

// Room manages connected clients and retains the authoritative ShadowState
type Room struct {
	ID              string
	ControllerToken string
	mu              sync.RWMutex
	state           ShadowState
	clients         map[*Client]struct{}
	lastActivity    time.Time
}

// NewRoom creates a new Room with default ShadowState
func NewRoom(id, token string) *Room {
	return &Room{
		ID:              id,
		ControllerToken: token,
		clients:         make(map[*Client]struct{}),
		lastActivity:    time.Now(),
		state: ShadowState{
			Seq:         0,
			Speed:       1.0,
			BPM:         120.0,
			MutateBeats: 0,
			CCValues:    make(map[string]float64),
			SceneList:   make([]SceneMeta, 0),
		},
	}
}

// AddClient registers a new client and updates activity
func (r *Room) AddClient(c *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.clients[c] = struct{}{}
	r.lastActivity = time.Now()
}

// RemoveClient unregisters a client
func (r *Room) RemoveClient(c *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.clients, c)
	close(c.send)
	r.lastActivity = time.Now()
}

// ClientCounts returns the number of active players and controllers
func (r *Room) ClientCounts() (players int, controllers int) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for c := range r.clients {
		if c.role == "player" {
			players++
		} else {
			controllers++
		}
	}
	return
}

// HandleMessage updates the room's ShadowState and fans out to other peers
func (r *Room) HandleMessage(sender *Client, raw []byte) {
	var env Envelope
	if err := json.Unmarshal(raw, &env); err != nil {
		return
	}

	r.mu.Lock()
	r.lastActivity = time.Now()
	r.state.Seq++
	env.Seq = r.state.Seq
	if env.Ts == 0 {
		env.Ts = time.Now().UnixMilli()
	}

	// Update Shadow State based on intent so reconnecting peers receive authoritative state
	switch env.Action {
	case ActionMidiCC:
		var p struct {
			CC  string  `json:"cc"`
			Val float64 `json:"val"`
		}
		if json.Unmarshal(env.Payload, &p) == nil && p.CC != "" {
			r.state.CCValues[p.CC] = p.Val
		}

	case ActionAutoMutate:
		var p struct {
			Beats int `json:"beats"`
		}
		if json.Unmarshal(env.Payload, &p) == nil {
			r.state.MutateBeats = p.Beats
		}

	case ActionSpeedDial:
		var p struct {
			Multiplier float64 `json:"multiplier"`
			Reverse    bool    `json:"reverse"`
		}
		if json.Unmarshal(env.Payload, &p) == nil {
			r.state.Speed = p.Multiplier
			r.state.Reverse = p.Reverse
		}

	case ActionTapTempo:
		var p struct {
			BPM float64 `json:"bpm"`
		}
		if json.Unmarshal(env.Payload, &p) == nil && p.BPM > 0 {
			r.state.BPM = p.BPM
		}

	case ActionLoadScene:
		var p struct {
			ID   string `json:"id"`
			Code string `json:"code"`
		}
		if json.Unmarshal(env.Payload, &p) == nil {
			if p.ID != "" {
				r.state.SceneID = p.ID
			}
			if p.Code != "" {
				r.state.CurrentCode = p.Code
			}
		}

	case ActionBlackout:
		var p struct {
			Active bool `json:"active"`
		}
		if json.Unmarshal(env.Payload, &p) == nil {
			r.state.Blackout = p.Active
		}

	case ActionRegisterScenes:
		var p struct {
			Scenes []SceneMeta `json:"scenes"`
		}
		if json.Unmarshal(env.Payload, &p) == nil && p.Scenes != nil {
			r.state.SceneList = p.Scenes
		}
	}

	outBytes, err := json.Marshal(env)
	if err != nil {
		r.mu.Unlock()
		return
	}

	// Non-blocking fan-out: if a slow client's buffer is saturated, drop stale frame
	for c := range r.clients {
		if c == sender {
			continue
		}
		select {
		case c.send <- outBytes:
		default:
			// Buffer full; drop frame to prevent slow consumer lag from stalling the room
		}
	}
	r.mu.Unlock()
}

// SendSync delivers the complete authoritative ShadowState to a client
func (r *Room) SendSync(c *Client) {
	r.mu.RLock()
	stateBytes, err := json.Marshal(r.state)
	seq := r.state.Seq
	r.mu.RUnlock()

	if err != nil {
		return
	}

	syncEnv := Envelope{
		V:       1,
		Seq:     seq,
		Ts:      time.Now().UnixMilli(),
		Type:    TypeSync,
		Action:  ActionFullState,
		Payload: stateBytes,
	}

	if b, err := json.Marshal(syncEnv); err == nil {
		select {
		case c.send <- b:
		default:
		}
	}
}

// SendHello sends connection confirmation and role information to a client
func (r *Room) SendHello(c *Client) {
	players, controllers := r.ClientCounts()

	token := ""
	if c.role == "player" {
		token = r.ControllerToken
	}

	payload, _ := json.Marshal(HelloPayload{
		Role:            c.role,
		RoomID:          r.ID,
		ControllerToken: token,
		PlayerActive:    players > 0,
		ControllerCount: controllers,
	})

	helloEnv := Envelope{
		V:       1,
		Seq:     0,
		Ts:      time.Now().UnixMilli(),
		Type:    TypeHello,
		Payload: payload,
	}

	if b, err := json.Marshal(helloEnv); err == nil {
		select {
		case c.send <- b:
		default:
		}
	}
}

// WritePump writes queued messages to the WebSocket connection and sends periodic pings
func (c *Client) WritePump(ctx context.Context) {
	ticker := time.NewTicker(pingInterval)
	defer ticker.Stop()

	for {
		select {
		case msg, ok := <-c.send:
			if !ok {
				return
			}
			writeCtx, cancel := context.WithTimeout(ctx, writeTimeout)
			err := c.conn.Write(writeCtx, websocket.MessageText, msg)
			cancel()
			if err != nil {
				return
			}

		case <-ticker.C:
			pingCtx, cancel := context.WithTimeout(ctx, writeTimeout)
			err := c.conn.Ping(pingCtx)
			cancel()
			if err != nil {
				return
			}

		case <-ctx.Done():
			return
		}
	}
}

// ReadPump continuously reads incoming WebSocket frames from a client
func (c *Client) ReadPump(ctx context.Context) {
	for {
		msgType, msg, err := c.conn.Read(ctx)
		if err != nil {
			return
		}
		if msgType == websocket.MessageText {
			c.room.HandleMessage(c, msg)
		}
	}
}

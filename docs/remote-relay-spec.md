# Technical Specification: Hydralisk Remote Relay (`hydralisk.sphynx.cloud`)

> Source: Shared Gemini Session (Argon) - October 14, 2026
> Architecture & Design Specification for Relay-Based Remote Control for `delanni/hydralisk`.

---

## 1. Executive Summary & Architectural Principles

`delanni/hydralisk` extends Olivia Jack's Hydra live-coding synthesizer with live-performance playability features: tap tempo (`ALT+Space`), rhythmic auto-mutation (`CTRL+1..5, 0`), 5x undo (`CMD+[`), speed dials (`CTRL+7,8,9`), reverse playback (`CTRL+SHIFT+8`), local sketch browsing, and virtual MIDI CC bindings (`midi("b1", ...)`).

To allow an internet-connected smartphone to control a projector-connected browser ("Player") with sub-20ms relay latency and rock-solid connection durability, this architecture separates high-frequency continuous parameter streams from reliable state transitions:

- **Zero-Dependency, Single-Binary Relay (Go)**: A lightweight Go WebSocket daemon (`nhooyr.io/websocket`) using < 25MB RAM. It manages rooms in-memory with a Shadow State per room so mobile devices or refreshed projector browsers immediately synchronize on reconnect.
- **Dual-Path Message Handling**:
  - *State Intents* (Scene load, Auto-mutate, Undo, Speed): Retained in the server's Shadow State and guaranteed via monotonic sequence numbers (`seq`).
  - *Ephemeral Streams* (XY Touchpad / Virtual MIDI `b1..b8`, Tap Tempo): Forwarded immediately without disk/queue blocking; if a client lags, stale frames are dropped in favor of the latest value (Last-Value-Wins).
- **Decoupled Static & Relay Edge**: The Hostinger VPS serves `hydralisk.sphynx.cloud` via Caddy (automatic Let's Encrypt TLS + HTTP/3 + WebSocket reverse proxy). Heavy static assets (`.mp4` loops, preset bundles, JS bundles) can either be served locally by Caddy or offloaded to GCP Cloud Storage + Cloud CDN so the VPS CPU/bandwidth is 100% dedicated to low-latency WebSocket frame switching.

---

## 2. System Components & Topology

```
[ Mobile Controller UI ]               [ Projector / Player UI ]
 (hydralisk.sphynx.cloud/remote)        (hydralisk.sphynx.cloud/player)
          |                                           ^
          | 1. WSS Intent / CC Stream                 | 2. WSS Broadcast + Shadow Sync
          v                                           |
+-----------------------------------------------------------------------+
| Hostinger VPS (hydralisk.sphynx.cloud)                                |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  | Caddy 2 (Port 443: Auto-TLS, HTTP/3, Static Asset Compression)  |  |
|  +-----------------------------------------------------------------+  |
|            | /ws                                     | /*             |
|            v                                         v                |
|  +-------------------------------+     +---------------------------+  |
|  | Hydralisk Relay Daemon (Go)   |     | Static Web Root (or proxy |  |
|  | - Port: 127.0.0.1:8080        |     | to GCP CDN bucket)        |  |
|  | - In-Memory Room Registry     |     +---------------------------+  |
|  | - Shadow State & Ring Buffer  |                                    |
|  +-------------------------------+                                    |
+-----------------------------------------------------------------------+
```

### Component Breakdown

| Component | Responsibility | Key Implementation Files (Target Repo) |
| :--- | :--- | :--- |
| **Relay Server (`relay/`)** | Room creation, PIN/Token pairing, WebSocket fan-out, Shadow State retention, Heartbeat (PING/PONG). | `relay/main.go`, `relay/room.go`, `relay/hub.go`, `relay/protocol.go`, `relay/Dockerfile` |
| **Player Client Adapter** | Connects projector browser to `/ws`, exposes a QR code overlay for phone pairing, translates JSON/binary frames into Hydralisk internal API calls instead of synthetic DOM keyboard events. | `src/remote/playerClient.js`, `src/remote/qrOverlay.js` |
| **Mobile Controller UI** | Touch-optimized, dark-mode responsive interface (`/remote?room=XYZ`) with a Tap Tempo drum pad, Auto-Mutate beat selector, XY pad / 8-fader bank mapped to `midi("b1".."b8")`, and Scene Deck selector. | `remote.html`, `src/remote/controllerApp.js`, `src/remote/touchSurface.js` |
| **Infrastructure as Code** | Reproducible provisioning and deployment for Hostinger VPS (Docker Compose + Caddy + sysctl tuning) and optional GCP CDN offload. | `deploy/docker-compose.yml`, `deploy/Caddyfile`, `deploy/sysctl-tuning.conf`, `infra/terraform/main.tf` |

---

## 3. Core Networking Relay & Wire Protocol

### 3.1 Room Lifecycle & Pairing Flow

1. **Room Initialization**: When the Projector opens `https://hydralisk.sphynx.cloud/player.html` (or `?mode=player`), `playerClient.js` connects to `wss://hydralisk.sphynx.cloud/ws?role=player` (optionally passing an existing `room_id` from `sessionStorage` to survive page reloads).
2. **Pairing Token**: The server returns a short 4-character alphanumeric `room_id` (e.g., `K9X2`) and a `controller_token`.
3. **QR Handshake**: The Player renders a toggleable QR code (`CTRL+SHIFT+R` or UI icon) encoding `https://hydralisk.sphynx.cloud/remote?room=K9X2&token=f8a9...`.
4. **Phone Connection**: Scanning the QR code opens the Mobile Controller, which connects to `wss://hydralisk.sphynx.cloud/ws?role=controller&room=K9X2&token=f8a9...`. Once connected, the QR overlay automatically fades out on the projector.

### 3.2 Message Envelope Schema

```json
{
  "v": 1,
  "seq": 1042,
  "ts": 1791982210412,
  "type": "INTENT",
  "action": "AUTO_MUTATE",
  "payload": { "beats": 2 }
}
```

### 3.3 Supported Intents & Hydralisk Action Mapping

| Intent action | Payload Schema | Hydralisk Feature Equivalent | Retained in Shadow State? |
| :--- | :--- | :--- | :--- |
| `LOAD_SCENE` | `{ "id": "sketch_04", "code": "osc(10)..." }` | Load local/remote sketch & `evaluate(code)` | Yes (`current_code`, `scene_id`) |
| `AUTO_MUTATE` | `{ "beats": 0 \| 1 \| 2 \| 4 \| 8 \| 16 }` | `CTRL + (1..5, 0)` auto-mutate timer | Yes (`mutate_beats`) |
| `MUTATE_NOW` | `{ "seed": 94812 }` | Single immediate step mutation | No (Action Event) |
| `UNDO_5X` | `{}` | `CMD + [` (5x state history rollback) | No (Action Event) |
| `SPEED_DIAL` | `{ "multiplier": 0.5 \| 1.0 \| 2.0, "reverse": false }` | `CTRL + (7,8,9)` and `CTRL + SHIFT + 8` | Yes (`speed`, `reverse`) |
| `TAP_TEMPO` | `{ "bpm": 124.5, "beat_phase_ts": 1791982210412 }` | `ALT + Space` tap tempo (calculated on phone to avoid network jitter!) | Yes (`bpm`) |
| `MIDI_CC` | `{ "cc": "b1", "val": 0.74 }` | Feeds virtual `midi("b1", ...)` binding directly | Yes (`cc_values["b1"]`) |
| `BLACKOUT` | `{ "active": true }` | Emergency projector fade-to-black | Yes (`blackout`) |
| `REGISTER_SCENES`| `{ "scenes": [{ "id": "...", "name": "..." }] }` | Sent by Player on boot to populate Phone's scene selector | Yes (`scene_list`) |

> **Architectural Detail — Tap Tempo Jitter Prevention**: Never send individual raw tap timestamps over the internet to calculate BPM on the server; mobile LTE/Wi-Fi jitter (5–80ms variance) will corrupt the BPM average. Instead, the Mobile Controller calculates the rolling average BPM locally over 4+ taps and sends the computed `{ "bpm": 128.0 }` intent to the Player.

---

## 4. Relay Server Implementation Blueprint (Go)

- `relay/go.mod`
- `relay/main.go` (HTTP server, `/ws` upgrade, `/healthz` endpoint)
- `relay/hub.go` (Room registry, TTL cleanup, pairing code generation)
- `relay/room.go` (Per-room mutex, ShadowState, client fan-out)
- `relay/protocol.go` (Envelope, ShadowState structs)
- `relay/Dockerfile` (Multi-stage build)

---

## 5. Client-Side Integration

- **`src/remote/wsConnection.js`**: Durable WebSocket wrapper with jittered exponential backoff, visibility & network change hooks, and throttled 60Hz continuous frame dispatcher.
- **`src/remote/playerClient.js`**: Player-side listener translating intents into Hydralisk actions and virtual MIDI CC injection.
- **`src/remote/qrOverlay.js`**: Pair UI and QR generator modal.
- **`remote.html` & `src/remote/controllerApp.js`**: Touch-optimized OLED mobile surface with Status Bar, Playability Deck, multi-touch CC faders / XY pads, and Scene Selector Drawer.

---

## 6. Infrastructure as Code & Deployment Targets

- **Target 1: Hostinger VPS (`hydralisk.sphynx.cloud`)**:
  - `deploy/docker-compose.yml` (Caddy + Relay)
  - `deploy/Caddyfile` (Reverse proxy for `/ws`, `/healthz`, `/remote`, static file serving)
  - `deploy/sysctl-tuning.conf` (Low-latency TCP buffer & socket settings)
- **Target 2: GCP Cloud CDN Hybrid Scale-Out**:
  - `infra/terraform/main.tf` (GCS bucket + Cloud CDN backend)

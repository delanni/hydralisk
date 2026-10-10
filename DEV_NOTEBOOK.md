# Hydralisk — Developer Notebook

> Living project memory. The reference documentation is [DEVELOPER_HANDBOOK.md](./DEVELOPER_HANDBOOK.md).
> Workflow: [.agents/skills/developer-notebook/Skill.md](./.agents/skills/developer-notebook/Skill.md). Entries are dated `YYYY-MM-DD`.

## 1. Executive Summary & Repository Overview

Hydralisk is a performance-oriented fork of Hydra. All app code is hand-edited inside the built `bundle.min.js` (there is no upstream source build), plus a few standalone global scripts and a rollup-built React module. It is deployed straight from `gh-pages` to GitHub Pages. See the handbook, §1–4.

## 2. Changelog & Milestones

- **2026-10-07**: Created `DEVELOPER_HANDBOOK.md` (v0.1) and this notebook. The history before this date is summarised in handbook §9. Both docs live at the repo root and are committed.
- **2026-10-08**: Upgraded Scene Management & Search Component: implemented `SketchSearchFilter` (fuzzy matching, interactive tag cloud pills, search stats), redesigned `CollectionsPanel` into full Setlist Manager (scene reordering, target BPM, cue notes, live stepper, duplicate, export/import JSON), and added `[`/`]` setlist navigation hotkeys.
- **2026-10-08**: Modular Core Extraction: Refactored custom features out of `bundle.min.js` into standalone `HydraliskPlugins` modules (`modules/automutate.js`, `modules/sketchLibrary.js`, `modules/editorActions.js`, `modules/hydraliskExtras.js`), streamlining `bundle.min.js` into a minimal host bundle ready for upstream Hydra updates.
- **2026-10-08**: Fixed mutation code formatting by delegating directly to the native `editor.formatCode()` command in `Mutator.mutate()` ([modules/automutate.js](file:///Users/web/Git/hydralisk/modules/automutate.js)) and [modules/editorActions.js](file:///Users/web/Git/hydralisk/modules/editorActions.js) (ensuring `indent_with_tabs: true` and `break_chained_methods: true` format settings align 1:1 with the code editor layout).
- **2026-10-10**: Implemented Oblivion Guard ([modules/oblivionGuard.js](file:///Users/web/Git/hydralisk/modules/oblivionGuard.js)): Canvas blackout/whiteout auto-recovery engine that monitors WebGL frame pixel buffers on mutations and automatically reverts to the previous functional sketch state if an oblivion crash state is detected.
- **2026-10-10**: Resolved Speed Controls & BPM-sync Automutate issues ([modules/editorActions.js](file:///Users/web/Git/hydralisk/modules/editorActions.js), [modules/automutate.js](file:///Users/web/Git/hydralisk/modules/automutate.js)): Fixed speed `0` freeze bug, preserved direction sign on reverse, and implemented live re-timing of running automutate intervals when BPM or tap-tempo changes occur.
- **2026-10-10**: Configured Netlify Deploys ([`netlify.toml`](file:///Users/web/Git/hydralisk/netlify.toml)): Production deploys from `gh-pages` branch, automated Rollup build preview deploys for PRs and branch builds, custom caching headers, and Node 20 environment settings.
- **2026-10-10**: Completed Touch/Mobile HUD & Remote Performance Overlay on branch [`copilot/add-touch-actions-buttons`](https://github.com/delanni/hydralisk/tree/copilot/add-touch-actions-buttons). Integrated latest `gh-pages` plugins into player, built responsive glassmorphism overlay controls (`Prev`/`Next`/`Random`, `Play`/`Pause`, `BPM ±`, `Speed ±`, `Glitch / Mutate`, `Toggle HUD`), hotkey `T`, and pushed updated branch to remote.
- **2026-10-10**: Fixed Mobile UI & Player View Button Click Interception ([`css/player.css`](file:///Users/web/Git/hydralisk/css/player.css)): Identified root cause where `.toast` notifications had `pointer-events: auto` at `z-index: 100` overlapping sidebar header/tabs (`.collapse-btn` and `Performance` tab) and hidden `.touch-actions-card` had `pointer-events: auto` capturing clicks. Changed `.toast` to `pointer-events: none`, disabled pointer-events on hidden touch overlay card, and added responsive screen width rules for `.sidebar-panel`. Verified across desktop and mobile viewports.
- **2026-10-10**: Automated Mobile Screen Mode & QWERTY Hints Suppression ([`player.js`](file:///Users/web/Git/hydralisk/player.js), [`css/player.css`](file:///Users/web/Git/hydralisk/css/player.css)): Added `isMobileDevice()` detection (`max-width: 768px`, touch capabilities, and Mobile UA). Automatically suppresses the QWERTY keyboard shortcuts guide (`#shortcuts-panel`) on mobile screens and auto-enables the Touch Performance Overlay (`#touch-actions-overlay`) and mobile floating HUD controls. Added window resize listener to dynamically update UI mode. Verified in mobile viewports.
- **2026-10-10**: Replaced Toast Notifications with Intercom Marquee Ticker System ([`player.html`](file:///Users/web/Git/hydralisk/player.html), [`player.js`](file:///Users/web/Git/hydralisk/player.js), [`css/player.css`](file:///Users/web/Git/hydralisk/css/player.css)): Implemented a 28px glassmorphic intercom row fixed at the top screen boundary (`#intercom-bar`, `#intercom-badge`, `#intercom-track`). Added notification queueing (`intercomQueue`) with single-pass right-to-left marquee scroll animation (140px/sec) and status badges (`[HYDRA // SYS]`, `[HYDRA // ERR]`). Maintained 100% backward compatibility with `showToast()` calls across the codebase.
- **2026-10-10**: Refined Cross-Navigation UI ([`modules/sketchLibrary.js`](file:///Users/web/Git/hydralisk/modules/sketchLibrary.js)): Replaced text button with native white FontAwesome toolbar icon (`<i class="fa fa-tv icon" title="Visual Player"></i>`) attached directly inside the editor's top menu toolbar container alongside `fa-play-circle`, `fa-trash`, and `fa-briefcase`. Suppressed Visual Player button injection when on `player.html`. Rebuilt `./modules.dist.js` and verified via browser runtime tests.
- **2026-10-10**: Modularized `player.js` & Configured Unified Rollup Build System ([`rollup.config.js`](file:///Users/web/Git/hydralisk/rollup.config.js), [`src/player/`](file:///Users/web/Git/hydralisk/src/player/)): Modularized the monolithic `player.js` into ES modules under `src/player/` (`state.js`, `intercom.js`, `settingsSync.js`, `engine.js`, `sketchManager.js`, `controls.js`, `automutate.js`, `ui.js`, `hotkeys.js`, `main.js`). Configured Rollup (`rollup -c`) as the single unified builder tool across the repository to bundle both `modules/modules.js` -> `./modules.dist.js` and `src/player/main.js` -> `./player.dist.js`. Updated `player.html` to reference `./player.dist.js` and verified runtime in browser.
- **2026-10-10**: Fixed `CTRL-Shift-H` and `Shift-Ctrl-*` Keyboard Shortcuts ([modules/editorActions.js](file:///Users/web/Git/hydralisk/modules/editorActions.js)): Resolved modifier key prefix sorting bug (`.sort()`) that produced `"Ctrl-Shift-H"` while checks expected `"Shift-Ctrl-H"`, fixed `Shift-Ctrl-F` triggering `fullscreen` instead of `editor:formatCode`, and implemented `matchCombo` helper supporting modifier permutations.

## 3. Architecture & Technical Decisions (ADRs)

- **ADR-001 (2023-08, retroactive): Patch the built bundle.** The upstream source didn't build at fork time. Trade-off: fast iteration, but no source maps or upstream merges, and diffs are hard to review.
- **ADR-002 (2025-05, retroactive): New UI goes in `modules/` (React via global UMD, rollup IIFE)** or standalone scripts, not into the bundle.
- **ADR-003 (retroactive): `xemitter` event bus is the integration point.** It lets keys, toolbar, MIDI, and the Sketch Manager share actions.
- **ADR-004 (retroactive): Static site, no runtime deps.** Remote storage is DynamoDB accessed from the browser.
- **ADR-005 (2026-10-08): Modular Plugin Architecture.** Extract all custom application logic (randomizers, mutator AST transformations, sketch library state, hotkey prevention & shortcut dispatch, speed settings, and custom shader functions) into `modules/` plugins registered with `HydraliskPlugins`.

## 4. Features & Current Capabilities

- [x] Automutate (beat-synced tiers 1/2/4/8/16, manual ms)
- [x] Tap tempo, speed dial, reverse
- [x] Quick save/load, autosave + jump back
- [x] Sketch library: next/prev/random/search, Sketch Manager, collections
- [x] Setlist Manager & Fuzzy Search Component (scene reordering, live stepper, cue notes, BPM, tag cloud)
- [x] Remote drafts (DynamoDB)
- [x] MIDI raw helpers + MIDI-learn mapping
- [x] Convolutions, `modulateHue` combine, `color()`
- [x] Visual Player (`player.html`)
### Roadmap (confirmed by the developer, 2026-10-07; no priority order yet)
- [ ] **Configurable automutate transform-swap %**: a setting and/or a separate MIDI action, instead of the current Cmd-click-only 25%.
- [x] **Oblivion guard**: detect black/white-out and auto jump back.
- [x] **Better scene management**: setlists, ordering, cue notes, fuzzy search, and live stepper navigation.
- [x] **Touch/mobile HUD**: finished branch `copilot/add-touch-actions-buttons` (merged `gh-pages` plugins, targets `player.js` & `player.html`).
- [x] **Mobile UI & Remote Playability Overlay**: fixed mobile performance overlay with live playability controls.
- [ ] **three.js integration** (`three.objects.js` exists but isn't wired in).
- [ ] **player.html as the main performance UI**.
- [ ] **UI cleanup**: replace `prompt`/`alert`/`confirm` and the rudimentary buttons.
- [x] **Rebuild from real Hydra sources**: extracted features to modular plugins (`modules/`) so `bundle.min.js` remains a minimal host.
- [x] **Netlify deploys**: preview deploys from PRs plus production from `gh-pages`.

## 5. Potentials & Future Opportunities

- 2026-10-07: Re-time a running automutate when `bpm` changes, so tap tempo applies live. Could also switch to a beat clock instead of `setInterval`. (Not on the roadmap yet.)
- 2026-10-07: "Oblivion guard" for automutate: detect an all-black/white frame (sample a downscaled canvas) and auto jump back.
- 2026-10-07: Move the three duplicated sketch-loading blocks (nextSketch, loadSketch, search) into one `loadSketch()`.
- 2026-10-07: Share one mutator between the bundle and `player.js`.
- 2026-10-07: Persist autosave history and the quick-save slot (sessionStorage) so they survive a reload.
- 2026-10-07: Lazy-load `three.module.js` (~1.2 MB) and the AWS SDK only when used.
- 2026-10-07: Repo hygiene: archive `sketches_old*.json`, `export0930.json`, `IMG_1611.jpg`, `dancingcat.gif`; delete empty `infra/` and `infrastructure/`.

## 6. Blockers, Gotchas & Known Issues

- 2026-10-08 **[RESOLVED] MIDI handler clobbering:** Refactored `modules/hydrakit.js` and `modules/midi-mapping.js` to use `input.addEventListener('midimessage', ...)` and `midiAccess.onstatechange` for hot-plugging. Both sketch helpers (`cc[]`, `midi()`) and action bindings run concurrently without overwriting each other.
- 2026-10-08 **[RESOLVED] Case-sensitive CSS import:** Fixed `modules/sketchManager/index.jsx` import from `./sketchManager.css` to `./sketchmanager.css`.
- 2026-10-08 **[RESOLVED] Empty Playlist NaN Navigation & Index Mismatch:** Fixed arithmetic bug in `bundle.min.js` where `(0 + 1) % 0` corrupted `sketchIdx` to `NaN` when an empty playlist was active. Added empty list guards in `gallery:nextSketch` and `gallery:randomSketch`, sanitized `sketchIdx` in `gallery:updateLocalSketches`, and properly mapped playlist index in `gallery:loadSketch`.
- 2026-10-07 **Automutate never swaps transforms from keys or MIDI:** `changeTransformChance = 1` unless `evt.metaKey`, and `Math.random() > 1` is never true. Only a Cmd-click on 💩 gives a 25% swap chance.
- 2026-10-10 **[RESOLVED] Automutate live BPM sync:** Added `bpm:change` and `taptempo` event listeners to dynamically re-time active automutate intervals without interrupting execution.
- 2026-10-10 **[RESOLVED] Speed stuck at 0:** Updated `getCurrentSpeedIdx` and `gfx:speedSlower`/`gfx:speedFaster`/`gfx:speedReverse` handlers to step cleanly out of 0 (0 -> 0.01) and preserve direction sign.
- 2026-10-10 **[RESOLVED] `Ctrl-Shift-H` & `Shift-Ctrl-*` hotkey mismatch:** Fixed modifier array sorting (`.sort()`) in `modules/editorActions.js` that converted `Ctrl`+`Shift` to `"Ctrl-Shift-H"` while event listeners looked for `"Shift-Ctrl-H"`. Implemented permutation matching helper `matchCombo` and fixed `Shift-Ctrl-F` action mapping.
- 2026-10-07 **Loading a sketch mutates the source objects:** `delete sketch.metadata.bpm/date/local/index/type`.
- 2026-10-07 `Mutator.glitchRelToInit` calls `glitchNumber()` without `this.`, so it throws a ReferenceError if `initVal` is undefined (rare).
- 2026-10-07 `xxx()` parses the `<anonymous>:L:C` stack format, so it only works in Chrome/V8.
- 2026-10-07 **Security:** AWS keys are entered in the browser and stored in plain text in `localStorage`. There is a full-table `scan`, aws-sdk 2.111 (2017), and the encrypted-credentials path is dead code. The IAM user should be scoped to the single table.
- 2026-10-07 `player.html` loads `hydra-synth` from unpkg **unpinned**, so it may break on an upstream release.
- 2026-10-07 Docs drift: the info panel says autosave is every 10 mutations (the code uses 8), and the `master` README says `CTRL+(1..5)`. The MIDI speed comment says 1 → 8 (it is 3).
- 2026-10-07 `pre-push.cjs` is not installed as a git hook, and `version.js` is stale (2026-02-25).

## 7. Developer Notes, Command Executions & Feedback

- 2026-10-07: `npm start` serves the site. `npm run build` rebuilds `modules.dist.js` after editing `modules/`. To find hack points in the bundle, search for event names or `BOOKMARK` (line numbers drift).
- 2026-10-08: Explicit rule enforced: Never automatically commit or push code to git unless specifically requested by the user. Configured in project rule `.agents/AGENTS.md`.
- 2026-10-08: Modernized `modules/hydrakit.js`: encapsulated WebMIDI state in `MidiEngine` class, replaced `eval()` in `color()` helper, migrated tap tempo handler to `window.addEventListener('keydown')`, and updated all helpers to modern ES module exports.
- 2026-10-08: Delivered Scene Management overhaul & React fuzzy search component. `modules.dist.js` compiled cleanly via Rollup. Key mappings `[` / `]` bound for live setlist stepping.
- 2026-10-08: Refined Setlist Collecting workflow: simplified `CollectionsPanel` (Setlists tab) to Load, Delete, Create actions; added Target Setlist collector dropdown with `+ All` and `- All` buttons plus per-sketch `+`/`-` buttons in `SketchesList`.
- 2026-10-08: Implemented non-blocking `ConfirmModal` component and promise-based `dialogService` (`window.hydraDialog.confirm()` / `prompt()`) replacing native blocking `window.confirm`/`window.prompt` dialogs without pausing WebGL canvas rendering.
- 2026-10-08: Fixed `NaN` empty playlist navigation bug and playlist index mapping in `bundle.min.js`. Next/prev navigation now safely guards empty setlists and recovers instantly when switching setlists.
- 2026-10-10: Added `OblivionGuard` module ([modules/oblivionGuard.js](file:///Users/web/Git/hydralisk/modules/oblivionGuard.js)) with WebGL `readPixels` sampling, 2D OffscreenCanvas fallback, consecutive revert rate limiting, and non-intrusive toast feedback UI. Verified via unit test suite.
- 2026-10-10: Fixed speed control edge cases (`speed=0` freeze, direction preservation) and implemented live beat re-timing for running automutate intervals in [`modules/editorActions.js`](file:///Users/web/Git/hydralisk/modules/editorActions.js) and [`modules/automutate.js`](file:///Users/web/Git/hydralisk/modules/automutate.js). Verified via unit test suite.
- 2026-10-10: Finished branch [`copilot/add-touch-actions-buttons`](https://github.com/delanni/hydralisk/tree/copilot/add-touch-actions-buttons) for Touch HUD & Mobile Performance Overlay: resolved merge conflicts with `gh-pages` plugins, added glassmorphism touch card controls, `T` shortcut, `triggerMutation()` event integration, and pushed updated branch to remote.
- 2026-10-10: Developer preference recorded: When tasked with working on a specific branch, switch directly to that branch and stay on it for execution instead of switching back and forth, preventing merge conflict markers. Rule updated in `.agents/AGENTS.md`.





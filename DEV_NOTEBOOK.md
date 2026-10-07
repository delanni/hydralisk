# Hydralisk — Developer Notebook

> Living project memory. The reference documentation is [DEVELOPER_HANDBOOK.md](./DEVELOPER_HANDBOOK.md).
> Workflow: [.agents/skills/developer-notebook/Skill.md](./.agents/skills/developer-notebook/Skill.md). Entries are dated `YYYY-MM-DD`.

## 1. Executive Summary & Repository Overview

Hydralisk is a performance-oriented fork of Hydra. All app code is hand-edited inside the built `bundle.min.js` (there is no upstream source build), plus a few standalone global scripts and a rollup-built React module. It is deployed straight from `gh-pages` to GitHub Pages. See the handbook, §1–4.

## 2. Changelog & Milestones

- **2026-10-07**: Created `DEVELOPER_HANDBOOK.md` (v0.1) and this notebook. The history before this date is summarised in handbook §9. Both docs live at the repo root and are committed.
- **2026-10-08**: Upgraded Scene Management & Search Component: implemented `SketchSearchFilter` (fuzzy matching, interactive tag cloud pills, search stats), redesigned `CollectionsPanel` into full Setlist Manager (scene reordering, target BPM, cue notes, live stepper, duplicate, export/import JSON), and added `[`/`]` setlist navigation hotkeys.

## 3. Architecture & Technical Decisions (ADRs)

- **ADR-001 (2023-08, retroactive): Patch the built bundle.** The upstream source didn't build at fork time. Trade-off: fast iteration, but no source maps or upstream merges, and diffs are hard to review.
- **ADR-002 (2025-05, retroactive): New UI goes in `modules/` (React via global UMD, rollup IIFE)** or standalone scripts, not into the bundle.
- **ADR-003 (retroactive): `xemitter` event bus is the integration point.** It lets keys, toolbar, MIDI, and the Sketch Manager share actions.
- **ADR-004 (retroactive): Static site, no runtime deps.** Remote storage is DynamoDB accessed from the browser.

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
- [ ] **Oblivion guard**: detect black/white-out and auto jump back.
- [x] **Better scene management**: setlists, ordering, cue notes, fuzzy search, and live stepper navigation.
- [ ] **Touch/mobile HUD**: finish branch `copilot/add-touch-actions-buttons` (unmerged, based on `master`, targets `player.js`).
- [ ] **Mobile UI & Remote Playability Overlay**: a proper, fixed mobile interface with a dedicated performance/playability overlay. Designed to function both locally and remotely on secondary devices (message relaying protocol to be implemented later).
- [ ] **three.js integration** (`three.objects.js` exists but isn't wired in).
- [ ] **player.html as the main performance UI**.
- [ ] **UI cleanup**: replace `prompt`/`alert`/`confirm` and the rudimentary buttons.
- [ ] **Rebuild from real Hydra sources** to get away from the hacked bundle.
- [ ] **Netlify deploys**: preview deploys from PRs plus production from `gh-pages`.

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
- 2026-10-07 **Automutate interval is fixed at start.** Tap tempo during a run has no effect until it is re-triggered. (Although in practise, the beatsynced automation is used mostly, the time doesn't really matter.)
- 2026-10-07 **Speed stuck at 0:** `Math.sign(0) = 0`, so slower/faster can't leave 0 (the MIDI speed bind can set 0). Also `getCurrentSpeedIdx` checks `undefined`, but `findIndex` returns `-1`.
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





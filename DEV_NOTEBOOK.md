# Hydralisk — Developer Notebook

> Living project memory. The reference documentation is [DEVELOPER_HANDBOOK.md](./DEVELOPER_HANDBOOK.md).
> Workflow: [.agents/skills/developer-notebook/Skill.md](./.agents/skills/developer-notebook/Skill.md). Entries are dated `YYYY-MM-DD`.

## 1. Executive Summary & Repository Overview

Hydralisk is a performance-oriented fork of Hydra. All app code is hand-edited inside the built `bundle.min.js` (there is no upstream source build), plus a few standalone global scripts and a rollup-built React module. It is deployed straight from `gh-pages` to GitHub Pages. See the handbook, §1–4.

## 2. Changelog & Milestones

- **2026-10-07**: Created `DEVELOPER_HANDBOOK.md` (v0.1) and this notebook. The history before this date is summarised in handbook §9. Both docs live at the repo root and are committed.

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
- [x] Remote drafts (DynamoDB)
- [x] MIDI raw helpers + MIDI-learn mapping
- [x] Convolutions, `modulateHue` combine, `color()`
- [x] Visual Player (`player.html`)
### Roadmap (confirmed by the developer, 2026-10-07; no priority order yet)
- [ ] **Configurable automutate transform-swap %**: a setting and/or a separate MIDI action, instead of the current Cmd-click-only 25%.
- [ ] **Oblivion guard**: detect black/white-out and auto jump back.
- [ ] **Better scene management**: setlists, ordering, crossfades between sketches.
- [ ] **Touch/mobile HUD**: finish branch `copilot/add-touch-actions-buttons` (unmerged, based on `master`, targets `player.js`).
- [ ] **Mobile UI & Remote Playability Overlay**: a proper, fixed mobile interface with a dedicated performance/playability overlay. Designed to function both locally and remotely on secondary devices (message relaying protocol to be implemented later).
- [ ] **three.js integration** (`three.objects.js` exists but isn't wired in).
- [ ] **player.html as the main performance UI**.
- [ ] **UI cleanup & proper browser inputs**: replace raw `prompt()`, `alert()`, `confirm()`, and arbitrary text boxes (such as `gallery:import`'s `<textarea>`) with proper HTML browser controls (`<input type="file">` for opening local files/volumes, `<input type="range">` / `<input type="number">` for volume, tempo, and speed).
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

- 2026-10-07 **MIDI handler clobbering:** `hydrakit.js` and `midi-mapping.js` both set `input.onmidimessage`, and whichever `requestMIDIAccess` resolves last wins. Likely midi-mapping wins, which leaves `cc[]`, `ccc`, `ccbind`, and `midi(n)` / `midi('bN')` stale. Neither layer re-attaches on hot-plug. *Fix:* use `addEventListener('midimessage')`, or have one dispatcher feed both layers. The developer now mostly uses the mapping plus `midi('A'..'D')`, so this has not been confirmed in practice. Older sketches using `cc[n]` or `midi(n)` may be silently affected.
- 2026-10-07 **Automutate never swaps transforms from keys or MIDI:** `changeTransformChance = 1` unless `evt.metaKey`, and `Math.random() > 1` is never true. Only a Cmd-click on 💩 gives a 25% swap chance.
- 2026-10-07 **Automutate interval is fixed at start.** Tap tempo during a run has no effect until it is re-triggered. (Although in practise, the beatsynced automation is used mostly, the time doesn't really matter.)
- 2026-10-07 **Speed stuck at 0:** `Math.sign(0) = 0`, so slower/faster can't leave 0 (the MIDI speed bind can set 0). Also `getCurrentSpeedIdx` checks `undefined`, but `findIndex` returns `-1`.
- 2026-10-07 **Index mismatch:** `loadSketch` and search set `sketchIdx = sketch.index` (position in `sketches.json`), not the position in the current `mySketches` playlist. With a collection or filter active, next/prev then jumps to the wrong place.
- 2026-10-07 **Loading a sketch mutates the source objects:** `delete sketch.metadata.bpm/date/local/index/type`.
- 2026-10-07 `Mutator.glitchRelToInit` calls `glitchNumber()` without `this.`, so it throws a ReferenceError if `initVal` is undefined (rare).
- 2026-10-07 `modules/sketchManager/index.jsx` imports `./sketchManager.css`, but the file is `sketchmanager.css`. This breaks builds on case-sensitive filesystems (Linux CI).
- 2026-10-07 `xxx()` parses the `<anonymous>:L:C` stack format, so it only works in Chrome/V8.
- 2026-10-07 **Security:** AWS keys are entered in the browser and stored in plain text in `localStorage`. There is a full-table `scan`, aws-sdk 2.111 (2017), and the encrypted-credentials path is dead code. The IAM user should be scoped to the single table.
- 2026-10-07 `player.html` loads `hydra-synth` from unpkg **unpinned**, so it may break on an upstream release.
- 2026-10-07 Docs drift: the info panel says autosave is every 10 mutations (the code uses 8), and the `master` README says `CTRL+(1..5)`. The MIDI speed comment says 1 → 8 (it is 3).
- 2026-10-07 `pre-push.cjs` is not installed as a git hook, and `version.js` is stale (2026-02-25).

## 7. Developer Notes, Command Executions & Feedback

- 2026-10-07: `npm start` serves the site. `npm run build` rebuilds `modules.dist.js` after editing `modules/`. To find hack points in the bundle, search for event names or `BOOKMARK` (line numbers drift).

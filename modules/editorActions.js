/**
 * Editor Actions & Shortcuts Plugin for Hydralisk
 * Formatter, line comment/duplicate, clearAll, canvas screencap, fullscreen, UI hide,
 * global speed controls, and global keyboard shortcut binding & prevention.
 */

import jsBeautify from "js-beautify";
const js_beautify = jsBeautify.js_beautify || jsBeautify;

export const SPEED_SETTINGS = [
  0.01, 0.05, 0.1, 0.125, 0.25, 0.3333333333333333, 0.5, 1, 2, 3, 4, 8, 10, 20, 100,
];

export function getCurrentSpeedIdx(currentSpeed) {
  const n = Math.abs(currentSpeed);
  if (n === 0) return -1;
  let spdIndex = SPEED_SETTINGS.findIndex(
    (_v, i, a) => n === a[i] || (a[i] < n && (a[i + 1] === undefined || a[i + 1] > n))
  );
  return spdIndex;
}

if (typeof window !== "undefined" && window.HydraliskPlugins) {
  window.HydraliskPlugins.register({
    id: "editor-actions",
    name: "Editor Actions & Shortcuts",

    init(app) {
      const getEditor = () => {
        return (app.state && app.state.editor && app.state.editor.editor) || window.cm || null;
      };

      const evalCode = (code, cb) => {
        const editor = getEditor();
        if (window.evalCode) {
          window.evalCode(code, cb);
        } else if (editor && typeof editor.eval === "function") {
          editor.eval(code, cb);
        }
      };

      // Format Code
      app.on("editor:formatCode", () => {
        const editor = getEditor();
        if (!editor) return;

        if (typeof editor.formatCode === "function") {
          editor.formatCode();
        } else {
          const code = editor.getValue ? editor.getValue() : "";
          if (!code) return;

          const formatted = js_beautify(code, {
            indent_size: 2,
            indent_with_tabs: true,
            break_chained_methods: true,
            space_in_empty_paren: true,
          });

          if (typeof editor.setValue === "function") {
            editor.setValue(formatted);
          }
        }
      });

      // Comment Line
      app.on("editor:commentLine", () => {
        const editor = getEditor();
        if (!editor || !editor.cm) return;
        const cm = editor.cm;
        const cursor = cm.getCursor();
        const lines = cm.getValue().split("\n");
        if (cursor.line >= lines.length) return;

        const line = lines[cursor.line];
        if (line.trim().startsWith("//")) {
          lines[cursor.line] = line.replace("//", "");
        } else if (line.startsWith("  ")) {
          lines[cursor.line] = line.replace("  ", "//");
        } else {
          lines[cursor.line] = `// ${line}`;
        }

        const newContent = lines.join("\n");
        cm.setValue(newContent);
        evalCode(newContent);
        cm.setCursor(cursor);
      });

      // Duplicate Line
      app.on("editor:duplicateLine", () => {
        const editor = getEditor();
        if (!editor || !editor.cm) return;
        const cm = editor.cm;
        const cursor = cm.getCursor();
        const lines = cm.getValue().split("\n");
        if (cursor.line >= lines.length) return;

        const line = lines[cursor.line];
        lines.splice(cursor.line + 1, 0, line);
        cm.setValue(lines.join("\n"));
        cm.setCursor({ line: cursor.line + 1, ch: cursor.ch });
      });

      // Clear All
      app.on("editor:clearAll", (ev = {}) => {
        const editor = getEditor();
        if (ev.altKey || ev.shiftKey || ev.ctrlKey) {
          const shouldDelete = confirm("Do you really want to delete this sketch locally?");
          if (!shouldDelete) return;

          if (editor) {
            const sketchName = editor
              .getValue()
              .split("\n")[0]
              .replace("/*", "")
              .replace("*/", "")
              .trim();
            const mySketches = app.context?.mySketches || window.mySketches || [];
            const idx = mySketches.findIndex((e) => e.name === sketchName);
            if (idx >= 0) {
              mySketches.splice(idx, 1);
              localStorage.setItem("mySketches", JSON.stringify(mySketches));
              app.emit("gallery:updateLocalSketches", mySketches);
            }
          }
        } else {
          if (typeof window.hush === "function") window.hush();
          window.speed = 1;
          if (editor) {
            if (typeof editor.clear === "function") editor.clear();
            else if (typeof editor.setValue === "function") editor.setValue("");
          }
        }
      });

      // Screencap
      app.on("screencap", () => {
        if (typeof window.screencap === "function") {
          window.screencap();
        }
        const editor = getEditor();
        const text = editor ? editor.getValue() : "";
        const blob = new Blob([text], { type: "text/plain" });
        const a = document.createElement("a");
        a.style.display = "none";
        const d = new Date();
        a.download = `hydra-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${d.getHours()}.${d.getMinutes()}.${d.getSeconds()}.js`;
        a.href = URL.createObjectURL(blob);
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 300);
      });

      // Fullscreen
      app.on("fullscreen", () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      });

      // Hide All UI: synchronize CodeMirror element styling with state.showUI without double-mutating state
      app.on("hideAll", () => {
        const cmEl = document.querySelector(".CodeMirror");
        if (cmEl) {
          const isHidden = (app.state && typeof app.state.showUI === "boolean")
            ? !app.state.showUI
            : (cmEl.style.opacity === "1" || cmEl.style.opacity === "");
          cmEl.style.opacity = isHidden ? "0" : "1";
          cmEl.style.pointerEvents = isHidden ? "none" : "all";
        }
      });

      // Speed Controls
      app.on("gfx:speedSlower", () => {
        const cur = window.speed ?? 1;
        const absCur = Math.abs(cur);
        const sign = cur === 0 ? (window._speedSign || 1) : Math.sign(cur);

        if (absCur <= 0.01) {
          window.speed = 0;
        } else {
          const spdIndex = getCurrentSpeedIdx(absCur);
          const nextIdx = spdIndex <= 0 ? 0 : spdIndex - 1;
          window.speed = SPEED_SETTINGS[nextIdx] * sign;
        }
        console.log(`Speed is ${window.speed}`);
      });

      app.on("gfx:speedDefault", () => {
        window.speed = 1;
        window._speedSign = 1;
        console.log(`Speed is ${window.speed}`);
      });

      app.on("gfx:speedFaster", () => {
        const cur = window.speed ?? 1;
        const absCur = Math.abs(cur);
        const sign = cur === 0 ? (window._speedSign || 1) : Math.sign(cur);

        if (cur === 0) {
          window.speed = SPEED_SETTINGS[0] * sign;
        } else {
          const spdIndex = getCurrentSpeedIdx(absCur);
          const nextIdx = spdIndex < 0 ? 0 : Math.min(SPEED_SETTINGS.length - 1, spdIndex + 1);
          window.speed = SPEED_SETTINGS[nextIdx] * sign;
        }
        console.log(`Speed is ${window.speed}`);
      });

      app.on("gfx:speedReverse", () => {
        const cur = window.speed ?? 1;
        if (cur === 0) {
          window._speedSign = (window._speedSign || 1) * -1;
        } else {
          window._speedSign = Math.sign(cur) * -1;
          window.speed = -1 * cur;
        }
        console.log(`Speed is ${window.speed}`);
      });

      // Global Keydown Listener
      // Combos are normalized (modifier order-independent) and matched on the PHYSICAL key
      // (evt.code), because with Option/Shift held macOS reports altered characters in evt.key
      // (e.g. Option-Shift-H => "Ó", Shift-[ => "{", Shift-8 => "*").
      const MOD_ORDER = ["Cmd", "Ctrl", "Alt", "Shift"];
      const MOD_ALIASES = { Meta: "Cmd", Command: "Cmd", Control: "Ctrl", Option: "Alt", Opt: "Alt" };

      const normalizeCombo = (combo) => {
        // Split on "-" but keep a trailing "-" key intact (e.g. "Cmd--").
        const parts = combo.split(/-(?!$)/);
        const key = parts.pop().toUpperCase();
        const mods = parts
          .map((m) => MOD_ALIASES[m] || m)
          .sort((a, b) => MOD_ORDER.indexOf(a) - MOD_ORDER.indexOf(b));
        return [...mods, key].join("-");
      };

      const CODE_KEYS = {
        BracketLeft: "[",
        BracketRight: "]",
        Backslash: "\\",
        Slash: "/",
        Minus: "-",
        Equal: "=",
        Comma: ",",
        Period: ".",
        Semicolon: ";",
        Quote: "'",
        Backquote: "`",
        Enter: "ENTER",
        Space: "SPACE",
      };

      const keyFromEvent = (evt) => {
        const code = evt.code || "";
        if (/^Key[A-Z]$/.test(code)) return code.slice(3);
        if (/^Digit[0-9]$/.test(code)) return code.slice(5);
        if (CODE_KEYS[code]) return CODE_KEYS[code];
        return (evt.key || "").toUpperCase();
      };

      const comboFromEvent = (evt) => {
        const mods = [
          evt.metaKey && "Cmd",
          evt.ctrlKey && "Ctrl",
          evt.altKey && "Alt",
          evt.shiftKey && "Shift",
        ].filter(Boolean);
        return [...mods, keyFromEvent(evt)].join("-");
      };

      // combo => [eventName, payloadFactory?]
      const SHORTCUTS = {
        "Cmd-S": ["editor:quickSave"],
        "Cmd-L": ["editor:quickLoad"],
        "Cmd-]": ["gallery:nextSketch", (evt) => evt],
        "Cmd-\\": ["gallery:prevSketch", (evt) => evt],
        "Cmd-[": ["editor:jumpBack1", (evt) => evt],
        "Cmd-Shift-[": ["editor:jumpBack5", (evt) => evt],
        "Cmd-O": ["gallery:toggleSketchManager"],
        "Shift-Ctrl-F": ["editor:formatCode"],
        "Shift-Ctrl-G": ["fullscreen"],
        "Shift-Ctrl-H": ["hideAll"],
        "Alt-Shift-H": ["hideAll"],
        "Cmd-H": ["hideAll"],
        // Full combo strings are passed: automutate parses the mode via /-(.)$/.
        "Shift-Ctrl-X": ["editor:toggleAutomutate", () => ({ lastCombo: "Shift-Ctrl-X" })],
        "Shift-Ctrl-0": ["editor:toggleAutomutate", () => ({ lastCombo: "Shift-Ctrl-0" })],
        "Shift-Ctrl-1": ["editor:toggleAutomutate", () => ({ lastCombo: "Shift-Ctrl-1" })],
        "Shift-Ctrl-2": ["editor:toggleAutomutate", () => ({ lastCombo: "Shift-Ctrl-2" })],
        "Shift-Ctrl-3": ["editor:toggleAutomutate", () => ({ lastCombo: "Shift-Ctrl-3" })],
        "Shift-Ctrl-4": ["editor:toggleAutomutate", () => ({ lastCombo: "Shift-Ctrl-4" })],
        "Shift-Ctrl-5": ["editor:toggleAutomutate", () => ({ lastCombo: "Shift-Ctrl-5" })],
        "Shift-Ctrl-7": ["gfx:speedSlower"],
        "Shift-Ctrl-8": ["gfx:speedDefault"],
        "Shift-Ctrl-9": ["gfx:speedFaster"],
        "Shift-Cmd-8": ["gfx:speedReverse"],
        "Cmd-D": ["editor:duplicateLine"],
        "Cmd-M": ["masterEffects:toggle"],
        "Shift-Ctrl-M": ["masterEffects:toggle"],
        "Cmd-I": ["impromptu:trigger"],
        "Shift-Ctrl-I": ["impromptu:toggleModal"],
        "Shift-Ctrl-K": ["editor:commentLine"],
        "Shift-Ctrl-C": ["gallery:search"],
        "Shift-Ctrl-S": ["screencap"],
        "Shift-Ctrl-L": ["gallery:saveToURL"],
      };

      const SHORTCUT_MAP = new Map(
        Object.entries(SHORTCUTS).map(([combo, action]) => [normalizeCombo(combo), action])
      );

      // Browser/OS defaults to swallow even though they have no app action.
      const PREVENT_SET = new Set(
        ["Cmd-Q", "Cmd-P", "Cmd-W", "Cmd-T", "Cmd-N", "Cmd-A"].map(normalizeCombo)
      );

      // Capture phase on document: runs BEFORE CodeMirror's own keydown handler (which still has
      // the same combos in its extraKeys map in bundle.min.js). Stopping propagation here makes this
      // listener the single dispatcher, so each press emits exactly once.
      document.addEventListener(
        "keydown",
        (evt) => {
          if (!evt.key && !evt.code) return;

          const isOptionSpace = evt.altKey && (evt.code === "Space" || evt.key === " " || evt.key === "Spacebar");
          if (isOptionSpace) {
            evt.preventDefault();
            evt.stopPropagation();
            if (!evt.repeat) app.emit("taptempo");
            return;
          }

          const combo = normalizeCombo(comboFromEvent(evt));
          const action = SHORTCUT_MAP.get(combo);

          if (!action) {
            if (PREVENT_SET.has(combo)) evt.preventDefault();
            return;
          }

          evt.preventDefault();
          evt.stopPropagation();

          // Holding a combo produces auto-repeat keydowns: trigger once per physical press.
          if (evt.repeat) return;

          const [eventName, payload] = action;
          if (payload) app.emit(eventName, payload(evt));
          else app.emit(eventName);
        },
        true
      );
    },
  });
}


/**
 * Editor Actions & Shortcuts Plugin for Hydralisk
 * Formatter, line comment/duplicate, clearAll, canvas screencap, fullscreen, UI hide,
 * global speed controls, and global keyboard shortcut binding & prevention.
 */

import { js_beautify } from "js-beautify";

export const SPEED_SETTINGS = [
  0.01, 0.05, 0.1, 0.125, 0.25, 0.3333333333333333, 0.5, 1, 2, 3, 4, 8, 10, 20, 100,
];

export function getCurrentSpeedIdx(currentSpeed) {
  const n = Math.abs(currentSpeed);
  let spdIndex = SPEED_SETTINGS.findIndex(
    (_v, i, a) => n === a[i] || (a[i] < n && a[i + 1] > n)
  );
  if (spdIndex === -1 || typeof spdIndex === "undefined") {
    spdIndex = SPEED_SETTINGS.indexOf(1);
  }
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

      // Hide All UI
      app.on("hideAll", () => {
        if (app.state) {
          app.state.showUI = !app.state.showUI;
        }
        const cmEl = document.querySelector(".CodeMirror");
        if (cmEl) {
          cmEl.style.opacity = app.state && app.state.showUI === false ? "0" : "1";
          cmEl.style.pointerEvents = app.state && app.state.showUI === false ? "none" : "all";
        }
      });

      // Speed Controls
      app.on("gfx:speedSlower", () => {
        const cur = window.speed ?? 1;
        const spdIndex = getCurrentSpeedIdx(cur);
        const sign = Math.sign(cur) || 1;
        window.speed = SPEED_SETTINGS[Math.max(0, spdIndex - 1)] * sign;
        console.log(`Speed is ${window.speed}`);
      });

      app.on("gfx:speedDefault", () => {
        window.speed = 1;
        console.log(`Speed is ${window.speed}`);
      });

      app.on("gfx:speedFaster", () => {
        const cur = window.speed ?? 1;
        const spdIndex = getCurrentSpeedIdx(cur);
        const sign = Math.sign(cur) || 1;
        window.speed = SPEED_SETTINGS[Math.min(SPEED_SETTINGS.length - 1, spdIndex + 1)] * sign;
        console.log(`Speed is ${window.speed}`);
      });

      app.on("gfx:speedReverse", () => {
        window.speed = -1 * (window.speed || 1);
        console.log(`Speed is ${window.speed}`);
      });

      // Global Keydown Listener & Prevention List
      const PREVENT_LIST = [
        "Cmd-H",
        "Cmd-Q",
        "Cmd-[",
        "Cmd-O",
        "Cmd-P",
        "Cmd-S",
        "Cmd-W",
        "Cmd-T",
        "Cmd-N",
        "Cmd-M",
        "Cmd-A",
      ];

      document.addEventListener("keydown", (evt) => {
        if (!evt.key) return;

        const isOptionSpace = evt.altKey && (evt.code === "Space" || evt.key === " " || evt.key === "Spacebar");
        if (isOptionSpace) {
          evt.preventDefault();
          evt.stopPropagation();
          app.emit("taptempo");
          return;
        }

        const prefixes = [
          evt.metaKey && "Cmd",
          evt.ctrlKey && "Ctrl",
          evt.altKey && "Alt",
          evt.shiftKey && "Shift",
        ]
          .filter(Boolean)
          .sort();

        const prefix = prefixes.join("-");
        const key = evt.key.toUpperCase();
        const combo = prefix ? `${prefix}-${key}` : key;

        if (PREVENT_LIST.includes(combo)) {
          evt.preventDefault();
          evt.stopPropagation();
        }

        // Custom keyboard shortcuts map
        if (combo === "Cmd-S") {
          app.emit("editor:quickSave");
        } else if (combo === "Cmd-L") {
          app.emit("editor:quickLoad");
        } else if (combo === "Cmd-]") {
          app.emit("gallery:nextSketch", evt);
        } else if (combo === "Cmd-\\") {
          app.emit("gallery:prevSketch", evt);
        } else if (combo === "Cmd-[") {
          app.emit("editor:jumpBack1", evt);
        } else if (combo === "Cmd-Shift-[") {
          app.emit("editor:jumpBack5", evt);
        } else if (combo === "Cmd-O") {
          app.emit("gallery:toggleSketchManager");
        } else if (combo === "Shift-Ctrl-F" || combo === "Shift-Ctrl-G") {
          app.emit("fullscreen");
        } else if (combo === "Shift-Ctrl-H" || combo === "Cmd-H") {
          app.emit("hideAll");
        } else if (combo === "Shift-Ctrl-X") {
          app.emit("editor:toggleAutomutate", { lastCombo: combo });
        } else if (combo === "Shift-Ctrl-0") {
          app.emit("editor:toggleAutomutate", { lastCombo: "0" });
        } else if (combo === "Shift-Ctrl-1") {
          app.emit("editor:toggleAutomutate", { lastCombo: "1" });
        } else if (combo === "Shift-Ctrl-2") {
          app.emit("editor:toggleAutomutate", { lastCombo: "2" });
        } else if (combo === "Shift-Ctrl-3") {
          app.emit("editor:toggleAutomutate", { lastCombo: "3" });
        } else if (combo === "Shift-Ctrl-4") {
          app.emit("editor:toggleAutomutate", { lastCombo: "4" });
        } else if (combo === "Shift-Ctrl-5") {
          app.emit("editor:toggleAutomutate", { lastCombo: "5" });
        } else if (combo === "Shift-Ctrl-7") {
          app.emit("gfx:speedSlower");
        } else if (combo === "Shift-Ctrl-8") {
          app.emit("gfx:speedDefault");
        } else if (combo === "Shift-Ctrl-9") {
          app.emit("gfx:speedFaster");
        } else if (combo === "Shift-Cmd-8") {
          app.emit("gfx:speedReverse");
        } else if (combo === "Cmd-D") {
          app.emit("editor:duplicateLine");
        } else if (combo === "Shift-Ctrl-K") {
          app.emit("editor:commentLine");
        }
      });
    },
  });
}

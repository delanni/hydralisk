/**
 * Sketch Library & Storage Plugin for Hydralisk
 * Manages local/remote sketches, playlist navigation, loading, saving,
 * import/export, deduplication, and sketch autocompleter.
 */

export { sGet, sPut, deduplicateBy, parseCode, formatSketchCode, loadSketch } from "./sketchLoader.js";
import {
  sGet,
  sPut,
  deduplicateBy,
  parseCode,
  loadSketch,
  getNextIndex,
  getRandomIndex,
} from "./sketchLoader.js";

if (typeof window !== "undefined" && window.HydraliskPlugins) {
  window.HydraliskPlugins.register({
    id: "sketch-library",
    name: "Sketch Library & Gallery Storage",

    init(app) {
      let mySketches = [];
      let localSketches = [];
      let downloadedSketches = [];

      let rawSketchIdx = Number(sGet("sketchIdx"));
      let sketchIdx = !isNaN(rawSketchIdx) && rawSketchIdx >= 0 ? rawSketchIdx : 0;

      app.expose("mySketches", mySketches);
      app.expose("sketchIdx", sketchIdx);

      app.loadSketch = (target, opts) =>
        loadSketch(app, target, { sketches: mySketches, currentIndex: sketchIdx, ...opts });
      app.expose("loadSketch", app.loadSketch);

      app.on("gallery:sketchLoaded", ({ index }) => {
        sketchIdx = index;
      });

      const getEditor = () => {
        return (app.state && app.state.editor && app.state.editor.editor) || window.cm || null;
      };

      const evalCode = (code, cb, options) => {
        const editor = getEditor();
        if (window.evalCode) {
          window.evalCode(code, cb, options);
        } else if (editor && typeof editor.eval === "function") {
          editor.eval(code, cb);
        }
      };

      const setEditorText = (code) => {
        const editor = getEditor();
        if (editor && typeof editor.setValue === "function") {
          editor.setValue(code);
        }
      };

      // Load initial local sketches
      try {
        localSketches = JSON.parse(localStorage.getItem("mySketches") || "[]").map((e) => ({
          ...e,
          local: true,
        }));
        mySketches = localSketches.slice();
        app.expose("mySketches", mySketches);
      } catch (e) {
        console.error("[sketchLibrary] Failed to load local sketches:", e);
      }

      let initialSketchLoaded = false;

      const initStartupSketch = () => {
        if (initialSketchLoaded) return;
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has("code")) {
          if (!getEditor()) return;
          initialSketchLoaded = true;
          try {
            const code = decodeURIComponent(atob(urlParams.get("code")));
            setEditorText(code);
            evalCode(code, undefined, { initial: true });
          } catch (e) {
            console.error("[sketchLibrary] Failed to load shared code:", e);
          }
          return;
        }
        if (!mySketches || mySketches.length === 0) return;

        // Check if explicit query param ?sketch=Name was passed
        try {
          const targetName = urlParams.get("sketch");
          if (targetName) {
            const foundIdx = mySketches.findIndex(
              (s) => s.name && s.name.toLowerCase() === targetName.toLowerCase()
            );
            if (foundIdx >= 0) {
              initialSketchLoaded = true;
              loadSketch(app, foundIdx, { sketches: mySketches, currentIndex: foundIdx });
              return;
            }
          }
        } catch (e) {}

        // Otherwise load a random sketch and set sketchIdx to that random sketch's number
        const randomIdx = Math.floor(Math.random() * mySketches.length);
        initialSketchLoaded = true;
        loadSketch(app, randomIdx, { sketches: mySketches, currentIndex: randomIdx });
      };

      app.initStartupSketch = initStartupSketch;
      app.expose("initStartupSketch", initStartupSketch);

      if (localSketches.length === 0) {
        setTimeout(() => app.emit("gallery:import-remote"), 100);
      }
      setTimeout(() => initStartupSketch(), 150);
      setTimeout(() => initStartupSketch(), 600);

      const getActiveIndex = () => {
        if (typeof sketchIdx === "number" && !isNaN(sketchIdx)) return sketchIdx;
        const fromApp = Number(app?.sketchIdx);
        if (!isNaN(fromApp)) return fromApp;
        const fromWin = typeof window !== "undefined" ? Number(window.sketchIdx) : NaN;
        if (!isNaN(fromWin)) return fromWin;
        return 0;
      };

      // Next / Prev / Random Sketch consolidated handlers
      app.on("gallery:prevSketch", () => {
        if (!mySketches || mySketches.length === 0) return;
        const currentIdx = getActiveIndex();
        const newIdx = getNextIndex(currentIdx, mySketches.length, true);
        loadSketch(app, newIdx, { sketches: mySketches, currentIndex: currentIdx });
      });

      app.on("gallery:nextSketch", (e = {}) => {
        if (!mySketches || mySketches.length === 0) return;
        const isBackwards = Boolean(e.altKey || e.shiftKey || e.backwards);
        const currentIdx = getActiveIndex();
        const newIdx = getNextIndex(currentIdx, mySketches.length, isBackwards);
        loadSketch(app, newIdx, { sketches: mySketches, currentIndex: currentIdx });
      });

      app.on("gallery:randomSketch", () => {
        if (!mySketches || mySketches.length === 0) return;
        const currentIdx = getActiveIndex();
        const newIdx = getRandomIndex(currentIdx, mySketches.length);
        loadSketch(app, newIdx, { sketches: mySketches, currentIndex: currentIdx });
      });

      // Cross-navigation helper to launch player with active sketch
      const openPlayerWithCurrentSketch = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        let sketchName = "";
        if (Array.isArray(mySketches) && typeof sketchIdx === "number" && mySketches[sketchIdx]) {
          sketchName = mySketches[sketchIdx].name;
        }
        if (!sketchName) {
          try { sketchName = localStorage.getItem("lastSelectedSketchName") || ""; } catch (err) {}
        }
        const targetUrl = sketchName ? `player.html?sketch=${encodeURIComponent(sketchName)}` : "player.html";
        window.location.href = targetUrl;
      };
      window.openPlayerWithCurrentSketch = openPlayerWithCurrentSketch;
      app.expose("openPlayerWithCurrentSketch", openPlayerWithCurrentSketch);

      // Inject white toolbar icon "Visual Player" in editor DOM (suppressed on player page)
      if (typeof document !== "undefined") {
        const isPlayerPage = Boolean(
          window.location.pathname.endsWith("player.html") ||
          window.location.pathname.endsWith("/player") ||
          document.getElementById("hydra-player-dashboard")
        );

        if (!isPlayerPage) {
          const injectNavIcon = () => {
            // Remove old text button if present
            const oldBtn = document.getElementById("nav-to-player-btn");
            if (oldBtn) oldBtn.remove();

            let navIcon = document.getElementById("nav-to-player-icon");
            if (!navIcon) {
              navIcon = document.createElement("i");
              navIcon.id = "nav-to-player-icon";
              navIcon.className = "fa fa-tv icon";
              navIcon.title = "Visual Player";
              navIcon.onclick = (evt) => openPlayerWithCurrentSketch(evt);

              // Attach to editor toolbar container alongside other white menu icons
              const existingIcon = document.querySelector("i.icon");
              if (existingIcon && existingIcon.parentNode) {
                existingIcon.parentNode.appendChild(navIcon);
              } else {
                navIcon.style.cssText = "position: fixed; top: 12px; right: 20px; z-index: 99999; color: #fff; cursor: pointer; font-size: 20px;";
                (document.body || document.documentElement).appendChild(navIcon);
              }
            }
          };

          if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", injectNavIcon);
          } else {
            injectNavIcon();
          }
          setTimeout(injectNavIcon, 300);
          setTimeout(injectNavIcon, 1000);
          setTimeout(injectNavIcon, 2500);
        } else {
          // If on player page, ensure any old button/icon is removed
          const oldBtn = document.getElementById("nav-to-player-btn");
          if (oldBtn) oldBtn.remove();
          const oldIcon = document.getElementById("nav-to-player-icon");
          if (oldIcon) oldIcon.remove();
        }
      }

      app.on("gallery:loadSketch", (sketchInfo) => {
        loadSketch(app, sketchInfo, { sketches: mySketches, currentIndex: sketchIdx });
      });

      app.on("gallery:updateLocalSketches", (sketchList) => {
        mySketches = Array.isArray(sketchList) ? sketchList : [];
        app.expose("mySketches", mySketches);
        if (isNaN(sketchIdx) || sketchIdx < 0 || sketchIdx >= mySketches.length) {
          sketchIdx = 0;
          sPut("sketchIdx", sketchIdx);
          app.expose("sketchIdx", sketchIdx);
        }
        initStartupSketch();
      });

      app.on("gallery:saveMyExample", async () => {
        const editor = getEditor();
        if (!editor) return;
        let code = editor.getValue();
        const lines = code.split("\n");

        let firstLine = lines[0] || "";
        while (firstLine.trim() === "" && lines.length > 0) {
          lines.shift();
          firstLine = lines[0] || "";
        }

        const nameInCode = firstLine.match(/\/\*\s*(.*)\s+\*\//)?.[1]?.trim();
        const name = window.hydraDialog?.prompt
          ? await window.hydraDialog.prompt({
              title: "Save Sketch",
              message: "What's a fantasy name for this creation?",
              defaultValue: nameInCode || "My sketch",
              confirmText: "Save",
              cancelText: "Cancel",
            })
          : prompt(
              "What's a fantasy name for this creation?",
              nameInCode || "My sketch"
            );
        if (!name) return;

        if (nameInCode) {
          lines.shift();
        }

        let metadata = {};
        let lastLine = lines[lines.length - 1] || "";
        while (lastLine.trim() === "" && lines.length > 0) {
          lines.pop();
          lastLine = lines[lines.length - 1] || "";
        }
        if (lastLine.match(/\/\* (.*) \*\//)) {
          lines.pop();
          let metadataLine = lastLine.match(/\/\* (.*) \*\//)[1];
          if (metadataLine.startsWith("metadata = ")) {
            metadataLine = metadataLine.replace("metadata = ", "");
          }
          try {
            metadata = JSON.parse(metadataLine);
          } catch (e) {}
        }

        try {
          localSketches = JSON.parse(localStorage.getItem("mySketches") || "[]");
        } catch (e) {
          localSketches = [];
        }

        const sketch = {
          name,
          metadata: {
            midi: Boolean(code.match(/cc\[/) || code.match(/midi\(/)),
            ...metadata,
          },
          code: lines.join("\n"),
          fullDraft: btoa(code),
        };

        const existingIdx = localSketches.findIndex((e) => e.name === name);
        if (existingIdx >= 0) {
          localSketches[existingIdx] = sketch;
        } else {
          localSketches.unshift(sketch); // Prepend new sketches to the collection
        }
        localStorage.setItem("mySketches", JSON.stringify(localSketches));

        const sketchesMap = {};
        localSketches.concat(downloadedSketches).forEach((s) => {
          if (!sketchesMap[s.name]) {
            sketchesMap[s.name] = s;
          }
        });
        mySketches = Object.values(sketchesMap);
        sketchIdx = 0;
        sPut("sketchIdx", sketchIdx);
        app.expose("sketchIdx", sketchIdx);
        app.expose("mySketches", mySketches);
        app.emit("gallery:updateLocalSketches", mySketches);
      });

      app.on("gallery:export", (e = {}) => {
        const fixCode = (code) => code.replace(/([^\s])\*([^\s])/g, "$1 * $2");
        const sketchesToExport = e.altKey
          ? deduplicateBy(mySketches, "name")
          : deduplicateBy(localSketches, "name");

        const sketchList = sketchesToExport.map((sketch) => {
          const { name, code, type, midi } = sketch;
          const quality = typeof sketch.metadata?.quality === "number"
            ? sketch.metadata.quality
            : (typeof sketch.quality === "number" ? sketch.quality : undefined);
          return {
            name,
            type,
            code: code ? fixCode(code) : "",
            bpm: code?.match(/bpm\s+=\s+(\d+)/)?.[1],
            midi: !!(midi || code?.match(/cc\[/) || code?.match(/midi\(/)),
            ...(quality !== undefined ? { quality } : {}),
            author: window.author ?? "Anony Mouse",
          };
        });

        const jsonStr = JSON.stringify(sketchList, null, 2);

        // 1. Copy to clipboard
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(jsonStr).catch(() => {});
        } else if (window.copy) {
          window.copy(jsonStr);
        }

        // 2. Trigger file download
        try {
          const blob = new Blob([jsonStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `hydralisk-sketches-${new Date().toISOString().slice(0, 10)}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
          console.warn("[sketchLibrary] Export file download error:", err);
        }

        if (window.hydraDialog?.alert) {
          window.hydraDialog.alert({
            title: "Sketches Exported",
            message: `Exported ${sketchList.length} sketches. Downloaded .json file and copied JSON to clipboard.`,
            confirmText: "Done",
          });
        }
      });

      app.on("gallery:import-remote", async () => {
        if (window.amakit && window.amakit.isAuthenticated) {
          if (window.amakit.draftCache.length === 0) {
            await window.amakit.loadDrafts();
          }
          window.amakit.draftCache.forEach((sketch) => {
            if (!localSketches.some((e) => e.name === sketch.name)) {
              localSketches.push(sketch);
            }
          });
          localStorage.setItem("mySketches", JSON.stringify(localSketches));
          mySketches = localSketches.slice();
          app.expose("mySketches", mySketches);
        } else {
          fetch("sketches.json")
            .then((r) => r.json())
            .then((data) => {
              downloadedSketches = data.map((d) => ({
                ...d,
                code: d.type === "url" ? parseCode(d.url) : d.code,
                local: false,
              }));

              const sketchesMap = {};
              downloadedSketches.concat(localSketches).forEach((s) => {
                sketchesMap[s.name] = s;
              });
              mySketches = Object.values(sketchesMap);
              localStorage.setItem("mySketches", JSON.stringify(mySketches));
              app.expose("mySketches", mySketches);
              app.emit("gallery:updateLocalSketches", mySketches);
            })
            .catch((err) => {
              console.error("[sketchLibrary] Cannot fetch sketches.json", err);
            });
        }
      });

      app.on("gallery:import", () => {
        const overlay = document.createElement("div");
        overlay.className = "confirm-modal-overlay";
        overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.7);backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;animation:confirmFadeIn 0.15s ease-out;";

        const card = document.createElement("div");
        card.className = "confirm-modal-card";
        card.style.cssText = "background:#181825;border:1px solid #313244;border-radius:12px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.7);width:100%;max-width:480px;padding:24px;color:#cdd6f4;font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box;";

        const title = document.createElement("h3");
        title.style.cssText = "margin:0 0 16px 0;font-size:16px;font-weight:700;color:#cdd6f4;";
        title.textContent = "Import Sketches";
        card.appendChild(title);

        const closeDialog = () => {
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
        };

        const processImport = (jsonText) => {
          try {
            const imported = JSON.parse(jsonText);
            const items = Array.isArray(imported) ? imported : [imported];
            if (items.length === 0) throw new Error("No sketches found in JSON.");
            localSketches = items.concat(localSketches); // Prepend newly imported sketches
            localStorage.setItem("mySketches", JSON.stringify(localSketches));
            mySketches = localSketches.slice();
            app.expose("mySketches", mySketches);
            app.emit("gallery:updateLocalSketches", mySketches);
            closeDialog();
            if (window.hydraDialog?.alert) {
              window.hydraDialog.alert({
                title: "Import Successful",
                message: `Successfully imported ${items.length} sketch${items.length === 1 ? "" : "es"}.`,
                confirmText: "OK",
              });
            }
          } catch (e) {
            if (window.hydraDialog?.alert) {
              window.hydraDialog.alert({
                title: "Import Error",
                message: `Failed to parse sketches JSON: ${e.message}`,
              });
            } else {
              alert(`Failed to parse sketches JSON: ${e.message}`);
            }
          }
        };

        // File picker section
        const fileSection = document.createElement("div");
        fileSection.style.cssText = "margin-bottom:18px;padding:12px;background:#11111b;border:1px dashed #45475a;border-radius:8px;text-align:center;";

        const fileLabel = document.createElement("label");
        fileLabel.style.cssText = "display:inline-block;padding:8px 18px;background:#89b4fa;color:#11111b;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;";
        fileLabel.textContent = "Choose JSON File";

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".json,application/json";
        fileInput.style.cssText = "display:none;";
        fileInput.onchange = (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => processImport(ev.target?.result || "");
          reader.readAsText(file);
        };
        fileLabel.appendChild(fileInput);

        const fileHint = document.createElement("div");
        fileHint.style.cssText = "font-size:12px;color:#a6adc8;margin-top:6px;";
        fileHint.textContent = "Load an exported sketches.json file directly from disk";

        fileSection.appendChild(fileLabel);
        fileSection.appendChild(fileHint);
        card.appendChild(fileSection);

        // Divider
        const divider = document.createElement("div");
        divider.style.cssText = "display:flex;align-items:center;margin-bottom:14px;color:#6c7086;font-size:12px;";
        divider.innerHTML = '<span style="flex:1;height:1px;background:#313244;"></span><span style="padding:0 8px;">OR PASTE JSON</span><span style="flex:1;height:1px;background:#313244;"></span>';
        card.appendChild(divider);

        // Textarea
        const importInput = document.createElement("textarea");
        importInput.style.cssText = "display:block;width:100%;height:110px;background:#11111b;color:#cdd6f4;border:1px solid #45475a;padding:10px;border-radius:8px;font-family:monospace;font-size:12px;box-sizing:border-box;outline:none;resize:vertical;";
        importInput.placeholder = '[ { "name": "sketch", "code": "..." } ]';
        card.appendChild(importInput);

        // Action buttons
        const btnRow = document.createElement("div");
        btnRow.style.cssText = "display:flex;justify-content:flex-end;gap:10px;margin-top:18px;";

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";
        cancelButton.style.cssText = "padding:8px 18px;background:#313244;color:#cdd6f4;border:1px solid #45475a;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;";
        cancelButton.onclick = closeDialog;

        const sendButton = document.createElement("button");
        sendButton.textContent = "Import Text";
        sendButton.style.cssText = "padding:8px 20px;background:#a6e3a1;color:#11111b;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;";
        sendButton.onclick = () => {
          if (!importInput.value.trim()) {
            if (window.hydraDialog?.alert) {
              window.hydraDialog.alert({ title: "Empty Input", message: "Please choose a JSON file or paste sketch JSON text." });
            }
            return;
          }
          processImport(importInput.value);
        };

        btnRow.appendChild(cancelButton);
        btnRow.appendChild(sendButton);
        card.appendChild(btnRow);

        overlay.onclick = (e) => {
          if (e.target === overlay) closeDialog();
        };

        overlay.onkeydown = (e) => {
          if (e.key === "Escape") closeDialog();
        };

        overlay.appendChild(card);
        document.body.appendChild(overlay);
        setTimeout(() => importInput.focus(), 50);
      });

      // Simple Search Auto-completer UI
      let searchIsVisible = false;
      app.on("gallery:search", () => {
        if (searchIsVisible) {
          const list = document.getElementById("autocompleteList");
          const input = document.getElementById("autocompleteInput");
          if (list) document.body.removeChild(list);
          if (input) document.body.removeChild(input);
          searchIsVisible = false;
          if (window.focusEditor) window.focusEditor();
          return;
        }

        searchIsVisible = true;
        const input = document.createElement("input");
        input.id = "autocompleteInput";
        input.type = "text";
        input.placeholder = "Search sketches (Type & Enter)...";
        input.style.cssText = "position:fixed;top:16px;right:16px;z-index:99999;padding:10px 16px;background:#181825;color:#cdd6f4;border:1px solid #89b4fa;border-radius:8px;outline:none;font-family:system-ui,-apple-system,sans-serif;font-size:13px;box-shadow:0 10px 25px rgba(0,0,0,0.5);min-width:260px;";

        const list = document.createElement("datalist");
        list.id = "autocompleteList";

        mySketches.forEach((sketch) => {
          const opt = document.createElement("option");
          opt.value = sketch.name;
          list.appendChild(opt);
        });

        input.setAttribute("list", "autocompleteList");
        document.body.appendChild(input);
        document.body.appendChild(list);
        input.focus();

        input.onchange = () => {
          const val = input.value;
          const found = mySketches.find((s) => s.name === val);
          if (found) {
            app.emit("gallery:loadSketch", found);
          }
          app.emit("gallery:search");
        };

        input.onkeydown = (e) => {
          if (e.key === "Escape") app.emit("gallery:search");
        };
      });
    },

    onHydraReady(hydra, app) {
      if (typeof app?.initStartupSketch === "function") {
        app.initStartupSketch();
      }
    },
  });
}

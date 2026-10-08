/**
 * Sketch Library & Storage Plugin for Hydralisk
 * Manages local/remote sketches, playlist navigation, loading, saving,
 * import/export, deduplication, and sketch autocompleter.
 */

export const sGet = (key) => {
  try {
    const variablesStr = localStorage.getItem("variables");
    const variablesObj = JSON.parse(variablesStr || "{}");
    return variablesObj[key];
  } catch (e) {
    return undefined;
  }
};

export const sPut = (key, value) => {
  try {
    const variablesStr = localStorage.getItem("variables") || "{}";
    const o = JSON.parse(variablesStr);
    o[key] = value;
    localStorage.setItem("variables", JSON.stringify(o));
  } catch (e) {
    console.error("[sketchLibrary] Error saving variable:", e);
  }
};

export function deduplicateBy(array, field) {
  if (!Array.isArray(array)) return [];
  return Object.values(
    array.reduce((acc, s) => {
      if (s && s[field]) acc[s[field]] = s;
      return acc;
    }, {})
  );
}

const parseCode = (url) => {
  try {
    return decodeURIComponent(atob(decodeURIComponent(url.split("code=")[1])));
  } catch (e) {
    return url;
  }
};

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

      if (localSketches.length === 0) {
        setTimeout(() => app.emit("gallery:import-remote"), 100);
      }

      // Next / Prev Sketch
      app.on("gallery:prevSketch", (e = {}) => {
        e.backwards = true;
        app.emit("gallery:nextSketch", e);
        delete e.backwards;
      });

      app.on("gallery:nextSketch", (e = {}) => {
        if (!mySketches || mySketches.length === 0) return;

        if (isNaN(sketchIdx) || sketchIdx < 0 || sketchIdx >= mySketches.length) {
          sketchIdx = 0;
        }

        if (e.altKey || e.shiftKey || e.backwards) {
          sketchIdx = (sketchIdx - 1 + mySketches.length) % mySketches.length;
        } else {
          sketchIdx = (sketchIdx + 1) % mySketches.length;
        }
        sPut("sketchIdx", sketchIdx);
        app.expose("sketchIdx", sketchIdx);

        const sketch = mySketches[sketchIdx];
        if (!sketch) return;

        app.emit("gallery:loadSketch", sketch);
      });

      app.on("gallery:randomSketch", (e = {}) => {
        if (!mySketches || mySketches.length === 0) return;
        sketchIdx = Math.floor(Math.random() * mySketches.length);
        sPut("sketchIdx", sketchIdx);
        app.expose("sketchIdx", sketchIdx);
        app.emit("gallery:nextSketch", e);
      });

      app.on("gallery:loadSketch", (sketchInfo) => {
        if (!sketchInfo) return;
        const targetIdx = Array.isArray(mySketches)
          ? mySketches.findIndex((s) => s.name === sketchInfo.name || (s.id && s.id === sketchInfo.id))
          : -1;
        const sketch = targetIdx >= 0 ? mySketches[targetIdx] : sketchInfo;

        if (!sketch) return;

        let formattedCode = "";
        if (sketch.metadata) {
          const metaCopy = { ...sketch.metadata };
          delete metaCopy.bpm;
          delete metaCopy.date;
          delete metaCopy.local;
          delete metaCopy.index;
          delete metaCopy.type;
          const preamble = `/* ${sketch.name} */`;
          const metadata = `/* metadata = ${JSON.stringify(metaCopy)} */`;
          formattedCode = `${preamble}\n${sketch.code || ""}\n${metadata}`;
        } else {
          const preamble = `/* ${sketch.name} */\n`;
          if (sketch.code && sketch.code.startsWith(preamble.slice(0, -2))) {
            formattedCode = sketch.code;
          } else {
            formattedCode = preamble + (sketch.code || "");
          }
        }

        setEditorText(formattedCode);
        evalCode(formattedCode);
        document.title = sketch.name || "Hydralisk";

        sketchIdx = targetIdx >= 0 ? targetIdx : (typeof sketch.index === "number" ? sketch.index : 0);
        if (isNaN(sketchIdx)) sketchIdx = 0;
        sPut("sketchIdx", sketchIdx);
        app.expose("sketchIdx", sketchIdx);

        if (app.memory) {
          app.memory.resetAutosaves();
          app.memory.autoSave(formattedCode, true);
        }
      });

      app.on("gallery:updateLocalSketches", (sketchList) => {
        mySketches = Array.isArray(sketchList) ? sketchList : [];
        app.expose("mySketches", mySketches);
        if (isNaN(sketchIdx) || sketchIdx < 0 || sketchIdx >= mySketches.length) {
          sketchIdx = 0;
          sPut("sketchIdx", sketchIdx);
          app.expose("sketchIdx", sketchIdx);
        }
      });

      app.on("gallery:saveMyExample", () => {
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
        const name = prompt(
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
          localSketches.push(sketch);
        }
        localStorage.setItem("mySketches", JSON.stringify(localSketches));

        const sketchesMap = {};
        downloadedSketches.concat(localSketches).forEach((s) => {
          sketchesMap[s.name] = s;
        });
        mySketches = Object.values(sketchesMap);
        app.expose("mySketches", mySketches);
      });

      app.on("gallery:export", (e = {}) => {
        const fixCode = (code) => code.replace(/([^\s])\*([^\s])/g, "$1 * $2");
        const sketchesToExport = e.altKey
          ? deduplicateBy(mySketches, "name")
          : deduplicateBy(localSketches, "name");

        const sketchList = sketchesToExport.map((sketch) => {
          const { name, code, type, midi } = sketch;
          return {
            name,
            type,
            code: code ? fixCode(code) : "",
            bpm: code?.match(/bpm\s+=\s+(\d+)/)?.[1],
            midi: !!(midi || code?.match(/cc\[/) || code?.match(/midi\(/)),
            author: window.author ?? "Anony Mouse",
          };
        });

        if (window.copy) {
          window.copy(JSON.stringify(sketchList));
        } else {
          console.log("[sketchLibrary] Exported Sketches:", sketchList);
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
        const importInput = document.createElement("textarea");
        importInput.style.cssText = "display:block; background:#1e1e2e; color:#cdd6f4; width:100%; border:1px solid #45475a; padding:8px; border-radius:4px;";
        importInput.rows = 6;

        const container = document.createElement("div");
        container.style.cssText = "z-index:1000; position:fixed; top:20%; left:50%; transform:translateX(-50%); width:400px; background:#181825; padding:16px; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.5);";

        const btnRow = document.createElement("div");
        btnRow.style.cssText = "display:flex; justify-content:flex-end; gap:8px; margin-top:12px;";

        const sendButton = document.createElement("button");
        sendButton.textContent = "Import";
        sendButton.style.cssText = "padding:6px 16px; background:#89b4fa; color:#11111b; border:none; border-radius:4px; cursor:pointer;";

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";
        cancelButton.style.cssText = "padding:6px 16px; background:#45475a; color:#cdd6f4; border:none; border-radius:4px; cursor:pointer;";

        btnRow.appendChild(cancelButton);
        btnRow.appendChild(sendButton);
        container.appendChild(importInput);
        container.appendChild(btnRow);
        document.body.appendChild(container);

        cancelButton.onclick = () => document.body.removeChild(container);
        sendButton.onclick = () => {
          try {
            const importedSketches = JSON.parse(importInput.value);
            localSketches = localSketches.concat(
              Array.isArray(importedSketches) ? importedSketches : [importedSketches]
            );
            localStorage.setItem("mySketches", JSON.stringify(localSketches));
            mySketches = localSketches.slice();
            app.expose("mySketches", mySketches);
          } catch (e) {
            alert(e.message);
          } finally {
            if (document.body.contains(container)) {
              document.body.removeChild(container);
            }
          }
        };
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
        input.placeholder = "Type to search sketches...";
        input.style.cssText = "position:fixed; top:10px; right:10px; z-index:9999; padding:8px 12px; background:#11111b; color:#cdd6f4; border:1px solid #89b4fa; border-radius:6px; outline:none; font-family:monospace;";

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
  });
}

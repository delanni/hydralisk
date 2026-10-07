(function () {
  'use strict';

  var plugins = {};

  /**
   * Hydralisk Plugin System
   * Unified module & extension management for Hydralisk.
   */
  var hasRequiredPlugins;
  function requirePlugins() {
    if (hasRequiredPlugins) return plugins;
    hasRequiredPlugins = 1;
    (function (root) {
      class PluginRegistry {
        constructor() {
          this.plugins = new Map();
          this.state = new Map();
          this.isInitialized = false;
          this.hydraInstance = null;

          // Ambient context object provided to plugins
          this.context = {
            emitter: null,
            state: null,
            hydra: null,
            plugins: this,
            // Ambient variable getters/setters
            get bpm() {
              return root.bpm;
            },
            set bpm(val) {
              root.bpm = val;
            },
            get speed() {
              return root.speed;
            },
            set speed(val) {
              root.speed = val;
            },
            get mySketches() {
              return root.mySketches || [];
            },
            get sketchIdx() {
              return root.sketchIdx || 0;
            },
            // Event shortcuts
            on: (event, handler) => {
              if (this.context.emitter) {
                this.context.emitter.on(event, handler);
              } else if (root.xemitter) {
                root.xemitter.on(event, handler);
              } else {
                console.warn(`[Plugins] emitter not ready when registering listener for ${event}`);
              }
            },
            emit: (event, ...args) => {
              if (this.context.emitter) {
                this.context.emitter.emit(event, ...args);
              } else if (root.xemitter) {
                root.xemitter.emit(event, ...args);
              }
            },
            // State store for plugins
            registerState: (key, initialValue) => {
              if (!this.state.has(key)) {
                this.state.set(key, initialValue);
              }
              return this.state.get(key);
            },
            getState: key => this.state.get(key),
            setState: (key, val) => {
              this.state.set(key, val);
              this.context.emit(`state:change:${key}`, val);
            },
            // Convenience helper for publishing symbols/objects to window for sketch availability
            expose: (name, value) => {
              root[name] = value;
            }
          };
        }
        register(plugin) {
          if (!plugin || !plugin.id) {
            console.error("[Plugins] Cannot register invalid plugin", plugin);
            return;
          }
          if (this.plugins.has(plugin.id)) {
            console.warn(`[Plugins] Plugin '${plugin.id}' already registered, overwriting.`);
          }
          this.plugins.set(plugin.id, plugin);
          console.log(`[Plugins] Registered: ${plugin.id} (${plugin.name || plugin.id})`);
          if (typeof plugin.register === "function") {
            try {
              plugin.register(this.context);
            } catch (e) {
              console.error(`[Plugins] Error in register() for '${plugin.id}':`, e);
            }
          }

          // If registered after system init, execute init and onHydraReady hooks immediately
          if (this.isInitialized && typeof plugin.init === "function") {
            try {
              plugin.init(this.context);
            } catch (e) {
              console.error(`[Plugins] Error initializing late plugin '${plugin.id}':`, e);
            }
          }
          if (this.hydraInstance && typeof plugin.onHydraReady === "function") {
            try {
              plugin.onHydraReady(this.hydraInstance, this.context);
            } catch (e) {
              console.error(`[Plugins] Error onHydraReady late plugin '${plugin.id}':`, e);
            }
          }
        }
        get(id) {
          return this.plugins.get(id);
        }
        init(ambientContext = {}) {
          if (ambientContext.emitter) this.context.emitter = ambientContext.emitter;
          if (ambientContext.state) this.context.state = ambientContext.state;
          if (ambientContext.hydra) this.context.hydra = ambientContext.hydra;
          if (!this.context.emitter && root.xemitter) {
            this.context.emitter = root.xemitter;
          }
          this.isInitialized = true;
          console.log("[Plugins] Initializing plugin registry...");
          for (const [id, plugin] of this.plugins.entries()) {
            if (typeof plugin.init === "function") {
              try {
                plugin.init(this.context);
              } catch (e) {
                console.error(`[Plugins] Error initializing '${id}':`, e);
              }
            }
          }
        }
        onHydraReady(hydra) {
          this.hydraInstance = hydra;
          this.context.hydra = hydra;
          console.log("[Plugins] Hydra instance ready, invoking onHydraReady hooks...");
          for (const [id, plugin] of this.plugins.entries()) {
            if (typeof plugin.onHydraReady === "function") {
              try {
                plugin.onHydraReady(hydra, this.context);
              } catch (e) {
                console.error(`[Plugins] Error in onHydraReady for '${id}':`, e);
              }
            }
          }
        }
      }
      root.HydraliskPlugins = new PluginRegistry();
    })(typeof window !== "undefined" ? window : globalThis);
    return plugins;
  }

  requirePlugins();

  function styleInject(css, ref) {
    if ( ref === void 0 ) ref = {};
    var insertAt = ref.insertAt;

    if (!css || typeof document === 'undefined') { return; }

    var head = document.head || document.getElementsByTagName('head')[0];
    var style = document.createElement('style');
    style.type = 'text/css';

    if (insertAt === 'top') {
      if (head.firstChild) {
        head.insertBefore(style, head.firstChild);
      } else {
        head.appendChild(style);
      }
    } else {
      head.appendChild(style);
    }

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
  }

  var css_248z = ".modal {\n    display: block;\n    position: fixed;\n    z-index: 500;\n    top: 50%;\n    left: 50%;\n    transform: translate(-50%, -50%);\n    background-color: white;\n    padding: 0;\n    border: 1px solid #ccc;\n    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);\n    color: #101010;\n    width: 480px;           /* Set a fixed width */\n    height: 520px;          /* Set a fixed height */\n    max-width: 95vw;\n    max-height: 95vh;\n}\n\n.modal textarea {\n    background: lightblue;\n    width: 100%;\n    height: 100px;\n    border: 1px solid #ccc;\n    border-radius: 4px;\n}\n\n.modal.hidden {\n    display: none;\n}\n\n.modal-content {\n    text-align: left;\n    height: 100%;\n    display: flex;\n    flex-direction: column;\n}\n\n.modal-header {\n    flex: 0 0 auto;\n    padding: 20px 20px 0 20px;\n    background: white;\n    z-index: 1;\n}\n\n.modal-tabs {\n    display: flex;\n    gap: 8px;\n    margin-bottom: 12px;\n}\n.modal-tabs button {\n    background: none;\n    border: none;\n    padding: 8px 16px;\n    cursor: pointer;\n    font-weight: bold;\n}\n.modal-tabs .active {\n    border-bottom: 2px solid #007bff;\n    color: #007bff;\n}\n.modal-body {\n    flex: 1 1 auto;\n    overflow-y: auto;\n    padding: 20px;\n    min-height: 100px;\n    background: white;\n}\n\n.close-button {\n    cursor: pointer;\n    font-size: 20px;\n    position: absolute;\n    top: 10px;\n    right: 10px;\n}\n\n.sketch-tag {\n    background: #e0e7ff;\n    color: #2d3a5a;\n    border-radius: 12px;\n    padding: 2px 10px;\n    font-size: 12px;\n    margin-left: 2px;\n    white-space: nowrap;\n    display: inline-block;\n    max-width: 80px;\n    overflow: hidden;\n    text-overflow: ellipsis;\n}\n\n.sketch-list-item {\n    transition: background 0.15s;\n    padding: 6px 0;\n    border-bottom: 1px solid #eee;\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    cursor: pointer;\n    background: white;\n}\n.sketch-list-item:hover {\n    background: #f0f4ff;\n    cursor: pointer;\n}\n\n.sketch-list-item--remote {\n    background: #e8f5e9;\n}\n.sketch-list-item--remote:hover {\n    background: #c8e6c9;\n}\n\n.sketch-fields-label {\n    width: 120px;\n    margin-right: 8px;\n    font-weight: 500;\n}\n\n.sketch-fields-input,\n.metadata-fields-input {\n    flex: 1;\n    min-height: 32px;\n    font-family: monospace;\n    font-size: 14px;\n    margin-right: 8px;\n}\n\n.metadata-key-input {\n    width: 120px;\n    margin-right: 8px;\n    background: #f5f5f5;\n    color: #888;\n}\n\n.sketch-fields-section {\n    margin-bottom: 16px;\n}\n\n.sketch-fields-title,\n.metadata-fields-title {\n    font-weight: 600;\n    margin-bottom: 4px;\n}\n\n.metadata-add-row {\n    display: flex;\n    align-items: center;\n    margin-top: 12px;\n}\n\n.save-sketch-btn {\n    font-weight: bold;\n    padding: 8px 20px;\n    margin-top: 20px;\n}\n\n.sketch-filter {\n    width: 100%;\n    padding: 8px;\n    border: 1px solid #ccc;\n    border-radius: 4px;\n    font-size: 14px;\n    margin-bottom: 4px;\n}\n\n.sketch-list {\n    max-height: 300px;\n    overflow-y: auto;\n    margin-bottom: 8px;\n    padding-inline-start: 0;\n}\n\n.sketch-list-item {\n    padding: 8px 12px;\n}";
  styleInject(css_248z);

  // This is a module for managing sketch storage in a web application, through localStorage.

  /**
   * Object shape for sketch metadata:
      * @typedef {Object} SketchMeta
      * @property {string} name - The name of the sketch.
      * @property {string} code - The code of the sketch.
      * @property {string} fullDraft - The full draft of the sketch.
      * @property {string} id - Unique identifier for the sketch.
      * @property {boolean} local - Indicates if the sketch is local.
      * @property {Object} metadata - Additional metadata for the sketch.
      * @property {string[]} metadata.tags - Tags associated with the sketch.
      * @property {string} metadata.author - Author of the sketch.
      * @property {boolean} metadata.midi - Indicates if the sketch uses MIDI.
      * @property {number} metadata.heat - Heat level of the sketch.
   */

  class SketchStorage {
    constructor(localStorageRef, storageKey = 'mySketches') {
      this.localStorage = localStorageRef;
      this.storageKey = storageKey;
    }
    getSketches() {
      const sketches = this.localStorage.getItem(this.storageKey);
      return sketches ? JSON.parse(sketches) : [];
    }
    saveSketch(sketch) {
      const sketches = this.getSketches();
      sketches.push(sketch);
      this.localStorage.setItem(this.storageKey, JSON.stringify(sketches));
    }
    deleteSketch(index) {
      const sketches = this.getSketches();
      if (index >= 0 && index < sketches.length) {
        sketches.splice(index, 1);
        this.localStorage.setItem(this.storageKey, JSON.stringify(sketches));
      } else {
        throw new Error('Index out of bounds');
      }
    }
    deleteSketchByName(name) {
      const sketches = this.getSketches();
      const updatedSketches = sketches.filter(sketch => sketch.name !== name);
      if (updatedSketches.length === sketches.length) {
        throw new Error('Sketch not found');
      }
      this.localStorage.setItem(this.storageKey, JSON.stringify(updatedSketches));
    }
    clearSketches() {
      this.localStorage.removeItem(this.storageKey);
    }
    updateSketch(index, newSketch) {
      const sketches = this.getSketches();
      if (index >= 0 && index < sketches.length) {
        sketches[index] = newSketch;
        this.localStorage.setItem(this.storageKey, JSON.stringify(sketches));
      } else {
        throw new Error('Index out of bounds');
      }
    }
    getSketch(index) {
      const sketches = this.getSketches();
      if (index >= 0 && index < sketches.length) {
        return sketches[index];
      } else {
        throw new Error('Index out of bounds');
      }
    }
    getSketchById(id) {
      const sketches = this.getSketches();
      return sketches.find(sketch => sketch.id === id);
    }
    getSketchesByTag(tag) {
      const sketches = this.getSketches();
      return sketches.filter(sketch => sketch.metadata.tags && sketch.metadata.tags.includes(tag));
    }
    getSketchesBy(fieldName, value) {
      const sketches = this.getSketches();
      return sketches.filter(sketch => sketch.metadata[fieldName] === value);
    }
    deleteAll() {
      this.localStorage.removeItem(this.storageKey);
    }
  }

  // Collection storage for sketch subsets. Persists to localStorage.

  const STORAGE_KEY = 'mySketches_collections';
  const DEFAULT_STATE = {
    activeId: null,
    collections: []
  };
  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.floor(Math.random() * 16);
      const v = c === 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Filters sketches to those in the collection's sketchIds.
   * sketchIds can contain sketch.id or sketch.name (for backward compatibility).
   * @param {Object[]} sketches - All sketches
   * @param {string[]} sketchIds - Collection member ids/names
   * @returns {Object[]} Filtered sketches
   */
  function filterSketchesByCollection(sketches, sketchIds) {
    if (!sketchIds || sketchIds.length === 0) return [];
    const idSet = new Set(sketchIds);
    return sketches.filter(sketch => {
      if (sketch.id && idSet.has(sketch.id)) return true;
      return idSet.has(sketch.name);
    });
  }
  class CollectionStorage {
    constructor(localStorageRef, storageKey = STORAGE_KEY) {
      this.localStorage = localStorageRef;
      this.storageKey = storageKey;
    }
    _read() {
      const raw = this.localStorage.getItem(this.storageKey);
      if (!raw) return {
        ...DEFAULT_STATE
      };
      try {
        const parsed = JSON.parse(raw);
        return {
          activeId: parsed.activeId ?? null,
          collections: Array.isArray(parsed.collections) ? parsed.collections : []
        };
      } catch {
        return {
          ...DEFAULT_STATE
        };
      }
    }
    _write(state) {
      this.localStorage.setItem(this.storageKey, JSON.stringify(state));
    }
    getCollections() {
      return this._read();
    }
    getActiveCollection() {
      const {
        activeId,
        collections
      } = this._read();
      if (!activeId) return null;
      return collections.find(c => c.id === activeId) ?? null;
    }
    setActiveCollection(id) {
      const state = this._read();
      state.activeId = id;
      this._write(state);
    }
    saveCollection(collection) {
      const state = this._read();
      const existing = state.collections.findIndex(c => c.id === collection.id);
      const toSave = {
        id: collection.id || generateId(),
        name: collection.name || 'Unnamed',
        sketchIds: Array.isArray(collection.sketchIds) ? [...collection.sketchIds] : []
      };
      if (existing >= 0) {
        state.collections[existing] = toSave;
      } else {
        state.collections.push(toSave);
      }
      this._write(state);
      return toSave;
    }
    deleteCollection(id) {
      const state = this._read();
      state.collections = state.collections.filter(c => c.id !== id);
      if (state.activeId === id) state.activeId = null;
      this._write(state);
    }
    addSketchToCollection(collectionId, sketchIdOrName) {
      const state = this._read();
      const col = state.collections.find(c => c.id === collectionId);
      if (!col) return;
      if (col.sketchIds.includes(sketchIdOrName)) return;
      col.sketchIds.push(sketchIdOrName);
      this._write(state);
    }
    removeSketchFromCollection(collectionId, sketchIdOrName) {
      const state = this._read();
      const col = state.collections.find(c => c.id === collectionId);
      if (!col) return;
      col.sketchIds = col.sketchIds.filter(id => id !== sketchIdOrName);
      this._write(state);
    }
    createCollection(name) {
      const collection = {
        id: generateId(),
        name: name || 'New collection',
        sketchIds: []
      };
      this.saveCollection(collection);
      return collection;
    }
  }

  // --- SketchFieldsEditor: Fixed fields (non-metadata) ---
  function SketchFieldsEditor({
    fields,
    values,
    onChange
  }) {
    // Helper to parse value as JSON, fallback to string if invalid
    const parseValue = val => {
      try {
        return typeof val === "string" ? JSON.stringify(JSON.parse(val), null, 0) : JSON.stringify(val, null, 0);
      } catch {
        return typeof val === "string" ? val : JSON.stringify(val);
      }
    };
    // Helper to parse input as JSON, fallback to string if invalid
    const parseInput = input => {
      try {
        return JSON.parse(input);
      } catch {
        return input;
      }
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "sketch-fields-section"
    }, /*#__PURE__*/React.createElement("div", {
      className: "sketch-fields-title"
    }, "Sketch Fields"), fields.map(key => /*#__PURE__*/React.createElement("div", {
      key: key,
      style: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("label", {
      className: "sketch-fields-label"
    }, key), /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "sketch-fields-input",
      value: parseValue(values[key] ?? ""),
      onChange: e => onChange(key, parseInput(e.target.value))
    }))));
  }

  // --- MetadataEditor: Editable metadata fields ---
  function MetadataEditor({
    metadata,
    newField,
    onFieldChange,
    onRemove,
    onNewFieldChange,
    onAddField
  }) {
    // Helper to parse value as JSON, fallback to string if invalid
    const parseValue = val => {
      try {
        return typeof val === "string" ? JSON.stringify(JSON.parse(val), null, 0) : JSON.stringify(val, null, 0);
      } catch {
        return typeof val === "string" ? val : JSON.stringify(val);
      }
    };
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "metadata-fields-title"
    }, "Metadata"), Object.entries(metadata).map(([key, value]) => /*#__PURE__*/React.createElement("div", {
      key: key,
      style: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "metadata-key-input",
      value: key,
      disabled: true
    }), /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "metadata-fields-input",
      value: parseValue(value),
      onChange: e => onFieldChange(key, e.target.value)
    }), /*#__PURE__*/React.createElement("button", {
      onClick: () => onRemove(key),
      title: "Remove field"
    }, "\u2715"))), /*#__PURE__*/React.createElement("div", {
      className: "metadata-add-row"
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      name: "key",
      placeholder: "New metadata field",
      value: newField.key,
      className: "metadata-key-input",
      onChange: onNewFieldChange
    }), /*#__PURE__*/React.createElement("input", {
      type: "text",
      name: "value",
      placeholder: "Value",
      value: newField.value,
      className: "metadata-fields-input",
      onChange: onNewFieldChange
    }), /*#__PURE__*/React.createElement("button", {
      onClick: onAddField,
      title: "Add field"
    }, "\uFF0B")));
  }

  // --- SketchesList: List of sketches with actions ---
  function SketchesList({
    sketches,
    filter,
    tagFilter,
    remoteDraftNames = new Set(),
    onFilterChange,
    onTagFilterChange,
    onEdit,
    onDelete,
    onUpload,
    onRowClick,
    actions = [] // <-- Accept an array of action button configs
  }) {
    // Split tag filter input by space, comma, or semicolon, and filter out empty strings
    const tagFilterList = tagFilter.split(/[\s,;]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
    const isFiltering = filter && filter.trim() || tagFilterList.length > 0;
    const filtered = sketches.filter(sketch => {
      // Name filter
      const nameMatch = sketch.name?.toLowerCase().includes(filter?.toLowerCase());
      // Tag filter
      if (tagFilterList.length === 0) return nameMatch;
      const tags = Array.isArray(sketch.metadata?.tags) ? sketch.metadata.tags : [];
      // If any tag matches any of the entered tags, keep the sketch
      const tagMatch = tags.some(tag => tagFilterList.includes(String(tag).toLowerCase()));
      return nameMatch && tagMatch;
    });
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("input", {
      id: "sketch-filter",
      type: "text",
      className: "sketch-filter",
      placeholder: "Filter by name",
      value: filter,
      onChange: onFilterChange,
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement("input", {
      id: "sketch-tag-filter",
      type: "text",
      className: "sketch-filter",
      placeholder: "Filter by tag (space, comma, or semicolon separated)",
      value: tagFilter,
      onChange: onTagFilterChange,
      style: {
        flex: 1
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        marginBottom: 8
      }
    }, actions.map((action, i) => /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: () => action.onClick(filtered, isFiltering),
      disabled: action.disabled ? action.disabled(filtered, isFiltering) : false
    }, action.label))), /*#__PURE__*/React.createElement("ul", {
      className: "sketch-list"
    }, filtered.length === 0 && /*#__PURE__*/React.createElement("li", {
      style: {
        color: '#888'
      }
    }, "No sketches found."), filtered.map((sketch, idx) => {
      const tags = Array.isArray(sketch.metadata?.tags) ? sketch.metadata.tags : [];
      const isOnRemote = remoteDraftNames.has(sketch.name);
      return /*#__PURE__*/React.createElement("li", {
        key: sketch.name,
        className: `sketch-list-item${isOnRemote ? ' sketch-list-item--remote' : ''}`,
        onClick: () => onRowClick(sketch, idx)
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }
      }, sketch.name, tags.length > 0 && /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap'
        }
      }, tags.slice(0, 4).map((tag, i) => /*#__PURE__*/React.createElement("span", {
        className: "sketch-tag",
        key: i
      }, tag)))), /*#__PURE__*/React.createElement("span", {
        onClick: e => e.stopPropagation()
      }, onUpload && /*#__PURE__*/React.createElement("button", {
        title: "Upload to remote",
        style: {
          marginRight: 8
        },
        onClick: () => onUpload(sketch, idx)
      }, "\u2191"), /*#__PURE__*/React.createElement("button", {
        title: "Edit sketch",
        style: {
          marginRight: 8
        },
        onClick: () => onEdit(sketch.name, idx)
      }, "E"), /*#__PURE__*/React.createElement("button", {
        title: "Delete sketch",
        style: {
          color: 'red'
        },
        onClick: () => onDelete(sketch.name)
      }, "\u2715")));
    })));
  }

  // --- ImportExportPanel: Import/Export buttons ---
  function ImportExportPanel() {
    const [showEncoded, setShowEncoded] = React.useState(false);
    const [encodedBlob, setEncodedBlob] = React.useState('');
    const [encodedError, setEncodedError] = React.useState(null);
    const handleImportEncoded = () => {
      setEncodedError(null);
      try {
        const blob = JSON.parse(encodedBlob);
        window.amakit?.saveEncodedCredentials(blob);
        setEncodedBlob('');
        setShowEncoded(false);
      } catch (e) {
        setEncodedError(e.message || 'Invalid JSON');
      }
    };
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => window.xemitter?.emit('remote:login')
    }, "login"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setShowEncoded(!showEncoded)
    }, showEncoded ? 'hide' : 'import encoded credentials'), /*#__PURE__*/React.createElement("button", {
      onClick: () => {/* TODO: import all logic */}
    }, "import all"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {/* TODO: import single logic */}
    }, "import single"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {/* TODO: export all logic */}
    }, "export all")), showEncoded && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("textarea", {
      placeholder: "Paste JSON from: node scripts/encode-credentials.js",
      value: encodedBlob,
      onChange: e => setEncodedBlob(e.target.value),
      rows: 6,
      style: {
        fontFamily: 'monospace',
        fontSize: 12
      }
    }), /*#__PURE__*/React.createElement("button", {
      onClick: handleImportEncoded
    }, "save encoded credentials"), encodedError && /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'red'
      }
    }, encodedError)));
  }

  // --- CollectionsPanel: Manage collections of sketches ---
  function CollectionsPanel({
    collectionStorage,
    sketches,
    activeId,
    onActiveChange,
    onCollectionsChange
  }) {
    const {
      collections
    } = collectionStorage.getCollections();
    collectionStorage.getActiveCollection();
    const handleSetActive = id => {
      collectionStorage.setActiveCollection(id);
      onActiveChange(id);
      onCollectionsChange?.();
    };
    const handleCreateCollection = () => {
      const name = window.prompt('Collection name:', 'New collection');
      if (!name) return;
      collectionStorage.createCollection(name.trim());
      onCollectionsChange?.();
    };
    const handleDeleteCollection = id => {
      const col = collections.find(c => c.id === id);
      if (!col || !window.confirm(`Delete collection "${col.name}"?`)) return;
      collectionStorage.deleteCollection(id);
      if (activeId === id) {
        collectionStorage.setActiveCollection(null);
        onActiveChange(null);
      }
      onCollectionsChange?.();
    };
    const handleAddSketch = (collectionId, sketchIdOrName) => {
      collectionStorage.addSketchToCollection(collectionId, sketchIdOrName);
      onCollectionsChange?.();
    };
    const handleRemoveSketch = (collectionId, sketchIdOrName) => {
      collectionStorage.removeSketchFromCollection(collectionId, sketchIdOrName);
      onCollectionsChange?.();
    };
    const getSketchId = sketch => sketch.id || sketch.name;
    const isInCollection = (sketch, sketchIds) => {
      const id = getSketchId(sketch);
      return sketchIds.includes(id) || sketchIds.includes(sketch.name);
    };
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement("label", {
      style: {
        fontWeight: 600,
        marginRight: 8
      }
    }, "Active:"), /*#__PURE__*/React.createElement("select", {
      value: activeId || '',
      onChange: e => handleSetActive(e.target.value || null),
      style: {
        padding: 6,
        minWidth: 160
      }
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "All sketches"), collections.map(c => /*#__PURE__*/React.createElement("option", {
      key: c.id,
      value: c.id
    }, c.name)))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: handleCreateCollection
    }, "New collection")), /*#__PURE__*/React.createElement("ul", {
      className: "sketch-list",
      style: {
        listStyle: 'none',
        padding: 0
      }
    }, collections.length === 0 && /*#__PURE__*/React.createElement("li", {
      style: {
        color: '#888',
        marginBottom: 8
      }
    }, "No collections yet."), collections.map(col => {
      const count = col.sketchIds.length;
      const isActive = activeId === col.id;
      return /*#__PURE__*/React.createElement("li", {
        key: col.id,
        className: "sketch-list-item",
        style: {
          marginBottom: 8,
          padding: 8,
          border: '1px solid #eee',
          borderRadius: 4
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8
        }
      }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, col.name), /*#__PURE__*/React.createElement("span", {
        style: {
          color: '#666',
          marginLeft: 8
        }
      }, "(", count, ")")), /*#__PURE__*/React.createElement("span", {
        onClick: e => e.stopPropagation()
      }, !isActive && /*#__PURE__*/React.createElement("button", {
        style: {
          marginRight: 8
        },
        onClick: () => handleSetActive(col.id)
      }, "Activate"), /*#__PURE__*/React.createElement("button", {
        style: {
          color: 'red'
        },
        onClick: () => handleDeleteCollection(col.id)
      }, "Delete"))), /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 8,
          fontSize: 13,
          maxHeight: 120,
          overflowY: 'auto'
        }
      }, sketches.length === 0 ? /*#__PURE__*/React.createElement("span", {
        style: {
          color: '#888'
        }
      }, "No sketches in storage.") : /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4
        }
      }, sketches.map(sketch => {
        const sid = getSketchId(sketch);
        const inCol = isInCollection(sketch, col.sketchIds);
        return /*#__PURE__*/React.createElement("span", {
          key: sid,
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 6px',
            paddingRight: 4,
            borderRadius: 4,
            background: inCol ? '#e0e7ff' : '#f0f0f0',
            fontSize: 12
          }
        }, sketch.name, inCol ? /*#__PURE__*/React.createElement("button", {
          title: "Remove from collection",
          style: {
            padding: '0 4px',
            fontSize: 10,
            lineHeight: 1
          },
          onClick: e => {
            e.stopPropagation();
            handleRemoveSketch(col.id, sid);
          }
        }, "\u2715") : /*#__PURE__*/React.createElement("button", {
          title: "Add to collection",
          style: {
            padding: '0 4px',
            fontSize: 10,
            lineHeight: 1
          },
          onClick: e => {
            e.stopPropagation();
            handleAddSketch(col.id, sid);
          }
        }, "+"));
      }))));
    })));
  }

  // This is a module for sketch management


  // --- Main Modal Component ---
  class SketchModal extends React.Component {
    constructor(props) {
      super(props);
      this.sketchStorage = props.sketchStorage;
      this.collectionStorage = props.collectionStorage;
      this.state = {
        activeTab: 'This',
        thisSketchMeta: {
          name: "Untitled Sketch",
          description: "Describe your sketch here."
        },
        newField: {
          key: '',
          value: ''
        },
        sketches: [],
        sketchFilter: "",
        sketchTagFilter: "",
        editingSketchIdx: null,
        collectionVersion: 0,
        remoteDraftNames: new Set()
      };
    }
    setTab = tab => {
      this.setState({
        activeTab: tab
      });
    };
    handleFieldChange = (key, value) => {
      this.setState(prevState => ({
        thisSketchMeta: {
          ...prevState.thisSketchMeta,
          [key]: value
        }
      }));
    };
    handleMetadataFieldChange = (key, value) => {
      const parseInput = input => {
        try {
          return JSON.parse(input);
        } catch {
          return input;
        }
      };
      const metadata = typeof this.state.thisSketchMeta.metadata === "object" && this.state.thisSketchMeta.metadata !== null ? this.state.thisSketchMeta.metadata : {};
      this.setState(prevState => ({
        thisSketchMeta: {
          ...prevState.thisSketchMeta,
          metadata: {
            ...metadata,
            [key]: parseInput(value)
          }
        }
      }));
    };
    handleRemoveMetadataField = key => {
      const metadata = typeof this.state.thisSketchMeta.metadata === "object" && this.state.thisSketchMeta.metadata !== null ? this.state.thisSketchMeta.metadata : {};
      const updated = {
        ...metadata
      };
      delete updated[key];
      this.setState(prevState => ({
        thisSketchMeta: {
          ...prevState.thisSketchMeta,
          metadata: updated
        }
      }));
    };
    handleNewFieldChange = e => {
      const {
        name,
        value
      } = e.target;
      this.setState(prevState => ({
        newField: {
          ...prevState.newField,
          [name]: value
        }
      }));
    };
    handleAddMetadataField = () => {
      const {
        key,
        value
      } = this.state.newField;
      const metadata = typeof this.state.thisSketchMeta.metadata === "object" && this.state.thisSketchMeta.metadata !== null ? this.state.thisSketchMeta.metadata : {};
      if (!key || metadata.hasOwnProperty(key)) return;
      const parseInput = input => {
        try {
          return JSON.parse(input);
        } catch {
          return input;
        }
      };
      this.setState(prevState => ({
        thisSketchMeta: {
          ...prevState.thisSketchMeta,
          metadata: {
            ...metadata,
            [key]: parseInput(value)
          }
        },
        newField: {
          key: '',
          value: ''
        }
      }));
    };
    handleSketchFilterChange = e => {
      this.setState({
        sketchFilter: e.target.value
      });
    };
    handleTagFilterChange = e => {
      this.setState({
        sketchTagFilter: e.target.value
      });
    };
    componentDidMount() {
      // Load sketches from storage on mount
      this.setState({
        sketches: this.sketchStorage.getSketches()
      });
    }
    componentDidUpdate(prevProps) {
      if (this.props.visible && !prevProps.visible) {
        this.loadRemoteDraftNames();
      }
    }
    loadRemoteDraftNames = () => {
      const amakit = window.amakit;
      if (!amakit) return;
      amakit.loadDrafts().then(drafts => {
        const names = new Set((drafts || amakit.draftCache || []).map(d => d.name));
        this.setState({
          remoteDraftNames: names
        });
      }).catch(() => {
        const names = new Set((amakit.draftCache || []).map(d => d.name));
        this.setState({
          remoteDraftNames: names
        });
      });
    };
    handleDeleteSketch = name => {
      if (window.confirm(`Delete "${name}"?`)) {
        this.sketchStorage.deleteSketchByName(name);
        const sketches = this.sketchStorage.getSketches();
        this.setState({
          sketches
        });
        this.props.onApplyCollection?.();
      }
    };
    handleEditSketch = (name, idx) => {
      const sketch = this.state.sketches.find(s => s.name === name);
      // Load the sketch's metadata into the editor
      this.setState({
        thisSketchMeta: {
          ...sketch
        },
        editingSketchIdx: idx,
        activeTab: 'This'
      });
      window.xemitter.emit('gallery:loadSketch', sketch);
    };
    handleSaveSketch = () => {
      const {
        editingSketchIdx,
        thisSketchMeta,
        sketches
      } = this.state;
      if (editingSketchIdx == null) return;
      // Update the sketch in the array and localStorage
      const updatedSketches = [...sketches];
      updatedSketches[editingSketchIdx] = {
        ...updatedSketches[editingSketchIdx],
        ...thisSketchMeta
      };
      this.sketchStorage.localStorage.setItem(this.sketchStorage.storageKey, JSON.stringify(updatedSketches));
      this.setState({
        sketches: updatedSketches
      });
    };
    handleKeepFiltered = filteredSketches => {
      // only update the sketches set locally
      window.xemitter.emit('gallery:updateLocalSketches', filteredSketches);
    };
    handleUploadSketch = sketch => {
      const amakit = window.amakit;
      if (!amakit?.isAuthenticated) {
        window.xemitter?.emit('remote:login');
        return;
      }
      amakit.addDraft(sketch).then(() => {
        this.loadRemoteDraftNames();
      }).catch(err => console.error('Upload failed:', err));
    };
    handleUploadThisSketch = () => {
      const {
        thisSketchMeta
      } = this.state;
      const amakit = window.amakit;
      if (!amakit?.isAuthenticated) {
        window.xemitter?.emit('remote:login');
        return;
      }
      amakit.addDraft(thisSketchMeta).then(() => {
        this.loadRemoteDraftNames();
      }).catch(err => console.error('Upload failed:', err));
    };
    renderTabs() {
      const tabs = ['This', 'Sketches', 'Collections', 'Import/Export'];
      return /*#__PURE__*/React.createElement("div", {
        className: "modal-tabs"
      }, tabs.map(tab => /*#__PURE__*/React.createElement("button", {
        key: tab,
        className: this.state.activeTab === tab ? 'active' : '',
        onClick: () => this.setTab(tab)
      }, tab)));
    }
    renderJsonEditor() {
      const {
        thisSketchMeta,
        newField,
        editingSketchIdx
      } = this.state;
      const fixedFields = ["name", "code", "fullDraft", "id", "local"];
      const metadata = typeof thisSketchMeta.metadata === "object" && thisSketchMeta.metadata !== null ? thisSketchMeta.metadata : {};
      return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SketchFieldsEditor, {
        fields: fixedFields,
        values: thisSketchMeta,
        onChange: this.handleFieldChange
      }), /*#__PURE__*/React.createElement(MetadataEditor, {
        metadata: metadata,
        newField: newField,
        onFieldChange: this.handleMetadataFieldChange,
        onRemove: this.handleRemoveMetadataField,
        onNewFieldChange: this.handleNewFieldChange,
        onAddField: this.handleAddMetadataField
      }), editingSketchIdx !== null && /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'flex',
          gap: 8,
          marginTop: 20
        }
      }, /*#__PURE__*/React.createElement("button", {
        onClick: this.handleSaveSketch,
        className: "save-sketch-btn"
      }, "Save"), /*#__PURE__*/React.createElement("button", {
        onClick: this.handleUploadThisSketch,
        className: "save-sketch-btn"
      }, "Upload")));
    }
    renderSketchesList() {
      const actions = [{
        label: "Keep these",
        onClick: (filtered, isFiltering) => {
          this.handleKeepFiltered(filtered);
        },
        disabled: (filtered, isFiltering) => filtered.length === 0
      }, {
        label: "Clear all local!",
        onClick: () => {
          if (window.confirm("Are you sure you want to clear all local sketches? This cannot be undone.")) {
            this.sketchStorage.deleteAll();
            this.setState({
              sketches: []
            });
            window.xemitter.emit('gallery:updateLocalSketches', []);
          }
        }
      }];
      return /*#__PURE__*/React.createElement(SketchesList, {
        sketches: this.state.sketches,
        filter: this.state.sketchFilter,
        tagFilter: this.state.sketchTagFilter,
        remoteDraftNames: this.state.remoteDraftNames,
        onFilterChange: this.handleSketchFilterChange,
        onTagFilterChange: this.handleTagFilterChange,
        onEdit: this.handleEditSketch,
        onDelete: this.handleDeleteSketch,
        onUpload: this.handleUploadSketch,
        onRowClick: sketchInfo => {
          window.xemitter.emit('gallery:updateLocalSketches', this.state.sketches);
          window.xemitter.emit('gallery:loadSketch', sketchInfo);
        },
        actions: actions
      });
    }
    renderImportExport() {
      return /*#__PURE__*/React.createElement(ImportExportPanel, null);
    }
    handleCollectionChange = () => {
      this.props.onApplyCollection?.();
      this.setState(s => ({
        collectionVersion: (s.collectionVersion || 0) + 1
      }));
    };
    renderCollectionsPanel() {
      if (!this.collectionStorage) return null;
      const {
        activeId
      } = this.collectionStorage.getCollections();
      return /*#__PURE__*/React.createElement(CollectionsPanel, {
        collectionStorage: this.collectionStorage,
        sketches: this.state.sketches,
        activeId: activeId,
        onActiveChange: this.handleCollectionChange,
        onCollectionsChange: this.handleCollectionChange
      });
    }
    renderTabContent() {
      switch (this.state.activeTab) {
        case 'This':
          return this.renderJsonEditor();
        case 'Sketches':
          return this.renderSketchesList();
        case 'Collections':
          return this.renderCollectionsPanel();
        case 'Import/Export':
          return this.renderImportExport();
        default:
          return null;
      }
    }
    render() {
      if (!this.props.visible) {
        return null;
      }
      return /*#__PURE__*/React.createElement("div", {
        id: "sketchman-popup",
        className: "modal"
      }, /*#__PURE__*/React.createElement("div", {
        className: "modal-content"
      }, /*#__PURE__*/React.createElement("div", {
        className: "modal-header"
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          justifyContent: 'space-between'
        }
      }, /*#__PURE__*/React.createElement("h5", {
        style: {
          margin: 0
        }
      }, "Sketch Manager"), /*#__PURE__*/React.createElement("span", {
        className: "close-button",
        onClick: this.props.onClose
      }, "\xD7"))), this.renderTabs(), /*#__PURE__*/React.createElement("div", {
        className: "modal-body"
      }, this.renderTabContent())));
    }
  }

  // Main App Component
  class SketchApp extends React.Component {
    constructor(props) {
      super(props);
      this.sketchStorage = new SketchStorage(window.localStorage);
      this.collectionStorage = new CollectionStorage(window.localStorage);
      this.state = {
        isModalVisible: false
      };
    }
    applyCollectionFilter = () => {
      const sketches = this.sketchStorage.getSketches();
      const active = this.collectionStorage.getActiveCollection();
      const filtered = active ? filterSketchesByCollection(sketches, active.sketchIds) : sketches;
      if (window.xemitter) {
        window.xemitter.emit('gallery:updateLocalSketches', filtered);
      }
    };
    toggleModal = () => {
      // if (this.state.isModalVisible) {
      //     window.xemitter.emit('gallery:updateLocalSketches', this.sketchStorage.getSketches());
      // }
      this.setState(prevState => ({
        isModalVisible: !prevState.isModalVisible
      }));
    };
    componentDidMount() {
      this.applyCollectionFilter();
    }
    render() {
      return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SketchModal, {
        sketchStorage: this.sketchStorage,
        collectionStorage: this.collectionStorage,
        visible: this.state.isModalVisible,
        onClose: this.toggleModal,
        onApplyCollection: this.applyCollectionFilter
      }));
    }
  }
  class SketchManager {
    constructor(appInstance) {
      this.appInstance = appInstance;
    }
    inject() {
      let appContainer = document.getElementById("sketchman-app");
      if (!appContainer) {
        const body = document.body;
        const host = document.createElement('div');
        host.id = 'sketchman-app';
        body.appendChild(host);
        appContainer = host;
      }
      const appInstance = ReactDOM.render(/*#__PURE__*/React.createElement(SketchApp, null), appContainer);
      this.appInstance = appInstance;
      this.appContainer = appContainer;
    }
    togglePopup() {
      if (this.appInstance) {
        this.appInstance.toggleModal();
      } else {
        console.error("SketchManager is not initialized with an app instance");
      }
    }
  }

  /**
   * Kit for connecting to Amazon DynamoDB
   *
   * Encoded credentials (scripts/encode-credentials.js): both accessKeyId and
   * secretAccessKey encrypted with your password—safe to publish in source.
   */

  const PBKDF2_ITERATIONS = 310000;
  if (typeof window !== "undefined") {
    window.awsCredentialsEncoded = {
      encoded: true,
      credentialsCiphertext: "uWzwhV//QeaoDcds1FvdCCWY6EptwC2pyCqlJDYRBXKIqVriyrx5vUgmvjBbintIAzJQYcAmWAN8VBXGawuYrkJdvIyU221g90kyHZkvtJ5pDqk6RrrxN72NHqAad+KM8f2rOky1Mu5ANL78w0TF3JT5bg==",
      salt: "u9XNXhZ8/WLxr8A1PoBYug==",
      iv: "EnftfLKbFvPBhVLi"
    };
  }
  const AUTH_TAG_LEN = 16;
  const userName = (() => {
    try {
      return localStorage.getItem("awsCredentials") ? JSON.parse(localStorage.getItem("awsCredentials")).name : "Unknown";
    } catch (e) {
      return "Unknown";
    }
  })();
  const metadataDefaults = {
    author: userName,
    midi: false,
    heat: 5,
    tags: []
  };
  class Amakit {
    isAuthenticated = false;
    draftCache = [];
    constructor() {
      this.table = "hydralisk-drafts";
      this.ensureAWS();
    }
    ensureAWS = () => {
      if (!this.AWS && typeof window !== "undefined" && window.AWS) {
        this.AWS = window.AWS;
      }
      if (this.AWS && !this.docClient) {
        this.AWS.config.update({
          region: "eu-west-1"
        });
        this.docClient = new this.AWS.DynamoDB.DocumentClient({
          apiVersion: "2012-08-10",
          region: "eu-west-1"
        });
      }
      return !!(this.AWS && this.docClient);
    };
    loadDrafts = async () => {
      this.ensureAWS();
      try {
        const drafts = await this.getAllDrafts();
        this.draftCache = drafts || [];
        return drafts;
      } catch (err) {
        console.error("Error loading drafts: ", err);
      }
    };
    getCredentials = () => {
      let fromStorage = null;
      try {
        fromStorage = JSON.parse(localStorage.getItem("awsCredentials") || "null");
      } catch (err) {
        console.error("Invalid awsCredentials in localStorage:", err);
      }
      if (fromStorage?.accessKeyId && fromStorage?.secretAccessKey) {
        return fromStorage;
      }
      return null;
    };

    /**
     * Store pre-encoded credentials blob from scripts/encode-credentials.js.
     * Login will prompt for password to decrypt.
     */
    saveEncodedCredentials = blob => {
      if (!blob || !blob.credentialsCiphertext || !blob.salt || !blob.iv) {
        throw new Error("Invalid encoded credentials blob");
      }
      const machineId = localStorage.getItem("machineId") || prompt("What is the name of this machine?") || "unknown";
      localStorage.setItem("machineId", machineId);
      const stored = {
        ...blob,
        machineId,
        name: blob.name || "User"
      };
      localStorage.setItem("awsCredentials", JSON.stringify(stored));
      return stored;
    };
    _decryptSecret = async (ciphertextB64, saltB64, ivB64, password) => {
      const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
      const ciphertext = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits", "deriveKey"]);
      const key = await crypto.subtle.deriveKey({
        name: "PBKDF2",
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256"
      }, keyMaterial, {
        name: "AES-GCM",
        length: 256
      }, false, ["decrypt"]);
      const decrypted = await crypto.subtle.decrypt({
        name: "AES-GCM",
        iv,
        tagLength: AUTH_TAG_LEN * 8
      }, key, ciphertext);
      return new TextDecoder().decode(decrypted);
    };
    saveCredentials = (name, accessKeyId, secretAccessKey, persist = true) => {
      let machineId = localStorage.getItem("machineId") || prompt("What is the name of this machine?") || "unknown";
      localStorage.setItem("machineId", machineId);
      name = name || prompt("What is your name?");
      accessKeyId = accessKeyId || prompt("What is your AWS Access Key ID?");
      secretAccessKey = secretAccessKey || prompt("What is your AWS Secret Access Key?");
      if (!accessKeyId || !secretAccessKey) {
        return null;
      }
      const credentials = {
        name: name || "User",
        machineId,
        accessKeyId,
        secretAccessKey
      };
      if (persist) {
        localStorage.setItem("awsCredentials", JSON.stringify(credentials));
      }
      return credentials;
    };
    login = async (doPrompt = true) => {
      this.ensureAWS();
      if (!this.AWS) {
        return Promise.reject("AWS SDK (window.AWS) is not loaded.");
      }
      let credentials = this.getCredentials();

      // Check for encoded credentials (encrypted blob in storage or window)
      const storedBlob = (() => {
        try {
          const parsed = JSON.parse(localStorage.getItem("awsCredentials") || "null");
          if (parsed?.credentialsCiphertext) return parsed;
        } catch (e) {}
        return typeof window !== "undefined" && window.awsCredentialsEncoded?.credentialsCiphertext ? window.awsCredentialsEncoded : null;
      })();
      if (!credentials && storedBlob) {
        if (!doPrompt) {
          return Promise.reject("No plain credentials found. Decryption password required.");
        }
        const pwd = prompt("Enter password for AWS credentials:");
        if (!pwd) {
          return Promise.reject("Login cancelled: no password provided.");
        }
        try {
          const decryptedStr = await this._decryptSecret(storedBlob.credentialsCiphertext, storedBlob.salt, storedBlob.iv, pwd);
          const keys = JSON.parse(decryptedStr);
          credentials = {
            name: storedBlob.name || "User",
            machineId: storedBlob.machineId || "unknown",
            accessKeyId: keys.accessKeyId,
            secretAccessKey: keys.secretAccessKey
          };
        } catch (err) {
          console.error("Decryption error:", err);
          return Promise.reject("Invalid password or decryption failed.");
        }
      }
      if (!credentials) {
        if (!doPrompt) {
          return Promise.reject("No credentials found.");
        }
        credentials = this.saveCredentials(undefined, undefined, undefined, false);
      }
      if (!credentials || !credentials.accessKeyId || !credentials.secretAccessKey) {
        return Promise.reject("Login cancelled or invalid AWS credentials provided.");
      }
      this.AWS.config.update({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        region: "eu-west-1"
      });
      if (this.docClient && this.AWS.config.credentials) {
        this.docClient.configure({
          credentials: this.AWS.config.credentials
        });
      }
      return new Promise((resolve, reject) => {
        if (!this.AWS.config.credentials) {
          return reject(new Error("Failed to initialize AWS credentials."));
        }
        this.AWS.config.credentials.get(err => {
          if (err) {
            console.error("AWS authentication error:", err);
            reject(err);
          } else {
            this.isAuthenticated = true;
            console.log("Logged in as:", credentials.name);
            localStorage.setItem("awsCredentials", JSON.stringify(credentials));
            resolve(credentials);
          }
        });
      });
    };
    getDraft = ({
      id,
      name
    }) => {
      this.ensureAWS();
      const params = {
        TableName: this.table,
        Key: id ? {
          id
        } : {
          name
        }
      };
      return new Promise((resolve, reject) => {
        this.docClient.get(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data.Item);
          }
        });
      });
    };
    getAllDrafts = () => {
      this.ensureAWS();
      const params = {
        TableName: this.table
      };
      return new Promise((resolve, reject) => {
        this.docClient.scan(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            this.allDrafts = data.Items;
            resolve(data.Items);
          }
        });
      });
    };
    processDraftString = draftString => {
      let lines = draftString.split("\n");
      let name = "";
      if (lines[0].trim().startsWith("/*") && lines[0].trim().endsWith("*/")) {
        name = this.getCommentValue(lines[0]);
        lines = lines.slice(1);
      } else {
        name = `Random ${Math.floor(Math.random() * 1000)}`;
      }
      let metadata = {};
      try {
        const metadataLine = lines.find(line => line.trim().startsWith("/* metadata = "));
        metadata = JSON.parse(this.getCommentValue(metadataLine).replace("metadata = ", ""));
      } catch (e) {
        console.error("Cannot parse metadata: ", e);
      }
      metadata = {
        ...metadataDefaults,
        ...metadata
      };
      return {
        name,
        metadata,
        code: lines.join("\n")
      };
    };
    addDraft = draftOrString => {
      this.ensureAWS();
      let draft = null;
      if (typeof draftOrString === "string") {
        const {
          name,
          metadata,
          code
        } = this.processDraftString(draftOrString);
        draft = this.shapeDraft({
          name,
          metadata,
          code,
          fullDraft: btoa(draftOrString)
        });
      } else {
        draft = this.shapeDraft(draftOrString);
      }
      const params = {
        TableName: this.table,
        Item: draft
      };
      return new Promise((resolve, reject) => {
        this.docClient.put(params, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(draft);
          }
        });
      });
    };
    uploadDraftObj = draft => {
      this.ensureAWS();
      const params = {
        TableName: this.table,
        Item: draft
      };
      return new Promise((resolve, reject) => {
        this.docClient.put(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    };

    // Drop by id or name
    dropDraft = ({
      id,
      name
    }) => {
      this.ensureAWS();
      const params = {
        TableName: this.table,
        Key: id ? {
          id
        } : {
          name
        }
      };
      return new Promise((resolve, reject) => {
        this.docClient.delete(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    };
    generateId = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = Math.floor(Math.random() * 16);
        const v = c === "x" ? r : r & 0x3 | 0x8;
        return v.toString(16);
      });
    };
    getCommentValue = comment => {
      const start = comment.indexOf("/*") + 2;
      const end = comment.indexOf("*/");
      return comment.substring(start, end).trim();
    };
    shapeDraft = draft => {
      const id = draft.id || this.generateId();
      const name = draft.name || `Random ${Math.floor(Math.random() * 1000)}`;
      const metadata = {
        ...metadataDefaults,
        ...(draft.metadata || {})
      };
      const code = draft.code.replace(/^\/\* metadata.*$/m, "").trim();
      const fullDraft = btoa(`/* ${name} */\n${code}\n/* metadata = ${JSON.stringify(metadata)}*/`);
      return {
        id,
        name,
        metadata,
        fullDraft,
        code
      };
    };
  }
  window.amakit = new Amakit();
  if (typeof window !== "undefined" && window.HydraliskPlugins) {
    window.HydraliskPlugins.register({
      id: "amakit",
      name: "Amazon DynamoDB Draft Storage",
      init(app) {
        app.expose("amakit", window.amakit);
      }
    });
  }

  /**
   * Hydrakit — WebMIDI State Engine, Tap Tempo Module & Audio-Reactive Sketch Helpers
   * Unified MIDI state management, rolling tap-tempo calculator, and sketch utilities for Hydralisk.
   */

  class MidiEngine {
    constructor() {
      this.cc = new Array(128).fill(0.5);
      this.ccc = Array.from({
        length: 16
      }, () => new Array(128).fill(0.5));
      this.ccbind = [];
      this.isInitialized = false;

      // Expose globals for sketch backward compatibility
      if (typeof window !== "undefined") {
        window.cc = this.cc;
        window.ccc = this.ccc;
        window.ccbind = this.ccbind;
      }
    }
    init() {
      if (this.isInitialized) return;
      this.isInitialized = true;
      if (typeof navigator !== "undefined" && navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess().then(access => this.handleMidiSuccess(access)).catch(err => console.warn("[Hydrakit] Could not access MIDI devices:", err));
      }
    }
    handleMidiSuccess(midiAccess) {
      console.log("[Hydrakit] WebMIDI access granted");
      for (const input of midiAccess.inputs.values()) {
        this.attachInput(input);
      }
      midiAccess.onstatechange = e => {
        if (e.port && e.port.type === "input" && e.port.state === "connected") {
          console.log(`[Hydrakit] Hot-plugged MIDI device: ${e.port.name}`);
          this.attachInput(e.port);
        }
      };
    }
    attachInput(input) {
      if (!input) return;
      input.removeEventListener("midimessage", this.onMidiMessage);
      input.addEventListener("midimessage", this.onMidiMessage);
    }
    onMidiMessage = event => {
      if (!event || !event.data) return;
      const [kind, ccIndex, rawValue] = event.data;
      if (ccIndex === undefined) return;
      const channel = kind & 0b00001111;
      const normalizedValue = (rawValue > 64 ? rawValue + 1 : rawValue) / 128.0;
      this.cc[ccIndex] = normalizedValue;
      this.ccc[channel][ccIndex] = normalizedValue;
      if (!this.ccbind.includes(ccIndex)) {
        console.log(`[Hydrakit] CC #${ccIndex} bound to b${this.ccbind.length}`);
        this.ccbind.push(ccIndex);
      }
    };
    getValue(ccIndex, {
      min = 0,
      max = 1,
      channel,
      transform
    } = {}) {
      let localIndex = ccIndex;
      if (typeof ccIndex === "string") {
        if (/^[ABCD]$/.test(ccIndex)) {
          const globalVal = window.cc ? window.cc[ccIndex] : undefined;
          if (globalVal === undefined) return min;
          const value = globalVal * (max - min) + min;
          return transform ? transform(value) : value;
        }
        if (/^b\d+$/.test(ccIndex)) {
          const bindIndex = parseInt(ccIndex.slice(1), 10);
          localIndex = this.ccbind[bindIndex];
          if (localIndex === undefined) return min;
        }
      }
      if (localIndex === undefined || localIndex === null) return min;
      const ccArr = channel !== undefined ? this.ccc[channel] : this.cc;
      const rawVal = ccArr[localIndex] !== undefined ? ccArr[localIndex] : 0.5;
      const value = rawVal * (max - min) + min;
      return transform ? transform(value) : value;
    }
  }
  const midiEngine = new MidiEngine();
  midiEngine.init();

  // --- Tap Tempo Module ---

  /**
   * TapTempo — Rolling average BPM calculator & tap manager
   */
  class TapTempo {
    constructor({
      maxTaps = 16,
      idleTimeoutMs = 5000,
      minTaps = 4
    } = {}) {
      this.taps = [];
      this.maxTaps = maxTaps;
      this.idleTimeoutMs = idleTimeoutMs;
      this.minTaps = minTaps;
      this.resetTimer = null;
      this.currentBpm = 120;
      this.appContext = null;
    }
    setAppContext(app) {
      this.appContext = app;
    }
    tap = (timestamp = Date.now()) => {
      // Reset 5s idle timer
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
      }
      this.resetTimer = setTimeout(() => {
        this.reset();
      }, this.idleTimeoutMs);
      this.taps.push(timestamp);

      // Keep rolling history up to maxTaps
      if (this.taps.length > this.maxTaps) {
        this.taps.shift();
      }

      // Calculate rolling average BPM ONLY on every 4th tap (4, 8, 12, 16...)
      if (this.taps.length >= 4 && this.taps.length % 4 === 0) {
        const first = this.taps[0];
        const last = this.taps[this.taps.length - 1];
        const count = this.taps.length - 1;
        const totalIntervalMs = last - first;
        if (totalIntervalMs > 0 && count > 0) {
          const avgIntervalMs = totalIntervalMs / count;
          const calculatedBpm = Math.round(60000 / avgIntervalMs);
          if (calculatedBpm >= 30 && calculatedBpm <= 300) {
            this.currentBpm = calculatedBpm;
            if (typeof window !== "undefined") {
              window.bpm = calculatedBpm;
            }
            if (this.appContext) {
              this.appContext.bpm = calculatedBpm;
              this.appContext.emit("bpm:change", calculatedBpm);
            } else if (typeof window !== "undefined" && window.xemitter) {
              window.xemitter.emit("taptempo", {
                bpm: calculatedBpm
              });
            }
          }
        }
      }
      return this.currentBpm;
    };
    reset = () => {
      this.taps = [];
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
        this.resetTimer = null;
      }
    };
    getBpm = () => {
      return this.currentBpm;
    };
  }
  const tapTempo = new TapTempo();
  if (typeof window !== "undefined") {
    window.tapTempo = tapTempo;
    window.addEventListener("keydown", e => {
      if (e.code === "Space" && e.altKey) {
        e.preventDefault();
        tapTempo.tap(e.timeStamp);
      }
    });
  }

  // --- Sketch Helper Functions ---

  /**
   * MIDI value getter for sketches
   * Usage: midi(3, {min: 10, max: 60}), midi('b0'), midi('A')
   */
  function midi(ccIndex, options = {}) {
    return () => midiEngine.getValue(ccIndex, options);
  }

  /**
   * BPM-synced sawtooth ramp for Hydra arrays or properties
   */
  const saw = ({
    min = 0,
    max = 1,
    x = 1,
    t
  } = {}) => ({
    time
  }) => {
    const currentBpm = typeof window !== "undefined" && window.bpm ? window.bpm : 120;
    const spb = 60 / currentBpm * x;
    const p = time % spb / spb * (max - min) + min;
    return t ? t(p) : p;
  };

  /**
   * Low Frequency Oscillator (LFO) builder for Hydra params
   */
  function createLFO({
    frequency = 1,
    amplitude = 1,
    phase = 0,
    waveform = "sine",
    bpm = undefined,
    trans = undefined,
    t = undefined
  } = {}) {
    const transform = trans || t;
    if (bpm) {
      frequency = bpm / 60 * frequency;
    }
    const omega = 2 * Math.PI * frequency;
    return ({
      time
    }) => {
      const theta = omega * time + phase;
      let value;
      switch (waveform) {
        case "sine":
          value = Math.sin(theta);
          break;
        case "square":
          value = Math.sign(Math.sin(theta));
          break;
        case "sawtooth":
          value = 2 * (theta / (2 * Math.PI) - Math.floor(0.5 + theta / (2 * Math.PI)));
          break;
        case "triangle":
          value = 2 * Math.abs(2 * (theta / (2 * Math.PI) - Math.floor(0.5 + theta / (2 * Math.PI)))) - 1;
          break;
        case "random":
          value = Math.random() * 2 - 1;
          break;
        default:
          throw new Error(`[Hydrakit] Unsupported LFO waveform: ${waveform}`);
      }
      const scaled = value * amplitude;
      return transform ? transform(scaled) : scaled;
    };
  }

  /**
   * Returns random integer in range [from, to]
   */
  function randInt(from, to) {
    return Math.floor(Math.random() * (to - from + 1) + from);
  }

  /**
   * Balanced random float in range [-0.5, 0.5]
   */
  function rx() {
    return Math.random() - 0.5;
  }

  /**
   * Template string function evaluator: f`x => x * 2`
   */
  const f = (...args) => new Function("return " + String.raw(...args));

  /**
   * Call-site keyed target value smoothing/easing across frame re-evaluations
   */
  const _xxxStorage = {};
  const xxx = target => {
    try {
      const stackLines = new Error().stack.split("\n");
      const callLine = stackLines[2] || stackLines[1] || "";
      const match = callLine.match(/<anonymous>:(\d+:\d+)/) || callLine.match(/:(\d+:\d+)/);
      const key = match ? match[1] : "default";
      if (!_xxxStorage[key]) {
        _xxxStorage[key] = target;
      }
      let current = _xxxStorage[key];
      return () => {
        if (Math.abs(target - current) >= 1 / 30) {
          current += (target - current) / 30;
          _xxxStorage[key] = current;
        } else {
          _xxxStorage[key] = target;
        }
        return current;
      };
    } catch (e) {
      return () => target;
    }
  };

  /**
   * Euclidean-style beat pattern generator
   */
  const beatPattern = (length, hits, map = e => e) => {
    hits = Math.floor(Math.min(length, hits));
    const arr = new Array(Math.floor(length)).fill(0);
    while (hits > 0) {
      const r = Math.floor(Math.random() * length);
      if (!arr[r]) {
        arr[r] = 1;
        hits--;
      }
    }
    return arr.map(map);
  };

  /**
   * Single-invocation function wrapper
   */
  function once(fn) {
    let called = false;
    let result;
    return function (...args) {
      if (!called) {
        called = true;
        result = fn.apply(this, args);
      }
      return result;
    };
  }

  /**
   * Hex or RGB color solid generator without eval
   */
  function color(...args) {
    function hexToRgb(hex) {
      if (hex.startsWith("#")) hex = hex.slice(1);
      const r = (parseInt(hex.slice(0, 2), 16) / 255).toPrecision(4);
      const g = (parseInt(hex.slice(2, 4), 16) / 255).toPrecision(4);
      const b = (parseInt(hex.slice(4, 6), 16) / 255).toPrecision(4);
      return {
        r: Number(r),
        g: Number(g),
        b: Number(b)
      };
    }
    let r = 0,
      g = 0,
      b = 0;
    if (args.length === 1 && typeof args[0] === "string") {
      const rgb = hexToRgb(args[0]);
      r = rgb.r;
      g = rgb.g;
      b = rgb.b;
    } else {
      r = Number(args[0]) || 0;
      g = Number(args[1]) || 0;
      b = Number(args[2]) || 0;
    }
    if (typeof window !== "undefined" && typeof window.solid === "function") {
      return window.solid(r, g, b);
    }
    return ({
      time
    }) => {
      if (typeof window !== "undefined" && typeof window.solid === "function") {
        return window.solid(r, g, b);
      }
    };
  }

  // --- Plugin System Registration ---
  if (typeof window !== "undefined" && window.HydraliskPlugins) {
    window.HydraliskPlugins.register({
      id: "hydrakit",
      name: "Hydrakit Helpers & WebMIDI CC Engine",
      init(app) {
        tapTempo.setAppContext(app);
        if (app.on) {
          app.on("taptempo", () => tapTempo.tap());
          app.on("bpm:taptempo", () => tapTempo.tap());
        }
        app.expose("midiEngine", midiEngine);
        app.expose("tapTempo", tapTempo);
        app.expose("midi", midi);
        app.expose("saw", saw);
        app.expose("createLFO", createLFO);
        app.expose("randInt", randInt);
        app.expose("rx", rx);
        app.expose("f", f);
        app.expose("xxx", xxx);
        app.expose("beatPattern", beatPattern);
        app.expose("once", once);
        app.expose("color", color);
      }
    });
  }

  var midiMapping = {};

  /**
   * MIDI Mapping Module for Hydra
   * Allows assigning Hydra actions to MIDI controls (CC and Note On).
   * Mappings are stored in localStorage and loaded on init.
   */
  var hasRequiredMidiMapping;
  function requireMidiMapping() {
    if (hasRequiredMidiMapping) return midiMapping;
    hasRequiredMidiMapping = 1;
    (function () {

      const STORAGE_KEY = "hydra-midi-mapping";
      const CC_TRIGGER_THRESHOLD = 0.5;
      const WAITING_TIMEOUT_MS = 15000;

      // Mappable actions: action ID -> config
      // Trigger: { action, payload?, label? } - emits event when CC > threshold or on note
      // Bind: { callback: (value) => {}, label? } - calls callback with CC value (0-1) on every change
      const MAPPABLE_ACTIONS = {
        "gallery:nextSketch": {
          action: "gallery:nextSketch",
          label: "Next sketch"
        },
        "gallery:prevSketch": {
          action: "gallery:nextSketch",
          payload: {
            backwards: true
          },
          label: "Prev sketch"
        },
        "gallery:randomSketch": {
          action: "gallery:randomSketch",
          label: "Random Sketch"
        },
        "editor:randomize": {
          action: "editor:randomize",
          label: "Randomize"
        },
        "editor:jumpBack1": {
          action: "editor:jumpBack1",
          label: "Jump back 1"
        },
        "editor:jumpBack5": {
          action: "editor:jumpBack5",
          label: "Jump back 5"
        },
        "gfx:speedReverse": {
          action: "gfx:speedReverse",
          label: "Speed reverse"
        },
        "editor:quickSave": {
          action: "editor:quickSave",
          label: "Quick save"
        },
        "editor:quickLoad": {
          action: "editor:quickLoad",
          label: "Quick load"
        },
        "editor:toggleAutomutate|off": {
          action: "editor:toggleAutomutate",
          payload: {
            lastCombo: "Shift-Ctrl-0"
          },
          label: "Automutate off"
        },
        "editor:toggleAutomutate|1x": {
          action: "editor:toggleAutomutate",
          payload: {
            lastCombo: "Shift-Ctrl-1"
          },
          label: "Automutate 1x"
        },
        "editor:toggleAutomutate|2x": {
          action: "editor:toggleAutomutate",
          payload: {
            lastCombo: "Shift-Ctrl-2"
          },
          label: "Automutate 2x"
        },
        "editor:toggleAutomutate|4x": {
          action: "editor:toggleAutomutate",
          payload: {
            lastCombo: "Shift-Ctrl-3"
          },
          label: "Automutate 4x"
        },
        "editor:toggleAutomutate|8x": {
          action: "editor:toggleAutomutate",
          payload: {
            lastCombo: "Shift-Ctrl-4"
          },
          label: "Automutate 8x"
        },
        "editor:toggleAutomutate|16x": {
          action: "editor:toggleAutomutate",
          payload: {
            lastCombo: "Shift-Ctrl-5"
          },
          label: "Automutate 16x"
        },
        "taptempo": {
          action: "taptempo",
          label: "Tap tempo"
        },
        "fullscreen": {
          action: "fullscreen",
          label: "Toggle Fullscreen"
        },
        "hideAll": {
          action: "hideAll",
          label: "Hide/Show UI"
        },
        // Example CC bind - callback receives normalized value (0-1)
        speed: {
          callback: value => {
            // value is between 0 and 1, it should be mapped to speed between
            // This is a logarithmic scale, so we need to use a logarithmic function to map the value to the speed.
            // value: 0 => 0
            // value: 0.5 => 1
            // value: 1 => 8
            const speed = Math.pow(2, value * 2) - 1;
            if (window.speed !== undefined) window.speed = speed;
          },
          label: "Speed (CC bind)"
        },
        ...["A", "B", "C", "D"].map(midiShortcut => {
          return {
            ['midi' + midiShortcut]: {
              callback: value => {
                // Example of a CC bind that uses the global cc['A'] / cc['B'] / cc['C'] / cc['D'] value
                console.log(`MIDI ${midiShortcut} value:`, value);
                // reusable as `midi('A', { min: 0, max: 10, transform: v => Math.round(v * 10) })` for example
                window.cc[midiShortcut] = value;
              },
              label: `midi('${midiShortcut}', {min, max, transform}) cc bind`
            }
          };
        }).reduce((acc, curr) => ({
          ...acc,
          ...curr
        }), {})
      };
      let mapping = {};
      let waitingForAction = null;
      let waitingTimeoutId = null;
      function loadMapping() {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          mapping = stored ? JSON.parse(stored) : {};
          return mapping;
        } catch (e) {
          console.warn("MIDI Mapping: failed to load from localStorage", e);
          return {};
        }
      }
      function saveMapping() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
        } catch (e) {
          console.warn("MIDI Mapping: failed to save to localStorage", e);
        }
      }
      function getFullMapping() {
        return mapping;
      }
      function formatMappingDesc(m) {
        if (!m) return "—";
        if (m.type === "cc") return `CC ${m.control} (ch ${m.channel})`;
        if (m.type === "note") return `Note ${m.note} (ch ${m.channel})`;
        return "—";
      }
      function findActionForMessage(channel, type, controlOrNote) {
        const full = getFullMapping();
        const hits = [];
        for (const [action, m] of Object.entries(full)) {
          if (!m) continue;
          if (m.type === type && m.channel === channel) {
            if (type === "cc" && m.control === controlOrNote) hits.push(action);
            if (type === "note" && m.note === controlOrNote) hits.push(action);
          }
        }
        return hits;
      }
      function createMIDIHandler() {
        return function handleMIDIMessage(midiMessage) {
          const data = midiMessage.data;
          if (!data || data.length < 3) return;
          const kind = data[0];
          const channel = kind & 0x0f;
          const byte1 = data[1];
          const byte2 = data[2];
          const valNormalized = (byte2 > 64 ? byte2 + 1 : byte2) / 128.0;

          // Check if we're in assignment waiting mode
          if (waitingForAction) {
            const config = MAPPABLE_ACTIONS[waitingForAction];
            config && typeof config.callback === "function";
            let assignment = null;
            if ((kind & 0xf0) === 0xb0) {
              assignment = {
                type: "cc",
                channel,
                control: byte1
              };
            } else if ((kind & 0xf0) === 0x90 && byte2 > 0) {
              assignment = {
                type: "note",
                channel,
                note: byte1
              };
            }
            if (assignment) {
              mapping[waitingForAction] = assignment;
              saveMapping();
              waitingForAction = null;
              if (waitingTimeoutId) {
                clearTimeout(waitingTimeoutId);
                waitingTimeoutId = null;
              }
              if (window.midiMapping && window.midiMapping.render) {
                window.midiMapping.render();
              }
            }
            return;
          }

          // Check mapping for action trigger or CC bind
          const status = kind & 0xf0;
          if (status === 0xb0) {
            const actions = findActionForMessage(channel, "cc", byte1);
            for (const actionId of actions) {
              if (actionId) {
                const config = MAPPABLE_ACTIONS[actionId];
                if (config) {
                  if (typeof config.callback === "function") {
                    config.callback(valNormalized);
                  } else if (config.action && valNormalized > CC_TRIGGER_THRESHOLD && window.xemitter) {
                    window.xemitter.emit(config.action, config.payload || {});
                  }
                }
              }
            }
          } else if (status === 0x90 && byte2 > 0) {
            const actions = findActionForMessage(channel, "note", byte1);
            for (const actionId of actions) {
              if (actionId) {
                const config = MAPPABLE_ACTIONS[actionId];
                if (config && window.xemitter) {
                  if (typeof config.callback === "function") {
                    config.callback(valNormalized);
                  } else {
                    window.xemitter.emit(config.action, config.payload || {});
                  }
                }
              }
            }
          }
        };
      }
      function attachInput(input, handler) {
        if (!input) return;
        input.removeEventListener("midimessage", handler);
        input.addEventListener("midimessage", handler);
      }
      function setupMIDIHandler() {
        if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) return;
        navigator.requestMIDIAccess().then(function (midiAccess) {
          const handler = createMIDIHandler();
          for (const input of midiAccess.inputs.values()) {
            attachInput(input, handler);
          }
          midiAccess.onstatechange = e => {
            if (e.port && e.port.type === "input" && e.port.state === "connected") {
              console.log(`[midi-mapping] Hot-plugged MIDI device: ${e.port.name}`);
              attachInput(e.port, handler);
            }
          };
          console.log("MIDI Mapping: handler installed via addEventListener");
        }, function () {
          console.warn("MIDI Mapping: could not access MIDI devices");
        });
      }

      // --- Modal UI (vanilla DOM) ---
      let modalContainer = null;
      function createModal() {
        const container = document.createElement("div");
        container.id = "midi-mapping-app";
        document.body.appendChild(container);
        modalContainer = container;
        renderModal();
      }
      function renderModal() {
        if (!modalContainer) return;
        if (!document.body.contains(modalContainer)) {
          document.body.appendChild(modalContainer);
        }
        const fullMapping = getFullMapping();
        const isVisible = modalContainer.getAttribute("data-visible") === "true";
        modalContainer.innerHTML = "";
        if (!isVisible) return;
        const overlay = document.createElement("div");
        overlay.className = "midi-mapping-overlay";
        overlay.onclick = function (e) {
          if (e.target === overlay) toggleModal();
        };
        const modal = document.createElement("div");
        modal.className = "midi-mapping-modal";
        modal.onclick = function (e) {
          e.stopPropagation();
        };
        const header = document.createElement("div");
        header.className = "midi-mapping-header";
        header.innerHTML = '<h5>MIDI Mapping</h5><span class="midi-mapping-close">&times;</span>';
        header.querySelector(".midi-mapping-close").onclick = toggleModal;
        const body = document.createElement("div");
        body.className = "midi-mapping-body";
        const list = document.createElement("ul");
        list.className = "midi-mapping-list";
        for (const [actionId, config] of Object.entries(MAPPABLE_ACTIONS)) {
          const actionLabel = config.label || actionId;
          const li = document.createElement("li");
          li.className = "midi-mapping-row";
          const current = fullMapping[actionId];
          const isWaiting = waitingForAction === actionId;
          const label = document.createElement("span");
          label.className = "midi-mapping-action";
          label.textContent = actionLabel;
          const mappingSpan = document.createElement("span");
          mappingSpan.className = "midi-mapping-value";
          mappingSpan.textContent = isWaiting ? "Listening..." : formatMappingDesc(current);
          const assignBtn = document.createElement("button");
          assignBtn.className = "midi-mapping-btn";
          assignBtn.textContent = isWaiting ? "Cancel" : "Assign";
          assignBtn.disabled = isWaiting;
          assignBtn.onclick = function () {
            if (isWaiting) {
              waitingForAction = null;
              if (waitingTimeoutId) {
                clearTimeout(waitingTimeoutId);
                waitingTimeoutId = null;
              }
            } else {
              waitingForAction = actionId;
              if (waitingTimeoutId) clearTimeout(waitingTimeoutId);
              waitingTimeoutId = setTimeout(function () {
                waitingForAction = null;
                waitingTimeoutId = null;
                renderModal();
              }, WAITING_TIMEOUT_MS);
            }
            renderModal();
          };
          const clearBtn = document.createElement("button");
          clearBtn.className = "midi-mapping-btn midi-mapping-clear";
          clearBtn.textContent = "Clear";
          clearBtn.style.display = current && mapping[actionId] ? "inline-block" : "none";
          clearBtn.onclick = function () {
            delete mapping[actionId];
            saveMapping();
            renderModal();
          };
          li.appendChild(label);
          li.appendChild(mappingSpan);
          li.appendChild(assignBtn);
          li.appendChild(clearBtn);
          list.appendChild(li);
        }
        body.appendChild(list);
        modal.appendChild(header);
        modal.appendChild(body);
        overlay.appendChild(modal);
        modalContainer.appendChild(overlay);
      }
      function toggleModal() {
        if (!modalContainer) return;
        const isVisible = modalContainer.getAttribute("data-visible") === "true";
        modalContainer.setAttribute("data-visible", !isVisible);
        renderModal();
      }
      function openModal() {
        if (!modalContainer) {
          createModal();
        }
        modalContainer.setAttribute("data-visible", "true");
        renderModal();
      }
      function init() {
        loadMapping();
        setupMIDIHandler();
        createModal();
        if (window.xemitter) {
          window.xemitter.on("midi-mapping:open", openModal);
        }
        window.midiMapping = {
          open: openModal,
          toggle: toggleModal,
          render: renderModal,
          getMapping: getFullMapping
        };
        console.log("MIDI Mapping module loaded");
      }
      if (typeof window !== "undefined" && window.HydraliskPlugins) {
        window.HydraliskPlugins.register({
          id: "midi-mapping",
          name: "MIDI Mapping UI & Actions",
          init(app) {
            if (app.emitter) {
              app.emitter.on("midi-mapping:open", openModal);
            }
            app.expose("midiMapping", window.midiMapping);
          }
        });
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
      } else {
        init();
      }
    })();
    return midiMapping;
  }

  requireMidiMapping();

  window.initializeConvolutions = () => {
    {
      const getHydra = function () {
        return window.hydra;
      };
      window._hydra = getHydra();
      window._hydraScope = _hydra.sandbox.makeGlobal ? window : _hydra.synth;
    }
    {
      function generateJumps(height, width) {
        const middleY = Math.floor(height / 2);
        const middleX = Math.floor(width / 2);
        let jumpTable = Array.from({
          length: height
        }, () => []);
        for (let y = 0; y < height; y++) {
          const posY = (middleY - y).toFixed(1);
          for (let x = 0; x < width; x++) {
            const posX = (middleX - x).toFixed(1);
            const vec2 = `vec2(${posX}, ${posY})`;
            jumpTable[y].push(vec2);
          }
        }
        return jumpTable.flat();
      }
      function processElement(element) {
        return typeof element === "string" ? `(${element})` : element.toFixed(9);
      }
      function generateWeights(kernel) {
        const weights = kernel.flat().map(processElement);
        const hasParameters = weights.some(x => x.includes("k"));
        weights.hasParameters = hasParameters;
        return weights;
      }
      function generateConvolutionFunction(obj, settings) {
        const name = obj.name + settings.nameSufix;
        const kernel = obj.kernel;
        const multiplier = processElement(obj.multiplier || 1);
        const [height, width] = [kernel.length, kernel[0].length];
        const weights = generateWeights(kernel);
        const jumps = generateJumps(height, width);
        const hasParameters = weights.hasParameters;
        const {
          prefix,
          newLine,
          sufix
        } = settings;
        let code = prefix + "\n";
        weights.forEach((weight, i) => {
          const jump = jumps[i];
          if (weight == 0) return;
          const line = newLine(weight, jump);
          code += line + "\n";
        });
        code += sufix(multiplier);
        const inputs = [{
          name: "_tex0",
          type: "sampler2D",
          default: o0
        }, {
          name: "jump",
          type: "float",
          default: 1
        }, {
          name: "amp",
          type: "float",
          default: 1
        }];
        if (hasParameters) {
          inputs.splice(1, 0, {
            name: "k",
            type: "float",
            default: 1
          });
        }
        const func = {
          name,
          type: "src",
          inputs,
          glsl: code
        };
        return func;
      }
      function generateConvolutionFunctionRegular(obj) {
        const regularSettings = {
          nameSufix: "",
          prefix: "vec3 outputColor = vec3(0.0); vec2 res = resolution.xy;",
          newLine: (weight, jump) => `outputColor += (${weight}) * texture2D(_tex0, _st + (${jump} * jump / res)).rgb;`,
          sufix: multiplier => `return vec4(outputColor * ${multiplier} * amp, texture2D(_tex0, _st).a);`
        };
        return generateConvolutionFunction(obj, regularSettings);
      }
      function generateConvolutionFunctionForLuma(obj) {
        const ySettings = {
          nameSufix: "Luma",
          prefix: "float outputLuma = 0.0; vec2 res = resolution.xy;",
          newLine: (weight, jump) => `outputLuma += (${weight}) * _luminance(texture2D(_tex0, _st + (${jump} * jump / res)).rgb);`,
          sufix: multiplier => `return vec4(vec3(outputLuma * ${multiplier} * amp), texture2D(_tex0, _st).a);`
        };
        return generateConvolutionFunction(obj, ySettings);
      }
      function generateConvolutionFunctionForY(obj) {
        const ySettings = {
          nameSufix: "OnY",
          prefix: `
              mat3 rgb2yuv = mat3(0.2126, 0.7152, 0.0722, -0.09991, -0.33609, 0.43600, 0.615, -0.5586, -0.05639);
              mat3 yuv2rgb = mat3(1.0, 0.0, 1.28033, 1.0, -0.21482, -0.38059, 1.0, 2.12798, 0.0);
              float outputY = 0.0;
              vec2 res = resolution.xy;
            `,
          newLine: (weight, jump) => `outputY += (${weight}) * (texture2D(_tex0, _st + (${jump} * jump / res)).rgb * rgb2yuv).x;`,
          sufix: multiplier => `
              vec4 outputColor = texture2D(_tex0, _st);
              vec3 yuv = outputColor.rgb * rgb2yuv;
              yuv.x = outputY * ${multiplier};
              outputColor.rgb = yuv * yuv2rgb * amp;
              return outputColor;
            `
        };
        return generateConvolutionFunction(obj, ySettings);
      }
      function generateConvolutionFunctionForUV(obj) {
        const uvSettings = {
          nameSufix: "OnUV",
          prefix: `
              mat3 rgb2yuv = mat3(0.2126, 0.7152, 0.0722, -0.09991, -0.33609, 0.43600, 0.615, -0.5586, -0.05639);
              mat3 yuv2rgb = mat3(1.0, 0.0, 1.28033, 1.0, -0.21482, -0.38059, 1.0, 2.12798, 0.0);
              vec2 outputUV = vec2(0.0);
              vec2 res = resolution.xy;
            `,
          newLine: (weight, jump) => `outputUV += (${weight}) * (texture2D(_tex0, _st + (${jump} * jump / res)).rgb * rgb2yuv).yz;`,
          sufix: multiplier => `
              vec4 outputColor = texture2D(_tex0, _st);
              vec3 yuv = outputColor.rgb * rgb2yuv;
              yuv.yz = outputUV  * ${multiplier};
              outputColor.rgb = yuv * yuv2rgb * amp;
              return outputColor;
            `
        };
        return generateConvolutionFunction(obj, uvSettings);
      }
      function generateConvolutionFunctionForIQ(obj) {
        const iqSettings = {
          nameSufix: "OnIQ",
          prefix: `
              mat3 rgb2yiq = mat3(0.299, 0.587, 0.114, 0.5959, -0.2746, -0.3213, 0.2115, -0.5227, 0.3112);
              mat3 yiq2rgb = mat3(1.0, 0.956, 0.619, 1.0, -0.272, -0.647, 1.0, -1.106, 1.703);
              vec2 outputIQ = vec2(0.0);
              vec2 res = resolution.xy;
            `,
          newLine: (weight, jump) => `outputIQ += (${weight}) * (texture2D(_tex0, _st + (${jump} * jump / res)).rgb * rgb2yiq).yz;`,
          sufix: multiplier => `
              vec4 outputColor = texture2D(_tex0, _st);
              vec3 yiq = outputColor.rgb * rgb2yiq;
              yiq.yz = outputIQ * ${multiplier};
              outputColor.rgb = yiq * yiq2rgb * amp;
              return outputColor;
            `
        };
        return generateConvolutionFunction(obj, iqSettings);
      }
      function setConvolutionFunction(definition) {
        const definitions = [generateConvolutionFunctionRegular(definition), generateConvolutionFunctionForLuma(definition), generateConvolutionFunctionForY(definition), generateConvolutionFunctionForUV(definition), generateConvolutionFunctionForIQ(definition)];
        definitions.forEach(_hydra.synth.setFunction);
      }
      _hydraScope.setConvolutionFunction = setConvolutionFunction;
    }
    {
      // convolution kernel lists
      const convolutionKernels = [{
        name: "sharpen",
        kernel: [[0, "-k", 0], ["-k", "(4.0*k)+1.0", "-k"], [0, "-k", 0]]
      }, {
        name: "sharpenMore",
        kernel: [["-k", "-k", "-k"], ["-k", "(8.0*k)+1.0", "-k"], ["-k", "-k", "-k"]]
      }, {
        name: "lineSharpen",
        kernel: [["-k", "(2.0*k)+1.0", "-k"]]
      }, {
        name: "emboss",
        kernel: [["-2.0*k", "-k", 0], ["-k", 1, "k"], [0, "k", "2.0*k"]]
      }, {
        name: "blur",
        kernel: [[1, 2, 1], [2, 4, 2], [1, 2, 1]],
        multiplier: 1 / 16
      }, {
        name: "blur5",
        kernel: [[1, 4, 7, 4, 1], [4, 16, 26, 16, 4], [7, 26, 41, 26, 7], [4, 16, 26, 16, 4], [1, 4, 7, 4, 1]],
        multiplier: 1 / 273
      }, {
        name: "blur7",
        kernel: [[0, 0, 1, 2, 1, 0, 0], [0, 3, 13, 22, 13, 3, 0], [1, 13, 59, 97, 59, 13, 1], [2, 22, 97, 159, 97, 22, 2], [1, 13, 59, 97, 59, 13, 1], [0, 3, 13, 22, 13, 3, 0], [0, 0, 1, 2, 1, 0, 0]],
        multiplier: 1 / 1003
      }, {
        name: "boxBlur",
        kernel: [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
        multiplier: 1 / 9
      }, {
        name: "boxBlur5",
        kernel: [[1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1]],
        multiplier: 1 / 25
      }, {
        name: "horizontalBlur",
        kernel: [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
        multiplier: 1 / 5
      }, {
        name: "verticalBlur",
        kernel: [[0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0]],
        multiplier: 1 / 5
      }, {
        name: "diagonalBlur",
        kernel: [[0, 0, 0, 0, 1], [0, 0, 0, 1, 0], [0, 0, 1, 0, 0], [0, 1, 0, 0, 0], [1, 0, 0, 0, 0]],
        multiplier: 1 / 5
      }, {
        name: "diagonalBlur2",
        kernel: [[1, 0, 0, 0, 0], [0, 1, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 1, 0], [0, 0, 0, 0, 1]],
        multiplier: 1 / 5
      }, {
        name: "lineBlur",
        kernel: [[1, 2, 1]],
        multiplier: 1 / 4
      }, {
        name: "lineBlur5",
        kernel: [[7, 26, 41, 26, 7]],
        multiplier: 1 / 107
      }, {
        name: "sobelY",
        kernel: [[1, 2, 1], [0, 0, 0], [-1, -2, -1]]
      }, {
        name: "sobelX",
        kernel: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
      }, {
        name: "sobelDiagonal",
        kernel: [[2, 1, 0], [1, 0, -1], [0, -1, -2]]
      }, {
        name: "sobelDiagonal2",
        kernel: [[0, 1, 2], [-1, 0, 1], [-2, -1, 0]]
      }, {
        name: "prewittY",
        kernel: [[1, 1, 1], [0, 0, 0], [-1, -1, -1]]
      }, {
        name: "prewittX",
        kernel: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]]
      }, {
        name: "prewittDiagonal",
        kernel: [[1, 1, 0], [1, 0, -1], [0, -1, -1]]
      }, {
        name: "prewittDiagonal2",
        kernel: [[0, 1, 1], [-1, 0, 1], [-1, -1, 0]]
      }, {
        name: "edge",
        kernel: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]]
      }];
      convolutionKernels.forEach(_hydraScope.setConvolutionFunction);
    }
  };
  if (typeof window !== "undefined" && window.HydraliskPlugins) {
    window.HydraliskPlugins.register({
      id: "convolutions",
      name: "GLSL Convolution Kernels",
      onHydraReady(hydra, app) {
        if (typeof window.initializeConvolutions === "function" && !window.initializeConvolutions.done) {
          window.initializeConvolutions();
          window.initializeConvolutions.done = true;
        }
      }
    });
  }

  window.threeObjects = {
    init: function () {
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      this.light = new THREE.PointLight(0xffffff, 1, 100);
      this.light.position.set(10, 10, 10);
      this.scene.add(this.light);
      this.renderer = new THREE.WebGLRenderer();
      this.renderer.setSize(width, height);
      this.camera.position.z = 1.5;
    },
    cube: function () {
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00
      });
      const cube = new THREE.Mesh(geometry, material);
      this.scene.add(cube);
      return cube;
    },
    orbital: function (count = 10) {
      const cubes = [];
      const phaseStep = Math.PI * 2 / count;
      for (let i = 0; i < count; i++) {
        const phase = i * phaseStep;
        const size = Math.random();
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({
          color: Math.random() * 0xffffff,
          emissive: Math.random() * 0xffffff
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = Math.cos(phase);
        cube.position.y = Math.sin(phase);
        this.scene.add(cube);
        cubes.push(cube);
      }
      cubes.animate = function () {
        this.forEach((cube, index) => {
          const phase = index * phaseStep + Date.now() * 0.001;
          cube.position.x = Math.cos(phase);
          cube.position.y = Math.sin(phase);
          cube.rotation.x += 0.01;
          cube.rotation.y += 0.01;
        });
      };
      return cubes;
    }
  };

  // 'update' is a reserved function that will be run every time the main hydra rendering context is updated
  window.update = () => {
    if (typeof cube !== "undefined" && typeof renderer !== "undefined") {
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    }
  };
  if (typeof window !== "undefined" && window.HydraliskPlugins) {
    window.HydraliskPlugins.register({
      id: "three-objects",
      name: "Three.js Objects Helper",
      init(app) {
        app.expose("threeObjects", window.threeObjects);
      },
      onHydraReady(hydra, app) {
        if (window.THREE && window.threeObjects && typeof window.threeObjects.init === "function") {
          try {
            window.threeObjects.init();
          } catch (e) {
            console.warn("[three-objects] Could not auto-init canvas:", e.message);
          }
        }
      }
    });
  }

  // Barrel file for all Hydralisk modules, plugin registry, and extension plugins

  window.Modules = {
    SketchManager
  };
  if (typeof window !== "undefined" && window.HydraliskPlugins) {
    window.HydraliskPlugins.register({
      id: "sketch-manager",
      name: "React Sketch Manager Modal",
      init(app) {
        if (window.Modules && window.Modules.SketchManager) {
          window.sketchManager = new window.Modules.SketchManager();
          setTimeout(() => window.sketchManager.inject(), 100);
          app.expose("sketchManager", window.sketchManager);
        }
      }
    });
  }

})();
//# sourceMappingURL=modules.dist.js.map

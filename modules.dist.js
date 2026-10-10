(function (React$1) {
	'use strict';

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

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

	var css_248z = ".modal {\n    display: block;\n    position: fixed;\n    z-index: 500;\n    top: 50%;\n    left: 50%;\n    transform: translate(-50%, -50%);\n    background-color: white;\n    padding: 0;\n    border: 1px solid #ccc;\n    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);\n    color: #101010;\n    width: 480px;           /* Set a fixed width */\n    height: 520px;          /* Set a fixed height */\n    max-width: 95vw;\n    max-height: 95vh;\n}\n\n.modal textarea {\n    background: lightblue;\n    width: 100%;\n    height: 100px;\n    border: 1px solid #ccc;\n    border-radius: 4px;\n}\n\n.modal.hidden {\n    display: none;\n}\n\n.modal-content {\n    text-align: left;\n    height: 100%;\n    display: flex;\n    flex-direction: column;\n}\n\n.modal-header {\n    flex: 0 0 auto;\n    padding: 20px 20px 0 20px;\n    background: white;\n    z-index: 1;\n}\n\n.modal-tabs {\n    display: flex;\n    gap: 8px;\n    margin-bottom: 12px;\n}\n.modal-tabs button {\n    background: none;\n    border: none;\n    padding: 8px 16px;\n    cursor: pointer;\n    font-weight: bold;\n}\n.modal-tabs .active {\n    border-bottom: 2px solid #007bff;\n    color: #007bff;\n}\n.modal-body {\n    flex: 1 1 auto;\n    overflow-y: auto;\n    padding: 20px;\n    min-height: 100px;\n    background: white;\n}\n\n.close-button {\n    cursor: pointer;\n    font-size: 20px;\n    position: absolute;\n    top: 10px;\n    right: 10px;\n}\n\n.sketch-tag {\n    background: #e0e7ff;\n    color: #2d3a5a;\n    border-radius: 12px;\n    padding: 2px 10px;\n    font-size: 12px;\n    margin-left: 2px;\n    white-space: nowrap;\n    display: inline-block;\n    max-width: 80px;\n    overflow: hidden;\n    text-overflow: ellipsis;\n}\n\n.sketch-list-item {\n    transition: background 0.15s;\n    padding: 6px 0;\n    border-bottom: 1px solid #eee;\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    cursor: pointer;\n    background: white;\n}\n.sketch-list-item:hover {\n    background: #f0f4ff;\n    cursor: pointer;\n}\n\n.sketch-list-item--remote {\n    background: #e8f5e9;\n}\n.sketch-list-item--remote:hover {\n    background: #c8e6c9;\n}\n\n.sketch-fields-label {\n    width: 120px;\n    margin-right: 8px;\n    font-weight: 500;\n}\n\n.sketch-fields-input,\n.metadata-fields-input {\n    flex: 1;\n    min-height: 32px;\n    font-family: monospace;\n    font-size: 14px;\n    margin-right: 8px;\n}\n\n.metadata-key-input {\n    width: 120px;\n    margin-right: 8px;\n    background: #f5f5f5;\n    color: #888;\n}\n\n.sketch-fields-section {\n    margin-bottom: 16px;\n}\n\n.sketch-fields-title,\n.metadata-fields-title {\n    font-weight: 600;\n    margin-bottom: 4px;\n}\n\n.metadata-add-row {\n    display: flex;\n    align-items: center;\n    margin-top: 12px;\n}\n\n.save-sketch-btn {\n    font-weight: bold;\n    padding: 8px 20px;\n    margin-top: 20px;\n}\n\n.sketch-filter {\n    width: 100%;\n    padding: 8px;\n    border: 1px solid #ccc;\n    border-radius: 4px;\n    font-size: 14px;\n    margin-bottom: 4px;\n}\n\n.sketch-list {\n    max-height: 300px;\n    overflow-y: auto;\n    margin-bottom: 8px;\n    padding-inline-start: 0;\n}\n\n.sketch-list-item {\n    padding: 8px 12px;\n}\n\n/* --- Search Filter & Tag Cloud Styling --- */\n.sketch-tag-pill {\n    user-select: none;\n}\n.sketch-tag-pill:hover {\n    opacity: 0.9;\n    transform: translateY(-1px);\n}\n.sketch-tag-pill--selected {\n    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.4);\n}\n\n/* --- Setlist Manager Styling --- */\n.setlist-manager-panel select,\n.setlist-manager-panel button,\n.setlist-manager-panel input {\n    font-family: inherit;\n}\n\n.setlist-items-list::-webkit-scrollbar {\n    width: 6px;\n}\n.setlist-items-list::-webkit-scrollbar-thumb {\n    background: #cbd5e1;\n    border-radius: 3px;\n}";
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
	 * Filters sketches to those in the collection's sketchIds array, preserving explicit setlist item order.
	 * sketchIds items can be string IDs/names or item objects ({ sketchId, bpm, notes, transition }).
	 * @param {Object[]} sketches - All available sketches
	 * @param {(string|Object)[]} sketchIds - Collection member ids/names or item objects
	 * @returns {Object[]} Filtered sketches in exact setlist order with attached _setlistMeta
	 */
	function filterSketchesByCollection(sketches, sketchIds) {
	  if (!sketchIds || sketchIds.length === 0) return [];

	  // Map available sketches by id and name for quick lookup
	  const sketchMap = new Map();
	  sketches.forEach(sketch => {
	    if (sketch.id) sketchMap.set(sketch.id, sketch);
	    if (sketch.name) sketchMap.set(sketch.name, sketch);
	  });
	  const result = [];
	  sketchIds.forEach(item => {
	    const id = typeof item === 'string' ? item : item?.sketchId;
	    if (id && sketchMap.has(id)) {
	      const sketch = sketchMap.get(id);
	      const setlistMeta = typeof item === 'object' && item !== null ? item : {
	        sketchId: id
	      };
	      result.push({
	        ...sketch,
	        _setlistMeta: setlistMeta
	      });
	    }
	  });
	  return result;
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
	      name: collection.name || 'Unnamed Setlist',
	      sketchIds: Array.isArray(collection.sketchIds) ? [...collection.sketchIds] : [],
	      description: collection.description || '',
	      updatedAt: new Date().toISOString()
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
	  addSketchToCollection(collectionId, sketchIdOrName, itemMeta = {}) {
	    const state = this._read();
	    const col = state.collections.find(c => c.id === collectionId);
	    if (!col) return;
	    const exists = col.sketchIds.some(item => (typeof item === 'string' ? item : item?.sketchId) === sketchIdOrName);
	    if (exists) return;
	    const entry = Object.keys(itemMeta).length > 0 ? {
	      sketchId: sketchIdOrName,
	      ...itemMeta
	    } : sketchIdOrName;
	    col.sketchIds.push(entry);
	    col.updatedAt = new Date().toISOString();
	    this._write(state);
	  }
	  addMultipleSketchesToCollection(collectionId, sketchIdOrNameList) {
	    const state = this._read();
	    const col = state.collections.find(c => c.id === collectionId);
	    if (!col || !Array.isArray(sketchIdOrNameList)) return;
	    const existingSet = new Set(col.sketchIds.map(item => typeof item === 'string' ? item : item?.sketchId));
	    sketchIdOrNameList.forEach(id => {
	      if (id && !existingSet.has(id)) {
	        col.sketchIds.push(id);
	        existingSet.add(id);
	      }
	    });
	    col.updatedAt = new Date().toISOString();
	    this._write(state);
	  }
	  removeSketchFromCollection(collectionId, indexOrId) {
	    const state = this._read();
	    const col = state.collections.find(c => c.id === collectionId);
	    if (!col) return;
	    if (typeof indexOrId === 'number' && indexOrId >= 0 && indexOrId < col.sketchIds.length) {
	      col.sketchIds.splice(indexOrId, 1);
	    } else {
	      col.sketchIds = col.sketchIds.filter(item => {
	        const id = typeof item === 'string' ? item : item?.sketchId;
	        return id !== indexOrId;
	      });
	    }
	    col.updatedAt = new Date().toISOString();
	    this._write(state);
	  }
	  removeMultipleSketchesFromCollection(collectionId, sketchIdOrNameList) {
	    const state = this._read();
	    const col = state.collections.find(c => c.id === collectionId);
	    if (!col || !Array.isArray(sketchIdOrNameList)) return;
	    const toRemoveSet = new Set(sketchIdOrNameList);
	    col.sketchIds = col.sketchIds.filter(item => {
	      const id = typeof item === 'string' ? item : item?.sketchId;
	      return !toRemoveSet.has(id);
	    });
	    col.updatedAt = new Date().toISOString();
	    this._write(state);
	  }
	  moveSketch(collectionId, fromIndex, toIndex) {
	    const state = this._read();
	    const col = state.collections.find(c => c.id === collectionId);
	    if (!col || fromIndex < 0 || fromIndex >= col.sketchIds.length || toIndex < 0 || toIndex >= col.sketchIds.length) {
	      return;
	    }
	    const [moved] = col.sketchIds.splice(fromIndex, 1);
	    col.sketchIds.splice(toIndex, 0, moved);
	    col.updatedAt = new Date().toISOString();
	    this._write(state);
	  }
	  updateSetlistItem(collectionId, index, newMeta) {
	    const state = this._read();
	    const col = state.collections.find(c => c.id === collectionId);
	    if (!col || index < 0 || index >= col.sketchIds.length) return;
	    const existing = col.sketchIds[index];
	    const sketchId = typeof existing === 'string' ? existing : existing?.sketchId;
	    col.sketchIds[index] = {
	      ...(typeof existing === 'object' ? existing : {
	        sketchId
	      }),
	      ...newMeta,
	      sketchId
	    };
	    col.updatedAt = new Date().toISOString();
	    this._write(state);
	  }
	  duplicateCollection(collectionId) {
	    const state = this._read();
	    const col = state.collections.find(c => c.id === collectionId);
	    if (!col) return null;
	    const dup = {
	      id: generateId(),
	      name: `${col.name} (Copy)`,
	      description: col.description || '',
	      sketchIds: JSON.parse(JSON.stringify(col.sketchIds)),
	      updatedAt: new Date().toISOString()
	    };
	    state.collections.push(dup);
	    this._write(state);
	    return dup;
	  }
	  createCollection(name, description = '') {
	    const collection = {
	      id: generateId(),
	      name: name || 'New Setlist',
	      description,
	      sketchIds: [],
	      updatedAt: new Date().toISOString()
	    };
	    this.saveCollection(collection);
	    return collection;
	  }
	  exportCollectionJSON(collectionId) {
	    const col = this.getCollections().collections.find(c => c.id === collectionId);
	    if (!col) return null;
	    return JSON.stringify(col, null, 2);
	  }
	  importCollectionJSON(jsonString) {
	    try {
	      const parsed = JSON.parse(jsonString);
	      if (!parsed.name || !Array.isArray(parsed.sketchIds)) {
	        throw new Error('Invalid setlist format');
	      }
	      parsed.id = generateId();
	      parsed.updatedAt = new Date().toISOString();
	      this.saveCollection(parsed);
	      return parsed;
	    } catch (err) {
	      console.error('Import setlist failed:', err);
	      return null;
	    }
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

	// --- SketchSearchFilter: React search & tag filtering component with fuzzy matching ---

	/**
	 * Calculates a fuzzy match score for a given query against target text.
	 * Returns score > 0 if query characters match sequentially, otherwise 0.
	 * Higher scores represent better matches (e.g. prefix match, word start match).
	 */
	function fuzzyMatchScore(query, target) {
	  if (!query) return 1; // Empty query matches everything
	  if (!target) return 0;
	  const q = query.toLowerCase().trim();
	  const t = target.toLowerCase();
	  if (t.includes(q)) {
	    // Substring match gets a boost proportional to position
	    const index = t.indexOf(q);
	    return 100 - index;
	  }

	  // Sequential character matching score
	  let qIdx = 0;
	  let score = 0;
	  let consecutive = 0;
	  for (let tIdx = 0; tIdx < t.length && qIdx < q.length; tIdx++) {
	    if (t[tIdx] === q[qIdx]) {
	      score += 10 + consecutive * 5;
	      if (tIdx === 0 || t[tIdx - 1] === ' ' || t[tIdx - 1] === '_' || t[tIdx - 1] === '-') {
	        score += 15; // Word boundary match boost
	      }
	      qIdx++;
	      consecutive++;
	    } else {
	      consecutive = 0;
	    }
	  }
	  return qIdx === q.length ? score : 0;
	}

	/**
	 * Filters and ranks sketches based on text search (fuzzy) and tag selection.
	 */
	function filterAndRankSketches(sketches, searchQuery, selectedTags = [], filterMode = 'all') {
	  if (!sketches || !Array.isArray(sketches)) return [];
	  const query = (searchQuery || '').trim();
	  const tagsLower = (selectedTags || []).map(t => String(t).toLowerCase());
	  return sketches.map(sketch => {
	    // Source mode filter (all / remote / local)
	    if (filterMode === 'remote' && !sketch.remote) return null;
	    if (filterMode === 'local' && sketch.remote) return null;

	    // Tag filter check
	    const sketchTags = Array.isArray(sketch.metadata?.tags) ? sketch.metadata.tags : [];
	    const sketchTagsLower = sketchTags.map(t => String(t).toLowerCase());
	    if (tagsLower.length > 0) {
	      const matchesTags = tagsLower.every(reqTag => sketchTagsLower.includes(reqTag));
	      if (!matchesTags) return null;
	    }
	    if (!query) {
	      return {
	        sketch,
	        score: 1
	      };
	    }

	    // Fuzzy match across name, description, tags, and code
	    const nameScore = fuzzyMatchScore(query, sketch.name || '');
	    const descScore = fuzzyMatchScore(query, sketch.description || sketch.metadata?.description || '');
	    const tagsText = sketchTags.join(' ');
	    const tagScore = fuzzyMatchScore(query, tagsText);
	    const codeScore = sketch.code ? sketch.code.toLowerCase().includes(query.toLowerCase()) ? 20 : 0 : 0;
	    const maxScore = Math.max(nameScore * 2, descScore * 1.2, tagScore * 1.5, codeScore);
	    return maxScore > 0 ? {
	      sketch,
	      score: maxScore
	    } : null;
	  }).filter(Boolean).sort((a, b) => b.score - a.score).map(item => item.sketch);
	}
	function SketchSearchFilter({
	  sketches = [],
	  searchQuery = '',
	  selectedTags = [],
	  filterMode = 'all',
	  onSearchQueryChange,
	  onTagToggle,
	  onClearTags,
	  onFilterModeChange,
	  totalCount = 0,
	  filteredCount = 0
	}) {
	  // Collect all unique tags across all available sketches
	  const allTagsMap = new Map();
	  sketches.forEach(sketch => {
	    const tags = Array.isArray(sketch.metadata?.tags) ? sketch.metadata.tags : [];
	    tags.forEach(tag => {
	      const clean = String(tag).trim();
	      if (clean) {
	        const lower = clean.toLowerCase();
	        allTagsMap.set(lower, clean); // preserve display casing
	      }
	    });
	  });
	  const uniqueTags = Array.from(allTagsMap.values()).sort((a, b) => a.localeCompare(b));
	  return /*#__PURE__*/React.createElement("div", {
	    className: "sketch-search-filter-container",
	    style: {
	      marginBottom: 12
	    }
	  }, /*#__PURE__*/React.createElement("div", {
	    style: {
	      display: 'flex',
	      gap: 8,
	      marginBottom: 8,
	      alignItems: 'center'
	    }
	  }, /*#__PURE__*/React.createElement("div", {
	    style: {
	      position: 'relative',
	      flex: 1
	    }
	  }, /*#__PURE__*/React.createElement("input", {
	    type: "text",
	    className: "sketch-filter",
	    placeholder: "\uD83D\uDD0D Search sketches (name, tags, code...)",
	    value: searchQuery,
	    onChange: e => onSearchQueryChange(e.target.value),
	    style: {
	      width: '100%',
	      paddingRight: searchQuery ? 28 : 8,
	      boxSizing: 'border-box'
	    }
	  }), searchQuery && /*#__PURE__*/React.createElement("button", {
	    title: "Clear search query",
	    onClick: () => onSearchQueryChange(''),
	    style: {
	      position: 'absolute',
	      right: 6,
	      top: '50%',
	      transform: 'translateY(-50%)',
	      background: 'none',
	      border: 'none',
	      cursor: 'pointer',
	      fontSize: 14,
	      color: '#666'
	    }
	  }, "\u2715")), /*#__PURE__*/React.createElement("select", {
	    value: filterMode,
	    onChange: e => onFilterModeChange(e.target.value),
	    style: {
	      padding: '7px 8px',
	      borderRadius: 4,
	      border: '1px solid #ccc',
	      fontSize: 13
	    }
	  }, /*#__PURE__*/React.createElement("option", {
	    value: "all"
	  }, "All Sources"), /*#__PURE__*/React.createElement("option", {
	    value: "local"
	  }, "Local Only"), /*#__PURE__*/React.createElement("option", {
	    value: "remote"
	  }, "Remote Only"))), uniqueTags.length > 0 && /*#__PURE__*/React.createElement("div", {
	    style: {
	      marginBottom: 8
	    }
	  }, /*#__PURE__*/React.createElement("div", {
	    style: {
	      display: 'flex',
	      justifyContent: 'space-between',
	      alignItems: 'center',
	      marginBottom: 4
	    }
	  }, /*#__PURE__*/React.createElement("span", {
	    style: {
	      fontSize: 11,
	      fontWeight: 600,
	      color: '#666',
	      textTransform: 'uppercase',
	      letterSpacing: 0.5
	    }
	  }, "Filter by Tags (", selectedTags.length > 0 ? `${selectedTags.length} active` : 'all', ")"), selectedTags.length > 0 && /*#__PURE__*/React.createElement("button", {
	    onClick: onClearTags,
	    style: {
	      background: 'none',
	      border: 'none',
	      color: '#007bff',
	      fontSize: 11,
	      cursor: 'pointer',
	      padding: 0
	    }
	  }, "Clear selected tags")), /*#__PURE__*/React.createElement("div", {
	    style: {
	      display: 'flex',
	      flexWrap: 'wrap',
	      gap: 4,
	      maxHeight: 68,
	      overflowY: 'auto',
	      padding: '2px 0'
	    }
	  }, uniqueTags.map(tag => {
	    const isSelected = selectedTags.some(t => t.toLowerCase() === tag.toLowerCase());
	    return /*#__PURE__*/React.createElement("button", {
	      key: tag,
	      onClick: () => onTagToggle(tag),
	      className: `sketch-tag-pill${isSelected ? ' sketch-tag-pill--selected' : ''}`,
	      style: {
	        border: isSelected ? '1px solid #3b82f6' : '1px solid #e2e8f0',
	        background: isSelected ? '#3b82f6' : '#f1f5f9',
	        color: isSelected ? '#ffffff' : '#334155',
	        borderRadius: 12,
	        padding: '2px 10px',
	        fontSize: 11,
	        cursor: 'pointer',
	        transition: 'all 0.15s ease',
	        fontWeight: isSelected ? 600 : 400
	      }
	    }, "#", tag);
	  }))), /*#__PURE__*/React.createElement("div", {
	    style: {
	      display: 'flex',
	      justifyContent: 'space-between',
	      fontSize: 12,
	      color: '#666'
	    }
	  }, /*#__PURE__*/React.createElement("span", null, "Showing ", /*#__PURE__*/React.createElement("strong", null, filteredCount), " of ", /*#__PURE__*/React.createElement("strong", null, totalCount), " sketches"), (searchQuery || selectedTags.length > 0 || filterMode !== 'all') && /*#__PURE__*/React.createElement("span", {
	    style: {
	      color: '#3b82f6'
	    }
	  }, "Fuzzy filter active")));
	}

	// --- SketchesList: Main Sketches Tab with Setlist Collecting & (+)/(-) Controls ---
	function SketchesList({
	  sketches = [],
	  collections = [],
	  targetCollectionId = '',
	  onTargetCollectionChange,
	  onAddSketchToTarget,
	  onRemoveSketchFromTarget,
	  onAddFilteredToTarget,
	  onRemoveFilteredFromTarget,
	  filter = '',
	  tagFilter = '',
	  remoteDraftNames = new Set(),
	  onFilterChange,
	  onTagFilterChange,
	  onEdit,
	  onDelete,
	  onUpload,
	  onRowClick,
	  actions = []
	}) {
	  const [selectedTags, setSelectedTags] = React$1.useState([]);
	  const [filterMode, setFilterMode] = React$1.useState('all');

	  // Handle tag filtering
	  const handleTagToggle = tag => {
	    const lower = tag.toLowerCase();
	    setSelectedTags(prev => {
	      const exists = prev.some(t => t.toLowerCase() === lower);
	      const updated = exists ? prev.filter(t => t.toLowerCase() !== lower) : [...prev, tag];
	      if (onTagFilterChange) {
	        onTagFilterChange({
	          target: {
	            value: updated.join(', ')
	          }
	        });
	      }
	      return updated;
	    });
	  };
	  const handleClearTags = () => {
	    setSelectedTags([]);
	    if (onTagFilterChange) {
	      onTagFilterChange({
	        target: {
	          value: ''
	        }
	      });
	    }
	  };
	  const handleSearchChange = val => {
	    if (onFilterChange) {
	      onFilterChange({
	        target: {
	          value: val
	        }
	      });
	    }
	  };

	  // Filter & rank sketches using fuzzy matcher and tag filter
	  const filtered = filterAndRankSketches(sketches, filter, selectedTags, filterMode);
	  const isFiltering = Boolean(filter.trim()) || selectedTags.length > 0 || filterMode !== 'all';

	  // Target collection lookup
	  const targetCollection = collections.find(c => c.id === targetCollectionId) || null;

	  // Helper to check if sketch is in target collection
	  const isSketchInTarget = sketch => {
	    if (!targetCollection || !Array.isArray(targetCollection.sketchIds)) return false;
	    const sId = sketch.id || sketch.name;
	    return targetCollection.sketchIds.some(item => {
	      const id = typeof item === 'string' ? item : item?.sketchId;
	      return id === sId || id === sketch.name;
	    });
	  };

	  // Handle + All and - All for current filtered sketches
	  const handleAddAllFiltered = () => {
	    if (!targetCollectionId) return;
	    const idsToAdd = filtered.map(s => s.id || s.name);
	    onAddFilteredToTarget?.(targetCollectionId, idsToAdd);
	  };
	  const handleRemoveAllFiltered = () => {
	    if (!targetCollectionId) return;
	    const idsToRemove = filtered.map(s => s.id || s.name);
	    onRemoveFilteredFromTarget?.(targetCollectionId, idsToRemove);
	  };
	  return /*#__PURE__*/React$1.createElement("div", {
	    className: "sketches-list-component"
	  }, /*#__PURE__*/React$1.createElement("div", {
	    style: {
	      background: '#f8fafc',
	      border: '1px solid #e2e8f0',
	      borderRadius: 6,
	      padding: '8px 12px',
	      marginBottom: 10,
	      display: 'flex',
	      alignItems: 'center',
	      justify: 'space-between',
	      flexWrap: 'wrap',
	      gap: 8
	    }
	  }, /*#__PURE__*/React$1.createElement("div", {
	    style: {
	      display: 'flex',
	      alignItems: 'center',
	      gap: 8,
	      flex: 1,
	      minWidth: 200
	    }
	  }, /*#__PURE__*/React$1.createElement("label", {
	    style: {
	      fontSize: 12,
	      fontWeight: 600,
	      color: '#334155',
	      whiteSpace: 'nowrap'
	    }
	  }, "Setlist to collect to:"), /*#__PURE__*/React$1.createElement("select", {
	    value: targetCollectionId || '',
	    onChange: e => onTargetCollectionChange?.(e.target.value),
	    style: {
	      padding: '5px 8px',
	      borderRadius: 4,
	      border: '1px solid #cbd5e1',
	      fontSize: 12,
	      flex: 1
	    }
	  }, /*#__PURE__*/React$1.createElement("option", {
	    value: ""
	  }, "-- Choose Setlist --"), collections.map(c => /*#__PURE__*/React$1.createElement("option", {
	    key: c.id,
	    value: c.id
	  }, c.name, " (", c.sketchIds?.length || 0, " items)")))), targetCollectionId ? /*#__PURE__*/React$1.createElement("div", {
	    style: {
	      display: 'flex',
	      gap: 6,
	      alignItems: 'center'
	    }
	  }, /*#__PURE__*/React$1.createElement("button", {
	    onClick: handleAddAllFiltered,
	    disabled: filtered.length === 0,
	    style: {
	      background: '#22c55e',
	      color: '#ffffff',
	      border: 'none',
	      padding: '4px 10px',
	      borderRadius: 4,
	      fontSize: 12,
	      fontWeight: 600,
	      cursor: filtered.length > 0 ? 'pointer' : 'default',
	      opacity: filtered.length > 0 ? 1 : 0.6
	    },
	    title: "Add all currently filtered sketches to target setlist"
	  }, "+ All (", filtered.length, ")"), /*#__PURE__*/React$1.createElement("button", {
	    onClick: handleRemoveAllFiltered,
	    disabled: filtered.length === 0,
	    style: {
	      background: '#ef4444',
	      color: '#ffffff',
	      border: 'none',
	      padding: '4px 10px',
	      borderRadius: 4,
	      fontSize: 12,
	      fontWeight: 600,
	      cursor: filtered.length > 0 ? 'pointer' : 'default',
	      opacity: filtered.length > 0 ? 1 : 0.6
	    },
	    title: "Remove all currently filtered sketches from target setlist"
	  }, "- All (", filtered.length, ")")) : /*#__PURE__*/React$1.createElement("span", {
	    style: {
	      fontSize: 11,
	      color: '#94a3b8',
	      fontStyle: 'italic'
	    }
	  }, "Select a setlist to enable + / - buttons")), /*#__PURE__*/React$1.createElement(SketchSearchFilter, {
	    sketches: sketches,
	    searchQuery: filter,
	    selectedTags: selectedTags,
	    filterMode: filterMode,
	    onSearchQueryChange: handleSearchChange,
	    onTagToggle: handleTagToggle,
	    onClearTags: handleClearTags,
	    onFilterModeChange: setFilterMode,
	    totalCount: sketches.length,
	    filteredCount: filtered.length
	  }), actions.length > 0 && /*#__PURE__*/React$1.createElement("div", {
	    style: {
	      display: 'flex',
	      gap: 8,
	      marginBottom: 10,
	      flexWrap: 'wrap'
	    }
	  }, actions.map((action, i) => /*#__PURE__*/React$1.createElement("button", {
	    key: i,
	    onClick: () => action.onClick(filtered, isFiltering),
	    disabled: action.disabled ? action.disabled(filtered, isFiltering) : false,
	    style: {
	      padding: '4px 10px',
	      fontSize: 12
	    }
	  }, action.label))), /*#__PURE__*/React$1.createElement("ul", {
	    className: "sketch-list",
	    style: {
	      margin: 0
	    }
	  }, filtered.length === 0 && /*#__PURE__*/React$1.createElement("li", {
	    style: {
	      color: '#888',
	      padding: 12,
	      textAlign: 'center'
	    }
	  }, "No sketches match your search."), filtered.map((sketch, idx) => {
	    const tags = Array.isArray(sketch.metadata?.tags) ? sketch.metadata.tags : [];
	    const isOnRemote = remoteDraftNames.has(sketch.name);
	    const inTarget = isSketchInTarget(sketch);
	    const sketchId = sketch.id || sketch.name;
	    return /*#__PURE__*/React$1.createElement("li", {
	      key: sketchId || idx,
	      className: `sketch-list-item${isOnRemote ? ' sketch-list-item--remote' : ''}`,
	      onClick: () => onRowClick(sketch, idx),
	      style: {
	        padding: '8px 10px',
	        borderBottom: '1px solid #f1f5f9'
	      }
	    }, /*#__PURE__*/React$1.createElement("span", {
	      style: {
	        display: 'flex',
	        alignItems: 'center',
	        gap: 8,
	        flex: 1,
	        minWidth: 0
	      }
	    }, /*#__PURE__*/React$1.createElement("strong", {
	      style: {
	        overflow: 'hidden',
	        textOverflow: 'ellipsis',
	        whiteSpace: 'nowrap'
	      }
	    }, sketch.name), tags.length > 0 && /*#__PURE__*/React$1.createElement("span", {
	      style: {
	        display: 'flex',
	        gap: 4,
	        flexWrap: 'wrap'
	      }
	    }, tags.slice(0, 3).map((tag, i) => /*#__PURE__*/React$1.createElement("span", {
	      className: "sketch-tag",
	      key: i
	    }, "#", tag)))), /*#__PURE__*/React$1.createElement("span", {
	      onClick: e => e.stopPropagation(),
	      style: {
	        display: 'flex',
	        gap: 4,
	        alignItems: 'center'
	      }
	    }, targetCollectionId ? inTarget ? /*#__PURE__*/React$1.createElement("button", {
	      title: "Remove from target setlist",
	      onClick: () => onRemoveSketchFromTarget?.(targetCollectionId, sketchId),
	      style: {
	        background: '#ef4444',
	        color: '#ffffff',
	        border: 'none',
	        borderRadius: 4,
	        width: 26,
	        height: 24,
	        fontWeight: 'bold',
	        cursor: 'pointer',
	        fontSize: 14,
	        display: 'inline-flex',
	        alignItems: 'center',
	        justifyContent: 'center',
	        marginRight: 6
	      }
	    }, "-") : /*#__PURE__*/React$1.createElement("button", {
	      title: "Add to target setlist",
	      onClick: () => onAddSketchToTarget?.(targetCollectionId, sketchId),
	      style: {
	        background: '#22c55e',
	        color: '#ffffff',
	        border: 'none',
	        borderRadius: 4,
	        width: 26,
	        height: 24,
	        fontWeight: 'bold',
	        cursor: 'pointer',
	        fontSize: 14,
	        display: 'inline-flex',
	        alignItems: 'center',
	        justifyContent: 'center',
	        marginRight: 6
	      }
	    }, "+") : null, onUpload && /*#__PURE__*/React$1.createElement("button", {
	      title: "Upload to remote AWS DynamoDB",
	      onClick: () => onUpload(sketch, idx),
	      style: {
	        padding: '2px 6px',
	        fontSize: 12
	      }
	    }, "\u2191"), /*#__PURE__*/React$1.createElement("button", {
	      title: "Edit sketch metadata",
	      onClick: () => onEdit(sketch.name, idx),
	      style: {
	        padding: '2px 6px',
	        fontSize: 12
	      }
	    }, "E"), /*#__PURE__*/React$1.createElement("button", {
	      title: "Delete sketch",
	      style: {
	        color: '#ef4444',
	        padding: '2px 6px',
	        fontSize: 12
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

	// Singleton promise-based dialog service to trigger non-blocking confirm/prompt modals anywhere in the app

	class DialogService {
	  constructor() {
	    this.listeners = [];
	  }
	  subscribe(listener) {
	    this.listeners.push(listener);
	    return () => {
	      this.listeners = this.listeners.filter(l => l !== listener);
	    };
	  }

	  /**
	   * Show non-blocking confirmation dialog
	   * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
	   */
	  confirm({
	    title = 'Confirm Action',
	    message = 'Are you sure you want to proceed?',
	    confirmText = 'Confirm',
	    cancelText = 'Cancel',
	    isDanger = false
	  } = {}) {
	    return new Promise(resolve => {
	      const config = {
	        isOpen: true,
	        title,
	        message,
	        confirmText,
	        cancelText,
	        isDanger,
	        hasInput: false,
	        resolve
	      };
	      this.listeners.forEach(l => l(config));
	    });
	  }

	  /**
	   * Show non-blocking input prompt dialog
	   * @returns {Promise<string|null>} Resolves to string value if confirmed, null if cancelled
	   */
	  prompt({
	    title = 'Enter Value',
	    message = '',
	    defaultValue = '',
	    placeholder = '',
	    confirmText = 'OK',
	    cancelText = 'Cancel'
	  } = {}) {
	    return new Promise(resolve => {
	      const config = {
	        isOpen: true,
	        title,
	        message,
	        confirmText,
	        cancelText,
	        isDanger: false,
	        hasInput: true,
	        defaultValue,
	        placeholder,
	        resolve
	      };
	      this.listeners.forEach(l => l(config));
	    });
	  }
	}
	const dialogService = new DialogService();
	if (typeof window !== 'undefined') {
	  window.hydraDialog = dialogService;
	}

	// --- CollectionsPanel: Simplified Setlist Tab (Create, Load/Activate, Delete) ---
	function CollectionsPanel({
	  collectionStorage,
	  activeId,
	  onActiveChange,
	  onCollectionsChange
	}) {
	  const {
	    collections
	  } = collectionStorage.getCollections();
	  const handleSetActive = id => {
	    collectionStorage.setActiveCollection(id);
	    onActiveChange(id);
	    onCollectionsChange?.();
	  };
	  const handleCreateCollection = async () => {
	    const name = await dialogService.prompt({
	      title: 'Create New Setlist',
	      message: 'Enter a title for your new performance setlist:',
	      defaultValue: 'New Setlist',
	      placeholder: 'Setlist name'
	    });
	    if (!name || !name.trim()) return;
	    const col = collectionStorage.createCollection(name.trim());
	    handleSetActive(col.id);
	    onCollectionsChange?.();
	  };
	  const handleDeleteCollection = async (id, name) => {
	    const confirmed = await dialogService.confirm({
	      title: 'Delete Setlist',
	      message: `Are you sure you want to delete setlist "${name}"?`,
	      confirmText: 'Delete',
	      isDanger: true
	    });
	    if (!confirmed) return;
	    collectionStorage.deleteCollection(id);
	    if (activeId === id) {
	      collectionStorage.setActiveCollection(null);
	      onActiveChange(null);
	    }
	    onCollectionsChange?.();
	  };
	  return /*#__PURE__*/React$1.createElement("div", {
	    className: "setlist-manager-panel",
	    style: {
	      padding: '4px 0'
	    }
	  }, /*#__PURE__*/React$1.createElement("div", {
	    style: {
	      display: 'flex',
	      justifyContent: 'space-between',
	      alignItems: 'center',
	      marginBottom: 16
	    }
	  }, /*#__PURE__*/React$1.createElement("span", {
	    style: {
	      fontSize: 13,
	      color: '#64748b'
	    }
	  }, "Manage your performance setlists. Select a setlist to load as active."), /*#__PURE__*/React$1.createElement("button", {
	    onClick: handleCreateCollection,
	    style: {
	      background: '#3b82f6',
	      color: '#ffffff',
	      border: 'none',
	      padding: '6px 14px',
	      borderRadius: 4,
	      fontWeight: 600,
	      cursor: 'pointer',
	      fontSize: 13
	    }
	  }, "+ Create Setlist")), /*#__PURE__*/React$1.createElement("div", {
	    style: {
	      display: 'flex',
	      alignItems: 'center',
	      justify: 'space-between',
	      padding: '10px 14px',
	      marginBottom: 10,
	      border: !activeId ? '2px solid #3b82f6' : '1px solid #e2e8f0',
	      borderRadius: 6,
	      background: !activeId ? '#eff6ff' : '#f8fafc'
	    }
	  }, /*#__PURE__*/React$1.createElement("div", null, /*#__PURE__*/React$1.createElement("strong", {
	    style: {
	      fontSize: 14,
	      color: '#1e293b'
	    }
	  }, "All Sketches (Default Unfiltered)"), /*#__PURE__*/React$1.createElement("div", {
	    style: {
	      fontSize: 12,
	      color: '#64748b',
	      marginTop: 2
	    }
	  }, "Show all sketches in library without setlist filtering")), !activeId ? /*#__PURE__*/React$1.createElement("span", {
	    style: {
	      fontSize: 12,
	      fontWeight: 600,
	      color: '#3b82f6',
	      background: '#dbeafe',
	      padding: '3px 10px',
	      borderRadius: 12
	    }
	  }, "\u25CF Active") : /*#__PURE__*/React$1.createElement("button", {
	    onClick: () => handleSetActive(null),
	    style: {
	      padding: '4px 12px',
	      fontSize: 12,
	      borderRadius: 4,
	      cursor: 'pointer'
	    }
	  }, "Load")), /*#__PURE__*/React$1.createElement("ul", {
	    style: {
	      listStyle: 'none',
	      padding: 0,
	      margin: 0
	    }
	  }, collections.length === 0 ? /*#__PURE__*/React$1.createElement("li", {
	    style: {
	      color: '#94a3b8',
	      padding: 16,
	      textAlign: 'center',
	      background: '#f8fafc',
	      borderRadius: 6
	    }
	  }, "No setlists created yet. Click ", /*#__PURE__*/React$1.createElement("strong", null, "+ Create Setlist"), " to start collecting sketches.") : collections.map(col => {
	    const count = col.sketchIds.length;
	    const isActive = activeId === col.id;
	    return /*#__PURE__*/React$1.createElement("li", {
	      key: col.id,
	      style: {
	        display: 'flex',
	        alignItems: 'center',
	        justify: 'space-between',
	        padding: '10px 14px',
	        marginBottom: 8,
	        border: isActive ? '2px solid #3b82f6' : '1px solid #e2e8f0',
	        borderRadius: 6,
	        background: isActive ? '#eff6ff' : '#ffffff'
	      }
	    }, /*#__PURE__*/React$1.createElement("div", null, /*#__PURE__*/React$1.createElement("strong", {
	      style: {
	        fontSize: 14,
	        color: '#1e293b'
	      }
	    }, col.name), /*#__PURE__*/React$1.createElement("span", {
	      style: {
	        fontSize: 12,
	        color: '#64748b',
	        marginLeft: 8
	      }
	    }, "(", count, " ", count === 1 ? 'sketch' : 'sketches', ")")), /*#__PURE__*/React$1.createElement("div", {
	      style: {
	        display: 'flex',
	        gap: 8,
	        alignItems: 'center'
	      }
	    }, isActive ? /*#__PURE__*/React$1.createElement("span", {
	      style: {
	        fontSize: 12,
	        fontWeight: 600,
	        color: '#3b82f6',
	        background: '#dbeafe',
	        padding: '3px 10px',
	        borderRadius: 12
	      }
	    }, "\u25CF Active") : /*#__PURE__*/React$1.createElement("button", {
	      onClick: () => handleSetActive(col.id),
	      style: {
	        background: '#22c55e',
	        color: '#ffffff',
	        border: 'none',
	        padding: '4px 12px',
	        borderRadius: 4,
	        fontSize: 12,
	        cursor: 'pointer'
	      }
	    }, "Load"), /*#__PURE__*/React$1.createElement("button", {
	      onClick: () => handleDeleteCollection(col.id, col.name),
	      style: {
	        background: 'none',
	        border: 'none',
	        color: '#ef4444',
	        fontSize: 13,
	        cursor: 'pointer',
	        padding: '4px 8px'
	      },
	      title: "Delete setlist"
	    }, "Delete")));
	  })));
	}

	// --- ConfirmModal: Non-blocking custom modal dialog component ---
	// Replaces window.confirm() and window.prompt() without freezing WebGL/Hydra animations.

	function ConfirmModal({
	  isOpen,
	  title = 'Confirmation',
	  message = '',
	  confirmText = 'Confirm',
	  cancelText = 'Cancel',
	  isDanger = false,
	  hasInput = false,
	  defaultValue = '',
	  placeholder = '',
	  onConfirm,
	  onCancel
	}) {
	  const [inputValue, setInputValue] = React$1.useState(defaultValue);
	  const inputRef = React$1.useRef(null);
	  React$1.useEffect(() => {
	    setInputValue(defaultValue);
	  }, [defaultValue, isOpen]);
	  React$1.useEffect(() => {
	    if (isOpen) {
	      // Auto focus on input or confirm button
	      setTimeout(() => {
	        if (hasInput && inputRef.current) {
	          inputRef.current.focus();
	          inputRef.current.select();
	        }
	      }, 50);
	    }
	  }, [isOpen, hasInput]);
	  if (!isOpen) return null;
	  const handleKeyDown = e => {
	    if (e.key === 'Enter') {
	      e.preventDefault();
	      onConfirm(hasInput ? inputValue : true);
	    } else if (e.key === 'Escape') {
	      e.preventDefault();
	      onCancel();
	    }
	  };
	  return /*#__PURE__*/React$1.createElement("div", {
	    className: "confirm-modal-overlay",
	    onClick: onCancel,
	    style: {
	      position: 'fixed',
	      top: 0,
	      left: 0,
	      right: 0,
	      bottom: 0,
	      backgroundColor: 'rgba(15, 23, 42, 0.6)',
	      backdropFilter: 'blur(4px)',
	      zIndex: 99999,
	      display: 'flex',
	      alignItems: 'center',
	      justifyContent: 'center',
	      padding: 16,
	      animation: 'confirmFadeIn 0.15s ease-out'
	    }
	  }, /*#__PURE__*/React$1.createElement("div", {
	    className: "confirm-modal-card",
	    onClick: e => e.stopPropagation(),
	    onKeyDown: handleKeyDown,
	    style: {
	      background: '#ffffff',
	      borderRadius: 10,
	      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
	      width: '100%',
	      maxWidth: 420,
	      padding: 20,
	      color: '#0f172a',
	      fontFamily: 'system-ui, -apple-system, sans-serif'
	    }
	  }, /*#__PURE__*/React$1.createElement("h3", {
	    style: {
	      margin: '0 0 8px 0',
	      fontSize: 16,
	      fontWeight: 700,
	      color: isDanger ? '#dc2626' : '#0f172a'
	    }
	  }, title), message && /*#__PURE__*/React$1.createElement("div", {
	    style: {
	      fontSize: 13,
	      color: '#475569',
	      marginBottom: hasInput ? 12 : 16,
	      lineHeight: 1.5
	    }
	  }, message), hasInput && /*#__PURE__*/React$1.createElement("div", {
	    style: {
	      marginBottom: 16
	    }
	  }, /*#__PURE__*/React$1.createElement("input", {
	    ref: inputRef,
	    type: "text",
	    value: inputValue,
	    placeholder: placeholder,
	    onChange: e => setInputValue(e.target.value),
	    style: {
	      width: '100%',
	      padding: '8px 12px',
	      border: '1px solid #cbd5e1',
	      borderRadius: 6,
	      fontSize: 14,
	      boxSizing: 'border-box',
	      outline: 'none',
	      transition: 'border-color 0.15s'
	    }
	  })), /*#__PURE__*/React$1.createElement("div", {
	    style: {
	      display: 'flex',
	      gap: 8,
	      justifyContent: 'flex-end'
	    }
	  }, /*#__PURE__*/React$1.createElement("button", {
	    onClick: onCancel,
	    style: {
	      background: '#f1f5f9',
	      color: '#334155',
	      border: '1px solid #cbd5e1',
	      padding: '7px 16px',
	      borderRadius: 6,
	      fontSize: 13,
	      fontWeight: 500,
	      cursor: 'pointer'
	    }
	  }, cancelText), /*#__PURE__*/React$1.createElement("button", {
	    onClick: () => onConfirm(hasInput ? inputValue : true),
	    style: {
	      background: isDanger ? '#dc2626' : '#3b82f6',
	      color: '#ffffff',
	      border: 'none',
	      padding: '7px 18px',
	      borderRadius: 6,
	      fontSize: 13,
	      fontWeight: 600,
	      cursor: 'pointer'
	    }
	  }, confirmText))));
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
	      remoteDraftNames: new Set(),
	      targetCollectionId: ''
	    };
	  }
	  handleTargetCollectionChange = id => {
	    this.setState({
	      targetCollectionId: id
	    });
	  };
	  handleAddSketchToTarget = (collectionId, sketchId) => {
	    this.collectionStorage.addSketchToCollection(collectionId, sketchId);
	    this.handleCollectionChange();
	  };
	  handleRemoveSketchFromTarget = (collectionId, sketchId) => {
	    this.collectionStorage.removeSketchFromCollection(collectionId, sketchId);
	    this.handleCollectionChange();
	  };
	  handleAddFilteredToTarget = (collectionId, sketchIds) => {
	    this.collectionStorage.addMultipleSketchesToCollection(collectionId, sketchIds);
	    this.handleCollectionChange();
	  };
	  handleRemoveFilteredFromTarget = (collectionId, sketchIds) => {
	    this.collectionStorage.removeMultipleSketchesFromCollection(collectionId, sketchIds);
	    this.handleCollectionChange();
	  };
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
	  handleDeleteSketch = async name => {
	    const confirmed = await dialogService.confirm({
	      title: 'Delete Sketch',
	      message: `Are you sure you want to delete "${name}"?`,
	      confirmText: 'Delete',
	      isDanger: true
	    });
	    if (confirmed) {
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
	    const tabs = ['This', 'Sketches', 'Setlists', 'Import/Export'];
	    return /*#__PURE__*/React.createElement("div", {
	      className: "modal-tabs"
	    }, tabs.map(tab => {
	      const isActive = this.state.activeTab === tab || tab === 'Setlists' && this.state.activeTab === 'Collections';
	      return /*#__PURE__*/React.createElement("button", {
	        key: tab,
	        className: isActive ? 'active' : '',
	        onClick: () => this.setTab(tab)
	      }, tab);
	    }));
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
	    const {
	      collections
	    } = this.collectionStorage ? this.collectionStorage.getCollections() : {
	      collections: []
	    };
	    const activeTarget = this.state.targetCollectionId || collections[0]?.id || '';
	    const actions = [{
	      label: "Keep these",
	      onClick: (filtered, isFiltering) => {
	        this.handleKeepFiltered(filtered);
	      },
	      disabled: (filtered, isFiltering) => filtered.length === 0
	    }, {
	      label: "Clear all local!",
	      onClick: async () => {
	        const confirmed = await dialogService.confirm({
	          title: 'Clear Local Storage',
	          message: 'Are you sure you want to clear all local sketches? This action cannot be undone.',
	          confirmText: 'Clear All',
	          isDanger: true
	        });
	        if (confirmed) {
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
	      collections: collections,
	      targetCollectionId: activeTarget,
	      onTargetCollectionChange: this.handleTargetCollectionChange,
	      onAddSketchToTarget: this.handleAddSketchToTarget,
	      onRemoveSketchFromTarget: this.handleRemoveSketchFromTarget,
	      onAddFilteredToTarget: this.handleAddFilteredToTarget,
	      onRemoveFilteredFromTarget: this.handleRemoveFilteredFromTarget,
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
	      onCollectionsChange: this.handleCollectionChange,
	      onLoadSketch: sketch => {
	        window.xemitter.emit('gallery:loadSketch', sketch);
	      }
	    });
	  }
	  renderTabContent() {
	    switch (this.state.activeTab) {
	      case 'This':
	        return this.renderJsonEditor();
	      case 'Sketches':
	        return this.renderSketchesList();
	      case 'Collections':
	      case 'Setlists':
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
	class DialogHost extends React.Component {
	  constructor(props) {
	    super(props);
	    this.state = {
	      dialogConfig: null
	    };
	  }
	  componentDidMount() {
	    this.unsubscribe = dialogService.subscribe(config => {
	      this.setState({
	        dialogConfig: config
	      });
	    });
	  }
	  componentWillUnmount() {
	    if (this.unsubscribe) this.unsubscribe();
	  }
	  handleConfirm = val => {
	    const resolve = this.state.dialogConfig?.resolve;
	    this.setState({
	      dialogConfig: null
	    });
	    if (resolve) resolve(val);
	  };
	  handleCancel = () => {
	    const resolve = this.state.dialogConfig?.resolve;
	    this.setState({
	      dialogConfig: null
	    });
	    if (resolve) resolve(false);
	  };
	  render() {
	    const {
	      dialogConfig
	    } = this.state;
	    if (!dialogConfig || !dialogConfig.isOpen) return null;
	    return /*#__PURE__*/React.createElement(ConfirmModal, {
	      isOpen: dialogConfig.isOpen,
	      title: dialogConfig.title,
	      message: dialogConfig.message,
	      confirmText: dialogConfig.confirmText,
	      cancelText: dialogConfig.cancelText,
	      isDanger: dialogConfig.isDanger,
	      hasInput: dialogConfig.hasInput,
	      defaultValue: dialogConfig.defaultValue,
	      placeholder: dialogConfig.placeholder,
	      onConfirm: this.handleConfirm,
	      onCancel: this.handleCancel
	    });
	  }
	}
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
	    }), /*#__PURE__*/React.createElement(DialogHost, null));
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
	    const isOptionSpace = e.altKey && (e.code === "Space" || e.key === " " || e.key === "Spacebar");
	    if (isOptionSpace) {
	      e.preventDefault();
	      e.stopPropagation();
	      tapTempo.tap(e.timeStamp);
	      return;
	    }
	    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
	      return;
	    }
	    if (e.key === "[") {
	      window.xemitter?.emit('gallery:prevSetlistSketch');
	    } else if (e.key === "]") {
	      window.xemitter?.emit('gallery:nextSetlistSketch');
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
	        app.on("bpm:change", bpmVal => {
	          if (typeof window !== "undefined") window.bpm = bpmVal;
	        });
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

	// This file was generated. Do not modify manually!
	var astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 574, 3, 9, 9, 7, 9, 32, 4, 318, 1, 78, 5, 71, 10, 50, 3, 123, 2, 54, 14, 32, 10, 3, 1, 11, 3, 46, 10, 8, 0, 46, 9, 7, 2, 37, 13, 2, 9, 6, 1, 45, 0, 13, 2, 49, 13, 9, 3, 2, 11, 83, 11, 7, 0, 3, 0, 158, 11, 6, 9, 7, 3, 56, 1, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 68, 8, 2, 0, 3, 0, 2, 3, 2, 4, 2, 0, 15, 1, 83, 17, 10, 9, 5, 0, 82, 19, 13, 9, 214, 6, 3, 8, 28, 1, 83, 16, 16, 9, 82, 12, 9, 9, 7, 19, 58, 14, 5, 9, 243, 14, 166, 9, 71, 5, 2, 1, 3, 3, 2, 0, 2, 1, 13, 9, 120, 6, 3, 6, 4, 0, 29, 9, 41, 6, 2, 3, 9, 0, 10, 10, 47, 15, 199, 7, 137, 9, 54, 7, 2, 7, 17, 9, 57, 21, 2, 13, 123, 5, 4, 0, 2, 1, 2, 6, 2, 0, 9, 9, 49, 4, 2, 1, 2, 4, 9, 9, 55, 9, 266, 3, 10, 1, 2, 0, 49, 6, 4, 4, 14, 10, 5350, 0, 7, 14, 11465, 27, 2343, 9, 87, 9, 39, 4, 60, 6, 26, 9, 535, 9, 470, 0, 2, 54, 8, 3, 82, 0, 12, 1, 19628, 1, 4178, 9, 519, 45, 3, 22, 543, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 513, 54, 5, 49, 9, 0, 15, 0, 23, 4, 2, 14, 1361, 6, 2, 16, 3, 6, 2, 1, 2, 4, 101, 0, 161, 6, 10, 9, 357, 0, 62, 13, 499, 13, 245, 1, 2, 9, 233, 0, 3, 0, 8, 1, 6, 0, 475, 6, 110, 6, 6, 9, 4759, 9, 787719, 239];

	// This file was generated. Do not modify manually!
	var astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 14, 29, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 19, 35, 5, 35, 5, 39, 9, 51, 13, 10, 2, 14, 2, 6, 2, 1, 2, 10, 2, 14, 2, 6, 2, 1, 4, 51, 13, 310, 10, 21, 11, 7, 25, 5, 2, 41, 2, 8, 70, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 66, 18, 2, 1, 11, 21, 11, 25, 7, 25, 39, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 28, 43, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 56, 50, 14, 50, 14, 35, 39, 27, 10, 22, 251, 41, 7, 1, 17, 5, 57, 28, 11, 0, 9, 21, 43, 17, 47, 20, 28, 22, 13, 52, 58, 1, 3, 0, 14, 44, 33, 24, 27, 35, 30, 0, 3, 0, 9, 34, 4, 0, 13, 47, 15, 3, 22, 0, 2, 0, 36, 17, 2, 24, 20, 1, 64, 6, 2, 0, 2, 3, 2, 14, 2, 9, 8, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 19, 0, 13, 4, 31, 9, 2, 0, 3, 0, 2, 37, 2, 0, 26, 0, 2, 0, 45, 52, 19, 3, 21, 2, 31, 47, 21, 1, 2, 0, 185, 46, 42, 3, 37, 47, 21, 0, 60, 42, 14, 0, 72, 26, 38, 6, 186, 43, 117, 63, 32, 7, 3, 0, 3, 7, 2, 1, 2, 23, 16, 0, 2, 0, 95, 7, 3, 38, 17, 0, 2, 0, 29, 0, 11, 39, 8, 0, 22, 0, 12, 45, 20, 0, 19, 72, 200, 32, 32, 8, 2, 36, 18, 0, 50, 29, 113, 6, 2, 1, 2, 37, 22, 0, 26, 5, 2, 1, 2, 31, 15, 0, 24, 43, 261, 18, 16, 0, 2, 12, 2, 33, 125, 0, 80, 921, 103, 110, 18, 195, 2637, 96, 16, 1071, 18, 5, 26, 3994, 6, 582, 6842, 29, 1763, 568, 8, 30, 18, 78, 18, 29, 19, 47, 17, 3, 32, 20, 6, 18, 433, 44, 212, 63, 33, 24, 3, 24, 45, 74, 6, 0, 67, 12, 65, 1, 2, 0, 15, 4, 10, 7381, 42, 31, 98, 114, 8702, 3, 2, 6, 2, 1, 2, 290, 16, 0, 30, 2, 3, 0, 15, 3, 9, 395, 2309, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 1845, 30, 7, 5, 262, 61, 147, 44, 11, 6, 17, 0, 322, 29, 19, 43, 485, 27, 229, 29, 3, 0, 208, 30, 2, 2, 2, 1, 2, 6, 3, 4, 10, 1, 225, 6, 2, 3, 2, 1, 2, 14, 2, 196, 60, 67, 8, 0, 1205, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42719, 33, 4381, 3, 5773, 3, 7472, 16, 621, 2467, 541, 1507, 4938, 6, 8489];

	// This file was generated. Do not modify manually!
	var nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u07fd\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u0897-\u089f\u08ca-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u09fe\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0afa-\u0aff\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b55-\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c04\u0c3c\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0cf3\u0d00-\u0d03\u0d3b\u0d3c\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d81-\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0ebc\u0ec8-\u0ece\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1715\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u180f-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1abf-\u1add\u1ae0-\u1aeb\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf4\u1cf7-\u1cf9\u1dc0-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\u30fb\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua82c\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua8ff-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f\uff65";

	// This file was generated. Do not modify manually!
	var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u05d0-\u05ea\u05ef-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u0860-\u086a\u0870-\u0887\u0889-\u088f\u08a0-\u08c9\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u09fc\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c5c\u0c5d\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cdc-\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d04-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e86-\u0e8a\u0e8c-\u0ea3\u0ea5\u0ea7-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u1711\u171f-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1878\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4c\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c8a\u1c90-\u1cba\u1cbd-\u1cbf\u1ce9-\u1cec\u1cee-\u1cf3\u1cf5\u1cf6\u1cfa\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31bf\u31f0-\u31ff\u3400-\u4dbf\u4e00-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7dc\ua7f1-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua8fe\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab69\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";

	// These are a run-length and offset encoded representation of the
	// >0xffff code points that are a valid part of identifiers. The
	// offset starts at 0x10000, and each pair of numbers represents an
	// offset to the next range, and then a size of the range.

	// Reserved word lists for various dialects of the language

	var reservedWords = {
	  3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
	  5: "class enum extends super const export import",
	  6: "enum",
	  strict: "implements interface let package private protected public static yield",
	  strictBind: "eval arguments"
	};

	// And the keywords

	var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";

	var keywords$1 = {
	  5: ecma5AndLessKeywords,
	  "5module": ecma5AndLessKeywords + " export import",
	  6: ecma5AndLessKeywords + " const class extends export import super"
	};

	var keywordRelationalOperator = /^in(stanceof)?$/;

	// ## Character categories

	var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
	var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

	// This has a complexity linear to the value of the code. The
	// assumption is that looking up astral identifier characters is
	// rare.
	function isInAstralSet(code, set) {
	  var pos = 0x10000;
	  for (var i = 0; i < set.length; i += 2) {
	    pos += set[i];
	    if (pos > code) { return false }
	    pos += set[i + 1];
	    if (pos >= code) { return true }
	  }
	  return false
	}

	// Test whether a given character code starts an identifier.

	function isIdentifierStart(code, astral) {
	  if (code < 65) { return code === 36 }
	  if (code < 91) { return true }
	  if (code < 97) { return code === 95 }
	  if (code < 123) { return true }
	  if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code)) }
	  if (astral === false) { return false }
	  return isInAstralSet(code, astralIdentifierStartCodes)
	}

	// Test whether a given character is part of an identifier.

	function isIdentifierChar(code, astral) {
	  if (code < 48) { return code === 36 }
	  if (code < 58) { return true }
	  if (code < 65) { return false }
	  if (code < 91) { return true }
	  if (code < 97) { return code === 95 }
	  if (code < 123) { return true }
	  if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code)) }
	  if (astral === false) { return false }
	  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes)
	}

	// ## Token types

	// The assignment of fine-grained, information-carrying type objects
	// allows the tokenizer to store the information it has about a
	// token in a way that is very cheap for the parser to look up.

	// All token type variables start with an underscore, to make them
	// easy to recognize.

	// The `beforeExpr` property is used to disambiguate between regular
	// expressions and divisions. It is set on all token types that can
	// be followed by an expression (thus, a slash after them would be a
	// regular expression).
	//
	// The `startsExpr` property is used to check if the token ends a
	// `yield` expression. It is set on all token types that either can
	// directly start an expression (like a quotation mark) or can
	// continue an expression (like the body of a string).
	//
	// `isLoop` marks a keyword as starting a loop, which is important
	// to know when parsing a label, in order to allow or disallow
	// continue jumps to that label.

	var TokenType = function TokenType(label, conf) {
	  if ( conf === void 0 ) conf = {};

	  this.label = label;
	  this.keyword = conf.keyword;
	  this.beforeExpr = !!conf.beforeExpr;
	  this.startsExpr = !!conf.startsExpr;
	  this.isLoop = !!conf.isLoop;
	  this.isAssign = !!conf.isAssign;
	  this.prefix = !!conf.prefix;
	  this.postfix = !!conf.postfix;
	  this.binop = conf.binop || null;
	  this.updateContext = null;
	};

	function binop(name, prec) {
	  return new TokenType(name, {beforeExpr: true, binop: prec})
	}
	var beforeExpr = {beforeExpr: true}, startsExpr = {startsExpr: true};

	// Map keyword names to token types.

	var keywords = {};

	// Succinct definitions of keyword token types
	function kw(name, options) {
	  if ( options === void 0 ) options = {};

	  options.keyword = name;
	  return keywords[name] = new TokenType(name, options)
	}

	var types$1 = {
	  num: new TokenType("num", startsExpr),
	  regexp: new TokenType("regexp", startsExpr),
	  string: new TokenType("string", startsExpr),
	  name: new TokenType("name", startsExpr),
	  privateId: new TokenType("privateId", startsExpr),
	  eof: new TokenType("eof"),

	  // Punctuation token types.
	  bracketL: new TokenType("[", {beforeExpr: true, startsExpr: true}),
	  bracketR: new TokenType("]"),
	  braceL: new TokenType("{", {beforeExpr: true, startsExpr: true}),
	  braceR: new TokenType("}"),
	  parenL: new TokenType("(", {beforeExpr: true, startsExpr: true}),
	  parenR: new TokenType(")"),
	  comma: new TokenType(",", beforeExpr),
	  semi: new TokenType(";", beforeExpr),
	  colon: new TokenType(":", beforeExpr),
	  dot: new TokenType("."),
	  question: new TokenType("?", beforeExpr),
	  questionDot: new TokenType("?."),
	  arrow: new TokenType("=>", beforeExpr),
	  template: new TokenType("template"),
	  invalidTemplate: new TokenType("invalidTemplate"),
	  ellipsis: new TokenType("...", beforeExpr),
	  backQuote: new TokenType("`", startsExpr),
	  dollarBraceL: new TokenType("${", {beforeExpr: true, startsExpr: true}),

	  // Operators. These carry several kinds of properties to help the
	  // parser use them properly (the presence of these properties is
	  // what categorizes them as operators).
	  //
	  // `binop`, when present, specifies that this operator is a binary
	  // operator, and will refer to its precedence.
	  //
	  // `prefix` and `postfix` mark the operator as a prefix or postfix
	  // unary operator.
	  //
	  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
	  // binary operators with a very low precedence, that should result
	  // in AssignmentExpression nodes.

	  eq: new TokenType("=", {beforeExpr: true, isAssign: true}),
	  assign: new TokenType("_=", {beforeExpr: true, isAssign: true}),
	  incDec: new TokenType("++/--", {prefix: true, postfix: true, startsExpr: true}),
	  prefix: new TokenType("!/~", {beforeExpr: true, prefix: true, startsExpr: true}),
	  logicalOR: binop("||", 1),
	  logicalAND: binop("&&", 2),
	  bitwiseOR: binop("|", 3),
	  bitwiseXOR: binop("^", 4),
	  bitwiseAND: binop("&", 5),
	  equality: binop("==/!=/===/!==", 6),
	  relational: binop("</>/<=/>=", 7),
	  bitShift: binop("<</>>/>>>", 8),
	  plusMin: new TokenType("+/-", {beforeExpr: true, binop: 9, prefix: true, startsExpr: true}),
	  modulo: binop("%", 10),
	  star: binop("*", 10),
	  slash: binop("/", 10),
	  starstar: new TokenType("**", {beforeExpr: true}),
	  coalesce: binop("??", 1),

	  // Keyword token types.
	  _break: kw("break"),
	  _case: kw("case", beforeExpr),
	  _catch: kw("catch"),
	  _continue: kw("continue"),
	  _debugger: kw("debugger"),
	  _default: kw("default", beforeExpr),
	  _do: kw("do", {isLoop: true, beforeExpr: true}),
	  _else: kw("else", beforeExpr),
	  _finally: kw("finally"),
	  _for: kw("for", {isLoop: true}),
	  _function: kw("function", startsExpr),
	  _if: kw("if"),
	  _return: kw("return", beforeExpr),
	  _switch: kw("switch"),
	  _throw: kw("throw", beforeExpr),
	  _try: kw("try"),
	  _var: kw("var"),
	  _const: kw("const"),
	  _while: kw("while", {isLoop: true}),
	  _with: kw("with"),
	  _new: kw("new", {beforeExpr: true, startsExpr: true}),
	  _this: kw("this", startsExpr),
	  _super: kw("super", startsExpr),
	  _class: kw("class", startsExpr),
	  _extends: kw("extends", beforeExpr),
	  _export: kw("export"),
	  _import: kw("import", startsExpr),
	  _null: kw("null", startsExpr),
	  _true: kw("true", startsExpr),
	  _false: kw("false", startsExpr),
	  _in: kw("in", {beforeExpr: true, binop: 7}),
	  _instanceof: kw("instanceof", {beforeExpr: true, binop: 7}),
	  _typeof: kw("typeof", {beforeExpr: true, prefix: true, startsExpr: true}),
	  _void: kw("void", {beforeExpr: true, prefix: true, startsExpr: true}),
	  _delete: kw("delete", {beforeExpr: true, prefix: true, startsExpr: true})
	};

	// Matches a whole line break (where CRLF is considered a single
	// line break). Used to count lines.

	var lineBreak = /\r\n?|\n|\u2028|\u2029/;
	var lineBreakG = new RegExp(lineBreak.source, "g");

	function isNewLine(code) {
	  return code === 10 || code === 13 || code === 0x2028 || code === 0x2029
	}

	function nextLineBreak(code, from, end) {
	  if ( end === void 0 ) end = code.length;

	  for (var i = from; i < end; i++) {
	    var next = code.charCodeAt(i);
	    if (isNewLine(next))
	      { return i < end - 1 && next === 13 && code.charCodeAt(i + 1) === 10 ? i + 2 : i + 1 }
	  }
	  return -1
	}

	var nonASCIIwhitespace = /[\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/;

	var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;

	var ref = Object.prototype;
	var hasOwnProperty = ref.hasOwnProperty;
	var toString = ref.toString;

	var hasOwn = Object.hasOwn || (function (obj, propName) { return (
	  hasOwnProperty.call(obj, propName)
	); });

	var isArray = Array.isArray || (function (obj) { return (
	  toString.call(obj) === "[object Array]"
	); });

	var regexpCache = Object.create(null);

	function wordsRegexp(words) {
	  return regexpCache[words] || (regexpCache[words] = new RegExp("^(?:" + words.replace(/ /g, "|") + ")$"))
	}

	function codePointToString(code) {
	  // UTF-16 Decoding
	  if (code <= 0xFFFF) { return String.fromCharCode(code) }
	  code -= 0x10000;
	  return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00)
	}

	var loneSurrogate = /(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/;

	// These are used when `options.locations` is on, for the
	// `startLoc` and `endLoc` properties.

	var Position = function Position(line, col) {
	  this.line = line;
	  this.column = col;
	};

	Position.prototype.offset = function offset (n) {
	  return new Position(this.line, this.column + n)
	};

	var SourceLocation = function SourceLocation(p, start, end) {
	  this.start = start;
	  this.end = end;
	  if (p.sourceFile !== null) { this.source = p.sourceFile; }
	};

	// The `getLineInfo` function is mostly useful when the
	// `locations` option is off (for performance reasons) and you
	// want to find the line/column position for a given character
	// offset. `input` should be the code string that the offset refers
	// into.

	function getLineInfo(input, offset) {
	  for (var line = 1, cur = 0;;) {
	    var nextBreak = nextLineBreak(input, cur, offset);
	    if (nextBreak < 0) { return new Position(line, offset - cur) }
	    ++line;
	    cur = nextBreak;
	  }
	}

	// A second argument must be given to configure the parser process.
	// These options are recognized (only `ecmaVersion` is required):

	var defaultOptions = {
	  // `ecmaVersion` indicates the ECMAScript version to parse. Must be
	  // either 3, 5, 6 (or 2015), 7 (2016), 8 (2017), 9 (2018), 10
	  // (2019), 11 (2020), 12 (2021), 13 (2022), 14 (2023), or `"latest"`
	  // (the latest version the library supports). This influences
	  // support for strict mode, the set of reserved words, and support
	  // for new syntax features.
	  ecmaVersion: null,
	  // `sourceType` indicates the mode the code should be parsed in.
	  // Can be either `"script"`, `"module"` or `"commonjs"`. This influences global
	  // strict mode and parsing of `import` and `export` declarations.
	  sourceType: "script",
	  // When set to true, enable strict parsing mode even if `sourceType`
	  // is `"script"`.
	  strict: false,
	  // `onInsertedSemicolon` can be a callback that will be called when
	  // a semicolon is automatically inserted. It will be passed the
	  // position of the inserted semicolon as an offset, and if
	  // `locations` is enabled, it is given the location as a `{line,
	  // column}` object as second argument.
	  onInsertedSemicolon: null,
	  // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
	  // trailing commas.
	  onTrailingComma: null,
	  // By default, reserved words are only enforced if ecmaVersion >= 5.
	  // Set `allowReserved` to a boolean value to explicitly turn this on
	  // an off. When this option has the value "never", reserved words
	  // and keywords can also not be used as property names.
	  allowReserved: null,
	  // When enabled, a return at the top level is not considered an
	  // error.
	  allowReturnOutsideFunction: false,
	  // When enabled, import/export statements are not constrained to
	  // appearing at the top of the program, and an import.meta expression
	  // in a script isn't considered an error.
	  allowImportExportEverywhere: false,
	  // By default, await identifiers are allowed to appear at the top-level scope only if ecmaVersion >= 2022.
	  // When enabled, await identifiers are allowed to appear at the top-level scope,
	  // but they are still not allowed in non-async functions.
	  allowAwaitOutsideFunction: null,
	  // When enabled, super identifiers are not constrained to
	  // appearing in methods and do not raise an error when they appear elsewhere.
	  allowSuperOutsideMethod: null,
	  // When enabled, hashbang directive in the beginning of file is
	  // allowed and treated as a line comment. Enabled by default when
	  // `ecmaVersion` >= 2023.
	  allowHashBang: false,
	  // By default, the parser will verify that private properties are
	  // only used in places where they are valid and have been declared.
	  // Set this to false to turn such checks off.
	  checkPrivateFields: true,
	  // When `locations` is on, `loc` properties holding objects with
	  // `start` and `end` properties in `{line, column}` form (with
	  // line being 1-based and column 0-based) will be attached to the
	  // nodes.
	  locations: false,
	  // Pass an optional `{line, column}` object to use for the start of
	  // the parse. This is mostly useful when using `parseExpressionAt`
	  // with `locations: true`, to prevent the parser from having to
	  // determine the line position at the start position.
	  startLocation: null,
	  // A function can be passed as `onToken` option, which will
	  // cause Acorn to call that function with object in the same
	  // format as tokens returned from `tokenizer().getToken()`. Note
	  // that you are not allowed to call the parser from the
	  // callback—that will corrupt its internal state.
	  onToken: null,
	  // A function can be passed as `onComment` option, which will
	  // cause Acorn to call that function with `(block, text, start,
	  // end)` parameters whenever a comment is skipped. `block` is a
	  // boolean indicating whether this is a block (`/* */`) comment,
	  // `text` is the content of the comment, and `start` and `end` are
	  // character offsets that denote the start and end of the comment.
	  // When the `locations` option is on, two more parameters are
	  // passed, the full `{line, column}` locations of the start and
	  // end of the comments. Note that you are not allowed to call the
	  // parser from the callback—that will corrupt its internal state.
	  // When this option has an array as value, objects representing the
	  // comments are pushed to it.
	  onComment: null,
	  // Nodes have their start and end characters offsets recorded in
	  // `start` and `end` properties (directly on the node, rather than
	  // the `loc` object, which holds line/column data. To also add a
	  // [semi-standardized][range] `range` property holding a `[start,
	  // end]` array with the same numbers, set the `ranges` option to
	  // `true`.
	  //
	  // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
	  ranges: false,
	  // It is possible to parse multiple files into a single AST by
	  // passing the tree produced by parsing the first file as
	  // `program` option in subsequent parses. This will add the
	  // toplevel forms of the parsed file to the `Program` (top) node
	  // of an existing parse tree.
	  program: null,
	  // When `locations` is on, you can pass this to record the source
	  // file in every node's `loc` object.
	  sourceFile: null,
	  // This value, if given, is stored in every node, whether
	  // `locations` is on or off.
	  directSourceFile: null,
	  // When enabled, parenthesized expressions are represented by
	  // (non-standard) ParenthesizedExpression nodes
	  preserveParens: false
	};

	// Interpret and default an options object

	var warnedAboutEcmaVersion = false;

	function getOptions(opts) {
	  var options = {};

	  for (var opt in defaultOptions)
	    { options[opt] = opts && hasOwn(opts, opt) ? opts[opt] : defaultOptions[opt]; }

	  if (options.ecmaVersion === "latest") {
	    options.ecmaVersion = 1e8;
	  } else if (options.ecmaVersion == null) {
	    if (!warnedAboutEcmaVersion && typeof console === "object" && console.warn) {
	      warnedAboutEcmaVersion = true;
	      console.warn("Since Acorn 8.0.0, options.ecmaVersion is required.\nDefaulting to 2020, but this will stop working in the future.");
	    }
	    options.ecmaVersion = 11;
	  } else if (options.ecmaVersion >= 2015) {
	    options.ecmaVersion -= 2009;
	  }

	  if (options.allowReserved == null)
	    { options.allowReserved = options.ecmaVersion < 5; }

	  if (!opts || opts.allowHashBang == null)
	    { options.allowHashBang = options.ecmaVersion >= 14; }

	  if (isArray(options.onToken)) {
	    var tokens = options.onToken;
	    options.onToken = function (token) { return tokens.push(token); };
	  }
	  if (isArray(options.onComment))
	    { options.onComment = pushComment(options, options.onComment); }

	  if (options.sourceType === "commonjs" && options.allowAwaitOutsideFunction)
	    { throw new Error("Cannot use allowAwaitOutsideFunction with sourceType: commonjs") }

	  return options
	}

	function pushComment(options, array) {
	  return function(block, text, start, end, startLoc, endLoc) {
	    var comment = {
	      type: block ? "Block" : "Line",
	      value: text,
	      start: start,
	      end: end
	    };
	    if (options.locations)
	      { comment.loc = new SourceLocation(this, startLoc, endLoc); }
	    if (options.ranges)
	      { comment.range = [start, end]; }
	    array.push(comment);
	  }
	}

	// Each scope gets a bitset that may contain these flags
	var
	    SCOPE_TOP = 1,
	    SCOPE_FUNCTION = 2,
	    SCOPE_ASYNC = 4,
	    SCOPE_GENERATOR = 8,
	    SCOPE_ARROW = 16,
	    SCOPE_SIMPLE_CATCH = 32,
	    SCOPE_SUPER = 64,
	    SCOPE_DIRECT_SUPER = 128,
	    SCOPE_CLASS_STATIC_BLOCK = 256,
	    SCOPE_CLASS_FIELD_INIT = 512,
	    SCOPE_SWITCH = 1024,
	    SCOPE_VAR = SCOPE_TOP | SCOPE_FUNCTION | SCOPE_CLASS_STATIC_BLOCK;

	function functionFlags(async, generator) {
	  return SCOPE_FUNCTION | (async ? SCOPE_ASYNC : 0) | (generator ? SCOPE_GENERATOR : 0)
	}

	// Used in checkLVal* and declareName to determine the type of a binding
	var
	    BIND_NONE = 0, // Not a binding
	    BIND_VAR = 1, // Var-style binding
	    BIND_LEXICAL = 2, // Let- or const-style binding
	    BIND_FUNCTION = 3, // Function declaration
	    BIND_SIMPLE_CATCH = 4, // Simple (identifier pattern) catch binding
	    BIND_OUTSIDE = 5; // Special case for function names as bound inside the function

	var Parser = function Parser(options, input, startPos) {
	  this.options = options = getOptions(options);
	  this.sourceFile = options.sourceFile;
	  this.keywords = wordsRegexp(keywords$1[options.ecmaVersion >= 6 ? 6 : options.sourceType === "module" ? "5module" : 5]);
	  var reserved = "";
	  if (options.allowReserved !== true) {
	    reserved = reservedWords[options.ecmaVersion >= 6 ? 6 : options.ecmaVersion === 5 ? 5 : 3];
	    if (options.sourceType === "module") { reserved += " await"; }
	  }
	  this.reservedWords = wordsRegexp(reserved);
	  var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict;
	  this.reservedWordsStrict = wordsRegexp(reservedStrict);
	  this.reservedWordsStrictBind = wordsRegexp(reservedStrict + " " + reservedWords.strictBind);
	  this.input = String(input);

	  // Used to signal to callers of `readWord1` whether the word
	  // contained any escape sequences. This is needed because words with
	  // escape sequences must not be interpreted as keywords.
	  this.containsEsc = false;

	  // Set up token state

	  // The current position of the tokenizer in the input.
	  this.pos = startPos || 0;
	  this.curLine = 1;
	  if (options.startLocation) {
	    this.lineStart = this.pos - options.startLocation.column;
	    this.curLine = options.startLocation.line;
	  } else if (startPos) {
	    this.lineStart = this.input.lastIndexOf("\n", startPos - 1) + 1;
	    if (this.options.locations)
	      { this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length; }
	  } else {
	    this.lineStart = 0;
	  }

	  // Properties of the current token:
	  // Its type
	  this.type = types$1.eof;
	  // For tokens that include more information than their type, the value
	  this.value = null;
	  // Its start and end offset
	  this.start = this.end = this.pos;
	  // And, if locations are used, the {line, column} object
	  // corresponding to those offsets
	  this.startLoc = this.endLoc = this.curPosition();

	  // Position information for the previous token
	  this.lastTokEndLoc = this.lastTokStartLoc = null;
	  this.lastTokStart = this.lastTokEnd = this.pos;

	  // The context stack is used to superficially track syntactic
	  // context to predict whether a regular expression is allowed in a
	  // given position.
	  this.context = this.initialContext();
	  this.exprAllowed = true;

	  // Figure out if it's a module code.
	  this.inModule = options.sourceType === "module";
	  this.strict = this.inModule || options.strict === true || this.strictDirective(this.pos);

	  // Used to signify the start of a potential arrow function
	  this.potentialArrowAt = -1;
	  this.potentialArrowInForAwait = false;

	  // Positions to delayed-check that yield/await does not exist in default parameters.
	  this.yieldPos = this.awaitPos = this.awaitIdentPos = 0;
	  // Labels in scope.
	  this.labels = [];
	  // Thus-far undefined exports.
	  this.undefinedExports = Object.create(null);

	  // If enabled, skip leading hashbang line.
	  if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === "#!")
	    { this.skipLineComment(2); }

	  // Scope tracking for duplicate variable names (see scope.js)
	  this.scopeStack = [];
	  this.enterScope(
	    this.options.sourceType === "commonjs"
	      // In commonjs, the top-level scope behaves like a function scope
	      ? SCOPE_FUNCTION
	      : SCOPE_TOP
	  );

	  // For RegExp validation
	  this.regexpState = null;

	  // The stack of private names.
	  // Each element has two properties: 'declared' and 'used'.
	  // When it exited from the outermost class definition, all used private names must be declared.
	  this.privateNameStack = [];
	};

	var prototypeAccessors = { inFunction: { configurable: true },inGenerator: { configurable: true },inAsync: { configurable: true },canAwait: { configurable: true },allowReturn: { configurable: true },allowSuper: { configurable: true },allowDirectSuper: { configurable: true },treatFunctionsAsVar: { configurable: true },allowNewDotTarget: { configurable: true },allowUsing: { configurable: true },inClassStaticBlock: { configurable: true } };

	Parser.prototype.parse = function parse () {
	    var this$1$1 = this;

	  var node = this.options.program || this.startNode();
	  this.nextToken();
	  return this.catchStackOverflow(function () { return this$1$1.parseTopLevel(node); })
	};

	prototypeAccessors.inFunction.get = function () { return (this.currentVarScope().flags & SCOPE_FUNCTION) > 0 };

	prototypeAccessors.inGenerator.get = function () { return (this.currentVarScope().flags & SCOPE_GENERATOR) > 0 };

	prototypeAccessors.inAsync.get = function () { return (this.currentVarScope().flags & SCOPE_ASYNC) > 0 };

	prototypeAccessors.canAwait.get = function () {
	  for (var i = this.scopeStack.length - 1; i >= 0; i--) {
	    var ref = this.scopeStack[i];
	      var flags = ref.flags;
	    if (flags & (SCOPE_CLASS_STATIC_BLOCK | SCOPE_CLASS_FIELD_INIT)) { return false }
	    if (flags & SCOPE_FUNCTION) { return (flags & SCOPE_ASYNC) > 0 }
	  }
	  return (this.inModule && this.options.ecmaVersion >= 13) || this.options.allowAwaitOutsideFunction
	};

	prototypeAccessors.allowReturn.get = function () {
	  if (this.inFunction) { return true }
	  if (this.options.allowReturnOutsideFunction && this.currentVarScope().flags & SCOPE_TOP) { return true }
	  return false
	};

	prototypeAccessors.allowSuper.get = function () {
	  var ref = this.currentThisScope();
	    var flags = ref.flags;
	  return (flags & SCOPE_SUPER) > 0 || this.options.allowSuperOutsideMethod
	};

	prototypeAccessors.allowDirectSuper.get = function () { return (this.currentThisScope().flags & SCOPE_DIRECT_SUPER) > 0 };

	prototypeAccessors.treatFunctionsAsVar.get = function () { return this.treatFunctionsAsVarInScope(this.currentScope()) };

	prototypeAccessors.allowNewDotTarget.get = function () {
	  for (var i = this.scopeStack.length - 1; i >= 0; i--) {
	    var ref = this.scopeStack[i];
	      var flags = ref.flags;
	    if (flags & (SCOPE_CLASS_STATIC_BLOCK | SCOPE_CLASS_FIELD_INIT) ||
	        ((flags & SCOPE_FUNCTION) && !(flags & SCOPE_ARROW))) { return true }
	  }
	  return false
	};

	prototypeAccessors.allowUsing.get = function () {
	  var ref = this.currentScope();
	    var flags = ref.flags;
	  if (flags & SCOPE_SWITCH) { return false }
	  if (!this.inModule && flags & SCOPE_TOP) { return false }
	  return true
	};

	prototypeAccessors.inClassStaticBlock.get = function () {
	  return (this.currentVarScope().flags & SCOPE_CLASS_STATIC_BLOCK) > 0
	};

	Parser.extend = function extend () {
	    var plugins = [], len = arguments.length;
	    while ( len-- ) plugins[ len ] = arguments[ len ];

	  var cls = this;
	  for (var i = 0; i < plugins.length; i++) { cls = plugins[i](cls); }
	  return cls
	};

	Parser.parse = function parse (input, options) {
	  return new this(options, input).parse()
	};

	Parser.parseExpressionAt = function parseExpressionAt (input, pos, options) {
	  var parser = new this(options, input, pos);
	  parser.nextToken();
	  return parser.parseExpression()
	};

	Parser.tokenizer = function tokenizer (input, options) {
	  return new this(options, input)
	};

	Object.defineProperties( Parser.prototype, prototypeAccessors );

	var pp$9 = Parser.prototype;

	// ## Parser utilities

	var literal = /^(?:'((?:\\[^]|[^'\\])*?)'|"((?:\\[^]|[^"\\])*?)")/;
	pp$9.strictDirective = function(start) {
	  if (this.options.ecmaVersion < 5) { return false }
	  for (;;) {
	    // Try to find string literal.
	    skipWhiteSpace.lastIndex = start;
	    start += skipWhiteSpace.exec(this.input)[0].length;
	    var match = literal.exec(this.input.slice(start));
	    if (!match) { return false }
	    if ((match[1] || match[2]) === "use strict") {
	      skipWhiteSpace.lastIndex = start + match[0].length;
	      var spaceAfter = skipWhiteSpace.exec(this.input), end = spaceAfter.index + spaceAfter[0].length;
	      var next = this.input.charAt(end);
	      return next === ";" || next === "}" ||
	        (lineBreak.test(spaceAfter[0]) &&
	         !(/[(`.[+\-/*%<>=,?^&]/.test(next) || next === "!" && this.input.charAt(end + 1) === "="))
	    }
	    start += match[0].length;

	    // Skip semicolon, if any.
	    skipWhiteSpace.lastIndex = start;
	    start += skipWhiteSpace.exec(this.input)[0].length;
	    if (this.input[start] === ";")
	      { start++; }
	  }
	};

	// Predicate that tests whether the next token is of the given
	// type, and if yes, consumes it as a side effect.

	pp$9.eat = function(type) {
	  if (this.type === type) {
	    this.next();
	    return true
	  } else {
	    return false
	  }
	};

	// Tests whether parsed token is a contextual keyword.

	pp$9.isContextual = function(name) {
	  return this.type === types$1.name && this.value === name && !this.containsEsc
	};

	// Consumes contextual keyword if possible.

	pp$9.eatContextual = function(name) {
	  if (!this.isContextual(name)) { return false }
	  this.next();
	  return true
	};

	pp$9.catchStackOverflow = function(f) {
	  try {
	    return f()
	  } catch (e) {
	    if (e instanceof Error && (/\bstack\b.*\b(exceeded|overflow)\b/i.test(e.message) || /\btoo much recursion\b/i.test(e.message)))
	      { this.raise(this.start, "Not enough stack space to parse input"); }
	    else
	      { throw e }
	  }
	};

	// Asserts that following token is given contextual keyword.

	pp$9.expectContextual = function(name) {
	  if (!this.eatContextual(name)) { this.unexpected(); }
	};

	// Test whether a semicolon can be inserted at the current position.

	pp$9.canInsertSemicolon = function() {
	  return this.type === types$1.eof ||
	    this.type === types$1.braceR ||
	    lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
	};

	pp$9.insertSemicolon = function() {
	  if (this.canInsertSemicolon()) {
	    if (this.options.onInsertedSemicolon)
	      { this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc); }
	    return true
	  }
	};

	// Consume a semicolon, or, failing that, see if we are allowed to
	// pretend that there is a semicolon at this position.

	pp$9.semicolon = function() {
	  if (!this.eat(types$1.semi) && !this.insertSemicolon()) { this.unexpected(); }
	};

	pp$9.afterTrailingComma = function(tokType, notNext) {
	  if (this.type === tokType) {
	    if (this.options.onTrailingComma)
	      { this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc); }
	    if (!notNext)
	      { this.next(); }
	    return true
	  }
	};

	// Expect a token of a given type. If found, consume it, otherwise,
	// raise an unexpected token error.

	pp$9.expect = function(type) {
	  this.eat(type) || this.unexpected();
	};

	// Raise an unexpected token error.

	pp$9.unexpected = function(pos) {
	  this.raise(pos != null ? pos : this.start, "Unexpected token");
	};

	var DestructuringErrors = function DestructuringErrors() {
	  this.shorthandAssign =
	  this.trailingComma =
	  this.parenthesizedAssign =
	  this.parenthesizedBind =
	  this.doubleProto =
	    -1;
	};

	pp$9.checkPatternErrors = function(refDestructuringErrors, isAssign) {
	  if (!refDestructuringErrors) { return }
	  if (refDestructuringErrors.trailingComma > -1)
	    { this.raiseRecoverable(refDestructuringErrors.trailingComma, "Comma is not permitted after the rest element"); }
	  var parens = isAssign ? refDestructuringErrors.parenthesizedAssign : refDestructuringErrors.parenthesizedBind;
	  if (parens > -1) { this.raiseRecoverable(parens, isAssign ? "Assigning to rvalue" : "Parenthesized pattern"); }
	};

	pp$9.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
	  if (!refDestructuringErrors) { return false }
	  var shorthandAssign = refDestructuringErrors.shorthandAssign;
	  var doubleProto = refDestructuringErrors.doubleProto;
	  if (!andThrow) { return shorthandAssign >= 0 || doubleProto >= 0 }
	  if (shorthandAssign >= 0)
	    { this.raise(shorthandAssign, "Shorthand property assignments are valid only in destructuring patterns"); }
	  if (doubleProto >= 0)
	    { this.raiseRecoverable(doubleProto, "Redefinition of __proto__ property"); }
	};

	pp$9.checkYieldAwaitInDefaultParams = function() {
	  if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos))
	    { this.raise(this.yieldPos, "Yield expression cannot be a default value"); }
	  if (this.awaitPos)
	    { this.raise(this.awaitPos, "Await expression cannot be a default value"); }
	};

	pp$9.isSimpleAssignTarget = function(expr) {
	  if (expr.type === "ParenthesizedExpression")
	    { return this.isSimpleAssignTarget(expr.expression) }
	  return expr.type === "Identifier" || expr.type === "MemberExpression"
	};

	var pp$8 = Parser.prototype;

	// ### Statement parsing

	// Parse a program. Initializes the parser, reads any number of
	// statements, and wraps them in a Program node.  Optionally takes a
	// `program` argument.  If present, the statements will be appended
	// to its body instead of creating a new node.

	pp$8.parseTopLevel = function(node) {
	  var exports$1 = Object.create(null);
	  if (!node.body) { node.body = []; }
	  while (this.type !== types$1.eof) {
	    var stmt = this.parseStatement(null, true, exports$1);
	    node.body.push(stmt);
	  }
	  if (this.inModule)
	    { for (var i = 0, list = Object.keys(this.undefinedExports); i < list.length; i += 1)
	      {
	        var name = list[i];

	        this.raiseRecoverable(this.undefinedExports[name].start, ("Export '" + name + "' is not defined"));
	      } }
	  this.adaptDirectivePrologue(node.body);
	  this.next();
	  node.sourceType = this.options.sourceType === "commonjs" ? "script" : this.options.sourceType;
	  return this.finishNode(node, "Program")
	};

	var loopLabel = {kind: "loop"}, switchLabel = {kind: "switch"};

	pp$8.isLet = function(context) {
	  if (this.options.ecmaVersion < 6 || !this.isContextual("let")) { return false }
	  skipWhiteSpace.lastIndex = this.pos;
	  var skip = skipWhiteSpace.exec(this.input);
	  var next = this.pos + skip[0].length, nextCh = this.fullCharCodeAt(next);
	  // For ambiguous cases, determine if a LexicalDeclaration (or only a
	  // Statement) is allowed here. If context is not empty then only a Statement
	  // is allowed. However, `let [` is an explicit negative lookahead for
	  // ExpressionStatement, so special-case it first.
	  if (nextCh === 91 || nextCh === 92) { return true } // '[', '\'
	  if (context) { return false }

	  if (nextCh === 123) { return true } // '{'
	  if (isIdentifierStart(nextCh)) {
	    var start = next;
	    do { next += nextCh <= 0xffff ? 1 : 2; }
	    while (isIdentifierChar(nextCh = this.fullCharCodeAt(next)))
	    if (nextCh === 92) { return true }
	    var ident = this.input.slice(start, next);
	    if (!keywordRelationalOperator.test(ident)) { return true }
	  }
	  return false
	};

	// check 'async [no LineTerminator here] function'
	// - 'async /*foo*/ function' is OK.
	// - 'async /*\n*/ function' is invalid.
	pp$8.isAsyncFunction = function() {
	  if (this.options.ecmaVersion < 8 || !this.isContextual("async"))
	    { return false }

	  skipWhiteSpace.lastIndex = this.pos;
	  var skip = skipWhiteSpace.exec(this.input);
	  var next = this.pos + skip[0].length, after;
	  return !lineBreak.test(this.input.slice(this.pos, next)) &&
	    this.input.slice(next, next + 8) === "function" &&
	    (next + 8 === this.input.length ||
	     !(isIdentifierChar(after = this.fullCharCodeAt(next + 8)) || after === 92 /* '\' */))
	};

	pp$8.isUsingKeyword = function(isAwaitUsing, isFor) {
	  if (this.options.ecmaVersion < 17 || !this.isContextual(isAwaitUsing ? "await" : "using"))
	    { return false }

	  skipWhiteSpace.lastIndex = this.pos;
	  var skip = skipWhiteSpace.exec(this.input);
	  var next = this.pos + skip[0].length;

	  if (lineBreak.test(this.input.slice(this.pos, next))) { return false }

	  if (isAwaitUsing) {
	    var usingEndPos = next + 5 /* using */, after;
	    if (this.input.slice(next, usingEndPos) !== "using" ||
	      usingEndPos === this.input.length ||
	      isIdentifierChar(after = this.fullCharCodeAt(usingEndPos)) ||
	      after === 92 /* '\' */
	    ) { return false }

	    skipWhiteSpace.lastIndex = usingEndPos;
	    var skipAfterUsing = skipWhiteSpace.exec(this.input);
	    next = usingEndPos + skipAfterUsing[0].length;
	    if (skipAfterUsing && lineBreak.test(this.input.slice(usingEndPos, next))) { return false }
	  }

	  var ch = this.fullCharCodeAt(next);
	  if (!isIdentifierStart(ch) && ch !== 92 /* '\' */) { return false }
	  var idStart = next;
	  do { next += ch <= 0xffff ? 1 : 2; }
	  while (isIdentifierChar(ch = this.fullCharCodeAt(next)))
	  if (ch === 92) { return true }
	  var id = this.input.slice(idStart, next);
	  if (keywordRelationalOperator.test(id)) { return false }
	  if (isFor && !isAwaitUsing && id === "of") {
	    // Look ahead for using declaration with initializer, i.e., `for (using of = ...)`
	    skipWhiteSpace.lastIndex = next;
	    var skipAfterOf = skipWhiteSpace.exec(this.input);
	    next = next + skipAfterOf[0].length;
	    if (this.input.charCodeAt(next) !== 61 /* '=' */ ||
	      // Check for ==, === and => operators
	      (ch = this.input.charCodeAt(next + 1)) === 61 /* '=' */ || ch === 62 /* '>' */) {
	      return false
	    }
	  }
	  return true
	};

	pp$8.isAwaitUsing = function(isFor) {
	  return this.isUsingKeyword(true, isFor)
	};

	pp$8.isUsing = function(isFor) {
	  return this.isUsingKeyword(false, isFor)
	};

	// Parse a single statement.
	//
	// If expecting a statement and finding a slash operator, parse a
	// regular expression literal. This is to handle cases like
	// `if (foo) /blah/.exec(foo)`, where looking at the previous token
	// does not help.

	pp$8.parseStatement = function(context, topLevel, exports$1) {
	  var starttype = this.type, node = this.startNode(), kind;

	  if (this.isLet(context)) {
	    starttype = types$1._var;
	    kind = "let";
	  }

	  // Most types of statements are recognized by the keyword they
	  // start with. Many are trivial to parse, some require a bit of
	  // complexity.

	  switch (starttype) {
	  case types$1._break: case types$1._continue: return this.parseBreakContinueStatement(node, starttype.keyword)
	  case types$1._debugger: return this.parseDebuggerStatement(node)
	  case types$1._do: return this.parseDoStatement(node)
	  case types$1._for: return this.parseForStatement(node)
	  case types$1._function:
	    // Function as sole body of either an if statement or a labeled statement
	    // works, but not when it is part of a labeled statement that is the sole
	    // body of an if statement.
	    if ((context && (this.strict || context !== "if" && context !== "label")) && this.options.ecmaVersion >= 6) { this.unexpected(); }
	    return this.parseFunctionStatement(node, false, !context)
	  case types$1._class:
	    if (context) { this.unexpected(); }
	    return this.parseClass(node, true)
	  case types$1._if: return this.parseIfStatement(node)
	  case types$1._return: return this.parseReturnStatement(node)
	  case types$1._switch: return this.parseSwitchStatement(node)
	  case types$1._throw: return this.parseThrowStatement(node)
	  case types$1._try: return this.parseTryStatement(node)
	  case types$1._const: case types$1._var:
	    kind = kind || this.value;
	    if (context && kind !== "var") { this.unexpected(); }
	    return this.parseVarStatement(node, kind)
	  case types$1._while: return this.parseWhileStatement(node)
	  case types$1._with: return this.parseWithStatement(node)
	  case types$1.braceL: return this.parseBlock(true, node)
	  case types$1.semi: return this.parseEmptyStatement(node)
	  case types$1._export:
	  case types$1._import:
	    if (this.options.ecmaVersion > 10 && starttype === types$1._import) {
	      skipWhiteSpace.lastIndex = this.pos;
	      var skip = skipWhiteSpace.exec(this.input);
	      var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
	      if (nextCh === 40 || nextCh === 46) // '(' or '.'
	        { return this.parseExpressionStatement(node, this.parseExpression()) }
	    }

	    if (!this.options.allowImportExportEverywhere) {
	      if (!topLevel)
	        { this.raise(this.start, "'import' and 'export' may only appear at the top level"); }
	      if (!this.inModule)
	        { this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'"); }
	    }
	    return starttype === types$1._import ? this.parseImport(node) : this.parseExport(node, exports$1)

	    // If the statement does not start with a statement keyword or a
	    // brace, it's an ExpressionStatement or LabeledStatement. We
	    // simply start parsing an expression, and afterwards, if the
	    // next token is a colon and the expression was a simple
	    // Identifier node, we switch to interpreting it as a label.
	  default:
	    if (this.isAsyncFunction()) {
	      if (context) { this.unexpected(); }
	      this.next();
	      return this.parseFunctionStatement(node, true, !context)
	    }

	    var usingKind = this.isAwaitUsing(false) ? "await using" : this.isUsing(false) ? "using" : null;
	    if (usingKind) {
	      if (!this.allowUsing) {
	        this.raise(this.start, "Using declaration cannot appear in the top level when source type is `script` or in the bare case statement");
	      }
	      if (context) {
	        // Cases like `for (;;) using x = ...;`, `if (true) await using x = ...;`, etc. are not allowed.
	        this.raise(this.start, "Using declaration is not allowed in single-statement positions");
	      }
	      if (usingKind === "await using") {
	        if (!this.canAwait) {
	          this.raise(this.start, "Await using cannot appear outside of async function");
	        }
	        this.next();
	      }
	      this.next();
	      this.parseVar(node, false, usingKind);
	      this.semicolon();
	      return this.finishNode(node, "VariableDeclaration")
	    }

	    var maybeName = this.value, expr = this.parseExpression();
	    if (starttype === types$1.name && expr.type === "Identifier" && this.eat(types$1.colon))
	      { return this.parseLabeledStatement(node, maybeName, expr, context) }
	    else { return this.parseExpressionStatement(node, expr) }
	  }
	};

	pp$8.parseBreakContinueStatement = function(node, keyword) {
	  var isBreak = keyword === "break";
	  this.next();
	  if (this.eat(types$1.semi) || this.insertSemicolon()) { node.label = null; }
	  else if (this.type !== types$1.name) { this.unexpected(); }
	  else {
	    node.label = this.parseIdent();
	    this.semicolon();
	  }

	  // Verify that there is an actual destination to break or
	  // continue to.
	  var i = 0;
	  for (; i < this.labels.length; ++i) {
	    var lab = this.labels[i];
	    if (node.label == null || lab.name === node.label.name) {
	      if (lab.kind != null && (isBreak || lab.kind === "loop")) { break }
	      if (node.label && isBreak) { break }
	    }
	  }
	  if (i === this.labels.length) { this.raise(node.start, "Unsyntactic " + keyword); }
	  return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement")
	};

	pp$8.parseDebuggerStatement = function(node) {
	  this.next();
	  this.semicolon();
	  return this.finishNode(node, "DebuggerStatement")
	};

	pp$8.parseDoStatement = function(node) {
	  this.next();
	  this.labels.push(loopLabel);
	  node.body = this.parseStatement("do");
	  this.labels.pop();
	  this.expect(types$1._while);
	  node.test = this.parseParenExpression();
	  if (this.options.ecmaVersion >= 6)
	    { this.eat(types$1.semi); }
	  else
	    { this.semicolon(); }
	  return this.finishNode(node, "DoWhileStatement")
	};

	// Disambiguating between a `for` and a `for`/`in` or `for`/`of`
	// loop is non-trivial. Basically, we have to parse the init `var`
	// statement or expression, disallowing the `in` operator (see
	// the second parameter to `parseExpression`), and then check
	// whether the next token is `in` or `of`. When there is no init
	// part (semicolon immediately after the opening parenthesis), it
	// is a regular `for` loop.

	pp$8.parseForStatement = function(node) {
	  this.next();
	  var awaitAt = (this.options.ecmaVersion >= 9 && this.canAwait && this.eatContextual("await")) ? this.lastTokStart : -1;
	  this.labels.push(loopLabel);
	  this.enterScope(0);
	  this.expect(types$1.parenL);
	  if (this.type === types$1.semi) {
	    if (awaitAt > -1) { this.unexpected(awaitAt); }
	    return this.parseFor(node, null)
	  }
	  var isLet = this.isLet();
	  if (this.type === types$1._var || this.type === types$1._const || isLet) {
	    var init$1 = this.startNode(), kind = isLet ? "let" : this.value;
	    this.next();
	    this.parseVar(init$1, true, kind);
	    this.finishNode(init$1, "VariableDeclaration");
	    return this.parseForAfterInit(node, init$1, awaitAt)
	  }
	  var startsWithLet = this.isContextual("let"), isForOf = false;

	  var usingKind = this.isUsing(true) ? "using" : this.isAwaitUsing(true) ? "await using" : null;
	  if (usingKind) {
	    var init$2 = this.startNode();
	    this.next();
	    if (usingKind === "await using") {
	      if (!this.canAwait) {
	        this.raise(this.start, "Await using cannot appear outside of async function");
	      }
	      this.next();
	    }
	    this.parseVar(init$2, true, usingKind);
	    this.finishNode(init$2, "VariableDeclaration");
	    return this.parseForAfterInit(node, init$2, awaitAt)
	  }
	  var containsEsc = this.containsEsc;
	  var refDestructuringErrors = new DestructuringErrors;
	  var initPos = this.start;
	  var init = awaitAt > -1
	    ? this.parseExprSubscripts(refDestructuringErrors, "await")
	    : this.parseExpression(true, refDestructuringErrors);
	  if (this.type === types$1._in || (isForOf = this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
	    if (awaitAt > -1) { // implies `ecmaVersion >= 9` (see declaration of awaitAt)
	      if (this.type === types$1._in) { this.unexpected(awaitAt); }
	      node.await = true;
	    } else if (isForOf && this.options.ecmaVersion >= 8) {
	      if (init.start === initPos && !containsEsc && init.type === "Identifier" && init.name === "async") { this.unexpected(); }
	      else if (this.options.ecmaVersion >= 9) { node.await = false; }
	    }
	    if (startsWithLet && isForOf) { this.raise(init.start, "The left-hand side of a for-of loop may not start with 'let'."); }
	    this.toAssignable(init, false, refDestructuringErrors);
	    this.checkLValPattern(init);
	    return this.parseForIn(node, init)
	  } else {
	    this.checkExpressionErrors(refDestructuringErrors, true);
	  }
	  if (awaitAt > -1) { this.unexpected(awaitAt); }
	  return this.parseFor(node, init)
	};

	// Helper method to parse for loop after variable initialization
	pp$8.parseForAfterInit = function(node, init, awaitAt) {
	  if ((this.type === types$1._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) && init.declarations.length === 1) {
	    if (this.type === types$1._in) {
	      if ((init.kind === "using" || init.kind === "await using") && !init.declarations[0].init) {
	        this.raise(this.start, "Using declaration is not allowed in for-in loops");
	      }
	      if (this.options.ecmaVersion >= 9 && awaitAt > -1) { this.unexpected(awaitAt); }
	    } else if (this.options.ecmaVersion >= 9) { node.await = awaitAt > -1; }
	    return this.parseForIn(node, init)
	  }
	  if (awaitAt > -1) { this.unexpected(awaitAt); }
	  return this.parseFor(node, init)
	};

	pp$8.parseFunctionStatement = function(node, isAsync, declarationPosition) {
	  this.next();
	  return this.parseFunction(node, FUNC_STATEMENT | (declarationPosition ? 0 : FUNC_HANGING_STATEMENT), false, isAsync)
	};

	pp$8.parseIfStatement = function(node) {
	  this.next();
	  node.test = this.parseParenExpression();
	  // allow function declarations in branches, but only in non-strict mode
	  node.consequent = this.parseStatement("if");
	  node.alternate = this.eat(types$1._else) ? this.parseStatement("if") : null;
	  return this.finishNode(node, "IfStatement")
	};

	pp$8.parseReturnStatement = function(node) {
	  if (!this.allowReturn)
	    { this.raise(this.start, "'return' outside of function"); }
	  this.next();

	  // In `return` (and `break`/`continue`), the keywords with
	  // optional arguments, we eagerly look for a semicolon or the
	  // possibility to insert one.

	  if (this.eat(types$1.semi) || this.insertSemicolon()) { node.argument = null; }
	  else { node.argument = this.parseExpression(); this.semicolon(); }
	  return this.finishNode(node, "ReturnStatement")
	};

	pp$8.parseSwitchStatement = function(node) {
	  this.next();
	  node.discriminant = this.parseParenExpression();
	  node.cases = [];
	  this.expect(types$1.braceL);
	  this.labels.push(switchLabel);
	  this.enterScope(SCOPE_SWITCH);

	  // Statements under must be grouped (by label) in SwitchCase
	  // nodes. `cur` is used to keep the node that we are currently
	  // adding statements to.

	  var cur;
	  for (var sawDefault = false; this.type !== types$1.braceR;) {
	    if (this.type === types$1._case || this.type === types$1._default) {
	      var isCase = this.type === types$1._case;
	      if (cur) { this.finishNode(cur, "SwitchCase"); }
	      node.cases.push(cur = this.startNode());
	      cur.consequent = [];
	      this.next();
	      if (isCase) {
	        cur.test = this.parseExpression();
	      } else {
	        if (sawDefault) { this.raiseRecoverable(this.lastTokStart, "Multiple default clauses"); }
	        sawDefault = true;
	        cur.test = null;
	      }
	      this.expect(types$1.colon);
	    } else {
	      if (!cur) { this.unexpected(); }
	      cur.consequent.push(this.parseStatement(null));
	    }
	  }
	  this.exitScope();
	  if (cur) { this.finishNode(cur, "SwitchCase"); }
	  this.next(); // Closing brace
	  this.labels.pop();
	  return this.finishNode(node, "SwitchStatement")
	};

	pp$8.parseThrowStatement = function(node) {
	  this.next();
	  if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start)))
	    { this.raise(this.lastTokEnd, "Illegal newline after throw"); }
	  node.argument = this.parseExpression();
	  this.semicolon();
	  return this.finishNode(node, "ThrowStatement")
	};

	// Reused empty array added for node fields that are always empty.

	var empty$1 = [];

	pp$8.parseCatchClauseParam = function() {
	  var param = this.parseBindingAtom();
	  var simple = param.type === "Identifier";
	  this.enterScope(simple ? SCOPE_SIMPLE_CATCH : 0);
	  this.checkLValPattern(param, simple ? BIND_SIMPLE_CATCH : BIND_LEXICAL);
	  this.expect(types$1.parenR);

	  return param
	};

	pp$8.parseTryStatement = function(node) {
	  this.next();
	  node.block = this.parseBlock();
	  node.handler = null;
	  if (this.type === types$1._catch) {
	    var clause = this.startNode();
	    this.next();
	    if (this.eat(types$1.parenL)) {
	      clause.param = this.parseCatchClauseParam();
	    } else {
	      if (this.options.ecmaVersion < 10) { this.unexpected(); }
	      clause.param = null;
	      this.enterScope(0);
	    }
	    clause.body = this.parseBlock(false);
	    this.exitScope();
	    node.handler = this.finishNode(clause, "CatchClause");
	  }
	  node.finalizer = this.eat(types$1._finally) ? this.parseBlock() : null;
	  if (!node.handler && !node.finalizer)
	    { this.raise(node.start, "Missing catch or finally clause"); }
	  return this.finishNode(node, "TryStatement")
	};

	pp$8.parseVarStatement = function(node, kind, allowMissingInitializer) {
	  this.next();
	  this.parseVar(node, false, kind, allowMissingInitializer);
	  this.semicolon();
	  return this.finishNode(node, "VariableDeclaration")
	};

	pp$8.parseWhileStatement = function(node) {
	  this.next();
	  node.test = this.parseParenExpression();
	  this.labels.push(loopLabel);
	  node.body = this.parseStatement("while");
	  this.labels.pop();
	  return this.finishNode(node, "WhileStatement")
	};

	pp$8.parseWithStatement = function(node) {
	  if (this.strict) { this.raise(this.start, "'with' in strict mode"); }
	  this.next();
	  node.object = this.parseParenExpression();
	  node.body = this.parseStatement("with");
	  return this.finishNode(node, "WithStatement")
	};

	pp$8.parseEmptyStatement = function(node) {
	  this.next();
	  return this.finishNode(node, "EmptyStatement")
	};

	pp$8.parseLabeledStatement = function(node, maybeName, expr, context) {
	  for (var i$1 = 0, list = this.labels; i$1 < list.length; i$1 += 1)
	    {
	    var label = list[i$1];

	    if (label.name === maybeName)
	      { this.raise(expr.start, "Label '" + maybeName + "' is already declared");
	  } }
	  var kind = this.type.isLoop ? "loop" : this.type === types$1._switch ? "switch" : null;
	  for (var i = this.labels.length - 1; i >= 0; i--) {
	    var label$1 = this.labels[i];
	    if (label$1.statementStart === node.start) {
	      // Update information about previous labels on this node
	      label$1.statementStart = this.start;
	      label$1.kind = kind;
	    } else { break }
	  }
	  this.labels.push({name: maybeName, kind: kind, statementStart: this.start});
	  node.body = this.parseStatement(context ? context.indexOf("label") === -1 ? context + "label" : context : "label");
	  this.labels.pop();
	  node.label = expr;
	  return this.finishNode(node, "LabeledStatement")
	};

	pp$8.parseExpressionStatement = function(node, expr) {
	  node.expression = expr;
	  this.semicolon();
	  return this.finishNode(node, "ExpressionStatement")
	};

	// Parse a semicolon-enclosed block of statements, handling `"use
	// strict"` declarations when `allowStrict` is true (used for
	// function bodies).

	pp$8.parseBlock = function(createNewLexicalScope, node, exitStrict) {
	  if ( createNewLexicalScope === void 0 ) createNewLexicalScope = true;
	  if ( node === void 0 ) node = this.startNode();

	  node.body = [];
	  this.expect(types$1.braceL);
	  if (createNewLexicalScope) { this.enterScope(0); }
	  while (this.type !== types$1.braceR) {
	    var stmt = this.parseStatement(null);
	    node.body.push(stmt);
	  }
	  if (exitStrict) { this.strict = false; }
	  this.next();
	  if (createNewLexicalScope) { this.exitScope(); }
	  return this.finishNode(node, "BlockStatement")
	};

	// Parse a regular `for` loop. The disambiguation code in
	// `parseStatement` will already have parsed the init statement or
	// expression.

	pp$8.parseFor = function(node, init) {
	  node.init = init;
	  this.expect(types$1.semi);
	  node.test = this.type === types$1.semi ? null : this.parseExpression();
	  this.expect(types$1.semi);
	  node.update = this.type === types$1.parenR ? null : this.parseExpression();
	  this.expect(types$1.parenR);
	  node.body = this.parseStatement("for");
	  this.exitScope();
	  this.labels.pop();
	  return this.finishNode(node, "ForStatement")
	};

	// Parse a `for`/`in` and `for`/`of` loop, which are almost
	// same from parser's perspective.

	pp$8.parseForIn = function(node, init) {
	  var isForIn = this.type === types$1._in;
	  this.next();

	  if (
	    init.type === "VariableDeclaration" &&
	    init.declarations[0].init != null &&
	    (
	      !isForIn ||
	      this.options.ecmaVersion < 8 ||
	      this.strict ||
	      init.kind !== "var" ||
	      init.declarations[0].id.type !== "Identifier"
	    )
	  ) {
	    this.raise(
	      init.start,
	      ((isForIn ? "for-in" : "for-of") + " loop variable declaration may not have an initializer")
	    );
	  }
	  node.left = init;
	  node.right = isForIn ? this.parseExpression() : this.parseMaybeAssign();
	  this.expect(types$1.parenR);
	  node.body = this.parseStatement("for");
	  this.exitScope();
	  this.labels.pop();
	  return this.finishNode(node, isForIn ? "ForInStatement" : "ForOfStatement")
	};

	// Parse a list of variable declarations.

	pp$8.parseVar = function(node, isFor, kind, allowMissingInitializer) {
	  node.declarations = [];
	  node.kind = kind;
	  for (;;) {
	    var decl = this.startNode();
	    this.parseVarId(decl, kind);
	    if (this.eat(types$1.eq)) {
	      decl.init = this.parseMaybeAssign(isFor);
	    } else if (!allowMissingInitializer && kind === "const" && !(this.type === types$1._in || (this.options.ecmaVersion >= 6 && this.isContextual("of")))) {
	      this.unexpected();
	    } else if (!allowMissingInitializer && (kind === "using" || kind === "await using") && this.options.ecmaVersion >= 17 && this.type !== types$1._in && !this.isContextual("of")) {
	      this.raise(this.lastTokEnd, ("Missing initializer in " + kind + " declaration"));
	    } else if (!allowMissingInitializer && decl.id.type !== "Identifier" && !(isFor && (this.type === types$1._in || this.isContextual("of")))) {
	      this.raise(this.lastTokEnd, "Complex binding patterns require an initialization value");
	    } else {
	      decl.init = null;
	    }
	    node.declarations.push(this.finishNode(decl, "VariableDeclarator"));
	    if (!this.eat(types$1.comma)) { break }
	  }
	  return node
	};

	pp$8.parseVarId = function(decl, kind) {
	  decl.id = kind === "using" || kind === "await using"
	    ? this.parseIdent()
	    : this.parseBindingAtom();

	  this.checkLValPattern(decl.id, kind === "var" ? BIND_VAR : BIND_LEXICAL, false);
	};

	var FUNC_STATEMENT = 1, FUNC_HANGING_STATEMENT = 2, FUNC_NULLABLE_ID = 4;

	// Parse a function declaration or literal (depending on the
	// `statement & FUNC_STATEMENT`).

	// Remove `allowExpressionBody` for 7.0.0, as it is only called with false
	pp$8.parseFunction = function(node, statement, allowExpressionBody, isAsync, forInit) {
	  this.initFunction(node);
	  if (this.options.ecmaVersion >= 9 || this.options.ecmaVersion >= 6 && !isAsync) {
	    if (this.type === types$1.star && (statement & FUNC_HANGING_STATEMENT))
	      { this.unexpected(); }
	    node.generator = this.eat(types$1.star);
	  }
	  if (this.options.ecmaVersion >= 8)
	    { node.async = !!isAsync; }

	  if (statement & FUNC_STATEMENT) {
	    node.id = (statement & FUNC_NULLABLE_ID) && this.type !== types$1.name ? null : this.parseIdent();
	    if (node.id && !(statement & FUNC_HANGING_STATEMENT))
	      // If it is a regular function declaration in sloppy mode, then it is
	      // subject to Annex B semantics (BIND_FUNCTION). Otherwise, the binding
	      // mode depends on properties of the current scope (see
	      // treatFunctionsAsVar).
	      { this.checkLValSimple(node.id, (this.strict || node.generator || node.async) ? this.treatFunctionsAsVar ? BIND_VAR : BIND_LEXICAL : BIND_FUNCTION); }
	  }

	  var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
	  this.yieldPos = 0;
	  this.awaitPos = 0;
	  this.awaitIdentPos = 0;
	  this.enterScope(functionFlags(node.async, node.generator));

	  if (!(statement & FUNC_STATEMENT))
	    { node.id = this.type === types$1.name ? this.parseIdent() : null; }

	  this.parseFunctionParams(node);
	  this.parseFunctionBody(node, allowExpressionBody, false, forInit);

	  this.yieldPos = oldYieldPos;
	  this.awaitPos = oldAwaitPos;
	  this.awaitIdentPos = oldAwaitIdentPos;
	  return this.finishNode(node, (statement & FUNC_STATEMENT) ? "FunctionDeclaration" : "FunctionExpression")
	};

	pp$8.parseFunctionParams = function(node) {
	  this.expect(types$1.parenL);
	  node.params = this.parseBindingList(types$1.parenR, false, this.options.ecmaVersion >= 8);
	  this.checkYieldAwaitInDefaultParams();
	};

	// Parse a class declaration or literal (depending on the
	// `isStatement` parameter).

	pp$8.parseClass = function(node, isStatement) {
	  this.next();

	  // ecma-262 14.6 Class Definitions
	  // A class definition is always strict mode code.
	  var oldStrict = this.strict;
	  this.strict = true;

	  this.parseClassId(node, isStatement);
	  this.parseClassSuper(node);
	  var privateNameMap = this.enterClassBody();
	  var classBody = this.startNode();
	  var hadConstructor = false;
	  classBody.body = [];
	  this.expect(types$1.braceL);
	  while (this.type !== types$1.braceR) {
	    var element = this.parseClassElement(node.superClass !== null);
	    if (element) {
	      classBody.body.push(element);
	      if (element.type === "MethodDefinition" && element.kind === "constructor") {
	        if (hadConstructor) { this.raiseRecoverable(element.start, "Duplicate constructor in the same class"); }
	        hadConstructor = true;
	      } else if (element.key && element.key.type === "PrivateIdentifier" && isPrivateNameConflicted(privateNameMap, element)) {
	        this.raiseRecoverable(element.key.start, ("Identifier '#" + (element.key.name) + "' has already been declared"));
	      }
	    }
	  }
	  this.strict = oldStrict;
	  this.next();
	  node.body = this.finishNode(classBody, "ClassBody");
	  this.exitClassBody();
	  return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression")
	};

	pp$8.parseClassElement = function(constructorAllowsSuper) {
	  if (this.eat(types$1.semi)) { return null }

	  var ecmaVersion = this.options.ecmaVersion;
	  var node = this.startNode();
	  var keyName = "";
	  var isGenerator = false;
	  var isAsync = false;
	  var kind = "method";
	  var isStatic = false;

	  if (this.eatContextual("static")) {
	    // Parse static init block
	    if (ecmaVersion >= 13 && this.eat(types$1.braceL)) {
	      this.parseClassStaticBlock(node);
	      return node
	    }
	    if (this.isClassElementNameStart() || this.type === types$1.star) {
	      isStatic = true;
	    } else {
	      keyName = "static";
	    }
	  }
	  node.static = isStatic;
	  if (!keyName && ecmaVersion >= 8 && this.eatContextual("async")) {
	    if ((this.isClassElementNameStart() || this.type === types$1.star) && !this.canInsertSemicolon()) {
	      isAsync = true;
	    } else {
	      keyName = "async";
	    }
	  }
	  if (!keyName && (ecmaVersion >= 9 || !isAsync) && this.eat(types$1.star)) {
	    isGenerator = true;
	  }
	  if (!keyName && !isAsync && !isGenerator) {
	    var lastValue = this.value;
	    if (this.eatContextual("get") || this.eatContextual("set")) {
	      if (this.isClassElementNameStart()) {
	        kind = lastValue;
	      } else {
	        keyName = lastValue;
	      }
	    }
	  }

	  // Parse element name
	  if (keyName) {
	    // 'async', 'get', 'set', or 'static' were not a keyword contextually.
	    // The last token is any of those. Make it the element name.
	    node.computed = false;
	    node.key = this.startNodeAt(this.lastTokStart, this.lastTokStartLoc);
	    node.key.name = keyName;
	    this.finishNode(node.key, "Identifier");
	  } else {
	    this.parseClassElementName(node);
	  }

	  // Parse element value
	  if (ecmaVersion < 13 || this.type === types$1.parenL || kind !== "method" || isGenerator || isAsync) {
	    var isConstructor = !node.static && checkKeyName(node, "constructor");
	    var allowsDirectSuper = isConstructor && constructorAllowsSuper;
	    // Couldn't move this check into the 'parseClassMethod' method for backward compatibility.
	    if (isConstructor && kind !== "method") { this.raise(node.key.start, "Constructor can't have get/set modifier"); }
	    node.kind = isConstructor ? "constructor" : kind;
	    this.parseClassMethod(node, isGenerator, isAsync, allowsDirectSuper);
	  } else {
	    this.parseClassField(node);
	  }

	  return node
	};

	pp$8.isClassElementNameStart = function() {
	  return (
	    this.type === types$1.name ||
	    this.type === types$1.privateId ||
	    this.type === types$1.num ||
	    this.type === types$1.string ||
	    this.type === types$1.bracketL ||
	    this.type.keyword
	  )
	};

	pp$8.parseClassElementName = function(element) {
	  if (this.type === types$1.privateId) {
	    if (this.value === "constructor") {
	      this.raise(this.start, "Classes can't have an element named '#constructor'");
	    }
	    element.computed = false;
	    element.key = this.parsePrivateIdent();
	  } else {
	    this.parsePropertyName(element);
	  }
	};

	pp$8.parseClassMethod = function(method, isGenerator, isAsync, allowsDirectSuper) {
	  // Check key and flags
	  var key = method.key;
	  if (method.kind === "constructor") {
	    if (isGenerator) { this.raise(key.start, "Constructor can't be a generator"); }
	    if (isAsync) { this.raise(key.start, "Constructor can't be an async method"); }
	  } else if (method.static && checkKeyName(method, "prototype")) {
	    this.raise(key.start, "Classes may not have a static property named prototype");
	  }

	  // Parse value
	  var value = method.value = this.parseMethod(isGenerator, isAsync, allowsDirectSuper);

	  // Check value
	  if (method.kind === "get" && value.params.length !== 0)
	    { this.raiseRecoverable(value.start, "getter should have no params"); }
	  if (method.kind === "set" && value.params.length !== 1)
	    { this.raiseRecoverable(value.start, "setter should have exactly one param"); }
	  if (method.kind === "set" && value.params[0].type === "RestElement")
	    { this.raiseRecoverable(value.params[0].start, "Setter cannot use rest params"); }

	  return this.finishNode(method, "MethodDefinition")
	};

	pp$8.parseClassField = function(field) {
	  if (checkKeyName(field, "constructor")) {
	    this.raise(field.key.start, "Classes can't have a field named 'constructor'");
	  } else if (field.static && checkKeyName(field, "prototype")) {
	    this.raise(field.key.start, "Classes can't have a static field named 'prototype'");
	  }

	  if (this.eat(types$1.eq)) {
	    // To raise SyntaxError if 'arguments' exists in the initializer.
	    this.enterScope(SCOPE_CLASS_FIELD_INIT | SCOPE_SUPER);
	    field.value = this.parseMaybeAssign();
	    this.exitScope();
	  } else {
	    field.value = null;
	  }
	  this.semicolon();

	  return this.finishNode(field, "PropertyDefinition")
	};

	pp$8.parseClassStaticBlock = function(node) {
	  node.body = [];

	  var oldLabels = this.labels;
	  this.labels = [];
	  this.enterScope(SCOPE_CLASS_STATIC_BLOCK | SCOPE_SUPER);
	  while (this.type !== types$1.braceR) {
	    var stmt = this.parseStatement(null);
	    node.body.push(stmt);
	  }
	  this.next();
	  this.exitScope();
	  this.labels = oldLabels;

	  return this.finishNode(node, "StaticBlock")
	};

	pp$8.parseClassId = function(node, isStatement) {
	  if (this.type === types$1.name) {
	    node.id = this.parseIdent();
	    if (isStatement)
	      { this.checkLValSimple(node.id, BIND_LEXICAL, false); }
	  } else {
	    if (isStatement === true)
	      { this.unexpected(); }
	    node.id = null;
	  }
	};

	pp$8.parseClassSuper = function(node) {
	  node.superClass = this.eat(types$1._extends) ? this.parseExprSubscripts(null, false) : null;
	};

	pp$8.enterClassBody = function() {
	  var element = {declared: Object.create(null), used: []};
	  this.privateNameStack.push(element);
	  return element.declared
	};

	pp$8.exitClassBody = function() {
	  var ref = this.privateNameStack.pop();
	  var declared = ref.declared;
	  var used = ref.used;
	  if (!this.options.checkPrivateFields) { return }
	  var len = this.privateNameStack.length;
	  var parent = len === 0 ? null : this.privateNameStack[len - 1];
	  for (var i = 0; i < used.length; ++i) {
	    var id = used[i];
	    if (!hasOwn(declared, id.name)) {
	      if (parent) {
	        parent.used.push(id);
	      } else {
	        this.raiseRecoverable(id.start, ("Private field '#" + (id.name) + "' must be declared in an enclosing class"));
	      }
	    }
	  }
	};

	function isPrivateNameConflicted(privateNameMap, element) {
	  var name = element.key.name;
	  var curr = privateNameMap[name];

	  var next = "true";
	  if (element.type === "MethodDefinition" && (element.kind === "get" || element.kind === "set")) {
	    next = (element.static ? "s" : "i") + element.kind;
	  }

	  // `class { get #a(){}; static set #a(_){} }` is also conflict.
	  if (
	    curr === "iget" && next === "iset" ||
	    curr === "iset" && next === "iget" ||
	    curr === "sget" && next === "sset" ||
	    curr === "sset" && next === "sget"
	  ) {
	    privateNameMap[name] = "true";
	    return false
	  } else if (!curr) {
	    privateNameMap[name] = next;
	    return false
	  } else {
	    return true
	  }
	}

	function checkKeyName(node, name) {
	  var computed = node.computed;
	  var key = node.key;
	  return !computed && (
	    key.type === "Identifier" && key.name === name ||
	    key.type === "Literal" && key.value === name
	  )
	}

	// Parses module export declaration.

	pp$8.parseExportAllDeclaration = function(node, exports$1) {
	  if (this.options.ecmaVersion >= 11) {
	    if (this.eatContextual("as")) {
	      node.exported = this.parseModuleExportName();
	      this.checkExport(exports$1, node.exported, this.lastTokStart);
	    } else {
	      node.exported = null;
	    }
	  }
	  this.expectContextual("from");
	  if (this.type !== types$1.string) { this.unexpected(); }
	  node.source = this.parseExprAtom();
	  if (this.options.ecmaVersion >= 16)
	    { node.attributes = this.parseWithClause(); }
	  this.semicolon();
	  return this.finishNode(node, "ExportAllDeclaration")
	};

	pp$8.parseExport = function(node, exports$1) {
	  this.next();
	  // export * from '...'
	  if (this.eat(types$1.star)) {
	    return this.parseExportAllDeclaration(node, exports$1)
	  }
	  if (this.eat(types$1._default)) { // export default ...
	    this.checkExport(exports$1, "default", this.lastTokStart);
	    node.declaration = this.parseExportDefaultDeclaration();
	    return this.finishNode(node, "ExportDefaultDeclaration")
	  }
	  // export var|const|let|function|class ...
	  if (this.shouldParseExportStatement()) {
	    node.declaration = this.parseExportDeclaration(node);
	    if (node.declaration.type === "VariableDeclaration")
	      { this.checkVariableExport(exports$1, node.declaration.declarations); }
	    else
	      { this.checkExport(exports$1, node.declaration.id, node.declaration.id.start); }
	    node.specifiers = [];
	    node.source = null;
	    if (this.options.ecmaVersion >= 16)
	      { node.attributes = []; }
	  } else { // export { x, y as z } [from '...']
	    node.declaration = null;
	    node.specifiers = this.parseExportSpecifiers(exports$1);
	    if (this.eatContextual("from")) {
	      if (this.type !== types$1.string) { this.unexpected(); }
	      node.source = this.parseExprAtom();
	      if (this.options.ecmaVersion >= 16)
	        { node.attributes = this.parseWithClause(); }
	    } else {
	      for (var i = 0, list = node.specifiers; i < list.length; i += 1) {
	        // check for keywords used as local names
	        var spec = list[i];

	        this.checkUnreserved(spec.local);
	        // check if export is defined
	        this.checkLocalExport(spec.local);

	        if (spec.local.type === "Literal") {
	          this.raise(spec.local.start, "A string literal cannot be used as an exported binding without `from`.");
	        }
	      }

	      node.source = null;
	      if (this.options.ecmaVersion >= 16)
	        { node.attributes = []; }
	    }
	    this.semicolon();
	  }
	  return this.finishNode(node, "ExportNamedDeclaration")
	};

	pp$8.parseExportDeclaration = function(node) {
	  return this.parseStatement(null)
	};

	pp$8.parseExportDefaultDeclaration = function() {
	  var isAsync;
	  if (this.type === types$1._function || (isAsync = this.isAsyncFunction())) {
	    var fNode = this.startNode();
	    this.next();
	    if (isAsync) { this.next(); }
	    return this.parseFunction(fNode, FUNC_STATEMENT | FUNC_NULLABLE_ID, false, isAsync)
	  } else if (this.type === types$1._class) {
	    var cNode = this.startNode();
	    return this.parseClass(cNode, "nullableID")
	  } else {
	    var declaration = this.parseMaybeAssign();
	    this.semicolon();
	    return declaration
	  }
	};

	pp$8.checkExport = function(exports$1, name, pos) {
	  if (!exports$1) { return }
	  if (typeof name !== "string")
	    { name = name.type === "Identifier" ? name.name : name.value; }
	  if (hasOwn(exports$1, name))
	    { this.raiseRecoverable(pos, "Duplicate export '" + name + "'"); }
	  exports$1[name] = true;
	};

	pp$8.checkPatternExport = function(exports$1, pat) {
	  var type = pat.type;
	  if (type === "Identifier")
	    { this.checkExport(exports$1, pat, pat.start); }
	  else if (type === "ObjectPattern")
	    { for (var i = 0, list = pat.properties; i < list.length; i += 1)
	      {
	        var prop = list[i];

	        this.checkPatternExport(exports$1, prop);
	      } }
	  else if (type === "ArrayPattern")
	    { for (var i$1 = 0, list$1 = pat.elements; i$1 < list$1.length; i$1 += 1) {
	      var elt = list$1[i$1];

	        if (elt) { this.checkPatternExport(exports$1, elt); }
	    } }
	  else if (type === "Property")
	    { this.checkPatternExport(exports$1, pat.value); }
	  else if (type === "AssignmentPattern")
	    { this.checkPatternExport(exports$1, pat.left); }
	  else if (type === "RestElement")
	    { this.checkPatternExport(exports$1, pat.argument); }
	};

	pp$8.checkVariableExport = function(exports$1, decls) {
	  if (!exports$1) { return }
	  for (var i = 0, list = decls; i < list.length; i += 1)
	    {
	    var decl = list[i];

	    this.checkPatternExport(exports$1, decl.id);
	  }
	};

	pp$8.shouldParseExportStatement = function() {
	  return this.type.keyword === "var" ||
	    this.type.keyword === "const" ||
	    this.type.keyword === "class" ||
	    this.type.keyword === "function" ||
	    this.isLet() ||
	    this.isAsyncFunction()
	};

	// Parses a comma-separated list of module exports.

	pp$8.parseExportSpecifier = function(exports$1) {
	  var node = this.startNode();
	  node.local = this.parseModuleExportName();

	  node.exported = this.eatContextual("as") ? this.parseModuleExportName() : node.local;
	  this.checkExport(
	    exports$1,
	    node.exported,
	    node.exported.start
	  );

	  return this.finishNode(node, "ExportSpecifier")
	};

	pp$8.parseExportSpecifiers = function(exports$1) {
	  var nodes = [], first = true;
	  // export { x, y as z } [from '...']
	  this.expect(types$1.braceL);
	  while (!this.eat(types$1.braceR)) {
	    if (!first) {
	      this.expect(types$1.comma);
	      if (this.afterTrailingComma(types$1.braceR)) { break }
	    } else { first = false; }

	    nodes.push(this.parseExportSpecifier(exports$1));
	  }
	  return nodes
	};

	// Parses import declaration.

	pp$8.parseImport = function(node) {
	  this.next();

	  // import '...'
	  if (this.type === types$1.string) {
	    node.specifiers = empty$1;
	    node.source = this.parseExprAtom();
	  } else {
	    node.specifiers = this.parseImportSpecifiers();
	    this.expectContextual("from");
	    node.source = this.type === types$1.string ? this.parseExprAtom() : this.unexpected();
	  }
	  if (this.options.ecmaVersion >= 16)
	    { node.attributes = this.parseWithClause(); }
	  this.semicolon();
	  return this.finishNode(node, "ImportDeclaration")
	};

	// Parses a comma-separated list of module imports.

	pp$8.parseImportSpecifier = function() {
	  var node = this.startNode();
	  node.imported = this.parseModuleExportName();

	  if (this.eatContextual("as")) {
	    node.local = this.parseIdent();
	  } else {
	    this.checkUnreserved(node.imported);
	    node.local = node.imported;
	  }
	  this.checkLValSimple(node.local, BIND_LEXICAL);

	  return this.finishNode(node, "ImportSpecifier")
	};

	pp$8.parseImportDefaultSpecifier = function() {
	  // import defaultObj, { x, y as z } from '...'
	  var node = this.startNode();
	  node.local = this.parseIdent();
	  this.checkLValSimple(node.local, BIND_LEXICAL);
	  return this.finishNode(node, "ImportDefaultSpecifier")
	};

	pp$8.parseImportNamespaceSpecifier = function() {
	  var node = this.startNode();
	  this.next();
	  this.expectContextual("as");
	  node.local = this.parseIdent();
	  this.checkLValSimple(node.local, BIND_LEXICAL);
	  return this.finishNode(node, "ImportNamespaceSpecifier")
	};

	pp$8.parseImportSpecifiers = function() {
	  var nodes = [], first = true;
	  if (this.type === types$1.name) {
	    nodes.push(this.parseImportDefaultSpecifier());
	    if (!this.eat(types$1.comma)) { return nodes }
	  }
	  if (this.type === types$1.star) {
	    nodes.push(this.parseImportNamespaceSpecifier());
	    return nodes
	  }
	  this.expect(types$1.braceL);
	  while (!this.eat(types$1.braceR)) {
	    if (!first) {
	      this.expect(types$1.comma);
	      if (this.afterTrailingComma(types$1.braceR)) { break }
	    } else { first = false; }

	    nodes.push(this.parseImportSpecifier());
	  }
	  return nodes
	};

	pp$8.parseWithClause = function() {
	  var nodes = [];
	  if (!this.eat(types$1._with)) {
	    return nodes
	  }
	  this.expect(types$1.braceL);
	  var attributeKeys = {};
	  var first = true;
	  while (!this.eat(types$1.braceR)) {
	    if (!first) {
	      this.expect(types$1.comma);
	      if (this.afterTrailingComma(types$1.braceR)) { break }
	    } else { first = false; }

	    var attr = this.parseImportAttribute();
	    var keyName = attr.key.type === "Identifier" ? attr.key.name : attr.key.value;
	    if (hasOwn(attributeKeys, keyName))
	      { this.raiseRecoverable(attr.key.start, "Duplicate attribute key '" + keyName + "'"); }
	    attributeKeys[keyName] = true;
	    nodes.push(attr);
	  }
	  return nodes
	};

	pp$8.parseImportAttribute = function() {
	  var node = this.startNode();
	  node.key = this.type === types$1.string ? this.parseExprAtom() : this.parseIdent(this.options.allowReserved !== "never");
	  this.expect(types$1.colon);
	  if (this.type !== types$1.string) {
	    this.unexpected();
	  }
	  node.value = this.parseExprAtom();
	  return this.finishNode(node, "ImportAttribute")
	};

	pp$8.parseModuleExportName = function() {
	  if (this.options.ecmaVersion >= 13 && this.type === types$1.string) {
	    var stringLiteral = this.parseLiteral(this.value);
	    if (loneSurrogate.test(stringLiteral.value)) {
	      this.raise(stringLiteral.start, "An export name cannot include a lone surrogate.");
	    }
	    return stringLiteral
	  }
	  return this.parseIdent(true)
	};

	// Set `ExpressionStatement#directive` property for directive prologues.
	pp$8.adaptDirectivePrologue = function(statements) {
	  for (var i = 0; i < statements.length && this.isDirectiveCandidate(statements[i]); ++i) {
	    statements[i].directive = statements[i].expression.raw.slice(1, -1);
	  }
	};
	pp$8.isDirectiveCandidate = function(statement) {
	  return (
	    this.options.ecmaVersion >= 5 &&
	    statement.type === "ExpressionStatement" &&
	    statement.expression.type === "Literal" &&
	    typeof statement.expression.value === "string" &&
	    // Reject parenthesized strings.
	    (this.input[statement.start] === "\"" || this.input[statement.start] === "'")
	  )
	};

	var pp$7 = Parser.prototype;

	// Convert existing expression atom to assignable pattern
	// if possible.

	pp$7.toAssignable = function(node, isBinding, refDestructuringErrors) {
	  if (this.options.ecmaVersion >= 6 && node) {
	    switch (node.type) {
	    case "Identifier":
	      if (this.inAsync && node.name === "await")
	        { this.raise(node.start, "Cannot use 'await' as identifier inside an async function"); }
	      break

	    case "ObjectPattern":
	    case "ArrayPattern":
	    case "AssignmentPattern":
	    case "RestElement":
	      break

	    case "ObjectExpression":
	      node.type = "ObjectPattern";
	      if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
	      for (var i = 0, list = node.properties; i < list.length; i += 1) {
	        var prop = list[i];

	      this.toAssignable(prop, isBinding);
	        // Early error:
	        //   AssignmentRestProperty[Yield, Await] :
	        //     `...` DestructuringAssignmentTarget[Yield, Await]
	        //
	        //   It is a Syntax Error if |DestructuringAssignmentTarget| is an |ArrayLiteral| or an |ObjectLiteral|.
	        if (
	          prop.type === "RestElement" &&
	          (prop.argument.type === "ArrayPattern" || prop.argument.type === "ObjectPattern")
	        ) {
	          this.raise(prop.argument.start, "Unexpected token");
	        }
	      }
	      break

	    case "Property":
	      // AssignmentProperty has type === "Property"
	      if (node.kind !== "init") { this.raise(node.key.start, "Object pattern can't contain getter or setter"); }
	      this.toAssignable(node.value, isBinding);
	      break

	    case "ArrayExpression":
	      node.type = "ArrayPattern";
	      if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
	      this.toAssignableList(node.elements, isBinding);
	      break

	    case "SpreadElement":
	      node.type = "RestElement";
	      this.toAssignable(node.argument, isBinding);
	      if (node.argument.type === "AssignmentPattern")
	        { this.raise(node.argument.start, "Rest elements cannot have a default value"); }
	      break

	    case "AssignmentExpression":
	      if (node.operator !== "=") { this.raise(node.left.end, "Only '=' operator can be used for specifying default value."); }
	      node.type = "AssignmentPattern";
	      delete node.operator;
	      this.toAssignable(node.left, isBinding);
	      break

	    case "ParenthesizedExpression":
	      this.toAssignable(node.expression, isBinding, refDestructuringErrors);
	      break

	    case "ChainExpression":
	      this.raiseRecoverable(node.start, "Optional chaining cannot appear in left-hand side");
	      break

	    case "MemberExpression":
	      if (!isBinding) { break }

	    default:
	      this.raise(node.start, "Assigning to rvalue");
	    }
	  } else if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
	  return node
	};

	// Convert list of expression atoms to binding list.

	pp$7.toAssignableList = function(exprList, isBinding) {
	  var end = exprList.length;
	  for (var i = 0; i < end; i++) {
	    var elt = exprList[i];
	    if (elt) { this.toAssignable(elt, isBinding); }
	  }
	  if (end) {
	    var last = exprList[end - 1];
	    if (this.options.ecmaVersion === 6 && isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier")
	      { this.unexpected(last.argument.start); }
	  }
	  return exprList
	};

	// Parses spread element.

	pp$7.parseSpread = function(refDestructuringErrors) {
	  var node = this.startNode();
	  this.next();
	  node.argument = this.parseMaybeAssign(false, refDestructuringErrors);
	  return this.finishNode(node, "SpreadElement")
	};

	pp$7.parseRestBinding = function() {
	  var node = this.startNode();
	  this.next();

	  // RestElement inside of a function parameter must be an identifier
	  if (this.options.ecmaVersion === 6 && this.type !== types$1.name)
	    { this.unexpected(); }

	  node.argument = this.parseBindingAtom();

	  return this.finishNode(node, "RestElement")
	};

	// Parses lvalue (assignable) atom.

	pp$7.parseBindingAtom = function() {
	  if (this.options.ecmaVersion >= 6) {
	    switch (this.type) {
	    case types$1.bracketL:
	      var node = this.startNode();
	      this.next();
	      node.elements = this.parseBindingList(types$1.bracketR, true, true);
	      return this.finishNode(node, "ArrayPattern")

	    case types$1.braceL:
	      return this.parseObj(true)
	    }
	  }
	  return this.parseIdent()
	};

	pp$7.parseBindingList = function(close, allowEmpty, allowTrailingComma, allowModifiers) {
	  var elts = [], first = true;
	  while (!this.eat(close)) {
	    if (first) { first = false; }
	    else { this.expect(types$1.comma); }
	    if (allowEmpty && this.type === types$1.comma) {
	      elts.push(null);
	    } else if (allowTrailingComma && this.afterTrailingComma(close)) {
	      break
	    } else if (this.type === types$1.ellipsis) {
	      var rest = this.parseRestBinding();
	      this.parseBindingListItem(rest);
	      elts.push(rest);
	      if (this.type === types$1.comma) { this.raiseRecoverable(this.start, "Comma is not permitted after the rest element"); }
	      this.expect(close);
	      break
	    } else {
	      elts.push(this.parseAssignableListItem(allowModifiers));
	    }
	  }
	  return elts
	};

	pp$7.parseAssignableListItem = function(allowModifiers) {
	  var elem = this.parseMaybeDefault(this.start, this.startLoc);
	  this.parseBindingListItem(elem);
	  return elem
	};

	pp$7.parseBindingListItem = function(param) {
	  return param
	};

	// Parses assignment pattern around given atom if possible.

	pp$7.parseMaybeDefault = function(startPos, startLoc, left) {
	  left = left || this.parseBindingAtom();
	  if (this.options.ecmaVersion < 6 || !this.eat(types$1.eq)) { return left }
	  var node = this.startNodeAt(startPos, startLoc);
	  node.left = left;
	  node.right = this.parseMaybeAssign();
	  return this.finishNode(node, "AssignmentPattern")
	};

	// The following three functions all verify that a node is an lvalue —
	// something that can be bound, or assigned to. In order to do so, they perform
	// a variety of checks:
	//
	// - Check that none of the bound/assigned-to identifiers are reserved words.
	// - Record name declarations for bindings in the appropriate scope.
	// - Check duplicate argument names, if checkClashes is set.
	//
	// If a complex binding pattern is encountered (e.g., object and array
	// destructuring), the entire pattern is recursively checked.
	//
	// There are three versions of checkLVal*() appropriate for different
	// circumstances:
	//
	// - checkLValSimple() shall be used if the syntactic construct supports
	//   nothing other than identifiers and member expressions. Parenthesized
	//   expressions are also correctly handled. This is generally appropriate for
	//   constructs for which the spec says
	//
	//   > It is a Syntax Error if AssignmentTargetType of [the production] is not
	//   > simple.
	//
	//   It is also appropriate for checking if an identifier is valid and not
	//   defined elsewhere, like import declarations or function/class identifiers.
	//
	//   Examples where this is used include:
	//     a += …;
	//     import a from '…';
	//   where a is the node to be checked.
	//
	// - checkLValPattern() shall be used if the syntactic construct supports
	//   anything checkLValSimple() supports, as well as object and array
	//   destructuring patterns. This is generally appropriate for constructs for
	//   which the spec says
	//
	//   > It is a Syntax Error if [the production] is neither an ObjectLiteral nor
	//   > an ArrayLiteral and AssignmentTargetType of [the production] is not
	//   > simple.
	//
	//   Examples where this is used include:
	//     (a = …);
	//     const a = …;
	//     try { … } catch (a) { … }
	//   where a is the node to be checked.
	//
	// - checkLValInnerPattern() shall be used if the syntactic construct supports
	//   anything checkLValPattern() supports, as well as default assignment
	//   patterns, rest elements, and other constructs that may appear within an
	//   object or array destructuring pattern.
	//
	//   As a special case, function parameters also use checkLValInnerPattern(),
	//   as they also support defaults and rest constructs.
	//
	// These functions deliberately support both assignment and binding constructs,
	// as the logic for both is exceedingly similar. If the node is the target of
	// an assignment, then bindingType should be set to BIND_NONE. Otherwise, it
	// should be set to the appropriate BIND_* constant, like BIND_VAR or
	// BIND_LEXICAL.
	//
	// If the function is called with a non-BIND_NONE bindingType, then
	// additionally a checkClashes object may be specified to allow checking for
	// duplicate argument names. checkClashes is ignored if the provided construct
	// is an assignment (i.e., bindingType is BIND_NONE).

	pp$7.checkLValSimple = function(expr, bindingType, checkClashes) {
	  if ( bindingType === void 0 ) bindingType = BIND_NONE;

	  var isBind = bindingType !== BIND_NONE;

	  switch (expr.type) {
	  case "Identifier":
	    if (this.strict && this.reservedWordsStrictBind.test(expr.name))
	      { this.raiseRecoverable(expr.start, (isBind ? "Binding " : "Assigning to ") + expr.name + " in strict mode"); }
	    if (isBind) {
	      if (bindingType === BIND_LEXICAL && expr.name === "let")
	        { this.raiseRecoverable(expr.start, "let is disallowed as a lexically bound name"); }
	      if (checkClashes) {
	        if (hasOwn(checkClashes, expr.name))
	          { this.raiseRecoverable(expr.start, "Argument name clash"); }
	        checkClashes[expr.name] = true;
	      }
	      if (bindingType !== BIND_OUTSIDE) { this.declareName(expr.name, bindingType, expr.start); }
	    }
	    break

	  case "ChainExpression":
	    this.raiseRecoverable(expr.start, "Optional chaining cannot appear in left-hand side");
	    break

	  case "MemberExpression":
	    if (isBind) { this.raiseRecoverable(expr.start, "Binding member expression"); }
	    break

	  case "ParenthesizedExpression":
	    if (isBind) { this.raiseRecoverable(expr.start, "Binding parenthesized expression"); }
	    return this.checkLValSimple(expr.expression, bindingType, checkClashes)

	  default:
	    this.raise(expr.start, (isBind ? "Binding" : "Assigning to") + " rvalue");
	  }
	};

	pp$7.checkLValPattern = function(expr, bindingType, checkClashes) {
	  if ( bindingType === void 0 ) bindingType = BIND_NONE;

	  switch (expr.type) {
	  case "ObjectPattern":
	    for (var i = 0, list = expr.properties; i < list.length; i += 1) {
	      var prop = list[i];

	    this.checkLValInnerPattern(prop, bindingType, checkClashes);
	    }
	    break

	  case "ArrayPattern":
	    for (var i$1 = 0, list$1 = expr.elements; i$1 < list$1.length; i$1 += 1) {
	      var elem = list$1[i$1];

	    if (elem) { this.checkLValInnerPattern(elem, bindingType, checkClashes); }
	    }
	    break

	  default:
	    this.checkLValSimple(expr, bindingType, checkClashes);
	  }
	};

	pp$7.checkLValInnerPattern = function(expr, bindingType, checkClashes) {
	  if ( bindingType === void 0 ) bindingType = BIND_NONE;

	  switch (expr.type) {
	  case "Property":
	    // AssignmentProperty has type === "Property"
	    this.checkLValInnerPattern(expr.value, bindingType, checkClashes);
	    break

	  case "AssignmentPattern":
	    this.checkLValPattern(expr.left, bindingType, checkClashes);
	    break

	  case "RestElement":
	    this.checkLValPattern(expr.argument, bindingType, checkClashes);
	    break

	  default:
	    this.checkLValPattern(expr, bindingType, checkClashes);
	  }
	};

	// The algorithm used to determine whether a regexp can appear at a
	// given point in the program is loosely based on sweet.js' approach.
	// See https://github.com/mozilla/sweet.js/wiki/design


	var TokContext = function TokContext(token, isExpr, preserveSpace, override, generator) {
	  this.token = token;
	  this.isExpr = !!isExpr;
	  this.preserveSpace = !!preserveSpace;
	  this.override = override;
	  this.generator = !!generator;
	};

	var types = {
	  b_stat: new TokContext("{", false),
	  b_expr: new TokContext("{", true),
	  b_tmpl: new TokContext("${", false),
	  p_stat: new TokContext("(", false),
	  p_expr: new TokContext("(", true),
	  q_tmpl: new TokContext("`", true, true, function (p) { return p.tryReadTemplateToken(); }),
	  f_stat: new TokContext("function", false),
	  f_expr: new TokContext("function", true),
	  f_expr_gen: new TokContext("function", true, false, null, true),
	  f_gen: new TokContext("function", false, false, null, true)
	};

	var pp$6 = Parser.prototype;

	pp$6.initialContext = function() {
	  return [types.b_stat]
	};

	pp$6.curContext = function() {
	  return this.context[this.context.length - 1]
	};

	pp$6.braceIsBlock = function(prevType) {
	  var parent = this.curContext();
	  if (parent === types.f_expr || parent === types.f_stat)
	    { return true }
	  if (prevType === types$1.colon && (parent === types.b_stat || parent === types.b_expr))
	    { return !parent.isExpr }

	  // The check for `tt.name && exprAllowed` detects whether we are
	  // after a `yield` or `of` construct. See the `updateContext` for
	  // `tt.name`.
	  if (prevType === types$1._return || prevType === types$1.name && this.exprAllowed)
	    { return lineBreak.test(this.input.slice(this.lastTokEnd, this.start)) }
	  if (prevType === types$1._else || prevType === types$1.semi || prevType === types$1.eof || prevType === types$1.parenR || prevType === types$1.arrow)
	    { return true }
	  if (prevType === types$1.braceL)
	    { return parent === types.b_stat }
	  if (prevType === types$1._var || prevType === types$1._const || prevType === types$1.name)
	    { return false }
	  return !this.exprAllowed
	};

	pp$6.inGeneratorContext = function() {
	  for (var i = this.context.length - 1; i >= 1; i--) {
	    var context = this.context[i];
	    if (context.token === "function")
	      { return context.generator }
	  }
	  return false
	};

	pp$6.updateContext = function(prevType) {
	  var update, type = this.type;
	  if (type.keyword && prevType === types$1.dot)
	    { this.exprAllowed = false; }
	  else if (update = type.updateContext)
	    { update.call(this, prevType); }
	  else
	    { this.exprAllowed = type.beforeExpr; }
	};

	// Used to handle edge cases when token context could not be inferred correctly during tokenization phase

	pp$6.overrideContext = function(tokenCtx) {
	  if (this.curContext() !== tokenCtx) {
	    this.context[this.context.length - 1] = tokenCtx;
	  }
	};

	// Token-specific context update code

	types$1.parenR.updateContext = types$1.braceR.updateContext = function() {
	  if (this.context.length === 1) {
	    this.exprAllowed = true;
	    return
	  }
	  var out = this.context.pop();
	  if (out === types.b_stat && this.curContext().token === "function") {
	    out = this.context.pop();
	  }
	  this.exprAllowed = !out.isExpr;
	};

	types$1.braceL.updateContext = function(prevType) {
	  this.context.push(this.braceIsBlock(prevType) ? types.b_stat : types.b_expr);
	  this.exprAllowed = true;
	};

	types$1.dollarBraceL.updateContext = function() {
	  this.context.push(types.b_tmpl);
	  this.exprAllowed = true;
	};

	types$1.parenL.updateContext = function(prevType) {
	  var statementParens = prevType === types$1._if || prevType === types$1._for || prevType === types$1._with || prevType === types$1._while;
	  this.context.push(statementParens ? types.p_stat : types.p_expr);
	  this.exprAllowed = true;
	};

	types$1.incDec.updateContext = function() {
	  // tokExprAllowed stays unchanged
	};

	types$1._function.updateContext = types$1._class.updateContext = function(prevType) {
	  if (prevType.beforeExpr && prevType !== types$1._else &&
	      !(prevType === types$1.semi && this.curContext() !== types.p_stat) &&
	      !(prevType === types$1._return && lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) &&
	      !((prevType === types$1.colon || prevType === types$1.braceL) && this.curContext() === types.b_stat))
	    { this.context.push(types.f_expr); }
	  else
	    { this.context.push(types.f_stat); }
	  this.exprAllowed = false;
	};

	types$1.colon.updateContext = function() {
	  if (this.curContext().token === "function") { this.context.pop(); }
	  this.exprAllowed = true;
	};

	types$1.backQuote.updateContext = function() {
	  if (this.curContext() === types.q_tmpl)
	    { this.context.pop(); }
	  else
	    { this.context.push(types.q_tmpl); }
	  this.exprAllowed = false;
	};

	types$1.star.updateContext = function(prevType) {
	  if (prevType === types$1._function) {
	    var index = this.context.length - 1;
	    if (this.context[index] === types.f_expr)
	      { this.context[index] = types.f_expr_gen; }
	    else
	      { this.context[index] = types.f_gen; }
	  }
	  this.exprAllowed = true;
	};

	types$1.name.updateContext = function(prevType) {
	  var allowed = false;
	  if (this.options.ecmaVersion >= 6 && prevType !== types$1.dot) {
	    if (this.value === "of" && !this.exprAllowed ||
	        this.value === "yield" && this.inGeneratorContext())
	      { allowed = true; }
	  }
	  this.exprAllowed = allowed;
	};

	// A recursive descent parser operates by defining functions for all
	// syntactic elements, and recursively calling those, each function
	// advancing the input stream and returning an AST node. Precedence
	// of constructs (for example, the fact that `!x[1]` means `!(x[1])`
	// instead of `(!x)[1]` is handled by the fact that the parser
	// function that parses unary prefix operators is called first, and
	// in turn calls the function that parses `[]` subscripts — that
	// way, it'll receive the node for `x[1]` already parsed, and wraps
	// *that* in the unary operator node.
	//
	// Acorn uses an [operator precedence parser][opp] to handle binary
	// operator precedence, because it is much more compact than using
	// the technique outlined above, which uses different, nesting
	// functions to specify precedence, for all of the ten binary
	// precedence levels that JavaScript defines.
	//
	// [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser


	var pp$5 = Parser.prototype;

	// Check if property name clashes with already added.
	// Object/class getters and setters are not allowed to clash —
	// either with each other or with an init property — and in
	// strict mode, init properties are also not allowed to be repeated.

	pp$5.checkPropClash = function(prop, propHash, refDestructuringErrors) {
	  if (this.options.ecmaVersion >= 9 && prop.type === "SpreadElement")
	    { return }
	  if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand))
	    { return }
	  var key = prop.key;
	  var name;
	  switch (key.type) {
	  case "Identifier": name = key.name; break
	  case "Literal": name = String(key.value); break
	  default: return
	  }
	  var kind = prop.kind;
	  if (this.options.ecmaVersion >= 6) {
	    if (name === "__proto__" && kind === "init") {
	      if (propHash.proto) {
	        if (refDestructuringErrors) {
	          if (refDestructuringErrors.doubleProto < 0) {
	            refDestructuringErrors.doubleProto = key.start;
	          }
	        } else {
	          this.raiseRecoverable(key.start, "Redefinition of __proto__ property");
	        }
	      }
	      propHash.proto = true;
	    }
	    return
	  }
	  name = "$" + name;
	  var other = propHash[name];
	  if (other) {
	    var redefinition;
	    if (kind === "init") {
	      redefinition = this.strict && other.init || other.get || other.set;
	    } else {
	      redefinition = other.init || other[kind];
	    }
	    if (redefinition)
	      { this.raiseRecoverable(key.start, "Redefinition of property"); }
	  } else {
	    other = propHash[name] = {
	      init: false,
	      get: false,
	      set: false
	    };
	  }
	  other[kind] = true;
	};

	// ### Expression parsing

	// These nest, from the most general expression type at the top to
	// 'atomic', nondivisible expression types at the bottom. Most of
	// the functions will simply let the function(s) below them parse,
	// and, *if* the syntactic construct they handle is present, wrap
	// the AST node that the inner parser gave them in another node.

	// Parse a full expression. The optional arguments are used to
	// forbid the `in` operator (in for loops initalization expressions)
	// and provide reference for storing '=' operator inside shorthand
	// property assignment in contexts where both object expression
	// and object pattern might appear (so it's possible to raise
	// delayed syntax error at correct position).

	pp$5.parseExpression = function(forInit, refDestructuringErrors) {
	  var this$1$1 = this;

	  return this.catchStackOverflow(function () {
	    var startPos = this$1$1.start, startLoc = this$1$1.startLoc;
	    var expr = this$1$1.parseMaybeAssign(forInit, refDestructuringErrors);
	    if (this$1$1.type === types$1.comma) {
	      var node = this$1$1.startNodeAt(startPos, startLoc);
	      node.expressions = [expr];
	      while (this$1$1.eat(types$1.comma)) { node.expressions.push(this$1$1.parseMaybeAssign(forInit, refDestructuringErrors)); }
	      return this$1$1.finishNode(node, "SequenceExpression")
	    }
	    return expr
	  })
	};

	// Parse an assignment expression. This includes applications of
	// operators like `+=`.

	pp$5.parseMaybeAssign = function(forInit, refDestructuringErrors, afterLeftParse) {
	  if (this.isContextual("yield")) {
	    if (this.inGenerator) { return this.parseYield(forInit) }
	    // The tokenizer will assume an expression is allowed after
	    // `yield`, but this isn't that kind of yield
	    else { this.exprAllowed = false; }
	  }

	  var ownDestructuringErrors = false, oldParenAssign = -1, oldTrailingComma = -1, oldDoubleProto = -1;
	  if (refDestructuringErrors) {
	    oldParenAssign = refDestructuringErrors.parenthesizedAssign;
	    oldTrailingComma = refDestructuringErrors.trailingComma;
	    oldDoubleProto = refDestructuringErrors.doubleProto;
	    refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = -1;
	  } else {
	    refDestructuringErrors = new DestructuringErrors;
	    ownDestructuringErrors = true;
	  }

	  var startPos = this.start, startLoc = this.startLoc;
	  if (this.type === types$1.parenL || this.type === types$1.name) {
	    this.potentialArrowAt = this.start;
	    this.potentialArrowInForAwait = forInit === "await";
	  }
	  var left = this.parseMaybeConditional(forInit, refDestructuringErrors);
	  if (afterLeftParse) { left = afterLeftParse.call(this, left, startPos, startLoc); }
	  if (this.type.isAssign) {
	    var node = this.startNodeAt(startPos, startLoc);
	    node.operator = this.value;
	    if (this.type === types$1.eq)
	      { left = this.toAssignable(left, false, refDestructuringErrors); }
	    if (!ownDestructuringErrors) {
	      refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = refDestructuringErrors.doubleProto = -1;
	    }
	    if (refDestructuringErrors.shorthandAssign >= left.start)
	      { refDestructuringErrors.shorthandAssign = -1; } // reset because shorthand default was used correctly
	    if (this.type === types$1.eq)
	      { this.checkLValPattern(left); }
	    else
	      { this.checkLValSimple(left); }
	    node.left = left;
	    this.next();
	    node.right = this.parseMaybeAssign(forInit);
	    if (oldDoubleProto > -1) { refDestructuringErrors.doubleProto = oldDoubleProto; }
	    return this.finishNode(node, "AssignmentExpression")
	  } else {
	    if (ownDestructuringErrors) { this.checkExpressionErrors(refDestructuringErrors, true); }
	  }
	  if (oldParenAssign > -1) { refDestructuringErrors.parenthesizedAssign = oldParenAssign; }
	  if (oldTrailingComma > -1) { refDestructuringErrors.trailingComma = oldTrailingComma; }
	  return left
	};

	// Parse a ternary conditional (`?:`) operator.

	pp$5.parseMaybeConditional = function(forInit, refDestructuringErrors) {
	  var startPos = this.start, startLoc = this.startLoc;
	  var expr = this.parseExprOps(forInit, refDestructuringErrors);
	  if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
	  if (!(expr.type === "ArrowFunctionExpression" && expr.start === startPos) && this.eat(types$1.question)) {
	    var node = this.startNodeAt(startPos, startLoc);
	    node.test = expr;
	    node.consequent = this.parseMaybeAssign();
	    this.expect(types$1.colon);
	    node.alternate = this.parseMaybeAssign(forInit);
	    return this.finishNode(node, "ConditionalExpression")
	  }
	  return expr
	};

	// Start the precedence parser.

	pp$5.parseExprOps = function(forInit, refDestructuringErrors) {
	  var startPos = this.start, startLoc = this.startLoc;
	  var expr = this.parseMaybeUnary(refDestructuringErrors, false, false, forInit);
	  if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
	  return expr.start === startPos && expr.type === "ArrowFunctionExpression" ? expr : this.parseExprOp(expr, startPos, startLoc, -1, forInit)
	};

	// Parse binary operators with the operator precedence parsing
	// algorithm. `left` is the left-hand side of the operator.
	// `minPrec` provides context that allows the function to stop and
	// defer further parser to one of its callers when it encounters an
	// operator that has a lower precedence than the set it is parsing.

	pp$5.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, forInit) {
	  var prec = this.type.binop;
	  if (prec != null && (!forInit || this.type !== types$1._in)) {
	    if (prec > minPrec) {
	      var logical = this.type === types$1.logicalOR || this.type === types$1.logicalAND;
	      var coalesce = this.type === types$1.coalesce;
	      if (coalesce) {
	        // Handle the precedence of `tt.coalesce` as equal to the range of logical expressions.
	        // In other words, `node.right` shouldn't contain logical expressions in order to check the mixed error.
	        prec = types$1.logicalAND.binop;
	      }
	      var op = this.value;
	      this.next();
	      var startPos = this.start, startLoc = this.startLoc;
	      var right = this.parseExprOp(this.parseMaybeUnary(null, false, false, forInit), startPos, startLoc, prec, forInit);
	      var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical || coalesce);
	      if ((logical && this.type === types$1.coalesce) || (coalesce && (this.type === types$1.logicalOR || this.type === types$1.logicalAND))) {
	        this.raiseRecoverable(this.start, "Logical expressions and coalesce expressions cannot be mixed. Wrap either by parentheses");
	      }
	      return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, forInit)
	    }
	  }
	  return left
	};

	pp$5.buildBinary = function(startPos, startLoc, left, right, op, logical) {
	  if (right.type === "PrivateIdentifier") { this.raise(right.start, "Private identifier can only be left side of binary expression"); }
	  var node = this.startNodeAt(startPos, startLoc);
	  node.left = left;
	  node.operator = op;
	  node.right = right;
	  return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression")
	};

	// Parse unary operators, both prefix and postfix.

	pp$5.parseMaybeUnary = function(refDestructuringErrors, sawUnary, incDec, forInit) {
	  var startPos = this.start, startLoc = this.startLoc, expr;
	  if (this.isContextual("await") && this.canAwait) {
	    expr = this.parseAwait(forInit);
	    sawUnary = true;
	  } else if (this.type.prefix) {
	    var node = this.startNode(), update = this.type === types$1.incDec;
	    node.operator = this.value;
	    node.prefix = true;
	    this.next();
	    node.argument = this.parseMaybeUnary(null, true, update, forInit);
	    this.checkExpressionErrors(refDestructuringErrors, true);
	    if (update) { this.checkLValSimple(node.argument); }
	    else if (this.strict && node.operator === "delete" && isLocalVariableAccess(node.argument))
	      { this.raiseRecoverable(node.start, "Deleting local variable in strict mode"); }
	    else if (node.operator === "delete" && isPrivateFieldAccess(node.argument))
	      { this.raiseRecoverable(node.start, "Private fields can not be deleted"); }
	    else { sawUnary = true; }
	    expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
	  } else if (!sawUnary && this.type === types$1.privateId) {
	    if ((forInit || this.privateNameStack.length === 0) && this.options.checkPrivateFields) { this.unexpected(); }
	    expr = this.parsePrivateIdent();
	    // only could be private fields in 'in', such as #x in obj
	    if (this.type !== types$1._in) { this.unexpected(); }
	  } else {
	    expr = this.parseExprSubscripts(refDestructuringErrors, forInit);
	    if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
	    while (this.type.postfix && !this.canInsertSemicolon()) {
	      var node$1 = this.startNodeAt(startPos, startLoc);
	      node$1.operator = this.value;
	      node$1.prefix = false;
	      node$1.argument = expr;
	      this.checkLValSimple(expr);
	      this.next();
	      expr = this.finishNode(node$1, "UpdateExpression");
	    }
	  }

	  if (!incDec && !(expr.type === "ArrowFunctionExpression" && expr.start === startPos) && this.eat(types$1.starstar)) {
	    if (sawUnary)
	      { this.unexpected(this.lastTokStart); }
	    else
	      { return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false, false, forInit), "**", false) }
	  } else {
	    return expr
	  }
	};

	function isLocalVariableAccess(node) {
	  return (
	    node.type === "Identifier" ||
	    node.type === "ParenthesizedExpression" && isLocalVariableAccess(node.expression)
	  )
	}

	function isPrivateFieldAccess(node) {
	  return (
	    node.type === "MemberExpression" && node.property.type === "PrivateIdentifier" ||
	    node.type === "ChainExpression" && isPrivateFieldAccess(node.expression) ||
	    node.type === "ParenthesizedExpression" && isPrivateFieldAccess(node.expression)
	  )
	}

	// Parse call, dot, and `[]`-subscript expressions.

	pp$5.parseExprSubscripts = function(refDestructuringErrors, forInit) {
	  var startPos = this.start, startLoc = this.startLoc;
	  var expr = this.parseExprAtom(refDestructuringErrors, forInit);
	  if (expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")")
	    { return expr }
	  var result = this.parseSubscripts(expr, startPos, startLoc, false, forInit);
	  if (refDestructuringErrors && result.type === "MemberExpression") {
	    if (refDestructuringErrors.parenthesizedAssign >= result.start) { refDestructuringErrors.parenthesizedAssign = -1; }
	    if (refDestructuringErrors.parenthesizedBind >= result.start) { refDestructuringErrors.parenthesizedBind = -1; }
	    if (refDestructuringErrors.trailingComma >= result.start) { refDestructuringErrors.trailingComma = -1; }
	  }
	  return result
	};

	pp$5.parseSubscripts = function(base, startPos, startLoc, noCalls, forInit) {
	  var maybeAsyncArrow = this.options.ecmaVersion >= 8 && base.type === "Identifier" && base.name === "async" &&
	      this.lastTokEnd === base.end && !this.canInsertSemicolon() && base.end - base.start === 5 &&
	      this.potentialArrowAt === base.start;
	  var optionalChained = false;

	  while (true) {
	    var element = this.parseSubscript(base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit);

	    if (element.optional) { optionalChained = true; }
	    if (element === base || element.type === "ArrowFunctionExpression") {
	      if (optionalChained) {
	        var chainNode = this.startNodeAt(startPos, startLoc);
	        chainNode.expression = element;
	        element = this.finishNode(chainNode, "ChainExpression");
	      }
	      return element
	    }

	    base = element;
	  }
	};

	pp$5.shouldParseAsyncArrow = function() {
	  return !this.canInsertSemicolon() && this.eat(types$1.arrow)
	};

	pp$5.parseSubscriptAsyncArrow = function(startPos, startLoc, exprList, forInit) {
	  return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, true, forInit)
	};

	pp$5.parseSubscript = function(base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit) {
	  var optionalSupported = this.options.ecmaVersion >= 11;
	  var optional = optionalSupported && this.eat(types$1.questionDot);
	  if (noCalls && optional) { this.raise(this.lastTokStart, "Optional chaining cannot appear in the callee of new expressions"); }

	  var computed = this.eat(types$1.bracketL);
	  if (computed || (optional && this.type !== types$1.parenL && this.type !== types$1.backQuote) || this.eat(types$1.dot)) {
	    var node = this.startNodeAt(startPos, startLoc);
	    node.object = base;
	    if (computed) {
	      node.property = this.parseExpression();
	      this.expect(types$1.bracketR);
	    } else if (this.type === types$1.privateId && base.type !== "Super") {
	      node.property = this.parsePrivateIdent();
	    } else {
	      node.property = this.parseIdent(this.options.allowReserved !== "never");
	    }
	    node.computed = !!computed;
	    if (optionalSupported) {
	      node.optional = optional;
	    }
	    base = this.finishNode(node, "MemberExpression");
	  } else if (!noCalls && this.eat(types$1.parenL)) {
	    var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
	    this.yieldPos = 0;
	    this.awaitPos = 0;
	    this.awaitIdentPos = 0;
	    var exprList = this.parseExprList(types$1.parenR, this.options.ecmaVersion >= 8, false, refDestructuringErrors);
	    if (maybeAsyncArrow && !optional && this.shouldParseAsyncArrow()) {
	      this.checkPatternErrors(refDestructuringErrors, false);
	      this.checkYieldAwaitInDefaultParams();
	      if (this.awaitIdentPos > 0)
	        { this.raise(this.awaitIdentPos, "Cannot use 'await' as identifier inside an async function"); }
	      this.yieldPos = oldYieldPos;
	      this.awaitPos = oldAwaitPos;
	      this.awaitIdentPos = oldAwaitIdentPos;
	      return this.parseSubscriptAsyncArrow(startPos, startLoc, exprList, forInit)
	    }
	    this.checkExpressionErrors(refDestructuringErrors, true);
	    this.yieldPos = oldYieldPos || this.yieldPos;
	    this.awaitPos = oldAwaitPos || this.awaitPos;
	    this.awaitIdentPos = oldAwaitIdentPos || this.awaitIdentPos;
	    var node$1 = this.startNodeAt(startPos, startLoc);
	    node$1.callee = base;
	    node$1.arguments = exprList;
	    if (optionalSupported) {
	      node$1.optional = optional;
	    }
	    base = this.finishNode(node$1, "CallExpression");
	  } else if (this.type === types$1.backQuote) {
	    if (optional || optionalChained) {
	      this.raise(this.start, "Optional chaining cannot appear in the tag of tagged template expressions");
	    }
	    var node$2 = this.startNodeAt(startPos, startLoc);
	    node$2.tag = base;
	    node$2.quasi = this.parseTemplate({isTagged: true});
	    base = this.finishNode(node$2, "TaggedTemplateExpression");
	  }
	  return base
	};

	// Parse an atomic expression — either a single token that is an
	// expression, an expression started by a keyword like `function` or
	// `new`, or an expression wrapped in punctuation like `()`, `[]`,
	// or `{}`.

	pp$5.parseExprAtom = function(refDestructuringErrors, forInit, forNew) {
	  // If a division operator appears in an expression position, the
	  // tokenizer got confused, and we force it to read a regexp instead.
	  if (this.type === types$1.slash) { this.readRegexp(); }

	  var node, canBeArrow = this.potentialArrowAt === this.start;
	  switch (this.type) {
	  case types$1._super:
	    if (!this.allowSuper)
	      { this.raise(this.start, "'super' keyword outside a method"); }
	    node = this.startNode();
	    this.next();
	    if (this.type === types$1.parenL && !this.allowDirectSuper)
	      { this.raise(node.start, "super() call outside constructor of a subclass"); }
	    // The `super` keyword can appear at below:
	    // SuperProperty:
	    //     super [ Expression ]
	    //     super . IdentifierName
	    // SuperCall:
	    //     super ( Arguments )
	    if (this.type !== types$1.dot && this.type !== types$1.bracketL && this.type !== types$1.parenL)
	      { this.unexpected(); }
	    return this.finishNode(node, "Super")

	  case types$1._this:
	    node = this.startNode();
	    this.next();
	    return this.finishNode(node, "ThisExpression")

	  case types$1.name:
	    var startPos = this.start, startLoc = this.startLoc, containsEsc = this.containsEsc;
	    var id = this.parseIdent(false);
	    if (this.options.ecmaVersion >= 8 && !containsEsc && id.name === "async" && !this.canInsertSemicolon() && this.eat(types$1._function)) {
	      this.overrideContext(types.f_expr);
	      return this.parseFunction(this.startNodeAt(startPos, startLoc), 0, false, true, forInit)
	    }
	    if (canBeArrow && !this.canInsertSemicolon()) {
	      if (this.eat(types$1.arrow))
	        { return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], false, forInit) }
	      if (this.options.ecmaVersion >= 8 && id.name === "async" && this.type === types$1.name && !containsEsc &&
	          (!this.potentialArrowInForAwait || this.value !== "of" || this.containsEsc)) {
	        id = this.parseIdent(false);
	        if (this.canInsertSemicolon() || !this.eat(types$1.arrow))
	          { this.unexpected(); }
	        return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], true, forInit)
	      }
	    }
	    return id

	  case types$1.regexp:
	    var value = this.value;
	    node = this.parseLiteral(value.value);
	    node.regex = {pattern: value.pattern, flags: value.flags};
	    return node

	  case types$1.num: case types$1.string:
	    return this.parseLiteral(this.value)

	  case types$1._null: case types$1._true: case types$1._false:
	    node = this.startNode();
	    node.value = this.type === types$1._null ? null : this.type === types$1._true;
	    node.raw = this.type.keyword;
	    this.next();
	    return this.finishNode(node, "Literal")

	  case types$1.parenL:
	    var start = this.start, expr = this.parseParenAndDistinguishExpression(canBeArrow, forInit);
	    if (refDestructuringErrors) {
	      if (refDestructuringErrors.parenthesizedAssign < 0 && !this.isSimpleAssignTarget(expr))
	        { refDestructuringErrors.parenthesizedAssign = start; }
	      if (refDestructuringErrors.parenthesizedBind < 0)
	        { refDestructuringErrors.parenthesizedBind = start; }
	    }
	    return expr

	  case types$1.bracketL:
	    node = this.startNode();
	    this.next();
	    node.elements = this.parseExprList(types$1.bracketR, true, true, refDestructuringErrors);
	    return this.finishNode(node, "ArrayExpression")

	  case types$1.braceL:
	    this.overrideContext(types.b_expr);
	    return this.parseObj(false, refDestructuringErrors)

	  case types$1._function:
	    node = this.startNode();
	    this.next();
	    return this.parseFunction(node, 0)

	  case types$1._class:
	    return this.parseClass(this.startNode(), false)

	  case types$1._new:
	    return this.parseNew()

	  case types$1.backQuote:
	    return this.parseTemplate()

	  case types$1._import:
	    if (this.options.ecmaVersion >= 11) {
	      return this.parseExprImport(forNew)
	    } else {
	      return this.unexpected()
	    }

	  default:
	    return this.parseExprAtomDefault()
	  }
	};

	pp$5.parseExprAtomDefault = function() {
	  this.unexpected();
	};

	pp$5.parseExprImport = function(forNew) {
	  var node = this.startNode();

	  // Consume `import` as an identifier for `import.meta`.
	  // Because `this.parseIdent(true)` doesn't check escape sequences, it needs the check of `this.containsEsc`.
	  if (this.containsEsc) { this.raiseRecoverable(this.start, "Escape sequence in keyword import"); }
	  this.next();

	  if (this.type === types$1.parenL && !forNew) {
	    return this.parseDynamicImport(node)
	  } else if (this.type === types$1.dot) {
	    var meta = this.startNodeAt(node.start, node.loc && node.loc.start);
	    meta.name = "import";
	    node.meta = this.finishNode(meta, "Identifier");
	    return this.parseImportMeta(node)
	  } else {
	    this.unexpected();
	  }
	};

	pp$5.parseDynamicImport = function(node) {
	  this.next(); // skip `(`

	  // Parse node.source.
	  node.source = this.parseMaybeAssign();

	  if (this.options.ecmaVersion >= 16) {
	    if (!this.eat(types$1.parenR)) {
	      this.expect(types$1.comma);
	      if (!this.afterTrailingComma(types$1.parenR)) {
	        node.options = this.parseMaybeAssign();
	        if (!this.eat(types$1.parenR)) {
	          this.expect(types$1.comma);
	          if (!this.afterTrailingComma(types$1.parenR)) {
	            this.unexpected();
	          }
	        }
	      } else {
	        node.options = null;
	      }
	    } else {
	      node.options = null;
	    }
	  } else {
	    // Verify ending.
	    if (!this.eat(types$1.parenR)) {
	      var errorPos = this.start;
	      if (this.eat(types$1.comma) && this.eat(types$1.parenR)) {
	        this.raiseRecoverable(errorPos, "Trailing comma is not allowed in import()");
	      } else {
	        this.unexpected(errorPos);
	      }
	    }
	  }

	  return this.finishNode(node, "ImportExpression")
	};

	pp$5.parseImportMeta = function(node) {
	  this.next(); // skip `.`

	  var containsEsc = this.containsEsc;
	  node.property = this.parseIdent(true);

	  if (node.property.name !== "meta")
	    { this.raiseRecoverable(node.property.start, "The only valid meta property for import is 'import.meta'"); }
	  if (containsEsc)
	    { this.raiseRecoverable(node.start, "'import.meta' must not contain escaped characters"); }
	  if (this.options.sourceType !== "module" && !this.options.allowImportExportEverywhere)
	    { this.raiseRecoverable(node.start, "Cannot use 'import.meta' outside a module"); }

	  return this.finishNode(node, "MetaProperty")
	};

	pp$5.parseLiteral = function(value) {
	  var node = this.startNode();
	  node.value = value;
	  node.raw = this.input.slice(this.start, this.end);
	  if (node.raw.charCodeAt(node.raw.length - 1) === 110)
	    { node.bigint = node.value != null ? node.value.toString() : node.raw.slice(0, -1).replace(/_/g, ""); }
	  this.next();
	  return this.finishNode(node, "Literal")
	};

	pp$5.parseParenExpression = function() {
	  this.expect(types$1.parenL);
	  var val = this.parseExpression();
	  this.expect(types$1.parenR);
	  return val
	};

	pp$5.shouldParseArrow = function(exprList) {
	  return !this.canInsertSemicolon()
	};

	pp$5.parseParenAndDistinguishExpression = function(canBeArrow, forInit) {
	  var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8;
	  if (this.options.ecmaVersion >= 6) {
	    this.next();

	    var innerStartPos = this.start, innerStartLoc = this.startLoc;
	    var exprList = [], first = true, lastIsComma = false;
	    var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart;
	    this.yieldPos = 0;
	    this.awaitPos = 0;
	    // Do not save awaitIdentPos to allow checking awaits nested in parameters
	    while (this.type !== types$1.parenR) {
	      first ? first = false : this.expect(types$1.comma);
	      if (allowTrailingComma && this.afterTrailingComma(types$1.parenR, true)) {
	        lastIsComma = true;
	        break
	      } else if (this.type === types$1.ellipsis) {
	        spreadStart = this.start;
	        exprList.push(this.parseParenItem(this.parseRestBinding()));
	        if (this.type === types$1.comma) {
	          this.raiseRecoverable(
	            this.start,
	            "Comma is not permitted after the rest element"
	          );
	        }
	        break
	      } else {
	        exprList.push(this.parseMaybeAssign(false, refDestructuringErrors, this.parseParenItem));
	      }
	    }
	    var innerEndPos = this.lastTokEnd, innerEndLoc = this.lastTokEndLoc;
	    this.expect(types$1.parenR);

	    if (canBeArrow && this.shouldParseArrow(exprList) && this.eat(types$1.arrow)) {
	      this.checkPatternErrors(refDestructuringErrors, false);
	      this.checkYieldAwaitInDefaultParams();
	      this.yieldPos = oldYieldPos;
	      this.awaitPos = oldAwaitPos;
	      return this.parseParenArrowList(startPos, startLoc, exprList, forInit)
	    }

	    if (!exprList.length || lastIsComma) { this.unexpected(this.lastTokStart); }
	    if (spreadStart) { this.unexpected(spreadStart); }
	    this.checkExpressionErrors(refDestructuringErrors, true);
	    this.yieldPos = oldYieldPos || this.yieldPos;
	    this.awaitPos = oldAwaitPos || this.awaitPos;

	    if (exprList.length > 1) {
	      val = this.startNodeAt(innerStartPos, innerStartLoc);
	      val.expressions = exprList;
	      this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
	    } else {
	      val = exprList[0];
	    }
	  } else {
	    val = this.parseParenExpression();
	  }

	  if (this.options.preserveParens) {
	    var par = this.startNodeAt(startPos, startLoc);
	    par.expression = val;
	    return this.finishNode(par, "ParenthesizedExpression")
	  } else {
	    return val
	  }
	};

	pp$5.parseParenItem = function(item) {
	  return item
	};

	pp$5.parseParenArrowList = function(startPos, startLoc, exprList, forInit) {
	  return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, false, forInit)
	};

	// New's precedence is slightly tricky. It must allow its argument to
	// be a `[]` or dot subscript expression, but not a call — at least,
	// not without wrapping it in parentheses. Thus, it uses the noCalls
	// argument to parseSubscripts to prevent it from consuming the
	// argument list.

	var empty = [];

	pp$5.parseNew = function() {
	  if (this.containsEsc) { this.raiseRecoverable(this.start, "Escape sequence in keyword new"); }
	  var node = this.startNode();
	  this.next();
	  if (this.options.ecmaVersion >= 6 && this.type === types$1.dot) {
	    var meta = this.startNodeAt(node.start, node.loc && node.loc.start);
	    meta.name = "new";
	    node.meta = this.finishNode(meta, "Identifier");
	    this.next();
	    var containsEsc = this.containsEsc;
	    node.property = this.parseIdent(true);
	    if (node.property.name !== "target")
	      { this.raiseRecoverable(node.property.start, "The only valid meta property for new is 'new.target'"); }
	    if (containsEsc)
	      { this.raiseRecoverable(node.start, "'new.target' must not contain escaped characters"); }
	    if (!this.allowNewDotTarget)
	      { this.raiseRecoverable(node.start, "'new.target' can only be used in functions and class static block"); }
	    return this.finishNode(node, "MetaProperty")
	  }
	  var startPos = this.start, startLoc = this.startLoc;
	  node.callee = this.parseSubscripts(this.parseExprAtom(null, false, true), startPos, startLoc, true, false);
	  if (node.callee.type === "Super")
	    { this.raiseRecoverable(startPos, "Invalid use of 'super'"); }
	  if (this.eat(types$1.parenL)) { node.arguments = this.parseExprList(types$1.parenR, this.options.ecmaVersion >= 8, false); }
	  else { node.arguments = empty; }
	  return this.finishNode(node, "NewExpression")
	};

	// Parse template expression.

	pp$5.parseTemplateElement = function(ref) {
	  var isTagged = ref.isTagged;

	  var elem = this.startNode();
	  if (this.type === types$1.invalidTemplate) {
	    if (!isTagged) {
	      this.raiseRecoverable(this.start, "Bad escape sequence in untagged template literal");
	    }
	    elem.value = {
	      raw: this.value.replace(/\r\n?/g, "\n"),
	      cooked: null
	    };
	  } else {
	    elem.value = {
	      raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, "\n"),
	      cooked: this.value
	    };
	  }
	  this.next();
	  elem.tail = this.type === types$1.backQuote;
	  return this.finishNode(elem, "TemplateElement")
	};

	pp$5.parseTemplate = function(ref) {
	  if ( ref === void 0 ) ref = {};
	  var isTagged = ref.isTagged; if ( isTagged === void 0 ) isTagged = false;

	  var node = this.startNode();
	  this.next();
	  node.expressions = [];
	  var curElt = this.parseTemplateElement({isTagged: isTagged});
	  node.quasis = [curElt];
	  while (!curElt.tail) {
	    if (this.type === types$1.eof) { this.raise(this.pos, "Unterminated template literal"); }
	    this.expect(types$1.dollarBraceL);
	    node.expressions.push(this.parseExpression());
	    this.expect(types$1.braceR);
	    node.quasis.push(curElt = this.parseTemplateElement({isTagged: isTagged}));
	  }
	  this.next();
	  return this.finishNode(node, "TemplateLiteral")
	};

	pp$5.isAsyncProp = function(prop) {
	  return !prop.computed && prop.key.type === "Identifier" && prop.key.name === "async" &&
	    (this.type === types$1.name || this.type === types$1.num || this.type === types$1.string || this.type === types$1.bracketL || this.type.keyword || (this.options.ecmaVersion >= 9 && this.type === types$1.star)) &&
	    !lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
	};

	// Parse an object literal or binding pattern.

	pp$5.parseObj = function(isPattern, refDestructuringErrors) {
	  var node = this.startNode(), first = true, propHash = {};
	  node.properties = [];
	  this.next();
	  while (!this.eat(types$1.braceR)) {
	    if (!first) {
	      this.expect(types$1.comma);
	      if (this.options.ecmaVersion >= 5 && this.afterTrailingComma(types$1.braceR)) { break }
	    } else { first = false; }

	    var prop = this.parseProperty(isPattern, refDestructuringErrors);
	    if (!isPattern) { this.checkPropClash(prop, propHash, refDestructuringErrors); }
	    node.properties.push(prop);
	  }
	  return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression")
	};

	pp$5.parseProperty = function(isPattern, refDestructuringErrors) {
	  var prop = this.startNode(), isGenerator, isAsync, startPos, startLoc;
	  if (this.options.ecmaVersion >= 9 && this.eat(types$1.ellipsis)) {
	    if (isPattern) {
	      prop.argument = this.parseIdent(false);
	      if (this.type === types$1.comma) {
	        this.raiseRecoverable(this.start, "Comma is not permitted after the rest element");
	      }
	      return this.finishNode(prop, "RestElement")
	    }
	    // Parse argument.
	    prop.argument = this.parseMaybeAssign(false, refDestructuringErrors);
	    // To disallow trailing comma via `this.toAssignable()`.
	    if (this.type === types$1.comma && refDestructuringErrors && refDestructuringErrors.trailingComma < 0) {
	      refDestructuringErrors.trailingComma = this.start;
	    }
	    // Finish
	    return this.finishNode(prop, "SpreadElement")
	  }
	  if (this.options.ecmaVersion >= 6) {
	    prop.method = false;
	    prop.shorthand = false;
	    if (isPattern || refDestructuringErrors) {
	      startPos = this.start;
	      startLoc = this.startLoc;
	    }
	    if (!isPattern)
	      { isGenerator = this.eat(types$1.star); }
	  }
	  var containsEsc = this.containsEsc;
	  this.parsePropertyName(prop);
	  if (!isPattern && !containsEsc && this.options.ecmaVersion >= 8 && !isGenerator && this.isAsyncProp(prop)) {
	    isAsync = true;
	    isGenerator = this.options.ecmaVersion >= 9 && this.eat(types$1.star);
	    this.parsePropertyName(prop);
	  } else {
	    isAsync = false;
	  }
	  this.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc);
	  return this.finishNode(prop, "Property")
	};

	pp$5.parseGetterSetter = function(prop) {
	  var kind = prop.key.name;
	  this.parsePropertyName(prop);
	  prop.value = this.parseMethod(false);
	  prop.kind = kind;
	  var paramCount = prop.kind === "get" ? 0 : 1;
	  if (prop.value.params.length !== paramCount) {
	    var start = prop.value.start;
	    if (prop.kind === "get")
	      { this.raiseRecoverable(start, "getter should have no params"); }
	    else
	      { this.raiseRecoverable(start, "setter should have exactly one param"); }
	  } else {
	    if (prop.kind === "set" && prop.value.params[0].type === "RestElement")
	      { this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params"); }
	  }
	};

	pp$5.parsePropertyValue = function(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc) {
	  if ((isGenerator || isAsync) && this.type === types$1.colon)
	    { this.unexpected(); }

	  if (this.eat(types$1.colon)) {
	    prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
	    prop.kind = "init";
	  } else if (this.options.ecmaVersion >= 6 && this.type === types$1.parenL) {
	    if (isPattern) { this.unexpected(); }
	    prop.method = true;
	    prop.value = this.parseMethod(isGenerator, isAsync);
	    prop.kind = "init";
	  } else if (!isPattern && !containsEsc &&
	             this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
	             (prop.key.name === "get" || prop.key.name === "set") &&
	             (this.type !== types$1.comma && this.type !== types$1.braceR && this.type !== types$1.eq)) {
	    if (isGenerator || isAsync) { this.unexpected(); }
	    this.parseGetterSetter(prop);
	  } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
	    if (isGenerator || isAsync) { this.unexpected(); }
	    this.checkUnreserved(prop.key);
	    if (prop.key.name === "await" && !this.awaitIdentPos)
	      { this.awaitIdentPos = startPos; }
	    if (isPattern) {
	      prop.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop.key));
	    } else if (this.type === types$1.eq && refDestructuringErrors) {
	      if (refDestructuringErrors.shorthandAssign < 0)
	        { refDestructuringErrors.shorthandAssign = this.start; }
	      prop.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop.key));
	    } else {
	      prop.value = this.copyNode(prop.key);
	    }
	    prop.kind = "init";
	    prop.shorthand = true;
	  } else { this.unexpected(); }
	};

	pp$5.parsePropertyName = function(prop) {
	  if (this.options.ecmaVersion >= 6) {
	    if (this.eat(types$1.bracketL)) {
	      prop.computed = true;
	      prop.key = this.parseMaybeAssign();
	      this.expect(types$1.bracketR);
	      return prop.key
	    } else {
	      prop.computed = false;
	    }
	  }
	  return prop.key = this.type === types$1.num || this.type === types$1.string ? this.parseExprAtom() : this.parseIdent(this.options.allowReserved !== "never")
	};

	// Initialize empty function node.

	pp$5.initFunction = function(node) {
	  node.id = null;
	  if (this.options.ecmaVersion >= 6) { node.generator = node.expression = false; }
	  if (this.options.ecmaVersion >= 8) { node.async = false; }
	};

	// Parse object or class method.

	pp$5.parseMethod = function(isGenerator, isAsync, allowDirectSuper) {
	  var node = this.startNode(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;

	  this.initFunction(node);
	  if (this.options.ecmaVersion >= 6)
	    { node.generator = isGenerator; }
	  if (this.options.ecmaVersion >= 8)
	    { node.async = !!isAsync; }

	  this.yieldPos = 0;
	  this.awaitPos = 0;
	  this.awaitIdentPos = 0;
	  this.enterScope(functionFlags(isAsync, node.generator) | SCOPE_SUPER | (allowDirectSuper ? SCOPE_DIRECT_SUPER : 0));

	  this.expect(types$1.parenL);
	  node.params = this.parseBindingList(types$1.parenR, false, this.options.ecmaVersion >= 8);
	  this.checkYieldAwaitInDefaultParams();
	  this.parseFunctionBody(node, false, true, false);

	  this.yieldPos = oldYieldPos;
	  this.awaitPos = oldAwaitPos;
	  this.awaitIdentPos = oldAwaitIdentPos;
	  return this.finishNode(node, "FunctionExpression")
	};

	// Parse arrow function expression with given parameters.

	pp$5.parseArrowExpression = function(node, params, isAsync, forInit) {
	  var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;

	  this.enterScope(functionFlags(isAsync, false) | SCOPE_ARROW);
	  this.initFunction(node);
	  if (this.options.ecmaVersion >= 8) { node.async = !!isAsync; }

	  this.yieldPos = 0;
	  this.awaitPos = 0;
	  this.awaitIdentPos = 0;

	  node.params = this.toAssignableList(params, true);
	  this.parseFunctionBody(node, true, false, forInit);

	  this.yieldPos = oldYieldPos;
	  this.awaitPos = oldAwaitPos;
	  this.awaitIdentPos = oldAwaitIdentPos;
	  return this.finishNode(node, "ArrowFunctionExpression")
	};

	// Parse function body and check parameters.

	pp$5.parseFunctionBody = function(node, isArrowFunction, isMethod, forInit) {
	  var isExpression = isArrowFunction && this.type !== types$1.braceL;
	  var oldStrict = this.strict, useStrict = false;

	  if (isExpression) {
	    node.body = this.parseMaybeAssign(forInit);
	    node.expression = true;
	    this.checkParams(node, false);
	  } else {
	    var nonSimple = this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params);
	    if (!oldStrict || nonSimple) {
	      useStrict = this.strictDirective(this.end);
	      // If this is a strict mode function, verify that argument names
	      // are not repeated, and it does not try to bind the words `eval`
	      // or `arguments`.
	      if (useStrict && nonSimple)
	        { this.raiseRecoverable(node.start, "Illegal 'use strict' directive in function with non-simple parameter list"); }
	    }
	    // Start a new scope with regard to labels and the `inFunction`
	    // flag (restore them to their old value afterwards).
	    var oldLabels = this.labels;
	    this.labels = [];
	    if (useStrict) { this.strict = true; }

	    // Add the params to varDeclaredNames to ensure that an error is thrown
	    // if a let/const declaration in the function clashes with one of the params.
	    this.checkParams(node, !oldStrict && !useStrict && !isArrowFunction && !isMethod && this.isSimpleParamList(node.params));
	    // Ensure the function name isn't a forbidden identifier in strict mode, e.g. 'eval'
	    if (this.strict && node.id) { this.checkLValSimple(node.id, BIND_OUTSIDE); }
	    node.body = this.parseBlock(false, undefined, useStrict && !oldStrict);
	    node.expression = false;
	    this.adaptDirectivePrologue(node.body.body);
	    this.labels = oldLabels;
	  }
	  this.exitScope();
	};

	pp$5.isSimpleParamList = function(params) {
	  for (var i = 0, list = params; i < list.length; i += 1)
	    {
	    var param = list[i];

	    if (param.type !== "Identifier") { return false
	  } }
	  return true
	};

	// Checks function params for various disallowed patterns such as using "eval"
	// or "arguments" and duplicate parameters.

	pp$5.checkParams = function(node, allowDuplicates) {
	  var nameHash = Object.create(null);
	  for (var i = 0, list = node.params; i < list.length; i += 1)
	    {
	    var param = list[i];

	    this.checkLValInnerPattern(param, BIND_VAR, allowDuplicates ? null : nameHash);
	  }
	};

	// Parses a comma-separated list of expressions, and returns them as
	// an array. `close` is the token type that ends the list, and
	// `allowEmpty` can be turned on to allow subsequent commas with
	// nothing in between them to be parsed as `null` (which is needed
	// for array literals).

	pp$5.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
	  var elts = [], first = true;
	  while (!this.eat(close)) {
	    if (!first) {
	      this.expect(types$1.comma);
	      if (allowTrailingComma && this.afterTrailingComma(close)) { break }
	    } else { first = false; }

	    var elt = (void 0);
	    if (allowEmpty && this.type === types$1.comma)
	      { elt = null; }
	    else if (this.type === types$1.ellipsis) {
	      elt = this.parseSpread(refDestructuringErrors);
	      if (refDestructuringErrors && this.type === types$1.comma && refDestructuringErrors.trailingComma < 0)
	        { refDestructuringErrors.trailingComma = this.start; }
	    } else {
	      elt = this.parseMaybeAssign(false, refDestructuringErrors);
	    }
	    elts.push(elt);
	  }
	  return elts
	};

	pp$5.checkUnreserved = function(ref) {
	  var start = ref.start;
	  var end = ref.end;
	  var name = ref.name;

	  if (this.inGenerator && name === "yield")
	    { this.raiseRecoverable(start, "Cannot use 'yield' as identifier inside a generator"); }
	  if (this.inAsync && name === "await")
	    { this.raiseRecoverable(start, "Cannot use 'await' as identifier inside an async function"); }
	  if (!(this.currentThisScope().flags & SCOPE_VAR) && name === "arguments")
	    { this.raiseRecoverable(start, "Cannot use 'arguments' in class field initializer"); }
	  if (this.inClassStaticBlock && (name === "arguments" || name === "await"))
	    { this.raise(start, ("Cannot use " + name + " in class static initialization block")); }
	  if (this.keywords.test(name))
	    { this.raise(start, ("Unexpected keyword '" + name + "'")); }
	  if (this.options.ecmaVersion < 6 &&
	    this.input.slice(start, end).indexOf("\\") !== -1) { return }
	  var re = this.strict ? this.reservedWordsStrict : this.reservedWords;
	  if (re.test(name)) {
	    if (!this.inAsync && name === "await")
	      { this.raiseRecoverable(start, "Cannot use keyword 'await' outside an async function"); }
	    this.raiseRecoverable(start, ("The keyword '" + name + "' is reserved"));
	  }
	};

	// Parse the next token as an identifier. If `liberal` is true (used
	// when parsing properties), it will also convert keywords into
	// identifiers.

	pp$5.parseIdent = function(liberal) {
	  var node = this.parseIdentNode();
	  this.next(!!liberal);
	  this.finishNode(node, "Identifier");
	  if (!liberal) {
	    this.checkUnreserved(node);
	    if (node.name === "await" && !this.awaitIdentPos)
	      { this.awaitIdentPos = node.start; }
	  }
	  return node
	};

	pp$5.parseIdentNode = function() {
	  var node = this.startNode();
	  if (this.type === types$1.name) {
	    node.name = this.value;
	  } else if (this.type.keyword) {
	    node.name = this.type.keyword;

	    // To fix https://github.com/acornjs/acorn/issues/575
	    // `class` and `function` keywords push new context into this.context.
	    // But there is no chance to pop the context if the keyword is consumed as an identifier such as a property name.
	    // If the previous token is a dot, this does not apply because the context-managing code already ignored the keyword
	    if ((node.name === "class" || node.name === "function") &&
	      (this.lastTokEnd !== this.lastTokStart + 1 || this.input.charCodeAt(this.lastTokStart) !== 46)) {
	      this.context.pop();
	    }
	    this.type = types$1.name;
	  } else {
	    this.unexpected();
	  }
	  return node
	};

	pp$5.parsePrivateIdent = function() {
	  var node = this.startNode();
	  if (this.type === types$1.privateId) {
	    node.name = this.value;
	  } else {
	    this.unexpected();
	  }
	  this.next();
	  this.finishNode(node, "PrivateIdentifier");

	  // For validating existence
	  if (this.options.checkPrivateFields) {
	    if (this.privateNameStack.length === 0) {
	      this.raise(node.start, ("Private field '#" + (node.name) + "' must be declared in an enclosing class"));
	    } else {
	      this.privateNameStack[this.privateNameStack.length - 1].used.push(node);
	    }
	  }

	  return node
	};

	// Parses yield expression inside generator.

	pp$5.parseYield = function(forInit) {
	  if (!this.yieldPos) { this.yieldPos = this.start; }

	  var node = this.startNode();
	  this.next();
	  if (this.type === types$1.semi || this.canInsertSemicolon() || (this.type !== types$1.star && !this.type.startsExpr)) {
	    node.delegate = false;
	    node.argument = null;
	  } else {
	    node.delegate = this.eat(types$1.star);
	    node.argument = this.parseMaybeAssign(forInit);
	  }
	  return this.finishNode(node, "YieldExpression")
	};

	pp$5.parseAwait = function(forInit) {
	  if (!this.awaitPos) { this.awaitPos = this.start; }

	  var node = this.startNode();
	  this.next();
	  node.argument = this.parseMaybeUnary(null, true, false, forInit);
	  return this.finishNode(node, "AwaitExpression")
	};

	var pp$4 = Parser.prototype;

	// This function is used to raise exceptions on parse errors. It
	// takes an offset integer (into the current `input`) to indicate
	// the location of the error, attaches the position to the end
	// of the error message, and then raises a `SyntaxError` with that
	// message.

	pp$4.raise = function(pos, message) {
	  var loc = getLineInfo(this.input, pos);
	  message += " (" + loc.line + ":" + loc.column + ")";
	  if (this.sourceFile) {
	    message += " in " + this.sourceFile;
	  }
	  var err = new SyntaxError(message);
	  err.pos = pos; err.loc = loc; err.raisedAt = this.pos;
	  throw err
	};

	pp$4.raiseRecoverable = pp$4.raise;

	pp$4.curPosition = function() {
	  if (this.options.locations) {
	    return new Position(this.curLine, this.pos - this.lineStart)
	  }
	};

	var pp$3 = Parser.prototype;

	var Scope = function Scope(flags) {
	  this.flags = flags;
	  // A list of var-declared names in the current lexical scope
	  this.var = [];
	  // A list of lexically-declared names in the current lexical scope
	  this.lexical = [];
	  // A list of lexically-declared FunctionDeclaration names in the current lexical scope
	  this.functions = [];
	};

	// The functions in this module keep track of declared variables in the current scope in order to detect duplicate variable names.

	pp$3.enterScope = function(flags) {
	  this.scopeStack.push(new Scope(flags));
	};

	pp$3.exitScope = function() {
	  this.scopeStack.pop();
	};

	// The spec says:
	// > At the top level of a function, or script, function declarations are
	// > treated like var declarations rather than like lexical declarations.
	pp$3.treatFunctionsAsVarInScope = function(scope) {
	  return (scope.flags & SCOPE_FUNCTION) || !this.inModule && (scope.flags & SCOPE_TOP)
	};

	pp$3.declareName = function(name, bindingType, pos) {
	  var redeclared = false;
	  if (bindingType === BIND_LEXICAL) {
	    var scope = this.currentScope();
	    redeclared = scope.lexical.indexOf(name) > -1 || scope.functions.indexOf(name) > -1 || scope.var.indexOf(name) > -1;
	    scope.lexical.push(name);
	    if (this.inModule && (scope.flags & SCOPE_TOP))
	      { delete this.undefinedExports[name]; }
	  } else if (bindingType === BIND_SIMPLE_CATCH) {
	    var scope$1 = this.currentScope();
	    scope$1.lexical.push(name);
	  } else if (bindingType === BIND_FUNCTION) {
	    var scope$2 = this.currentScope();
	    if (this.treatFunctionsAsVar)
	      { redeclared = scope$2.lexical.indexOf(name) > -1; }
	    else
	      { redeclared = scope$2.lexical.indexOf(name) > -1 || scope$2.var.indexOf(name) > -1; }
	    scope$2.functions.push(name);
	  } else {
	    for (var i = this.scopeStack.length - 1; i >= 0; --i) {
	      var scope$3 = this.scopeStack[i];
	      if (scope$3.lexical.indexOf(name) > -1 && !((scope$3.flags & SCOPE_SIMPLE_CATCH) && scope$3.lexical[0] === name) ||
	          !this.treatFunctionsAsVarInScope(scope$3) && scope$3.functions.indexOf(name) > -1) {
	        redeclared = true;
	        break
	      }
	      scope$3.var.push(name);
	      if (this.inModule && (scope$3.flags & SCOPE_TOP))
	        { delete this.undefinedExports[name]; }
	      if (scope$3.flags & SCOPE_VAR) { break }
	    }
	  }
	  if (redeclared) { this.raiseRecoverable(pos, ("Identifier '" + name + "' has already been declared")); }
	};

	pp$3.checkLocalExport = function(id) {
	  // scope.functions must be empty as Module code is always strict.
	  if (this.scopeStack[0].lexical.indexOf(id.name) === -1 &&
	      this.scopeStack[0].var.indexOf(id.name) === -1) {
	    this.undefinedExports[id.name] = id;
	  }
	};

	pp$3.currentScope = function() {
	  return this.scopeStack[this.scopeStack.length - 1]
	};

	pp$3.currentVarScope = function() {
	  for (var i = this.scopeStack.length - 1;; i--) {
	    var scope = this.scopeStack[i];
	    if (scope.flags & (SCOPE_VAR | SCOPE_CLASS_FIELD_INIT | SCOPE_CLASS_STATIC_BLOCK)) { return scope }
	  }
	};

	// Could be useful for `this`, `new.target`, `super()`, `super.property`, and `super[property]`.
	pp$3.currentThisScope = function() {
	  for (var i = this.scopeStack.length - 1;; i--) {
	    var scope = this.scopeStack[i];
	    if (scope.flags & (SCOPE_VAR | SCOPE_CLASS_FIELD_INIT | SCOPE_CLASS_STATIC_BLOCK) &&
	        !(scope.flags & SCOPE_ARROW)) { return scope }
	  }
	};

	var Node = function Node(parser, pos, loc) {
	  this.type = "";
	  this.start = pos;
	  this.end = 0;
	  if (parser.options.locations)
	    { this.loc = new SourceLocation(parser, loc); }
	  if (parser.options.directSourceFile)
	    { this.sourceFile = parser.options.directSourceFile; }
	  if (parser.options.ranges)
	    { this.range = [pos, 0]; }
	};

	// Start an AST node, attaching a start offset.

	var pp$2 = Parser.prototype;

	pp$2.startNode = function() {
	  return new Node(this, this.start, this.startLoc)
	};

	pp$2.startNodeAt = function(pos, loc) {
	  return new Node(this, pos, loc)
	};

	// Finish an AST node, adding `type` and `end` properties.

	function finishNodeAt(node, type, pos, loc) {
	  node.type = type;
	  node.end = pos;
	  if (this.options.locations)
	    { node.loc.end = loc; }
	  if (this.options.ranges)
	    { node.range[1] = pos; }
	  return node
	}

	pp$2.finishNode = function(node, type) {
	  return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc)
	};

	// Finish node at given position

	pp$2.finishNodeAt = function(node, type, pos, loc) {
	  return finishNodeAt.call(this, node, type, pos, loc)
	};

	pp$2.copyNode = function(node) {
	  var newNode = new Node(this, node.start, this.startLoc);
	  for (var prop in node) { newNode[prop] = node[prop]; }
	  return newNode
	};

	// This file was generated by "bin/generate-unicode-script-values.js". Do not modify manually!
	var scriptValuesAddedInUnicode = "Berf Beria_Erfe Gara Garay Gukh Gurung_Khema Hrkt Katakana_Or_Hiragana Kawi Kirat_Rai Krai Nag_Mundari Nagm Ol_Onal Onao Sidetic Sidt Sunu Sunuwar Tai_Yo Tayo Todhri Todr Tolong_Siki Tols Tulu_Tigalari Tutg Unknown Zzzz";

	// This file contains Unicode properties extracted from the ECMAScript specification.
	// The lists are extracted like so:
	// $$('#table-binary-unicode-properties > figure > table > tbody > tr > td:nth-child(1) code').map(el => el.innerText)

	// #table-binary-unicode-properties
	var ecma9BinaryProperties = "ASCII ASCII_Hex_Digit AHex Alphabetic Alpha Any Assigned Bidi_Control Bidi_C Bidi_Mirrored Bidi_M Case_Ignorable CI Cased Changes_When_Casefolded CWCF Changes_When_Casemapped CWCM Changes_When_Lowercased CWL Changes_When_NFKC_Casefolded CWKCF Changes_When_Titlecased CWT Changes_When_Uppercased CWU Dash Default_Ignorable_Code_Point DI Deprecated Dep Diacritic Dia Emoji Emoji_Component Emoji_Modifier Emoji_Modifier_Base Emoji_Presentation Extender Ext Grapheme_Base Gr_Base Grapheme_Extend Gr_Ext Hex_Digit Hex IDS_Binary_Operator IDSB IDS_Trinary_Operator IDST ID_Continue IDC ID_Start IDS Ideographic Ideo Join_Control Join_C Logical_Order_Exception LOE Lowercase Lower Math Noncharacter_Code_Point NChar Pattern_Syntax Pat_Syn Pattern_White_Space Pat_WS Quotation_Mark QMark Radical Regional_Indicator RI Sentence_Terminal STerm Soft_Dotted SD Terminal_Punctuation Term Unified_Ideograph UIdeo Uppercase Upper Variation_Selector VS White_Space space XID_Continue XIDC XID_Start XIDS";
	var ecma10BinaryProperties = ecma9BinaryProperties + " Extended_Pictographic";
	var ecma11BinaryProperties = ecma10BinaryProperties;
	var ecma12BinaryProperties = ecma11BinaryProperties + " EBase EComp EMod EPres ExtPict";
	var ecma13BinaryProperties = ecma12BinaryProperties;
	var ecma14BinaryProperties = ecma13BinaryProperties;

	var unicodeBinaryProperties = {
	  9: ecma9BinaryProperties,
	  10: ecma10BinaryProperties,
	  11: ecma11BinaryProperties,
	  12: ecma12BinaryProperties,
	  13: ecma13BinaryProperties,
	  14: ecma14BinaryProperties
	};

	// #table-binary-unicode-properties-of-strings
	var ecma14BinaryPropertiesOfStrings = "Basic_Emoji Emoji_Keycap_Sequence RGI_Emoji_Modifier_Sequence RGI_Emoji_Flag_Sequence RGI_Emoji_Tag_Sequence RGI_Emoji_ZWJ_Sequence RGI_Emoji";

	var unicodeBinaryPropertiesOfStrings = {
	  9: "",
	  10: "",
	  11: "",
	  12: "",
	  13: "",
	  14: ecma14BinaryPropertiesOfStrings
	};

	// #table-unicode-general-category-values
	var unicodeGeneralCategoryValues = "Cased_Letter LC Close_Punctuation Pe Connector_Punctuation Pc Control Cc cntrl Currency_Symbol Sc Dash_Punctuation Pd Decimal_Number Nd digit Enclosing_Mark Me Final_Punctuation Pf Format Cf Initial_Punctuation Pi Letter L Letter_Number Nl Line_Separator Zl Lowercase_Letter Ll Mark M Combining_Mark Math_Symbol Sm Modifier_Letter Lm Modifier_Symbol Sk Nonspacing_Mark Mn Number N Open_Punctuation Ps Other C Other_Letter Lo Other_Number No Other_Punctuation Po Other_Symbol So Paragraph_Separator Zp Private_Use Co Punctuation P punct Separator Z Space_Separator Zs Spacing_Mark Mc Surrogate Cs Symbol S Titlecase_Letter Lt Unassigned Cn Uppercase_Letter Lu";

	// #table-unicode-script-values
	var ecma9ScriptValues = "Adlam Adlm Ahom Anatolian_Hieroglyphs Hluw Arabic Arab Armenian Armn Avestan Avst Balinese Bali Bamum Bamu Bassa_Vah Bass Batak Batk Bengali Beng Bhaiksuki Bhks Bopomofo Bopo Brahmi Brah Braille Brai Buginese Bugi Buhid Buhd Canadian_Aboriginal Cans Carian Cari Caucasian_Albanian Aghb Chakma Cakm Cham Cham Cherokee Cher Common Zyyy Coptic Copt Qaac Cuneiform Xsux Cypriot Cprt Cyrillic Cyrl Deseret Dsrt Devanagari Deva Duployan Dupl Egyptian_Hieroglyphs Egyp Elbasan Elba Ethiopic Ethi Georgian Geor Glagolitic Glag Gothic Goth Grantha Gran Greek Grek Gujarati Gujr Gurmukhi Guru Han Hani Hangul Hang Hanunoo Hano Hatran Hatr Hebrew Hebr Hiragana Hira Imperial_Aramaic Armi Inherited Zinh Qaai Inscriptional_Pahlavi Phli Inscriptional_Parthian Prti Javanese Java Kaithi Kthi Kannada Knda Katakana Kana Kayah_Li Kali Kharoshthi Khar Khmer Khmr Khojki Khoj Khudawadi Sind Lao Laoo Latin Latn Lepcha Lepc Limbu Limb Linear_A Lina Linear_B Linb Lisu Lisu Lycian Lyci Lydian Lydi Mahajani Mahj Malayalam Mlym Mandaic Mand Manichaean Mani Marchen Marc Masaram_Gondi Gonm Meetei_Mayek Mtei Mende_Kikakui Mend Meroitic_Cursive Merc Meroitic_Hieroglyphs Mero Miao Plrd Modi Mongolian Mong Mro Mroo Multani Mult Myanmar Mymr Nabataean Nbat New_Tai_Lue Talu Newa Newa Nko Nkoo Nushu Nshu Ogham Ogam Ol_Chiki Olck Old_Hungarian Hung Old_Italic Ital Old_North_Arabian Narb Old_Permic Perm Old_Persian Xpeo Old_South_Arabian Sarb Old_Turkic Orkh Oriya Orya Osage Osge Osmanya Osma Pahawh_Hmong Hmng Palmyrene Palm Pau_Cin_Hau Pauc Phags_Pa Phag Phoenician Phnx Psalter_Pahlavi Phlp Rejang Rjng Runic Runr Samaritan Samr Saurashtra Saur Sharada Shrd Shavian Shaw Siddham Sidd SignWriting Sgnw Sinhala Sinh Sora_Sompeng Sora Soyombo Soyo Sundanese Sund Syloti_Nagri Sylo Syriac Syrc Tagalog Tglg Tagbanwa Tagb Tai_Le Tale Tai_Tham Lana Tai_Viet Tavt Takri Takr Tamil Taml Tangut Tang Telugu Telu Thaana Thaa Thai Thai Tibetan Tibt Tifinagh Tfng Tirhuta Tirh Ugaritic Ugar Vai Vaii Warang_Citi Wara Yi Yiii Zanabazar_Square Zanb";
	var ecma10ScriptValues = ecma9ScriptValues + " Dogra Dogr Gunjala_Gondi Gong Hanifi_Rohingya Rohg Makasar Maka Medefaidrin Medf Old_Sogdian Sogo Sogdian Sogd";
	var ecma11ScriptValues = ecma10ScriptValues + " Elymaic Elym Nandinagari Nand Nyiakeng_Puachue_Hmong Hmnp Wancho Wcho";
	var ecma12ScriptValues = ecma11ScriptValues + " Chorasmian Chrs Diak Dives_Akuru Khitan_Small_Script Kits Yezi Yezidi";
	var ecma13ScriptValues = ecma12ScriptValues + " Cypro_Minoan Cpmn Old_Uyghur Ougr Tangsa Tnsa Toto Vithkuqi Vith";
	var ecma14ScriptValues = ecma13ScriptValues + " " + scriptValuesAddedInUnicode;

	var unicodeScriptValues = {
	  9: ecma9ScriptValues,
	  10: ecma10ScriptValues,
	  11: ecma11ScriptValues,
	  12: ecma12ScriptValues,
	  13: ecma13ScriptValues,
	  14: ecma14ScriptValues
	};

	var data = {};
	function buildUnicodeData(ecmaVersion) {
	  var d = data[ecmaVersion] = {
	    binary: wordsRegexp(unicodeBinaryProperties[ecmaVersion] + " " + unicodeGeneralCategoryValues),
	    binaryOfStrings: wordsRegexp(unicodeBinaryPropertiesOfStrings[ecmaVersion]),
	    nonBinary: {
	      General_Category: wordsRegexp(unicodeGeneralCategoryValues),
	      Script: wordsRegexp(unicodeScriptValues[ecmaVersion])
	    }
	  };
	  d.nonBinary.Script_Extensions = d.nonBinary.Script;

	  d.nonBinary.gc = d.nonBinary.General_Category;
	  d.nonBinary.sc = d.nonBinary.Script;
	  d.nonBinary.scx = d.nonBinary.Script_Extensions;
	}

	for (var i = 0, list = [9, 10, 11, 12, 13, 14]; i < list.length; i += 1) {
	  var ecmaVersion = list[i];

	  buildUnicodeData(ecmaVersion);
	}

	var pp$1 = Parser.prototype;

	// Track disjunction structure to determine whether a duplicate
	// capture group name is allowed because it is in a separate branch.
	var BranchID = function BranchID(parent, base) {
	  // Parent disjunction branch
	  this.parent = parent;
	  // Identifies this set of sibling branches
	  this.base = base || this;
	};

	BranchID.prototype.separatedFrom = function separatedFrom (alt) {
	  // A branch is separate from another branch if they or any of
	  // their parents are siblings in a given disjunction
	  for (var self = this; self; self = self.parent) {
	    for (var other = alt; other; other = other.parent) {
	      if (self.base === other.base && self !== other) { return true }
	    }
	  }
	  return false
	};

	BranchID.prototype.sibling = function sibling () {
	  return new BranchID(this.parent, this.base)
	};

	var RegExpValidationState = function RegExpValidationState(parser) {
	  this.parser = parser;
	  this.validFlags = "gim" + (parser.options.ecmaVersion >= 6 ? "uy" : "") + (parser.options.ecmaVersion >= 9 ? "s" : "") + (parser.options.ecmaVersion >= 13 ? "d" : "") + (parser.options.ecmaVersion >= 15 ? "v" : "");
	  this.unicodeProperties = data[parser.options.ecmaVersion >= 14 ? 14 : parser.options.ecmaVersion];
	  this.source = "";
	  this.flags = "";
	  this.start = 0;
	  this.switchU = false;
	  this.switchV = false;
	  this.switchN = false;
	  this.pos = 0;
	  this.lastIntValue = 0;
	  this.lastStringValue = "";
	  this.lastAssertionIsQuantifiable = false;
	  this.numCapturingParens = 0;
	  this.maxBackReference = 0;
	  this.groupNames = Object.create(null);
	  this.backReferenceNames = [];
	  this.branchID = null;
	};

	RegExpValidationState.prototype.reset = function reset (start, pattern, flags) {
	  var unicodeSets = flags.indexOf("v") !== -1;
	  var unicode = flags.indexOf("u") !== -1;
	  this.start = start | 0;
	  this.source = pattern + "";
	  this.flags = flags;
	  if (unicodeSets && this.parser.options.ecmaVersion >= 15) {
	    this.switchU = true;
	    this.switchV = true;
	    this.switchN = true;
	  } else {
	    this.switchU = unicode && this.parser.options.ecmaVersion >= 6;
	    this.switchV = false;
	    this.switchN = unicode && this.parser.options.ecmaVersion >= 9;
	  }
	};

	RegExpValidationState.prototype.raise = function raise (message) {
	  this.parser.raiseRecoverable(this.start, ("Invalid regular expression: /" + (this.source) + "/: " + message));
	};

	// If u flag is given, this returns the code point at the index (it combines a surrogate pair).
	// Otherwise, this returns the code unit of the index (can be a part of a surrogate pair).
	RegExpValidationState.prototype.at = function at (i, forceU) {
	    if ( forceU === void 0 ) forceU = false;

	  var s = this.source;
	  var l = s.length;
	  if (i >= l) {
	    return -1
	  }
	  var c = s.charCodeAt(i);
	  if (!(forceU || this.switchU) || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l) {
	    return c
	  }
	  var next = s.charCodeAt(i + 1);
	  return next >= 0xDC00 && next <= 0xDFFF ? (c << 10) + next - 0x35FDC00 : c
	};

	RegExpValidationState.prototype.nextIndex = function nextIndex (i, forceU) {
	    if ( forceU === void 0 ) forceU = false;

	  var s = this.source;
	  var l = s.length;
	  if (i >= l) {
	    return l
	  }
	  var c = s.charCodeAt(i), next;
	  if (!(forceU || this.switchU) || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l ||
	      (next = s.charCodeAt(i + 1)) < 0xDC00 || next > 0xDFFF) {
	    return i + 1
	  }
	  return i + 2
	};

	RegExpValidationState.prototype.current = function current (forceU) {
	    if ( forceU === void 0 ) forceU = false;

	  return this.at(this.pos, forceU)
	};

	RegExpValidationState.prototype.lookahead = function lookahead (forceU) {
	    if ( forceU === void 0 ) forceU = false;

	  return this.at(this.nextIndex(this.pos, forceU), forceU)
	};

	RegExpValidationState.prototype.advance = function advance (forceU) {
	    if ( forceU === void 0 ) forceU = false;

	  this.pos = this.nextIndex(this.pos, forceU);
	};

	RegExpValidationState.prototype.eat = function eat (ch, forceU) {
	    if ( forceU === void 0 ) forceU = false;

	  if (this.current(forceU) === ch) {
	    this.advance(forceU);
	    return true
	  }
	  return false
	};

	RegExpValidationState.prototype.eatChars = function eatChars (chs, forceU) {
	    if ( forceU === void 0 ) forceU = false;

	  var pos = this.pos;
	  for (var i = 0, list = chs; i < list.length; i += 1) {
	    var ch = list[i];

	      var current = this.at(pos, forceU);
	    if (current === -1 || current !== ch) {
	      return false
	    }
	    pos = this.nextIndex(pos, forceU);
	  }
	  this.pos = pos;
	  return true
	};

	/**
	 * Validate the flags part of a given RegExpLiteral.
	 *
	 * @param {RegExpValidationState} state The state to validate RegExp.
	 * @returns {void}
	 */
	pp$1.validateRegExpFlags = function(state) {
	  var validFlags = state.validFlags;
	  var flags = state.flags;

	  var u = false;
	  var v = false;

	  for (var i = 0; i < flags.length; i++) {
	    var flag = flags.charAt(i);
	    if (validFlags.indexOf(flag) === -1) {
	      this.raise(state.start, "Invalid regular expression flag");
	    }
	    if (flags.indexOf(flag, i + 1) > -1) {
	      this.raise(state.start, "Duplicate regular expression flag");
	    }
	    if (flag === "u") { u = true; }
	    if (flag === "v") { v = true; }
	  }
	  if (this.options.ecmaVersion >= 15 && u && v) {
	    this.raise(state.start, "Invalid regular expression flag");
	  }
	};

	function hasProp(obj) {
	  for (var _ in obj) { return true }
	  return false
	}

	/**
	 * Validate the pattern part of a given RegExpLiteral.
	 *
	 * @param {RegExpValidationState} state The state to validate RegExp.
	 * @returns {void}
	 */
	pp$1.validateRegExpPattern = function(state) {
	  this.regexp_pattern(state);

	  // The goal symbol for the parse is |Pattern[~U, ~N]|. If the result of
	  // parsing contains a |GroupName|, reparse with the goal symbol
	  // |Pattern[~U, +N]| and use this result instead. Throw a *SyntaxError*
	  // exception if _P_ did not conform to the grammar, if any elements of _P_
	  // were not matched by the parse, or if any Early Error conditions exist.
	  if (!state.switchN && this.options.ecmaVersion >= 9 && hasProp(state.groupNames)) {
	    state.switchN = true;
	    this.regexp_pattern(state);
	  }
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-Pattern
	pp$1.regexp_pattern = function(state) {
	  state.pos = 0;
	  state.lastIntValue = 0;
	  state.lastStringValue = "";
	  state.lastAssertionIsQuantifiable = false;
	  state.numCapturingParens = 0;
	  state.maxBackReference = 0;
	  state.groupNames = Object.create(null);
	  state.backReferenceNames.length = 0;
	  state.branchID = null;

	  this.regexp_disjunction(state);

	  if (state.pos !== state.source.length) {
	    // Make the same messages as V8.
	    if (state.eat(0x29 /* ) */)) {
	      state.raise("Unmatched ')'");
	    }
	    if (state.eat(0x5D /* ] */) || state.eat(0x7D /* } */)) {
	      state.raise("Lone quantifier brackets");
	    }
	  }
	  if (state.maxBackReference > state.numCapturingParens) {
	    state.raise("Invalid escape");
	  }
	  for (var i = 0, list = state.backReferenceNames; i < list.length; i += 1) {
	    var name = list[i];

	    if (!state.groupNames[name]) {
	      state.raise("Invalid named capture referenced");
	    }
	  }
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-Disjunction
	pp$1.regexp_disjunction = function(state) {
	  var trackDisjunction = this.options.ecmaVersion >= 16;
	  if (trackDisjunction) { state.branchID = new BranchID(state.branchID, null); }
	  this.regexp_alternative(state);
	  while (state.eat(0x7C /* | */)) {
	    if (trackDisjunction) { state.branchID = state.branchID.sibling(); }
	    this.regexp_alternative(state);
	  }
	  if (trackDisjunction) { state.branchID = state.branchID.parent; }

	  // Make the same message as V8.
	  if (this.regexp_eatQuantifier(state, true)) {
	    state.raise("Nothing to repeat");
	  }
	  if (state.eat(0x7B /* { */)) {
	    state.raise("Lone quantifier brackets");
	  }
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-Alternative
	pp$1.regexp_alternative = function(state) {
	  while (state.pos < state.source.length && this.regexp_eatTerm(state)) {}
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Term
	pp$1.regexp_eatTerm = function(state) {
	  if (this.regexp_eatAssertion(state)) {
	    // Handle `QuantifiableAssertion Quantifier` alternative.
	    // `state.lastAssertionIsQuantifiable` is true if the last eaten Assertion
	    // is a QuantifiableAssertion.
	    if (state.lastAssertionIsQuantifiable && this.regexp_eatQuantifier(state)) {
	      // Make the same message as V8.
	      if (state.switchU) {
	        state.raise("Invalid quantifier");
	      }
	    }
	    return true
	  }

	  if (state.switchU ? this.regexp_eatAtom(state) : this.regexp_eatExtendedAtom(state)) {
	    this.regexp_eatQuantifier(state);
	    return true
	  }

	  return false
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Assertion
	pp$1.regexp_eatAssertion = function(state) {
	  var start = state.pos;
	  state.lastAssertionIsQuantifiable = false;

	  // ^, $
	  if (state.eat(0x5E /* ^ */) || state.eat(0x24 /* $ */)) {
	    return true
	  }

	  // \b \B
	  if (state.eat(0x5C /* \ */)) {
	    if (state.eat(0x42 /* B */) || state.eat(0x62 /* b */)) {
	      return true
	    }
	    state.pos = start;
	  }

	  // Lookahead / Lookbehind
	  if (state.eat(0x28 /* ( */) && state.eat(0x3F /* ? */)) {
	    var lookbehind = false;
	    if (this.options.ecmaVersion >= 9) {
	      lookbehind = state.eat(0x3C /* < */);
	    }
	    if (state.eat(0x3D /* = */) || state.eat(0x21 /* ! */)) {
	      this.regexp_disjunction(state);
	      if (!state.eat(0x29 /* ) */)) {
	        state.raise("Unterminated group");
	      }
	      state.lastAssertionIsQuantifiable = !lookbehind;
	      return true
	    }
	  }

	  state.pos = start;
	  return false
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-Quantifier
	pp$1.regexp_eatQuantifier = function(state, noError) {
	  if ( noError === void 0 ) noError = false;

	  if (this.regexp_eatQuantifierPrefix(state, noError)) {
	    state.eat(0x3F /* ? */);
	    return true
	  }
	  return false
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-QuantifierPrefix
	pp$1.regexp_eatQuantifierPrefix = function(state, noError) {
	  return (
	    state.eat(0x2A /* * */) ||
	    state.eat(0x2B /* + */) ||
	    state.eat(0x3F /* ? */) ||
	    this.regexp_eatBracedQuantifier(state, noError)
	  )
	};
	pp$1.regexp_eatBracedQuantifier = function(state, noError) {
	  var start = state.pos;
	  if (state.eat(0x7B /* { */)) {
	    var min = 0, max = -1;
	    if (this.regexp_eatDecimalDigits(state)) {
	      min = state.lastIntValue;
	      if (state.eat(0x2C /* , */) && this.regexp_eatDecimalDigits(state)) {
	        max = state.lastIntValue;
	      }
	      if (state.eat(0x7D /* } */)) {
	        // SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-term
	        if (max !== -1 && max < min && !noError) {
	          state.raise("numbers out of order in {} quantifier");
	        }
	        return true
	      }
	    }
	    if (state.switchU && !noError) {
	      state.raise("Incomplete quantifier");
	    }
	    state.pos = start;
	  }
	  return false
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-Atom
	pp$1.regexp_eatAtom = function(state) {
	  return (
	    this.regexp_eatPatternCharacters(state) ||
	    state.eat(0x2E /* . */) ||
	    this.regexp_eatReverseSolidusAtomEscape(state) ||
	    this.regexp_eatCharacterClass(state) ||
	    this.regexp_eatUncapturingGroup(state) ||
	    this.regexp_eatCapturingGroup(state)
	  )
	};
	pp$1.regexp_eatReverseSolidusAtomEscape = function(state) {
	  var start = state.pos;
	  if (state.eat(0x5C /* \ */)) {
	    if (this.regexp_eatAtomEscape(state)) {
	      return true
	    }
	    state.pos = start;
	  }
	  return false
	};
	pp$1.regexp_eatUncapturingGroup = function(state) {
	  var start = state.pos;
	  if (state.eat(0x28 /* ( */)) {
	    if (state.eat(0x3F /* ? */)) {
	      if (this.options.ecmaVersion >= 16) {
	        var addModifiers = this.regexp_eatModifiers(state);
	        var hasHyphen = state.eat(0x2D /* - */);
	        if (addModifiers || hasHyphen) {
	          for (var i = 0; i < addModifiers.length; i++) {
	            var modifier = addModifiers.charAt(i);
	            if (addModifiers.indexOf(modifier, i + 1) > -1) {
	              state.raise("Duplicate regular expression modifiers");
	            }
	          }
	          if (hasHyphen) {
	            var removeModifiers = this.regexp_eatModifiers(state);
	            if (!addModifiers && !removeModifiers && state.current() === 0x3A /* : */) {
	              state.raise("Invalid regular expression modifiers");
	            }
	            for (var i$1 = 0; i$1 < removeModifiers.length; i$1++) {
	              var modifier$1 = removeModifiers.charAt(i$1);
	              if (
	                removeModifiers.indexOf(modifier$1, i$1 + 1) > -1 ||
	                addModifiers.indexOf(modifier$1) > -1
	              ) {
	                state.raise("Duplicate regular expression modifiers");
	              }
	            }
	          }
	        }
	      }
	      if (state.eat(0x3A /* : */)) {
	        this.regexp_disjunction(state);
	        if (state.eat(0x29 /* ) */)) {
	          return true
	        }
	        state.raise("Unterminated group");
	      }
	    }
	    state.pos = start;
	  }
	  return false
	};
	pp$1.regexp_eatCapturingGroup = function(state) {
	  if (state.eat(0x28 /* ( */)) {
	    if (this.options.ecmaVersion >= 9) {
	      this.regexp_groupSpecifier(state);
	    } else if (state.current() === 0x3F /* ? */) {
	      state.raise("Invalid group");
	    }
	    this.regexp_disjunction(state);
	    if (state.eat(0x29 /* ) */)) {
	      state.numCapturingParens += 1;
	      return true
	    }
	    state.raise("Unterminated group");
	  }
	  return false
	};
	// RegularExpressionModifiers ::
	//   [empty]
	//   RegularExpressionModifiers RegularExpressionModifier
	pp$1.regexp_eatModifiers = function(state) {
	  var modifiers = "";
	  var ch = 0;
	  while ((ch = state.current()) !== -1 && isRegularExpressionModifier(ch)) {
	    modifiers += codePointToString(ch);
	    state.advance();
	  }
	  return modifiers
	};
	// RegularExpressionModifier :: one of
	//   `i` `m` `s`
	function isRegularExpressionModifier(ch) {
	  return ch === 0x69 /* i */ || ch === 0x6d /* m */ || ch === 0x73 /* s */
	}

	// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedAtom
	pp$1.regexp_eatExtendedAtom = function(state) {
	  return (
	    state.eat(0x2E /* . */) ||
	    this.regexp_eatReverseSolidusAtomEscape(state) ||
	    this.regexp_eatCharacterClass(state) ||
	    this.regexp_eatUncapturingGroup(state) ||
	    this.regexp_eatCapturingGroup(state) ||
	    this.regexp_eatInvalidBracedQuantifier(state) ||
	    this.regexp_eatExtendedPatternCharacter(state)
	  )
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-InvalidBracedQuantifier
	pp$1.regexp_eatInvalidBracedQuantifier = function(state) {
	  if (this.regexp_eatBracedQuantifier(state, true)) {
	    state.raise("Nothing to repeat");
	  }
	  return false
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-SyntaxCharacter
	pp$1.regexp_eatSyntaxCharacter = function(state) {
	  var ch = state.current();
	  if (isSyntaxCharacter(ch)) {
	    state.lastIntValue = ch;
	    state.advance();
	    return true
	  }
	  return false
	};
	function isSyntaxCharacter(ch) {
	  return (
	    ch === 0x24 /* $ */ ||
	    ch >= 0x28 /* ( */ && ch <= 0x2B /* + */ ||
	    ch === 0x2E /* . */ ||
	    ch === 0x3F /* ? */ ||
	    ch >= 0x5B /* [ */ && ch <= 0x5E /* ^ */ ||
	    ch >= 0x7B /* { */ && ch <= 0x7D /* } */
	  )
	}

	// https://www.ecma-international.org/ecma-262/8.0/#prod-PatternCharacter
	// But eat eager.
	pp$1.regexp_eatPatternCharacters = function(state) {
	  var start = state.pos;
	  var ch = 0;
	  while ((ch = state.current()) !== -1 && !isSyntaxCharacter(ch)) {
	    state.advance();
	  }
	  return state.pos !== start
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedPatternCharacter
	pp$1.regexp_eatExtendedPatternCharacter = function(state) {
	  var ch = state.current();
	  if (
	    ch !== -1 &&
	    ch !== 0x24 /* $ */ &&
	    !(ch >= 0x28 /* ( */ && ch <= 0x2B /* + */) &&
	    ch !== 0x2E /* . */ &&
	    ch !== 0x3F /* ? */ &&
	    ch !== 0x5B /* [ */ &&
	    ch !== 0x5E /* ^ */ &&
	    ch !== 0x7C /* | */
	  ) {
	    state.advance();
	    return true
	  }
	  return false
	};

	// GroupSpecifier ::
	//   [empty]
	//   `?` GroupName
	pp$1.regexp_groupSpecifier = function(state) {
	  if (state.eat(0x3F /* ? */)) {
	    if (!this.regexp_eatGroupName(state)) { state.raise("Invalid group"); }
	    var trackDisjunction = this.options.ecmaVersion >= 16;
	    var known = state.groupNames[state.lastStringValue];
	    if (known) {
	      if (trackDisjunction) {
	        for (var i = 0, list = known; i < list.length; i += 1) {
	          var altID = list[i];

	          if (!altID.separatedFrom(state.branchID))
	            { state.raise("Duplicate capture group name"); }
	        }
	      } else {
	        state.raise("Duplicate capture group name");
	      }
	    }
	    if (trackDisjunction) {
	      (known || (state.groupNames[state.lastStringValue] = [])).push(state.branchID);
	    } else {
	      state.groupNames[state.lastStringValue] = true;
	    }
	  }
	};

	// GroupName ::
	//   `<` RegExpIdentifierName `>`
	// Note: this updates `state.lastStringValue` property with the eaten name.
	pp$1.regexp_eatGroupName = function(state) {
	  state.lastStringValue = "";
	  if (state.eat(0x3C /* < */)) {
	    if (this.regexp_eatRegExpIdentifierName(state) && state.eat(0x3E /* > */)) {
	      return true
	    }
	    state.raise("Invalid capture group name");
	  }
	  return false
	};

	// RegExpIdentifierName ::
	//   RegExpIdentifierStart
	//   RegExpIdentifierName RegExpIdentifierPart
	// Note: this updates `state.lastStringValue` property with the eaten name.
	pp$1.regexp_eatRegExpIdentifierName = function(state) {
	  state.lastStringValue = "";
	  if (this.regexp_eatRegExpIdentifierStart(state)) {
	    state.lastStringValue += codePointToString(state.lastIntValue);
	    while (this.regexp_eatRegExpIdentifierPart(state)) {
	      state.lastStringValue += codePointToString(state.lastIntValue);
	    }
	    return true
	  }
	  return false
	};

	// RegExpIdentifierStart ::
	//   UnicodeIDStart
	//   `$`
	//   `_`
	//   `\` RegExpUnicodeEscapeSequence[+U]
	pp$1.regexp_eatRegExpIdentifierStart = function(state) {
	  var start = state.pos;
	  var forceU = this.options.ecmaVersion >= 11;
	  var ch = state.current(forceU);
	  state.advance(forceU);

	  if (ch === 0x5C /* \ */ && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) {
	    ch = state.lastIntValue;
	  }
	  if (isRegExpIdentifierStart(ch)) {
	    state.lastIntValue = ch;
	    return true
	  }

	  state.pos = start;
	  return false
	};
	function isRegExpIdentifierStart(ch) {
	  return isIdentifierStart(ch, true) || ch === 0x24 /* $ */ || ch === 0x5F /* _ */
	}

	// RegExpIdentifierPart ::
	//   UnicodeIDContinue
	//   `$`
	//   `_`
	//   `\` RegExpUnicodeEscapeSequence[+U]
	//   <ZWNJ>
	//   <ZWJ>
	pp$1.regexp_eatRegExpIdentifierPart = function(state) {
	  var start = state.pos;
	  var forceU = this.options.ecmaVersion >= 11;
	  var ch = state.current(forceU);
	  state.advance(forceU);

	  if (ch === 0x5C /* \ */ && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) {
	    ch = state.lastIntValue;
	  }
	  if (isRegExpIdentifierPart(ch)) {
	    state.lastIntValue = ch;
	    return true
	  }

	  state.pos = start;
	  return false
	};
	function isRegExpIdentifierPart(ch) {
	  return isIdentifierChar(ch, true) || ch === 0x24 /* $ */ || ch === 0x5F /* _ */ || ch === 0x200C /* <ZWNJ> */ || ch === 0x200D /* <ZWJ> */
	}

	// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-AtomEscape
	pp$1.regexp_eatAtomEscape = function(state) {
	  if (
	    this.regexp_eatBackReference(state) ||
	    this.regexp_eatCharacterClassEscape(state) ||
	    this.regexp_eatCharacterEscape(state) ||
	    (state.switchN && this.regexp_eatKGroupName(state))
	  ) {
	    return true
	  }
	  if (state.switchU) {
	    // Make the same message as V8.
	    if (state.current() === 0x63 /* c */) {
	      state.raise("Invalid unicode escape");
	    }
	    state.raise("Invalid escape");
	  }
	  return false
	};
	pp$1.regexp_eatBackReference = function(state) {
	  var start = state.pos;
	  if (this.regexp_eatDecimalEscape(state)) {
	    var n = state.lastIntValue;
	    if (state.switchU) {
	      // For SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-atomescape
	      if (n > state.maxBackReference) {
	        state.maxBackReference = n;
	      }
	      return true
	    }
	    if (n <= state.numCapturingParens) {
	      return true
	    }
	    state.pos = start;
	  }
	  return false
	};
	pp$1.regexp_eatKGroupName = function(state) {
	  if (state.eat(0x6B /* k */)) {
	    if (this.regexp_eatGroupName(state)) {
	      state.backReferenceNames.push(state.lastStringValue);
	      return true
	    }
	    state.raise("Invalid named reference");
	  }
	  return false
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-CharacterEscape
	pp$1.regexp_eatCharacterEscape = function(state) {
	  return (
	    this.regexp_eatControlEscape(state) ||
	    this.regexp_eatCControlLetter(state) ||
	    this.regexp_eatZero(state) ||
	    this.regexp_eatHexEscapeSequence(state) ||
	    this.regexp_eatRegExpUnicodeEscapeSequence(state, false) ||
	    (!state.switchU && this.regexp_eatLegacyOctalEscapeSequence(state)) ||
	    this.regexp_eatIdentityEscape(state)
	  )
	};
	pp$1.regexp_eatCControlLetter = function(state) {
	  var start = state.pos;
	  if (state.eat(0x63 /* c */)) {
	    if (this.regexp_eatControlLetter(state)) {
	      return true
	    }
	    state.pos = start;
	  }
	  return false
	};
	pp$1.regexp_eatZero = function(state) {
	  if (state.current() === 0x30 /* 0 */ && !isDecimalDigit(state.lookahead())) {
	    state.lastIntValue = 0;
	    state.advance();
	    return true
	  }
	  return false
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-ControlEscape
	pp$1.regexp_eatControlEscape = function(state) {
	  var ch = state.current();
	  if (ch === 0x74 /* t */) {
	    state.lastIntValue = 0x09; /* \t */
	    state.advance();
	    return true
	  }
	  if (ch === 0x6E /* n */) {
	    state.lastIntValue = 0x0A; /* \n */
	    state.advance();
	    return true
	  }
	  if (ch === 0x76 /* v */) {
	    state.lastIntValue = 0x0B; /* \v */
	    state.advance();
	    return true
	  }
	  if (ch === 0x66 /* f */) {
	    state.lastIntValue = 0x0C; /* \f */
	    state.advance();
	    return true
	  }
	  if (ch === 0x72 /* r */) {
	    state.lastIntValue = 0x0D; /* \r */
	    state.advance();
	    return true
	  }
	  return false
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-ControlLetter
	pp$1.regexp_eatControlLetter = function(state) {
	  var ch = state.current();
	  if (isControlLetter(ch)) {
	    state.lastIntValue = ch % 0x20;
	    state.advance();
	    return true
	  }
	  return false
	};
	function isControlLetter(ch) {
	  return (
	    (ch >= 0x41 /* A */ && ch <= 0x5A /* Z */) ||
	    (ch >= 0x61 /* a */ && ch <= 0x7A /* z */)
	  )
	}

	// https://www.ecma-international.org/ecma-262/8.0/#prod-RegExpUnicodeEscapeSequence
	pp$1.regexp_eatRegExpUnicodeEscapeSequence = function(state, forceU) {
	  if ( forceU === void 0 ) forceU = false;

	  var start = state.pos;
	  var switchU = forceU || state.switchU;

	  if (state.eat(0x75 /* u */)) {
	    if (this.regexp_eatFixedHexDigits(state, 4)) {
	      var lead = state.lastIntValue;
	      if (switchU && lead >= 0xD800 && lead <= 0xDBFF) {
	        var leadSurrogateEnd = state.pos;
	        if (state.eat(0x5C /* \ */) && state.eat(0x75 /* u */) && this.regexp_eatFixedHexDigits(state, 4)) {
	          var trail = state.lastIntValue;
	          if (trail >= 0xDC00 && trail <= 0xDFFF) {
	            state.lastIntValue = (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
	            return true
	          }
	        }
	        state.pos = leadSurrogateEnd;
	        state.lastIntValue = lead;
	      }
	      return true
	    }
	    if (
	      switchU &&
	      state.eat(0x7B /* { */) &&
	      this.regexp_eatHexDigits(state) &&
	      state.eat(0x7D /* } */) &&
	      isValidUnicode(state.lastIntValue)
	    ) {
	      return true
	    }
	    if (switchU) {
	      state.raise("Invalid unicode escape");
	    }
	    state.pos = start;
	  }

	  return false
	};
	function isValidUnicode(ch) {
	  return ch >= 0 && ch <= 0x10FFFF
	}

	// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-IdentityEscape
	pp$1.regexp_eatIdentityEscape = function(state) {
	  if (state.switchU) {
	    if (this.regexp_eatSyntaxCharacter(state)) {
	      return true
	    }
	    if (state.eat(0x2F /* / */)) {
	      state.lastIntValue = 0x2F; /* / */
	      return true
	    }
	    return false
	  }

	  var ch = state.current();
	  if (ch !== 0x63 /* c */ && (!state.switchN || ch !== 0x6B /* k */)) {
	    state.lastIntValue = ch;
	    state.advance();
	    return true
	  }

	  return false
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalEscape
	pp$1.regexp_eatDecimalEscape = function(state) {
	  state.lastIntValue = 0;
	  var ch = state.current();
	  if (ch >= 0x31 /* 1 */ && ch <= 0x39 /* 9 */) {
	    do {
	      state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 /* 0 */);
	      state.advance();
	    } while ((ch = state.current()) >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */)
	    return true
	  }
	  return false
	};

	// Return values used by character set parsing methods, needed to
	// forbid negation of sets that can match strings.
	var CharSetNone = 0; // Nothing parsed
	var CharSetOk = 1; // Construct parsed, cannot contain strings
	var CharSetString = 2; // Construct parsed, can contain strings

	// https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClassEscape
	pp$1.regexp_eatCharacterClassEscape = function(state) {
	  var ch = state.current();

	  if (isCharacterClassEscape(ch)) {
	    state.lastIntValue = -1;
	    state.advance();
	    return CharSetOk
	  }

	  var negate = false;
	  if (
	    state.switchU &&
	    this.options.ecmaVersion >= 9 &&
	    ((negate = ch === 0x50 /* P */) || ch === 0x70 /* p */)
	  ) {
	    state.lastIntValue = -1;
	    state.advance();
	    var result;
	    if (
	      state.eat(0x7B /* { */) &&
	      (result = this.regexp_eatUnicodePropertyValueExpression(state)) &&
	      state.eat(0x7D /* } */)
	    ) {
	      if (negate && result === CharSetString) { state.raise("Invalid property name"); }
	      return result
	    }
	    state.raise("Invalid property name");
	  }

	  return CharSetNone
	};

	function isCharacterClassEscape(ch) {
	  return (
	    ch === 0x64 /* d */ ||
	    ch === 0x44 /* D */ ||
	    ch === 0x73 /* s */ ||
	    ch === 0x53 /* S */ ||
	    ch === 0x77 /* w */ ||
	    ch === 0x57 /* W */
	  )
	}

	// UnicodePropertyValueExpression ::
	//   UnicodePropertyName `=` UnicodePropertyValue
	//   LoneUnicodePropertyNameOrValue
	pp$1.regexp_eatUnicodePropertyValueExpression = function(state) {
	  var start = state.pos;

	  // UnicodePropertyName `=` UnicodePropertyValue
	  if (this.regexp_eatUnicodePropertyName(state) && state.eat(0x3D /* = */)) {
	    var name = state.lastStringValue;
	    if (this.regexp_eatUnicodePropertyValue(state)) {
	      var value = state.lastStringValue;
	      this.regexp_validateUnicodePropertyNameAndValue(state, name, value);
	      return CharSetOk
	    }
	  }
	  state.pos = start;

	  // LoneUnicodePropertyNameOrValue
	  if (this.regexp_eatLoneUnicodePropertyNameOrValue(state)) {
	    var nameOrValue = state.lastStringValue;
	    return this.regexp_validateUnicodePropertyNameOrValue(state, nameOrValue)
	  }
	  return CharSetNone
	};

	pp$1.regexp_validateUnicodePropertyNameAndValue = function(state, name, value) {
	  if (!hasOwn(state.unicodeProperties.nonBinary, name))
	    { state.raise("Invalid property name"); }
	  if (!state.unicodeProperties.nonBinary[name].test(value))
	    { state.raise("Invalid property value"); }
	};

	pp$1.regexp_validateUnicodePropertyNameOrValue = function(state, nameOrValue) {
	  if (state.unicodeProperties.binary.test(nameOrValue)) { return CharSetOk }
	  if (state.switchV && state.unicodeProperties.binaryOfStrings.test(nameOrValue)) { return CharSetString }
	  state.raise("Invalid property name");
	};

	// UnicodePropertyName ::
	//   UnicodePropertyNameCharacters
	pp$1.regexp_eatUnicodePropertyName = function(state) {
	  var ch = 0;
	  state.lastStringValue = "";
	  while (isUnicodePropertyNameCharacter(ch = state.current())) {
	    state.lastStringValue += codePointToString(ch);
	    state.advance();
	  }
	  return state.lastStringValue !== ""
	};

	function isUnicodePropertyNameCharacter(ch) {
	  return isControlLetter(ch) || ch === 0x5F /* _ */
	}

	// UnicodePropertyValue ::
	//   UnicodePropertyValueCharacters
	pp$1.regexp_eatUnicodePropertyValue = function(state) {
	  var ch = 0;
	  state.lastStringValue = "";
	  while (isUnicodePropertyValueCharacter(ch = state.current())) {
	    state.lastStringValue += codePointToString(ch);
	    state.advance();
	  }
	  return state.lastStringValue !== ""
	};
	function isUnicodePropertyValueCharacter(ch) {
	  return isUnicodePropertyNameCharacter(ch) || isDecimalDigit(ch)
	}

	// LoneUnicodePropertyNameOrValue ::
	//   UnicodePropertyValueCharacters
	pp$1.regexp_eatLoneUnicodePropertyNameOrValue = function(state) {
	  return this.regexp_eatUnicodePropertyValue(state)
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClass
	pp$1.regexp_eatCharacterClass = function(state) {
	  if (state.eat(0x5B /* [ */)) {
	    var negate = state.eat(0x5E /* ^ */);
	    var result = this.regexp_classContents(state);
	    if (!state.eat(0x5D /* ] */))
	      { state.raise("Unterminated character class"); }
	    if (negate && result === CharSetString)
	      { state.raise("Negated character class may contain strings"); }
	    return true
	  }
	  return false
	};

	// https://tc39.es/ecma262/#prod-ClassContents
	// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassRanges
	pp$1.regexp_classContents = function(state) {
	  if (state.current() === 0x5D /* ] */) { return CharSetOk }
	  if (state.switchV) { return this.regexp_classSetExpression(state) }
	  this.regexp_nonEmptyClassRanges(state);
	  return CharSetOk
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRanges
	// https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRangesNoDash
	pp$1.regexp_nonEmptyClassRanges = function(state) {
	  while (this.regexp_eatClassAtom(state)) {
	    var left = state.lastIntValue;
	    if (state.eat(0x2D /* - */) && this.regexp_eatClassAtom(state)) {
	      var right = state.lastIntValue;
	      if (state.switchU && (left === -1 || right === -1)) {
	        state.raise("Invalid character class");
	      }
	      if (left !== -1 && right !== -1 && left > right) {
	        state.raise("Range out of order in character class");
	      }
	    }
	  }
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtom
	// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtomNoDash
	pp$1.regexp_eatClassAtom = function(state) {
	  var start = state.pos;

	  if (state.eat(0x5C /* \ */)) {
	    if (this.regexp_eatClassEscape(state)) {
	      return true
	    }
	    if (state.switchU) {
	      // Make the same message as V8.
	      var ch$1 = state.current();
	      if (ch$1 === 0x63 /* c */ || isOctalDigit(ch$1)) {
	        state.raise("Invalid class escape");
	      }
	      state.raise("Invalid escape");
	    }
	    state.pos = start;
	  }

	  var ch = state.current();
	  if (ch !== 0x5D /* ] */) {
	    state.lastIntValue = ch;
	    state.advance();
	    return true
	  }

	  return false
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassEscape
	pp$1.regexp_eatClassEscape = function(state) {
	  var start = state.pos;

	  if (state.eat(0x62 /* b */)) {
	    state.lastIntValue = 0x08; /* <BS> */
	    return true
	  }

	  if (state.switchU && state.eat(0x2D /* - */)) {
	    state.lastIntValue = 0x2D; /* - */
	    return true
	  }

	  if (!state.switchU && state.eat(0x63 /* c */)) {
	    if (this.regexp_eatClassControlLetter(state)) {
	      return true
	    }
	    state.pos = start;
	  }

	  return (
	    this.regexp_eatCharacterClassEscape(state) ||
	    this.regexp_eatCharacterEscape(state)
	  )
	};

	// https://tc39.es/ecma262/#prod-ClassSetExpression
	// https://tc39.es/ecma262/#prod-ClassUnion
	// https://tc39.es/ecma262/#prod-ClassIntersection
	// https://tc39.es/ecma262/#prod-ClassSubtraction
	pp$1.regexp_classSetExpression = function(state) {
	  var result = CharSetOk, subResult;
	  if (this.regexp_eatClassSetRange(state)) ; else if (subResult = this.regexp_eatClassSetOperand(state)) {
	    if (subResult === CharSetString) { result = CharSetString; }
	    // https://tc39.es/ecma262/#prod-ClassIntersection
	    var start = state.pos;
	    while (state.eatChars([0x26, 0x26] /* && */)) {
	      if (
	        state.current() !== 0x26 /* & */ &&
	        (subResult = this.regexp_eatClassSetOperand(state))
	      ) {
	        if (subResult !== CharSetString) { result = CharSetOk; }
	        continue
	      }
	      state.raise("Invalid character in character class");
	    }
	    if (start !== state.pos) { return result }
	    // https://tc39.es/ecma262/#prod-ClassSubtraction
	    while (state.eatChars([0x2D, 0x2D] /* -- */)) {
	      if (this.regexp_eatClassSetOperand(state)) { continue }
	      state.raise("Invalid character in character class");
	    }
	    if (start !== state.pos) { return result }
	  } else {
	    state.raise("Invalid character in character class");
	  }
	  // https://tc39.es/ecma262/#prod-ClassUnion
	  for (;;) {
	    if (this.regexp_eatClassSetRange(state)) { continue }
	    subResult = this.regexp_eatClassSetOperand(state);
	    if (!subResult) { return result }
	    if (subResult === CharSetString) { result = CharSetString; }
	  }
	};

	// https://tc39.es/ecma262/#prod-ClassSetRange
	pp$1.regexp_eatClassSetRange = function(state) {
	  var start = state.pos;
	  if (this.regexp_eatClassSetCharacter(state)) {
	    var left = state.lastIntValue;
	    if (state.eat(0x2D /* - */) && this.regexp_eatClassSetCharacter(state)) {
	      var right = state.lastIntValue;
	      if (left !== -1 && right !== -1 && left > right) {
	        state.raise("Range out of order in character class");
	      }
	      return true
	    }
	    state.pos = start;
	  }
	  return false
	};

	// https://tc39.es/ecma262/#prod-ClassSetOperand
	pp$1.regexp_eatClassSetOperand = function(state) {
	  if (this.regexp_eatClassSetCharacter(state)) { return CharSetOk }
	  return this.regexp_eatClassStringDisjunction(state) || this.regexp_eatNestedClass(state)
	};

	// https://tc39.es/ecma262/#prod-NestedClass
	pp$1.regexp_eatNestedClass = function(state) {
	  var start = state.pos;
	  if (state.eat(0x5B /* [ */)) {
	    var negate = state.eat(0x5E /* ^ */);
	    var result = this.regexp_classContents(state);
	    if (state.eat(0x5D /* ] */)) {
	      if (negate && result === CharSetString) {
	        state.raise("Negated character class may contain strings");
	      }
	      return result
	    }
	    state.pos = start;
	  }
	  if (state.eat(0x5C /* \ */)) {
	    var result$1 = this.regexp_eatCharacterClassEscape(state);
	    if (result$1) {
	      return result$1
	    }
	    state.pos = start;
	  }
	  return null
	};

	// https://tc39.es/ecma262/#prod-ClassStringDisjunction
	pp$1.regexp_eatClassStringDisjunction = function(state) {
	  var start = state.pos;
	  if (state.eatChars([0x5C, 0x71] /* \q */)) {
	    if (state.eat(0x7B /* { */)) {
	      var result = this.regexp_classStringDisjunctionContents(state);
	      if (state.eat(0x7D /* } */)) {
	        return result
	      }
	    } else {
	      // Make the same message as V8.
	      state.raise("Invalid escape");
	    }
	    state.pos = start;
	  }
	  return null
	};

	// https://tc39.es/ecma262/#prod-ClassStringDisjunctionContents
	pp$1.regexp_classStringDisjunctionContents = function(state) {
	  var result = this.regexp_classString(state);
	  while (state.eat(0x7C /* | */)) {
	    if (this.regexp_classString(state) === CharSetString) { result = CharSetString; }
	  }
	  return result
	};

	// https://tc39.es/ecma262/#prod-ClassString
	// https://tc39.es/ecma262/#prod-NonEmptyClassString
	pp$1.regexp_classString = function(state) {
	  var count = 0;
	  while (this.regexp_eatClassSetCharacter(state)) { count++; }
	  return count === 1 ? CharSetOk : CharSetString
	};

	// https://tc39.es/ecma262/#prod-ClassSetCharacter
	pp$1.regexp_eatClassSetCharacter = function(state) {
	  var start = state.pos;
	  if (state.eat(0x5C /* \ */)) {
	    if (
	      this.regexp_eatCharacterEscape(state) ||
	      this.regexp_eatClassSetReservedPunctuator(state)
	    ) {
	      return true
	    }
	    if (state.eat(0x62 /* b */)) {
	      state.lastIntValue = 0x08; /* <BS> */
	      return true
	    }
	    state.pos = start;
	    return false
	  }
	  var ch = state.current();
	  if (ch < 0 || ch === state.lookahead() && isClassSetReservedDoublePunctuatorCharacter(ch)) { return false }
	  if (isClassSetSyntaxCharacter(ch)) { return false }
	  state.advance();
	  state.lastIntValue = ch;
	  return true
	};

	// https://tc39.es/ecma262/#prod-ClassSetReservedDoublePunctuator
	function isClassSetReservedDoublePunctuatorCharacter(ch) {
	  return (
	    ch === 0x21 /* ! */ ||
	    ch >= 0x23 /* # */ && ch <= 0x26 /* & */ ||
	    ch >= 0x2A /* * */ && ch <= 0x2C /* , */ ||
	    ch === 0x2E /* . */ ||
	    ch >= 0x3A /* : */ && ch <= 0x40 /* @ */ ||
	    ch === 0x5E /* ^ */ ||
	    ch === 0x60 /* ` */ ||
	    ch === 0x7E /* ~ */
	  )
	}

	// https://tc39.es/ecma262/#prod-ClassSetSyntaxCharacter
	function isClassSetSyntaxCharacter(ch) {
	  return (
	    ch === 0x28 /* ( */ ||
	    ch === 0x29 /* ) */ ||
	    ch === 0x2D /* - */ ||
	    ch === 0x2F /* / */ ||
	    ch >= 0x5B /* [ */ && ch <= 0x5D /* ] */ ||
	    ch >= 0x7B /* { */ && ch <= 0x7D /* } */
	  )
	}

	// https://tc39.es/ecma262/#prod-ClassSetReservedPunctuator
	pp$1.regexp_eatClassSetReservedPunctuator = function(state) {
	  var ch = state.current();
	  if (isClassSetReservedPunctuator(ch)) {
	    state.lastIntValue = ch;
	    state.advance();
	    return true
	  }
	  return false
	};

	// https://tc39.es/ecma262/#prod-ClassSetReservedPunctuator
	function isClassSetReservedPunctuator(ch) {
	  return (
	    ch === 0x21 /* ! */ ||
	    ch === 0x23 /* # */ ||
	    ch === 0x25 /* % */ ||
	    ch === 0x26 /* & */ ||
	    ch === 0x2C /* , */ ||
	    ch === 0x2D /* - */ ||
	    ch >= 0x3A /* : */ && ch <= 0x3E /* > */ ||
	    ch === 0x40 /* @ */ ||
	    ch === 0x60 /* ` */ ||
	    ch === 0x7E /* ~ */
	  )
	}

	// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassControlLetter
	pp$1.regexp_eatClassControlLetter = function(state) {
	  var ch = state.current();
	  if (isDecimalDigit(ch) || ch === 0x5F /* _ */) {
	    state.lastIntValue = ch % 0x20;
	    state.advance();
	    return true
	  }
	  return false
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
	pp$1.regexp_eatHexEscapeSequence = function(state) {
	  var start = state.pos;
	  if (state.eat(0x78 /* x */)) {
	    if (this.regexp_eatFixedHexDigits(state, 2)) {
	      return true
	    }
	    if (state.switchU) {
	      state.raise("Invalid escape");
	    }
	    state.pos = start;
	  }
	  return false
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalDigits
	pp$1.regexp_eatDecimalDigits = function(state) {
	  var start = state.pos;
	  var ch = 0;
	  state.lastIntValue = 0;
	  while (isDecimalDigit(ch = state.current())) {
	    state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 /* 0 */);
	    state.advance();
	  }
	  return state.pos !== start
	};
	function isDecimalDigit(ch) {
	  return ch >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */
	}

	// https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigits
	pp$1.regexp_eatHexDigits = function(state) {
	  var start = state.pos;
	  var ch = 0;
	  state.lastIntValue = 0;
	  while (isHexDigit(ch = state.current())) {
	    state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
	    state.advance();
	  }
	  return state.pos !== start
	};
	function isHexDigit(ch) {
	  return (
	    (ch >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */) ||
	    (ch >= 0x41 /* A */ && ch <= 0x46 /* F */) ||
	    (ch >= 0x61 /* a */ && ch <= 0x66 /* f */)
	  )
	}
	function hexToInt(ch) {
	  if (ch >= 0x41 /* A */ && ch <= 0x46 /* F */) {
	    return 10 + (ch - 0x41 /* A */)
	  }
	  if (ch >= 0x61 /* a */ && ch <= 0x66 /* f */) {
	    return 10 + (ch - 0x61 /* a */)
	  }
	  return ch - 0x30 /* 0 */
	}

	// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-LegacyOctalEscapeSequence
	// Allows only 0-377(octal) i.e. 0-255(decimal).
	pp$1.regexp_eatLegacyOctalEscapeSequence = function(state) {
	  if (this.regexp_eatOctalDigit(state)) {
	    var n1 = state.lastIntValue;
	    if (this.regexp_eatOctalDigit(state)) {
	      var n2 = state.lastIntValue;
	      if (n1 <= 3 && this.regexp_eatOctalDigit(state)) {
	        state.lastIntValue = n1 * 64 + n2 * 8 + state.lastIntValue;
	      } else {
	        state.lastIntValue = n1 * 8 + n2;
	      }
	    } else {
	      state.lastIntValue = n1;
	    }
	    return true
	  }
	  return false
	};

	// https://www.ecma-international.org/ecma-262/8.0/#prod-OctalDigit
	pp$1.regexp_eatOctalDigit = function(state) {
	  var ch = state.current();
	  if (isOctalDigit(ch)) {
	    state.lastIntValue = ch - 0x30; /* 0 */
	    state.advance();
	    return true
	  }
	  state.lastIntValue = 0;
	  return false
	};
	function isOctalDigit(ch) {
	  return ch >= 0x30 /* 0 */ && ch <= 0x37 /* 7 */
	}

	// https://www.ecma-international.org/ecma-262/8.0/#prod-Hex4Digits
	// https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigit
	// And HexDigit HexDigit in https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
	pp$1.regexp_eatFixedHexDigits = function(state, length) {
	  var start = state.pos;
	  state.lastIntValue = 0;
	  for (var i = 0; i < length; ++i) {
	    var ch = state.current();
	    if (!isHexDigit(ch)) {
	      state.pos = start;
	      return false
	    }
	    state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
	    state.advance();
	  }
	  return true
	};

	// Object type used to represent tokens. Note that normally, tokens
	// simply exist as properties on the parser object. This is only
	// used for the onToken callback and the external tokenizer.

	var Token = function Token(p) {
	  this.type = p.type;
	  this.value = p.value;
	  this.start = p.start;
	  this.end = p.end;
	  if (p.options.locations)
	    { this.loc = new SourceLocation(p, p.startLoc, p.endLoc); }
	  if (p.options.ranges)
	    { this.range = [p.start, p.end]; }
	};

	// ## Tokenizer

	var pp = Parser.prototype;

	// Move to the next token

	pp.next = function(ignoreEscapeSequenceInKeyword) {
	  if (!ignoreEscapeSequenceInKeyword && this.type.keyword && this.containsEsc)
	    { this.raiseRecoverable(this.start, "Escape sequence in keyword " + this.type.keyword); }
	  if (this.options.onToken)
	    { this.options.onToken(new Token(this)); }

	  this.lastTokEnd = this.end;
	  this.lastTokStart = this.start;
	  this.lastTokEndLoc = this.endLoc;
	  this.lastTokStartLoc = this.startLoc;
	  this.nextToken();
	};

	pp.getToken = function() {
	  this.next();
	  return new Token(this)
	};

	// If we're in an ES6 environment, make parsers iterable
	if (typeof Symbol !== "undefined")
	  { pp[Symbol.iterator] = function() {
	    var this$1$1 = this;

	    return {
	      next: function () {
	        var token = this$1$1.getToken();
	        return {
	          done: token.type === types$1.eof,
	          value: token
	        }
	      }
	    }
	  }; }

	// Toggle strict mode. Re-reads the next number or string to please
	// pedantic tests (`"use strict"; 010;` should fail).

	// Read a single token, updating the parser object's token-related
	// properties.

	pp.nextToken = function() {
	  var curContext = this.curContext();
	  if (!curContext || !curContext.preserveSpace) { this.skipSpace(); }

	  this.start = this.pos;
	  if (this.options.locations) { this.startLoc = this.curPosition(); }
	  if (this.pos >= this.input.length) { return this.finishToken(types$1.eof) }

	  if (curContext.override) { return curContext.override(this) }
	  else { this.readToken(this.fullCharCodeAtPos()); }
	};

	pp.readToken = function(code) {
	  // Identifier or keyword. '\uXXXX' sequences are allowed in
	  // identifiers, so '\' also dispatches to that.
	  if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */)
	    { return this.readWord() }

	  return this.getTokenFromCode(code)
	};

	pp.fullCharCodeAt = function(pos) {
	  var code = this.input.charCodeAt(pos);
	  if (code <= 0xd7ff || code >= 0xdc00) { return code }
	  var next = this.input.charCodeAt(pos + 1);
	  return next <= 0xdbff || next >= 0xe000 ? code : (code << 10) + next - 0x35fdc00
	};

	pp.fullCharCodeAtPos = function() {
	  return this.fullCharCodeAt(this.pos)
	};

	pp.skipBlockComment = function() {
	  var startLoc = this.options.onComment && this.curPosition();
	  var start = this.pos, end = this.input.indexOf("*/", this.pos += 2);
	  if (end === -1) { this.raise(this.pos - 2, "Unterminated comment"); }
	  this.pos = end + 2;
	  if (this.options.locations) {
	    for (var nextBreak = (void 0), pos = start; (nextBreak = nextLineBreak(this.input, pos, this.pos)) > -1;) {
	      ++this.curLine;
	      pos = this.lineStart = nextBreak;
	    }
	  }
	  if (this.options.onComment)
	    { this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos,
	                           startLoc, this.curPosition()); }
	};

	pp.skipLineComment = function(startSkip) {
	  var start = this.pos;
	  var startLoc = this.options.onComment && this.curPosition();
	  var ch = this.input.charCodeAt(this.pos += startSkip);
	  while (this.pos < this.input.length && !isNewLine(ch)) {
	    ch = this.input.charCodeAt(++this.pos);
	  }
	  if (this.options.onComment)
	    { this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos,
	                           startLoc, this.curPosition()); }
	};

	// Called at the start of the parse and after every token. Skips
	// whitespace and comments, and.

	pp.skipSpace = function() {
	  loop: while (this.pos < this.input.length) {
	    var ch = this.input.charCodeAt(this.pos);
	    switch (ch) {
	    case 32: case 160: // ' '
	      ++this.pos;
	      break
	    case 13:
	      if (this.input.charCodeAt(this.pos + 1) === 10) {
	        ++this.pos;
	      }
	    case 10: case 8232: case 8233:
	      ++this.pos;
	      if (this.options.locations) {
	        ++this.curLine;
	        this.lineStart = this.pos;
	      }
	      break
	    case 47: // '/'
	      switch (this.input.charCodeAt(this.pos + 1)) {
	      case 42: // '*'
	        this.skipBlockComment();
	        break
	      case 47:
	        this.skipLineComment(2);
	        break
	      default:
	        break loop
	      }
	      break
	    default:
	      if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
	        ++this.pos;
	      } else {
	        break loop
	      }
	    }
	  }
	};

	// Called at the end of every token. Sets `end`, `val`, and
	// maintains `context` and `exprAllowed`, and skips the space after
	// the token, so that the next one's `start` will point at the
	// right position.

	pp.finishToken = function(type, val) {
	  this.end = this.pos;
	  if (this.options.locations) { this.endLoc = this.curPosition(); }
	  var prevType = this.type;
	  this.type = type;
	  this.value = val;

	  this.updateContext(prevType);
	};

	// ### Token reading

	// This is the function that is called to fetch the next token. It
	// is somewhat obscure, because it works in character codes rather
	// than characters, and because operator parsing has been inlined
	// into it.
	//
	// All in the name of speed.
	//
	pp.readToken_dot = function() {
	  var next = this.input.charCodeAt(this.pos + 1);
	  if (next >= 48 && next <= 57) { return this.readNumber(true) }
	  var next2 = this.input.charCodeAt(this.pos + 2);
	  if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) { // 46 = dot '.'
	    this.pos += 3;
	    return this.finishToken(types$1.ellipsis)
	  } else {
	    ++this.pos;
	    return this.finishToken(types$1.dot)
	  }
	};

	pp.readToken_slash = function() { // '/'
	  var next = this.input.charCodeAt(this.pos + 1);
	  if (this.exprAllowed) { ++this.pos; return this.readRegexp() }
	  if (next === 61) { return this.finishOp(types$1.assign, 2) }
	  return this.finishOp(types$1.slash, 1)
	};

	pp.readToken_mult_modulo_exp = function(code) { // '%*'
	  var next = this.input.charCodeAt(this.pos + 1);
	  var size = 1;
	  var tokentype = code === 42 ? types$1.star : types$1.modulo;

	  // exponentiation operator ** and **=
	  if (this.options.ecmaVersion >= 7 && code === 42 && next === 42) {
	    ++size;
	    tokentype = types$1.starstar;
	    next = this.input.charCodeAt(this.pos + 2);
	  }

	  if (next === 61) { return this.finishOp(types$1.assign, size + 1) }
	  return this.finishOp(tokentype, size)
	};

	pp.readToken_pipe_amp = function(code) { // '|&'
	  var next = this.input.charCodeAt(this.pos + 1);
	  if (next === code) {
	    if (this.options.ecmaVersion >= 12) {
	      var next2 = this.input.charCodeAt(this.pos + 2);
	      if (next2 === 61) { return this.finishOp(types$1.assign, 3) }
	    }
	    return this.finishOp(code === 124 ? types$1.logicalOR : types$1.logicalAND, 2)
	  }
	  if (next === 61) { return this.finishOp(types$1.assign, 2) }
	  return this.finishOp(code === 124 ? types$1.bitwiseOR : types$1.bitwiseAND, 1)
	};

	pp.readToken_caret = function() { // '^'
	  var next = this.input.charCodeAt(this.pos + 1);
	  if (next === 61) { return this.finishOp(types$1.assign, 2) }
	  return this.finishOp(types$1.bitwiseXOR, 1)
	};

	pp.readToken_plus_min = function(code) { // '+-'
	  var next = this.input.charCodeAt(this.pos + 1);
	  if (next === code) {
	    if (next === 45 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 62 &&
	        (this.lastTokEnd === 0 || lineBreak.test(this.input.slice(this.lastTokEnd, this.pos)))) {
	      // A `-->` line comment
	      this.skipLineComment(3);
	      this.skipSpace();
	      return this.nextToken()
	    }
	    return this.finishOp(types$1.incDec, 2)
	  }
	  if (next === 61) { return this.finishOp(types$1.assign, 2) }
	  return this.finishOp(types$1.plusMin, 1)
	};

	pp.readToken_lt_gt = function(code) { // '<>'
	  var next = this.input.charCodeAt(this.pos + 1);
	  var size = 1;
	  if (next === code) {
	    size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
	    if (this.input.charCodeAt(this.pos + size) === 61) { return this.finishOp(types$1.assign, size + 1) }
	    return this.finishOp(types$1.bitShift, size)
	  }
	  if (next === 33 && code === 60 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 45 &&
	      this.input.charCodeAt(this.pos + 3) === 45) {
	    // `<!--`, an XML-style comment that should be interpreted as a line comment
	    this.skipLineComment(4);
	    this.skipSpace();
	    return this.nextToken()
	  }
	  if (next === 61) { size = 2; }
	  return this.finishOp(types$1.relational, size)
	};

	pp.readToken_eq_excl = function(code) { // '=!'
	  var next = this.input.charCodeAt(this.pos + 1);
	  if (next === 61) { return this.finishOp(types$1.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2) }
	  if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) { // '=>'
	    this.pos += 2;
	    return this.finishToken(types$1.arrow)
	  }
	  return this.finishOp(code === 61 ? types$1.eq : types$1.prefix, 1)
	};

	pp.readToken_question = function() { // '?'
	  var ecmaVersion = this.options.ecmaVersion;
	  if (ecmaVersion >= 11) {
	    var next = this.input.charCodeAt(this.pos + 1);
	    if (next === 46) {
	      var next2 = this.input.charCodeAt(this.pos + 2);
	      if (next2 < 48 || next2 > 57) { return this.finishOp(types$1.questionDot, 2) }
	    }
	    if (next === 63) {
	      if (ecmaVersion >= 12) {
	        var next2$1 = this.input.charCodeAt(this.pos + 2);
	        if (next2$1 === 61) { return this.finishOp(types$1.assign, 3) }
	      }
	      return this.finishOp(types$1.coalesce, 2)
	    }
	  }
	  return this.finishOp(types$1.question, 1)
	};

	pp.readToken_numberSign = function() { // '#'
	  var ecmaVersion = this.options.ecmaVersion;
	  var code = 35; // '#'
	  if (ecmaVersion >= 13) {
	    ++this.pos;
	    code = this.fullCharCodeAtPos();
	    if (isIdentifierStart(code, true) || code === 92 /* '\' */) {
	      return this.finishToken(types$1.privateId, this.readWord1())
	    }
	  }

	  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
	};

	pp.getTokenFromCode = function(code) {
	  switch (code) {
	  // The interpretation of a dot depends on whether it is followed
	  // by a digit or another two dots.
	  case 46: // '.'
	    return this.readToken_dot()

	  // Punctuation tokens.
	  case 40: ++this.pos; return this.finishToken(types$1.parenL)
	  case 41: ++this.pos; return this.finishToken(types$1.parenR)
	  case 59: ++this.pos; return this.finishToken(types$1.semi)
	  case 44: ++this.pos; return this.finishToken(types$1.comma)
	  case 91: ++this.pos; return this.finishToken(types$1.bracketL)
	  case 93: ++this.pos; return this.finishToken(types$1.bracketR)
	  case 123: ++this.pos; return this.finishToken(types$1.braceL)
	  case 125: ++this.pos; return this.finishToken(types$1.braceR)
	  case 58: ++this.pos; return this.finishToken(types$1.colon)

	  case 96: // '`'
	    if (this.options.ecmaVersion < 6) { break }
	    ++this.pos;
	    return this.finishToken(types$1.backQuote)

	  case 48: // '0'
	    var next = this.input.charCodeAt(this.pos + 1);
	    if (next === 120 || next === 88) { return this.readRadixNumber(16) } // '0x', '0X' - hex number
	    if (this.options.ecmaVersion >= 6) {
	      if (next === 111 || next === 79) { return this.readRadixNumber(8) } // '0o', '0O' - octal number
	      if (next === 98 || next === 66) { return this.readRadixNumber(2) } // '0b', '0B' - binary number
	    }

	  // Anything else beginning with a digit is an integer, octal
	  // number, or float.
	  case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
	    return this.readNumber(false)

	  // Quotes produce strings.
	  case 34: case 39: // '"', "'"
	    return this.readString(code)

	  // Operators are parsed inline in tiny state machines. '=' (61) is
	  // often referred to. `finishOp` simply skips the amount of
	  // characters it is given as second argument, and returns a token
	  // of the type given by its first argument.
	  case 47: // '/'
	    return this.readToken_slash()

	  case 37: case 42: // '%*'
	    return this.readToken_mult_modulo_exp(code)

	  case 124: case 38: // '|&'
	    return this.readToken_pipe_amp(code)

	  case 94: // '^'
	    return this.readToken_caret()

	  case 43: case 45: // '+-'
	    return this.readToken_plus_min(code)

	  case 60: case 62: // '<>'
	    return this.readToken_lt_gt(code)

	  case 61: case 33: // '=!'
	    return this.readToken_eq_excl(code)

	  case 63: // '?'
	    return this.readToken_question()

	  case 126: // '~'
	    return this.finishOp(types$1.prefix, 1)

	  case 35: // '#'
	    return this.readToken_numberSign()
	  }

	  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
	};

	pp.finishOp = function(type, size) {
	  var str = this.input.slice(this.pos, this.pos + size);
	  this.pos += size;
	  return this.finishToken(type, str)
	};

	pp.readRegexp = function() {
	  var escaped, inClass, start = this.pos;
	  for (;;) {
	    if (this.pos >= this.input.length) { this.raise(start, "Unterminated regular expression"); }
	    var ch = this.input.charAt(this.pos);
	    if (lineBreak.test(ch)) { this.raise(start, "Unterminated regular expression"); }
	    if (!escaped) {
	      if (ch === "[") { inClass = true; }
	      else if (ch === "]" && inClass) { inClass = false; }
	      else if (ch === "/" && !inClass) { break }
	      escaped = ch === "\\";
	    } else { escaped = false; }
	    ++this.pos;
	  }
	  var pattern = this.input.slice(start, this.pos);
	  ++this.pos;
	  var flagsStart = this.pos;
	  var flags = this.readWord1();
	  if (this.containsEsc) { this.unexpected(flagsStart); }

	  // Validate pattern
	  var state = this.regexpState || (this.regexpState = new RegExpValidationState(this));
	  state.reset(start, pattern, flags);
	  this.validateRegExpFlags(state);
	  this.validateRegExpPattern(state);

	  // Create Literal#value property value.
	  var value = null;
	  try {
	    value = new RegExp(pattern, flags);
	  } catch (e) {
	    // ESTree requires null if it failed to instantiate RegExp object.
	    // https://github.com/estree/estree/blob/a27003adf4fd7bfad44de9cef372a2eacd527b1c/es5.md#regexpliteral
	  }

	  return this.finishToken(types$1.regexp, {pattern: pattern, flags: flags, value: value})
	};

	// Read an integer in the given radix. Return null if zero digits
	// were read, the integer value otherwise. When `len` is given, this
	// will return `null` unless the integer has exactly `len` digits.

	pp.readInt = function(radix, len, maybeLegacyOctalNumericLiteral) {
	  // `len` is used for character escape sequences. In that case, disallow separators.
	  var allowSeparators = this.options.ecmaVersion >= 12 && len === undefined;

	  // `maybeLegacyOctalNumericLiteral` is true if it doesn't have prefix (0x,0o,0b)
	  // and isn't fraction part nor exponent part. In that case, if the first digit
	  // is zero then disallow separators.
	  var isLegacyOctalNumericLiteral = maybeLegacyOctalNumericLiteral && this.input.charCodeAt(this.pos) === 48;

	  var start = this.pos, total = 0, lastCode = 0;
	  for (var i = 0, e = len == null ? Infinity : len; i < e; ++i, ++this.pos) {
	    var code = this.input.charCodeAt(this.pos), val = (void 0);

	    if (allowSeparators && code === 95) {
	      if (isLegacyOctalNumericLiteral) { this.raiseRecoverable(this.pos, "Numeric separator is not allowed in legacy octal numeric literals"); }
	      if (lastCode === 95) { this.raiseRecoverable(this.pos, "Numeric separator must be exactly one underscore"); }
	      if (i === 0) { this.raiseRecoverable(this.pos, "Numeric separator is not allowed at the first of digits"); }
	      lastCode = code;
	      continue
	    }

	    if (code >= 97) { val = code - 97 + 10; } // a
	    else if (code >= 65) { val = code - 65 + 10; } // A
	    else if (code >= 48 && code <= 57) { val = code - 48; } // 0-9
	    else { val = Infinity; }
	    if (val >= radix) { break }
	    lastCode = code;
	    total = total * radix + val;
	  }

	  if (allowSeparators && lastCode === 95) { this.raiseRecoverable(this.pos - 1, "Numeric separator is not allowed at the last of digits"); }
	  if (this.pos === start || len != null && this.pos - start !== len) { return null }

	  return total
	};

	function stringToNumber(str, isLegacyOctalNumericLiteral) {
	  if (isLegacyOctalNumericLiteral) {
	    return parseInt(str, 8)
	  }

	  // `parseFloat(value)` stops parsing at the first numeric separator then returns a wrong value.
	  return parseFloat(str.replace(/_/g, ""))
	}

	function stringToBigInt(str) {
	  if (typeof BigInt !== "function") {
	    return null
	  }

	  // `BigInt(value)` throws syntax error if the string contains numeric separators.
	  return BigInt(str.replace(/_/g, ""))
	}

	pp.readRadixNumber = function(radix) {
	  var start = this.pos;
	  this.pos += 2; // 0x
	  var val = this.readInt(radix);
	  if (val == null) { this.raise(this.start + 2, "Expected number in radix " + radix); }
	  if (this.options.ecmaVersion >= 11 && this.input.charCodeAt(this.pos) === 110) {
	    val = stringToBigInt(this.input.slice(start, this.pos));
	    ++this.pos;
	  } else if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }
	  return this.finishToken(types$1.num, val)
	};

	// Read an integer, octal integer, or floating-point number.

	pp.readNumber = function(startsWithDot) {
	  var start = this.pos;
	  if (!startsWithDot && this.readInt(10, undefined, true) === null) { this.raise(start, "Invalid number"); }
	  var octal = this.pos - start >= 2 && this.input.charCodeAt(start) === 48;
	  if (octal && this.strict) { this.raise(start, "Invalid number"); }
	  var next = this.input.charCodeAt(this.pos);
	  if (!octal && !startsWithDot && this.options.ecmaVersion >= 11 && next === 110) {
	    var val$1 = stringToBigInt(this.input.slice(start, this.pos));
	    ++this.pos;
	    if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }
	    return this.finishToken(types$1.num, val$1)
	  }
	  if (octal && /[89]/.test(this.input.slice(start, this.pos))) { octal = false; }
	  if (next === 46 && !octal) { // '.'
	    ++this.pos;
	    this.readInt(10);
	    next = this.input.charCodeAt(this.pos);
	  }
	  if ((next === 69 || next === 101) && !octal) { // 'eE'
	    next = this.input.charCodeAt(++this.pos);
	    if (next === 43 || next === 45) { ++this.pos; } // '+-'
	    if (this.readInt(10) === null) { this.raise(start, "Invalid number"); }
	  }
	  if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }

	  var val = stringToNumber(this.input.slice(start, this.pos), octal);
	  return this.finishToken(types$1.num, val)
	};

	// Read a string value, interpreting backslash-escapes.

	pp.readCodePoint = function() {
	  var ch = this.input.charCodeAt(this.pos), code;

	  if (ch === 123) { // '{'
	    if (this.options.ecmaVersion < 6) { this.unexpected(); }
	    var codePos = ++this.pos;
	    code = this.readHexChar(this.input.indexOf("}", this.pos) - this.pos);
	    ++this.pos;
	    if (code > 0x10FFFF) { this.invalidStringToken(codePos, "Code point out of bounds"); }
	  } else {
	    code = this.readHexChar(4);
	  }
	  return code
	};

	pp.readString = function(quote) {
	  var out = "", chunkStart = ++this.pos;
	  for (;;) {
	    if (this.pos >= this.input.length) { this.raise(this.start, "Unterminated string constant"); }
	    var ch = this.input.charCodeAt(this.pos);
	    if (ch === quote) { break }
	    if (ch === 92) { // '\'
	      out += this.input.slice(chunkStart, this.pos);
	      out += this.readEscapedChar(false);
	      chunkStart = this.pos;
	    } else if (ch === 0x2028 || ch === 0x2029) {
	      if (this.options.ecmaVersion < 10) { this.raise(this.start, "Unterminated string constant"); }
	      ++this.pos;
	      if (this.options.locations) {
	        this.curLine++;
	        this.lineStart = this.pos;
	      }
	    } else {
	      if (isNewLine(ch)) { this.raise(this.start, "Unterminated string constant"); }
	      ++this.pos;
	    }
	  }
	  out += this.input.slice(chunkStart, this.pos++);
	  return this.finishToken(types$1.string, out)
	};

	// Reads template string tokens.

	var INVALID_TEMPLATE_ESCAPE_ERROR = {};

	pp.tryReadTemplateToken = function() {
	  this.inTemplateElement = true;
	  try {
	    this.readTmplToken();
	  } catch (err) {
	    if (err === INVALID_TEMPLATE_ESCAPE_ERROR) {
	      this.readInvalidTemplateToken();
	    } else {
	      throw err
	    }
	  }

	  this.inTemplateElement = false;
	};

	pp.invalidStringToken = function(position, message) {
	  if (this.inTemplateElement && this.options.ecmaVersion >= 9) {
	    throw INVALID_TEMPLATE_ESCAPE_ERROR
	  } else {
	    this.raise(position, message);
	  }
	};

	pp.readTmplToken = function() {
	  var out = "", chunkStart = this.pos;
	  for (;;) {
	    if (this.pos >= this.input.length) { this.raise(this.start, "Unterminated template"); }
	    var ch = this.input.charCodeAt(this.pos);
	    if (ch === 96 || ch === 36 && this.input.charCodeAt(this.pos + 1) === 123) { // '`', '${'
	      if (this.pos === this.start && (this.type === types$1.template || this.type === types$1.invalidTemplate)) {
	        if (ch === 36) {
	          this.pos += 2;
	          return this.finishToken(types$1.dollarBraceL)
	        } else {
	          ++this.pos;
	          return this.finishToken(types$1.backQuote)
	        }
	      }
	      out += this.input.slice(chunkStart, this.pos);
	      return this.finishToken(types$1.template, out)
	    }
	    if (ch === 92) { // '\'
	      out += this.input.slice(chunkStart, this.pos);
	      out += this.readEscapedChar(true);
	      chunkStart = this.pos;
	    } else if (isNewLine(ch)) {
	      out += this.input.slice(chunkStart, this.pos);
	      ++this.pos;
	      switch (ch) {
	      case 13:
	        if (this.input.charCodeAt(this.pos) === 10) { ++this.pos; }
	      case 10:
	        out += "\n";
	        break
	      default:
	        out += String.fromCharCode(ch);
	        break
	      }
	      if (this.options.locations) {
	        ++this.curLine;
	        this.lineStart = this.pos;
	      }
	      chunkStart = this.pos;
	    } else {
	      ++this.pos;
	    }
	  }
	};

	// Reads a template token to search for the end, without validating any escape sequences
	pp.readInvalidTemplateToken = function() {
	  for (; this.pos < this.input.length; this.pos++) {
	    switch (this.input[this.pos]) {
	    case "\\":
	      ++this.pos;
	      break

	    case "$":
	      if (this.input[this.pos + 1] !== "{") { break }
	      // fall through
	    case "`":
	      return this.finishToken(types$1.invalidTemplate, this.input.slice(this.start, this.pos))

	    case "\r":
	      if (this.input[this.pos + 1] === "\n") { ++this.pos; }
	      // fall through
	    case "\n": case "\u2028": case "\u2029":
	      ++this.curLine;
	      this.lineStart = this.pos + 1;
	      break
	    }
	  }
	  this.raise(this.start, "Unterminated template");
	};

	// Used to read escaped characters

	pp.readEscapedChar = function(inTemplate) {
	  var ch = this.input.charCodeAt(++this.pos);
	  ++this.pos;
	  switch (ch) {
	  case 110: return "\n" // 'n' -> '\n'
	  case 114: return "\r" // 'r' -> '\r'
	  case 120: return String.fromCharCode(this.readHexChar(2)) // 'x'
	  case 117: return codePointToString(this.readCodePoint()) // 'u'
	  case 116: return "\t" // 't' -> '\t'
	  case 98: return "\b" // 'b' -> '\b'
	  case 118: return "\u000b" // 'v' -> '\u000b'
	  case 102: return "\f" // 'f' -> '\f'
	  case 13: if (this.input.charCodeAt(this.pos) === 10) { ++this.pos; } // '\r\n'
	  case 10: // ' \n'
	    if (this.options.locations) { this.lineStart = this.pos; ++this.curLine; }
	    return ""
	  case 56:
	  case 57:
	    if (this.strict) {
	      this.invalidStringToken(
	        this.pos - 1,
	        "Invalid escape sequence"
	      );
	    }
	    if (inTemplate) {
	      var codePos = this.pos - 1;

	      this.invalidStringToken(
	        codePos,
	        "Invalid escape sequence in template string"
	      );
	    }
	  default:
	    if (ch >= 48 && ch <= 55) {
	      var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
	      var octal = parseInt(octalStr, 8);
	      if (octal > 255) {
	        octalStr = octalStr.slice(0, -1);
	        octal = parseInt(octalStr, 8);
	      }
	      this.pos += octalStr.length - 1;
	      ch = this.input.charCodeAt(this.pos);
	      if ((octalStr !== "0" || ch === 56 || ch === 57) && (this.strict || inTemplate)) {
	        this.invalidStringToken(
	          this.pos - 1 - octalStr.length,
	          inTemplate
	            ? "Octal literal in template string"
	            : "Octal literal in strict mode"
	        );
	      }
	      return String.fromCharCode(octal)
	    }
	    if (isNewLine(ch)) {
	      // Unicode new line characters after \ get removed from output in both
	      // template literals and strings
	      if (this.options.locations) { this.lineStart = this.pos; ++this.curLine; }
	      return ""
	    }
	    return String.fromCharCode(ch)
	  }
	};

	// Used to read character escape sequences ('\x', '\u', '\U').

	pp.readHexChar = function(len) {
	  var codePos = this.pos;
	  var n = this.readInt(16, len);
	  if (n === null) { this.invalidStringToken(codePos, "Bad character escape sequence"); }
	  return n
	};

	// Read an identifier, and return it as a string. Sets `this.containsEsc`
	// to whether the word contained a '\u' escape.
	//
	// Incrementally adds only escaped chars, adding other chunks as-is
	// as a micro-optimization.

	pp.readWord1 = function() {
	  this.containsEsc = false;
	  var word = "", first = true, chunkStart = this.pos;
	  var astral = this.options.ecmaVersion >= 6;
	  while (this.pos < this.input.length) {
	    var ch = this.fullCharCodeAtPos();
	    if (isIdentifierChar(ch, astral)) {
	      this.pos += ch <= 0xffff ? 1 : 2;
	    } else if (ch === 92) { // "\"
	      this.containsEsc = true;
	      word += this.input.slice(chunkStart, this.pos);
	      var escStart = this.pos;
	      if (this.input.charCodeAt(++this.pos) !== 117) // "u"
	        { this.invalidStringToken(this.pos, "Expecting Unicode escape sequence \\uXXXX"); }
	      ++this.pos;
	      var esc = this.readCodePoint();
	      if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral))
	        { this.invalidStringToken(escStart, "Invalid Unicode escape"); }
	      word += codePointToString(esc);
	      chunkStart = this.pos;
	    } else {
	      break
	    }
	    first = false;
	  }
	  return word + this.input.slice(chunkStart, this.pos)
	};

	// Read an identifier or keyword token. Will check for reserved
	// words when necessary.

	pp.readWord = function() {
	  var word = this.readWord1();
	  var type = types$1.name;
	  if (this.keywords.test(word)) {
	    type = keywords[word];
	  }
	  return this.finishToken(type, word)
	};

	// Acorn is a tiny, fast JavaScript parser written in JavaScript.
	//
	// Acorn was written by Marijn Haverbeke, Ingvar Stepanyan, and
	// various contributors and released under an MIT license.
	//
	// Git repositories for Acorn are available at
	//
	//     http://marijnhaverbeke.nl/git/acorn
	//     https://github.com/acornjs/acorn.git
	//
	// Please use the [github bug tracker][ghbt] to report issues.
	//
	// [ghbt]: https://github.com/acornjs/acorn/issues


	var version = "8.18.0";

	Parser.acorn = {
	  Parser: Parser,
	  version: version,
	  defaultOptions: defaultOptions,
	  Position: Position,
	  SourceLocation: SourceLocation,
	  getLineInfo: getLineInfo,
	  Node: Node,
	  TokenType: TokenType,
	  tokTypes: types$1,
	  keywordTypes: keywords,
	  TokContext: TokContext,
	  tokContexts: types,
	  isIdentifierChar: isIdentifierChar,
	  isIdentifierStart: isIdentifierStart,
	  Token: Token,
	  isNewLine: isNewLine,
	  lineBreak: lineBreak,
	  lineBreakG: lineBreakG,
	  nonASCIIwhitespace: nonASCIIwhitespace
	};

	// Astring is a tiny and fast JavaScript code generator from an ESTree-compliant AST.
	//
	// Astring was written by David Bonnet and released under an MIT license.
	//
	// The Git repository for Astring is available at:
	// https://github.com/davidbonnet/astring.git
	//
	// Please use the GitHub bug tracker to report issues:
	// https://github.com/davidbonnet/astring/issues

	const { stringify } = JSON;

	/* c8 ignore if */
	if (!String.prototype.repeat) {
	  /* c8 ignore next */
	  throw new Error(
	    'String.prototype.repeat is undefined, see https://github.com/davidbonnet/astring#installation',
	  )
	}

	/* c8 ignore if */
	if (!String.prototype.endsWith) {
	  /* c8 ignore next */
	  throw new Error(
	    'String.prototype.endsWith is undefined, see https://github.com/davidbonnet/astring#installation',
	  )
	}

	const OPERATOR_PRECEDENCE = {
	  '||': 2,
	  '??': 3,
	  '&&': 4,
	  '|': 5,
	  '^': 6,
	  '&': 7,
	  '==': 8,
	  '!=': 8,
	  '===': 8,
	  '!==': 8,
	  '<': 9,
	  '>': 9,
	  '<=': 9,
	  '>=': 9,
	  in: 9,
	  instanceof: 9,
	  '<<': 10,
	  '>>': 10,
	  '>>>': 10,
	  '+': 11,
	  '-': 11,
	  '*': 12,
	  '%': 12,
	  '/': 12,
	  '**': 13,
	};

	// Enables parenthesis regardless of precedence
	const NEEDS_PARENTHESES = 17;

	const EXPRESSIONS_PRECEDENCE = {
	  // Definitions
	  ArrayExpression: 20,
	  TaggedTemplateExpression: 20,
	  ThisExpression: 20,
	  Identifier: 20,
	  PrivateIdentifier: 20,
	  Literal: 18,
	  TemplateLiteral: 20,
	  Super: 20,
	  SequenceExpression: 20,
	  // Operations
	  MemberExpression: 19,
	  ChainExpression: 19,
	  CallExpression: 19,
	  NewExpression: 19,
	  // Other definitions
	  ArrowFunctionExpression: NEEDS_PARENTHESES,
	  ClassExpression: NEEDS_PARENTHESES,
	  FunctionExpression: NEEDS_PARENTHESES,
	  ObjectExpression: NEEDS_PARENTHESES,
	  // Other operations
	  UpdateExpression: 16,
	  UnaryExpression: 15,
	  AwaitExpression: 15,
	  BinaryExpression: 14,
	  LogicalExpression: 13,
	  ConditionalExpression: 4,
	  AssignmentExpression: 3,
	  YieldExpression: 2,
	  RestElement: 1,
	};

	function formatSequence(state, nodes) {
	  /*
	  Writes into `state` a sequence of `nodes`.
	  */
	  const { generator } = state;
	  state.write('(');
	  if (nodes != null && nodes.length > 0) {
	    generator[nodes[0].type](nodes[0], state);
	    const { length } = nodes;
	    for (let i = 1; i < length; i++) {
	      const param = nodes[i];
	      state.write(', ');
	      generator[param.type](param, state);
	    }
	  }
	  state.write(')');
	}

	function expressionNeedsParenthesis(state, node, parentNode, isRightHand) {
	  const nodePrecedence = state.expressionsPrecedence[node.type];
	  if (nodePrecedence === NEEDS_PARENTHESES) {
	    return true
	  }
	  const parentNodePrecedence = state.expressionsPrecedence[parentNode.type];
	  if (nodePrecedence !== parentNodePrecedence) {
	    // Different node types
	    return (
	      (!isRightHand &&
	        nodePrecedence === 15 &&
	        parentNodePrecedence === 14 &&
	        parentNode.operator === '**') ||
	      nodePrecedence < parentNodePrecedence
	    )
	  }
	  if (nodePrecedence !== 13 && nodePrecedence !== 14) {
	    // Not a `LogicalExpression` or `BinaryExpression`
	    return false
	  }
	  if (node.operator === '**' && parentNode.operator === '**') {
	    // Exponentiation operator has right-to-left associativity
	    return !isRightHand
	  }
	  if (
	    nodePrecedence === 13 &&
	    parentNodePrecedence === 13 &&
	    (node.operator === '??' || parentNode.operator === '??')
	  ) {
	    // Nullish coalescing and boolean operators cannot be combined
	    return true
	  }
	  if (isRightHand) {
	    // Parenthesis are used if both operators have the same precedence
	    return (
	      OPERATOR_PRECEDENCE[node.operator] <=
	      OPERATOR_PRECEDENCE[parentNode.operator]
	    )
	  }
	  return (
	    OPERATOR_PRECEDENCE[node.operator] <
	    OPERATOR_PRECEDENCE[parentNode.operator]
	  )
	}

	function formatExpression(state, node, parentNode, isRightHand) {
	  /*
	  Writes into `state` the provided `node`, adding parenthesis around if the provided `parentNode` needs it. If `node` is a right-hand argument, the provided `isRightHand` parameter should be `true`.
	  */
	  const { generator } = state;
	  if (expressionNeedsParenthesis(state, node, parentNode, isRightHand)) {
	    state.write('(');
	    generator[node.type](node, state);
	    state.write(')');
	  } else {
	    generator[node.type](node, state);
	  }
	}

	function reindent(state, text, indent, lineEnd) {
	  /*
	  Writes into `state` the `text` string reindented with the provided `indent`.
	  */
	  const lines = text.split('\n');
	  const end = lines.length - 1;
	  state.write(lines[0].trim());
	  if (end > 0) {
	    state.write(lineEnd);
	    for (let i = 1; i < end; i++) {
	      state.write(indent + lines[i].trim() + lineEnd);
	    }
	    state.write(indent + lines[end].trim());
	  }
	}

	function formatComments(state, comments, indent, lineEnd) {
	  /*
	  Writes into `state` the provided list of `comments`, with the given `indent` and `lineEnd` strings.
	  Line comments will end with `"\n"` regardless of the value of `lineEnd`.
	  Expects to start on a new unindented line.
	  */
	  const { length } = comments;
	  for (let i = 0; i < length; i++) {
	    const comment = comments[i];
	    state.write(indent);
	    if (comment.type[0] === 'L') {
	      // Line comment
	      state.write('// ' + comment.value.trim() + '\n', comment);
	    } else {
	      // Block comment
	      state.write('/*');
	      reindent(state, comment.value, indent, lineEnd);
	      state.write('*/' + lineEnd);
	    }
	  }
	}

	function hasCallExpression(node) {
	  /*
	  Returns `true` if the provided `node` contains a call expression and `false` otherwise.
	  */
	  let currentNode = node;
	  while (currentNode != null) {
	    const { type } = currentNode;
	    if (type[0] === 'C' && type[1] === 'a') {
	      // Is CallExpression
	      return true
	    } else if (type[0] === 'M' && type[1] === 'e' && type[2] === 'm') {
	      // Is MemberExpression
	      currentNode = currentNode.object;
	    } else {
	      return false
	    }
	  }
	}

	function formatVariableDeclaration(state, node) {
	  /*
	  Writes into `state` a variable declaration.
	  */
	  const { generator } = state;
	  const { declarations } = node;
	  state.write(node.kind + ' ');
	  const { length } = declarations;
	  if (length > 0) {
	    generator.VariableDeclarator(declarations[0], state);
	    for (let i = 1; i < length; i++) {
	      state.write(', ');
	      generator.VariableDeclarator(declarations[i], state);
	    }
	  }
	}

	let ForInStatement$1,
	  FunctionDeclaration$1,
	  RestElement$1,
	  BinaryExpression$1,
	  ArrayExpression$1,
	  BlockStatement;

	const GENERATOR = {
	  /*
	  Default generator.
	  */
	  Program(node, state) {
	    const indent = state.indent.repeat(state.indentLevel);
	    const { lineEnd, writeComments } = state;
	    if (writeComments && node.comments != null) {
	      formatComments(state, node.comments, indent, lineEnd);
	    }
	    const statements = node.body;
	    const { length } = statements;
	    for (let i = 0; i < length; i++) {
	      const statement = statements[i];
	      if (writeComments && statement.comments != null) {
	        formatComments(state, statement.comments, indent, lineEnd);
	      }
	      state.write(indent);
	      this[statement.type](statement, state);
	      state.write(lineEnd);
	    }
	    if (writeComments && node.trailingComments != null) {
	      formatComments(state, node.trailingComments, indent, lineEnd);
	    }
	  },
	  BlockStatement: (BlockStatement = function (node, state) {
	    const indent = state.indent.repeat(state.indentLevel++);
	    const { lineEnd, writeComments } = state;
	    const statementIndent = indent + state.indent;
	    state.write('{');
	    const statements = node.body;
	    if (statements != null && statements.length > 0) {
	      state.write(lineEnd);
	      if (writeComments && node.comments != null) {
	        formatComments(state, node.comments, statementIndent, lineEnd);
	      }
	      const { length } = statements;
	      for (let i = 0; i < length; i++) {
	        const statement = statements[i];
	        if (writeComments && statement.comments != null) {
	          formatComments(state, statement.comments, statementIndent, lineEnd);
	        }
	        state.write(statementIndent);
	        this[statement.type](statement, state);
	        state.write(lineEnd);
	      }
	      state.write(indent);
	    } else {
	      if (writeComments && node.comments != null) {
	        state.write(lineEnd);
	        formatComments(state, node.comments, statementIndent, lineEnd);
	        state.write(indent);
	      }
	    }
	    if (writeComments && node.trailingComments != null) {
	      formatComments(state, node.trailingComments, statementIndent, lineEnd);
	    }
	    state.write('}');
	    state.indentLevel--;
	  }),
	  ClassBody: BlockStatement,
	  StaticBlock(node, state) {
	    state.write('static ');
	    this.BlockStatement(node, state);
	  },
	  EmptyStatement(node, state) {
	    state.write(';');
	  },
	  ExpressionStatement(node, state) {
	    const precedence = state.expressionsPrecedence[node.expression.type];
	    if (
	      precedence === NEEDS_PARENTHESES ||
	      (precedence === 3 && node.expression.left.type[0] === 'O')
	    ) {
	      // Should always have parentheses or is an AssignmentExpression to an ObjectPattern
	      state.write('(');
	      this[node.expression.type](node.expression, state);
	      state.write(')');
	    } else {
	      this[node.expression.type](node.expression, state);
	    }
	    state.write(';');
	  },
	  IfStatement(node, state) {
	    state.write('if (');
	    this[node.test.type](node.test, state);
	    state.write(') ');
	    this[node.consequent.type](node.consequent, state);
	    if (node.alternate != null) {
	      state.write(' else ');
	      this[node.alternate.type](node.alternate, state);
	    }
	  },
	  LabeledStatement(node, state) {
	    this[node.label.type](node.label, state);
	    state.write(': ');
	    this[node.body.type](node.body, state);
	  },
	  BreakStatement(node, state) {
	    state.write('break');
	    if (node.label != null) {
	      state.write(' ');
	      this[node.label.type](node.label, state);
	    }
	    state.write(';');
	  },
	  ContinueStatement(node, state) {
	    state.write('continue');
	    if (node.label != null) {
	      state.write(' ');
	      this[node.label.type](node.label, state);
	    }
	    state.write(';');
	  },
	  WithStatement(node, state) {
	    state.write('with (');
	    this[node.object.type](node.object, state);
	    state.write(') ');
	    this[node.body.type](node.body, state);
	  },
	  SwitchStatement(node, state) {
	    const indent = state.indent.repeat(state.indentLevel++);
	    const { lineEnd, writeComments } = state;
	    state.indentLevel++;
	    const caseIndent = indent + state.indent;
	    const statementIndent = caseIndent + state.indent;
	    state.write('switch (');
	    this[node.discriminant.type](node.discriminant, state);
	    state.write(') {' + lineEnd);
	    const { cases: occurences } = node;
	    const { length: occurencesCount } = occurences;
	    for (let i = 0; i < occurencesCount; i++) {
	      const occurence = occurences[i];
	      if (writeComments && occurence.comments != null) {
	        formatComments(state, occurence.comments, caseIndent, lineEnd);
	      }
	      if (occurence.test) {
	        state.write(caseIndent + 'case ');
	        this[occurence.test.type](occurence.test, state);
	        state.write(':' + lineEnd);
	      } else {
	        state.write(caseIndent + 'default:' + lineEnd);
	      }
	      const { consequent } = occurence;
	      const { length: consequentCount } = consequent;
	      for (let i = 0; i < consequentCount; i++) {
	        const statement = consequent[i];
	        if (writeComments && statement.comments != null) {
	          formatComments(state, statement.comments, statementIndent, lineEnd);
	        }
	        state.write(statementIndent);
	        this[statement.type](statement, state);
	        state.write(lineEnd);
	      }
	    }
	    state.indentLevel -= 2;
	    state.write(indent + '}');
	  },
	  ReturnStatement(node, state) {
	    state.write('return');
	    if (node.argument) {
	      state.write(' ');
	      this[node.argument.type](node.argument, state);
	    }
	    state.write(';');
	  },
	  ThrowStatement(node, state) {
	    state.write('throw ');
	    this[node.argument.type](node.argument, state);
	    state.write(';');
	  },
	  TryStatement(node, state) {
	    state.write('try ');
	    this[node.block.type](node.block, state);
	    if (node.handler) {
	      const { handler } = node;
	      if (handler.param == null) {
	        state.write(' catch ');
	      } else {
	        state.write(' catch (');
	        this[handler.param.type](handler.param, state);
	        state.write(') ');
	      }
	      this[handler.body.type](handler.body, state);
	    }
	    if (node.finalizer) {
	      state.write(' finally ');
	      this[node.finalizer.type](node.finalizer, state);
	    }
	  },
	  WhileStatement(node, state) {
	    state.write('while (');
	    this[node.test.type](node.test, state);
	    state.write(') ');
	    this[node.body.type](node.body, state);
	  },
	  DoWhileStatement(node, state) {
	    state.write('do ');
	    this[node.body.type](node.body, state);
	    state.write(' while (');
	    this[node.test.type](node.test, state);
	    state.write(');');
	  },
	  ForStatement(node, state) {
	    state.write('for (');
	    if (node.init != null) {
	      const { init } = node;
	      if (init.type[0] === 'V') {
	        formatVariableDeclaration(state, init);
	      } else {
	        this[init.type](init, state);
	      }
	    }
	    state.write('; ');
	    if (node.test) {
	      this[node.test.type](node.test, state);
	    }
	    state.write('; ');
	    if (node.update) {
	      this[node.update.type](node.update, state);
	    }
	    state.write(') ');
	    this[node.body.type](node.body, state);
	  },
	  ForInStatement: (ForInStatement$1 = function (node, state) {
	    state.write(`for ${node.await ? 'await ' : ''}(`);
	    const { left } = node;
	    if (left.type[0] === 'V') {
	      formatVariableDeclaration(state, left);
	    } else {
	      this[left.type](left, state);
	    }
	    // Identifying whether node.type is `ForInStatement` or `ForOfStatement`
	    state.write(node.type[3] === 'I' ? ' in ' : ' of ');
	    this[node.right.type](node.right, state);
	    state.write(') ');
	    this[node.body.type](node.body, state);
	  }),
	  ForOfStatement: ForInStatement$1,
	  DebuggerStatement(node, state) {
	    state.write('debugger;', node);
	  },
	  FunctionDeclaration: (FunctionDeclaration$1 = function (node, state) {
	    state.write(
	      (node.async ? 'async ' : '') +
	        (node.generator ? 'function* ' : 'function ') +
	        (node.id ? node.id.name : ''),
	      node,
	    );
	    formatSequence(state, node.params);
	    state.write(' ');
	    this[node.body.type](node.body, state);
	  }),
	  FunctionExpression: FunctionDeclaration$1,
	  VariableDeclaration(node, state) {
	    formatVariableDeclaration(state, node);
	    state.write(';');
	  },
	  VariableDeclarator(node, state) {
	    this[node.id.type](node.id, state);
	    if (node.init != null) {
	      state.write(' = ');
	      this[node.init.type](node.init, state);
	    }
	  },
	  ClassDeclaration(node, state) {
	    state.write('class ' + (node.id ? `${node.id.name} ` : ''), node);
	    if (node.superClass) {
	      state.write('extends ');
	      const { superClass } = node;
	      const { type } = superClass;
	      const precedence = state.expressionsPrecedence[type];
	      if (
	        (type[0] !== 'C' || type[1] !== 'l' || type[5] !== 'E') &&
	        (precedence === NEEDS_PARENTHESES ||
	          precedence < state.expressionsPrecedence.ClassExpression)
	      ) {
	        // Not a ClassExpression that needs parentheses
	        state.write('(');
	        this[node.superClass.type](superClass, state);
	        state.write(')');
	      } else {
	        this[superClass.type](superClass, state);
	      }
	      state.write(' ');
	    }
	    this.ClassBody(node.body, state);
	  },
	  ImportDeclaration(node, state) {
	    state.write('import ');
	    const { specifiers, attributes } = node;
	    const { length } = specifiers;
	    // TODO: Once babili is fixed, put this after condition
	    // https://github.com/babel/babili/issues/430
	    let i = 0;
	    if (length > 0) {
	      for (; i < length; ) {
	        if (i > 0) {
	          state.write(', ');
	        }
	        const specifier = specifiers[i];
	        const type = specifier.type[6];
	        if (type === 'D') {
	          // ImportDefaultSpecifier
	          state.write(specifier.local.name, specifier);
	          i++;
	        } else if (type === 'N') {
	          // ImportNamespaceSpecifier
	          state.write('* as ' + specifier.local.name, specifier);
	          i++;
	        } else {
	          // ImportSpecifier
	          break
	        }
	      }
	      if (i < length) {
	        state.write('{');
	        for (;;) {
	          const specifier = specifiers[i];
	          const { name } = specifier.imported;
	          state.write(name, specifier);
	          if (name !== specifier.local.name) {
	            state.write(' as ' + specifier.local.name);
	          }
	          if (++i < length) {
	            state.write(', ');
	          } else {
	            break
	          }
	        }
	        state.write('}');
	      }
	      state.write(' from ');
	    }
	    this.Literal(node.source, state);

	    if (attributes && attributes.length > 0) {
	      state.write(' with { ');
	      for (let i = 0; i < attributes.length; i++) {
	        this.ImportAttribute(attributes[i], state);
	        if (i < attributes.length - 1) state.write(', ');
	      }

	      state.write(' }');
	    }
	    state.write(';');
	  },
	  ImportAttribute(node, state) {
	    this.Identifier(node.key, state);
	    state.write(': ');
	    this.Literal(node.value, state);
	  },
	  ImportExpression(node, state) {
	    state.write('import(');
	    this[node.source.type](node.source, state);
	    state.write(')');
	  },
	  ExportDefaultDeclaration(node, state) {
	    state.write('export default ');
	    this[node.declaration.type](node.declaration, state);
	    if (
	      state.expressionsPrecedence[node.declaration.type] != null &&
	      node.declaration.type[0] !== 'F'
	    ) {
	      // All expression nodes except `FunctionExpression`
	      state.write(';');
	    }
	  },
	  ExportNamedDeclaration(node, state) {
	    state.write('export ');
	    if (node.declaration) {
	      this[node.declaration.type](node.declaration, state);
	    } else {
	      state.write('{');
	      const { specifiers } = node,
	        { length } = specifiers;
	      if (length > 0) {
	        for (let i = 0; ; ) {
	          const specifier = specifiers[i];
	          const { name } = specifier.local;
	          state.write(name, specifier);
	          if (name !== specifier.exported.name) {
	            state.write(' as ' + specifier.exported.name);
	          }
	          if (++i < length) {
	            state.write(', ');
	          } else {
	            break
	          }
	        }
	      }
	      state.write('}');
	      if (node.source) {
	        state.write(' from ');
	        this.Literal(node.source, state);
	      }

	      if (node.attributes && node.attributes.length > 0) {
	        state.write(' with { ');
	        for (let i = 0; i < node.attributes.length; i++) {
	          this.ImportAttribute(node.attributes[i], state);
	          if (i < node.attributes.length - 1) state.write(', ');
	        }

	        state.write(' }');
	      }

	      state.write(';');
	    }
	  },
	  ExportAllDeclaration(node, state) {
	    if (node.exported != null) {
	      state.write('export * as ' + node.exported.name + ' from ');
	    } else {
	      state.write('export * from ');
	    }
	    this.Literal(node.source, state);

	    if (node.attributes && node.attributes.length > 0) {
	      state.write(' with { ');
	      for (let i = 0; i < node.attributes.length; i++) {
	        this.ImportAttribute(node.attributes[i], state);
	        if (i < node.attributes.length - 1) state.write(', ');
	      }

	      state.write(' }');
	    }

	    state.write(';');
	  },
	  MethodDefinition(node, state) {
	    if (node.static) {
	      state.write('static ');
	    }
	    const kind = node.kind[0];
	    if (kind === 'g' || kind === 's') {
	      // Getter or setter
	      state.write(node.kind + ' ');
	    }
	    if (node.value.async) {
	      state.write('async ');
	    }
	    if (node.value.generator) {
	      state.write('*');
	    }
	    if (node.computed) {
	      state.write('[');
	      this[node.key.type](node.key, state);
	      state.write(']');
	    } else {
	      this[node.key.type](node.key, state);
	    }
	    formatSequence(state, node.value.params);
	    state.write(' ');
	    this[node.value.body.type](node.value.body, state);
	  },
	  ClassExpression(node, state) {
	    this.ClassDeclaration(node, state);
	  },
	  ArrowFunctionExpression(node, state) {
	    state.write(node.async ? 'async ' : '', node);
	    const { params } = node;
	    if (params != null) {
	      // Omit parenthesis if only one named parameter
	      if (params.length === 1 && params[0].type[0] === 'I') {
	        // If params[0].type[0] starts with 'I', it can't be `ImportDeclaration` nor `IfStatement` and thus is `Identifier`
	        state.write(params[0].name, params[0]);
	      } else {
	        formatSequence(state, node.params);
	      }
	    }
	    state.write(' => ');
	    if (node.body.type[0] === 'O') {
	      // Body is an object expression
	      state.write('(');
	      this.ObjectExpression(node.body, state);
	      state.write(')');
	    } else {
	      this[node.body.type](node.body, state);
	    }
	  },
	  ThisExpression(node, state) {
	    state.write('this', node);
	  },
	  Super(node, state) {
	    state.write('super', node);
	  },
	  RestElement: (RestElement$1 = function (node, state) {
	    state.write('...');
	    this[node.argument.type](node.argument, state);
	  }),
	  SpreadElement: RestElement$1,
	  YieldExpression(node, state) {
	    state.write(node.delegate ? 'yield*' : 'yield');
	    if (node.argument) {
	      state.write(' ');
	      this[node.argument.type](node.argument, state);
	    }
	  },
	  AwaitExpression(node, state) {
	    state.write('await ', node);
	    formatExpression(state, node.argument, node);
	  },
	  TemplateLiteral(node, state) {
	    const { quasis, expressions } = node;
	    state.write('`');
	    const { length } = expressions;
	    for (let i = 0; i < length; i++) {
	      const expression = expressions[i];
	      const quasi = quasis[i];
	      state.write(quasi.value.raw, quasi);
	      state.write('${');
	      this[expression.type](expression, state);
	      state.write('}');
	    }
	    const quasi = quasis[quasis.length - 1];
	    state.write(quasi.value.raw, quasi);
	    state.write('`');
	  },
	  TemplateElement(node, state) {
	    state.write(node.value.raw, node);
	  },
	  TaggedTemplateExpression(node, state) {
	    formatExpression(state, node.tag, node);
	    this[node.quasi.type](node.quasi, state);
	  },
	  ArrayExpression: (ArrayExpression$1 = function (node, state) {
	    state.write('[');
	    if (node.elements.length > 0) {
	      const { elements } = node,
	        { length } = elements;
	      for (let i = 0; ; ) {
	        const element = elements[i];
	        if (element != null) {
	          this[element.type](element, state);
	        }
	        if (++i < length) {
	          state.write(', ');
	        } else {
	          if (element == null) {
	            state.write(', ');
	          }
	          break
	        }
	      }
	    }
	    state.write(']');
	  }),
	  ArrayPattern: ArrayExpression$1,
	  ObjectExpression(node, state) {
	    const indent = state.indent.repeat(state.indentLevel++);
	    const { lineEnd, writeComments } = state;
	    const propertyIndent = indent + state.indent;
	    state.write('{');
	    if (node.properties.length > 0) {
	      state.write(lineEnd);
	      if (writeComments && node.comments != null) {
	        formatComments(state, node.comments, propertyIndent, lineEnd);
	      }
	      const comma = ',' + lineEnd;
	      const { properties } = node,
	        { length } = properties;
	      for (let i = 0; ; ) {
	        const property = properties[i];
	        if (writeComments && property.comments != null) {
	          formatComments(state, property.comments, propertyIndent, lineEnd);
	        }
	        state.write(propertyIndent);
	        this[property.type](property, state);
	        if (++i < length) {
	          state.write(comma);
	        } else {
	          break
	        }
	      }
	      state.write(lineEnd);
	      if (writeComments && node.trailingComments != null) {
	        formatComments(state, node.trailingComments, propertyIndent, lineEnd);
	      }
	      state.write(indent + '}');
	    } else if (writeComments) {
	      if (node.comments != null) {
	        state.write(lineEnd);
	        formatComments(state, node.comments, propertyIndent, lineEnd);
	        if (node.trailingComments != null) {
	          formatComments(state, node.trailingComments, propertyIndent, lineEnd);
	        }
	        state.write(indent + '}');
	      } else if (node.trailingComments != null) {
	        state.write(lineEnd);
	        formatComments(state, node.trailingComments, propertyIndent, lineEnd);
	        state.write(indent + '}');
	      } else {
	        state.write('}');
	      }
	    } else {
	      state.write('}');
	    }
	    state.indentLevel--;
	  },
	  Property(node, state) {
	    if (node.method || node.kind[0] !== 'i') {
	      // Either a method or of kind `set` or `get` (not `init`)
	      this.MethodDefinition(node, state);
	    } else {
	      if (!node.shorthand) {
	        if (node.computed) {
	          state.write('[');
	          this[node.key.type](node.key, state);
	          state.write(']');
	        } else {
	          this[node.key.type](node.key, state);
	        }
	        state.write(': ');
	      }
	      this[node.value.type](node.value, state);
	    }
	  },
	  PropertyDefinition(node, state) {
	    if (node.static) {
	      state.write('static ');
	    }
	    if (node.computed) {
	      state.write('[');
	    }
	    this[node.key.type](node.key, state);
	    if (node.computed) {
	      state.write(']');
	    }
	    if (node.value == null) {
	      if (node.key.type[0] !== 'F') {
	        state.write(';');
	      }
	      return
	    }
	    state.write(' = ');
	    this[node.value.type](node.value, state);
	    state.write(';');
	  },
	  ObjectPattern(node, state) {
	    state.write('{');
	    if (node.properties.length > 0) {
	      const { properties } = node,
	        { length } = properties;
	      for (let i = 0; ; ) {
	        this[properties[i].type](properties[i], state);
	        if (++i < length) {
	          state.write(', ');
	        } else {
	          break
	        }
	      }
	    }
	    state.write('}');
	  },
	  SequenceExpression(node, state) {
	    formatSequence(state, node.expressions);
	  },
	  UnaryExpression(node, state) {
	    if (node.prefix) {
	      const {
	        operator,
	        argument,
	        argument: { type },
	      } = node;
	      state.write(operator);
	      const needsParentheses = expressionNeedsParenthesis(state, argument, node);
	      if (
	        !needsParentheses &&
	        (operator.length > 1 ||
	          (type[0] === 'U' &&
	            (type[1] === 'n' || type[1] === 'p') &&
	            argument.prefix &&
	            argument.operator[0] === operator &&
	            (operator === '+' || operator === '-')))
	      ) {
	        // Large operator or argument is UnaryExpression or UpdateExpression node
	        state.write(' ');
	      }
	      if (needsParentheses) {
	        state.write(operator.length > 1 ? ' (' : '(');
	        this[type](argument, state);
	        state.write(')');
	      } else {
	        this[type](argument, state);
	      }
	    } else {
	      // FIXME: This case never occurs
	      this[node.argument.type](node.argument, state);
	      state.write(node.operator);
	    }
	  },
	  UpdateExpression(node, state) {
	    // Always applied to identifiers or members, no parenthesis check needed
	    if (node.prefix) {
	      state.write(node.operator);
	      this[node.argument.type](node.argument, state);
	    } else {
	      this[node.argument.type](node.argument, state);
	      state.write(node.operator);
	    }
	  },
	  AssignmentExpression(node, state) {
	    this[node.left.type](node.left, state);
	    state.write(' ' + node.operator + ' ');
	    this[node.right.type](node.right, state);
	  },
	  AssignmentPattern(node, state) {
	    this[node.left.type](node.left, state);
	    state.write(' = ');
	    this[node.right.type](node.right, state);
	  },
	  BinaryExpression: (BinaryExpression$1 = function (node, state) {
	    const isIn = node.operator === 'in';
	    if (isIn) {
	      // Avoids confusion in `for` loops initializers
	      state.write('(');
	    }
	    formatExpression(state, node.left, node, false);
	    state.write(' ' + node.operator + ' ');
	    formatExpression(state, node.right, node, true);
	    if (isIn) {
	      state.write(')');
	    }
	  }),
	  LogicalExpression: BinaryExpression$1,
	  ConditionalExpression(node, state) {
	    const { test } = node;
	    const precedence = state.expressionsPrecedence[test.type];
	    if (
	      precedence === NEEDS_PARENTHESES ||
	      precedence <= state.expressionsPrecedence.ConditionalExpression
	    ) {
	      state.write('(');
	      this[test.type](test, state);
	      state.write(')');
	    } else {
	      this[test.type](test, state);
	    }
	    state.write(' ? ');
	    this[node.consequent.type](node.consequent, state);
	    state.write(' : ');
	    this[node.alternate.type](node.alternate, state);
	  },
	  NewExpression(node, state) {
	    state.write('new ');
	    const precedence = state.expressionsPrecedence[node.callee.type];
	    if (
	      precedence === NEEDS_PARENTHESES ||
	      precedence < state.expressionsPrecedence.CallExpression ||
	      hasCallExpression(node.callee)
	    ) {
	      state.write('(');
	      this[node.callee.type](node.callee, state);
	      state.write(')');
	    } else {
	      this[node.callee.type](node.callee, state);
	    }
	    formatSequence(state, node['arguments']);
	  },
	  CallExpression(node, state) {
	    const precedence = state.expressionsPrecedence[node.callee.type];
	    if (
	      precedence === NEEDS_PARENTHESES ||
	      precedence < state.expressionsPrecedence.CallExpression
	    ) {
	      state.write('(');
	      this[node.callee.type](node.callee, state);
	      state.write(')');
	    } else {
	      this[node.callee.type](node.callee, state);
	    }
	    if (node.optional) {
	      state.write('?.');
	    }
	    formatSequence(state, node['arguments']);
	  },
	  ChainExpression(node, state) {
	    this[node.expression.type](node.expression, state);
	  },
	  MemberExpression(node, state) {
	    const precedence = state.expressionsPrecedence[node.object.type];
	    if (
	      precedence === NEEDS_PARENTHESES ||
	      precedence < state.expressionsPrecedence.MemberExpression
	    ) {
	      state.write('(');
	      this[node.object.type](node.object, state);
	      state.write(')');
	    } else {
	      this[node.object.type](node.object, state);
	    }
	    if (node.computed) {
	      if (node.optional) {
	        state.write('?.');
	      }
	      state.write('[');
	      this[node.property.type](node.property, state);
	      state.write(']');
	    } else {
	      if (node.optional) {
	        state.write('?.');
	      } else {
	        state.write('.');
	      }
	      this[node.property.type](node.property, state);
	    }
	  },
	  MetaProperty(node, state) {
	    state.write(node.meta.name + '.' + node.property.name, node);
	  },
	  Identifier(node, state) {
	    state.write(node.name, node);
	  },
	  PrivateIdentifier(node, state) {
	    state.write(`#${node.name}`, node);
	  },
	  Literal(node, state) {
	    if (node.raw != null) {
	      // Non-standard property
	      state.write(node.raw, node);
	    } else if (node.regex != null) {
	      this.RegExpLiteral(node, state);
	    } else if (node.bigint != null) {
	      state.write(node.bigint + 'n', node);
	    } else {
	      state.write(stringify(node.value), node);
	    }
	  },
	  RegExpLiteral(node, state) {
	    const { regex } = node;
	    state.write(`/${regex.pattern}/${regex.flags}`, node);
	  },
	};

	const EMPTY_OBJECT = {};

	class State {
	  constructor(options) {
	    const setup = options == null ? EMPTY_OBJECT : options;
	    this.output = '';
	    // Functional options
	    if (setup.output != null) {
	      this.output = setup.output;
	      this.write = this.writeToStream;
	    } else {
	      this.output = '';
	    }
	    this.generator = setup.generator != null ? setup.generator : GENERATOR;
	    this.expressionsPrecedence =
	      setup.expressionsPrecedence != null
	        ? setup.expressionsPrecedence
	        : EXPRESSIONS_PRECEDENCE;
	    // Formating setup
	    this.indent = setup.indent != null ? setup.indent : '  ';
	    this.lineEnd = setup.lineEnd != null ? setup.lineEnd : '\n';
	    this.indentLevel =
	      setup.startingIndentLevel != null ? setup.startingIndentLevel : 0;
	    this.writeComments = setup.comments ? setup.comments : false;
	    // Source map
	    if (setup.sourceMap != null) {
	      this.write =
	        setup.output == null ? this.writeAndMap : this.writeToStreamAndMap;
	      this.sourceMap = setup.sourceMap;
	      this.line = 1;
	      this.column = 0;
	      this.lineEndSize = this.lineEnd.split('\n').length - 1;
	      this.mapping = {
	        original: null,
	        // Uses the entire state to avoid generating ephemeral objects
	        generated: this,
	        name: undefined,
	        source: setup.sourceMap.file || setup.sourceMap._file,
	      };
	    }
	  }

	  write(code) {
	    this.output += code;
	  }

	  writeToStream(code) {
	    this.output.write(code);
	  }

	  writeAndMap(code, node) {
	    this.output += code;
	    this.map(code, node);
	  }

	  writeToStreamAndMap(code, node) {
	    this.output.write(code);
	    this.map(code, node);
	  }

	  map(code, node) {
	    if (node != null) {
	      const { type } = node;
	      if (type[0] === 'L' && type[2] === 'n') {
	        // LineComment
	        this.column = 0;
	        this.line++;
	        return
	      }
	      if (node.loc != null) {
	        const { mapping } = this;
	        mapping.original = node.loc.start;
	        mapping.name = node.name;
	        this.sourceMap.addMapping(mapping);
	      }
	      if (
	        (type[0] === 'T' && type[8] === 'E') ||
	        (type[0] === 'L' && type[1] === 'i' && typeof node.value === 'string')
	      ) {
	        // TemplateElement or Literal string node
	        const { length } = code;
	        let { column, line } = this;
	        for (let i = 0; i < length; i++) {
	          if (code[i] === '\n') {
	            column = 0;
	            line++;
	          } else {
	            column++;
	          }
	        }
	        this.column = column;
	        this.line = line;
	        return
	      }
	    }
	    const { length } = code;
	    const { lineEnd } = this;
	    if (length > 0) {
	      if (
	        this.lineEndSize > 0 &&
	        (lineEnd.length === 1
	          ? code[length - 1] === lineEnd
	          : code.endsWith(lineEnd))
	      ) {
	        this.line += this.lineEndSize;
	        this.column = 0;
	      } else {
	        this.column += length;
	      }
	    }
	  }

	  toString() {
	    return this.output
	  }
	}

	function generate(node, options) {
	  /*
	  Returns a string representing the rendered code of the provided AST `node`.
	  The `options` are:

	  - `indent`: string to use for indentation (defaults to `␣␣`)
	  - `lineEnd`: string to use for line endings (defaults to `\n`)
	  - `startingIndentLevel`: indent level to start from (defaults to `0`)
	  - `comments`: generate comments if `true` (defaults to `false`)
	  - `output`: output stream to write the rendered code to (defaults to `null`)
	  - `generator`: custom code generator (defaults to `GENERATOR`)
	  - `expressionsPrecedence`: custom map of node types and their precedence level (defaults to `EXPRESSIONS_PRECEDENCE`)
	  */
	  const state = new State(options);
	  // Travel through the AST node and generate the code
	  state.generator[node.type](node, state);
	  return state.output
	}

	let ForInStatement, FunctionDeclaration, RestElement, BinaryExpression, ArrayExpression, Block$1, MethodDefinition;
	const ignore = Function.prototype;

	class Found {
	  constructor(node, state) {
	    this.node = node;
	    this.state = state;
	  }

	}

	const defaultTraveler = {
	  go(node, state) {
	    if (this[node.type]) {
	      this[node.type](node, state);
	    }
	  },

	  find(predicate, node, state) {
	    const finder = Object.create(this);

	    finder.go = function (node, state) {
	      if (predicate(node, state)) {
	        throw new Found(node, state);
	      }

	      this[node.type](node, state);
	    };

	    try {
	      finder.go(node, state);
	    } catch (error) {
	      if (error instanceof Found) {
	        return error;
	      } else {
	        throw error;
	      }
	    }
	  },

	  makeChild(properties = {}) {
	    const traveler = Object.create(this);
	    traveler.super = this;

	    for (let key in properties) {
	      traveler[key] = properties[key];
	    }

	    return traveler;
	  },

	  Program: Block$1 = function (node, state) {
	    const {
	      body
	    } = node;

	    if (body != null) {
	      const {
	        length
	      } = body;

	      for (let i = 0; i < length; i++) {
	        this.go(body[i], state);
	      }
	    }
	  },
	  BlockStatement: Block$1,
	  StaticBlock: Block$1,
	  EmptyStatement: ignore,

	  ExpressionStatement(node, state) {
	    this.go(node.expression, state);
	  },

	  IfStatement(node, state) {
	    this.go(node.test, state);
	    this.go(node.consequent, state);

	    if (node.alternate != null) {
	      this.go(node.alternate, state);
	    }
	  },

	  LabeledStatement(node, state) {
	    this.go(node.label, state);
	    this.go(node.body, state);
	  },

	  BreakStatement(node, state) {
	    if (node.label) {
	      this.go(node.label, state);
	    }
	  },

	  ContinueStatement(node, state) {
	    if (node.label) {
	      this.go(node.label, state);
	    }
	  },

	  WithStatement(node, state) {
	    this.go(node.object, state);
	    this.go(node.body, state);
	  },

	  SwitchStatement(node, state) {
	    this.go(node.discriminant, state);
	    const {
	      cases
	    } = node,
	          {
	      length
	    } = cases;

	    for (let i = 0; i < length; i++) {
	      this.go(cases[i], state);
	    }
	  },

	  SwitchCase(node, state) {
	    if (node.test != null) {
	      this.go(node.test, state);
	    }

	    const statements = node.consequent,
	          {
	      length
	    } = statements;

	    for (let i = 0; i < length; i++) {
	      this.go(statements[i], state);
	    }
	  },

	  ReturnStatement(node, state) {
	    if (node.argument) {
	      this.go(node.argument, state);
	    }
	  },

	  ThrowStatement(node, state) {
	    this.go(node.argument, state);
	  },

	  TryStatement(node, state) {
	    this.go(node.block, state);

	    if (node.handler != null) {
	      this.go(node.handler, state);
	    }

	    if (node.finalizer != null) {
	      this.go(node.finalizer, state);
	    }
	  },

	  CatchClause(node, state) {
	    if (node.param != null) {
	      this.go(node.param, state);
	    }

	    this.go(node.body, state);
	  },

	  WhileStatement(node, state) {
	    this.go(node.test, state);
	    this.go(node.body, state);
	  },

	  DoWhileStatement(node, state) {
	    this.go(node.body, state);
	    this.go(node.test, state);
	  },

	  ForStatement(node, state) {
	    if (node.init != null) {
	      this.go(node.init, state);
	    }

	    if (node.test != null) {
	      this.go(node.test, state);
	    }

	    if (node.update != null) {
	      this.go(node.update, state);
	    }

	    this.go(node.body, state);
	  },

	  ForInStatement: ForInStatement = function (node, state) {
	    this.go(node.left, state);
	    this.go(node.right, state);
	    this.go(node.body, state);
	  },
	  DebuggerStatement: ignore,
	  FunctionDeclaration: FunctionDeclaration = function (node, state) {
	    if (node.id != null) {
	      this.go(node.id, state);
	    }

	    const {
	      params
	    } = node;

	    if (params != null) {
	      for (let i = 0, {
	        length
	      } = params; i < length; i++) {
	        this.go(params[i], state);
	      }
	    }

	    this.go(node.body, state);
	  },

	  VariableDeclaration(node, state) {
	    const {
	      declarations
	    } = node,
	          {
	      length
	    } = declarations;

	    for (let i = 0; i < length; i++) {
	      this.go(declarations[i], state);
	    }
	  },

	  VariableDeclarator(node, state) {
	    this.go(node.id, state);

	    if (node.init != null) {
	      this.go(node.init, state);
	    }
	  },

	  ArrowFunctionExpression(node, state) {
	    const {
	      params
	    } = node;

	    if (params != null) {
	      for (let i = 0, {
	        length
	      } = params; i < length; i++) {
	        this.go(params[i], state);
	      }
	    }

	    this.go(node.body, state);
	  },

	  ThisExpression: ignore,
	  ArrayExpression: ArrayExpression = function (node, state) {
	    const {
	      elements
	    } = node,
	          {
	      length
	    } = elements;

	    for (let i = 0; i < length; i++) {
	      let element = elements[i];

	      if (element != null) {
	        this.go(elements[i], state);
	      }
	    }
	  },

	  ObjectExpression(node, state) {
	    const {
	      properties
	    } = node,
	          {
	      length
	    } = properties;

	    for (let i = 0; i < length; i++) {
	      this.go(properties[i], state);
	    }
	  },

	  Property(node, state) {
	    this.go(node.key, state);

	    if (node.value != null) {
	      this.go(node.value, state);
	    }
	  },

	  FunctionExpression: FunctionDeclaration,

	  SequenceExpression(node, state) {
	    const {
	      expressions
	    } = node,
	          {
	      length
	    } = expressions;

	    for (let i = 0; i < length; i++) {
	      this.go(expressions[i], state);
	    }
	  },

	  UnaryExpression(node, state) {
	    this.go(node.argument, state);
	  },

	  UpdateExpression(node, state) {
	    this.go(node.argument, state);
	  },

	  AssignmentExpression(node, state) {
	    this.go(node.left, state);
	    this.go(node.right, state);
	  },

	  BinaryExpression: BinaryExpression = function (node, state) {
	    this.go(node.left, state);
	    this.go(node.right, state);
	  },
	  LogicalExpression: BinaryExpression,

	  ConditionalExpression(node, state) {
	    this.go(node.test, state);
	    this.go(node.consequent, state);
	    this.go(node.alternate, state);
	  },

	  NewExpression(node, state) {
	    this.CallExpression(node, state);
	  },

	  CallExpression(node, state) {
	    this.go(node.callee, state);
	    const args = node['arguments'],
	          {
	      length
	    } = args;

	    for (let i = 0; i < length; i++) {
	      this.go(args[i], state);
	    }
	  },

	  MemberExpression(node, state) {
	    this.go(node.object, state);
	    this.go(node.property, state);
	  },

	  Identifier: ignore,
	  PrivateIdentifier: ignore,
	  Literal: ignore,
	  ForOfStatement: ForInStatement,

	  ClassDeclaration(node, state) {
	    if (node.id) {
	      this.go(node.id, state);
	    }

	    if (node.superClass) {
	      this.go(node.superClass, state);
	    }

	    this.go(node.body, state);
	  },

	  ClassBody: Block$1,

	  ImportDeclaration(node, state) {
	    const {
	      specifiers
	    } = node,
	          {
	      length
	    } = specifiers;

	    for (let i = 0; i < length; i++) {
	      this.go(specifiers[i], state);
	    }

	    this.go(node.source, state);
	  },

	  ImportNamespaceSpecifier(node, state) {
	    this.go(node.local, state);
	  },

	  ImportDefaultSpecifier(node, state) {
	    this.go(node.local, state);
	  },

	  ImportSpecifier(node, state) {
	    this.go(node.imported, state);
	    this.go(node.local, state);
	  },

	  ExportDefaultDeclaration(node, state) {
	    this.go(node.declaration, state);
	  },

	  ExportNamedDeclaration(node, state) {
	    if (node.declaration) {
	      this.go(node.declaration, state);
	    }

	    const {
	      specifiers
	    } = node,
	          {
	      length
	    } = specifiers;

	    for (let i = 0; i < length; i++) {
	      this.go(specifiers[i], state);
	    }

	    if (node.source) {
	      this.go(node.source, state);
	    }
	  },

	  ExportSpecifier(node, state) {
	    this.go(node.local, state);
	    this.go(node.exported, state);
	  },

	  ExportAllDeclaration(node, state) {
	    this.go(node.source, state);
	  },

	  MethodDefinition: MethodDefinition = function (node, state) {
	    this.go(node.key, state);
	    this.go(node.value, state);
	  },
	  PropertyDefinition: MethodDefinition,

	  ClassExpression(node, state) {
	    this.ClassDeclaration(node, state);
	  },

	  Super: ignore,
	  RestElement: RestElement = function (node, state) {
	    this.go(node.argument, state);
	  },
	  SpreadElement: RestElement,

	  YieldExpression(node, state) {
	    if (node.argument) {
	      this.go(node.argument, state);
	    }
	  },

	  TaggedTemplateExpression(node, state) {
	    this.go(node.tag, state);
	    this.go(node.quasi, state);
	  },

	  TemplateLiteral(node, state) {
	    const {
	      quasis,
	      expressions
	    } = node;

	    for (let i = 0, {
	      length
	    } = expressions; i < length; i++) {
	      this.go(expressions[i], state);
	    }

	    for (let i = 0, {
	      length
	    } = quasis; i < length; i++) {
	      this.go(quasis[i], state);
	    }
	  },

	  TemplateElement: ignore,

	  ObjectPattern(node, state) {
	    const {
	      properties
	    } = node,
	          {
	      length
	    } = properties;

	    for (let i = 0; i < length; i++) {
	      this.go(properties[i], state);
	    }
	  },

	  ArrayPattern: ArrayExpression,

	  AssignmentPattern(node, state) {
	    this.go(node.left, state);
	    this.go(node.right, state);
	  },

	  MetaProperty(node, state) {
	    this.go(node.meta, state);
	    this.go(node.property, state);
	  },

	  AwaitExpression(node, state) {
	    this.go(node.argument, state);
	  }

	};

	function attachCommentsToNode(traveler, state, parent, children, findHeadingComments) {
	  let {
	    index
	  } = state;
	  const {
	    comments
	  } = state;
	  let comment = comments[index];
	  let boundComments, trailingComments;

	  if (comment == null) {
	    return;
	  }

	  if (children == null || children.length === 0) {
	    boundComments = parent.comments != null ? parent.comments : [];

	    while (comment != null && comment.end <= parent.end) {
	      boundComments.push(comment);
	      comment = comments[++index];
	    }

	    state.index = index;

	    if (boundComments.length !== 0 && parent.comments == null) {
	      parent.comments = boundComments;
	    }

	    return;
	  }

	  if (findHeadingComments) {
	    boundComments = parent.comments != null ? parent.comments : [];
	    const {
	      start
	    } = children[0];

	    while (comment != null && (comment.type[0] === 'B' || comment.type[0] === 'M') && comment.end <= start) {
	      boundComments.push(comment);
	      comment = comments[++index];
	    }

	    if (boundComments.length !== 0 && parent.comments == null) parent.comments = boundComments;
	  }

	  for (let i = 0, {
	    length
	  } = children; comment != null && i < length; i++) {
	    const child = children[i];
	    boundComments = [];

	    while (comment != null && comment.end <= child.start) {
	      boundComments.push(comment);
	      comment = comments[++index];
	    }

	    if (comment != null && comment.loc != null && (comment.type[0] === 'L' || comment.type[0] === 'S')) {
	      if (comment.loc.start.line === child.loc.end.line) {
	        boundComments.push(comment);
	        comment = comments[++index];
	      }
	    }

	    if (boundComments.length !== 0) {
	      child.comments = boundComments;
	    }

	    state.index = index;
	    traveler[child.type](child, state);
	    index = state.index;
	    comment = comments[index];
	  }

	  trailingComments = [];

	  while (comment != null && comment.end <= parent.end) {
	    trailingComments.push(comment);
	    comment = comments[++index];
	  }

	  if (trailingComments.length !== 0) {
	    parent.trailingComments = trailingComments;
	  }

	  state.index = index;
	}

	function Block(node, state) {
	  attachCommentsToNode(this, state, node, node.body, true);
	}

	defaultTraveler.makeChild({
	  Program: Block,
	  BlockStatement: Block,
	  ClassBody: Block,

	  ObjectExpression(node, state) {
	    attachCommentsToNode(this, state, node, node.properties, true);
	  },

	  ArrayExpression(node, state) {
	    attachCommentsToNode(this, state, node, node.elements, true);
	  },

	  SwitchStatement(node, state) {
	    attachCommentsToNode(this, state, node, node.cases, false);
	  },

	  SwitchCase(node, state) {
	    attachCommentsToNode(this, state, node, node.consequent, false);
	  }

	});

	function makeTraveler(properties) {
	  return defaultTraveler.makeChild(properties);
	}

	var js = {exports: {}};

	var src = {};

	var javascript = {exports: {}};

	var beautifier$2 = {};

	var output = {};

	/*jshint node:true */

	var hasRequiredOutput;

	function requireOutput () {
		if (hasRequiredOutput) return output;
		hasRequiredOutput = 1;

		function OutputLine(parent) {
		  this.__parent = parent;
		  this.__character_count = 0;
		  // use indent_count as a marker for this.__lines that have preserved indentation
		  this.__indent_count = -1;
		  this.__alignment_count = 0;
		  this.__wrap_point_index = 0;
		  this.__wrap_point_character_count = 0;
		  this.__wrap_point_indent_count = -1;
		  this.__wrap_point_alignment_count = 0;

		  this.__items = [];
		}

		OutputLine.prototype.clone_empty = function() {
		  var line = new OutputLine(this.__parent);
		  line.set_indent(this.__indent_count, this.__alignment_count);
		  return line;
		};

		OutputLine.prototype.item = function(index) {
		  if (index < 0) {
		    return this.__items[this.__items.length + index];
		  } else {
		    return this.__items[index];
		  }
		};

		OutputLine.prototype.has_match = function(pattern) {
		  for (var lastCheckedOutput = this.__items.length - 1; lastCheckedOutput >= 0; lastCheckedOutput--) {
		    if (this.__items[lastCheckedOutput].match(pattern)) {
		      return true;
		    }
		  }
		  return false;
		};

		OutputLine.prototype.set_indent = function(indent, alignment) {
		  if (this.is_empty()) {
		    this.__indent_count = indent || 0;
		    this.__alignment_count = alignment || 0;
		    this.__character_count = this.__parent.get_indent_size(this.__indent_count, this.__alignment_count);
		  }
		};

		OutputLine.prototype._set_wrap_point = function() {
		  if (this.__parent.wrap_line_length) {
		    this.__wrap_point_index = this.__items.length;
		    this.__wrap_point_character_count = this.__character_count;
		    this.__wrap_point_indent_count = this.__parent.next_line.__indent_count;
		    this.__wrap_point_alignment_count = this.__parent.next_line.__alignment_count;
		  }
		};

		OutputLine.prototype._should_wrap = function() {
		  return this.__wrap_point_index &&
		    this.__character_count > this.__parent.wrap_line_length &&
		    this.__wrap_point_character_count > this.__parent.next_line.__character_count;
		};

		OutputLine.prototype._allow_wrap = function() {
		  if (this._should_wrap()) {
		    this.__parent.add_new_line();
		    var next = this.__parent.current_line;
		    next.set_indent(this.__wrap_point_indent_count, this.__wrap_point_alignment_count);
		    next.__items = this.__items.slice(this.__wrap_point_index);
		    this.__items = this.__items.slice(0, this.__wrap_point_index);

		    next.__character_count += this.__character_count - this.__wrap_point_character_count;
		    this.__character_count = this.__wrap_point_character_count;

		    if (next.__items[0] === " ") {
		      next.__items.splice(0, 1);
		      next.__character_count -= 1;
		    }
		    return true;
		  }
		  return false;
		};

		OutputLine.prototype.is_empty = function() {
		  return this.__items.length === 0;
		};

		OutputLine.prototype.last = function() {
		  if (!this.is_empty()) {
		    return this.__items[this.__items.length - 1];
		  } else {
		    return null;
		  }
		};

		OutputLine.prototype.push = function(item) {
		  this.__items.push(item);
		  var last_newline_index = item.lastIndexOf('\n');
		  if (last_newline_index !== -1) {
		    this.__character_count = item.length - last_newline_index;
		  } else {
		    this.__character_count += item.length;
		  }
		};

		OutputLine.prototype.pop = function() {
		  var item = null;
		  if (!this.is_empty()) {
		    item = this.__items.pop();
		    this.__character_count -= item.length;
		  }
		  return item;
		};


		OutputLine.prototype._remove_indent = function() {
		  if (this.__indent_count > 0) {
		    this.__indent_count -= 1;
		    this.__character_count -= this.__parent.indent_size;
		  }
		};

		OutputLine.prototype._remove_wrap_indent = function() {
		  if (this.__wrap_point_indent_count > 0) {
		    this.__wrap_point_indent_count -= 1;
		  }
		};
		OutputLine.prototype.trim = function() {
		  while (this.last() === ' ') {
		    this.__items.pop();
		    this.__character_count -= 1;
		  }
		};

		OutputLine.prototype.toString = function() {
		  var result = '';
		  if (this.is_empty()) {
		    if (this.__parent.indent_empty_lines) {
		      result = this.__parent.get_indent_string(this.__indent_count);
		    }
		  } else {
		    result = this.__parent.get_indent_string(this.__indent_count, this.__alignment_count);
		    result += this.__items.join('');
		  }
		  return result;
		};

		function IndentStringCache(options, baseIndentString) {
		  this.__cache = [''];
		  this.__indent_size = options.indent_size;
		  this.__indent_string = options.indent_char;
		  if (!options.indent_with_tabs) {
		    this.__indent_string = new Array(options.indent_size + 1).join(options.indent_char);
		  }

		  // Set to null to continue support for auto detection of base indent
		  baseIndentString = baseIndentString || '';
		  if (options.indent_level > 0) {
		    baseIndentString = new Array(options.indent_level + 1).join(this.__indent_string);
		  }

		  this.__base_string = baseIndentString;
		  this.__base_string_length = baseIndentString.length;
		}

		IndentStringCache.prototype.get_indent_size = function(indent, column) {
		  var result = this.__base_string_length;
		  column = column || 0;
		  if (indent < 0) {
		    result = 0;
		  }
		  result += indent * this.__indent_size;
		  result += column;
		  return result;
		};

		IndentStringCache.prototype.get_indent_string = function(indent_level, column) {
		  var result = this.__base_string;
		  column = column || 0;
		  if (indent_level < 0) {
		    indent_level = 0;
		    result = '';
		  }
		  column += indent_level * this.__indent_size;
		  this.__ensure_cache(column);
		  result += this.__cache[column];
		  return result;
		};

		IndentStringCache.prototype.__ensure_cache = function(column) {
		  while (column >= this.__cache.length) {
		    this.__add_column();
		  }
		};

		IndentStringCache.prototype.__add_column = function() {
		  var column = this.__cache.length;
		  var indent = 0;
		  var result = '';
		  if (this.__indent_size && column >= this.__indent_size) {
		    indent = Math.floor(column / this.__indent_size);
		    column -= indent * this.__indent_size;
		    result = new Array(indent + 1).join(this.__indent_string);
		  }
		  if (column) {
		    result += new Array(column + 1).join(' ');
		  }

		  this.__cache.push(result);
		};

		function Output(options, baseIndentString) {
		  this.__indent_cache = new IndentStringCache(options, baseIndentString);
		  this.raw = false;
		  this._end_with_newline = options.end_with_newline;
		  this.indent_size = options.indent_size;
		  this.wrap_line_length = options.wrap_line_length;
		  this.indent_empty_lines = options.indent_empty_lines;
		  this.__lines = [];
		  this.previous_line = null;
		  this.current_line = null;
		  this.next_line = new OutputLine(this);
		  this.space_before_token = false;
		  this.non_breaking_space = false;
		  this.previous_token_wrapped = false;
		  // initialize
		  this.__add_outputline();
		}

		Output.prototype.__add_outputline = function() {
		  this.previous_line = this.current_line;
		  this.current_line = this.next_line.clone_empty();
		  this.__lines.push(this.current_line);
		};

		Output.prototype.get_line_number = function() {
		  return this.__lines.length;
		};

		Output.prototype.get_indent_string = function(indent, column) {
		  return this.__indent_cache.get_indent_string(indent, column);
		};

		Output.prototype.get_indent_size = function(indent, column) {
		  return this.__indent_cache.get_indent_size(indent, column);
		};

		Output.prototype.is_empty = function() {
		  return !this.previous_line && this.current_line.is_empty();
		};

		Output.prototype.add_new_line = function(force_newline) {
		  // never newline at the start of file
		  // otherwise, newline only if we didn't just add one or we're forced
		  if (this.is_empty() ||
		    (!force_newline && this.just_added_newline())) {
		    return false;
		  }

		  // if raw output is enabled, don't print additional newlines,
		  // but still return True as though you had
		  if (!this.raw) {
		    this.__add_outputline();
		  }
		  return true;
		};

		Output.prototype.get_code = function(eol) {
		  this.trim(true);

		  // handle some edge cases where the last tokens
		  // has text that ends with newline(s)
		  var last_item = this.current_line.pop();
		  if (last_item) {
		    if (last_item[last_item.length - 1] === '\n') {
		      last_item = last_item.replace(/\n+$/g, '');
		    }
		    this.current_line.push(last_item);
		  }

		  if (this._end_with_newline) {
		    this.__add_outputline();
		  }

		  var sweet_code = this.__lines.join('\n');

		  if (eol !== '\n') {
		    sweet_code = sweet_code.replace(/[\n]/g, eol);
		  }
		  return sweet_code;
		};

		Output.prototype.set_wrap_point = function() {
		  this.current_line._set_wrap_point();
		};

		Output.prototype.set_indent = function(indent, alignment) {
		  indent = indent || 0;
		  alignment = alignment || 0;

		  // Next line stores alignment values
		  this.next_line.set_indent(indent, alignment);

		  // Never indent your first output indent at the start of the file
		  if (this.__lines.length > 1) {
		    this.current_line.set_indent(indent, alignment);
		    return true;
		  }

		  this.current_line.set_indent();
		  return false;
		};

		Output.prototype.add_raw_token = function(token) {
		  for (var x = 0; x < token.newlines; x++) {
		    this.__add_outputline();
		  }
		  this.current_line.set_indent(-1);
		  this.current_line.push(token.whitespace_before);
		  this.current_line.push(token.text);
		  this.space_before_token = false;
		  this.non_breaking_space = false;
		  this.previous_token_wrapped = false;
		};

		Output.prototype.add_token = function(printable_token) {
		  this.__add_space_before_token();
		  this.current_line.push(printable_token);
		  this.space_before_token = false;
		  this.non_breaking_space = false;
		  this.previous_token_wrapped = this.current_line._allow_wrap();
		};

		Output.prototype.__add_space_before_token = function() {
		  if (this.space_before_token && !this.just_added_newline()) {
		    if (!this.non_breaking_space) {
		      this.set_wrap_point();
		    }
		    this.current_line.push(' ');
		  }
		};

		Output.prototype.remove_indent = function(index) {
		  var output_length = this.__lines.length;
		  while (index < output_length) {
		    this.__lines[index]._remove_indent();
		    index++;
		  }
		  this.current_line._remove_wrap_indent();
		};

		Output.prototype.trim = function(eat_newlines) {
		  eat_newlines = (eat_newlines === undefined) ? false : eat_newlines;

		  this.current_line.trim();

		  while (eat_newlines && this.__lines.length > 1 &&
		    this.current_line.is_empty()) {
		    this.__lines.pop();
		    this.current_line = this.__lines[this.__lines.length - 1];
		    this.current_line.trim();
		  }

		  this.previous_line = this.__lines.length > 1 ?
		    this.__lines[this.__lines.length - 2] : null;
		};

		Output.prototype.just_added_newline = function() {
		  return this.current_line.is_empty();
		};

		Output.prototype.just_added_blankline = function() {
		  return this.is_empty() ||
		    (this.current_line.is_empty() && this.previous_line.is_empty());
		};

		Output.prototype.ensure_empty_line_above = function(starts_with, ends_with) {
		  var index = this.__lines.length - 2;
		  while (index >= 0) {
		    var potentialEmptyLine = this.__lines[index];
		    if (potentialEmptyLine.is_empty()) {
		      break;
		    } else if (potentialEmptyLine.item(0).indexOf(starts_with) !== 0 &&
		      potentialEmptyLine.item(-1) !== ends_with) {
		      this.__lines.splice(index + 1, 0, new OutputLine(this));
		      this.previous_line = this.__lines[this.__lines.length - 2];
		      break;
		    }
		    index--;
		  }
		};

		output.Output = Output;
		return output;
	}

	var token = {};

	/*jshint node:true */

	var hasRequiredToken;

	function requireToken () {
		if (hasRequiredToken) return token;
		hasRequiredToken = 1;

		function Token(type, text, newlines, whitespace_before) {
		  this.type = type;
		  this.text = text;

		  // comments_before are
		  // comments that have a new line before them
		  // and may or may not have a newline after
		  // this is a set of comments before
		  this.comments_before = null; /* inline comment*/


		  // this.comments_after =  new TokenStream(); // no new line before and newline after
		  this.newlines = newlines || 0;
		  this.whitespace_before = whitespace_before || '';
		  this.parent = null;
		  this.next = null;
		  this.previous = null;
		  this.opened = null;
		  this.closed = null;
		  this.directives = null;
		}


		token.Token = Token;
		return token;
	}

	var acorn = {};

	/* jshint node: true, curly: false */

	var hasRequiredAcorn;

	function requireAcorn () {
		if (hasRequiredAcorn) return acorn;
		hasRequiredAcorn = 1;
		(function (exports) {

			// acorn used char codes to squeeze the last bit of performance out
			// Beautifier is okay without that, so we're using regex
			// permit # (23), $ (36), and @ (64). @ is used in ES7 decorators.
			// 65 through 91 are uppercase letters.
			// permit _ (95).
			// 97 through 123 are lowercase letters.
			var baseASCIIidentifierStartChars = "\\x23\\x24\\x40\\x41-\\x5a\\x5f\\x61-\\x7a";

			// inside an identifier @ is not allowed but 0-9 are.
			var baseASCIIidentifierChars = "\\x24\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a";

			// Big ugly regular expressions that match characters in the
			// whitespace, identifier, and identifier-start categories. These
			// are only applied when a character is found to actually have a
			// code point above 128.
			var nonASCIIidentifierStartChars = "\\xaa\\xb5\\xba\\xc0-\\xd6\\xd8-\\xf6\\xf8-\\u02c1\\u02c6-\\u02d1\\u02e0-\\u02e4\\u02ec\\u02ee\\u0370-\\u0374\\u0376\\u0377\\u037a-\\u037d\\u0386\\u0388-\\u038a\\u038c\\u038e-\\u03a1\\u03a3-\\u03f5\\u03f7-\\u0481\\u048a-\\u0527\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u05d0-\\u05ea\\u05f0-\\u05f2\\u0620-\\u064a\\u066e\\u066f\\u0671-\\u06d3\\u06d5\\u06e5\\u06e6\\u06ee\\u06ef\\u06fa-\\u06fc\\u06ff\\u0710\\u0712-\\u072f\\u074d-\\u07a5\\u07b1\\u07ca-\\u07ea\\u07f4\\u07f5\\u07fa\\u0800-\\u0815\\u081a\\u0824\\u0828\\u0840-\\u0858\\u08a0\\u08a2-\\u08ac\\u0904-\\u0939\\u093d\\u0950\\u0958-\\u0961\\u0971-\\u0977\\u0979-\\u097f\\u0985-\\u098c\\u098f\\u0990\\u0993-\\u09a8\\u09aa-\\u09b0\\u09b2\\u09b6-\\u09b9\\u09bd\\u09ce\\u09dc\\u09dd\\u09df-\\u09e1\\u09f0\\u09f1\\u0a05-\\u0a0a\\u0a0f\\u0a10\\u0a13-\\u0a28\\u0a2a-\\u0a30\\u0a32\\u0a33\\u0a35\\u0a36\\u0a38\\u0a39\\u0a59-\\u0a5c\\u0a5e\\u0a72-\\u0a74\\u0a85-\\u0a8d\\u0a8f-\\u0a91\\u0a93-\\u0aa8\\u0aaa-\\u0ab0\\u0ab2\\u0ab3\\u0ab5-\\u0ab9\\u0abd\\u0ad0\\u0ae0\\u0ae1\\u0b05-\\u0b0c\\u0b0f\\u0b10\\u0b13-\\u0b28\\u0b2a-\\u0b30\\u0b32\\u0b33\\u0b35-\\u0b39\\u0b3d\\u0b5c\\u0b5d\\u0b5f-\\u0b61\\u0b71\\u0b83\\u0b85-\\u0b8a\\u0b8e-\\u0b90\\u0b92-\\u0b95\\u0b99\\u0b9a\\u0b9c\\u0b9e\\u0b9f\\u0ba3\\u0ba4\\u0ba8-\\u0baa\\u0bae-\\u0bb9\\u0bd0\\u0c05-\\u0c0c\\u0c0e-\\u0c10\\u0c12-\\u0c28\\u0c2a-\\u0c33\\u0c35-\\u0c39\\u0c3d\\u0c58\\u0c59\\u0c60\\u0c61\\u0c85-\\u0c8c\\u0c8e-\\u0c90\\u0c92-\\u0ca8\\u0caa-\\u0cb3\\u0cb5-\\u0cb9\\u0cbd\\u0cde\\u0ce0\\u0ce1\\u0cf1\\u0cf2\\u0d05-\\u0d0c\\u0d0e-\\u0d10\\u0d12-\\u0d3a\\u0d3d\\u0d4e\\u0d60\\u0d61\\u0d7a-\\u0d7f\\u0d85-\\u0d96\\u0d9a-\\u0db1\\u0db3-\\u0dbb\\u0dbd\\u0dc0-\\u0dc6\\u0e01-\\u0e30\\u0e32\\u0e33\\u0e40-\\u0e46\\u0e81\\u0e82\\u0e84\\u0e87\\u0e88\\u0e8a\\u0e8d\\u0e94-\\u0e97\\u0e99-\\u0e9f\\u0ea1-\\u0ea3\\u0ea5\\u0ea7\\u0eaa\\u0eab\\u0ead-\\u0eb0\\u0eb2\\u0eb3\\u0ebd\\u0ec0-\\u0ec4\\u0ec6\\u0edc-\\u0edf\\u0f00\\u0f40-\\u0f47\\u0f49-\\u0f6c\\u0f88-\\u0f8c\\u1000-\\u102a\\u103f\\u1050-\\u1055\\u105a-\\u105d\\u1061\\u1065\\u1066\\u106e-\\u1070\\u1075-\\u1081\\u108e\\u10a0-\\u10c5\\u10c7\\u10cd\\u10d0-\\u10fa\\u10fc-\\u1248\\u124a-\\u124d\\u1250-\\u1256\\u1258\\u125a-\\u125d\\u1260-\\u1288\\u128a-\\u128d\\u1290-\\u12b0\\u12b2-\\u12b5\\u12b8-\\u12be\\u12c0\\u12c2-\\u12c5\\u12c8-\\u12d6\\u12d8-\\u1310\\u1312-\\u1315\\u1318-\\u135a\\u1380-\\u138f\\u13a0-\\u13f4\\u1401-\\u166c\\u166f-\\u167f\\u1681-\\u169a\\u16a0-\\u16ea\\u16ee-\\u16f0\\u1700-\\u170c\\u170e-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176c\\u176e-\\u1770\\u1780-\\u17b3\\u17d7\\u17dc\\u1820-\\u1877\\u1880-\\u18a8\\u18aa\\u18b0-\\u18f5\\u1900-\\u191c\\u1950-\\u196d\\u1970-\\u1974\\u1980-\\u19ab\\u19c1-\\u19c7\\u1a00-\\u1a16\\u1a20-\\u1a54\\u1aa7\\u1b05-\\u1b33\\u1b45-\\u1b4b\\u1b83-\\u1ba0\\u1bae\\u1baf\\u1bba-\\u1be5\\u1c00-\\u1c23\\u1c4d-\\u1c4f\\u1c5a-\\u1c7d\\u1ce9-\\u1cec\\u1cee-\\u1cf1\\u1cf5\\u1cf6\\u1d00-\\u1dbf\\u1e00-\\u1f15\\u1f18-\\u1f1d\\u1f20-\\u1f45\\u1f48-\\u1f4d\\u1f50-\\u1f57\\u1f59\\u1f5b\\u1f5d\\u1f5f-\\u1f7d\\u1f80-\\u1fb4\\u1fb6-\\u1fbc\\u1fbe\\u1fc2-\\u1fc4\\u1fc6-\\u1fcc\\u1fd0-\\u1fd3\\u1fd6-\\u1fdb\\u1fe0-\\u1fec\\u1ff2-\\u1ff4\\u1ff6-\\u1ffc\\u2071\\u207f\\u2090-\\u209c\\u2102\\u2107\\u210a-\\u2113\\u2115\\u2119-\\u211d\\u2124\\u2126\\u2128\\u212a-\\u212d\\u212f-\\u2139\\u213c-\\u213f\\u2145-\\u2149\\u214e\\u2160-\\u2188\\u2c00-\\u2c2e\\u2c30-\\u2c5e\\u2c60-\\u2ce4\\u2ceb-\\u2cee\\u2cf2\\u2cf3\\u2d00-\\u2d25\\u2d27\\u2d2d\\u2d30-\\u2d67\\u2d6f\\u2d80-\\u2d96\\u2da0-\\u2da6\\u2da8-\\u2dae\\u2db0-\\u2db6\\u2db8-\\u2dbe\\u2dc0-\\u2dc6\\u2dc8-\\u2dce\\u2dd0-\\u2dd6\\u2dd8-\\u2dde\\u2e2f\\u3005-\\u3007\\u3021-\\u3029\\u3031-\\u3035\\u3038-\\u303c\\u3041-\\u3096\\u309d-\\u309f\\u30a1-\\u30fa\\u30fc-\\u30ff\\u3105-\\u312d\\u3131-\\u318e\\u31a0-\\u31ba\\u31f0-\\u31ff\\u3400-\\u4db5\\u4e00-\\u9fcc\\ua000-\\ua48c\\ua4d0-\\ua4fd\\ua500-\\ua60c\\ua610-\\ua61f\\ua62a\\ua62b\\ua640-\\ua66e\\ua67f-\\ua697\\ua6a0-\\ua6ef\\ua717-\\ua71f\\ua722-\\ua788\\ua78b-\\ua78e\\ua790-\\ua793\\ua7a0-\\ua7aa\\ua7f8-\\ua801\\ua803-\\ua805\\ua807-\\ua80a\\ua80c-\\ua822\\ua840-\\ua873\\ua882-\\ua8b3\\ua8f2-\\ua8f7\\ua8fb\\ua90a-\\ua925\\ua930-\\ua946\\ua960-\\ua97c\\ua984-\\ua9b2\\ua9cf\\uaa00-\\uaa28\\uaa40-\\uaa42\\uaa44-\\uaa4b\\uaa60-\\uaa76\\uaa7a\\uaa80-\\uaaaf\\uaab1\\uaab5\\uaab6\\uaab9-\\uaabd\\uaac0\\uaac2\\uaadb-\\uaadd\\uaae0-\\uaaea\\uaaf2-\\uaaf4\\uab01-\\uab06\\uab09-\\uab0e\\uab11-\\uab16\\uab20-\\uab26\\uab28-\\uab2e\\uabc0-\\uabe2\\uac00-\\ud7a3\\ud7b0-\\ud7c6\\ud7cb-\\ud7fb\\uf900-\\ufa6d\\ufa70-\\ufad9\\ufb00-\\ufb06\\ufb13-\\ufb17\\ufb1d\\ufb1f-\\ufb28\\ufb2a-\\ufb36\\ufb38-\\ufb3c\\ufb3e\\ufb40\\ufb41\\ufb43\\ufb44\\ufb46-\\ufbb1\\ufbd3-\\ufd3d\\ufd50-\\ufd8f\\ufd92-\\ufdc7\\ufdf0-\\ufdfb\\ufe70-\\ufe74\\ufe76-\\ufefc\\uff21-\\uff3a\\uff41-\\uff5a\\uff66-\\uffbe\\uffc2-\\uffc7\\uffca-\\uffcf\\uffd2-\\uffd7\\uffda-\\uffdc";
			var nonASCIIidentifierChars = "\\u0300-\\u036f\\u0483-\\u0487\\u0591-\\u05bd\\u05bf\\u05c1\\u05c2\\u05c4\\u05c5\\u05c7\\u0610-\\u061a\\u0620-\\u0649\\u0672-\\u06d3\\u06e7-\\u06e8\\u06fb-\\u06fc\\u0730-\\u074a\\u0800-\\u0814\\u081b-\\u0823\\u0825-\\u0827\\u0829-\\u082d\\u0840-\\u0857\\u08e4-\\u08fe\\u0900-\\u0903\\u093a-\\u093c\\u093e-\\u094f\\u0951-\\u0957\\u0962-\\u0963\\u0966-\\u096f\\u0981-\\u0983\\u09bc\\u09be-\\u09c4\\u09c7\\u09c8\\u09d7\\u09df-\\u09e0\\u0a01-\\u0a03\\u0a3c\\u0a3e-\\u0a42\\u0a47\\u0a48\\u0a4b-\\u0a4d\\u0a51\\u0a66-\\u0a71\\u0a75\\u0a81-\\u0a83\\u0abc\\u0abe-\\u0ac5\\u0ac7-\\u0ac9\\u0acb-\\u0acd\\u0ae2-\\u0ae3\\u0ae6-\\u0aef\\u0b01-\\u0b03\\u0b3c\\u0b3e-\\u0b44\\u0b47\\u0b48\\u0b4b-\\u0b4d\\u0b56\\u0b57\\u0b5f-\\u0b60\\u0b66-\\u0b6f\\u0b82\\u0bbe-\\u0bc2\\u0bc6-\\u0bc8\\u0bca-\\u0bcd\\u0bd7\\u0be6-\\u0bef\\u0c01-\\u0c03\\u0c46-\\u0c48\\u0c4a-\\u0c4d\\u0c55\\u0c56\\u0c62-\\u0c63\\u0c66-\\u0c6f\\u0c82\\u0c83\\u0cbc\\u0cbe-\\u0cc4\\u0cc6-\\u0cc8\\u0cca-\\u0ccd\\u0cd5\\u0cd6\\u0ce2-\\u0ce3\\u0ce6-\\u0cef\\u0d02\\u0d03\\u0d46-\\u0d48\\u0d57\\u0d62-\\u0d63\\u0d66-\\u0d6f\\u0d82\\u0d83\\u0dca\\u0dcf-\\u0dd4\\u0dd6\\u0dd8-\\u0ddf\\u0df2\\u0df3\\u0e34-\\u0e3a\\u0e40-\\u0e45\\u0e50-\\u0e59\\u0eb4-\\u0eb9\\u0ec8-\\u0ecd\\u0ed0-\\u0ed9\\u0f18\\u0f19\\u0f20-\\u0f29\\u0f35\\u0f37\\u0f39\\u0f41-\\u0f47\\u0f71-\\u0f84\\u0f86-\\u0f87\\u0f8d-\\u0f97\\u0f99-\\u0fbc\\u0fc6\\u1000-\\u1029\\u1040-\\u1049\\u1067-\\u106d\\u1071-\\u1074\\u1082-\\u108d\\u108f-\\u109d\\u135d-\\u135f\\u170e-\\u1710\\u1720-\\u1730\\u1740-\\u1750\\u1772\\u1773\\u1780-\\u17b2\\u17dd\\u17e0-\\u17e9\\u180b-\\u180d\\u1810-\\u1819\\u1920-\\u192b\\u1930-\\u193b\\u1951-\\u196d\\u19b0-\\u19c0\\u19c8-\\u19c9\\u19d0-\\u19d9\\u1a00-\\u1a15\\u1a20-\\u1a53\\u1a60-\\u1a7c\\u1a7f-\\u1a89\\u1a90-\\u1a99\\u1b46-\\u1b4b\\u1b50-\\u1b59\\u1b6b-\\u1b73\\u1bb0-\\u1bb9\\u1be6-\\u1bf3\\u1c00-\\u1c22\\u1c40-\\u1c49\\u1c5b-\\u1c7d\\u1cd0-\\u1cd2\\u1d00-\\u1dbe\\u1e01-\\u1f15\\u200c\\u200d\\u203f\\u2040\\u2054\\u20d0-\\u20dc\\u20e1\\u20e5-\\u20f0\\u2d81-\\u2d96\\u2de0-\\u2dff\\u3021-\\u3028\\u3099\\u309a\\ua640-\\ua66d\\ua674-\\ua67d\\ua69f\\ua6f0-\\ua6f1\\ua7f8-\\ua800\\ua806\\ua80b\\ua823-\\ua827\\ua880-\\ua881\\ua8b4-\\ua8c4\\ua8d0-\\ua8d9\\ua8f3-\\ua8f7\\ua900-\\ua909\\ua926-\\ua92d\\ua930-\\ua945\\ua980-\\ua983\\ua9b3-\\ua9c0\\uaa00-\\uaa27\\uaa40-\\uaa41\\uaa4c-\\uaa4d\\uaa50-\\uaa59\\uaa7b\\uaae0-\\uaae9\\uaaf2-\\uaaf3\\uabc0-\\uabe1\\uabec\\uabed\\uabf0-\\uabf9\\ufb20-\\ufb28\\ufe00-\\ufe0f\\ufe20-\\ufe26\\ufe33\\ufe34\\ufe4d-\\ufe4f\\uff10-\\uff19\\uff3f";
			//var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
			//var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

			var unicodeEscapeOrCodePoint = "\\\\u[0-9a-fA-F]{4}|\\\\u\\{[0-9a-fA-F]+\\}";
			var identifierStart = "(?:" + unicodeEscapeOrCodePoint + "|[" + baseASCIIidentifierStartChars + nonASCIIidentifierStartChars + "])";
			var identifierChars = "(?:" + unicodeEscapeOrCodePoint + "|[" + baseASCIIidentifierChars + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "])*";

			exports.identifier = new RegExp(identifierStart + identifierChars, 'g');
			exports.identifierStart = new RegExp(identifierStart);
			exports.identifierMatch = new RegExp("(?:" + unicodeEscapeOrCodePoint + "|[" + baseASCIIidentifierChars + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "])+");

			// Whether a single character denotes a newline.

			exports.newline = /[\n\r\u2028\u2029]/;

			// Matches a whole line break (where CRLF is considered a single
			// line break). Used to count lines.

			// in javascript, these two differ
			// in python they are the same, different methods are called on them
			exports.lineBreak = new RegExp('\r\n|' + exports.newline.source);
			exports.allLineBreaks = new RegExp(exports.lineBreak.source, 'g'); 
		} (acorn));
		return acorn;
	}

	var options$3 = {};

	var options$2 = {};

	/*jshint node:true */

	var hasRequiredOptions$3;

	function requireOptions$3 () {
		if (hasRequiredOptions$3) return options$2;
		hasRequiredOptions$3 = 1;

		function Options(options, merge_child_field) {
		  this.raw_options = _mergeOpts(options, merge_child_field);

		  // Support passing the source text back with no change
		  this.disabled = this._get_boolean('disabled');

		  this.eol = this._get_characters('eol', 'auto');
		  this.end_with_newline = this._get_boolean('end_with_newline');
		  this.indent_size = this._get_number('indent_size', 4);
		  this.indent_char = this._get_characters('indent_char', ' ');
		  this.indent_level = this._get_number('indent_level');

		  this.preserve_newlines = this._get_boolean('preserve_newlines', true);
		  this.max_preserve_newlines = this._get_number('max_preserve_newlines', 32786);
		  if (!this.preserve_newlines) {
		    this.max_preserve_newlines = 0;
		  }

		  this.indent_with_tabs = this._get_boolean('indent_with_tabs', this.indent_char === '\t');
		  if (this.indent_with_tabs) {
		    this.indent_char = '\t';

		    // indent_size behavior changed after 1.8.6
		    // It used to be that indent_size would be
		    // set to 1 for indent_with_tabs. That is no longer needed and
		    // actually doesn't make sense - why not use spaces? Further,
		    // that might produce unexpected behavior - tabs being used
		    // for single-column alignment. So, when indent_with_tabs is true
		    // and indent_size is 1, reset indent_size to 4.
		    if (this.indent_size === 1) {
		      this.indent_size = 4;
		    }
		  }

		  // Backwards compat with 1.3.x
		  this.wrap_line_length = this._get_number('wrap_line_length', this._get_number('max_char'));

		  this.indent_empty_lines = this._get_boolean('indent_empty_lines');

		  // valid templating languages ['django', 'erb', 'handlebars', 'php', 'smarty', 'angular']
		  // For now, 'auto' = all off for javascript, all except angular on for html (and inline javascript/css).
		  // other values ignored
		  this.templating = this._get_selection_list('templating', ['auto', 'none', 'angular', 'django', 'erb', 'handlebars', 'php', 'smarty'], ['auto']);
		}

		Options.prototype._get_array = function(name, default_value) {
		  var option_value = this.raw_options[name];
		  var result = default_value || [];
		  if (typeof option_value === 'object') {
		    if (option_value !== null && typeof option_value.concat === 'function') {
		      result = option_value.concat();
		    }
		  } else if (typeof option_value === 'string') {
		    result = option_value.split(/[^a-zA-Z0-9_\/\-]+/);
		  }
		  return result;
		};

		Options.prototype._get_boolean = function(name, default_value) {
		  var option_value = this.raw_options[name];
		  var result = option_value === undefined ? !!default_value : !!option_value;
		  return result;
		};

		Options.prototype._get_characters = function(name, default_value) {
		  var option_value = this.raw_options[name];
		  var result = default_value || '';
		  if (typeof option_value === 'string') {
		    result = option_value.replace(/\\r/, '\r').replace(/\\n/, '\n').replace(/\\t/, '\t');
		  }
		  return result;
		};

		Options.prototype._get_number = function(name, default_value) {
		  var option_value = this.raw_options[name];
		  default_value = parseInt(default_value, 10);
		  if (isNaN(default_value)) {
		    default_value = 0;
		  }
		  var result = parseInt(option_value, 10);
		  if (isNaN(result)) {
		    result = default_value;
		  }
		  return result;
		};

		Options.prototype._get_selection = function(name, selection_list, default_value) {
		  var result = this._get_selection_list(name, selection_list, default_value);
		  if (result.length !== 1) {
		    throw new Error(
		      "Invalid Option Value: The option '" + name + "' can only be one of the following values:\n" +
		      selection_list + "\nYou passed in: '" + this.raw_options[name] + "'");
		  }

		  return result[0];
		};


		Options.prototype._get_selection_list = function(name, selection_list, default_value) {
		  if (!selection_list || selection_list.length === 0) {
		    throw new Error("Selection list cannot be empty.");
		  }

		  default_value = default_value || [selection_list[0]];
		  if (!this._is_valid_selection(default_value, selection_list)) {
		    throw new Error("Invalid Default Value!");
		  }

		  var result = this._get_array(name, default_value);
		  if (!this._is_valid_selection(result, selection_list)) {
		    throw new Error(
		      "Invalid Option Value: The option '" + name + "' can contain only the following values:\n" +
		      selection_list + "\nYou passed in: '" + this.raw_options[name] + "'");
		  }

		  return result;
		};

		Options.prototype._is_valid_selection = function(result, selection_list) {
		  return result.length && selection_list.length &&
		    !result.some(function(item) { return selection_list.indexOf(item) === -1; });
		};


		// merges child options up with the parent options object
		// Example: obj = {a: 1, b: {a: 2}}
		//          mergeOpts(obj, 'b')
		//
		//          Returns: {a: 2}
		function _mergeOpts(allOptions, childFieldName) {
		  var finalOpts = {};
		  allOptions = _normalizeOpts(allOptions);
		  var name;

		  for (name in allOptions) {
		    if (name !== childFieldName) {
		      finalOpts[name] = allOptions[name];
		    }
		  }

		  //merge in the per type settings for the childFieldName
		  if (childFieldName && allOptions[childFieldName]) {
		    for (name in allOptions[childFieldName]) {
		      finalOpts[name] = allOptions[childFieldName][name];
		    }
		  }
		  return finalOpts;
		}

		function _normalizeOpts(options) {
		  var convertedOpts = {};
		  var key;

		  for (key in options) {
		    var newKey = key.replace(/-/g, "_");
		    convertedOpts[newKey] = options[key];
		  }
		  return convertedOpts;
		}

		options$2.Options = Options;
		options$2.normalizeOpts = _normalizeOpts;
		options$2.mergeOpts = _mergeOpts;
		return options$2;
	}

	/*jshint node:true */

	var hasRequiredOptions$2;

	function requireOptions$2 () {
		if (hasRequiredOptions$2) return options$3;
		hasRequiredOptions$2 = 1;

		var BaseOptions = requireOptions$3().Options;

		var validPositionValues = ['before-newline', 'after-newline', 'preserve-newline'];

		function Options(options) {
		  BaseOptions.call(this, options, 'js');

		  // compatibility, re
		  var raw_brace_style = this.raw_options.brace_style || null;
		  if (raw_brace_style === "expand-strict") { //graceful handling of deprecated option
		    this.raw_options.brace_style = "expand";
		  } else if (raw_brace_style === "collapse-preserve-inline") { //graceful handling of deprecated option
		    this.raw_options.brace_style = "collapse,preserve-inline";
		  } else if (this.raw_options.braces_on_own_line !== undefined) { //graceful handling of deprecated option
		    this.raw_options.brace_style = this.raw_options.braces_on_own_line ? "expand" : "collapse";
		    // } else if (!raw_brace_style) { //Nothing exists to set it
		    //   raw_brace_style = "collapse";
		  }

		  //preserve-inline in delimited string will trigger brace_preserve_inline, everything
		  //else is considered a brace_style and the last one only will have an effect

		  var brace_style_split = this._get_selection_list('brace_style', ['collapse', 'expand', 'end-expand', 'none', 'preserve-inline']);

		  this.brace_preserve_inline = false; //Defaults in case one or other was not specified in meta-option
		  this.brace_style = "collapse";

		  for (var bs = 0; bs < brace_style_split.length; bs++) {
		    if (brace_style_split[bs] === "preserve-inline") {
		      this.brace_preserve_inline = true;
		    } else {
		      this.brace_style = brace_style_split[bs];
		    }
		  }

		  this.unindent_chained_methods = this._get_boolean('unindent_chained_methods');
		  this.break_chained_methods = this._get_boolean('break_chained_methods');
		  this.space_in_paren = this._get_boolean('space_in_paren');
		  this.space_in_empty_paren = this._get_boolean('space_in_empty_paren');
		  this.jslint_happy = this._get_boolean('jslint_happy');
		  this.space_after_anon_function = this._get_boolean('space_after_anon_function');
		  this.space_after_named_function = this._get_boolean('space_after_named_function');
		  this.keep_array_indentation = this._get_boolean('keep_array_indentation');
		  this.space_before_conditional = this._get_boolean('space_before_conditional', true);
		  this.unescape_strings = this._get_boolean('unescape_strings');
		  this.e4x = this._get_boolean('e4x');
		  this.comma_first = this._get_boolean('comma_first');
		  this.operator_position = this._get_selection('operator_position', validPositionValues);

		  // For testing of beautify preserve:start directive
		  this.test_output_raw = this._get_boolean('test_output_raw');

		  // force this._options.space_after_anon_function to true if this._options.jslint_happy
		  if (this.jslint_happy) {
		    this.space_after_anon_function = true;
		  }

		}
		Options.prototype = new BaseOptions();



		options$3.Options = Options;
		return options$3;
	}

	var tokenizer$2 = {};

	var inputscanner = {};

	/*jshint node:true */

	var hasRequiredInputscanner;

	function requireInputscanner () {
		if (hasRequiredInputscanner) return inputscanner;
		hasRequiredInputscanner = 1;

		var regexp_has_sticky = RegExp.prototype.hasOwnProperty('sticky');

		function InputScanner(input_string) {
		  this.__input = input_string || '';
		  this.__input_length = this.__input.length;
		  this.__position = 0;
		}

		InputScanner.prototype.restart = function() {
		  this.__position = 0;
		};

		InputScanner.prototype.back = function() {
		  if (this.__position > 0) {
		    this.__position -= 1;
		  }
		};

		InputScanner.prototype.hasNext = function() {
		  return this.__position < this.__input_length;
		};

		InputScanner.prototype.next = function() {
		  var val = null;
		  if (this.hasNext()) {
		    val = this.__input.charAt(this.__position);
		    this.__position += 1;
		  }
		  return val;
		};

		InputScanner.prototype.peek = function(index) {
		  var val = null;
		  index = index || 0;
		  index += this.__position;
		  if (index >= 0 && index < this.__input_length) {
		    val = this.__input.charAt(index);
		  }
		  return val;
		};

		// This is a JavaScript only helper function (not in python)
		// Javascript doesn't have a match method
		// and not all implementation support "sticky" flag.
		// If they do not support sticky then both this.match() and this.test() method
		// must get the match and check the index of the match.
		// If sticky is supported and set, this method will use it.
		// Otherwise it will check that global is set, and fall back to the slower method.
		InputScanner.prototype.__match = function(pattern, index) {
		  pattern.lastIndex = index;
		  var pattern_match = pattern.exec(this.__input);

		  if (pattern_match && !(regexp_has_sticky && pattern.sticky)) {
		    if (pattern_match.index !== index) {
		      pattern_match = null;
		    }
		  }

		  return pattern_match;
		};

		InputScanner.prototype.test = function(pattern, index) {
		  index = index || 0;
		  index += this.__position;

		  if (index >= 0 && index < this.__input_length) {
		    return !!this.__match(pattern, index);
		  } else {
		    return false;
		  }
		};

		InputScanner.prototype.testChar = function(pattern, index) {
		  // test one character regex match
		  var val = this.peek(index);
		  pattern.lastIndex = 0;
		  return val !== null && pattern.test(val);
		};

		InputScanner.prototype.match = function(pattern) {
		  var pattern_match = this.__match(pattern, this.__position);
		  if (pattern_match) {
		    this.__position += pattern_match[0].length;
		  } else {
		    pattern_match = null;
		  }
		  return pattern_match;
		};

		InputScanner.prototype.read = function(starting_pattern, until_pattern, until_after) {
		  var val = '';
		  var match;
		  if (starting_pattern) {
		    match = this.match(starting_pattern);
		    if (match) {
		      val += match[0];
		    }
		  }
		  if (until_pattern && (match || !starting_pattern)) {
		    val += this.readUntil(until_pattern, until_after);
		  }
		  return val;
		};

		InputScanner.prototype.readUntil = function(pattern, until_after) {
		  var val = '';
		  var match_index = this.__position;
		  pattern.lastIndex = this.__position;
		  var pattern_match = pattern.exec(this.__input);
		  if (pattern_match) {
		    match_index = pattern_match.index;
		    if (until_after) {
		      match_index += pattern_match[0].length;
		    }
		  } else {
		    match_index = this.__input_length;
		  }

		  val = this.__input.substring(this.__position, match_index);
		  this.__position = match_index;
		  return val;
		};

		InputScanner.prototype.readUntilAfter = function(pattern) {
		  return this.readUntil(pattern, true);
		};

		InputScanner.prototype.get_regexp = function(pattern, match_from) {
		  var result = null;
		  var flags = 'g';
		  if (match_from && regexp_has_sticky) {
		    flags = 'y';
		  }
		  // strings are converted to regexp
		  if (typeof pattern === "string" && pattern !== '') {
		    // result = new RegExp(pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), flags);
		    result = new RegExp(pattern, flags);
		  } else if (pattern) {
		    result = new RegExp(pattern.source, flags);
		  }
		  return result;
		};

		InputScanner.prototype.get_literal_regexp = function(literal_string) {
		  return RegExp(literal_string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
		};

		/* css beautifier legacy helpers */
		InputScanner.prototype.peekUntilAfter = function(pattern) {
		  var start = this.__position;
		  var val = this.readUntilAfter(pattern);
		  this.__position = start;
		  return val;
		};

		InputScanner.prototype.lookBack = function(testVal) {
		  var start = this.__position - 1;
		  return start >= testVal.length && this.__input.substring(start - testVal.length, start)
		    .toLowerCase() === testVal;
		};

		inputscanner.InputScanner = InputScanner;
		return inputscanner;
	}

	var tokenizer$1 = {};

	var tokenstream = {};

	/*jshint node:true */

	var hasRequiredTokenstream;

	function requireTokenstream () {
		if (hasRequiredTokenstream) return tokenstream;
		hasRequiredTokenstream = 1;

		function TokenStream(parent_token) {
		  // private
		  this.__tokens = [];
		  this.__tokens_length = this.__tokens.length;
		  this.__position = 0;
		  this.__parent_token = parent_token;
		}

		TokenStream.prototype.restart = function() {
		  this.__position = 0;
		};

		TokenStream.prototype.isEmpty = function() {
		  return this.__tokens_length === 0;
		};

		TokenStream.prototype.hasNext = function() {
		  return this.__position < this.__tokens_length;
		};

		TokenStream.prototype.next = function() {
		  var val = null;
		  if (this.hasNext()) {
		    val = this.__tokens[this.__position];
		    this.__position += 1;
		  }
		  return val;
		};

		TokenStream.prototype.peek = function(index) {
		  var val = null;
		  index = index || 0;
		  index += this.__position;
		  if (index >= 0 && index < this.__tokens_length) {
		    val = this.__tokens[index];
		  }
		  return val;
		};

		TokenStream.prototype.add = function(token) {
		  if (this.__parent_token) {
		    token.parent = this.__parent_token;
		  }
		  this.__tokens.push(token);
		  this.__tokens_length += 1;
		};

		tokenstream.TokenStream = TokenStream;
		return tokenstream;
	}

	var whitespacepattern = {};

	var pattern = {};

	/*jshint node:true */

	var hasRequiredPattern;

	function requirePattern () {
		if (hasRequiredPattern) return pattern;
		hasRequiredPattern = 1;

		function Pattern(input_scanner, parent) {
		  this._input = input_scanner;
		  this._starting_pattern = null;
		  this._match_pattern = null;
		  this._until_pattern = null;
		  this._until_after = false;

		  if (parent) {
		    this._starting_pattern = this._input.get_regexp(parent._starting_pattern, true);
		    this._match_pattern = this._input.get_regexp(parent._match_pattern, true);
		    this._until_pattern = this._input.get_regexp(parent._until_pattern);
		    this._until_after = parent._until_after;
		  }
		}

		Pattern.prototype.read = function() {
		  var result = this._input.read(this._starting_pattern);
		  if (!this._starting_pattern || result) {
		    result += this._input.read(this._match_pattern, this._until_pattern, this._until_after);
		  }
		  return result;
		};

		Pattern.prototype.read_match = function() {
		  return this._input.match(this._match_pattern);
		};

		Pattern.prototype.until_after = function(pattern) {
		  var result = this._create();
		  result._until_after = true;
		  result._until_pattern = this._input.get_regexp(pattern);
		  result._update();
		  return result;
		};

		Pattern.prototype.until = function(pattern) {
		  var result = this._create();
		  result._until_after = false;
		  result._until_pattern = this._input.get_regexp(pattern);
		  result._update();
		  return result;
		};

		Pattern.prototype.starting_with = function(pattern) {
		  var result = this._create();
		  result._starting_pattern = this._input.get_regexp(pattern, true);
		  result._update();
		  return result;
		};

		Pattern.prototype.matching = function(pattern) {
		  var result = this._create();
		  result._match_pattern = this._input.get_regexp(pattern, true);
		  result._update();
		  return result;
		};

		Pattern.prototype._create = function() {
		  return new Pattern(this._input, this);
		};

		Pattern.prototype._update = function() {};

		pattern.Pattern = Pattern;
		return pattern;
	}

	/*jshint node:true */

	var hasRequiredWhitespacepattern;

	function requireWhitespacepattern () {
		if (hasRequiredWhitespacepattern) return whitespacepattern;
		hasRequiredWhitespacepattern = 1;

		var Pattern = requirePattern().Pattern;

		function WhitespacePattern(input_scanner, parent) {
		  Pattern.call(this, input_scanner, parent);
		  if (parent) {
		    this._line_regexp = this._input.get_regexp(parent._line_regexp);
		  } else {
		    this.__set_whitespace_patterns('', '');
		  }

		  this.newline_count = 0;
		  this.whitespace_before_token = '';
		}
		WhitespacePattern.prototype = new Pattern();

		WhitespacePattern.prototype.__set_whitespace_patterns = function(whitespace_chars, newline_chars) {
		  whitespace_chars += '\\t ';
		  newline_chars += '\\n\\r';

		  this._match_pattern = this._input.get_regexp(
		    '[' + whitespace_chars + newline_chars + ']+', true);
		  this._newline_regexp = this._input.get_regexp(
		    '\\r\\n|[' + newline_chars + ']');
		};

		WhitespacePattern.prototype.read = function() {
		  this.newline_count = 0;
		  this.whitespace_before_token = '';

		  var resulting_string = this._input.read(this._match_pattern);
		  if (resulting_string === ' ') {
		    this.whitespace_before_token = ' ';
		  } else if (resulting_string) {
		    var matches = this.__split(this._newline_regexp, resulting_string);
		    this.newline_count = matches.length - 1;
		    this.whitespace_before_token = matches[this.newline_count];
		  }

		  return resulting_string;
		};

		WhitespacePattern.prototype.matching = function(whitespace_chars, newline_chars) {
		  var result = this._create();
		  result.__set_whitespace_patterns(whitespace_chars, newline_chars);
		  result._update();
		  return result;
		};

		WhitespacePattern.prototype._create = function() {
		  return new WhitespacePattern(this._input, this);
		};

		WhitespacePattern.prototype.__split = function(regexp, input_string) {
		  regexp.lastIndex = 0;
		  var start_index = 0;
		  var result = [];
		  var next_match = regexp.exec(input_string);
		  while (next_match) {
		    result.push(input_string.substring(start_index, next_match.index));
		    start_index = next_match.index + next_match[0].length;
		    next_match = regexp.exec(input_string);
		  }

		  if (start_index < input_string.length) {
		    result.push(input_string.substring(start_index, input_string.length));
		  } else {
		    result.push('');
		  }

		  return result;
		};



		whitespacepattern.WhitespacePattern = WhitespacePattern;
		return whitespacepattern;
	}

	/*jshint node:true */

	var hasRequiredTokenizer$2;

	function requireTokenizer$2 () {
		if (hasRequiredTokenizer$2) return tokenizer$1;
		hasRequiredTokenizer$2 = 1;

		var InputScanner = requireInputscanner().InputScanner;
		var Token = requireToken().Token;
		var TokenStream = requireTokenstream().TokenStream;
		var WhitespacePattern = requireWhitespacepattern().WhitespacePattern;

		var TOKEN = {
		  START: 'TK_START',
		  RAW: 'TK_RAW',
		  EOF: 'TK_EOF'
		};

		var Tokenizer = function(input_string, options) {
		  this._input = new InputScanner(input_string);
		  this._options = options || {};
		  this.__tokens = null;

		  this._patterns = {};
		  this._patterns.whitespace = new WhitespacePattern(this._input);
		};

		Tokenizer.prototype.tokenize = function() {
		  this._input.restart();
		  this.__tokens = new TokenStream();

		  this._reset();

		  var current;
		  var previous = new Token(TOKEN.START, '');
		  var open_token = null;
		  var open_stack = [];
		  var comments = new TokenStream();

		  while (previous.type !== TOKEN.EOF) {
		    current = this._get_next_token(previous, open_token);
		    while (this._is_comment(current)) {
		      comments.add(current);
		      current = this._get_next_token(previous, open_token);
		    }

		    if (!comments.isEmpty()) {
		      current.comments_before = comments;
		      comments = new TokenStream();
		    }

		    current.parent = open_token;

		    if (this._is_opening(current)) {
		      open_stack.push(open_token);
		      open_token = current;
		    } else if (open_token && this._is_closing(current, open_token)) {
		      current.opened = open_token;
		      open_token.closed = current;
		      open_token = open_stack.pop();
		      current.parent = open_token;
		    }

		    current.previous = previous;
		    previous.next = current;

		    this.__tokens.add(current);
		    previous = current;
		  }

		  return this.__tokens;
		};


		Tokenizer.prototype._is_first_token = function() {
		  return this.__tokens.isEmpty();
		};

		Tokenizer.prototype._reset = function() {};

		Tokenizer.prototype._get_next_token = function(previous_token, open_token) { // jshint unused:false
		  this._readWhitespace();
		  var resulting_string = this._input.read(/.+/g);
		  if (resulting_string) {
		    return this._create_token(TOKEN.RAW, resulting_string);
		  } else {
		    return this._create_token(TOKEN.EOF, '');
		  }
		};

		Tokenizer.prototype._is_comment = function(current_token) { // jshint unused:false
		  return false;
		};

		Tokenizer.prototype._is_opening = function(current_token) { // jshint unused:false
		  return false;
		};

		Tokenizer.prototype._is_closing = function(current_token, open_token) { // jshint unused:false
		  return false;
		};

		Tokenizer.prototype._create_token = function(type, text) {
		  var token = new Token(type, text,
		    this._patterns.whitespace.newline_count,
		    this._patterns.whitespace.whitespace_before_token);
		  return token;
		};

		Tokenizer.prototype._readWhitespace = function() {
		  return this._patterns.whitespace.read();
		};



		tokenizer$1.Tokenizer = Tokenizer;
		tokenizer$1.TOKEN = TOKEN;
		return tokenizer$1;
	}

	var directives = {};

	/*jshint node:true */

	var hasRequiredDirectives;

	function requireDirectives () {
		if (hasRequiredDirectives) return directives;
		hasRequiredDirectives = 1;

		function Directives(start_block_pattern, end_block_pattern) {
		  start_block_pattern = typeof start_block_pattern === 'string' ? start_block_pattern : start_block_pattern.source;
		  end_block_pattern = typeof end_block_pattern === 'string' ? end_block_pattern : end_block_pattern.source;
		  this.__directives_block_pattern = new RegExp(start_block_pattern + / beautify( \w+[:]\w+)+ /.source + end_block_pattern, 'g');
		  this.__directive_pattern = / (\w+)[:](\w+)/g;

		  this.__directives_end_ignore_pattern = new RegExp(start_block_pattern + /\sbeautify\signore:end\s/.source + end_block_pattern, 'g');
		}

		Directives.prototype.get_directives = function(text) {
		  if (!text.match(this.__directives_block_pattern)) {
		    return null;
		  }

		  var directives = {};
		  this.__directive_pattern.lastIndex = 0;
		  var directive_match = this.__directive_pattern.exec(text);

		  while (directive_match) {
		    directives[directive_match[1]] = directive_match[2];
		    directive_match = this.__directive_pattern.exec(text);
		  }

		  return directives;
		};

		Directives.prototype.readIgnored = function(input) {
		  return input.readUntilAfter(this.__directives_end_ignore_pattern);
		};


		directives.Directives = Directives;
		return directives;
	}

	var templatablepattern = {};

	/*jshint node:true */

	var hasRequiredTemplatablepattern;

	function requireTemplatablepattern () {
		if (hasRequiredTemplatablepattern) return templatablepattern;
		hasRequiredTemplatablepattern = 1;

		var Pattern = requirePattern().Pattern;


		var template_names = {
		  django: false,
		  erb: false,
		  handlebars: false,
		  php: false,
		  smarty: false,
		  angular: false
		};

		// This lets templates appear anywhere we would do a readUntil
		// The cost is higher but it is pay to play.
		function TemplatablePattern(input_scanner, parent) {
		  Pattern.call(this, input_scanner, parent);
		  this.__template_pattern = null;
		  this._disabled = Object.assign({}, template_names);
		  this._excluded = Object.assign({}, template_names);

		  if (parent) {
		    this.__template_pattern = this._input.get_regexp(parent.__template_pattern);
		    this._excluded = Object.assign(this._excluded, parent._excluded);
		    this._disabled = Object.assign(this._disabled, parent._disabled);
		  }
		  var pattern = new Pattern(input_scanner);
		  this.__patterns = {
		    handlebars_comment: pattern.starting_with(/{{!--/).until_after(/--}}/),
		    handlebars_unescaped: pattern.starting_with(/{{{/).until_after(/}}}/),
		    handlebars: pattern.starting_with(/{{/).until_after(/}}/),
		    php: pattern.starting_with(/<\?(?:[= ]|php)/).until_after(/\?>/),
		    erb: pattern.starting_with(/<%[^%]/).until_after(/[^%]%>/),
		    // django coflicts with handlebars a bit.
		    django: pattern.starting_with(/{%/).until_after(/%}/),
		    django_value: pattern.starting_with(/{{/).until_after(/}}/),
		    django_comment: pattern.starting_with(/{#/).until_after(/#}/),
		    smarty: pattern.starting_with(/{(?=[^}{\s\n])/).until_after(/[^\s\n]}/),
		    smarty_comment: pattern.starting_with(/{\*/).until_after(/\*}/),
		    smarty_literal: pattern.starting_with(/{literal}/).until_after(/{\/literal}/)
		  };
		}
		TemplatablePattern.prototype = new Pattern();

		TemplatablePattern.prototype._create = function() {
		  return new TemplatablePattern(this._input, this);
		};

		TemplatablePattern.prototype._update = function() {
		  this.__set_templated_pattern();
		};

		TemplatablePattern.prototype.disable = function(language) {
		  var result = this._create();
		  result._disabled[language] = true;
		  result._update();
		  return result;
		};

		TemplatablePattern.prototype.read_options = function(options) {
		  var result = this._create();
		  for (var language in template_names) {
		    result._disabled[language] = options.templating.indexOf(language) === -1;
		  }
		  result._update();
		  return result;
		};

		TemplatablePattern.prototype.exclude = function(language) {
		  var result = this._create();
		  result._excluded[language] = true;
		  result._update();
		  return result;
		};

		TemplatablePattern.prototype.read = function() {
		  var result = '';
		  if (this._match_pattern) {
		    result = this._input.read(this._starting_pattern);
		  } else {
		    result = this._input.read(this._starting_pattern, this.__template_pattern);
		  }
		  var next = this._read_template();
		  while (next) {
		    if (this._match_pattern) {
		      next += this._input.read(this._match_pattern);
		    } else {
		      next += this._input.readUntil(this.__template_pattern);
		    }
		    result += next;
		    next = this._read_template();
		  }

		  if (this._until_after) {
		    result += this._input.readUntilAfter(this._until_pattern);
		  }
		  return result;
		};

		TemplatablePattern.prototype.__set_templated_pattern = function() {
		  var items = [];

		  if (!this._disabled.php) {
		    items.push(this.__patterns.php._starting_pattern.source);
		  }
		  if (!this._disabled.handlebars) {
		    items.push(this.__patterns.handlebars._starting_pattern.source);
		  }
		  if (!this._disabled.angular) {
		    // Handlebars ('{{' and '}}') are also special tokens in Angular)
		    items.push(this.__patterns.handlebars._starting_pattern.source);
		  }
		  if (!this._disabled.erb) {
		    items.push(this.__patterns.erb._starting_pattern.source);
		  }
		  if (!this._disabled.django) {
		    items.push(this.__patterns.django._starting_pattern.source);
		    // The starting pattern for django is more complex because it has different
		    // patterns for value, comment, and other sections
		    items.push(this.__patterns.django_value._starting_pattern.source);
		    items.push(this.__patterns.django_comment._starting_pattern.source);
		  }
		  if (!this._disabled.smarty) {
		    items.push(this.__patterns.smarty._starting_pattern.source);
		  }

		  if (this._until_pattern) {
		    items.push(this._until_pattern.source);
		  }
		  this.__template_pattern = this._input.get_regexp('(?:' + items.join('|') + ')');
		};

		TemplatablePattern.prototype._read_template = function() {
		  var resulting_string = '';
		  var c = this._input.peek();
		  if (c === '<') {
		    var peek1 = this._input.peek(1);
		    //if we're in a comment, do something special
		    // We treat all comments as literals, even more than preformatted tags
		    // we just look for the appropriate close tag
		    if (!this._disabled.php && !this._excluded.php && peek1 === '?') {
		      resulting_string = resulting_string ||
		        this.__patterns.php.read();
		    }
		    if (!this._disabled.erb && !this._excluded.erb && peek1 === '%') {
		      resulting_string = resulting_string ||
		        this.__patterns.erb.read();
		    }
		  } else if (c === '{') {
		    if (!this._disabled.handlebars && !this._excluded.handlebars) {
		      resulting_string = resulting_string ||
		        this.__patterns.handlebars_comment.read();
		      resulting_string = resulting_string ||
		        this.__patterns.handlebars_unescaped.read();
		      resulting_string = resulting_string ||
		        this.__patterns.handlebars.read();
		    }
		    if (!this._disabled.django) {
		      // django coflicts with handlebars a bit.
		      if (!this._excluded.django && !this._excluded.handlebars) {
		        resulting_string = resulting_string ||
		          this.__patterns.django_value.read();
		      }
		      if (!this._excluded.django) {
		        resulting_string = resulting_string ||
		          this.__patterns.django_comment.read();
		        resulting_string = resulting_string ||
		          this.__patterns.django.read();
		      }
		    }
		    if (!this._disabled.smarty) {
		      // smarty cannot be enabled with django or handlebars enabled
		      if (this._disabled.django && this._disabled.handlebars) {
		        resulting_string = resulting_string ||
		          this.__patterns.smarty_comment.read();
		        resulting_string = resulting_string ||
		          this.__patterns.smarty_literal.read();
		        resulting_string = resulting_string ||
		          this.__patterns.smarty.read();
		      }
		    }
		  }
		  return resulting_string;
		};


		templatablepattern.TemplatablePattern = TemplatablePattern;
		return templatablepattern;
	}

	/*jshint node:true */

	var hasRequiredTokenizer$1;

	function requireTokenizer$1 () {
		if (hasRequiredTokenizer$1) return tokenizer$2;
		hasRequiredTokenizer$1 = 1;

		var InputScanner = requireInputscanner().InputScanner;
		var BaseTokenizer = requireTokenizer$2().Tokenizer;
		var BASETOKEN = requireTokenizer$2().TOKEN;
		var Directives = requireDirectives().Directives;
		var acorn = requireAcorn();
		var Pattern = requirePattern().Pattern;
		var TemplatablePattern = requireTemplatablepattern().TemplatablePattern;


		function in_array(what, arr) {
		  return arr.indexOf(what) !== -1;
		}


		var TOKEN = {
		  START_EXPR: 'TK_START_EXPR',
		  END_EXPR: 'TK_END_EXPR',
		  START_BLOCK: 'TK_START_BLOCK',
		  END_BLOCK: 'TK_END_BLOCK',
		  WORD: 'TK_WORD',
		  RESERVED: 'TK_RESERVED',
		  SEMICOLON: 'TK_SEMICOLON',
		  STRING: 'TK_STRING',
		  EQUALS: 'TK_EQUALS',
		  OPERATOR: 'TK_OPERATOR',
		  COMMA: 'TK_COMMA',
		  BLOCK_COMMENT: 'TK_BLOCK_COMMENT',
		  COMMENT: 'TK_COMMENT',
		  DOT: 'TK_DOT',
		  UNKNOWN: 'TK_UNKNOWN',
		  START: BASETOKEN.START,
		  RAW: BASETOKEN.RAW,
		  EOF: BASETOKEN.EOF
		};


		var directives_core = new Directives(/\/\*/, /\*\//);

		var number_pattern = /0[xX][0123456789abcdefABCDEF_]*n?|0[oO][01234567_]*n?|0[bB][01_]*n?|\d[\d_]*n|(?:\.\d[\d_]*|\d[\d_]*\.?[\d_]*)(?:[eE][+-]?[\d_]+)?/;

		var digit = /[0-9]/;

		// Dot "." must be distinguished from "..." and decimal
		var dot_pattern = /[^\d\.]/;

		var positionable_operators = (
		  ">>> === !== &&= ??= ||= " +
		  "<< && >= ** != == <= >> || ?? |> " +
		  "< / - + > : & % ? ^ | *").split(' ');

		// IMPORTANT: this must be sorted longest to shortest or tokenizing many not work.
		// Also, you must update possitionable operators separately from punct
		var punct =
		  ">>>= " +
		  "... >>= <<= === >>> !== **= &&= ??= ||= " +
		  "=> ^= :: /= << <= == && -= >= >> != -- += ** || ?? ++ %= &= *= |= |> " +
		  "= ! ? > < : / ^ - + * & % ~ |";

		punct = punct.replace(/[-[\]{}()*+?.,\\^$|#]/g, "\\$&");
		// ?. but not if followed by a number 
		punct = '\\?\\.(?!\\d) ' + punct;
		punct = punct.replace(/ /g, '|');

		var punct_pattern = new RegExp(punct);

		// words which should always start on new line.
		var line_starters = 'continue,try,throw,return,var,let,const,if,switch,case,default,for,while,break,function,import,export'.split(',');
		var reserved_words = line_starters.concat(['do', 'in', 'of', 'else', 'get', 'set', 'new', 'catch', 'finally', 'typeof', 'yield', 'async', 'await', 'from', 'as', 'class', 'extends']);
		var reserved_word_pattern = new RegExp('^(?:' + reserved_words.join('|') + ')$');

		// var template_pattern = /(?:(?:<\?php|<\?=)[\s\S]*?\?>)|(?:<%[\s\S]*?%>)/g;

		var in_html_comment;

		var Tokenizer = function(input_string, options) {
		  BaseTokenizer.call(this, input_string, options);

		  this._patterns.whitespace = this._patterns.whitespace.matching(
		    /\u00A0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff/.source,
		    /\u2028\u2029/.source);

		  var pattern_reader = new Pattern(this._input);
		  var templatable = new TemplatablePattern(this._input)
		    .read_options(this._options);

		  this.__patterns = {
		    template: templatable,
		    identifier: templatable.starting_with(acorn.identifier).matching(acorn.identifierMatch),
		    number: pattern_reader.matching(number_pattern),
		    punct: pattern_reader.matching(punct_pattern),
		    // comment ends just before nearest linefeed or end of file
		    comment: pattern_reader.starting_with(/\/\//).until(/[\n\r\u2028\u2029]/),
		    //  /* ... */ comment ends with nearest */ or end of file
		    block_comment: pattern_reader.starting_with(/\/\*/).until_after(/\*\//),
		    html_comment_start: pattern_reader.matching(/<!--/),
		    html_comment_end: pattern_reader.matching(/-->/),
		    include: pattern_reader.starting_with(/#include/).until_after(acorn.lineBreak),
		    shebang: pattern_reader.starting_with(/#!/).until_after(acorn.lineBreak),
		    xml: pattern_reader.matching(/[\s\S]*?<(\/?)([-a-zA-Z:0-9_.]+|{[^}]+?}|!\[CDATA\[[^\]]*?\]\]|)(\s*{[^}]+?}|\s+[-a-zA-Z:0-9_.]+|\s+[-a-zA-Z:0-9_.]+\s*=\s*('[^']*'|"[^"]*"|{([^{}]|{[^}]+?})+?}))*\s*(\/?)\s*>/),
		    single_quote: templatable.until(/['\\\n\r\u2028\u2029]/),
		    double_quote: templatable.until(/["\\\n\r\u2028\u2029]/),
		    template_text: templatable.until(/[`\\$]/),
		    template_expression: templatable.until(/[`}\\]/)
		  };

		};
		Tokenizer.prototype = new BaseTokenizer();

		Tokenizer.prototype._is_comment = function(current_token) {
		  return current_token.type === TOKEN.COMMENT || current_token.type === TOKEN.BLOCK_COMMENT || current_token.type === TOKEN.UNKNOWN;
		};

		Tokenizer.prototype._is_opening = function(current_token) {
		  return current_token.type === TOKEN.START_BLOCK || current_token.type === TOKEN.START_EXPR;
		};

		Tokenizer.prototype._is_closing = function(current_token, open_token) {
		  return (current_token.type === TOKEN.END_BLOCK || current_token.type === TOKEN.END_EXPR) &&
		    (open_token && (
		      (current_token.text === ']' && open_token.text === '[') ||
		      (current_token.text === ')' && open_token.text === '(') ||
		      (current_token.text === '}' && open_token.text === '{')));
		};

		Tokenizer.prototype._reset = function() {
		  in_html_comment = false;
		};

		Tokenizer.prototype._get_next_token = function(previous_token, open_token) { // jshint unused:false
		  var token = null;
		  this._readWhitespace();
		  var c = this._input.peek();

		  if (c === null) {
		    return this._create_token(TOKEN.EOF, '');
		  }

		  token = token || this._read_non_javascript(c);
		  token = token || this._read_string(c);
		  token = token || this._read_pair(c, this._input.peek(1)); // Issue #2062 hack for record type '#{'
		  token = token || this._read_word(previous_token);
		  token = token || this._read_singles(c);
		  token = token || this._read_comment(c);
		  token = token || this._read_regexp(c, previous_token);
		  token = token || this._read_xml(c, previous_token);
		  token = token || this._read_punctuation();
		  token = token || this._create_token(TOKEN.UNKNOWN, this._input.next());

		  return token;
		};

		Tokenizer.prototype._read_word = function(previous_token) {
		  var resulting_string;
		  resulting_string = this.__patterns.identifier.read();
		  if (resulting_string !== '') {
		    resulting_string = resulting_string.replace(acorn.allLineBreaks, '\n');
		    if (!(previous_token.type === TOKEN.DOT ||
		        (previous_token.type === TOKEN.RESERVED && (previous_token.text === 'set' || previous_token.text === 'get'))) &&
		      reserved_word_pattern.test(resulting_string)) {
		      if ((resulting_string === 'in' || resulting_string === 'of') &&
		        (previous_token.type === TOKEN.WORD || previous_token.type === TOKEN.STRING)) { // hack for 'in' and 'of' operators
		        return this._create_token(TOKEN.OPERATOR, resulting_string);
		      }
		      return this._create_token(TOKEN.RESERVED, resulting_string);
		    }
		    return this._create_token(TOKEN.WORD, resulting_string);
		  }

		  resulting_string = this.__patterns.number.read();
		  if (resulting_string !== '') {
		    return this._create_token(TOKEN.WORD, resulting_string);
		  }
		};

		Tokenizer.prototype._read_singles = function(c) {
		  var token = null;
		  if (c === '(' || c === '[') {
		    token = this._create_token(TOKEN.START_EXPR, c);
		  } else if (c === ')' || c === ']') {
		    token = this._create_token(TOKEN.END_EXPR, c);
		  } else if (c === '{') {
		    token = this._create_token(TOKEN.START_BLOCK, c);
		  } else if (c === '}') {
		    token = this._create_token(TOKEN.END_BLOCK, c);
		  } else if (c === ';') {
		    token = this._create_token(TOKEN.SEMICOLON, c);
		  } else if (c === '.' && dot_pattern.test(this._input.peek(1))) {
		    token = this._create_token(TOKEN.DOT, c);
		  } else if (c === ',') {
		    token = this._create_token(TOKEN.COMMA, c);
		  }

		  if (token) {
		    this._input.next();
		  }
		  return token;
		};

		Tokenizer.prototype._read_pair = function(c, d) {
		  var token = null;
		  if (c === '#' && d === '{') {
		    token = this._create_token(TOKEN.START_BLOCK, c + d);
		  }

		  if (token) {
		    this._input.next();
		    this._input.next();
		  }
		  return token;
		};

		Tokenizer.prototype._read_punctuation = function() {
		  var resulting_string = this.__patterns.punct.read();

		  if (resulting_string !== '') {
		    if (resulting_string === '=') {
		      return this._create_token(TOKEN.EQUALS, resulting_string);
		    } else if (resulting_string === '?.') {
		      return this._create_token(TOKEN.DOT, resulting_string);
		    } else {
		      return this._create_token(TOKEN.OPERATOR, resulting_string);
		    }
		  }
		};

		Tokenizer.prototype._read_non_javascript = function(c) {
		  var resulting_string = '';

		  if (c === '#') {
		    if (this._is_first_token()) {
		      resulting_string = this.__patterns.shebang.read();

		      if (resulting_string) {
		        return this._create_token(TOKEN.UNKNOWN, resulting_string.trim() + '\n');
		      }
		    }

		    // handles extendscript #includes
		    resulting_string = this.__patterns.include.read();

		    if (resulting_string) {
		      return this._create_token(TOKEN.UNKNOWN, resulting_string.trim() + '\n');
		    }

		    c = this._input.next();

		    // Spidermonkey-specific sharp variables for circular references. Considered obsolete.
		    var sharp = '#';
		    if (this._input.hasNext() && this._input.testChar(digit)) {
		      do {
		        c = this._input.next();
		        sharp += c;
		      } while (this._input.hasNext() && c !== '#' && c !== '=');
		      if (c === '#') ; else if (this._input.peek() === '[' && this._input.peek(1) === ']') {
		        sharp += '[]';
		        this._input.next();
		        this._input.next();
		      } else if (this._input.peek() === '{' && this._input.peek(1) === '}') {
		        sharp += '{}';
		        this._input.next();
		        this._input.next();
		      }
		      return this._create_token(TOKEN.WORD, sharp);
		    }

		    this._input.back();

		  } else if (c === '<' && this._is_first_token()) {
		    resulting_string = this.__patterns.html_comment_start.read();
		    if (resulting_string) {
		      while (this._input.hasNext() && !this._input.testChar(acorn.newline)) {
		        resulting_string += this._input.next();
		      }
		      in_html_comment = true;
		      return this._create_token(TOKEN.COMMENT, resulting_string);
		    }
		  } else if (in_html_comment && c === '-') {
		    resulting_string = this.__patterns.html_comment_end.read();
		    if (resulting_string) {
		      in_html_comment = false;
		      return this._create_token(TOKEN.COMMENT, resulting_string);
		    }
		  }

		  return null;
		};

		Tokenizer.prototype._read_comment = function(c) {
		  var token = null;
		  if (c === '/') {
		    var comment = '';
		    if (this._input.peek(1) === '*') {
		      // peek for comment /* ... */
		      comment = this.__patterns.block_comment.read();
		      var directives = directives_core.get_directives(comment);
		      if (directives && directives.ignore === 'start') {
		        comment += directives_core.readIgnored(this._input);
		      }
		      comment = comment.replace(acorn.allLineBreaks, '\n');
		      token = this._create_token(TOKEN.BLOCK_COMMENT, comment);
		      token.directives = directives;
		    } else if (this._input.peek(1) === '/') {
		      // peek for comment // ...
		      comment = this.__patterns.comment.read();
		      token = this._create_token(TOKEN.COMMENT, comment);
		    }
		  }
		  return token;
		};

		Tokenizer.prototype._read_string = function(c) {
		  if (c === '`' || c === "'" || c === '"') {
		    var resulting_string = this._input.next();
		    this.has_char_escapes = false;

		    if (c === '`') {
		      resulting_string += this._read_string_recursive('`', true, '${');
		    } else {
		      resulting_string += this._read_string_recursive(c);
		    }

		    if (this.has_char_escapes && this._options.unescape_strings) {
		      resulting_string = unescape_string(resulting_string);
		    }

		    if (this._input.peek() === c) {
		      resulting_string += this._input.next();
		    }

		    resulting_string = resulting_string.replace(acorn.allLineBreaks, '\n');

		    return this._create_token(TOKEN.STRING, resulting_string);
		  }

		  return null;
		};

		Tokenizer.prototype._allow_regexp_or_xml = function(previous_token) {
		  // regex and xml can only appear in specific locations during parsing
		  return (previous_token.type === TOKEN.RESERVED && in_array(previous_token.text, ['return', 'case', 'throw', 'else', 'do', 'typeof', 'yield'])) ||
		    (previous_token.type === TOKEN.END_EXPR && previous_token.text === ')' &&
		      previous_token.opened && previous_token.opened.previous.type === TOKEN.RESERVED && in_array(previous_token.opened.previous.text, ['if', 'while', 'for'])) ||
		    (in_array(previous_token.type, [TOKEN.COMMENT, TOKEN.START_EXPR, TOKEN.START_BLOCK, TOKEN.START,
		      TOKEN.END_BLOCK, TOKEN.OPERATOR, TOKEN.EQUALS, TOKEN.EOF, TOKEN.SEMICOLON, TOKEN.COMMA
		    ]));
		};

		Tokenizer.prototype._read_regexp = function(c, previous_token) {

		  if (c === '/' && this._allow_regexp_or_xml(previous_token)) {
		    // handle regexp
		    //
		    var resulting_string = this._input.next();
		    var esc = false;

		    var in_char_class = false;
		    while (this._input.hasNext() &&
		      ((esc || in_char_class || this._input.peek() !== c) &&
		        !this._input.testChar(acorn.newline))) {
		      resulting_string += this._input.peek();
		      if (!esc) {
		        esc = this._input.peek() === '\\';
		        if (this._input.peek() === '[') {
		          in_char_class = true;
		        } else if (this._input.peek() === ']') {
		          in_char_class = false;
		        }
		      } else {
		        esc = false;
		      }
		      this._input.next();
		    }

		    if (this._input.peek() === c) {
		      resulting_string += this._input.next();

		      // regexps may have modifiers /regexp/MOD , so fetch those, too
		      // Only [gim] are valid, but if the user puts in garbage, do what we can to take it.
		      resulting_string += this._input.read(acorn.identifier);
		    }
		    return this._create_token(TOKEN.STRING, resulting_string);
		  }
		  return null;
		};

		Tokenizer.prototype._read_xml = function(c, previous_token) {

		  if (this._options.e4x && c === "<" && this._allow_regexp_or_xml(previous_token)) {
		    var xmlStr = '';
		    var match = this.__patterns.xml.read_match();
		    // handle e4x xml literals
		    //
		    if (match) {
		      // Trim root tag to attempt to
		      var rootTag = match[2].replace(/^{\s+/, '{').replace(/\s+}$/, '}');
		      var isCurlyRoot = rootTag.indexOf('{') === 0;
		      var depth = 0;
		      while (match) {
		        var isEndTag = !!match[1];
		        var tagName = match[2];
		        var isSingletonTag = (!!match[match.length - 1]) || (tagName.slice(0, 8) === "![CDATA[");
		        if (!isSingletonTag &&
		          (tagName === rootTag || (isCurlyRoot && tagName.replace(/^{\s+/, '{').replace(/\s+}$/, '}')))) {
		          if (isEndTag) {
		            --depth;
		          } else {
		            ++depth;
		          }
		        }
		        xmlStr += match[0];
		        if (depth <= 0) {
		          break;
		        }
		        match = this.__patterns.xml.read_match();
		      }
		      // if we didn't close correctly, keep unformatted.
		      if (!match) {
		        xmlStr += this._input.match(/[\s\S]*/g)[0];
		      }
		      xmlStr = xmlStr.replace(acorn.allLineBreaks, '\n');
		      return this._create_token(TOKEN.STRING, xmlStr);
		    }
		  }

		  return null;
		};

		function unescape_string(s) {
		  // You think that a regex would work for this
		  // return s.replace(/\\x([0-9a-f]{2})/gi, function(match, val) {
		  //         return String.fromCharCode(parseInt(val, 16));
		  //     })
		  // However, dealing with '\xff', '\\xff', '\\\xff' makes this more fun.
		  var out = '',
		    escaped = 0;

		  var input_scan = new InputScanner(s);
		  var matched = null;

		  while (input_scan.hasNext()) {
		    // Keep any whitespace, non-slash characters
		    // also keep slash pairs.
		    matched = input_scan.match(/([\s]|[^\\]|\\\\)+/g);

		    if (matched) {
		      out += matched[0];
		    }

		    if (input_scan.peek() === '\\') {
		      input_scan.next();
		      if (input_scan.peek() === 'x') {
		        matched = input_scan.match(/x([0-9A-Fa-f]{2})/g);
		      } else if (input_scan.peek() === 'u') {
		        matched = input_scan.match(/u([0-9A-Fa-f]{4})/g);
		        if (!matched) {
		          matched = input_scan.match(/u\{([0-9A-Fa-f]+)\}/g);
		        }
		      } else {
		        out += '\\';
		        if (input_scan.hasNext()) {
		          out += input_scan.next();
		        }
		        continue;
		      }

		      // If there's some error decoding, return the original string
		      if (!matched) {
		        return s;
		      }

		      escaped = parseInt(matched[1], 16);

		      if (escaped > 0x7e && escaped <= 0xff && matched[0].indexOf('x') === 0) {
		        // we bail out on \x7f..\xff,
		        // leaving whole string escaped,
		        // as it's probably completely binary
		        return s;
		      } else if (escaped >= 0x00 && escaped < 0x20) {
		        // leave 0x00...0x1f escaped
		        out += '\\' + matched[0];
		      } else if (escaped > 0x10FFFF) {
		        // If the escape sequence is out of bounds, keep the original sequence and continue conversion
		        out += '\\' + matched[0];
		      } else if (escaped === 0x22 || escaped === 0x27 || escaped === 0x5c) {
		        // single-quote, apostrophe, backslash - escape these
		        out += '\\' + String.fromCharCode(escaped);
		      } else {
		        out += String.fromCharCode(escaped);
		      }
		    }
		  }

		  return out;
		}

		// handle string
		//
		Tokenizer.prototype._read_string_recursive = function(delimiter, allow_unescaped_newlines, start_sub) {
		  var current_char;
		  var pattern;
		  if (delimiter === '\'') {
		    pattern = this.__patterns.single_quote;
		  } else if (delimiter === '"') {
		    pattern = this.__patterns.double_quote;
		  } else if (delimiter === '`') {
		    pattern = this.__patterns.template_text;
		  } else if (delimiter === '}') {
		    pattern = this.__patterns.template_expression;
		  }

		  var resulting_string = pattern.read();
		  var next = '';
		  while (this._input.hasNext()) {
		    next = this._input.next();
		    if (next === delimiter ||
		      (!allow_unescaped_newlines && acorn.newline.test(next))) {
		      this._input.back();
		      break;
		    } else if (next === '\\' && this._input.hasNext()) {
		      current_char = this._input.peek();

		      if (current_char === 'x' || current_char === 'u') {
		        this.has_char_escapes = true;
		      } else if (current_char === '\r' && this._input.peek(1) === '\n') {
		        this._input.next();
		      }
		      next += this._input.next();
		    } else if (start_sub) {
		      if (start_sub === '${' && next === '$' && this._input.peek() === '{') {
		        next += this._input.next();
		      }

		      if (start_sub === next) {
		        if (delimiter === '`') {
		          next += this._read_string_recursive('}', allow_unescaped_newlines, '`');
		        } else {
		          next += this._read_string_recursive('`', allow_unescaped_newlines, '${');
		        }
		        if (this._input.hasNext()) {
		          next += this._input.next();
		        }
		      }
		    }
		    next += pattern.read();
		    resulting_string += next;
		  }

		  return resulting_string;
		};

		tokenizer$2.Tokenizer = Tokenizer;
		tokenizer$2.TOKEN = TOKEN;
		tokenizer$2.positionable_operators = positionable_operators.slice();
		tokenizer$2.line_starters = line_starters.slice();
		return tokenizer$2;
	}

	/*jshint node:true */

	var hasRequiredBeautifier$2;

	function requireBeautifier$2 () {
		if (hasRequiredBeautifier$2) return beautifier$2;
		hasRequiredBeautifier$2 = 1;

		var Output = requireOutput().Output;
		var Token = requireToken().Token;
		var acorn = requireAcorn();
		var Options = requireOptions$2().Options;
		var Tokenizer = requireTokenizer$1().Tokenizer;
		var line_starters = requireTokenizer$1().line_starters;
		var positionable_operators = requireTokenizer$1().positionable_operators;
		var TOKEN = requireTokenizer$1().TOKEN;


		function in_array(what, arr) {
		  return arr.indexOf(what) !== -1;
		}

		function ltrim(s) {
		  return s.replace(/^\s+/g, '');
		}

		function generateMapFromStrings(list) {
		  var result = {};
		  for (var x = 0; x < list.length; x++) {
		    // make the mapped names underscored instead of dash
		    result[list[x].replace(/-/g, '_')] = list[x];
		  }
		  return result;
		}

		function reserved_word(token, word) {
		  return token && token.type === TOKEN.RESERVED && token.text === word;
		}

		function reserved_array(token, words) {
		  return token && token.type === TOKEN.RESERVED && in_array(token.text, words);
		}
		// Unsure of what they mean, but they work. Worth cleaning up in future.
		var special_words = ['case', 'return', 'do', 'if', 'throw', 'else', 'await', 'break', 'continue', 'async'];

		var validPositionValues = ['before-newline', 'after-newline', 'preserve-newline'];

		// Generate map from array
		var OPERATOR_POSITION = generateMapFromStrings(validPositionValues);

		var OPERATOR_POSITION_BEFORE_OR_PRESERVE = [OPERATOR_POSITION.before_newline, OPERATOR_POSITION.preserve_newline];

		var MODE = {
		  BlockStatement: 'BlockStatement', // 'BLOCK'
		  Statement: 'Statement', // 'STATEMENT'
		  ObjectLiteral: 'ObjectLiteral', // 'OBJECT',
		  ArrayLiteral: 'ArrayLiteral', //'[EXPRESSION]',
		  ForInitializer: 'ForInitializer', //'(FOR-EXPRESSION)',
		  Conditional: 'Conditional', //'(COND-EXPRESSION)',
		  Expression: 'Expression' //'(EXPRESSION)'
		};

		function remove_redundant_indentation(output, frame) {
		  // This implementation is effective but has some issues:
		  //     - can cause line wrap to happen too soon due to indent removal
		  //           after wrap points are calculated
		  // These issues are minor compared to ugly indentation.

		  if (frame.multiline_frame ||
		    frame.mode === MODE.ForInitializer ||
		    frame.mode === MODE.Conditional) {
		    return;
		  }

		  // remove one indent from each line inside this section
		  output.remove_indent(frame.start_line_index);
		}

		// we could use just string.split, but
		// IE doesn't like returning empty strings
		function split_linebreaks(s) {
		  //return s.split(/\x0d\x0a|\x0a/);

		  s = s.replace(acorn.allLineBreaks, '\n');
		  var out = [];
		  var start = 0;
		  var idx = s.indexOf("\n", start);
		  while (idx !== -1) {
		    out.push(s.substring(start, idx));
		    start = idx + 1;
		    idx = s.indexOf("\n", start);
		  }
		  if (start < s.length) {
		    out.push(s.substring(start));
		  }
		  return out;
		}

		function is_array(mode) {
		  return mode === MODE.ArrayLiteral;
		}

		function is_expression(mode) {
		  return in_array(mode, [MODE.Expression, MODE.ForInitializer, MODE.Conditional]);
		}

		function all_lines_start_with(lines, c) {
		  for (var i = 0; i < lines.length; i++) {
		    var line = lines[i].trim();
		    if (line.charAt(0) !== c) {
		      return false;
		    }
		  }
		  return true;
		}

		function each_line_matches_indent(lines, indent) {
		  var i = 0,
		    len = lines.length,
		    line;
		  for (; i < len; i++) {
		    line = lines[i];
		    // allow empty lines to pass through
		    if (line && line.indexOf(indent) !== 0) {
		      return false;
		    }
		  }
		  return true;
		}


		function Beautifier(source_text, options) {
		  options = options || {};
		  this._source_text = source_text || '';

		  this._output = null;
		  this._tokens = null;
		  this._last_last_text = null;
		  this._flags = null;
		  this._previous_flags = null;

		  this._flag_store = null;
		  this._options = new Options(options);
		}

		Beautifier.prototype.create_flags = function(flags_base, mode) {
		  var next_indent_level = 0;
		  if (flags_base) {
		    next_indent_level = flags_base.indentation_level;
		    if (!this._output.just_added_newline() &&
		      flags_base.line_indent_level > next_indent_level) {
		      next_indent_level = flags_base.line_indent_level;
		    }
		  }

		  var next_flags = {
		    mode: mode,
		    parent: flags_base,
		    last_token: flags_base ? flags_base.last_token : new Token(TOKEN.START_BLOCK, ''), // last token text
		    last_word: flags_base ? flags_base.last_word : '', // last TOKEN.WORD passed
		    declaration_statement: false,
		    declaration_assignment: false,
		    multiline_frame: false,
		    inline_frame: false,
		    if_block: false,
		    else_block: false,
		    class_start_block: false, // class A { INSIDE HERE } or class B extends C { INSIDE HERE }
		    do_block: false,
		    do_while: false,
		    import_block: false,
		    in_case_statement: false, // switch(..){ INSIDE HERE }
		    in_case: false, // we're on the exact line with "case 0:"
		    case_body: false, // the indented case-action block
		    case_block: false, // the indented case-action block is wrapped with {}
		    indentation_level: next_indent_level,
		    alignment: 0,
		    line_indent_level: flags_base ? flags_base.line_indent_level : next_indent_level,
		    start_line_index: this._output.get_line_number(),
		    ternary_depth: 0
		  };
		  return next_flags;
		};

		Beautifier.prototype._reset = function(source_text) {
		  var baseIndentString = source_text.match(/^[\t ]*/)[0];

		  this._last_last_text = ''; // pre-last token text
		  this._output = new Output(this._options, baseIndentString);

		  // If testing the ignore directive, start with output disable set to true
		  this._output.raw = this._options.test_output_raw;


		  // Stack of parsing/formatting states, including MODE.
		  // We tokenize, parse, and output in an almost purely a forward-only stream of token input
		  // and formatted output.  This makes the beautifier less accurate than full parsers
		  // but also far more tolerant of syntax errors.
		  //
		  // For example, the default mode is MODE.BlockStatement. If we see a '{' we push a new frame of type
		  // MODE.BlockStatement on the the stack, even though it could be object literal.  If we later
		  // encounter a ":", we'll switch to to MODE.ObjectLiteral.  If we then see a ";",
		  // most full parsers would die, but the beautifier gracefully falls back to
		  // MODE.BlockStatement and continues on.
		  this._flag_store = [];
		  this.set_mode(MODE.BlockStatement);
		  var tokenizer = new Tokenizer(source_text, this._options);
		  this._tokens = tokenizer.tokenize();
		  return source_text;
		};

		Beautifier.prototype.beautify = function() {
		  // if disabled, return the input unchanged.
		  if (this._options.disabled) {
		    return this._source_text;
		  }

		  var sweet_code;
		  var source_text = this._reset(this._source_text);

		  var eol = this._options.eol;
		  if (this._options.eol === 'auto') {
		    eol = '\n';
		    if (source_text && acorn.lineBreak.test(source_text || '')) {
		      eol = source_text.match(acorn.lineBreak)[0];
		    }
		  }

		  var current_token = this._tokens.next();
		  while (current_token) {
		    this.handle_token(current_token);

		    this._last_last_text = this._flags.last_token.text;
		    this._flags.last_token = current_token;

		    current_token = this._tokens.next();
		  }

		  sweet_code = this._output.get_code(eol);

		  return sweet_code;
		};

		Beautifier.prototype.handle_token = function(current_token, preserve_statement_flags) {
		  if (current_token.type === TOKEN.START_EXPR) {
		    this.handle_start_expr(current_token);
		  } else if (current_token.type === TOKEN.END_EXPR) {
		    this.handle_end_expr(current_token);
		  } else if (current_token.type === TOKEN.START_BLOCK) {
		    this.handle_start_block(current_token);
		  } else if (current_token.type === TOKEN.END_BLOCK) {
		    this.handle_end_block(current_token);
		  } else if (current_token.type === TOKEN.WORD) {
		    this.handle_word(current_token);
		  } else if (current_token.type === TOKEN.RESERVED) {
		    this.handle_word(current_token);
		  } else if (current_token.type === TOKEN.SEMICOLON) {
		    this.handle_semicolon(current_token);
		  } else if (current_token.type === TOKEN.STRING) {
		    this.handle_string(current_token);
		  } else if (current_token.type === TOKEN.EQUALS) {
		    this.handle_equals(current_token);
		  } else if (current_token.type === TOKEN.OPERATOR) {
		    this.handle_operator(current_token);
		  } else if (current_token.type === TOKEN.COMMA) {
		    this.handle_comma(current_token);
		  } else if (current_token.type === TOKEN.BLOCK_COMMENT) {
		    this.handle_block_comment(current_token, preserve_statement_flags);
		  } else if (current_token.type === TOKEN.COMMENT) {
		    this.handle_comment(current_token, preserve_statement_flags);
		  } else if (current_token.type === TOKEN.DOT) {
		    this.handle_dot(current_token);
		  } else if (current_token.type === TOKEN.EOF) {
		    this.handle_eof(current_token);
		  } else if (current_token.type === TOKEN.UNKNOWN) {
		    this.handle_unknown(current_token, preserve_statement_flags);
		  } else {
		    this.handle_unknown(current_token, preserve_statement_flags);
		  }
		};

		Beautifier.prototype.handle_whitespace_and_comments = function(current_token, preserve_statement_flags) {
		  var newlines = current_token.newlines;
		  var keep_whitespace = this._options.keep_array_indentation && is_array(this._flags.mode);

		  if (current_token.comments_before) {
		    var comment_token = current_token.comments_before.next();
		    while (comment_token) {
		      // The cleanest handling of inline comments is to treat them as though they aren't there.
		      // Just continue formatting and the behavior should be logical.
		      // Also ignore unknown tokens.  Again, this should result in better behavior.
		      this.handle_whitespace_and_comments(comment_token, preserve_statement_flags);
		      this.handle_token(comment_token, preserve_statement_flags);
		      comment_token = current_token.comments_before.next();
		    }
		  }

		  if (keep_whitespace) {
		    for (var i = 0; i < newlines; i += 1) {
		      this.print_newline(i > 0, preserve_statement_flags);
		    }
		  } else {
		    if (this._options.max_preserve_newlines && newlines > this._options.max_preserve_newlines) {
		      newlines = this._options.max_preserve_newlines;
		    }

		    if (this._options.preserve_newlines) {
		      if (newlines > 1) {
		        this.print_newline(false, preserve_statement_flags);
		        for (var j = 1; j < newlines; j += 1) {
		          this.print_newline(true, preserve_statement_flags);
		        }
		      }
		    }
		  }

		};

		var newline_restricted_tokens = ['async', 'break', 'continue', 'return', 'throw', 'yield'];

		Beautifier.prototype.allow_wrap_or_preserved_newline = function(current_token, force_linewrap) {
		  force_linewrap = (force_linewrap === undefined) ? false : force_linewrap;

		  // Never wrap the first token on a line
		  if (this._output.just_added_newline()) {
		    return;
		  }

		  var shouldPreserveOrForce = (this._options.preserve_newlines && current_token.newlines) || force_linewrap;
		  var operatorLogicApplies = in_array(this._flags.last_token.text, positionable_operators) ||
		    in_array(current_token.text, positionable_operators);

		  if (operatorLogicApplies) {
		    var shouldPrintOperatorNewline = (
		        in_array(this._flags.last_token.text, positionable_operators) &&
		        in_array(this._options.operator_position, OPERATOR_POSITION_BEFORE_OR_PRESERVE)
		      ) ||
		      in_array(current_token.text, positionable_operators);
		    shouldPreserveOrForce = shouldPreserveOrForce && shouldPrintOperatorNewline;
		  }

		  if (shouldPreserveOrForce) {
		    this.print_newline(false, true);
		  } else if (this._options.wrap_line_length) {
		    if (reserved_array(this._flags.last_token, newline_restricted_tokens)) {
		      // These tokens should never have a newline inserted
		      // between them and the following expression.
		      return;
		    }
		    this._output.set_wrap_point();
		  }
		};

		Beautifier.prototype.print_newline = function(force_newline, preserve_statement_flags) {
		  if (!preserve_statement_flags) {
		    if (this._flags.last_token.text !== ';' && this._flags.last_token.text !== ',' && this._flags.last_token.text !== '=' && (this._flags.last_token.type !== TOKEN.OPERATOR || this._flags.last_token.text === '--' || this._flags.last_token.text === '++')) {
		      var next_token = this._tokens.peek();
		      while (this._flags.mode === MODE.Statement &&
		        !(this._flags.if_block && reserved_word(next_token, 'else')) &&
		        !this._flags.do_block) {
		        this.restore_mode();
		      }
		    }
		  }

		  if (this._output.add_new_line(force_newline)) {
		    this._flags.multiline_frame = true;
		  }
		};

		Beautifier.prototype.print_token_line_indentation = function(current_token) {
		  if (this._output.just_added_newline()) {
		    if (this._options.keep_array_indentation &&
		      current_token.newlines &&
		      (current_token.text === '[' || is_array(this._flags.mode))) {
		      this._output.current_line.set_indent(-1);
		      this._output.current_line.push(current_token.whitespace_before);
		      this._output.space_before_token = false;
		    } else if (this._output.set_indent(this._flags.indentation_level, this._flags.alignment)) {
		      this._flags.line_indent_level = this._flags.indentation_level;
		    }
		  }
		};

		Beautifier.prototype.print_token = function(current_token) {
		  if (this._output.raw) {
		    this._output.add_raw_token(current_token);
		    return;
		  }

		  if (this._options.comma_first && current_token.previous && current_token.previous.type === TOKEN.COMMA &&
		    this._output.just_added_newline()) {
		    if (this._output.previous_line.last() === ',') {
		      var popped = this._output.previous_line.pop();
		      // if the comma was already at the start of the line,
		      // pull back onto that line and reprint the indentation
		      if (this._output.previous_line.is_empty()) {
		        this._output.previous_line.push(popped);
		        this._output.trim(true);
		        this._output.current_line.pop();
		        this._output.trim();
		      }

		      // add the comma in front of the next token
		      this.print_token_line_indentation(current_token);
		      this._output.add_token(',');
		      this._output.space_before_token = true;
		    }
		  }

		  this.print_token_line_indentation(current_token);
		  this._output.non_breaking_space = true;
		  this._output.add_token(current_token.text);
		  if (this._output.previous_token_wrapped) {
		    this._flags.multiline_frame = true;
		  }
		};

		Beautifier.prototype.indent = function() {
		  this._flags.indentation_level += 1;
		  this._output.set_indent(this._flags.indentation_level, this._flags.alignment);
		};

		Beautifier.prototype.deindent = function() {
		  if (this._flags.indentation_level > 0 &&
		    ((!this._flags.parent) || this._flags.indentation_level > this._flags.parent.indentation_level)) {
		    this._flags.indentation_level -= 1;
		    this._output.set_indent(this._flags.indentation_level, this._flags.alignment);
		  }
		};

		Beautifier.prototype.set_mode = function(mode) {
		  if (this._flags) {
		    this._flag_store.push(this._flags);
		    this._previous_flags = this._flags;
		  } else {
		    this._previous_flags = this.create_flags(null, mode);
		  }

		  this._flags = this.create_flags(this._previous_flags, mode);
		  this._output.set_indent(this._flags.indentation_level, this._flags.alignment);
		};


		Beautifier.prototype.restore_mode = function() {
		  if (this._flag_store.length > 0) {
		    this._previous_flags = this._flags;
		    this._flags = this._flag_store.pop();
		    if (this._previous_flags.mode === MODE.Statement) {
		      remove_redundant_indentation(this._output, this._previous_flags);
		    }
		    this._output.set_indent(this._flags.indentation_level, this._flags.alignment);
		  }
		};

		Beautifier.prototype.start_of_object_property = function() {
		  return this._flags.parent.mode === MODE.ObjectLiteral && this._flags.mode === MODE.Statement && (
		    (this._flags.last_token.text === ':' && this._flags.ternary_depth === 0) || (reserved_array(this._flags.last_token, ['get', 'set'])));
		};

		Beautifier.prototype.start_of_statement = function(current_token) {
		  var start = false;
		  start = start || reserved_array(this._flags.last_token, ['var', 'let', 'const']) && current_token.type === TOKEN.WORD;
		  start = start || reserved_word(this._flags.last_token, 'do');
		  start = start || (!(this._flags.parent.mode === MODE.ObjectLiteral && this._flags.mode === MODE.Statement)) && reserved_array(this._flags.last_token, newline_restricted_tokens) && !current_token.newlines;
		  start = start || reserved_word(this._flags.last_token, 'else') &&
		    !(reserved_word(current_token, 'if') && !current_token.comments_before);
		  start = start || (this._flags.last_token.type === TOKEN.END_EXPR && (this._previous_flags.mode === MODE.ForInitializer || this._previous_flags.mode === MODE.Conditional));
		  start = start || (this._flags.last_token.type === TOKEN.WORD && this._flags.mode === MODE.BlockStatement &&
		    !this._flags.in_case &&
		    !(current_token.text === '--' || current_token.text === '++') &&
		    this._last_last_text !== 'function' &&
		    current_token.type !== TOKEN.WORD && current_token.type !== TOKEN.RESERVED);
		  start = start || (this._flags.mode === MODE.ObjectLiteral && (
		    (this._flags.last_token.text === ':' && this._flags.ternary_depth === 0) || reserved_array(this._flags.last_token, ['get', 'set'])));

		  if (start) {
		    this.set_mode(MODE.Statement);
		    this.indent();

		    this.handle_whitespace_and_comments(current_token, true);

		    // Issue #276:
		    // If starting a new statement with [if, for, while, do], push to a new line.
		    // if (a) if (b) if(c) d(); else e(); else f();
		    if (!this.start_of_object_property()) {
		      this.allow_wrap_or_preserved_newline(current_token,
		        reserved_array(current_token, ['do', 'for', 'if', 'while']));
		    }
		    return true;
		  }
		  return false;
		};

		Beautifier.prototype.handle_start_expr = function(current_token) {
		  // The conditional starts the statement if appropriate.
		  if (!this.start_of_statement(current_token)) {
		    this.handle_whitespace_and_comments(current_token);
		  }

		  var next_mode = MODE.Expression;
		  if (current_token.text === '[') {

		    if (this._flags.last_token.type === TOKEN.WORD || this._flags.last_token.text === ')') {
		      // this is array index specifier, break immediately
		      // a[x], fn()[x]
		      if (reserved_array(this._flags.last_token, line_starters)) {
		        this._output.space_before_token = true;
		      }
		      this.print_token(current_token);
		      this.set_mode(next_mode);
		      this.indent();
		      if (this._options.space_in_paren) {
		        this._output.space_before_token = true;
		      }
		      return;
		    }

		    next_mode = MODE.ArrayLiteral;
		    if (is_array(this._flags.mode)) {
		      if (this._flags.last_token.text === '[' ||
		        (this._flags.last_token.text === ',' && (this._last_last_text === ']' || this._last_last_text === '}'))) {
		        // ], [ goes to new line
		        // }, [ goes to new line
		        if (!this._options.keep_array_indentation) {
		          this.print_newline();
		        }
		      }
		    }

		    if (!in_array(this._flags.last_token.type, [TOKEN.START_EXPR, TOKEN.END_EXPR, TOKEN.WORD, TOKEN.OPERATOR, TOKEN.DOT])) {
		      this._output.space_before_token = true;
		    }
		  } else {
		    if (this._flags.last_token.type === TOKEN.RESERVED) {
		      if (this._flags.last_token.text === 'for') {
		        this._output.space_before_token = this._options.space_before_conditional;
		        next_mode = MODE.ForInitializer;
		      } else if (in_array(this._flags.last_token.text, ['if', 'while', 'switch'])) {
		        this._output.space_before_token = this._options.space_before_conditional;
		        next_mode = MODE.Conditional;
		      } else if (in_array(this._flags.last_word, ['await', 'async'])) {
		        // Should be a space between await and an IIFE, or async and an arrow function
		        this._output.space_before_token = true;
		      } else if (this._flags.last_token.text === 'import' && current_token.whitespace_before === '') {
		        this._output.space_before_token = false;
		      } else if (in_array(this._flags.last_token.text, line_starters) || this._flags.last_token.text === 'catch') {
		        this._output.space_before_token = true;
		      }
		    } else if (this._flags.last_token.type === TOKEN.EQUALS || this._flags.last_token.type === TOKEN.OPERATOR) {
		      // Support of this kind of newline preservation.
		      // a = (b &&
		      //     (c || d));
		      if (!this.start_of_object_property()) {
		        this.allow_wrap_or_preserved_newline(current_token);
		      }
		    } else if (this._flags.last_token.type === TOKEN.WORD) {
		      this._output.space_before_token = false;

		      // function name() vs function name ()
		      // function* name() vs function* name ()
		      // async name() vs async name ()
		      // In ES6, you can also define the method properties of an object
		      // var obj = {a: function() {}}
		      // It can be abbreviated
		      // var obj = {a() {}}
		      // var obj = { a() {}} vs var obj = { a () {}}
		      // var obj = { * a() {}} vs var obj = { * a () {}}
		      var peek_back_two = this._tokens.peek(-3);
		      if (this._options.space_after_named_function && peek_back_two) {
		        // peek starts at next character so -1 is current token
		        var peek_back_three = this._tokens.peek(-4);
		        if (reserved_array(peek_back_two, ['async', 'function']) ||
		          (peek_back_two.text === '*' && reserved_array(peek_back_three, ['async', 'function']))) {
		          this._output.space_before_token = true;
		        } else if (this._flags.mode === MODE.ObjectLiteral) {
		          if ((peek_back_two.text === '{' || peek_back_two.text === ',') ||
		            (peek_back_two.text === '*' && (peek_back_three.text === '{' || peek_back_three.text === ','))) {
		            this._output.space_before_token = true;
		          }
		        } else if (this._flags.parent && this._flags.parent.class_start_block) {
		          this._output.space_before_token = true;
		        }
		      }
		    } else {
		      // Support preserving wrapped arrow function expressions
		      // a.b('c',
		      //     () => d.e
		      // )
		      this.allow_wrap_or_preserved_newline(current_token);
		    }

		    // function() vs function ()
		    // yield*() vs yield* ()
		    // function*() vs function* ()
		    if ((this._flags.last_token.type === TOKEN.RESERVED && (this._flags.last_word === 'function' || this._flags.last_word === 'typeof')) ||
		      (this._flags.last_token.text === '*' &&
		        (in_array(this._last_last_text, ['function', 'yield']) ||
		          (this._flags.mode === MODE.ObjectLiteral && in_array(this._last_last_text, ['{', ',']))))) {
		      this._output.space_before_token = this._options.space_after_anon_function;
		    }
		  }

		  if (this._flags.last_token.text === ';' || this._flags.last_token.type === TOKEN.START_BLOCK) {
		    this.print_newline();
		  } else if (this._flags.last_token.type === TOKEN.END_EXPR || this._flags.last_token.type === TOKEN.START_EXPR || this._flags.last_token.type === TOKEN.END_BLOCK || this._flags.last_token.text === '.' || this._flags.last_token.type === TOKEN.COMMA) {
		    // do nothing on (( and )( and ][ and ]( and .(
		    // TODO: Consider whether forcing this is required.  Review failing tests when removed.
		    this.allow_wrap_or_preserved_newline(current_token, current_token.newlines);
		  }

		  this.print_token(current_token);
		  this.set_mode(next_mode);
		  if (this._options.space_in_paren) {
		    this._output.space_before_token = true;
		  }

		  // In all cases, if we newline while inside an expression it should be indented.
		  this.indent();
		};

		Beautifier.prototype.handle_end_expr = function(current_token) {
		  // statements inside expressions are not valid syntax, but...
		  // statements must all be closed when their container closes
		  while (this._flags.mode === MODE.Statement) {
		    this.restore_mode();
		  }

		  this.handle_whitespace_and_comments(current_token);

		  if (this._flags.multiline_frame) {
		    this.allow_wrap_or_preserved_newline(current_token,
		      current_token.text === ']' && is_array(this._flags.mode) && !this._options.keep_array_indentation);
		  }

		  if (this._options.space_in_paren) {
		    if (this._flags.last_token.type === TOKEN.START_EXPR && !this._options.space_in_empty_paren) {
		      // () [] no inner space in empty parens like these, ever, ref #320
		      this._output.trim();
		      this._output.space_before_token = false;
		    } else {
		      this._output.space_before_token = true;
		    }
		  }
		  this.deindent();
		  this.print_token(current_token);
		  this.restore_mode();

		  remove_redundant_indentation(this._output, this._previous_flags);

		  // do {} while () // no statement required after
		  if (this._flags.do_while && this._previous_flags.mode === MODE.Conditional) {
		    this._previous_flags.mode = MODE.Expression;
		    this._flags.do_block = false;
		    this._flags.do_while = false;

		  }
		};

		Beautifier.prototype.handle_start_block = function(current_token) {
		  this.handle_whitespace_and_comments(current_token);

		  // Check if this is should be treated as a ObjectLiteral
		  var next_token = this._tokens.peek();
		  var second_token = this._tokens.peek(1);
		  if (this._flags.last_word === 'switch' && this._flags.last_token.type === TOKEN.END_EXPR) {
		    this.set_mode(MODE.BlockStatement);
		    this._flags.in_case_statement = true;
		  } else if (this._flags.case_body) {
		    this.set_mode(MODE.BlockStatement);
		  } else if (second_token && (
		      (in_array(second_token.text, [':', ',']) && in_array(next_token.type, [TOKEN.STRING, TOKEN.WORD, TOKEN.RESERVED])) ||
		      (in_array(next_token.text, ['get', 'set', '...']) && in_array(second_token.type, [TOKEN.WORD, TOKEN.RESERVED]))
		    )) {
		    // We don't support TypeScript,but we didn't break it for a very long time.
		    // We'll try to keep not breaking it.
		    if (in_array(this._last_last_text, ['class', 'interface']) && !in_array(second_token.text, [':', ','])) {
		      this.set_mode(MODE.BlockStatement);
		    } else {
		      this.set_mode(MODE.ObjectLiteral);
		    }
		  } else if (this._flags.last_token.type === TOKEN.OPERATOR && this._flags.last_token.text === '=>') {
		    // arrow function: (param1, paramN) => { statements }
		    this.set_mode(MODE.BlockStatement);
		  } else if (in_array(this._flags.last_token.type, [TOKEN.EQUALS, TOKEN.START_EXPR, TOKEN.COMMA, TOKEN.OPERATOR]) ||
		    reserved_array(this._flags.last_token, ['return', 'throw', 'import', 'default'])
		  ) {
		    // Detecting shorthand function syntax is difficult by scanning forward,
		    //     so check the surrounding context.
		    // If the block is being returned, imported, export default, passed as arg,
		    //     assigned with = or assigned in a nested object, treat as an ObjectLiteral.
		    this.set_mode(MODE.ObjectLiteral);
		  } else {
		    this.set_mode(MODE.BlockStatement);
		  }

		  if (this._flags.last_token) {
		    if (reserved_array(this._flags.last_token.previous, ['class', 'extends'])) {
		      this._flags.class_start_block = true;
		    }
		  }

		  var empty_braces = !next_token.comments_before && next_token.text === '}';
		  var empty_anonymous_function = empty_braces && this._flags.last_word === 'function' &&
		    this._flags.last_token.type === TOKEN.END_EXPR;

		  if (this._options.brace_preserve_inline) // check for inline, set inline_frame if so
		  {
		    // search forward for a newline wanted inside this block
		    var index = 0;
		    var check_token = null;
		    this._flags.inline_frame = true;
		    do {
		      index += 1;
		      check_token = this._tokens.peek(index - 1);
		      if (check_token.newlines) {
		        this._flags.inline_frame = false;
		        break;
		      }
		    } while (check_token.type !== TOKEN.EOF &&
		      !(check_token.type === TOKEN.END_BLOCK && check_token.opened === current_token));
		  }

		  if ((this._options.brace_style === "expand" ||
		      (this._options.brace_style === "none" && current_token.newlines)) &&
		    !this._flags.inline_frame) {
		    if (this._flags.last_token.type !== TOKEN.OPERATOR &&
		      (empty_anonymous_function ||
		        this._flags.last_token.type === TOKEN.EQUALS ||
		        (reserved_array(this._flags.last_token, special_words) && this._flags.last_token.text !== 'else'))) {
		      this._output.space_before_token = true;
		    } else {
		      this.print_newline(false, true);
		    }
		  } else { // collapse || inline_frame
		    if (is_array(this._previous_flags.mode) && (this._flags.last_token.type === TOKEN.START_EXPR || this._flags.last_token.type === TOKEN.COMMA)) {
		      if (this._flags.last_token.type === TOKEN.COMMA || this._options.space_in_paren) {
		        this._output.space_before_token = true;
		      }

		      if (this._flags.last_token.type === TOKEN.COMMA || (this._flags.last_token.type === TOKEN.START_EXPR && this._flags.inline_frame)) {
		        this.allow_wrap_or_preserved_newline(current_token);
		        this._previous_flags.multiline_frame = this._previous_flags.multiline_frame || this._flags.multiline_frame;
		        this._flags.multiline_frame = false;
		      }
		    }
		    if (this._flags.last_token.type !== TOKEN.OPERATOR && this._flags.last_token.type !== TOKEN.START_EXPR) {
		      if (in_array(this._flags.last_token.type, [TOKEN.START_BLOCK, TOKEN.SEMICOLON]) && !this._flags.inline_frame) {
		        this.print_newline();
		      } else {
		        this._output.space_before_token = true;
		      }
		    }
		  }
		  this.print_token(current_token);
		  this.indent();

		  // Except for specific cases, open braces are followed by a new line.
		  if (!empty_braces && !(this._options.brace_preserve_inline && this._flags.inline_frame)) {
		    this.print_newline();
		  }
		};

		Beautifier.prototype.handle_end_block = function(current_token) {
		  // statements must all be closed when their container closes
		  this.handle_whitespace_and_comments(current_token);

		  while (this._flags.mode === MODE.Statement) {
		    this.restore_mode();
		  }

		  var empty_braces = this._flags.last_token.type === TOKEN.START_BLOCK;

		  if (this._flags.inline_frame && !empty_braces) { // try inline_frame (only set if this._options.braces-preserve-inline) first
		    this._output.space_before_token = true;
		  } else if (this._options.brace_style === "expand") {
		    if (!empty_braces) {
		      this.print_newline();
		    }
		  } else {
		    // skip {}
		    if (!empty_braces) {
		      if (is_array(this._flags.mode) && this._options.keep_array_indentation) {
		        // we REALLY need a newline here, but newliner would skip that
		        this._options.keep_array_indentation = false;
		        this.print_newline();
		        this._options.keep_array_indentation = true;

		      } else {
		        this.print_newline();
		      }
		    }
		  }
		  this.restore_mode();
		  this.print_token(current_token);
		};

		Beautifier.prototype.handle_word = function(current_token) {
		  if (current_token.type === TOKEN.RESERVED) {
		    if (in_array(current_token.text, ['set', 'get']) && this._flags.mode !== MODE.ObjectLiteral) {
		      current_token.type = TOKEN.WORD;
		    } else if (current_token.text === 'import' && in_array(this._tokens.peek().text, ['(', '.'])) {
		      current_token.type = TOKEN.WORD;
		    } else if (in_array(current_token.text, ['as', 'from']) && !this._flags.import_block) {
		      current_token.type = TOKEN.WORD;
		    } else if (this._flags.mode === MODE.ObjectLiteral) {
		      var next_token = this._tokens.peek();
		      if (next_token.text === ':') {
		        current_token.type = TOKEN.WORD;
		      }
		    }
		  }

		  if (this.start_of_statement(current_token)) {
		    // The conditional starts the statement if appropriate.
		    if (reserved_array(this._flags.last_token, ['var', 'let', 'const']) && current_token.type === TOKEN.WORD) {
		      this._flags.declaration_statement = true;
		    }
		  } else if (current_token.newlines && !is_expression(this._flags.mode) &&
		    (this._flags.last_token.type !== TOKEN.OPERATOR || (this._flags.last_token.text === '--' || this._flags.last_token.text === '++')) &&
		    this._flags.last_token.type !== TOKEN.EQUALS &&
		    (this._options.preserve_newlines || !reserved_array(this._flags.last_token, ['var', 'let', 'const', 'set', 'get']))) {
		    this.handle_whitespace_and_comments(current_token);
		    this.print_newline();
		  } else {
		    this.handle_whitespace_and_comments(current_token);
		  }

		  if (this._flags.do_block && !this._flags.do_while) {
		    if (reserved_word(current_token, 'while')) {
		      // do {} ## while ()
		      this._output.space_before_token = true;
		      this.print_token(current_token);
		      this._output.space_before_token = true;
		      this._flags.do_while = true;
		      return;
		    } else {
		      // do {} should always have while as the next word.
		      // if we don't see the expected while, recover
		      this.print_newline();
		      this._flags.do_block = false;
		    }
		  }

		  // if may be followed by else, or not
		  // Bare/inline ifs are tricky
		  // Need to unwind the modes correctly: if (a) if (b) c(); else d(); else e();
		  if (this._flags.if_block) {
		    if (!this._flags.else_block && reserved_word(current_token, 'else')) {
		      this._flags.else_block = true;
		    } else {
		      while (this._flags.mode === MODE.Statement) {
		        this.restore_mode();
		      }
		      this._flags.if_block = false;
		      this._flags.else_block = false;
		    }
		  }

		  if (this._flags.in_case_statement && reserved_array(current_token, ['case', 'default'])) {
		    this.print_newline();
		    if (!this._flags.case_block && (this._flags.case_body || this._options.jslint_happy)) {
		      // switch cases following one another
		      this.deindent();
		    }
		    this._flags.case_body = false;

		    this.print_token(current_token);
		    this._flags.in_case = true;
		    return;
		  }

		  if (this._flags.last_token.type === TOKEN.COMMA || this._flags.last_token.type === TOKEN.START_EXPR || this._flags.last_token.type === TOKEN.EQUALS || this._flags.last_token.type === TOKEN.OPERATOR) {
		    if (!this.start_of_object_property() && !(
		        // start of object property is different for numeric values with +/- prefix operators
		        in_array(this._flags.last_token.text, ['+', '-']) && this._last_last_text === ':' && this._flags.parent.mode === MODE.ObjectLiteral)) {
		      this.allow_wrap_or_preserved_newline(current_token);
		    }
		  }

		  if (reserved_word(current_token, 'function')) {
		    if (in_array(this._flags.last_token.text, ['}', ';']) ||
		      (this._output.just_added_newline() && !(in_array(this._flags.last_token.text, ['(', '[', '{', ':', '=', ',']) || this._flags.last_token.type === TOKEN.OPERATOR))) {
		      // make sure there is a nice clean space of at least one blank line
		      // before a new function definition
		      if (!this._output.just_added_blankline() && !current_token.comments_before) {
		        this.print_newline();
		        this.print_newline(true);
		      }
		    }
		    if (this._flags.last_token.type === TOKEN.RESERVED || this._flags.last_token.type === TOKEN.WORD) {
		      if (reserved_array(this._flags.last_token, ['get', 'set', 'new', 'export']) ||
		        reserved_array(this._flags.last_token, newline_restricted_tokens)) {
		        this._output.space_before_token = true;
		      } else if (reserved_word(this._flags.last_token, 'default') && this._last_last_text === 'export') {
		        this._output.space_before_token = true;
		      } else if (this._flags.last_token.text === 'declare') {
		        // accomodates Typescript declare function formatting
		        this._output.space_before_token = true;
		      } else {
		        this.print_newline();
		      }
		    } else if (this._flags.last_token.type === TOKEN.OPERATOR || this._flags.last_token.text === '=') {
		      // foo = function
		      this._output.space_before_token = true;
		    } else if (!this._flags.multiline_frame && (is_expression(this._flags.mode) || is_array(this._flags.mode))) ; else {
		      this.print_newline();
		    }

		    this.print_token(current_token);
		    this._flags.last_word = current_token.text;
		    return;
		  }

		  var prefix = 'NONE';

		  if (this._flags.last_token.type === TOKEN.END_BLOCK) {

		    if (this._previous_flags.inline_frame) {
		      prefix = 'SPACE';
		    } else if (!reserved_array(current_token, ['else', 'catch', 'finally', 'from'])) {
		      prefix = 'NEWLINE';
		    } else {
		      if (this._options.brace_style === "expand" ||
		        this._options.brace_style === "end-expand" ||
		        (this._options.brace_style === "none" && current_token.newlines)) {
		        prefix = 'NEWLINE';
		      } else {
		        prefix = 'SPACE';
		        this._output.space_before_token = true;
		      }
		    }
		  } else if (this._flags.last_token.type === TOKEN.SEMICOLON && this._flags.mode === MODE.BlockStatement) {
		    // TODO: Should this be for STATEMENT as well?
		    prefix = 'NEWLINE';
		  } else if (this._flags.last_token.type === TOKEN.SEMICOLON && is_expression(this._flags.mode)) {
		    prefix = 'SPACE';
		  } else if (this._flags.last_token.type === TOKEN.STRING) {
		    prefix = 'NEWLINE';
		  } else if (this._flags.last_token.type === TOKEN.RESERVED || this._flags.last_token.type === TOKEN.WORD ||
		    (this._flags.last_token.text === '*' &&
		      (in_array(this._last_last_text, ['function', 'yield']) ||
		        (this._flags.mode === MODE.ObjectLiteral && in_array(this._last_last_text, ['{', ',']))))) {
		    prefix = 'SPACE';
		  } else if (this._flags.last_token.type === TOKEN.START_BLOCK) {
		    if (this._flags.inline_frame) {
		      prefix = 'SPACE';
		    } else {
		      prefix = 'NEWLINE';
		    }
		  } else if (this._flags.last_token.type === TOKEN.END_EXPR) {
		    this._output.space_before_token = true;
		    prefix = 'NEWLINE';
		  }

		  if (reserved_array(current_token, line_starters) && this._flags.last_token.text !== ')') {
		    if (this._flags.inline_frame || this._flags.last_token.text === 'else' || this._flags.last_token.text === 'export') {
		      prefix = 'SPACE';
		    } else {
		      prefix = 'NEWLINE';
		    }

		  }

		  if (reserved_array(current_token, ['else', 'catch', 'finally'])) {
		    if ((!(this._flags.last_token.type === TOKEN.END_BLOCK && this._previous_flags.mode === MODE.BlockStatement) ||
		        this._options.brace_style === "expand" ||
		        this._options.brace_style === "end-expand" ||
		        (this._options.brace_style === "none" && current_token.newlines)) &&
		      !this._flags.inline_frame) {
		      this.print_newline();
		    } else {
		      this._output.trim(true);
		      var line = this._output.current_line;
		      // If we trimmed and there's something other than a close block before us
		      // put a newline back in.  Handles '} // comment' scenario.
		      if (line.last() !== '}') {
		        this.print_newline();
		      }
		      this._output.space_before_token = true;
		    }
		  } else if (prefix === 'NEWLINE') {
		    if (reserved_array(this._flags.last_token, special_words)) {
		      // no newline between 'return nnn'
		      this._output.space_before_token = true;
		    } else if (this._flags.last_token.text === 'declare' && reserved_array(current_token, ['var', 'let', 'const'])) {
		      // accomodates Typescript declare formatting
		      this._output.space_before_token = true;
		    } else if (this._flags.last_token.type !== TOKEN.END_EXPR) {
		      if ((this._flags.last_token.type !== TOKEN.START_EXPR || !reserved_array(current_token, ['var', 'let', 'const'])) && this._flags.last_token.text !== ':') {
		        // no need to force newline on 'var': for (var x = 0...)
		        if (reserved_word(current_token, 'if') && reserved_word(current_token.previous, 'else')) {
		          // no newline for } else if {
		          this._output.space_before_token = true;
		        } else {
		          this.print_newline();
		        }
		      }
		    } else if (reserved_array(current_token, line_starters) && this._flags.last_token.text !== ')') {
		      this.print_newline();
		    }
		  } else if (this._flags.multiline_frame && is_array(this._flags.mode) && this._flags.last_token.text === ',' && this._last_last_text === '}') {
		    this.print_newline(); // }, in lists get a newline treatment
		  } else if (prefix === 'SPACE') {
		    this._output.space_before_token = true;
		  }
		  if (current_token.previous && (current_token.previous.type === TOKEN.WORD || current_token.previous.type === TOKEN.RESERVED)) {
		    this._output.space_before_token = true;
		  }
		  this.print_token(current_token);
		  this._flags.last_word = current_token.text;

		  if (current_token.type === TOKEN.RESERVED) {
		    if (current_token.text === 'do') {
		      this._flags.do_block = true;
		    } else if (current_token.text === 'if') {
		      this._flags.if_block = true;
		    } else if (current_token.text === 'import') {
		      this._flags.import_block = true;
		    } else if (this._flags.import_block && reserved_word(current_token, 'from')) {
		      this._flags.import_block = false;
		    }
		  }
		};

		Beautifier.prototype.handle_semicolon = function(current_token) {
		  if (this.start_of_statement(current_token)) {
		    // The conditional starts the statement if appropriate.
		    // Semicolon can be the start (and end) of a statement
		    this._output.space_before_token = false;
		  } else {
		    this.handle_whitespace_and_comments(current_token);
		  }

		  var next_token = this._tokens.peek();
		  while (this._flags.mode === MODE.Statement &&
		    !(this._flags.if_block && reserved_word(next_token, 'else')) &&
		    !this._flags.do_block) {
		    this.restore_mode();
		  }

		  // hacky but effective for the moment
		  if (this._flags.import_block) {
		    this._flags.import_block = false;
		  }
		  this.print_token(current_token);
		};

		Beautifier.prototype.handle_string = function(current_token) {
		  if (current_token.text.startsWith("`") && current_token.newlines === 0 && current_token.whitespace_before === '' && (current_token.previous.text === ')' || this._flags.last_token.type === TOKEN.WORD)) ; else if (this.start_of_statement(current_token)) {
		    // The conditional starts the statement if appropriate.
		    // One difference - strings want at least a space before
		    this._output.space_before_token = true;
		  } else {
		    this.handle_whitespace_and_comments(current_token);
		    if (this._flags.last_token.type === TOKEN.RESERVED || this._flags.last_token.type === TOKEN.WORD || this._flags.inline_frame) {
		      this._output.space_before_token = true;
		    } else if (this._flags.last_token.type === TOKEN.COMMA || this._flags.last_token.type === TOKEN.START_EXPR || this._flags.last_token.type === TOKEN.EQUALS || this._flags.last_token.type === TOKEN.OPERATOR) {
		      if (!this.start_of_object_property()) {
		        this.allow_wrap_or_preserved_newline(current_token);
		      }
		    } else if ((current_token.text.startsWith("`") && this._flags.last_token.type === TOKEN.END_EXPR && (current_token.previous.text === ']' || current_token.previous.text === ')') && current_token.newlines === 0)) {
		      this._output.space_before_token = true;
		    } else {
		      this.print_newline();
		    }
		  }
		  this.print_token(current_token);
		};

		Beautifier.prototype.handle_equals = function(current_token) {
		  if (this.start_of_statement(current_token)) ; else {
		    this.handle_whitespace_and_comments(current_token);
		  }

		  if (this._flags.declaration_statement) {
		    // just got an '=' in a var-line, different formatting/line-breaking, etc will now be done
		    this._flags.declaration_assignment = true;
		  }
		  this._output.space_before_token = true;
		  this.print_token(current_token);
		  this._output.space_before_token = true;
		};

		Beautifier.prototype.handle_comma = function(current_token) {
		  this.handle_whitespace_and_comments(current_token, true);

		  this.print_token(current_token);
		  this._output.space_before_token = true;
		  if (this._flags.declaration_statement) {
		    if (is_expression(this._flags.parent.mode)) {
		      // do not break on comma, for(var a = 1, b = 2)
		      this._flags.declaration_assignment = false;
		    }

		    if (this._flags.declaration_assignment) {
		      this._flags.declaration_assignment = false;
		      this.print_newline(false, true);
		    } else if (this._options.comma_first) {
		      // for comma-first, we want to allow a newline before the comma
		      // to turn into a newline after the comma, which we will fixup later
		      this.allow_wrap_or_preserved_newline(current_token);
		    }
		  } else if (this._flags.mode === MODE.ObjectLiteral ||
		    (this._flags.mode === MODE.Statement && this._flags.parent.mode === MODE.ObjectLiteral)) {
		    if (this._flags.mode === MODE.Statement) {
		      this.restore_mode();
		    }

		    if (!this._flags.inline_frame) {
		      this.print_newline();
		    }
		  } else if (this._options.comma_first) {
		    // EXPR or DO_BLOCK
		    // for comma-first, we want to allow a newline before the comma
		    // to turn into a newline after the comma, which we will fixup later
		    this.allow_wrap_or_preserved_newline(current_token);
		  }
		};

		Beautifier.prototype.handle_operator = function(current_token) {
		  var isGeneratorAsterisk = current_token.text === '*' &&
		    (reserved_array(this._flags.last_token, ['function', 'yield']) ||
		      (in_array(this._flags.last_token.type, [TOKEN.START_BLOCK, TOKEN.COMMA, TOKEN.END_BLOCK, TOKEN.SEMICOLON]))
		    );
		  var isUnary = in_array(current_token.text, ['-', '+']) && (
		    in_array(this._flags.last_token.type, [TOKEN.START_BLOCK, TOKEN.START_EXPR, TOKEN.EQUALS, TOKEN.OPERATOR]) ||
		    in_array(this._flags.last_token.text, line_starters) ||
		    this._flags.last_token.text === ','
		  );

		  if (this.start_of_statement(current_token)) ; else {
		    var preserve_statement_flags = !isGeneratorAsterisk;
		    this.handle_whitespace_and_comments(current_token, preserve_statement_flags);
		  }

		  // hack for actionscript's import .*;
		  if (current_token.text === '*' && this._flags.last_token.type === TOKEN.DOT) {
		    this.print_token(current_token);
		    return;
		  }

		  if (current_token.text === '::') {
		    // no spaces around exotic namespacing syntax operator
		    this.print_token(current_token);
		    return;
		  }

		  if (in_array(current_token.text, ['-', '+']) && this.start_of_object_property()) {
		    // numeric value with +/- symbol in front as a property
		    this.print_token(current_token);
		    return;
		  }

		  // Allow line wrapping between operators when operator_position is
		  //   set to before or preserve
		  if (this._flags.last_token.type === TOKEN.OPERATOR && in_array(this._options.operator_position, OPERATOR_POSITION_BEFORE_OR_PRESERVE)) {
		    this.allow_wrap_or_preserved_newline(current_token);
		  }

		  if (current_token.text === ':' && this._flags.in_case) {
		    this.print_token(current_token);

		    this._flags.in_case = false;
		    this._flags.case_body = true;
		    if (this._tokens.peek().type !== TOKEN.START_BLOCK) {
		      this.indent();
		      this.print_newline();
		      this._flags.case_block = false;
		    } else {
		      this._flags.case_block = true;
		      this._output.space_before_token = true;
		    }
		    return;
		  }

		  var space_before = true;
		  var space_after = true;
		  var in_ternary = false;
		  if (current_token.text === ':') {
		    if (this._flags.ternary_depth === 0) {
		      // Colon is invalid javascript outside of ternary and object, but do our best to guess what was meant.
		      space_before = false;
		    } else {
		      this._flags.ternary_depth -= 1;
		      in_ternary = true;
		    }
		  } else if (current_token.text === '?') {
		    this._flags.ternary_depth += 1;
		  }

		  // let's handle the operator_position option prior to any conflicting logic
		  if (!isUnary && !isGeneratorAsterisk && this._options.preserve_newlines && in_array(current_token.text, positionable_operators)) {
		    var isColon = current_token.text === ':';
		    var isTernaryColon = (isColon && in_ternary);
		    var isOtherColon = (isColon && !in_ternary);

		    switch (this._options.operator_position) {
		      case OPERATOR_POSITION.before_newline:
		        // if the current token is : and it's not a ternary statement then we set space_before to false
		        this._output.space_before_token = !isOtherColon;

		        this.print_token(current_token);

		        if (!isColon || isTernaryColon) {
		          this.allow_wrap_or_preserved_newline(current_token);
		        }

		        this._output.space_before_token = true;
		        return;

		      case OPERATOR_POSITION.after_newline:
		        // if the current token is anything but colon, or (via deduction) it's a colon and in a ternary statement,
		        //   then print a newline.

		        this._output.space_before_token = true;

		        if (!isColon || isTernaryColon) {
		          if (this._tokens.peek().newlines) {
		            this.print_newline(false, true);
		          } else {
		            this.allow_wrap_or_preserved_newline(current_token);
		          }
		        } else {
		          this._output.space_before_token = false;
		        }

		        this.print_token(current_token);

		        this._output.space_before_token = true;
		        return;

		      case OPERATOR_POSITION.preserve_newline:
		        if (!isOtherColon) {
		          this.allow_wrap_or_preserved_newline(current_token);
		        }

		        // if we just added a newline, or the current token is : and it's not a ternary statement,
		        //   then we set space_before to false
		        space_before = !(this._output.just_added_newline() || isOtherColon);

		        this._output.space_before_token = space_before;
		        this.print_token(current_token);
		        this._output.space_before_token = true;
		        return;
		    }
		  }

		  if (isGeneratorAsterisk) {
		    this.allow_wrap_or_preserved_newline(current_token);
		    space_before = false;
		    var next_token = this._tokens.peek();
		    space_after = next_token && in_array(next_token.type, [TOKEN.WORD, TOKEN.RESERVED]);
		  } else if (current_token.text === '...') {
		    this.allow_wrap_or_preserved_newline(current_token);
		    space_before = this._flags.last_token.type === TOKEN.START_BLOCK;
		    space_after = false;
		  } else if (in_array(current_token.text, ['--', '++', '!', '~']) || isUnary) {
		    // unary operators (and binary +/- pretending to be unary) special cases
		    if (this._flags.last_token.type === TOKEN.COMMA || this._flags.last_token.type === TOKEN.START_EXPR) {
		      this.allow_wrap_or_preserved_newline(current_token);
		    }

		    space_before = false;
		    space_after = false;

		    // http://www.ecma-international.org/ecma-262/5.1/#sec-7.9.1
		    // if there is a newline between -- or ++ and anything else we should preserve it.
		    if (current_token.newlines && (current_token.text === '--' || current_token.text === '++' || current_token.text === '~')) {
		      var new_line_needed = reserved_array(this._flags.last_token, special_words) && current_token.newlines;
		      if (new_line_needed && (this._previous_flags.if_block || this._previous_flags.else_block)) {
		        this.restore_mode();
		      }
		      this.print_newline(new_line_needed, true);
		    }

		    if (this._flags.last_token.text === ';' && is_expression(this._flags.mode)) {
		      // for (;; ++i)
		      //        ^^^
		      space_before = true;
		    }

		    if (this._flags.last_token.type === TOKEN.RESERVED) {
		      space_before = true;
		    } else if (this._flags.last_token.type === TOKEN.END_EXPR) {
		      space_before = !(this._flags.last_token.text === ']' && (current_token.text === '--' || current_token.text === '++'));
		    } else if (this._flags.last_token.type === TOKEN.OPERATOR) {
		      // a++ + ++b;
		      // a - -b
		      space_before = in_array(current_token.text, ['--', '-', '++', '+']) && in_array(this._flags.last_token.text, ['--', '-', '++', '+']);
		      // + and - are not unary when preceded by -- or ++ operator
		      // a-- + b
		      // a * +b
		      // a - -b
		      if (in_array(current_token.text, ['+', '-']) && in_array(this._flags.last_token.text, ['--', '++'])) {
		        space_after = true;
		      }
		    }


		    if (((this._flags.mode === MODE.BlockStatement && !this._flags.inline_frame) || this._flags.mode === MODE.Statement) &&
		      (this._flags.last_token.text === '{' || this._flags.last_token.text === ';')) {
		      // { foo; --i }
		      // foo(); --bar;
		      this.print_newline();
		    }
		  }

		  this._output.space_before_token = this._output.space_before_token || space_before;
		  this.print_token(current_token);
		  this._output.space_before_token = space_after;
		};

		Beautifier.prototype.handle_block_comment = function(current_token, preserve_statement_flags) {
		  if (this._output.raw) {
		    this._output.add_raw_token(current_token);
		    if (current_token.directives && current_token.directives.preserve === 'end') {
		      // If we're testing the raw output behavior, do not allow a directive to turn it off.
		      this._output.raw = this._options.test_output_raw;
		    }
		    return;
		  }

		  if (current_token.directives) {
		    this.print_newline(false, preserve_statement_flags);
		    this.print_token(current_token);
		    if (current_token.directives.preserve === 'start') {
		      this._output.raw = true;
		    }
		    this.print_newline(false, true);
		    return;
		  }

		  // inline block
		  if (!acorn.newline.test(current_token.text) && !current_token.newlines) {
		    this._output.space_before_token = true;
		    this.print_token(current_token);
		    this._output.space_before_token = true;
		    return;
		  } else {
		    this.print_block_commment(current_token, preserve_statement_flags);
		  }
		};

		Beautifier.prototype.print_block_commment = function(current_token, preserve_statement_flags) {
		  var lines = split_linebreaks(current_token.text);
		  var j; // iterator for this case
		  var javadoc = false;
		  var starless = false;
		  var lastIndent = current_token.whitespace_before;
		  var lastIndentLength = lastIndent.length;

		  // block comment starts with a new line
		  this.print_newline(false, preserve_statement_flags);

		  // first line always indented
		  this.print_token_line_indentation(current_token);
		  this._output.add_token(lines[0]);
		  this.print_newline(false, preserve_statement_flags);


		  if (lines.length > 1) {
		    lines = lines.slice(1);
		    javadoc = all_lines_start_with(lines, '*');
		    starless = each_line_matches_indent(lines, lastIndent);

		    if (javadoc) {
		      this._flags.alignment = 1;
		    }

		    for (j = 0; j < lines.length; j++) {
		      if (javadoc) {
		        // javadoc: reformat and re-indent
		        this.print_token_line_indentation(current_token);
		        this._output.add_token(ltrim(lines[j]));
		      } else if (starless && lines[j]) {
		        // starless: re-indent non-empty content, avoiding trim
		        this.print_token_line_indentation(current_token);
		        this._output.add_token(lines[j].substring(lastIndentLength));
		      } else {
		        // normal comments output raw
		        this._output.current_line.set_indent(-1);
		        this._output.add_token(lines[j]);
		      }

		      // for comments on their own line or  more than one line, make sure there's a new line after
		      this.print_newline(false, preserve_statement_flags);
		    }

		    this._flags.alignment = 0;
		  }
		};


		Beautifier.prototype.handle_comment = function(current_token, preserve_statement_flags) {
		  if (current_token.newlines) {
		    this.print_newline(false, preserve_statement_flags);
		  } else {
		    this._output.trim(true);
		  }

		  this._output.space_before_token = true;
		  this.print_token(current_token);
		  this.print_newline(false, preserve_statement_flags);
		};

		Beautifier.prototype.handle_dot = function(current_token) {
		  if (this.start_of_statement(current_token)) ; else {
		    this.handle_whitespace_and_comments(current_token, true);
		  }

		  if (this._flags.last_token.text.match('^[0-9]+$')) {
		    this._output.space_before_token = true;
		  }

		  if (reserved_array(this._flags.last_token, special_words)) {
		    this._output.space_before_token = false;
		  } else {
		    // allow preserved newlines before dots in general
		    // force newlines on dots after close paren when break_chained - for bar().baz()
		    this.allow_wrap_or_preserved_newline(current_token,
		      this._flags.last_token.text === ')' && this._options.break_chained_methods);
		  }

		  // Only unindent chained method dot if this dot starts a new line.
		  // Otherwise the automatic extra indentation removal will handle the over indent
		  if (this._options.unindent_chained_methods && this._output.just_added_newline()) {
		    this.deindent();
		  }

		  this.print_token(current_token);
		};

		Beautifier.prototype.handle_unknown = function(current_token, preserve_statement_flags) {
		  this.print_token(current_token);

		  if (current_token.text[current_token.text.length - 1] === '\n') {
		    this.print_newline(false, preserve_statement_flags);
		  }
		};

		Beautifier.prototype.handle_eof = function(current_token) {
		  // Unwind any open statements
		  while (this._flags.mode === MODE.Statement) {
		    this.restore_mode();
		  }
		  this.handle_whitespace_and_comments(current_token);
		};

		beautifier$2.Beautifier = Beautifier;
		return beautifier$2;
	}

	/*jshint node:true */

	var hasRequiredJavascript;

	function requireJavascript () {
		if (hasRequiredJavascript) return javascript.exports;
		hasRequiredJavascript = 1;

		var Beautifier = requireBeautifier$2().Beautifier,
		  Options = requireOptions$2().Options;

		function js_beautify(js_source_text, options) {
		  var beautifier = new Beautifier(js_source_text, options);
		  return beautifier.beautify();
		}

		javascript.exports = js_beautify;
		javascript.exports.defaultOptions = function() {
		  return new Options();
		};
		return javascript.exports;
	}

	var css = {exports: {}};

	var beautifier$1 = {};

	var options$1 = {};

	/*jshint node:true */

	var hasRequiredOptions$1;

	function requireOptions$1 () {
		if (hasRequiredOptions$1) return options$1;
		hasRequiredOptions$1 = 1;

		var BaseOptions = requireOptions$3().Options;

		function Options(options) {
		  BaseOptions.call(this, options, 'css');

		  this.selector_separator_newline = this._get_boolean('selector_separator_newline', true);
		  this.newline_between_rules = this._get_boolean('newline_between_rules', true);
		  var space_around_selector_separator = this._get_boolean('space_around_selector_separator');
		  this.space_around_combinator = this._get_boolean('space_around_combinator') || space_around_selector_separator;

		  var brace_style_split = this._get_selection_list('brace_style', ['collapse', 'expand', 'end-expand', 'none', 'preserve-inline']);
		  this.brace_style = 'collapse';
		  for (var bs = 0; bs < brace_style_split.length; bs++) {
		    if (brace_style_split[bs] !== 'expand') {
		      // default to collapse, as only collapse|expand is implemented for now
		      this.brace_style = 'collapse';
		    } else {
		      this.brace_style = brace_style_split[bs];
		    }
		  }
		}
		Options.prototype = new BaseOptions();



		options$1.Options = Options;
		return options$1;
	}

	/*jshint node:true */

	var hasRequiredBeautifier$1;

	function requireBeautifier$1 () {
		if (hasRequiredBeautifier$1) return beautifier$1;
		hasRequiredBeautifier$1 = 1;

		var Options = requireOptions$1().Options;
		var Output = requireOutput().Output;
		var InputScanner = requireInputscanner().InputScanner;
		var Directives = requireDirectives().Directives;

		var directives_core = new Directives(/\/\*/, /\*\//);

		var lineBreak = /\r\n|[\r\n]/;
		var allLineBreaks = /\r\n|[\r\n]/g;

		// tokenizer
		var whitespaceChar = /\s/;
		var whitespacePattern = /(?:\s|\n)+/g;
		var block_comment_pattern = /\/\*(?:[\s\S]*?)((?:\*\/)|$)/g;
		var comment_pattern = /\/\/(?:[^\n\r\u2028\u2029]*)/g;

		function Beautifier(source_text, options) {
		  this._source_text = source_text || '';
		  // Allow the setting of language/file-type specific options
		  // with inheritance of overall settings
		  this._options = new Options(options);
		  this._ch = null;
		  this._input = null;

		  // https://developer.mozilla.org/en-US/docs/Web/CSS/At-rule
		  this.NESTED_AT_RULE = {
		    "page": true,
		    "font-face": true,
		    "keyframes": true,
		    // also in CONDITIONAL_GROUP_RULE below
		    "media": true,
		    "supports": true,
		    "document": true
		  };
		  this.CONDITIONAL_GROUP_RULE = {
		    "media": true,
		    "supports": true,
		    "document": true
		  };
		  this.NON_SEMICOLON_NEWLINE_PROPERTY = [
		    "grid-template-areas",
		    "grid-template"
		  ];

		}

		Beautifier.prototype.eatString = function(endChars) {
		  var result = '';
		  this._ch = this._input.next();
		  while (this._ch) {
		    result += this._ch;
		    if (this._ch === "\\") {
		      result += this._input.next();
		    } else if (endChars.indexOf(this._ch) !== -1 || this._ch === "\n") {
		      break;
		    }
		    this._ch = this._input.next();
		  }
		  return result;
		};

		// Skips any white space in the source text from the current position.
		// When allowAtLeastOneNewLine is true, will output new lines for each
		// newline character found; if the user has preserve_newlines off, only
		// the first newline will be output
		Beautifier.prototype.eatWhitespace = function(allowAtLeastOneNewLine) {
		  var result = whitespaceChar.test(this._input.peek());
		  var newline_count = 0;
		  while (whitespaceChar.test(this._input.peek())) {
		    this._ch = this._input.next();
		    if (allowAtLeastOneNewLine && this._ch === '\n') {
		      if (newline_count === 0 || newline_count < this._options.max_preserve_newlines) {
		        newline_count++;
		        this._output.add_new_line(true);
		      }
		    }
		  }
		  return result;
		};

		// Nested pseudo-class if we are insideRule
		// and the next special character found opens
		// a new block
		Beautifier.prototype.foundNestedPseudoClass = function() {
		  var openParen = 0;
		  var i = 1;
		  var ch = this._input.peek(i);
		  while (ch) {
		    if (ch === "{") {
		      return true;
		    } else if (ch === '(') {
		      // pseudoclasses can contain ()
		      openParen += 1;
		    } else if (ch === ')') {
		      if (openParen === 0) {
		        return false;
		      }
		      openParen -= 1;
		    } else if (ch === ";" || ch === "}") {
		      return false;
		    }
		    i++;
		    ch = this._input.peek(i);
		  }
		  return false;
		};

		Beautifier.prototype.print_string = function(output_string) {
		  this._output.set_indent(this._indentLevel);
		  this._output.non_breaking_space = true;
		  this._output.add_token(output_string);
		};

		Beautifier.prototype.preserveSingleSpace = function(isAfterSpace) {
		  if (isAfterSpace) {
		    this._output.space_before_token = true;
		  }
		};

		Beautifier.prototype.indent = function() {
		  this._indentLevel++;
		};

		Beautifier.prototype.outdent = function() {
		  if (this._indentLevel > 0) {
		    this._indentLevel--;
		  }
		};

		/*_____________________--------------------_____________________*/

		Beautifier.prototype.beautify = function() {
		  if (this._options.disabled) {
		    return this._source_text;
		  }

		  var source_text = this._source_text;
		  var eol = this._options.eol;
		  if (eol === 'auto') {
		    eol = '\n';
		    if (source_text && lineBreak.test(source_text || '')) {
		      eol = source_text.match(lineBreak)[0];
		    }
		  }


		  // HACK: newline parsing inconsistent. This brute force normalizes the this._input.
		  source_text = source_text.replace(allLineBreaks, '\n');

		  // reset
		  var baseIndentString = source_text.match(/^[\t ]*/)[0];

		  this._output = new Output(this._options, baseIndentString);
		  this._input = new InputScanner(source_text);
		  this._indentLevel = 0;
		  this._nestedLevel = 0;

		  this._ch = null;
		  var parenLevel = 0;

		  var insideRule = false;
		  // This is the value side of a property value pair (blue in the following ex)
		  // label { content: blue }
		  var insidePropertyValue = false;
		  var enteringConditionalGroup = false;
		  var insideNonNestedAtRule = false;
		  var insideScssMap = false;
		  var topCharacter = this._ch;
		  var insideNonSemiColonValues = false;
		  var whitespace;
		  var isAfterSpace;
		  var previous_ch;

		  while (true) {
		    whitespace = this._input.read(whitespacePattern);
		    isAfterSpace = whitespace !== '';
		    previous_ch = topCharacter;
		    this._ch = this._input.next();
		    if (this._ch === '\\' && this._input.hasNext()) {
		      this._ch += this._input.next();
		    }
		    topCharacter = this._ch;

		    if (!this._ch) {
		      break;
		    } else if (this._ch === '/' && this._input.peek() === '*') {
		      // /* css comment */
		      // Always start block comments on a new line.
		      // This handles scenarios where a block comment immediately
		      // follows a property definition on the same line or where
		      // minified code is being beautified.
		      this._output.add_new_line();
		      this._input.back();

		      var comment = this._input.read(block_comment_pattern);

		      // Handle ignore directive
		      var directives = directives_core.get_directives(comment);
		      if (directives && directives.ignore === 'start') {
		        comment += directives_core.readIgnored(this._input);
		      }

		      this.print_string(comment);

		      // Ensures any new lines following the comment are preserved
		      this.eatWhitespace(true);

		      // Block comments are followed by a new line so they don't
		      // share a line with other properties
		      this._output.add_new_line();
		    } else if (this._ch === '/' && this._input.peek() === '/') {
		      // // single line comment
		      // Preserves the space before a comment
		      // on the same line as a rule
		      this._output.space_before_token = true;
		      this._input.back();
		      this.print_string(this._input.read(comment_pattern));

		      // Ensures any new lines following the comment are preserved
		      this.eatWhitespace(true);
		    } else if (this._ch === '$') {
		      this.preserveSingleSpace(isAfterSpace);

		      this.print_string(this._ch);

		      // strip trailing space, if present, for hash property checks
		      var variable = this._input.peekUntilAfter(/[: ,;{}()[\]\/='"]/g);

		      if (variable.match(/[ :]$/)) {
		        // we have a variable or pseudo-class, add it and insert one space before continuing
		        variable = this.eatString(": ").replace(/\s+$/, '');
		        this.print_string(variable);
		        this._output.space_before_token = true;
		      }

		      // might be sass variable
		      if (parenLevel === 0 && variable.indexOf(':') !== -1) {
		        insidePropertyValue = true;
		        this.indent();
		      }
		    } else if (this._ch === '@') {
		      this.preserveSingleSpace(isAfterSpace);

		      // deal with less property mixins @{...}
		      if (this._input.peek() === '{') {
		        this.print_string(this._ch + this.eatString('}'));
		      } else {
		        this.print_string(this._ch);

		        // strip trailing space, if present, for hash property checks
		        var variableOrRule = this._input.peekUntilAfter(/[: ,;{}()[\]\/='"]/g);

		        if (variableOrRule.match(/[ :]$/)) {
		          // we have a variable or pseudo-class, add it and insert one space before continuing
		          variableOrRule = this.eatString(": ").replace(/\s+$/, '');
		          this.print_string(variableOrRule);
		          this._output.space_before_token = true;
		        }

		        // might be less variable
		        if (parenLevel === 0 && variableOrRule.indexOf(':') !== -1) {
		          insidePropertyValue = true;
		          this.indent();

		          // might be a nesting at-rule
		        } else if (variableOrRule in this.NESTED_AT_RULE) {
		          this._nestedLevel += 1;
		          if (variableOrRule in this.CONDITIONAL_GROUP_RULE) {
		            enteringConditionalGroup = true;
		          }

		          // might be a non-nested at-rule
		        } else if (parenLevel === 0 && !insidePropertyValue) {
		          insideNonNestedAtRule = true;
		        }
		      }
		    } else if (this._ch === '#' && this._input.peek() === '{') {
		      this.preserveSingleSpace(isAfterSpace);
		      this.print_string(this._ch + this.eatString('}'));
		    } else if (this._ch === '{') {
		      if (insidePropertyValue) {
		        insidePropertyValue = false;
		        this.outdent();
		      }

		      // non nested at rule becomes nested
		      insideNonNestedAtRule = false;

		      // when entering conditional groups, only rulesets are allowed
		      if (enteringConditionalGroup) {
		        enteringConditionalGroup = false;
		        insideRule = (this._indentLevel >= this._nestedLevel);
		      } else {
		        // otherwise, declarations are also allowed
		        insideRule = (this._indentLevel >= this._nestedLevel - 1);
		      }
		      if (this._options.newline_between_rules && insideRule) {
		        if (this._output.previous_line && this._output.previous_line.item(-1) !== '{') {
		          this._output.ensure_empty_line_above('/', ',');
		        }
		      }

		      this._output.space_before_token = true;

		      // The difference in print_string and indent order is necessary to indent the '{' correctly
		      if (this._options.brace_style === 'expand') {
		        this._output.add_new_line();
		        this.print_string(this._ch);
		        this.indent();
		        this._output.set_indent(this._indentLevel);
		      } else {
		        // inside mixin and first param is object
		        if (previous_ch === '(') {
		          this._output.space_before_token = false;
		        } else if (previous_ch !== ',') {
		          this.indent();
		        }
		        this.print_string(this._ch);
		      }

		      this.eatWhitespace(true);
		      this._output.add_new_line();
		    } else if (this._ch === '}') {
		      this.outdent();
		      this._output.add_new_line();
		      if (previous_ch === '{') {
		        this._output.trim(true);
		      }

		      if (insidePropertyValue) {
		        this.outdent();
		        insidePropertyValue = false;
		      }
		      this.print_string(this._ch);
		      insideRule = false;
		      if (this._nestedLevel) {
		        this._nestedLevel--;
		      }

		      this.eatWhitespace(true);
		      this._output.add_new_line();

		      if (this._options.newline_between_rules && !this._output.just_added_blankline()) {
		        if (this._input.peek() !== '}') {
		          this._output.add_new_line(true);
		        }
		      }
		      if (this._input.peek() === ')') {
		        this._output.trim(true);
		        if (this._options.brace_style === "expand") {
		          this._output.add_new_line(true);
		        }
		      }
		    } else if (this._ch === ":") {

		      for (var i = 0; i < this.NON_SEMICOLON_NEWLINE_PROPERTY.length; i++) {
		        if (this._input.lookBack(this.NON_SEMICOLON_NEWLINE_PROPERTY[i])) {
		          insideNonSemiColonValues = true;
		          break;
		        }
		      }

		      if ((insideRule || enteringConditionalGroup) && !(this._input.lookBack("&") || this.foundNestedPseudoClass()) && !this._input.lookBack("(") && !insideNonNestedAtRule && parenLevel === 0) {
		        // 'property: value' delimiter
		        // which could be in a conditional group query

		        this.print_string(':');
		        if (!insidePropertyValue) {
		          insidePropertyValue = true;
		          this._output.space_before_token = true;
		          this.eatWhitespace(true);
		          this.indent();
		        }
		      } else {
		        // sass/less parent reference don't use a space
		        // sass nested pseudo-class don't use a space

		        // preserve space before pseudoclasses/pseudoelements, as it means "in any child"
		        if (this._input.lookBack(" ")) {
		          this._output.space_before_token = true;
		        }
		        if (this._input.peek() === ":") {
		          // pseudo-element
		          this._ch = this._input.next();
		          this.print_string("::");
		        } else {
		          // pseudo-class
		          this.print_string(':');
		        }
		      }
		    } else if (this._ch === '"' || this._ch === '\'') {
		      var preserveQuoteSpace = previous_ch === '"' || previous_ch === '\'';
		      this.preserveSingleSpace(preserveQuoteSpace || isAfterSpace);
		      this.print_string(this._ch + this.eatString(this._ch));
		      this.eatWhitespace(true);
		    } else if (this._ch === ';') {
		      insideNonSemiColonValues = false;
		      if (parenLevel === 0) {
		        if (insidePropertyValue) {
		          this.outdent();
		          insidePropertyValue = false;
		        }
		        insideNonNestedAtRule = false;
		        this.print_string(this._ch);
		        this.eatWhitespace(true);

		        // This maintains single line comments on the same
		        // line. Block comments are also affected, but
		        // a new line is always output before one inside
		        // that section
		        if (this._input.peek() !== '/') {
		          this._output.add_new_line();
		        }
		      } else {
		        this.print_string(this._ch);
		        this.eatWhitespace(true);
		        this._output.space_before_token = true;
		      }
		    } else if (this._ch === '(') { // may be a url
		      if (this._input.lookBack("url")) {
		        this.print_string(this._ch);
		        this.eatWhitespace();
		        parenLevel++;
		        this.indent();
		        this._ch = this._input.next();
		        if (this._ch === ')' || this._ch === '"' || this._ch === '\'') {
		          this._input.back();
		        } else if (this._ch) {
		          this.print_string(this._ch + this.eatString(')'));
		          if (parenLevel) {
		            parenLevel--;
		            this.outdent();
		          }
		        }
		      } else {
		        var space_needed = false;
		        if (this._input.lookBack("with")) {
		          // look back is not an accurate solution, we need tokens to confirm without whitespaces
		          space_needed = true;
		        }
		        this.preserveSingleSpace(isAfterSpace || space_needed);
		        this.print_string(this._ch);

		        // handle scss/sass map
		        if (insidePropertyValue && previous_ch === "$" && this._options.selector_separator_newline) {
		          this._output.add_new_line();
		          insideScssMap = true;
		        } else {
		          this.eatWhitespace();
		          parenLevel++;
		          this.indent();
		        }
		      }
		    } else if (this._ch === ')') {
		      if (parenLevel) {
		        parenLevel--;
		        this.outdent();
		      }
		      if (insideScssMap && this._input.peek() === ";" && this._options.selector_separator_newline) {
		        insideScssMap = false;
		        this.outdent();
		        this._output.add_new_line();
		      }
		      this.print_string(this._ch);
		    } else if (this._ch === ',') {
		      this.print_string(this._ch);
		      this.eatWhitespace(true);
		      if (this._options.selector_separator_newline && (!insidePropertyValue || insideScssMap) && parenLevel === 0 && !insideNonNestedAtRule) {
		        this._output.add_new_line();
		      } else {
		        this._output.space_before_token = true;
		      }
		    } else if ((this._ch === '>' || this._ch === '+' || this._ch === '~') && !insidePropertyValue && parenLevel === 0) {
		      //handle combinator spacing
		      if (this._options.space_around_combinator) {
		        this._output.space_before_token = true;
		        this.print_string(this._ch);
		        this._output.space_before_token = true;
		      } else {
		        this.print_string(this._ch);
		        this.eatWhitespace();
		        // squash extra whitespace
		        if (this._ch && whitespaceChar.test(this._ch)) {
		          this._ch = '';
		        }
		      }
		    } else if (this._ch === ']') {
		      this.print_string(this._ch);
		    } else if (this._ch === '[') {
		      this.preserveSingleSpace(isAfterSpace);
		      this.print_string(this._ch);
		    } else if (this._ch === '=') { // no whitespace before or after
		      this.eatWhitespace();
		      this.print_string('=');
		      if (whitespaceChar.test(this._ch)) {
		        this._ch = '';
		      }
		    } else if (this._ch === '!' && !this._input.lookBack("\\")) { // !important
		      this._output.space_before_token = true;
		      this.print_string(this._ch);
		    } else {
		      var preserveAfterSpace = previous_ch === '"' || previous_ch === '\'';
		      this.preserveSingleSpace(preserveAfterSpace || isAfterSpace);
		      this.print_string(this._ch);

		      if (!this._output.just_added_newline() && this._input.peek() === '\n' && insideNonSemiColonValues) {
		        this._output.add_new_line();
		      }
		    }
		  }

		  var sweetCode = this._output.get_code(eol);

		  return sweetCode;
		};

		beautifier$1.Beautifier = Beautifier;
		return beautifier$1;
	}

	/*jshint node:true */

	var hasRequiredCss;

	function requireCss () {
		if (hasRequiredCss) return css.exports;
		hasRequiredCss = 1;

		var Beautifier = requireBeautifier$1().Beautifier,
		  Options = requireOptions$1().Options;

		function css_beautify(source_text, options) {
		  var beautifier = new Beautifier(source_text, options);
		  return beautifier.beautify();
		}

		css.exports = css_beautify;
		css.exports.defaultOptions = function() {
		  return new Options();
		};
		return css.exports;
	}

	var html = {exports: {}};

	var beautifier = {};

	var options = {};

	/*jshint node:true */

	var hasRequiredOptions;

	function requireOptions () {
		if (hasRequiredOptions) return options;
		hasRequiredOptions = 1;

		var BaseOptions = requireOptions$3().Options;

		function Options(options) {
		  BaseOptions.call(this, options, 'html');
		  if (this.templating.length === 1 && this.templating[0] === 'auto') {
		    this.templating = ['django', 'erb', 'handlebars', 'php'];
		  }

		  this.indent_inner_html = this._get_boolean('indent_inner_html');
		  this.indent_body_inner_html = this._get_boolean('indent_body_inner_html', true);
		  this.indent_head_inner_html = this._get_boolean('indent_head_inner_html', true);

		  this.indent_handlebars = this._get_boolean('indent_handlebars', true);
		  this.wrap_attributes = this._get_selection('wrap_attributes',
		    ['auto', 'force', 'force-aligned', 'force-expand-multiline', 'aligned-multiple', 'preserve', 'preserve-aligned']);
		  this.wrap_attributes_min_attrs = this._get_number('wrap_attributes_min_attrs', 2);
		  this.wrap_attributes_indent_size = this._get_number('wrap_attributes_indent_size', this.indent_size);
		  this.extra_liners = this._get_array('extra_liners', ['head', 'body', '/html']);

		  // Block vs inline elements
		  // https://developer.mozilla.org/en-US/docs/Web/HTML/Block-level_elements
		  // https://developer.mozilla.org/en-US/docs/Web/HTML/Inline_elements
		  // https://www.w3.org/TR/html5/dom.html#phrasing-content
		  this.inline = this._get_array('inline', [
		    'a', 'abbr', 'area', 'audio', 'b', 'bdi', 'bdo', 'br', 'button', 'canvas', 'cite',
		    'code', 'data', 'datalist', 'del', 'dfn', 'em', 'embed', 'i', 'iframe', 'img',
		    'input', 'ins', 'kbd', 'keygen', 'label', 'map', 'mark', 'math', 'meter', 'noscript',
		    'object', 'output', 'progress', 'q', 'ruby', 's', 'samp', /* 'script', */ 'select', 'small',
		    'span', 'strong', 'sub', 'sup', 'svg', 'template', 'textarea', 'time', 'u', 'var',
		    'video', 'wbr', 'text',
		    // obsolete inline tags
		    'acronym', 'big', 'strike', 'tt'
		  ]);
		  this.inline_custom_elements = this._get_boolean('inline_custom_elements', true);
		  this.void_elements = this._get_array('void_elements', [
		    // HTLM void elements - aka self-closing tags - aka singletons
		    // https://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
		    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen',
		    'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr',
		    // NOTE: Optional tags are too complex for a simple list
		    // they are hard coded in _do_optional_end_element

		    // Doctype and xml elements
		    '!doctype', '?xml',

		    // obsolete tags
		    // basefont: https://www.computerhope.com/jargon/h/html-basefont-tag.htm
		    // isndex: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/isindex
		    'basefont', 'isindex'
		  ]);
		  this.unformatted = this._get_array('unformatted', []);
		  this.content_unformatted = this._get_array('content_unformatted', [
		    'pre', 'textarea'
		  ]);
		  this.unformatted_content_delimiter = this._get_characters('unformatted_content_delimiter');
		  this.indent_scripts = this._get_selection('indent_scripts', ['normal', 'keep', 'separate']);

		}
		Options.prototype = new BaseOptions();



		options.Options = Options;
		return options;
	}

	var tokenizer = {};

	/*jshint node:true */

	var hasRequiredTokenizer;

	function requireTokenizer () {
		if (hasRequiredTokenizer) return tokenizer;
		hasRequiredTokenizer = 1;

		var BaseTokenizer = requireTokenizer$2().Tokenizer;
		var BASETOKEN = requireTokenizer$2().TOKEN;
		var Directives = requireDirectives().Directives;
		var TemplatablePattern = requireTemplatablepattern().TemplatablePattern;
		var Pattern = requirePattern().Pattern;

		var TOKEN = {
		  TAG_OPEN: 'TK_TAG_OPEN',
		  TAG_CLOSE: 'TK_TAG_CLOSE',
		  CONTROL_FLOW_OPEN: 'TK_CONTROL_FLOW_OPEN',
		  CONTROL_FLOW_CLOSE: 'TK_CONTROL_FLOW_CLOSE',
		  ATTRIBUTE: 'TK_ATTRIBUTE',
		  EQUALS: 'TK_EQUALS',
		  VALUE: 'TK_VALUE',
		  COMMENT: 'TK_COMMENT',
		  TEXT: 'TK_TEXT',
		  UNKNOWN: 'TK_UNKNOWN',
		  START: BASETOKEN.START,
		  RAW: BASETOKEN.RAW,
		  EOF: BASETOKEN.EOF
		};

		var directives_core = new Directives(/<\!--/, /-->/);

		var Tokenizer = function(input_string, options) {
		  BaseTokenizer.call(this, input_string, options);
		  this._current_tag_name = '';

		  // Words end at whitespace or when a tag starts
		  // if we are indenting handlebars, they are considered tags
		  var templatable_reader = new TemplatablePattern(this._input).read_options(this._options);
		  var pattern_reader = new Pattern(this._input);

		  this.__patterns = {
		    word: templatable_reader.until(/[\n\r\t <]/),
		    word_control_flow_close_excluded: templatable_reader.until(/[\n\r\t <}]/),
		    single_quote: templatable_reader.until_after(/'/),
		    double_quote: templatable_reader.until_after(/"/),
		    attribute: templatable_reader.until(/[\n\r\t =>]|\/>/),
		    element_name: templatable_reader.until(/[\n\r\t >\/]/),

		    angular_control_flow_start: pattern_reader.matching(/\@[a-zA-Z]+[^({]*[({]/),
		    handlebars_comment: pattern_reader.starting_with(/{{!--/).until_after(/--}}/),
		    handlebars: pattern_reader.starting_with(/{{/).until_after(/}}/),
		    handlebars_open: pattern_reader.until(/[\n\r\t }]/),
		    handlebars_raw_close: pattern_reader.until(/}}/),
		    comment: pattern_reader.starting_with(/<!--/).until_after(/-->/),
		    cdata: pattern_reader.starting_with(/<!\[CDATA\[/).until_after(/]]>/),
		    // https://en.wikipedia.org/wiki/Conditional_comment
		    conditional_comment: pattern_reader.starting_with(/<!\[/).until_after(/]>/),
		    processing: pattern_reader.starting_with(/<\?/).until_after(/\?>/)
		  };

		  if (this._options.indent_handlebars) {
		    this.__patterns.word = this.__patterns.word.exclude('handlebars');
		    this.__patterns.word_control_flow_close_excluded = this.__patterns.word_control_flow_close_excluded.exclude('handlebars');
		  }

		  this._unformatted_content_delimiter = null;

		  if (this._options.unformatted_content_delimiter) {
		    var literal_regexp = this._input.get_literal_regexp(this._options.unformatted_content_delimiter);
		    this.__patterns.unformatted_content_delimiter =
		      pattern_reader.matching(literal_regexp)
		      .until_after(literal_regexp);
		  }
		};
		Tokenizer.prototype = new BaseTokenizer();

		Tokenizer.prototype._is_comment = function(current_token) { // jshint unused:false
		  return false; //current_token.type === TOKEN.COMMENT || current_token.type === TOKEN.UNKNOWN;
		};

		Tokenizer.prototype._is_opening = function(current_token) {
		  return current_token.type === TOKEN.TAG_OPEN || current_token.type === TOKEN.CONTROL_FLOW_OPEN;
		};

		Tokenizer.prototype._is_closing = function(current_token, open_token) {
		  return (current_token.type === TOKEN.TAG_CLOSE &&
		    (open_token && (
		      ((current_token.text === '>' || current_token.text === '/>') && open_token.text[0] === '<') ||
		      (current_token.text === '}}' && open_token.text[0] === '{' && open_token.text[1] === '{')))
		  ) || (current_token.type === TOKEN.CONTROL_FLOW_CLOSE &&
		    (current_token.text === '}' && open_token.text.endsWith('{')));
		};

		Tokenizer.prototype._reset = function() {
		  this._current_tag_name = '';
		};

		Tokenizer.prototype._get_next_token = function(previous_token, open_token) { // jshint unused:false
		  var token = null;
		  this._readWhitespace();
		  var c = this._input.peek();

		  if (c === null) {
		    return this._create_token(TOKEN.EOF, '');
		  }

		  token = token || this._read_open_handlebars(c, open_token);
		  token = token || this._read_attribute(c, previous_token, open_token);
		  token = token || this._read_close(c, open_token);
		  token = token || this._read_script_and_style(c, previous_token);
		  token = token || this._read_control_flows(c, open_token);
		  token = token || this._read_raw_content(c, previous_token, open_token);
		  token = token || this._read_content_word(c, open_token);
		  token = token || this._read_comment_or_cdata(c);
		  token = token || this._read_processing(c);
		  token = token || this._read_open(c, open_token);
		  token = token || this._create_token(TOKEN.UNKNOWN, this._input.next());

		  return token;
		};

		Tokenizer.prototype._read_comment_or_cdata = function(c) { // jshint unused:false
		  var token = null;
		  var resulting_string = null;
		  var directives = null;

		  if (c === '<') {
		    var peek1 = this._input.peek(1);
		    // We treat all comments as literals, even more than preformatted tags
		    // we only look for the appropriate closing marker
		    if (peek1 === '!') {
		      resulting_string = this.__patterns.comment.read();

		      // only process directive on html comments
		      if (resulting_string) {
		        directives = directives_core.get_directives(resulting_string);
		        if (directives && directives.ignore === 'start') {
		          resulting_string += directives_core.readIgnored(this._input);
		        }
		      } else {
		        resulting_string = this.__patterns.cdata.read();
		      }
		    }

		    if (resulting_string) {
		      token = this._create_token(TOKEN.COMMENT, resulting_string);
		      token.directives = directives;
		    }
		  }

		  return token;
		};

		Tokenizer.prototype._read_processing = function(c) { // jshint unused:false
		  var token = null;
		  var resulting_string = null;
		  var directives = null;

		  if (c === '<') {
		    var peek1 = this._input.peek(1);
		    if (peek1 === '!' || peek1 === '?') {
		      resulting_string = this.__patterns.conditional_comment.read();
		      resulting_string = resulting_string || this.__patterns.processing.read();
		    }

		    if (resulting_string) {
		      token = this._create_token(TOKEN.COMMENT, resulting_string);
		      token.directives = directives;
		    }
		  }

		  return token;
		};

		Tokenizer.prototype._read_open = function(c, open_token) {
		  var resulting_string = null;
		  var token = null;
		  if (!open_token || open_token.type === TOKEN.CONTROL_FLOW_OPEN) {
		    if (c === '<') {

		      resulting_string = this._input.next();
		      if (this._input.peek() === '/') {
		        resulting_string += this._input.next();
		      }
		      resulting_string += this.__patterns.element_name.read();
		      token = this._create_token(TOKEN.TAG_OPEN, resulting_string);
		    }
		  }
		  return token;
		};

		Tokenizer.prototype._read_open_handlebars = function(c, open_token) {
		  var resulting_string = null;
		  var token = null;
		  if (!open_token || open_token.type === TOKEN.CONTROL_FLOW_OPEN) {
		    if ((this._options.templating.includes('angular') || this._options.indent_handlebars) && c === '{' && this._input.peek(1) === '{') {
		      if (this._options.indent_handlebars && this._input.peek(2) === '!') {
		        resulting_string = this.__patterns.handlebars_comment.read();
		        resulting_string = resulting_string || this.__patterns.handlebars.read();
		        token = this._create_token(TOKEN.COMMENT, resulting_string);
		      } else {
		        resulting_string = this.__patterns.handlebars_open.read();
		        token = this._create_token(TOKEN.TAG_OPEN, resulting_string);
		      }
		    }
		  }
		  return token;
		};

		Tokenizer.prototype._read_control_flows = function(c, open_token) {
		  var resulting_string = '';
		  var token = null;
		  // Only check for control flows if angular templating is set
		  if (!this._options.templating.includes('angular')) {
		    return token;
		  }

		  if (c === '@') {
		    resulting_string = this.__patterns.angular_control_flow_start.read();
		    if (resulting_string === '') {
		      return token;
		    }

		    var opening_parentheses_count = resulting_string.endsWith('(') ? 1 : 0;
		    var closing_parentheses_count = 0;
		    // The opening brace of the control flow is where the number of opening and closing parentheses equal
		    // e.g. @if({value: true} !== null) { 
		    while (!(resulting_string.endsWith('{') && opening_parentheses_count === closing_parentheses_count)) {
		      var next_char = this._input.next();
		      if (next_char === null) {
		        break;
		      } else if (next_char === '(') {
		        opening_parentheses_count++;
		      } else if (next_char === ')') {
		        closing_parentheses_count++;
		      }
		      resulting_string += next_char;
		    }
		    token = this._create_token(TOKEN.CONTROL_FLOW_OPEN, resulting_string);
		  } else if (c === '}' && open_token && open_token.type === TOKEN.CONTROL_FLOW_OPEN) {
		    resulting_string = this._input.next();
		    token = this._create_token(TOKEN.CONTROL_FLOW_CLOSE, resulting_string);
		  }
		  return token;
		};


		Tokenizer.prototype._read_close = function(c, open_token) {
		  var resulting_string = null;
		  var token = null;
		  if (open_token && open_token.type === TOKEN.TAG_OPEN) {
		    if (open_token.text[0] === '<' && (c === '>' || (c === '/' && this._input.peek(1) === '>'))) {
		      resulting_string = this._input.next();
		      if (c === '/') { //  for close tag "/>"
		        resulting_string += this._input.next();
		      }
		      token = this._create_token(TOKEN.TAG_CLOSE, resulting_string);
		    } else if (open_token.text[0] === '{' && c === '}' && this._input.peek(1) === '}') {
		      this._input.next();
		      this._input.next();
		      token = this._create_token(TOKEN.TAG_CLOSE, '}}');
		    }
		  }

		  return token;
		};

		Tokenizer.prototype._read_attribute = function(c, previous_token, open_token) {
		  var token = null;
		  var resulting_string = '';
		  if (open_token && open_token.text[0] === '<') {

		    if (c === '=') {
		      token = this._create_token(TOKEN.EQUALS, this._input.next());
		    } else if (c === '"' || c === "'") {
		      var content = this._input.next();
		      if (c === '"') {
		        content += this.__patterns.double_quote.read();
		      } else {
		        content += this.__patterns.single_quote.read();
		      }
		      token = this._create_token(TOKEN.VALUE, content);
		    } else {
		      resulting_string = this.__patterns.attribute.read();

		      if (resulting_string) {
		        if (previous_token.type === TOKEN.EQUALS) {
		          token = this._create_token(TOKEN.VALUE, resulting_string);
		        } else {
		          token = this._create_token(TOKEN.ATTRIBUTE, resulting_string);
		        }
		      }
		    }
		  }
		  return token;
		};

		Tokenizer.prototype._is_content_unformatted = function(tag_name) {
		  // void_elements have no content and so cannot have unformatted content
		  // script and style tags should always be read as unformatted content
		  // finally content_unformatted and unformatted element contents are unformatted
		  return this._options.void_elements.indexOf(tag_name) === -1 &&
		    (this._options.content_unformatted.indexOf(tag_name) !== -1 ||
		      this._options.unformatted.indexOf(tag_name) !== -1);
		};

		Tokenizer.prototype._read_raw_content = function(c, previous_token, open_token) { // jshint unused:false
		  var resulting_string = '';
		  if (open_token && open_token.text[0] === '{') {
		    resulting_string = this.__patterns.handlebars_raw_close.read();
		  } else if (previous_token.type === TOKEN.TAG_CLOSE &&
		    previous_token.opened.text[0] === '<' && previous_token.text[0] !== '/') {
		    // ^^ empty tag has no content 
		    var tag_name = previous_token.opened.text.substr(1).toLowerCase();
		    if (this._is_content_unformatted(tag_name)) {

		      resulting_string = this._input.readUntil(new RegExp('</' + tag_name + '[\\n\\r\\t ]*?>', 'ig'));
		    }
		  }

		  if (resulting_string) {
		    return this._create_token(TOKEN.TEXT, resulting_string);
		  }

		  return null;
		};

		Tokenizer.prototype._read_script_and_style = function(c, previous_token) { // jshint unused:false 
		  if (previous_token.type === TOKEN.TAG_CLOSE && previous_token.opened.text[0] === '<' && previous_token.text[0] !== '/') {
		    var tag_name = previous_token.opened.text.substr(1).toLowerCase();
		    if (tag_name === 'script' || tag_name === 'style') {
		      // Script and style tags are allowed to have comments wrapping their content
		      // or just have regular content.
		      var token = this._read_comment_or_cdata(c);
		      if (token) {
		        token.type = TOKEN.TEXT;
		        return token;
		      }
		      var resulting_string = this._input.readUntil(new RegExp('</' + tag_name + '[\\n\\r\\t ]*?>', 'ig'));
		      if (resulting_string) {
		        return this._create_token(TOKEN.TEXT, resulting_string);
		      }
		    }
		  }
		  return null;
		};

		Tokenizer.prototype._read_content_word = function(c, open_token) {
		  var resulting_string = '';
		  if (this._options.unformatted_content_delimiter) {
		    if (c === this._options.unformatted_content_delimiter[0]) {
		      resulting_string = this.__patterns.unformatted_content_delimiter.read();
		    }
		  }

		  if (!resulting_string) {
		    resulting_string = (open_token && open_token.type === TOKEN.CONTROL_FLOW_OPEN) ? this.__patterns.word_control_flow_close_excluded.read() : this.__patterns.word.read();
		  }
		  if (resulting_string) {
		    return this._create_token(TOKEN.TEXT, resulting_string);
		  }
		  return null;
		};

		tokenizer.Tokenizer = Tokenizer;
		tokenizer.TOKEN = TOKEN;
		return tokenizer;
	}

	/*jshint node:true */

	var hasRequiredBeautifier;

	function requireBeautifier () {
		if (hasRequiredBeautifier) return beautifier;
		hasRequiredBeautifier = 1;

		var Options = requireOptions().Options;
		var Output = requireOutput().Output;
		var Tokenizer = requireTokenizer().Tokenizer;
		var TOKEN = requireTokenizer().TOKEN;

		var lineBreak = /\r\n|[\r\n]/;
		var allLineBreaks = /\r\n|[\r\n]/g;

		var Printer = function(options, base_indent_string) { //handles input/output and some other printing functions

		  this.indent_level = 0;
		  this.alignment_size = 0;
		  this.max_preserve_newlines = options.max_preserve_newlines;
		  this.preserve_newlines = options.preserve_newlines;

		  this._output = new Output(options, base_indent_string);

		};

		Printer.prototype.current_line_has_match = function(pattern) {
		  return this._output.current_line.has_match(pattern);
		};

		Printer.prototype.set_space_before_token = function(value, non_breaking) {
		  this._output.space_before_token = value;
		  this._output.non_breaking_space = non_breaking;
		};

		Printer.prototype.set_wrap_point = function() {
		  this._output.set_indent(this.indent_level, this.alignment_size);
		  this._output.set_wrap_point();
		};


		Printer.prototype.add_raw_token = function(token) {
		  this._output.add_raw_token(token);
		};

		Printer.prototype.print_preserved_newlines = function(raw_token) {
		  var newlines = 0;
		  if (raw_token.type !== TOKEN.TEXT && raw_token.previous.type !== TOKEN.TEXT) {
		    newlines = raw_token.newlines ? 1 : 0;
		  }

		  if (this.preserve_newlines) {
		    newlines = raw_token.newlines < this.max_preserve_newlines + 1 ? raw_token.newlines : this.max_preserve_newlines + 1;
		  }
		  for (var n = 0; n < newlines; n++) {
		    this.print_newline(n > 0);
		  }

		  return newlines !== 0;
		};

		Printer.prototype.traverse_whitespace = function(raw_token) {
		  if (raw_token.whitespace_before || raw_token.newlines) {
		    if (!this.print_preserved_newlines(raw_token)) {
		      this._output.space_before_token = true;
		    }
		    return true;
		  }
		  return false;
		};

		Printer.prototype.previous_token_wrapped = function() {
		  return this._output.previous_token_wrapped;
		};

		Printer.prototype.print_newline = function(force) {
		  this._output.add_new_line(force);
		};

		Printer.prototype.print_token = function(token) {
		  if (token.text) {
		    this._output.set_indent(this.indent_level, this.alignment_size);
		    this._output.add_token(token.text);
		  }
		};

		Printer.prototype.indent = function() {
		  this.indent_level++;
		};

		Printer.prototype.deindent = function() {
		  if (this.indent_level > 0) {
		    this.indent_level--;
		    this._output.set_indent(this.indent_level, this.alignment_size);
		  }
		};

		Printer.prototype.get_full_indent = function(level) {
		  level = this.indent_level + (level || 0);
		  if (level < 1) {
		    return '';
		  }

		  return this._output.get_indent_string(level);
		};

		var get_type_attribute = function(start_token) {
		  var result = null;
		  var raw_token = start_token.next;

		  // Search attributes for a type attribute
		  while (raw_token.type !== TOKEN.EOF && start_token.closed !== raw_token) {
		    if (raw_token.type === TOKEN.ATTRIBUTE && raw_token.text === 'type') {
		      if (raw_token.next && raw_token.next.type === TOKEN.EQUALS &&
		        raw_token.next.next && raw_token.next.next.type === TOKEN.VALUE) {
		        result = raw_token.next.next.text;
		      }
		      break;
		    }
		    raw_token = raw_token.next;
		  }

		  return result;
		};

		var get_custom_beautifier_name = function(tag_check, raw_token) {
		  var typeAttribute = null;
		  var result = null;

		  if (!raw_token.closed) {
		    return null;
		  }

		  if (tag_check === 'script') {
		    typeAttribute = 'text/javascript';
		  } else if (tag_check === 'style') {
		    typeAttribute = 'text/css';
		  }

		  typeAttribute = get_type_attribute(raw_token) || typeAttribute;

		  // For script and style tags that have a type attribute, only enable custom beautifiers for matching values
		  // For those without a type attribute use default;
		  if (typeAttribute.search('text/css') > -1) {
		    result = 'css';
		  } else if (typeAttribute.search(/module|importmap|((text|application|dojo)\/(x-)?(javascript|ecmascript|jscript|livescript|(ld\+)?json|method|aspect))/) > -1) {
		    result = 'javascript';
		  } else if (typeAttribute.search(/(text|application|dojo)\/(x-)?(html)/) > -1) {
		    result = 'html';
		  } else if (typeAttribute.search(/test\/null/) > -1) {
		    // Test only mime-type for testing the beautifier when null is passed as beautifing function
		    result = 'null';
		  }

		  return result;
		};

		function in_array(what, arr) {
		  return arr.indexOf(what) !== -1;
		}

		function TagFrame(parent, parser_token, indent_level) {
		  this.parent = parent || null;
		  this.tag = parser_token ? parser_token.tag_name : '';
		  this.indent_level = indent_level || 0;
		  this.parser_token = parser_token || null;
		}

		function TagStack(printer) {
		  this._printer = printer;
		  this._current_frame = null;
		}

		TagStack.prototype.get_parser_token = function() {
		  return this._current_frame ? this._current_frame.parser_token : null;
		};

		TagStack.prototype.record_tag = function(parser_token) { //function to record a tag and its parent in this.tags Object
		  var new_frame = new TagFrame(this._current_frame, parser_token, this._printer.indent_level);
		  this._current_frame = new_frame;
		};

		TagStack.prototype._try_pop_frame = function(frame) { //function to retrieve the opening tag to the corresponding closer
		  var parser_token = null;

		  if (frame) {
		    parser_token = frame.parser_token;
		    this._printer.indent_level = frame.indent_level;
		    this._current_frame = frame.parent;
		  }

		  return parser_token;
		};

		TagStack.prototype._get_frame = function(tag_list, stop_list) { //function to retrieve the opening tag to the corresponding closer
		  var frame = this._current_frame;

		  while (frame) { //till we reach '' (the initial value);
		    if (tag_list.indexOf(frame.tag) !== -1) { //if this is it use it
		      break;
		    } else if (stop_list && stop_list.indexOf(frame.tag) !== -1) {
		      frame = null;
		      break;
		    }
		    frame = frame.parent;
		  }

		  return frame;
		};

		TagStack.prototype.try_pop = function(tag, stop_list) { //function to retrieve the opening tag to the corresponding closer
		  var frame = this._get_frame([tag], stop_list);
		  return this._try_pop_frame(frame);
		};

		TagStack.prototype.indent_to_tag = function(tag_list) {
		  var frame = this._get_frame(tag_list);
		  if (frame) {
		    this._printer.indent_level = frame.indent_level;
		  }
		};

		function Beautifier(source_text, options, js_beautify, css_beautify) {
		  //Wrapper function to invoke all the necessary constructors and deal with the output.
		  this._source_text = source_text || '';
		  options = options || {};
		  this._js_beautify = js_beautify;
		  this._css_beautify = css_beautify;
		  this._tag_stack = null;

		  // Allow the setting of language/file-type specific options
		  // with inheritance of overall settings
		  var optionHtml = new Options(options, 'html');

		  this._options = optionHtml;

		  this._is_wrap_attributes_force = this._options.wrap_attributes.substr(0, 'force'.length) === 'force';
		  this._is_wrap_attributes_force_expand_multiline = (this._options.wrap_attributes === 'force-expand-multiline');
		  this._is_wrap_attributes_force_aligned = (this._options.wrap_attributes === 'force-aligned');
		  this._is_wrap_attributes_aligned_multiple = (this._options.wrap_attributes === 'aligned-multiple');
		  this._is_wrap_attributes_preserve = this._options.wrap_attributes.substr(0, 'preserve'.length) === 'preserve';
		  this._is_wrap_attributes_preserve_aligned = (this._options.wrap_attributes === 'preserve-aligned');
		}

		Beautifier.prototype.beautify = function() {

		  // if disabled, return the input unchanged.
		  if (this._options.disabled) {
		    return this._source_text;
		  }

		  var source_text = this._source_text;
		  var eol = this._options.eol;
		  if (this._options.eol === 'auto') {
		    eol = '\n';
		    if (source_text && lineBreak.test(source_text)) {
		      eol = source_text.match(lineBreak)[0];
		    }
		  }

		  // HACK: newline parsing inconsistent. This brute force normalizes the input.
		  source_text = source_text.replace(allLineBreaks, '\n');

		  var baseIndentString = source_text.match(/^[\t ]*/)[0];

		  var last_token = {
		    text: '',
		    type: ''
		  };

		  var last_tag_token = new TagOpenParserToken(this._options);

		  var printer = new Printer(this._options, baseIndentString);
		  var tokens = new Tokenizer(source_text, this._options).tokenize();

		  this._tag_stack = new TagStack(printer);

		  var parser_token = null;
		  var raw_token = tokens.next();
		  while (raw_token.type !== TOKEN.EOF) {

		    if (raw_token.type === TOKEN.TAG_OPEN || raw_token.type === TOKEN.COMMENT) {
		      parser_token = this._handle_tag_open(printer, raw_token, last_tag_token, last_token, tokens);
		      last_tag_token = parser_token;
		    } else if ((raw_token.type === TOKEN.ATTRIBUTE || raw_token.type === TOKEN.EQUALS || raw_token.type === TOKEN.VALUE) ||
		      (raw_token.type === TOKEN.TEXT && !last_tag_token.tag_complete)) {
		      parser_token = this._handle_inside_tag(printer, raw_token, last_tag_token, last_token);
		    } else if (raw_token.type === TOKEN.TAG_CLOSE) {
		      parser_token = this._handle_tag_close(printer, raw_token, last_tag_token);
		    } else if (raw_token.type === TOKEN.TEXT) {
		      parser_token = this._handle_text(printer, raw_token, last_tag_token);
		    } else if (raw_token.type === TOKEN.CONTROL_FLOW_OPEN) {
		      parser_token = this._handle_control_flow_open(printer, raw_token);
		    } else if (raw_token.type === TOKEN.CONTROL_FLOW_CLOSE) {
		      parser_token = this._handle_control_flow_close(printer, raw_token);
		    } else {
		      // This should never happen, but if it does. Print the raw token
		      printer.add_raw_token(raw_token);
		    }

		    last_token = parser_token;

		    raw_token = tokens.next();
		  }
		  var sweet_code = printer._output.get_code(eol);

		  return sweet_code;
		};

		Beautifier.prototype._handle_control_flow_open = function(printer, raw_token) {
		  var parser_token = {
		    text: raw_token.text,
		    type: raw_token.type
		  };
		  printer.set_space_before_token(raw_token.newlines || raw_token.whitespace_before !== '', true);
		  if (raw_token.newlines) {
		    printer.print_preserved_newlines(raw_token);
		  } else {
		    printer.set_space_before_token(raw_token.newlines || raw_token.whitespace_before !== '', true);
		  }
		  printer.print_token(raw_token);
		  printer.indent();
		  return parser_token;
		};

		Beautifier.prototype._handle_control_flow_close = function(printer, raw_token) {
		  var parser_token = {
		    text: raw_token.text,
		    type: raw_token.type
		  };

		  printer.deindent();
		  if (raw_token.newlines) {
		    printer.print_preserved_newlines(raw_token);
		  } else {
		    printer.set_space_before_token(raw_token.newlines || raw_token.whitespace_before !== '', true);
		  }
		  printer.print_token(raw_token);
		  return parser_token;
		};

		Beautifier.prototype._handle_tag_close = function(printer, raw_token, last_tag_token) {
		  var parser_token = {
		    text: raw_token.text,
		    type: raw_token.type
		  };
		  printer.alignment_size = 0;
		  last_tag_token.tag_complete = true;

		  printer.set_space_before_token(raw_token.newlines || raw_token.whitespace_before !== '', true);
		  if (last_tag_token.is_unformatted) {
		    printer.add_raw_token(raw_token);
		  } else {
		    if (last_tag_token.tag_start_char === '<') {
		      printer.set_space_before_token(raw_token.text[0] === '/', true); // space before />, no space before >
		      if (this._is_wrap_attributes_force_expand_multiline && last_tag_token.has_wrapped_attrs) {
		        printer.print_newline(false);
		      }
		    }
		    printer.print_token(raw_token);

		  }

		  if (last_tag_token.indent_content &&
		    !(last_tag_token.is_unformatted || last_tag_token.is_content_unformatted)) {
		    printer.indent();

		    // only indent once per opened tag
		    last_tag_token.indent_content = false;
		  }

		  if (!last_tag_token.is_inline_element &&
		    !(last_tag_token.is_unformatted || last_tag_token.is_content_unformatted)) {
		    printer.set_wrap_point();
		  }

		  return parser_token;
		};

		Beautifier.prototype._handle_inside_tag = function(printer, raw_token, last_tag_token, last_token) {
		  var wrapped = last_tag_token.has_wrapped_attrs;
		  var parser_token = {
		    text: raw_token.text,
		    type: raw_token.type
		  };

		  printer.set_space_before_token(raw_token.newlines || raw_token.whitespace_before !== '', true);
		  if (last_tag_token.is_unformatted) {
		    printer.add_raw_token(raw_token);
		  } else if (last_tag_token.tag_start_char === '{' && raw_token.type === TOKEN.TEXT) {
		    // For the insides of handlebars allow newlines or a single space between open and contents
		    if (printer.print_preserved_newlines(raw_token)) {
		      raw_token.newlines = 0;
		      printer.add_raw_token(raw_token);
		    } else {
		      printer.print_token(raw_token);
		    }
		  } else {
		    if (raw_token.type === TOKEN.ATTRIBUTE) {
		      printer.set_space_before_token(true);
		    } else if (raw_token.type === TOKEN.EQUALS) { //no space before =
		      printer.set_space_before_token(false);
		    } else if (raw_token.type === TOKEN.VALUE && raw_token.previous.type === TOKEN.EQUALS) { //no space before value
		      printer.set_space_before_token(false);
		    }

		    if (raw_token.type === TOKEN.ATTRIBUTE && last_tag_token.tag_start_char === '<') {
		      if (this._is_wrap_attributes_preserve || this._is_wrap_attributes_preserve_aligned) {
		        printer.traverse_whitespace(raw_token);
		        wrapped = wrapped || raw_token.newlines !== 0;
		      }

		      // Wrap for 'force' options, and if the number of attributes is at least that specified in 'wrap_attributes_min_attrs':
		      // 1. always wrap the second and beyond attributes
		      // 2. wrap the first attribute only if 'force-expand-multiline' is specified
		      if (this._is_wrap_attributes_force &&
		        last_tag_token.attr_count >= this._options.wrap_attributes_min_attrs &&
		        (last_token.type !== TOKEN.TAG_OPEN || // ie. second attribute and beyond
		          this._is_wrap_attributes_force_expand_multiline)) {
		        printer.print_newline(false);
		        wrapped = true;
		      }
		    }
		    printer.print_token(raw_token);
		    wrapped = wrapped || printer.previous_token_wrapped();
		    last_tag_token.has_wrapped_attrs = wrapped;
		  }
		  return parser_token;
		};

		Beautifier.prototype._handle_text = function(printer, raw_token, last_tag_token) {
		  var parser_token = {
		    text: raw_token.text,
		    type: 'TK_CONTENT'
		  };
		  if (last_tag_token.custom_beautifier_name) { //check if we need to format javascript
		    this._print_custom_beatifier_text(printer, raw_token, last_tag_token);
		  } else if (last_tag_token.is_unformatted || last_tag_token.is_content_unformatted) {
		    printer.add_raw_token(raw_token);
		  } else {
		    printer.traverse_whitespace(raw_token);
		    printer.print_token(raw_token);
		  }
		  return parser_token;
		};

		Beautifier.prototype._print_custom_beatifier_text = function(printer, raw_token, last_tag_token) {
		  var local = this;
		  if (raw_token.text !== '') {

		    var text = raw_token.text,
		      _beautifier,
		      script_indent_level = 1,
		      pre = '',
		      post = '';
		    if (last_tag_token.custom_beautifier_name === 'javascript' && typeof this._js_beautify === 'function') {
		      _beautifier = this._js_beautify;
		    } else if (last_tag_token.custom_beautifier_name === 'css' && typeof this._css_beautify === 'function') {
		      _beautifier = this._css_beautify;
		    } else if (last_tag_token.custom_beautifier_name === 'html') {
		      _beautifier = function(html_source, options) {
		        var beautifier = new Beautifier(html_source, options, local._js_beautify, local._css_beautify);
		        return beautifier.beautify();
		      };
		    }

		    if (this._options.indent_scripts === "keep") {
		      script_indent_level = 0;
		    } else if (this._options.indent_scripts === "separate") {
		      script_indent_level = -printer.indent_level;
		    }

		    var indentation = printer.get_full_indent(script_indent_level);

		    // if there is at least one empty line at the end of this text, strip it
		    // we'll be adding one back after the text but before the containing tag.
		    text = text.replace(/\n[ \t]*$/, '');

		    // Handle the case where content is wrapped in a comment or cdata.
		    if (last_tag_token.custom_beautifier_name !== 'html' &&
		      text[0] === '<' && text.match(/^(<!--|<!\[CDATA\[)/)) {
		      var matched = /^(<!--[^\n]*|<!\[CDATA\[)(\n?)([ \t\n]*)([\s\S]*)(-->|]]>)$/.exec(text);

		      // if we start to wrap but don't finish, print raw
		      if (!matched) {
		        printer.add_raw_token(raw_token);
		        return;
		      }

		      pre = indentation + matched[1] + '\n';
		      text = matched[4];
		      if (matched[5]) {
		        post = indentation + matched[5];
		      }

		      // if there is at least one empty line at the end of this text, strip it
		      // we'll be adding one back after the text but before the containing tag.
		      text = text.replace(/\n[ \t]*$/, '');

		      if (matched[2] || matched[3].indexOf('\n') !== -1) {
		        // if the first line of the non-comment text has spaces
		        // use that as the basis for indenting in null case.
		        matched = matched[3].match(/[ \t]+$/);
		        if (matched) {
		          raw_token.whitespace_before = matched[0];
		        }
		      }
		    }

		    if (text) {
		      if (_beautifier) {

		        // call the Beautifier if avaliable
		        var Child_options = function() {
		          this.eol = '\n';
		        };
		        Child_options.prototype = this._options.raw_options;
		        var child_options = new Child_options();
		        text = _beautifier(indentation + text, child_options);
		      } else {
		        // simply indent the string otherwise
		        var white = raw_token.whitespace_before;
		        if (white) {
		          text = text.replace(new RegExp('\n(' + white + ')?', 'g'), '\n');
		        }

		        text = indentation + text.replace(/\n/g, '\n' + indentation);
		      }
		    }

		    if (pre) {
		      if (!text) {
		        text = pre + post;
		      } else {
		        text = pre + text + '\n' + post;
		      }
		    }

		    printer.print_newline(false);
		    if (text) {
		      raw_token.text = text;
		      raw_token.whitespace_before = '';
		      raw_token.newlines = 0;
		      printer.add_raw_token(raw_token);
		      printer.print_newline(true);
		    }
		  }
		};

		Beautifier.prototype._handle_tag_open = function(printer, raw_token, last_tag_token, last_token, tokens) {
		  var parser_token = this._get_tag_open_token(raw_token);

		  if ((last_tag_token.is_unformatted || last_tag_token.is_content_unformatted) &&
		    !last_tag_token.is_empty_element &&
		    raw_token.type === TOKEN.TAG_OPEN && !parser_token.is_start_tag) {
		    // End element tags for unformatted or content_unformatted elements
		    // are printed raw to keep any newlines inside them exactly the same.
		    printer.add_raw_token(raw_token);
		    parser_token.start_tag_token = this._tag_stack.try_pop(parser_token.tag_name);
		  } else {
		    printer.traverse_whitespace(raw_token);
		    this._set_tag_position(printer, raw_token, parser_token, last_tag_token, last_token);
		    if (!parser_token.is_inline_element) {
		      printer.set_wrap_point();
		    }
		    printer.print_token(raw_token);
		  }

		  // count the number of attributes
		  if (parser_token.is_start_tag && this._is_wrap_attributes_force) {
		    var peek_index = 0;
		    var peek_token;
		    do {
		      peek_token = tokens.peek(peek_index);
		      if (peek_token.type === TOKEN.ATTRIBUTE) {
		        parser_token.attr_count += 1;
		      }
		      peek_index += 1;
		    } while (peek_token.type !== TOKEN.EOF && peek_token.type !== TOKEN.TAG_CLOSE);
		  }

		  //indent attributes an auto, forced, aligned or forced-align line-wrap
		  if (this._is_wrap_attributes_force_aligned || this._is_wrap_attributes_aligned_multiple || this._is_wrap_attributes_preserve_aligned) {
		    parser_token.alignment_size = raw_token.text.length + 1;
		  }

		  if (!parser_token.tag_complete && !parser_token.is_unformatted) {
		    printer.alignment_size = parser_token.alignment_size;
		  }

		  return parser_token;
		};

		var TagOpenParserToken = function(options, parent, raw_token) {
		  this.parent = parent || null;
		  this.text = '';
		  this.type = 'TK_TAG_OPEN';
		  this.tag_name = '';
		  this.is_inline_element = false;
		  this.is_unformatted = false;
		  this.is_content_unformatted = false;
		  this.is_empty_element = false;
		  this.is_start_tag = false;
		  this.is_end_tag = false;
		  this.indent_content = false;
		  this.multiline_content = false;
		  this.custom_beautifier_name = null;
		  this.start_tag_token = null;
		  this.attr_count = 0;
		  this.has_wrapped_attrs = false;
		  this.alignment_size = 0;
		  this.tag_complete = false;
		  this.tag_start_char = '';
		  this.tag_check = '';

		  if (!raw_token) {
		    this.tag_complete = true;
		  } else {
		    var tag_check_match;

		    this.tag_start_char = raw_token.text[0];
		    this.text = raw_token.text;

		    if (this.tag_start_char === '<') {
		      tag_check_match = raw_token.text.match(/^<([^\s>]*)/);
		      this.tag_check = tag_check_match ? tag_check_match[1] : '';
		    } else {
		      tag_check_match = raw_token.text.match(/^{{~?(?:[\^]|#\*?)?([^\s}]+)/);
		      this.tag_check = tag_check_match ? tag_check_match[1] : '';

		      // handle "{{#> myPartial}}" or "{{~#> myPartial}}"
		      if ((raw_token.text.startsWith('{{#>') || raw_token.text.startsWith('{{~#>')) && this.tag_check[0] === '>') {
		        if (this.tag_check === '>' && raw_token.next !== null) {
		          this.tag_check = raw_token.next.text.split(' ')[0];
		        } else {
		          this.tag_check = raw_token.text.split('>')[1];
		        }
		      }
		    }

		    this.tag_check = this.tag_check.toLowerCase();

		    if (raw_token.type === TOKEN.COMMENT) {
		      this.tag_complete = true;
		    }

		    this.is_start_tag = this.tag_check.charAt(0) !== '/';
		    this.tag_name = !this.is_start_tag ? this.tag_check.substr(1) : this.tag_check;
		    this.is_end_tag = !this.is_start_tag ||
		      (raw_token.closed && raw_token.closed.text === '/>');

		    // if whitespace handler ~ included (i.e. {{~#if true}}), handlebars tags start at pos 3 not pos 2
		    var handlebar_starts = 2;
		    if (this.tag_start_char === '{' && this.text.length >= 3) {
		      if (this.text.charAt(2) === '~') {
		        handlebar_starts = 3;
		      }
		    }

		    // handlebars tags that don't start with # or ^ are single_tags, and so also start and end.
		    // if they start with # or ^, they are still considered single tags if indenting of handlebars is set to false
		    this.is_end_tag = this.is_end_tag ||
		      (this.tag_start_char === '{' && (!options.indent_handlebars || this.text.length < 3 || (/[^#\^]/.test(this.text.charAt(handlebar_starts)))));
		  }
		};

		Beautifier.prototype._get_tag_open_token = function(raw_token) { //function to get a full tag and parse its type
		  var parser_token = new TagOpenParserToken(this._options, this._tag_stack.get_parser_token(), raw_token);

		  parser_token.alignment_size = this._options.wrap_attributes_indent_size;

		  parser_token.is_end_tag = parser_token.is_end_tag ||
		    in_array(parser_token.tag_check, this._options.void_elements);

		  parser_token.is_empty_element = parser_token.tag_complete ||
		    (parser_token.is_start_tag && parser_token.is_end_tag);

		  parser_token.is_unformatted = !parser_token.tag_complete && in_array(parser_token.tag_check, this._options.unformatted);
		  parser_token.is_content_unformatted = !parser_token.is_empty_element && in_array(parser_token.tag_check, this._options.content_unformatted);
		  parser_token.is_inline_element = in_array(parser_token.tag_name, this._options.inline) || (this._options.inline_custom_elements && parser_token.tag_name.includes("-")) || parser_token.tag_start_char === '{';

		  return parser_token;
		};

		Beautifier.prototype._set_tag_position = function(printer, raw_token, parser_token, last_tag_token, last_token) {

		  if (!parser_token.is_empty_element) {
		    if (parser_token.is_end_tag) { //this tag is a double tag so check for tag-ending
		      parser_token.start_tag_token = this._tag_stack.try_pop(parser_token.tag_name); //remove it and all ancestors
		    } else { // it's a start-tag
		      // check if this tag is starting an element that has optional end element
		      // and do an ending needed
		      if (this._do_optional_end_element(parser_token)) {
		        if (!parser_token.is_inline_element) {
		          printer.print_newline(false);
		        }
		      }

		      this._tag_stack.record_tag(parser_token); //push it on the tag stack

		      if ((parser_token.tag_name === 'script' || parser_token.tag_name === 'style') &&
		        !(parser_token.is_unformatted || parser_token.is_content_unformatted)) {
		        parser_token.custom_beautifier_name = get_custom_beautifier_name(parser_token.tag_check, raw_token);
		      }
		    }
		  }

		  if (in_array(parser_token.tag_check, this._options.extra_liners)) { //check if this double needs an extra line
		    printer.print_newline(false);
		    if (!printer._output.just_added_blankline()) {
		      printer.print_newline(true);
		    }
		  }

		  if (parser_token.is_empty_element) { //if this tag name is a single tag type (either in the list or has a closing /)

		    // if you hit an else case, reset the indent level if you are inside an:
		    // 'if', 'unless', or 'each' block.
		    if (parser_token.tag_start_char === '{' && parser_token.tag_check === 'else') {
		      this._tag_stack.indent_to_tag(['if', 'unless', 'each']);
		      parser_token.indent_content = true;
		      // Don't add a newline if opening {{#if}} tag is on the current line
		      var foundIfOnCurrentLine = printer.current_line_has_match(/{{#if/);
		      if (!foundIfOnCurrentLine) {
		        printer.print_newline(false);
		      }
		    }

		    // Don't add a newline before elements that should remain where they are.
		    if (parser_token.tag_name === '!--' && last_token.type === TOKEN.TAG_CLOSE &&
		      last_tag_token.is_end_tag && parser_token.text.indexOf('\n') === -1) ; else {
		      if (!(parser_token.is_inline_element || parser_token.is_unformatted)) {
		        printer.print_newline(false);
		      }
		      this._calcluate_parent_multiline(printer, parser_token);
		    }
		  } else if (parser_token.is_end_tag) { //this tag is a double tag so check for tag-ending
		    var do_end_expand = false;

		    // deciding whether a block is multiline should not be this hard
		    do_end_expand = parser_token.start_tag_token && parser_token.start_tag_token.multiline_content;
		    do_end_expand = do_end_expand || (!parser_token.is_inline_element &&
		      !(last_tag_token.is_inline_element || last_tag_token.is_unformatted) &&
		      !(last_token.type === TOKEN.TAG_CLOSE && parser_token.start_tag_token === last_tag_token) &&
		      last_token.type !== 'TK_CONTENT'
		    );

		    if (parser_token.is_content_unformatted || parser_token.is_unformatted) {
		      do_end_expand = false;
		    }

		    if (do_end_expand) {
		      printer.print_newline(false);
		    }
		  } else { // it's a start-tag
		    parser_token.indent_content = !parser_token.custom_beautifier_name;

		    if (parser_token.tag_start_char === '<') {
		      if (parser_token.tag_name === 'html') {
		        parser_token.indent_content = this._options.indent_inner_html;
		      } else if (parser_token.tag_name === 'head') {
		        parser_token.indent_content = this._options.indent_head_inner_html;
		      } else if (parser_token.tag_name === 'body') {
		        parser_token.indent_content = this._options.indent_body_inner_html;
		      }
		    }

		    if (!(parser_token.is_inline_element || parser_token.is_unformatted) &&
		      (last_token.type !== 'TK_CONTENT' || parser_token.is_content_unformatted)) {
		      printer.print_newline(false);
		    }

		    this._calcluate_parent_multiline(printer, parser_token);
		  }
		};

		Beautifier.prototype._calcluate_parent_multiline = function(printer, parser_token) {
		  if (parser_token.parent && printer._output.just_added_newline() &&
		    !((parser_token.is_inline_element || parser_token.is_unformatted) && parser_token.parent.is_inline_element)) {
		    parser_token.parent.multiline_content = true;
		  }
		};

		//To be used for <p> tag special case:
		var p_closers = ['address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'main', 'menu', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul'];
		var p_parent_excludes = ['a', 'audio', 'del', 'ins', 'map', 'noscript', 'video'];

		Beautifier.prototype._do_optional_end_element = function(parser_token) {
		  var result = null;
		  // NOTE: cases of "if there is no more content in the parent element"
		  // are handled automatically by the beautifier.
		  // It assumes parent or ancestor close tag closes all children.
		  // https://www.w3.org/TR/html5/syntax.html#optional-tags
		  if (parser_token.is_empty_element || !parser_token.is_start_tag || !parser_token.parent) {
		    return;

		  }

		  if (parser_token.tag_name === 'body') {
		    // A head element’s end tag may be omitted if the head element is not immediately followed by a space character or a comment.
		    result = result || this._tag_stack.try_pop('head');

		    //} else if (parser_token.tag_name === 'body') {
		    // DONE: A body element’s end tag may be omitted if the body element is not immediately followed by a comment.

		  } else if (parser_token.tag_name === 'li') {
		    // An li element’s end tag may be omitted if the li element is immediately followed by another li element or if there is no more content in the parent element.
		    result = result || this._tag_stack.try_pop('li', ['ol', 'ul', 'menu']);

		  } else if (parser_token.tag_name === 'dd' || parser_token.tag_name === 'dt') {
		    // A dd element’s end tag may be omitted if the dd element is immediately followed by another dd element or a dt element, or if there is no more content in the parent element.
		    // A dt element’s end tag may be omitted if the dt element is immediately followed by another dt element or a dd element.
		    result = result || this._tag_stack.try_pop('dt', ['dl']);
		    result = result || this._tag_stack.try_pop('dd', ['dl']);


		  } else if (parser_token.parent.tag_name === 'p' && p_closers.indexOf(parser_token.tag_name) !== -1) {
		    // IMPORTANT: this else-if works because p_closers has no overlap with any other element we look for in this method
		    // check for the parent element is an HTML element that is not an <a>, <audio>, <del>, <ins>, <map>, <noscript>, or <video> element,  or an autonomous custom element.
		    // To do this right, this needs to be coded as an inclusion of the inverse of the exclusion above.
		    // But to start with (if we ignore "autonomous custom elements") the exclusion would be fine.
		    var p_parent = parser_token.parent.parent;
		    if (!p_parent || p_parent_excludes.indexOf(p_parent.tag_name) === -1) {
		      result = result || this._tag_stack.try_pop('p');
		    }
		  } else if (parser_token.tag_name === 'rp' || parser_token.tag_name === 'rt') {
		    // An rt element’s end tag may be omitted if the rt element is immediately followed by an rt or rp element, or if there is no more content in the parent element.
		    // An rp element’s end tag may be omitted if the rp element is immediately followed by an rt or rp element, or if there is no more content in the parent element.
		    result = result || this._tag_stack.try_pop('rt', ['ruby', 'rtc']);
		    result = result || this._tag_stack.try_pop('rp', ['ruby', 'rtc']);

		  } else if (parser_token.tag_name === 'optgroup') {
		    // An optgroup element’s end tag may be omitted if the optgroup element is immediately followed by another optgroup element, or if there is no more content in the parent element.
		    // An option element’s end tag may be omitted if the option element is immediately followed by another option element, or if it is immediately followed by an optgroup element, or if there is no more content in the parent element.
		    result = result || this._tag_stack.try_pop('optgroup', ['select']);
		    //result = result || this._tag_stack.try_pop('option', ['select']);

		  } else if (parser_token.tag_name === 'option') {
		    // An option element’s end tag may be omitted if the option element is immediately followed by another option element, or if it is immediately followed by an optgroup element, or if there is no more content in the parent element.
		    result = result || this._tag_stack.try_pop('option', ['select', 'datalist', 'optgroup']);

		  } else if (parser_token.tag_name === 'colgroup') {
		    // DONE: A colgroup element’s end tag may be omitted if the colgroup element is not immediately followed by a space character or a comment.
		    // A caption element's end tag may be ommitted if a colgroup, thead, tfoot, tbody, or tr element is started.
		    result = result || this._tag_stack.try_pop('caption', ['table']);

		  } else if (parser_token.tag_name === 'thead') {
		    // A colgroup element's end tag may be ommitted if a thead, tfoot, tbody, or tr element is started.
		    // A caption element's end tag may be ommitted if a colgroup, thead, tfoot, tbody, or tr element is started.
		    result = result || this._tag_stack.try_pop('caption', ['table']);
		    result = result || this._tag_stack.try_pop('colgroup', ['table']);

		    //} else if (parser_token.tag_name === 'caption') {
		    // DONE: A caption element’s end tag may be omitted if the caption element is not immediately followed by a space character or a comment.

		  } else if (parser_token.tag_name === 'tbody' || parser_token.tag_name === 'tfoot') {
		    // A thead element’s end tag may be omitted if the thead element is immediately followed by a tbody or tfoot element.
		    // A tbody element’s end tag may be omitted if the tbody element is immediately followed by a tbody or tfoot element, or if there is no more content in the parent element.
		    // A colgroup element's end tag may be ommitted if a thead, tfoot, tbody, or tr element is started.
		    // A caption element's end tag may be ommitted if a colgroup, thead, tfoot, tbody, or tr element is started.
		    result = result || this._tag_stack.try_pop('caption', ['table']);
		    result = result || this._tag_stack.try_pop('colgroup', ['table']);
		    result = result || this._tag_stack.try_pop('thead', ['table']);
		    result = result || this._tag_stack.try_pop('tbody', ['table']);

		    //} else if (parser_token.tag_name === 'tfoot') {
		    // DONE: A tfoot element’s end tag may be omitted if there is no more content in the parent element.

		  } else if (parser_token.tag_name === 'tr') {
		    // A tr element’s end tag may be omitted if the tr element is immediately followed by another tr element, or if there is no more content in the parent element.
		    // A colgroup element's end tag may be ommitted if a thead, tfoot, tbody, or tr element is started.
		    // A caption element's end tag may be ommitted if a colgroup, thead, tfoot, tbody, or tr element is started.
		    result = result || this._tag_stack.try_pop('caption', ['table']);
		    result = result || this._tag_stack.try_pop('colgroup', ['table']);
		    result = result || this._tag_stack.try_pop('tr', ['table', 'thead', 'tbody', 'tfoot']);

		  } else if (parser_token.tag_name === 'th' || parser_token.tag_name === 'td') {
		    // A td element’s end tag may be omitted if the td element is immediately followed by a td or th element, or if there is no more content in the parent element.
		    // A th element’s end tag may be omitted if the th element is immediately followed by a td or th element, or if there is no more content in the parent element.
		    result = result || this._tag_stack.try_pop('td', ['table', 'thead', 'tbody', 'tfoot', 'tr']);
		    result = result || this._tag_stack.try_pop('th', ['table', 'thead', 'tbody', 'tfoot', 'tr']);
		  }

		  // Start element omission not handled currently
		  // A head element’s start tag may be omitted if the element is empty, or if the first thing inside the head element is an element.
		  // A tbody element’s start tag may be omitted if the first thing inside the tbody element is a tr element, and if the element is not immediately preceded by a tbody, thead, or tfoot element whose end tag has been omitted. (It can’t be omitted if the element is empty.)
		  // A colgroup element’s start tag may be omitted if the first thing inside the colgroup element is a col element, and if the element is not immediately preceded by another colgroup element whose end tag has been omitted. (It can’t be omitted if the element is empty.)

		  // Fix up the parent of the parser token
		  parser_token.parent = this._tag_stack.get_parser_token();

		  return result;
		};

		beautifier.Beautifier = Beautifier;
		return beautifier;
	}

	/*jshint node:true */

	var hasRequiredHtml;

	function requireHtml () {
		if (hasRequiredHtml) return html.exports;
		hasRequiredHtml = 1;

		var Beautifier = requireBeautifier().Beautifier,
		  Options = requireOptions().Options;

		function style_html(html_source, options, js_beautify, css_beautify) {
		  var beautifier = new Beautifier(html_source, options, js_beautify, css_beautify);
		  return beautifier.beautify();
		}

		html.exports = style_html;
		html.exports.defaultOptions = function() {
		  return new Options();
		};
		return html.exports;
	}

	/*jshint node:true */

	var hasRequiredSrc;

	function requireSrc () {
		if (hasRequiredSrc) return src;
		hasRequiredSrc = 1;

		var js_beautify = requireJavascript();
		var css_beautify = requireCss();
		var html_beautify = requireHtml();

		function style_html(html_source, options, js, css) {
		  js = js || js_beautify;
		  css = css || css_beautify;
		  return html_beautify(html_source, options, js, css);
		}
		style_html.defaultOptions = html_beautify.defaultOptions;

		src.js = js_beautify;
		src.css = css_beautify;
		src.html = style_html;
		return src;
	}

	/*jshint node:true */

	var hasRequiredJs;

	function requireJs () {
		if (hasRequiredJs) return js.exports;
		hasRequiredJs = 1;
		(function (module) {

			/**
			The following batches are equivalent:

			var beautify_js = require('js-beautify');
			var beautify_js = require('js-beautify').js;
			var beautify_js = require('js-beautify').js_beautify;

			var beautify_css = require('js-beautify').css;
			var beautify_css = require('js-beautify').css_beautify;

			var beautify_html = require('js-beautify').html;
			var beautify_html = require('js-beautify').html_beautify;

			All methods returned accept two arguments, the source string and an options object.
			**/

			function get_beautify(js_beautify, css_beautify, html_beautify) {
			  // the default is js
			  var beautify = function(src, config) {
			    return js_beautify.js_beautify(src, config);
			  };

			  // short aliases
			  beautify.js = js_beautify.js_beautify;
			  beautify.css = css_beautify.css_beautify;
			  beautify.html = html_beautify.html_beautify;

			  // legacy aliases
			  beautify.js_beautify = js_beautify.js_beautify;
			  beautify.css_beautify = css_beautify.css_beautify;
			  beautify.html_beautify = html_beautify.html_beautify;

			  return beautify;
			}

			{
			  (function(mod) {
			    var beautifier = requireSrc();
			    beautifier.js_beautify = beautifier.js;
			    beautifier.css_beautify = beautifier.css;
			    beautifier.html_beautify = beautifier.html;

			    mod.exports = get_beautify(beautifier, beautifier, beautifier);

			  })(module);
			} 
		} (js));
		return js.exports;
	}

	var jsExports = requireJs();
	var jsBeautify = /*@__PURE__*/getDefaultExportFromCjs(jsExports);

	/**
	 * Automutate & Mutator Plugin for Hydralisk
	 * Encapsulates the AST-based code mutator ("poop mode"), AST parser/generator,
	 * GLSL transform swap definitions, autosaves stack, jump-back, and quick save/load.
	 */

	jsBeautify.js_beautify || jsBeautify;
	const GLSL_TRANSFORMS = {
	  src: ["noise", "voronoi", "osc", "shape", "gradient", "src", "solid"],
	  coord: ["rotate", "scale", "pixelate", "repeat", "repeatX", "repeatY", "modulateRepeat", "modulateRepeatX", "modulateRepeatY", "modulateRotate", "modulateScale", "modulatePixelate", "kaleid", "scroll", "scrollX", "scrollY", "modulateScrollX", "modulateScrollY", "modulate"],
	  color: ["posterize", "shift", "invert", "contrast", "brightness", "color", "luma", "thresh", "colorama", "saturate", "hue"],
	  combine: ["add", "sub", "layer", "blend", "mult", "diff", "modulateHue"],
	  combineCoord: ["modulate", "modulateRepeat", "modulateRepeatX", "modulateRepeatY", "modulateRotate", "modulateScale", "modulatePixelate", "modulateScrollX", "modulateScrollY"]
	};
	const BLACKLIST_COMBOS = [{
	  orig: "modulate",
	  new: "modulateScrollX"
	}];
	function getRandomInt(min, max) {
	  return Math.floor(Math.random() * (max - min)) + min;
	}
	function getRandomElement(arr) {
	  return arr[Math.floor(Math.random() * arr.length)];
	}
	class UndoStack {
	  constructor() {
	    this.stack = [];
	  }
	  push(item) {
	    this.stack.push(item);
	  }
	  pop() {
	    return this.stack.pop();
	  }
	  get length() {
	    return this.stack.length;
	  }
	}
	class Mutator {
	  constructor(editor) {
	    this.editor = editor;
	    this.undoStack = new UndoStack();
	    this.initialVector = null;
	    this.traveler = makeTraveler({
	      CallExpression(node, state) {
	        if (node.callee.type === "MemberExpression") {
	          const name = node.callee.property.name;
	          if (name !== "out") {
	            state.calls.push(node);
	          }
	        }
	        this.super.CallExpression.call(this, node, state);
	      },
	      Literal(node, state) {
	        if (typeof node.value === "number") {
	          state.literals.push(node);
	        }
	      }
	    });
	  }
	  doUndo() {
	    if (this.undoStack.length > 0) {
	      const prev = this.undoStack.pop();
	      if (prev && this.editor) {
	        this.editor.setValue(prev);
	        if (typeof this.editor.eval === "function") {
	          this.editor.eval(prev);
	        } else if (window.evalCode) {
	          window.evalCode(prev);
	        }
	      }
	    }
	  }
	  glitchNumber(origVal, initVal) {
	    const base = typeof initVal === "number" ? initVal : origVal;
	    if (base === 0) {
	      return Math.random() < 0.5 ? 0.5 : 0.01;
	    }
	    return Math.random() * base * 2;
	  }
	  mutate({
	    reroll = false,
	    changeTransform = false
	  } = {}) {
	    if (!this.editor) return;
	    const code = typeof this.editor.getValue === "function" ? this.editor.getValue() : "";
	    if (!code) return;
	    let ast;
	    const comments = [];
	    try {
	      ast = Parser.parse(code, {
	        ecmaVersion: "latest",
	        sourceType: "module",
	        onComment: comments
	      });
	    } catch (e) {
	      console.warn("[Mutator] AST parse error:", e);
	      return;
	    }
	    const state = {
	      literals: [],
	      calls: []
	    };
	    this.traveler.go(ast, state);
	    if (state.literals.length === 0 && state.calls.length === 0) {
	      return;
	    }
	    if (!this.initialVector || this.initialVector.length !== state.literals.length) {
	      this.initialVector = state.literals.map(l => l.value);
	    }
	    this.undoStack.push(code);
	    if (changeTransform && state.calls.length > 0) {
	      let callNode = getRandomElement(state.calls);
	      let currentFunc = callNode.callee.property.name;
	      let category = Object.keys(GLSL_TRANSFORMS).find(cat => GLSL_TRANSFORMS[cat].includes(currentFunc));
	      if (category && GLSL_TRANSFORMS[category]) {
	        let candidates = GLSL_TRANSFORMS[category].filter(f => f !== currentFunc);
	        if (candidates.length > 0) {
	          let newFunc = getRandomElement(candidates);
	          let isBlacklisted = BLACKLIST_COMBOS.some(b => b.orig === currentFunc && b.new === newFunc);
	          if (!isBlacklisted) {
	            callNode.callee.property.name = newFunc;
	          }
	        }
	      }
	    } else if (state.literals.length > 0) {
	      let idx = getRandomInt(0, state.literals.length);
	      let targetNode = state.literals[idx];
	      let initVal = this.initialVector[idx];
	      targetNode.value = this.glitchNumber(targetNode.value, initVal);
	      targetNode.raw = String(targetNode.value);
	    }
	    const newCode = generate(ast, {
	      comments: true
	    });
	    this.editor.setValue(newCode);
	    if (typeof this.editor.formatCode === "function") {
	      this.editor.formatCode();
	    } else if (window.xemitter) {
	      window.xemitter.emit("editor:formatCode");
	    }
	  }
	}
	class MemoryStore {
	  constructor() {
	    this.saveSlot = null;
	    this.autoSaves = [];
	    this._autosaveCulling = 8;
	    this._autosaveIndex = 0;
	  }
	  quickSave(code) {
	    this.saveSlot = code;
	  }
	  quickLoad() {
	    return this.saveSlot;
	  }
	  autoSave(code, force = false) {
	    this._autosaveIndex += 1;
	    if (this._autosaveIndex >= this._autosaveCulling || force) {
	      this._autosaveIndex = 0;
	      this.autoSaves.push(code);
	    }
	  }
	  jumpBack(idx = 1) {
	    let code;
	    while (idx-- > 0 && this.autoSaves.length > 0) {
	      code = this.autoSaves.pop();
	    }
	    if (this.autoSaves.length === 0 && code) {
	      this.autoSaves = [code];
	    }
	    return code;
	  }
	  resetAutosaves() {
	    this.autoSaves = [];
	    this._autosaveIndex = 0;
	  }
	}
	const memory = new MemoryStore();
	if (typeof window !== "undefined" && window.HydraliskPlugins) {
	  window.HydraliskPlugins.register({
	    id: "automutate",
	    name: "Automutate & Mutator Engine",
	    init(app) {
	      app.automutateInterval = null;
	      app.memory = memory;
	      app.expose("memory", memory);
	      const setAutomutateState = (interval, multiplier = null, changeTransformChance = 1) => {
	        app.automutateInterval = interval;
	        app.automutateBeatMultiplier = multiplier;
	        app.automutateChangeTransformChance = changeTransformChance;
	        if (app.state) app.state.automutateInterval = interval;
	        if (window.state) window.state.automutateInterval = interval;
	        app.emit("render");
	      };
	      const getEditor = () => {
	        return app.state && app.state.editor && app.state.editor.editor || window.cm || null;
	      };
	      const evalAndSave = (code, cb) => {
	        const editor = getEditor();
	        if (editor && typeof editor.setValue === "function") {
	          editor.setValue(code);
	        }
	        if (window.evalCode) {
	          window.evalCode(code, cb);
	        } else if (editor && typeof editor.eval === "function") {
	          editor.eval(code, cb);
	        }
	        if (app.emitter) app.emitter.emit("render");
	      };
	      const retimeAutomutate = newBpm => {
	        if (!app.automutateInterval || !app.automutateBeatMultiplier) return;
	        const currentBpm = Number(newBpm) || app.bpm || window.bpm || 120;
	        const mutateTimeout = 60000 / currentBpm * app.automutateBeatMultiplier;
	        clearInterval(app.automutateInterval);
	        const newInterval = setInterval(() => {
	          const ed = getEditor();
	          if (!ed) return;
	          if (!ed.mutator) ed.mutator = new Mutator(ed);
	          const changeTransform = Math.random() > (app.automutateChangeTransformChance ?? 1);
	          ed.mutator.mutate({
	            reroll: false,
	            changeTransform
	          });
	          if (app.emitter) {
	            app.emitter.emit("editor:formatCode");
	            app.emitter.emit("oblivion:scheduleCheck", {
	              delay: 250
	            });
	          }
	          memory.autoSave(ed.getValue());
	        }, mutateTimeout);
	        setAutomutateState(newInterval, app.automutateBeatMultiplier, app.automutateChangeTransformChance);
	      };
	      app.on("bpm:change", newBpm => retimeAutomutate(newBpm));
	      app.on("taptempo", (evt = {}) => {
	        const bpm = evt && typeof evt.bpm === "number" ? evt.bpm : app.bpm || window.bpm;
	        if (bpm) retimeAutomutate(bpm);
	      });
	      app.on("editor:randomize", (evt = {}) => {
	        const editor = getEditor();
	        if (!editor) return;
	        if (!editor.mutator) {
	          editor.mutator = new Mutator(editor);
	        }
	        if (evt.shiftKey) {
	          editor.mutator.doUndo();
	        } else {
	          editor.mutator.mutate({
	            reroll: false,
	            changeTransform: Boolean(evt.metaKey)
	          });
	          if (app.emitter) {
	            app.emitter.emit("editor:formatCode");
	            app.emitter.emit("gallery:saveLocally", editor.getValue());
	          }
	        }
	      });
	      app.on("editor:midify", (evt = {}) => {
	        app.emit("editor:randomize", evt);
	      });
	      app.on("editor:toggleAutomutate", async (evt = {}) => {
	        const bpm = app.bpm || window.bpm || 120;
	        const guessedMsPerBeat = 60000 / bpm;
	        const lastCombo = evt.lastCombo || "";
	        const automutateMode = lastCombo.match(/-(.)$/)?.[1];
	        let mutateTimeout = guessedMsPerBeat;
	        let beatMultiplier = null;
	        if (automutateMode === "X" || !automutateMode) {
	          if (app.automutateInterval) {
	            clearInterval(app.automutateInterval);
	            setAutomutateState(null);
	            return;
	          } else {
	            let promptVal = guessedMsPerBeat;
	            if (window.hydraDialog && window.hydraDialog.prompt) {
	              promptVal = await window.hydraDialog.prompt("How fast would you like to go? (in ms)", guessedMsPerBeat);
	            } else if (typeof window.prompt === "function") {
	              promptVal = window.prompt("How fast would you like to go? (in ms)", guessedMsPerBeat);
	            }
	            mutateTimeout = Number(promptVal) || guessedMsPerBeat;
	          }
	        } else if (automutateMode === "0") {
	          if (app.automutateInterval) {
	            clearInterval(app.automutateInterval);
	          }
	          setAutomutateState(null);
	          return;
	        } else if (automutateMode === "1") {
	          beatMultiplier = 1;
	          mutateTimeout = guessedMsPerBeat;
	        } else if (automutateMode === "2") {
	          beatMultiplier = 2;
	          mutateTimeout = guessedMsPerBeat * 2;
	        } else if (automutateMode === "3") {
	          beatMultiplier = 4;
	          mutateTimeout = guessedMsPerBeat * 4;
	        } else if (automutateMode === "4") {
	          beatMultiplier = 8;
	          mutateTimeout = guessedMsPerBeat * 8;
	        } else if (automutateMode === "5") {
	          beatMultiplier = 16;
	          mutateTimeout = guessedMsPerBeat * 16;
	        }
	        const editor = getEditor();
	        if (editor && !editor.mutator) {
	          editor.mutator = new Mutator(editor);
	        }
	        const changeTransformChance = 1 - (evt.metaKey ? 0.25 : 0);
	        if (app.automutateInterval) {
	          clearInterval(app.automutateInterval);
	        }
	        const newInterval = setInterval(() => {
	          const ed = getEditor();
	          if (!ed) return;
	          if (!ed.mutator) ed.mutator = new Mutator(ed);
	          const changeTransform = Math.random() > changeTransformChance;
	          ed.mutator.mutate({
	            reroll: false,
	            changeTransform
	          });
	          if (app.emitter) {
	            app.emitter.emit("editor:formatCode");
	            app.emitter.emit("oblivion:scheduleCheck", {
	              delay: 250
	            });
	          }
	          memory.autoSave(ed.getValue());
	        }, mutateTimeout);
	        setAutomutateState(newInterval, beatMultiplier, changeTransformChance);
	        if (editor) {
	          memory.autoSave(editor.getValue(), true);
	        }
	      });
	      app.on("editor:quickSave", () => {
	        const editor = getEditor();
	        if (editor) {
	          const code = editor.getValue();
	          evalAndSave(code);
	          memory.quickSave(code);
	        }
	      });
	      app.on("editor:quickLoad", () => {
	        const code = memory.quickLoad();
	        if (code) {
	          evalAndSave(code);
	        }
	      });
	      app.on("editor:jumpBack1", () => {
	        const code = memory.jumpBack(1);
	        if (code) evalAndSave(code);
	      });
	      app.on("editor:jumpBack5", () => {
	        const code = memory.jumpBack(5);
	        if (code) evalAndSave(code);
	      });
	    }
	  });
	}

	/**
	 * Sketch Library & Storage Plugin for Hydralisk
	 * Manages local/remote sketches, playlist navigation, loading, saving,
	 * import/export, deduplication, and sketch autocompleter.
	 */

	const sGet = key => {
	  try {
	    const variablesStr = localStorage.getItem("variables");
	    const variablesObj = JSON.parse(variablesStr || "{}");
	    return variablesObj[key];
	  } catch (e) {
	    return undefined;
	  }
	};
	const sPut = (key, value) => {
	  try {
	    const variablesStr = localStorage.getItem("variables") || "{}";
	    const o = JSON.parse(variablesStr);
	    o[key] = value;
	    localStorage.setItem("variables", JSON.stringify(o));
	  } catch (e) {
	    console.error("[sketchLibrary] Error saving variable:", e);
	  }
	};
	function deduplicateBy(array, field) {
	  if (!Array.isArray(array)) return [];
	  return Object.values(array.reduce((acc, s) => {
	    if (s && s[field]) acc[s[field]] = s;
	    return acc;
	  }, {}));
	}
	const parseCode = url => {
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
	        return app.state && app.state.editor && app.state.editor.editor || window.cm || null;
	      };
	      const evalCode = (code, cb) => {
	        const editor = getEditor();
	        if (window.evalCode) {
	          window.evalCode(code, cb);
	        } else if (editor && typeof editor.eval === "function") {
	          editor.eval(code, cb);
	        }
	      };
	      const setEditorText = code => {
	        const editor = getEditor();
	        if (editor && typeof editor.setValue === "function") {
	          editor.setValue(code);
	        }
	      };

	      // Load initial local sketches
	      try {
	        localSketches = JSON.parse(localStorage.getItem("mySketches") || "[]").map(e => ({
	          ...e,
	          local: true
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

	      // Cross-navigation helper to launch player with active sketch
	      const openPlayerWithCurrentSketch = e => {
	        if (e && e.preventDefault) e.preventDefault();
	        let sketchName = "";
	        if (Array.isArray(mySketches) && typeof sketchIdx === "number" && mySketches[sketchIdx]) {
	          sketchName = mySketches[sketchIdx].name;
	        }
	        if (!sketchName) {
	          try {
	            sketchName = localStorage.getItem("lastSelectedSketchName") || "";
	          } catch (err) {}
	        }
	        const targetUrl = sketchName ? `player.html?sketch=${encodeURIComponent(sketchName)}` : "player.html";
	        window.location.href = targetUrl;
	      };
	      window.openPlayerWithCurrentSketch = openPlayerWithCurrentSketch;
	      app.expose("openPlayerWithCurrentSketch", openPlayerWithCurrentSketch);

	      // Inject white toolbar icon "Visual Player" in editor DOM (suppressed on player page)
	      if (typeof document !== "undefined") {
	        const isPlayerPage = Boolean(window.location.pathname.endsWith("player.html") || window.location.pathname.endsWith("/player") || document.getElementById("hydra-player-dashboard"));
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
	              navIcon.onclick = evt => openPlayerWithCurrentSketch(evt);

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
	      app.on("gallery:loadSketch", sketchInfo => {
	        if (!sketchInfo) return;
	        const targetIdx = Array.isArray(mySketches) ? mySketches.findIndex(s => s.name === sketchInfo.name || s.id && s.id === sketchInfo.id) : -1;
	        const sketch = targetIdx >= 0 ? mySketches[targetIdx] : sketchInfo;
	        if (!sketch) return;

	        // Save sketch name protocol in localStorage and URL querystring
	        if (sketch && sketch.name) {
	          try {
	            localStorage.setItem("lastSelectedSketchName", sketch.name);
	            if (window.history && window.history.replaceState) {
	              const url = new URL(window.location);
	              url.searchParams.set("sketch", sketch.name);
	              window.history.replaceState({}, "", url.toString());
	            }
	          } catch (e) {}
	        }
	        let formattedCode = "";
	        if (sketch.metadata) {
	          const metaCopy = {
	            ...sketch.metadata
	          };
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
	        sketchIdx = targetIdx >= 0 ? targetIdx : typeof sketch.index === "number" ? sketch.index : 0;
	        if (isNaN(sketchIdx)) sketchIdx = 0;
	        sPut("sketchIdx", sketchIdx);
	        app.expose("sketchIdx", sketchIdx);
	        if (app.memory) {
	          app.memory.resetAutosaves();
	          app.memory.autoSave(formattedCode, true);
	        }
	      });

	      // Query parameter & localStorage sketch loading protocol on initialization
	      const loadSketchFromProtocol = () => {
	        try {
	          const urlParams = new URLSearchParams(window.location.search);
	          const targetName = urlParams.get("sketch") || localStorage.getItem("lastSelectedSketchName");
	          if (targetName && Array.isArray(mySketches) && mySketches.length > 0) {
	            const foundIdx = mySketches.findIndex(s => s.name && s.name.toLowerCase() === targetName.toLowerCase());
	            if (foundIdx >= 0) {
	              sketchIdx = foundIdx;
	              sPut("sketchIdx", sketchIdx);
	              app.expose("sketchIdx", sketchIdx);
	              app.emit("gallery:loadSketch", mySketches[foundIdx]);
	            }
	          }
	        } catch (e) {}
	      };
	      app.on("gallery:updateLocalSketches", sketchList => {
	        mySketches = Array.isArray(sketchList) ? sketchList : [];
	        app.expose("mySketches", mySketches);
	        if (isNaN(sketchIdx) || sketchIdx < 0 || sketchIdx >= mySketches.length) {
	          sketchIdx = 0;
	          sPut("sketchIdx", sketchIdx);
	          app.expose("sketchIdx", sketchIdx);
	        }
	        loadSketchFromProtocol();
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
	        const name = prompt("What's a fantasy name for this creation?", nameInCode || "My sketch");
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
	            ...metadata
	          },
	          code: lines.join("\n"),
	          fullDraft: btoa(code)
	        };
	        const existingIdx = localSketches.findIndex(e => e.name === name);
	        if (existingIdx >= 0) {
	          localSketches[existingIdx] = sketch;
	        } else {
	          localSketches.push(sketch);
	        }
	        localStorage.setItem("mySketches", JSON.stringify(localSketches));
	        const sketchesMap = {};
	        downloadedSketches.concat(localSketches).forEach(s => {
	          sketchesMap[s.name] = s;
	        });
	        mySketches = Object.values(sketchesMap);
	        app.expose("mySketches", mySketches);
	      });
	      app.on("gallery:export", (e = {}) => {
	        const fixCode = code => code.replace(/([^\s])\*([^\s])/g, "$1 * $2");
	        const sketchesToExport = e.altKey ? deduplicateBy(mySketches, "name") : deduplicateBy(localSketches, "name");
	        const sketchList = sketchesToExport.map(sketch => {
	          const {
	            name,
	            code,
	            type,
	            midi
	          } = sketch;
	          return {
	            name,
	            type,
	            code: code ? fixCode(code) : "",
	            bpm: code?.match(/bpm\s+=\s+(\d+)/)?.[1],
	            midi: !!(midi || code?.match(/cc\[/) || code?.match(/midi\(/)),
	            author: window.author ?? "Anony Mouse"
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
	          window.amakit.draftCache.forEach(sketch => {
	            if (!localSketches.some(e => e.name === sketch.name)) {
	              localSketches.push(sketch);
	            }
	          });
	          localStorage.setItem("mySketches", JSON.stringify(localSketches));
	          mySketches = localSketches.slice();
	          app.expose("mySketches", mySketches);
	        } else {
	          fetch("sketches.json").then(r => r.json()).then(data => {
	            downloadedSketches = data.map(d => ({
	              ...d,
	              code: d.type === "url" ? parseCode(d.url) : d.code,
	              local: false
	            }));
	            const sketchesMap = {};
	            downloadedSketches.concat(localSketches).forEach(s => {
	              sketchesMap[s.name] = s;
	            });
	            mySketches = Object.values(sketchesMap);
	            localStorage.setItem("mySketches", JSON.stringify(mySketches));
	            app.expose("mySketches", mySketches);
	            app.emit("gallery:updateLocalSketches", mySketches);
	          }).catch(err => {
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
	            localSketches = localSketches.concat(Array.isArray(importedSketches) ? importedSketches : [importedSketches]);
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
	        mySketches.forEach(sketch => {
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
	          const found = mySketches.find(s => s.name === val);
	          if (found) {
	            app.emit("gallery:loadSketch", found);
	          }
	          app.emit("gallery:search");
	        };
	        input.onkeydown = e => {
	          if (e.key === "Escape") app.emit("gallery:search");
	        };
	      });
	    }
	  });
	}

	/**
	 * Editor Actions & Shortcuts Plugin for Hydralisk
	 * Formatter, line comment/duplicate, clearAll, canvas screencap, fullscreen, UI hide,
	 * global speed controls, and global keyboard shortcut binding & prevention.
	 */

	const js_beautify = jsBeautify.js_beautify || jsBeautify;
	const SPEED_SETTINGS = [0.01, 0.05, 0.1, 0.125, 0.25, 0.3333333333333333, 0.5, 1, 2, 3, 4, 8, 10, 20, 100];
	function getCurrentSpeedIdx(currentSpeed) {
	  const n = Math.abs(currentSpeed);
	  if (n === 0) return -1;
	  let spdIndex = SPEED_SETTINGS.findIndex((_v, i, a) => n === a[i] || a[i] < n && (a[i + 1] === undefined || a[i + 1] > n));
	  return spdIndex;
	}
	if (typeof window !== "undefined" && window.HydraliskPlugins) {
	  window.HydraliskPlugins.register({
	    id: "editor-actions",
	    name: "Editor Actions & Shortcuts",
	    init(app) {
	      const getEditor = () => {
	        return app.state && app.state.editor && app.state.editor.editor || window.cm || null;
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
	            space_in_empty_paren: true
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
	        cm.setCursor({
	          line: cursor.line + 1,
	          ch: cursor.ch
	        });
	      });

	      // Clear All
	      app.on("editor:clearAll", (ev = {}) => {
	        const editor = getEditor();
	        if (ev.altKey || ev.shiftKey || ev.ctrlKey) {
	          const shouldDelete = confirm("Do you really want to delete this sketch locally?");
	          if (!shouldDelete) return;
	          if (editor) {
	            const sketchName = editor.getValue().split("\n")[0].replace("/*", "").replace("*/", "").trim();
	            const mySketches = app.context?.mySketches || window.mySketches || [];
	            const idx = mySketches.findIndex(e => e.name === sketchName);
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
	            if (typeof editor.clear === "function") editor.clear();else if (typeof editor.setValue === "function") editor.setValue("");
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
	        const blob = new Blob([text], {
	          type: "text/plain"
	        });
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
	        const absCur = Math.abs(cur);
	        const sign = cur === 0 ? window._speedSign || 1 : Math.sign(cur);
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
	        const sign = cur === 0 ? window._speedSign || 1 : Math.sign(cur);
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

	      // Global Keydown Listener & Prevention List
	      const PREVENT_LIST = ["Cmd-H", "Shift-Ctrl-H", "Ctrl-Shift-H", "Cmd-Q", "Cmd-[", "Cmd-O", "Cmd-P", "Cmd-S", "Shift-Ctrl-S", "Ctrl-Shift-S", "Cmd-W", "Cmd-T", "Cmd-N", "Cmd-M", "Cmd-A", "Shift-Ctrl-F", "Ctrl-Shift-F", "Shift-Ctrl-G", "Ctrl-Shift-G"];
	      document.addEventListener("keydown", evt => {
	        if (!evt.key) return;
	        const isOptionSpace = evt.altKey && (evt.code === "Space" || evt.key === " " || evt.key === "Spacebar");
	        if (isOptionSpace) {
	          evt.preventDefault();
	          evt.stopPropagation();
	          app.emit("taptempo");
	          return;
	        }
	        const prefixes = [evt.shiftKey && "Shift", evt.ctrlKey && "Ctrl", evt.metaKey && "Cmd", evt.altKey && "Alt"].filter(Boolean);
	        const altPrefixes = [evt.ctrlKey && "Ctrl", evt.shiftKey && "Shift", evt.metaKey && "Cmd", evt.altKey && "Alt"].filter(Boolean);
	        const prefix = prefixes.join("-");
	        const altPrefix = altPrefixes.join("-");
	        const key = evt.key.toUpperCase();
	        const combo = prefix ? `${prefix}-${key}` : key;
	        const altCombo = altPrefix ? `${altPrefix}-${key}` : key;
	        const matchCombo = (...targets) => targets.some(t => t === combo || t === altCombo);
	        if (PREVENT_LIST.includes(combo) || PREVENT_LIST.includes(altCombo)) {
	          evt.preventDefault();
	          evt.stopPropagation();
	        }

	        // Custom keyboard shortcuts map
	        if (matchCombo("Cmd-S")) {
	          evt.preventDefault();
	          app.emit("editor:quickSave");
	        } else if (matchCombo("Cmd-L")) {
	          evt.preventDefault();
	          app.emit("editor:quickLoad");
	        } else if (matchCombo("Cmd-]")) {
	          evt.preventDefault();
	          app.emit("gallery:nextSketch", evt);
	        } else if (matchCombo("Cmd-\\")) {
	          evt.preventDefault();
	          app.emit("gallery:prevSketch", evt);
	        } else if (matchCombo("Cmd-[")) {
	          evt.preventDefault();
	          app.emit("editor:jumpBack1", evt);
	        } else if (matchCombo("Cmd-Shift-[", "Shift-Cmd-[")) {
	          evt.preventDefault();
	          app.emit("editor:jumpBack5", evt);
	        } else if (matchCombo("Cmd-O")) {
	          evt.preventDefault();
	          app.emit("gallery:toggleSketchManager");
	        } else if (matchCombo("Shift-Ctrl-F")) {
	          evt.preventDefault();
	          app.emit("editor:formatCode");
	        } else if (matchCombo("Shift-Ctrl-G")) {
	          evt.preventDefault();
	          app.emit("fullscreen");
	        } else if (matchCombo("Shift-Ctrl-H", "Cmd-H")) {
	          evt.preventDefault();
	          app.emit("hideAll");
	        } else if (matchCombo("Shift-Ctrl-X")) {
	          evt.preventDefault();
	          app.emit("editor:toggleAutomutate", {
	            lastCombo: combo
	          });
	        } else if (matchCombo("Shift-Ctrl-0")) {
	          evt.preventDefault();
	          app.emit("editor:toggleAutomutate", {
	            lastCombo: "0"
	          });
	        } else if (matchCombo("Shift-Ctrl-1")) {
	          evt.preventDefault();
	          app.emit("editor:toggleAutomutate", {
	            lastCombo: "1"
	          });
	        } else if (matchCombo("Shift-Ctrl-2")) {
	          evt.preventDefault();
	          app.emit("editor:toggleAutomutate", {
	            lastCombo: "2"
	          });
	        } else if (matchCombo("Shift-Ctrl-3")) {
	          evt.preventDefault();
	          app.emit("editor:toggleAutomutate", {
	            lastCombo: "3"
	          });
	        } else if (matchCombo("Shift-Ctrl-4")) {
	          evt.preventDefault();
	          app.emit("editor:toggleAutomutate", {
	            lastCombo: "4"
	          });
	        } else if (matchCombo("Shift-Ctrl-5")) {
	          evt.preventDefault();
	          app.emit("editor:toggleAutomutate", {
	            lastCombo: "5"
	          });
	        } else if (matchCombo("Shift-Ctrl-7")) {
	          evt.preventDefault();
	          app.emit("gfx:speedSlower");
	        } else if (matchCombo("Shift-Ctrl-8")) {
	          evt.preventDefault();
	          app.emit("gfx:speedDefault");
	        } else if (matchCombo("Shift-Ctrl-9")) {
	          evt.preventDefault();
	          app.emit("gfx:speedFaster");
	        } else if (matchCombo("Shift-Cmd-8", "Cmd-Shift-8")) {
	          evt.preventDefault();
	          app.emit("gfx:speedReverse");
	        } else if (matchCombo("Cmd-D")) {
	          evt.preventDefault();
	          app.emit("editor:duplicateLine");
	        } else if (matchCombo("Shift-Ctrl-K")) {
	          evt.preventDefault();
	          app.emit("editor:commentLine");
	        } else if (matchCombo("Shift-Ctrl-C")) {
	          evt.preventDefault();
	          app.emit("gallery:search");
	        } else if (matchCombo("Shift-Ctrl-S")) {
	          evt.preventDefault();
	          app.emit("screencap");
	        } else if (matchCombo("Shift-Ctrl-L")) {
	          evt.preventDefault();
	          app.emit("gallery:saveToURL");
	        }
	      });
	    }
	  });
	}

	/**
	 * Catch-all Plugin for Hydralisk Extras & Overrides
	 * ModulateHue HSV color combine function registration, custom window helpers,
	 * and fallback overrides.
	 */

	if (typeof window !== "undefined" && window.HydraliskPlugins) {
	  window.HydraliskPlugins.register({
	    id: "hydralisk-extras",
	    name: "Hydralisk Shader & Functional Extras",
	    onHydraReady(hydra, app) {
	      if (!hydra || typeof hydra.setFunction !== "function") return;

	      // Register modulateHue as HSV color combination function
	      try {
	        hydra.setFunction({
	          name: "modulateHue",
	          type: "combine",
	          inputs: [{
	            type: "color",
	            name: "color"
	          }, {
	            type: "float",
	            name: "amount",
	            default: 1
	          }],
	          glsl: `
            vec3 _c0rgb = _c0.rgb;
            vec3 _c1rgb = _c1.rgb;
            vec3 _hsv0 = vec3(0.0);
            vec3 _hsv1 = vec3(0.0);

            // RGB to HSV conversion
            vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            vec4 p0 = mix(vec4(_c0rgb.bg, K.wz), vec4(_c0rgb.gb, K.xy), step(_c0rgb.b, _c0rgb.g));
            vec4 q0 = mix(vec4(p0.xyw, _c0rgb.r), vec4(_c0rgb.r, p0.yzx), step(p0.x, _c0rgb.r));
            float d0 = q0.x - min(q0.w, q0.y);
            float e = 1.0e-10;
            _hsv0 = vec3(abs(q0.z + (q0.w - q0.y) / (6.0 * d0 + e)), d0 / (q0.x + e), q0.x);

            vec4 p1 = mix(vec4(_c1rgb.bg, K.wz), vec4(_c1rgb.gb, K.xy), step(_c1rgb.b, _c1rgb.g));
            vec4 q1 = mix(vec4(p1.xyw, _c1rgb.r), vec4(_c1rgb.r, p1.yzx), step(p1.x, _c1rgb.r));
            float d1 = q1.x - min(q1.w, q1.y);
            _hsv1 = vec3(abs(q1.z + (q1.w - q1.y) / (6.0 * d1 + e)), d1 / (q1.x + e), q1.x);

            // Shift hue of c0 based on hue of c1
            _hsv0.x = fract(_hsv0.x + _hsv1.x * amount);

            // HSV to RGB conversion
            vec4 K2 = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p2 = abs(fract(_hsv0.xxx + K2.xyz) * 6.0 - K2.www);
            vec3 rgb = _hsv0.z * mix(K2.xxx, clamp(p2 - K2.xxx, 0.0, 1.0), _hsv0.y);

            return vec4(rgb, _c0.a);
          `
	        });
	        console.log("[hydralisk-extras] Registered modulateHue HSV combine function.");
	      } catch (e) {
	        console.warn("[hydralisk-extras] Could not register modulateHue:", e);
	      }
	    }
	  });
	}

	/**
	 * Oblivion Guard Plugin for Hydralisk
	 * Detects visual crash / blackout / whiteout canvas states resulting from bad code mutations
	 * and automatically triggers jump-back to restore the last functional sketch state.
	 */

	function analyzeCanvasPixels(pixels) {
	  let totalR = 0,
	    totalG = 0,
	    totalB = 0,
	    totalA = 0;
	  let minRGB = 255,
	    maxRGB = 0;
	  const pixelCount = pixels.length / 4;
	  for (let i = 0; i < pixels.length; i += 4) {
	    const r = pixels[i];
	    const g = pixels[i + 1];
	    const b = pixels[i + 2];
	    const a = pixels[i + 3];
	    totalR += r;
	    totalG += g;
	    totalB += b;
	    totalA += a;
	    const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
	    if (brightness < minRGB) minRGB = brightness;
	    if (brightness > maxRGB) maxRGB = brightness;
	  }
	  const avgR = totalR / pixelCount;
	  const avgG = totalG / pixelCount;
	  const avgB = totalB / pixelCount;
	  const avgA = totalA / pixelCount;
	  const avgBrightness = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
	  const isBlackout = maxRGB <= 2 || avgBrightness < 1;
	  const isWhiteout = minRGB >= 253 || avgBrightness > 254;
	  const isBlankAlpha = avgA === 0;
	  const isOblivion = isBlackout || isWhiteout || isBlankAlpha;
	  return {
	    isOblivion,
	    type: isBlackout ? "blackout" : isWhiteout ? "whiteout" : isBlankAlpha ? "blank" : "normal",
	    avgBrightness,
	    minRGB,
	    maxRGB,
	    avgA
	  };
	}
	class OblivionGuard {
	  constructor(app) {
	    this.app = app;
	    this.enabled = true;
	    this.checkTimeout = null;
	    this.consecutiveReverts = 0;
	    this.maxConsecutiveReverts = 3;
	    this.offscreenCanvas = null;
	    this.toastEl = null;
	  }
	  getCanvas() {
	    return window.hydra && window.hydra.canvas || document.querySelector("canvas") || null;
	  }
	  inspectCanvas() {
	    const canvas = this.getCanvas();
	    if (!canvas) return null;
	    const sampleDim = 16;
	    const pixels = new Uint8Array(sampleDim * sampleDim * 4);

	    // Method 1: Try WebGL readPixels directly from regl context or canvas context
	    let gl = null;
	    if (window.hydra && window.hydra.regl && window.hydra.regl._gl) {
	      gl = window.hydra.regl._gl;
	    } else {
	      try {
	        gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
	      } catch (e) {}
	    }
	    if (gl && typeof gl.readPixels === "function") {
	      try {
	        const dw = gl.drawingBufferWidth || canvas.width || 300;
	        const dh = gl.drawingBufferHeight || canvas.height || 150;
	        const startX = Math.floor((dw - sampleDim) / 2);
	        const startY = Math.floor((dh - sampleDim) / 2);
	        gl.readPixels(Math.max(0, startX), Math.max(0, startY), sampleDim, sampleDim, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	        return analyzeCanvasPixels(pixels);
	      } catch (e) {
	        // Fallback to 2D context below
	      }
	    }

	    // Method 2: Fallback to 2D canvas drawImage
	    try {
	      if (!this.offscreenCanvas) {
	        this.offscreenCanvas = document.createElement("canvas");
	        this.offscreenCanvas.width = sampleDim;
	        this.offscreenCanvas.height = sampleDim;
	      }
	      const ctx = this.offscreenCanvas.getContext("2d");
	      ctx.drawImage(canvas, 0, 0, sampleDim, sampleDim);
	      const imgData = ctx.getImageData(0, 0, sampleDim, sampleDim);
	      return analyzeCanvasPixels(imgData.data);
	    } catch (e) {
	      return null;
	    }
	  }
	  scheduleCheck(delay = 250) {
	    if (!this.enabled) return;
	    if (this.checkTimeout) {
	      clearTimeout(this.checkTimeout);
	    }
	    this.checkTimeout = setTimeout(() => {
	      this.performCheck();
	    }, delay);
	  }
	  performCheck() {
	    if (!this.enabled) return;
	    const result = this.inspectCanvas();
	    if (!result) return;
	    if (result.isOblivion) {
	      if (this.consecutiveReverts >= this.maxConsecutiveReverts) {
	        console.warn(`[OblivionGuard] Max consecutive reverts (${this.maxConsecutiveReverts}) reached. Stopping auto-jump back to prevent infinite loop.`);
	        return;
	      }
	      this.consecutiveReverts++;
	      console.warn(`[OblivionGuard] Oblivion state detected (${result.type}). Reverting sketch to previous state...`);

	      // Revert code
	      let reverted = false;
	      if (this.app.memory && typeof this.app.memory.jumpBack === "function") {
	        const code = this.app.memory.jumpBack(1);
	        if (code) {
	          reverted = true;
	          this.evalCode(code);
	        }
	      }
	      if (!reverted) {
	        const cm = this.app.state && this.app.state.editor && this.app.state.editor.editor || window.cm;
	        if (cm && cm.mutator && typeof cm.mutator.doUndo === "function") {
	          cm.mutator.doUndo();
	          reverted = true;
	        }
	      }
	      this.showToast(`⚡ Oblivion Guard: Reverted ${result.type} state`);

	      // Schedule follow-up check to verify recovery
	      this.scheduleCheck(300);
	    } else {
	      this.consecutiveReverts = 0;
	    }
	  }
	  evalCode(code) {
	    const cm = this.app.state && this.app.state.editor && this.app.state.editor.editor || window.cm;
	    if (cm && typeof cm.setValue === "function") {
	      cm.setValue(code);
	    }
	    if (window.evalCode) {
	      window.evalCode(code);
	    } else if (cm && typeof cm.eval === "function") {
	      cm.eval(code);
	    }
	  }
	  showToast(message) {
	    if (typeof document === "undefined") return;
	    if (!this.toastEl) {
	      this.toastEl = document.createElement("div");
	      this.toastEl.id = "oblivion-guard-toast";
	      Object.assign(this.toastEl.style, {
	        position: "fixed",
	        bottom: "24px",
	        right: "24px",
	        backgroundColor: "rgba(20, 20, 25, 0.88)",
	        color: "#ff6b6b",
	        border: "1px solid rgba(255, 107, 107, 0.4)",
	        borderRadius: "8px",
	        padding: "10px 16px",
	        fontFamily: "monospace, sans-serif",
	        fontSize: "13px",
	        fontWeight: "bold",
	        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
	        backdropFilter: "blur(8px)",
	        zIndex: "9999",
	        transition: "opacity 0.3s ease, transform 0.3s ease",
	        opacity: "0",
	        transform: "translateY(10px)",
	        pointerEvents: "none"
	      });
	      document.body.appendChild(this.toastEl);
	    }
	    this.toastEl.textContent = message;
	    this.toastEl.style.opacity = "1";
	    this.toastEl.style.transform = "translateY(0)";
	    if (this._toastTimer) clearTimeout(this._toastTimer);
	    this._toastTimer = setTimeout(() => {
	      if (this.toastEl) {
	        this.toastEl.style.opacity = "0";
	        this.toastEl.style.transform = "translateY(10px)";
	      }
	    }, 2500);
	  }
	}
	if (typeof window !== "undefined" && window.HydraliskPlugins) {
	  window.HydraliskPlugins.register({
	    id: "oblivion-guard",
	    name: "Oblivion Guard (Canvas Blackout & Whiteout Auto-Recovery)",
	    init(app) {
	      const guard = new OblivionGuard(app);
	      app.oblivionGuard = guard;
	      app.expose("oblivionGuard", guard);
	      app.on("oblivion:scheduleCheck", (evt = {}) => {
	        guard.scheduleCheck(evt.delay || 250);
	      });
	      app.on("oblivion:checkNow", () => {
	        guard.performCheck();
	      });
	      app.on("oblivion:toggle", () => {
	        guard.enabled = !guard.enabled;
	        console.log(`[OblivionGuard] Enabled: ${guard.enabled}`);
	        guard.showToast(`Oblivion Guard ${guard.enabled ? "Enabled" : "Disabled"}`);
	      });

	      // Automatically trigger checks on mutate events
	      app.on("editor:randomize", () => {
	        guard.scheduleCheck(250);
	      });
	    }
	  });
	}

	/**
	 * Performance State Hash Fragment Settings Module for Hydralisk
	 * Encodes/decodes player performance state (BPM, HUD visibility, Automutate mode, Speed)
	 * Protocol format: #(<key>[a-z])(<value>[a-z0-9][0-9]*)|(<key>[a-z])(<value>[a-z0-9][0-9]*)
	 */

	class PlayerSettings {
	  constructor() {
	    this.keyMap = {
	      b: "bpm",
	      h: "hud",
	      m: "automutate",
	      s: "speed"
	    };
	    this.reverseKeyMap = {
	      bpm: "b",
	      hud: "h",
	      automutate: "m",
	      speed: "s"
	    };
	  }

	  /**
	   * Decode URL fragment string into a settings object
	   * @param {string} hashStr e.g. "#b120|h1|m4|s10"
	   * @returns {object} decoded settings object e.g. { bpm: 120, hud: 1, automutate: '4', speed: 1.0 }
	   */
	  decode(hashStr = typeof window !== "undefined" ? window.location.hash : "") {
	    const settings = {};
	    if (!hashStr) return settings;
	    let raw = hashStr.startsWith("#") ? hashStr.substring(1) : hashStr;
	    if (!raw) return settings;
	    const pairs = raw.split("|");
	    for (const pair of pairs) {
	      if (!pair) continue;
	      // Match protocol: key [a-z] followed by value [a-z0-9][0-9]*
	      const match = pair.match(/^([a-z])([a-z0-9][0-9]*)$/i);
	      if (match) {
	        const keyChar = match[1].toLowerCase();
	        const rawVal = match[2];
	        const settingsKey = this.keyMap[keyChar] || keyChar;
	        if (settingsKey === "bpm") {
	          const num = parseInt(rawVal, 10);
	          if (!isNaN(num)) settings[settingsKey] = num;
	        } else if (settingsKey === "hud") {
	          settings[settingsKey] = rawVal === "1" ? 1 : 0;
	        } else if (settingsKey === "automutate") {
	          settings[settingsKey] = rawVal;
	        } else if (settingsKey === "speed") {
	          const num = parseInt(rawVal, 10);
	          if (!isNaN(num)) settings[settingsKey] = num / 10;
	        } else {
	          settings[settingsKey] = rawVal;
	        }
	      }
	    }
	    return settings;
	  }

	  /**
	   * Encode settings object into a URL fragment string
	   * @param {object} settings e.g. { bpm: 120, hud: 1, automutate: '4', speed: 1.0 }
	   * @returns {string} e.g. "#b120|h1|m4|s10"
	   */
	  encode(settings = {}) {
	    const pairs = [];
	    if (typeof settings.bpm === "number" && !isNaN(settings.bpm)) {
	      pairs.push(`b${settings.bpm}`);
	    }
	    if (typeof settings.hud !== "undefined") {
	      pairs.push(`h${settings.hud ? 1 : 0}`);
	    }
	    if (settings.automutate) {
	      pairs.push(`m${settings.automutate}`);
	    }
	    if (typeof settings.speed === "number" && !isNaN(settings.speed)) {
	      const speedVal = Math.round(settings.speed * 10);
	      pairs.push(`s${speedVal}`);
	    }
	    return "#" + pairs.join("|");
	  }

	  /**
	   * Update browser location.hash with current settings without reloading/scrolling
	   * @param {object} settings
	   */
	  syncToHash(settings = {}) {
	    if (typeof window === "undefined" || !window.history || !window.history.replaceState) return;
	    const hash = this.encode(settings);
	    const url = new URL(window.location);
	    url.hash = hash;
	    window.history.replaceState(null, "", url.toString());
	  }
	}

	// Instantiate singleton
	const playerSettings = new PlayerSettings();
	if (typeof window !== "undefined") {
	  window.playerSettings = playerSettings;
	  if (window.HydraliskPlugins) {
	    window.HydraliskPlugins.register({
	      id: "player-settings",
	      name: "Player Performance State Fragment Encoder/Decoder",
	      init(app) {
	        app.expose("playerSettings", playerSettings);
	      }
	    });
	  }
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

})(React);
//# sourceMappingURL=modules.dist.js.map

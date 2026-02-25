(function () {
  'use strict';

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

  // This is a barrel file for all modules

  window.Modules = {
    SketchManager
  };

})();
//# sourceMappingURL=modules.dist.js.map

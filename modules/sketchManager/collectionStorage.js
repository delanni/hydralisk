// Collection storage for sketch subsets. Persists to localStorage.

const STORAGE_KEY = 'mySketches_collections';
const DEFAULT_STATE = { activeId: null, collections: [] };

function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.floor(Math.random() * 16);
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
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
export function filterSketchesByCollection(sketches, sketchIds) {
    if (!sketchIds || sketchIds.length === 0) return [];
    
    // Map available sketches by id and name for quick lookup
    const sketchMap = new Map();
    sketches.forEach((sketch) => {
        if (sketch.id) sketchMap.set(sketch.id, sketch);
        if (sketch.name) sketchMap.set(sketch.name, sketch);
    });

    const result = [];
    sketchIds.forEach((item) => {
        const id = typeof item === 'string' ? item : item?.sketchId;
        if (id && sketchMap.has(id)) {
            const sketch = sketchMap.get(id);
            const setlistMeta = typeof item === 'object' && item !== null ? item : { sketchId: id };
            result.push({
                ...sketch,
                _setlistMeta: setlistMeta
            });
        }
    });

    return result;
}

export default class CollectionStorage {
    constructor(localStorageRef, storageKey = STORAGE_KEY) {
        this.localStorage = localStorageRef;
        this.storageKey = storageKey;
    }

    _read() {
        const raw = this.localStorage.getItem(this.storageKey);
        if (!raw) return { ...DEFAULT_STATE };
        try {
            const parsed = JSON.parse(raw);
            return {
                activeId: parsed.activeId ?? null,
                collections: Array.isArray(parsed.collections) ? parsed.collections : []
            };
        } catch {
            return { ...DEFAULT_STATE };
        }
    }

    _write(state) {
        this.localStorage.setItem(this.storageKey, JSON.stringify(state));
    }

    getCollections() {
        return this._read();
    }

    getActiveCollection() {
        const { activeId, collections } = this._read();
        if (!activeId) return null;
        return collections.find((c) => c.id === activeId) ?? null;
    }

    setActiveCollection(id) {
        const state = this._read();
        state.activeId = id;
        this._write(state);
    }

    saveCollection(collection) {
        const state = this._read();
        const existing = state.collections.findIndex((c) => c.id === collection.id);
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
        state.collections = state.collections.filter((c) => c.id !== id);
        if (state.activeId === id) state.activeId = null;
        this._write(state);
    }

    addSketchToCollection(collectionId, sketchIdOrName, itemMeta = {}) {
        const state = this._read();
        const col = state.collections.find((c) => c.id === collectionId);
        if (!col) return;
        const exists = col.sketchIds.some(item => (typeof item === 'string' ? item : item?.sketchId) === sketchIdOrName);
        if (exists) return;
        const entry = Object.keys(itemMeta).length > 0
            ? { sketchId: sketchIdOrName, ...itemMeta }
            : sketchIdOrName;
        col.sketchIds.push(entry);
        col.updatedAt = new Date().toISOString();
        this._write(state);
    }

    addMultipleSketchesToCollection(collectionId, sketchIdOrNameList) {
        const state = this._read();
        const col = state.collections.find((c) => c.id === collectionId);
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
        const col = state.collections.find((c) => c.id === collectionId);
        if (!col) return;
        if (typeof indexOrId === 'number' && indexOrId >= 0 && indexOrId < col.sketchIds.length) {
            col.sketchIds.splice(indexOrId, 1);
        } else {
            col.sketchIds = col.sketchIds.filter((item) => {
                const id = typeof item === 'string' ? item : item?.sketchId;
                return id !== indexOrId;
            });
        }
        col.updatedAt = new Date().toISOString();
        this._write(state);
    }

    removeMultipleSketchesFromCollection(collectionId, sketchIdOrNameList) {
        const state = this._read();
        const col = state.collections.find((c) => c.id === collectionId);
        if (!col || !Array.isArray(sketchIdOrNameList)) return;
        const toRemoveSet = new Set(sketchIdOrNameList);
        col.sketchIds = col.sketchIds.filter((item) => {
            const id = typeof item === 'string' ? item : item?.sketchId;
            return !toRemoveSet.has(id);
        });
        col.updatedAt = new Date().toISOString();
        this._write(state);
    }

    moveSketch(collectionId, fromIndex, toIndex) {
        const state = this._read();
        const col = state.collections.find((c) => c.id === collectionId);
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
        const col = state.collections.find((c) => c.id === collectionId);
        if (!col || index < 0 || index >= col.sketchIds.length) return;
        const existing = col.sketchIds[index];
        const sketchId = typeof existing === 'string' ? existing : existing?.sketchId;
        col.sketchIds[index] = {
            ...(typeof existing === 'object' ? existing : { sketchId }),
            ...newMeta,
            sketchId
        };
        col.updatedAt = new Date().toISOString();
        this._write(state);
    }

    duplicateCollection(collectionId) {
        const state = this._read();
        const col = state.collections.find((c) => c.id === collectionId);
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
        const col = this.getCollections().collections.find((c) => c.id === collectionId);
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

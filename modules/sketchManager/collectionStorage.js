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
 * Filters sketches to those in the collection's sketchIds.
 * sketchIds can contain sketch.id or sketch.name (for backward compatibility).
 * @param {Object[]} sketches - All sketches
 * @param {string[]} sketchIds - Collection member ids/names
 * @returns {Object[]} Filtered sketches
 */
export function filterSketchesByCollection(sketches, sketchIds) {
    if (!sketchIds || sketchIds.length === 0) return [];
    const idSet = new Set(sketchIds);
    return sketches.filter((sketch) => {
        if (sketch.id && idSet.has(sketch.id)) return true;
        return idSet.has(sketch.name);
    });
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
        state.collections = state.collections.filter((c) => c.id !== id);
        if (state.activeId === id) state.activeId = null;
        this._write(state);
    }

    addSketchToCollection(collectionId, sketchIdOrName) {
        const state = this._read();
        const col = state.collections.find((c) => c.id === collectionId);
        if (!col) return;
        if (col.sketchIds.includes(sketchIdOrName)) return;
        col.sketchIds.push(sketchIdOrName);
        this._write(state);
    }

    removeSketchFromCollection(collectionId, sketchIdOrName) {
        const state = this._read();
        const col = state.collections.find((c) => c.id === collectionId);
        if (!col) return;
        col.sketchIds = col.sketchIds.filter((id) => id !== sketchIdOrName);
        this._write(state);
    }

    createCollection(name) {
        const collection = { id: generateId(), name: name || 'New collection', sketchIds: [] };
        this.saveCollection(collection);
        return collection;
    }
}

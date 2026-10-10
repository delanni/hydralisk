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

export default class SketchStorage {
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
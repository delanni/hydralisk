/**
 * Sketch repository.
 * Loads sketches from Cloud drafts (Amakit), sketches.json and localStorage,
 * then merges them by name into a normalized list.
 */
import { notify } from './intercom.js';
import { readJSON } from './preferences.js';

const PLACEHOLDER_SKETCH = {
  name: 'Nebula Glitch',
  author: 'Hydra Synth',
  bpm: 120,
  code: 'osc(40, 0.05, 1.5).modulate(noise(4), 0.5).colorama(0.4).out(o0);',
  metadata: { tags: ['glitch', 'colorful'] }
};

async function fetchCloudSketches() {
  const amakit = window.amakit;
  if (!amakit || !amakit.isAuthenticated) return [];
  try {
    notify('Syncing sketches from Cloud...');
    await amakit.loadDrafts();
    const drafts = amakit.draftCache || [];
    notify(`Loaded ${drafts.length} remote sketches`);
    return drafts;
  } catch (e) {
    console.error('Failed to load drafts from Amakit', e);
    notify('Cloud sync failed. Loading backup.', true);
    return [];
  }
}

async function fetchBuiltInSketches() {
  try {
    const response = await fetch('sketches.json');
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn('Could not fetch sketches.json', e);
  }
  return [];
}

function normalizeRemote(sketch) {
  const metadata = sketch.metadata || { tags: [] };
  return {
    ...sketch,
    isLocal: false,
    author: sketch.author || 'Hydralisk Team',
    bpm: sketch.bpm || 120,
    metadata: { ...metadata, tags: metadata.tags || [] }
  };
}

function normalizeLocal(sketch) {
  const metadata = sketch.metadata || { tags: ['local'] };
  let code = sketch.code;
  if (!code && sketch.fullDraft) {
    try {
      code = atob(sketch.fullDraft);
    } catch (e) {
      code = sketch.fullDraft;
    }
  }
  return {
    ...sketch,
    code,
    isLocal: true,
    author: sketch.author || 'You (Local)',
    bpm: sketch.bpm || 120,
    metadata: { ...metadata, tags: metadata.tags || ['local'] }
  };
}

export async function loadAllSketches() {
  let sourceSketches = await fetchCloudSketches();
  if (sourceSketches.length === 0) {
    sourceSketches = await fetchBuiltInSketches();
  }

  const localSketches = readJSON('mySketches', []);

  const merged = {};
  sourceSketches.forEach((s) => {
    const sketch = normalizeRemote(s);
    merged[sketch.name] = sketch;
  });
  (Array.isArray(localSketches) ? localSketches : []).forEach((s) => {
    const sketch = normalizeLocal(s);
    merged[sketch.name] = sketch;
  });

  const sketches = Object.values(merged);
  return sketches.length > 0 ? sketches : [PLACEHOLDER_SKETCH];
}

export function findSketchIndexByName(sketches, name) {
  if (!name) return -1;
  const target = name.toLowerCase();
  return sketches.findIndex((s) => s.name && s.name.toLowerCase() === target);
}

export function filterSketches(sketches, query, activeTags) {
  const q = (query || '').toLowerCase();
  return sketches.filter((s) => {
    const nameMatch =
      (s.name || '').toLowerCase().includes(q) || (s.author || '').toLowerCase().includes(q);
    const tagMatch =
      activeTags.length === 0 || (s.metadata?.tags || []).some((t) => activeTags.includes(t));
    return nameMatch && tagMatch;
  });
}

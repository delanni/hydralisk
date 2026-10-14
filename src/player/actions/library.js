/**
 * Library browsing actions: search and tag filtering.
 */
import { setState } from '../store/playerStore.js';
import { loadAllSketches } from '../services/sketchRepository.js';

export async function reloadSketches() {
  const sketches = await loadAllSketches();
  setState({ sketches });
  return sketches;
}

export function setSearchQuery(searchQuery) {
  setState({ searchQuery });
}

export function toggleTag(tag) {
  setState((s) => ({
    activeTags: s.activeTags.includes(tag)
      ? s.activeTags.filter((t) => t !== tag)
      : [...s.activeTags, tag]
  }));
}

export function clearTags() {
  setState({ activeTags: [] });
}

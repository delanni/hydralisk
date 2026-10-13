import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore.js';
import { filterSketches } from '../../services/sketchRepository.js';
import { SketchItem } from './SketchItem.jsx';

function SketchSection({ title, entries, currentIndex }) {
  if (entries.length === 0) return null;
  return (
    <>
      <div className="sketches-section-title">{title}</div>
      {entries.map(({ sketch, index }) => (
        <SketchItem key={`${index}-${sketch.name}`} sketch={sketch} index={index} active={index === currentIndex} />
      ))}
    </>
  );
}

export function SketchList() {
  const sketches = useStore((s) => s.sketches);
  const query = useStore((s) => s.searchQuery);
  const activeTags = useStore((s) => s.activeTags);
  const currentIndex = useStore((s) => s.currentSketchIndex);

  const { locals, builtIns, total } = useMemo(() => {
    const visible = new Set(filterSketches(sketches, query, activeTags));
    const entries = sketches
      .map((sketch, index) => ({ sketch, index }))
      .filter(({ sketch }) => visible.has(sketch));
    return {
      locals: entries.filter(({ sketch }) => sketch.isLocal),
      builtIns: entries.filter(({ sketch }) => !sketch.isLocal),
      total: entries.length
    };
  }, [sketches, query, activeTags]);

  return (
    <div id="sketches-list-container" className="sketches-list">
      <SketchSection title="Your Sketches (Local)" entries={locals} currentIndex={currentIndex} />
      <SketchSection title="Built-in Library" entries={builtIns} currentIndex={currentIndex} />
      {sketches.length > 0 && total === 0 && <div className="sketches-empty">No sketches found</div>}
    </div>
  );
}

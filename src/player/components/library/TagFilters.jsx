import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore.js';
import { selectAllTags } from '../../store/playerStore.js';
import { toggleTag, clearTags } from '../../actions/index.js';
import { FilterTag } from '../common/FilterTag.jsx';

export function TagFilters() {
  const sketches = useStore((s) => s.sketches);
  const activeTags = useStore((s) => s.activeTags);
  const tags = useMemo(() => selectAllTags({ sketches }), [sketches]);

  return (
    <div id="tag-filters-list" className="tag-filters">
      {sketches.length > 0 && (
        <>
          <FilterTag active={activeTags.length === 0} onClick={clearTags}>All</FilterTag>
          {tags.map((tag) => (
            <FilterTag key={tag} active={activeTags.includes(tag)} onClick={() => toggleTag(tag)}>
              {tag}
            </FilterTag>
          ))}
        </>
      )}
    </div>
  );
}

import React from 'react';
import { useStore } from '../../store/useStore.js';
import { setSearchQuery } from '../../actions/index.js';

export function SearchBar() {
  const query = useStore((s) => s.searchQuery);
  return (
    <div className="search-wrapper">
      <input
        type="text"
        id="sketch-search-input"
        className="search-input"
        placeholder="Search sketches or authors..."
        value={query}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
}

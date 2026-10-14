import React from 'react';
import { SearchBar } from './SearchBar.jsx';
import { TagFilters } from './TagFilters.jsx';
import { SketchList } from './SketchList.jsx';

export function LibraryTab() {
  return (
    <>
      <SearchBar />
      <TagFilters />
      <SketchList />
    </>
  );
}

// --- SketchSearchFilter: React search & tag filtering component with fuzzy matching & quality filter ---
export { fuzzyMatchScore, filterAndRankSketches } from './sketchFilterService.js';
import { fuzzyMatchScore, filterAndRankSketches } from './sketchFilterService.js';

export default function SketchSearchFilter({
    sketches = [],
    searchQuery = '',
    selectedTags = [],
    filterMode = 'all',
    minQuality = 0,
    onSearchQueryChange,
    onTagToggle,
    onClearTags,
    onFilterModeChange,
    onMinQualityChange,
    totalCount = 0,
    filteredCount = 0
}) {
    // Collect all unique tags across all available sketches
    const allTagsMap = new Map();
    sketches.forEach((sketch) => {
        const tags = Array.isArray(sketch.metadata?.tags) ? sketch.metadata.tags : [];
        tags.forEach((tag) => {
            const clean = String(tag).trim();
            if (clean) {
                const lower = clean.toLowerCase();
                allTagsMap.set(lower, clean); // preserve display casing
            }
        });
    });

    const uniqueTags = Array.from(allTagsMap.values()).sort((a, b) => a.localeCompare(b));

    return (
        <div className="sketch-search-filter-container" style={{ marginBottom: 12 }}>
            {/* Unified Search Input Bar & Dropdown Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                    <input
                        type="text"
                        className="sketch-filter"
                        placeholder="🔍 Search sketches (name, tags, code...)"
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        style={{ width: '100%', paddingRight: searchQuery ? 28 : 8, boxSizing: 'border-box' }}
                    />
                    {searchQuery && (
                        <button
                            title="Clear search query"
                            onClick={() => onSearchQueryChange('')}
                            style={{
                                position: 'absolute',
                                right: 6,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 14,
                                color: '#666'
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Minimum Quality Filter (Any / 1+ / 2+ / 3+ / 4+ / 5) */}
                <select
                    value={minQuality}
                    onChange={(e) => onMinQualityChange?.(Number(e.target.value) || 0)}
                    style={{
                        padding: '7px 8px',
                        borderRadius: 4,
                        border: minQuality > 0 ? '1px solid #f59e0b' : '1px solid #ccc',
                        fontSize: 13,
                        background: minQuality > 0 ? '#fef3c7' : '#fff',
                        color: minQuality > 0 ? '#b45309' : '#333',
                        fontWeight: minQuality > 0 ? 600 : 400
                    }}
                    title="Filter sketches over minimum quality rating"
                >
                    <option value="0">All Qualities</option>
                    <option value="1">Quality ≥ 1 ★</option>
                    <option value="2">Quality ≥ 2 ★★</option>
                    <option value="3">Quality ≥ 3 ★★★</option>
                    <option value="4">Quality ≥ 4 ★★★★</option>
                    <option value="5">Quality = 5 ★★★★★</option>
                </select>

                {/* Quick Source Filter Mode (All / Local / Remote) */}
                <select
                    value={filterMode}
                    onChange={(e) => onFilterModeChange(e.target.value)}
                    style={{ padding: '7px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: 13 }}
                >
                    <option value="all">All Sources</option>
                    <option value="local">Local Only</option>
                    <option value="remote">Remote Only</option>
                </select>
            </div>

            {/* Interactive Tag Cloud Pills */}
            {uniqueTags.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Filter by Tags ({selectedTags.length > 0 ? `${selectedTags.length} active` : 'all'})
                        </span>
                        {selectedTags.length > 0 && (
                            <button
                                onClick={onClearTags}
                                style={{ background: 'none', border: 'none', color: '#007bff', fontSize: 11, cursor: 'pointer', padding: 0 }}
                            >
                                Clear selected tags
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 68, overflowY: 'auto', padding: '2px 0' }}>
                        {uniqueTags.map((tag) => {
                            const isSelected = selectedTags.some(t => t.toLowerCase() === tag.toLowerCase());
                            return (
                                <button
                                    key={tag}
                                    onClick={() => onTagToggle(tag)}
                                    className={`sketch-tag-pill${isSelected ? ' sketch-tag-pill--selected' : ''}`}
                                    style={{
                                        border: isSelected ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                        background: isSelected ? '#3b82f6' : '#f1f5f9',
                                        color: isSelected ? '#ffffff' : '#334155',
                                        borderRadius: 12,
                                        padding: '2px 10px',
                                        fontSize: 11,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        fontWeight: isSelected ? 600 : 400
                                    }}
                                >
                                    #{tag}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Match Stats Line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}>
                <span>Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> sketches</span>
                {(searchQuery || selectedTags.length > 0 || filterMode !== 'all' || minQuality > 0) && (
                    <span style={{ color: '#3b82f6' }}>
                        Filter active{minQuality > 0 ? ` (Quality ≥ ${minQuality})` : ''}
                    </span>
                )}
            </div>
        </div>
    );
}

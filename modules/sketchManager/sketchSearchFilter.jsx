// --- SketchSearchFilter: React search & tag filtering component with fuzzy matching ---

/**
 * Calculates a fuzzy match score for a given query against target text.
 * Returns score > 0 if query characters match sequentially, otherwise 0.
 * Higher scores represent better matches (e.g. prefix match, word start match).
 */
export function fuzzyMatchScore(query, target) {
    if (!query) return 1; // Empty query matches everything
    if (!target) return 0;

    const q = query.toLowerCase().trim();
    const t = target.toLowerCase();

    if (t.includes(q)) {
        // Substring match gets a boost proportional to position
        const index = t.indexOf(q);
        return 100 - index;
    }

    // Sequential character matching score
    let qIdx = 0;
    let score = 0;
    let consecutive = 0;

    for (let tIdx = 0; tIdx < t.length && qIdx < q.length; tIdx++) {
        if (t[tIdx] === q[qIdx]) {
            score += 10 + (consecutive * 5);
            if (tIdx === 0 || t[tIdx - 1] === ' ' || t[tIdx - 1] === '_' || t[tIdx - 1] === '-') {
                score += 15; // Word boundary match boost
            }
            qIdx++;
            consecutive++;
        } else {
            consecutive = 0;
        }
    }

    return qIdx === q.length ? score : 0;
}

/**
 * Filters and ranks sketches based on text search (fuzzy) and tag selection.
 */
export function filterAndRankSketches(sketches, searchQuery, selectedTags = [], filterMode = 'all') {
    if (!sketches || !Array.isArray(sketches)) return [];

    const query = (searchQuery || '').trim();
    const tagsLower = (selectedTags || []).map(t => String(t).toLowerCase());

    return sketches
        .map((sketch) => {
            // Source mode filter (all / remote / local)
            if (filterMode === 'remote' && !sketch.remote) return null;
            if (filterMode === 'local' && sketch.remote) return null;

            // Tag filter check
            const sketchTags = Array.isArray(sketch.metadata?.tags) ? sketch.metadata.tags : [];
            const sketchTagsLower = sketchTags.map(t => String(t).toLowerCase());

            if (tagsLower.length > 0) {
                const matchesTags = tagsLower.every(reqTag => sketchTagsLower.includes(reqTag));
                if (!matchesTags) return null;
            }

            if (!query) {
                return { sketch, score: 1 };
            }

            // Fuzzy match across name, description, tags, and code
            const nameScore = fuzzyMatchScore(query, sketch.name || '');
            const descScore = fuzzyMatchScore(query, sketch.description || sketch.metadata?.description || '');
            const tagsText = sketchTags.join(' ');
            const tagScore = fuzzyMatchScore(query, tagsText);
            const codeScore = sketch.code ? (sketch.code.toLowerCase().includes(query.toLowerCase()) ? 20 : 0) : 0;

            const maxScore = Math.max(nameScore * 2, descScore * 1.2, tagScore * 1.5, codeScore);

            return maxScore > 0 ? { sketch, score: maxScore } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .map(item => item.sketch);
}

export default function SketchSearchFilter({
    sketches = [],
    searchQuery = '',
    selectedTags = [],
    filterMode = 'all',
    onSearchQueryChange,
    onTagToggle,
    onClearTags,
    onFilterModeChange,
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
            {/* Unified Search Input Bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
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
                {(searchQuery || selectedTags.length > 0 || filterMode !== 'all') && (
                    <span style={{ color: '#3b82f6' }}>Fuzzy filter active</span>
                )}
            </div>
        </div>
    );
}

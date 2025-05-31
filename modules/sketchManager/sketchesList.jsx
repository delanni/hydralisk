// --- SketchesList: List of sketches with actions ---
export default function SketchesList({
    sketches,
    filter,
    tagFilter,
    onFilterChange,
    onTagFilterChange,
    onEdit,
    onDelete,
    onRowClick,
    actions = [] // <-- Accept an array of action button configs
}) {
    // Split tag filter input by space, comma, or semicolon, and filter out empty strings
    const tagFilterList = tagFilter
        .split(/[\s,;]+/)
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

    const isFiltering = (filter && filter.trim()) || tagFilterList.length > 0;

    const filtered = sketches.filter(sketch => {
        // Name filter
        const nameMatch = sketch.name?.toLowerCase().includes(filter?.toLowerCase());
        // Tag filter
        if (tagFilterList.length === 0) return nameMatch;
        const tags = Array.isArray(sketch.metadata?.tags) ? sketch.metadata.tags : [];
        // If any tag matches any of the entered tags, keep the sketch
        const tagMatch = tags.some(tag =>
            tagFilterList.includes(String(tag).toLowerCase())
        );
        return nameMatch && tagMatch;
    });

    return (
        <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                    id="sketch-filter"
                    type="text"
                    className="sketch-filter"
                    placeholder="Filter by name"
                    value={filter}
                    onChange={onFilterChange}
                    style={{ flex: 1 }}
                />
                <input
                    id="sketch-tag-filter"
                    type="text"
                    className="sketch-filter"
                    placeholder="Filter by tag (space, comma, or semicolon separated)"
                    value={tagFilter}
                    onChange={onTagFilterChange}
                    style={{ flex: 1 }}
                />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {actions.map((action, i) => (
                    <button
                        key={i}
                        onClick={() => action.onClick(filtered, isFiltering)}
                        disabled={action.disabled ? action.disabled(filtered, isFiltering) : false}
                    >
                        {action.label}
                    </button>
                ))}
            </div>
            <ul className="sketch-list">
                {filtered.length === 0 && (
                    <li style={{ color: '#888' }}>No sketches found.</li>
                )}
                {filtered.map((sketch, idx) => {
                    const tags = Array.isArray(sketch.metadata?.tags) ? sketch.metadata.tags : [];
                    return (
                        <li
                            key={sketch.name}
                            className="sketch-list-item"
                            onClick={() => onRowClick(sketch, idx)}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {sketch.name}
                                {tags.length > 0 && (
                                    <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {tags.slice(0, 4).map((tag, i) => (
                                            <span className="sketch-tag" key={i}>{tag}</span>
                                        ))}
                                    </span>
                                )}
                            </span>
                            <span
                                onClick={e => e.stopPropagation()}
                            >
                                <button
                                    title="Edit sketch"
                                    style={{ marginRight: 8 }}
                                    onClick={() => onEdit(sketch.name, idx)}
                                >
                                    E
                                </button>
                                <button
                                    title="Delete sketch"
                                    style={{ color: 'red' }}
                                    onClick={() => onDelete(sketch.name)}
                                >
                                    ✕
                                </button>
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
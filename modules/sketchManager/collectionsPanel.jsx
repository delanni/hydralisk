// --- CollectionsPanel: Manage collections of sketches ---
export default function CollectionsPanel({
    collectionStorage,
    sketches,
    activeId,
    onActiveChange,
    onCollectionsChange
}) {
    const { collections } = collectionStorage.getCollections();
    const activeCollection = collectionStorage.getActiveCollection();

    const handleSetActive = (id) => {
        collectionStorage.setActiveCollection(id);
        onActiveChange(id);
        onCollectionsChange?.();
    };

    const handleCreateCollection = () => {
        const name = window.prompt('Collection name:', 'New collection');
        if (!name) return;
        collectionStorage.createCollection(name.trim());
        onCollectionsChange?.();
    };

    const handleDeleteCollection = (id) => {
        const col = collections.find((c) => c.id === id);
        if (!col || !window.confirm(`Delete collection "${col.name}"?`)) return;
        collectionStorage.deleteCollection(id);
        if (activeId === id) {
            collectionStorage.setActiveCollection(null);
            onActiveChange(null);
        }
        onCollectionsChange?.();
    };

    const handleAddSketch = (collectionId, sketchIdOrName) => {
        collectionStorage.addSketchToCollection(collectionId, sketchIdOrName);
        onCollectionsChange?.();
    };

    const handleRemoveSketch = (collectionId, sketchIdOrName) => {
        collectionStorage.removeSketchFromCollection(collectionId, sketchIdOrName);
        onCollectionsChange?.();
    };

    const getSketchId = (sketch) => sketch.id || sketch.name;
    const isInCollection = (sketch, sketchIds) => {
        const id = getSketchId(sketch);
        return sketchIds.includes(id) || sketchIds.includes(sketch.name);
    };

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 600, marginRight: 8 }}>Active:</label>
                <select
                    value={activeId || ''}
                    onChange={(e) => handleSetActive(e.target.value || null)}
                    style={{ padding: 6, minWidth: 160 }}
                >
                    <option value="">All sketches</option>
                    {collections.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={handleCreateCollection}>New collection</button>
            </div>

            <ul className="sketch-list" style={{ listStyle: 'none', padding: 0 }}>
                {collections.length === 0 && (
                    <li style={{ color: '#888', marginBottom: 8 }}>No collections yet.</li>
                )}
                {collections.map((col) => {
                    const count = col.sketchIds.length;
                    const isActive = activeId === col.id;
                    return (
                        <li
                            key={col.id}
                            className="sketch-list-item"
                            style={{ marginBottom: 8, padding: 8, border: '1px solid #eee', borderRadius: 4 }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                <span>
                                    <strong>{col.name}</strong>
                                    <span style={{ color: '#666', marginLeft: 8 }}>({count})</span>
                                </span>
                                <span onClick={(e) => e.stopPropagation()}>
                                    {!isActive && (
                                        <button
                                            style={{ marginRight: 8 }}
                                            onClick={() => handleSetActive(col.id)}
                                        >
                                            Activate
                                        </button>
                                    )}
                                    <button
                                        style={{ color: 'red' }}
                                        onClick={() => handleDeleteCollection(col.id)}
                                    >
                                        Delete
                                    </button>
                                </span>
                            </div>
                            <div style={{ marginTop: 8, fontSize: 13, maxHeight: 120, overflowY: 'auto' }}>
                                {sketches.length === 0 ? (
                                    <span style={{ color: '#888' }}>No sketches in storage.</span>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {sketches.map((sketch) => {
                                            const sid = getSketchId(sketch);
                                            const inCol = isInCollection(sketch, col.sketchIds);
                                            return (
                                                <span
                                                    key={sid}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        padding: '2px 6px',
                                                        paddingRight: 4,
                                                        borderRadius: 4,
                                                        background: inCol ? '#e0e7ff' : '#f0f0f0',
                                                        fontSize: 12
                                                    }}
                                                >
                                                    {sketch.name}
                                                    {inCol ? (
                                                        <button
                                                            title="Remove from collection"
                                                            style={{ padding: '0 4px', fontSize: 10, lineHeight: 1 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveSketch(col.id, sid);
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    ) : (
                                                        <button
                                                            title="Add to collection"
                                                            style={{ padding: '0 4px', fontSize: 10, lineHeight: 1 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddSketch(col.id, sid);
                                                            }}
                                                        >
                                                            +
                                                        </button>
                                                    )}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

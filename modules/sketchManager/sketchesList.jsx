import React, { useState } from 'react';
import SketchSearchFilter, { filterAndRankSketches } from './sketchSearchFilter.jsx';

// --- SketchesList: Main Sketches Tab with Setlist Collecting & (+)/(-) Controls ---
export default function SketchesList({
    sketches = [],
    collections = [],
    targetCollectionId = '',
    onTargetCollectionChange,
    onAddSketchToTarget,
    onRemoveSketchFromTarget,
    onAddFilteredToTarget,
    onRemoveFilteredFromTarget,
    filter = '',
    tagFilter = '',
    remoteDraftNames = new Set(),
    onFilterChange,
    onTagFilterChange,
    onEdit,
    onDelete,
    onUpload,
    onRowClick,
    actions = []
}) {
    const [selectedTags, setSelectedTags] = useState([]);
    const [filterMode, setFilterMode] = useState('all');

    // Handle tag filtering
    const handleTagToggle = (tag) => {
        const lower = tag.toLowerCase();
        setSelectedTags((prev) => {
            const exists = prev.some((t) => t.toLowerCase() === lower);
            const updated = exists
                ? prev.filter((t) => t.toLowerCase() !== lower)
                : [...prev, tag];
            if (onTagFilterChange) {
                onTagFilterChange({ target: { value: updated.join(', ') } });
            }
            return updated;
        });
    };

    const handleClearTags = () => {
        setSelectedTags([]);
        if (onTagFilterChange) {
            onTagFilterChange({ target: { value: '' } });
        }
    };

    const handleSearchChange = (val) => {
        if (onFilterChange) {
            onFilterChange({ target: { value: val } });
        }
    };

    // Filter & rank sketches using fuzzy matcher and tag filter
    const filtered = filterAndRankSketches(sketches, filter, selectedTags, filterMode);
    const isFiltering = Boolean(filter.trim()) || selectedTags.length > 0 || filterMode !== 'all';

    // Target collection lookup
    const targetCollection = collections.find((c) => c.id === targetCollectionId) || null;

    // Helper to check if sketch is in target collection
    const isSketchInTarget = (sketch) => {
        if (!targetCollection || !Array.isArray(targetCollection.sketchIds)) return false;
        const sId = sketch.id || sketch.name;
        return targetCollection.sketchIds.some((item) => {
            const id = typeof item === 'string' ? item : item?.sketchId;
            return id === sId || id === sketch.name;
        });
    };

    // Handle + All and - All for current filtered sketches
    const handleAddAllFiltered = () => {
        if (!targetCollectionId) return;
        const idsToAdd = filtered.map((s) => s.id || s.name);
        onAddFilteredToTarget?.(targetCollectionId, idsToAdd);
    };

    const handleRemoveAllFiltered = () => {
        if (!targetCollectionId) return;
        const idsToRemove = filtered.map((s) => s.id || s.name);
        onRemoveFilteredFromTarget?.(targetCollectionId, idsToRemove);
    };

    return (
        <div className="sketches-list-component">
            {/* Setlist Collector Control Header */}
            <div
                style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    padding: '8px 12px',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                        Setlist to collect to:
                    </label>
                    <select
                        value={targetCollectionId || ''}
                        onChange={(e) => onTargetCollectionChange?.(e.target.value)}
                        style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, flex: 1 }}
                    >
                        <option value="">-- Choose Setlist --</option>
                        {collections.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} ({c.sketchIds?.length || 0} items)
                            </option>
                        ))}
                    </select>
                </div>

                {/* Bulk +All / -All Actions */}
                {targetCollectionId ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                            onClick={handleAddAllFiltered}
                            disabled={filtered.length === 0}
                            style={{
                                background: '#22c55e',
                                color: '#ffffff',
                                border: 'none',
                                padding: '4px 10px',
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: filtered.length > 0 ? 'pointer' : 'default',
                                opacity: filtered.length > 0 ? 1 : 0.6
                            }}
                            title="Add all currently filtered sketches to target setlist"
                        >
                            + All ({filtered.length})
                        </button>
                        <button
                            onClick={handleRemoveAllFiltered}
                            disabled={filtered.length === 0}
                            style={{
                                background: '#ef4444',
                                color: '#ffffff',
                                border: 'none',
                                padding: '4px 10px',
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: filtered.length > 0 ? 'pointer' : 'default',
                                opacity: filtered.length > 0 ? 1 : 0.6
                            }}
                            title="Remove all currently filtered sketches from target setlist"
                        >
                            - All ({filtered.length})
                        </button>
                    </div>
                ) : (
                    <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                        Select a setlist to enable + / - buttons
                    </span>
                )}
            </div>

            {/* React Fuzzy Search Component & Tag Cloud */}
            <SketchSearchFilter
                sketches={sketches}
                searchQuery={filter}
                selectedTags={selectedTags}
                filterMode={filterMode}
                onSearchQueryChange={handleSearchChange}
                onTagToggle={handleTagToggle}
                onClearTags={handleClearTags}
                onFilterModeChange={setFilterMode}
                totalCount={sketches.length}
                filteredCount={filtered.length}
            />

            {/* List Action Buttons (e.g. Keep filtered / Clear local) */}
            {actions.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    {actions.map((action, i) => (
                        <button
                            key={i}
                            onClick={() => action.onClick(filtered, isFiltering)}
                            disabled={action.disabled ? action.disabled(filtered, isFiltering) : false}
                            style={{ padding: '4px 10px', fontSize: 12 }}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Sketches List with (+) / (-) Buttons */}
            <ul className="sketch-list" style={{ margin: 0 }}>
                {filtered.length === 0 && (
                    <li style={{ color: '#888', padding: 12, textAlign: 'center' }}>No sketches match your search.</li>
                )}
                {filtered.map((sketch, idx) => {
                    const tags = Array.isArray(sketch.metadata?.tags) ? sketch.metadata.tags : [];
                    const isOnRemote = remoteDraftNames.has(sketch.name);
                    const inTarget = isSketchInTarget(sketch);
                    const sketchId = sketch.id || sketch.name;

                    return (
                        <li
                            key={sketchId || idx}
                            className={`sketch-list-item${isOnRemote ? ' sketch-list-item--remote' : ''}`}
                            onClick={() => onRowClick(sketch, idx)}
                            style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}
                        >
                            {/* Sketch Name & Tags */}
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {sketch.name}
                                </strong>
                                {tags.length > 0 && (
                                    <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {tags.slice(0, 3).map((tag, i) => (
                                            <span className="sketch-tag" key={i}>#{tag}</span>
                                        ))}
                                    </span>
                                )}
                            </span>

                            {/* Action Buttons: (+)/(-) Setlist Collect + Upload + Edit + Delete */}
                            <span onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                {/* (+) / (-) Setlist Collect Button */}
                                {targetCollectionId ? (
                                    inTarget ? (
                                        <button
                                            title="Remove from target setlist"
                                            onClick={() => onRemoveSketchFromTarget?.(targetCollectionId, sketchId)}
                                            style={{
                                                background: '#ef4444',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: 4,
                                                width: 26,
                                                height: 24,
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                fontSize: 14,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: 6
                                            }}
                                        >
                                            -
                                        </button>
                                    ) : (
                                        <button
                                            title="Add to target setlist"
                                            onClick={() => onAddSketchToTarget?.(targetCollectionId, sketchId)}
                                            style={{
                                                background: '#22c55e',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: 4,
                                                width: 26,
                                                height: 24,
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                fontSize: 14,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: 6
                                            }}
                                        >
                                            +
                                        </button>
                                    )
                                ) : null}

                                {onUpload && (
                                    <button
                                        title="Upload to remote AWS DynamoDB"
                                        onClick={() => onUpload(sketch, idx)}
                                        style={{ padding: '2px 6px', fontSize: 12 }}
                                    >
                                        ↑
                                    </button>
                                )}
                                <button
                                    title="Edit sketch metadata"
                                    onClick={() => onEdit(sketch.name, idx)}
                                    style={{ padding: '2px 6px', fontSize: 12 }}
                                >
                                    E
                                </button>
                                <button
                                    title="Delete sketch"
                                    style={{ color: '#ef4444', padding: '2px 6px', fontSize: 12 }}
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
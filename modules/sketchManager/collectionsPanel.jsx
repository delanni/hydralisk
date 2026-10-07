import React from 'react';
import { dialogService } from './dialogService.js';

// --- CollectionsPanel: Simplified Setlist Tab (Create, Load/Activate, Delete) ---
export default function CollectionsPanel({
    collectionStorage,
    activeId,
    onActiveChange,
    onCollectionsChange
}) {
    const { collections } = collectionStorage.getCollections();

    const handleSetActive = (id) => {
        collectionStorage.setActiveCollection(id);
        onActiveChange(id);
        onCollectionsChange?.();
    };

    const handleCreateCollection = async () => {
        const name = await dialogService.prompt({
            title: 'Create New Setlist',
            message: 'Enter a title for your new performance setlist:',
            defaultValue: 'New Setlist',
            placeholder: 'Setlist name'
        });
        if (!name || !name.trim()) return;
        const col = collectionStorage.createCollection(name.trim());
        handleSetActive(col.id);
        onCollectionsChange?.();
    };

    const handleDeleteCollection = async (id, name) => {
        const confirmed = await dialogService.confirm({
            title: 'Delete Setlist',
            message: `Are you sure you want to delete setlist "${name}"?`,
            confirmText: 'Delete',
            isDanger: true
        });
        if (!confirmed) return;
        collectionStorage.deleteCollection(id);
        if (activeId === id) {
            collectionStorage.setActiveCollection(null);
            onActiveChange(null);
        }
        onCollectionsChange?.();
    };

    return (
        <div className="setlist-manager-panel" style={{ padding: '4px 0' }}>
            {/* Create New Setlist Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                    Manage your performance setlists. Select a setlist to load as active.
                </span>
                <button
                    onClick={handleCreateCollection}
                    style={{
                        background: '#3b82f6',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: 4,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: 13
                    }}
                >
                    + Create Setlist
                </button>
            </div>

            {/* Default Unfiltered State Option */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '10px 14px',
                    marginBottom: 10,
                    border: !activeId ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    borderRadius: 6,
                    background: !activeId ? '#eff6ff' : '#f8fafc'
                }}
            >
                <div>
                    <strong style={{ fontSize: 14, color: '#1e293b' }}>All Sketches (Default Unfiltered)</strong>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        Show all sketches in library without setlist filtering
                    </div>
                </div>
                {!activeId ? (
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', background: '#dbeafe', padding: '3px 10px', borderRadius: 12 }}>
                        ● Active
                    </span>
                ) : (
                    <button
                        onClick={() => handleSetActive(null)}
                        style={{ padding: '4px 12px', fontSize: 12, borderRadius: 4, cursor: 'pointer' }}
                    >
                        Load
                    </button>
                )}
            </div>

            {/* List of Setlists */}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {collections.length === 0 ? (
                    <li style={{ color: '#94a3b8', padding: 16, textAlign: 'center', background: '#f8fafc', borderRadius: 6 }}>
                        No setlists created yet. Click <strong>+ Create Setlist</strong> to start collecting sketches.
                    </li>
                ) : (
                    collections.map((col) => {
                        const count = col.sketchIds.length;
                        const isActive = activeId === col.id;

                        return (
                            <li
                                key={col.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justify: 'space-between',
                                    padding: '10px 14px',
                                    marginBottom: 8,
                                    border: isActive ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                    borderRadius: 6,
                                    background: isActive ? '#eff6ff' : '#ffffff'
                                }}
                            >
                                <div>
                                    <strong style={{ fontSize: 14, color: '#1e293b' }}>{col.name}</strong>
                                    <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                                        ({count} {count === 1 ? 'sketch' : 'sketches'})
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {isActive ? (
                                        <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', background: '#dbeafe', padding: '3px 10px', borderRadius: 12 }}>
                                            ● Active
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleSetActive(col.id)}
                                            style={{ background: '#22c55e', color: '#ffffff', border: 'none', padding: '4px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                                        >
                                            Load
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDeleteCollection(col.id, col.name)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 13, cursor: 'pointer', padding: '4px 8px' }}
                                        title="Delete setlist"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        );
                    })
                )}
            </ul>
        </div>
    );
}

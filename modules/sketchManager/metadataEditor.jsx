// --- MetadataEditor: Editable metadata fields ---
export default function MetadataEditor({ metadata, newField, onFieldChange, onRemove, onNewFieldChange, onAddField }) {
    // Helper to parse value as JSON, fallback to string if invalid
    const parseValue = (val) => {
        try {
            return typeof val === "string" ? JSON.stringify(JSON.parse(val), null, 0) : JSON.stringify(val, null, 0);
        } catch {
            return typeof val === "string" ? val : JSON.stringify(val);
        }
    };

    return (
        <div>
            <div className="metadata-fields-title">Metadata</div>

            {/* Quality Rating (1-5) Control */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, padding: '8px 10px', background: '#11111b', borderRadius: 8, border: '1px solid #313244', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#cdd6f4' }}>
                    Quality Rating:
                </span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => {
                        const currentQ = Number(metadata.quality) || 0;
                        const isFilled = star <= currentQ;
                        return (
                            <button
                                key={star}
                                type="button"
                                onClick={() => onFieldChange('quality', star)}
                                title={`Set quality to ${star}`}
                                style={{
                                    background: isFilled ? '#f59e0b' : '#313244',
                                    color: isFilled ? '#11111b' : '#a6adc8',
                                    border: isFilled ? '1px solid #fbbf24' : '1px solid #45475a',
                                    borderRadius: 6,
                                    padding: '3px 8px',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                ★ {star}
                            </button>
                        );
                    })}
                    {metadata.quality !== undefined && (
                        <button
                            type="button"
                            onClick={() => onRemove('quality')}
                            style={{ background: 'none', border: 'none', color: '#f38ba8', fontSize: 11, cursor: 'pointer', marginLeft: 4 }}
                            title="Clear quality rating"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {Object.entries(metadata).filter(([k]) => k !== 'quality').map(([key, value]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <input
                        type="text"
                        className="metadata-key-input"
                        value={key}
                        disabled
                    />
                    <input
                        type="text"
                        className="metadata-fields-input"
                        value={parseValue(value)}
                        onChange={e => onFieldChange(key, e.target.value)}
                    />
                    <button
                        onClick={() => onRemove(key)}
                        title="Remove field"
                        style={{
                            background: '#313244',
                            color: '#f38ba8',
                            border: '1px solid #45475a',
                            borderRadius: 6,
                            width: 28,
                            height: 28,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            flexShrink: 0
                        }}
                    >✕</button>
                </div>
            ))}
            <div className="metadata-add-row">
                <input
                    type="text"
                    name="key"
                    placeholder="New metadata field"
                    value={newField.key}
                    className="metadata-key-input"
                    onChange={onNewFieldChange}
                />
                <input
                    type="text"
                    name="value"
                    placeholder="Value"
                    value={newField.value}
                    className="metadata-fields-input"
                    onChange={onNewFieldChange}
                />
                <button
                    onClick={onAddField}
                    title="Add field"
                    style={{
                        background: '#89b4fa',
                        color: '#11111b',
                        border: 'none',
                        borderRadius: 6,
                        width: 28,
                        height: 28,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 'bold',
                        flexShrink: 0
                    }}
                >＋</button>
            </div>
        </div>
    );
}
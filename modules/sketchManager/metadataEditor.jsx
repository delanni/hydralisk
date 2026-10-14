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
            {Object.entries(metadata).map(([key, value]) => (
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
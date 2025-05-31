// --- SketchFieldsEditor: Fixed fields (non-metadata) ---
export default function SketchFieldsEditor({ fields, values, onChange }) {
    // Helper to parse value as JSON, fallback to string if invalid
    const parseValue = (val) => {
        try {
            return typeof val === "string" ? JSON.stringify(JSON.parse(val), null, 0) : JSON.stringify(val, null, 0);
        } catch {
            return typeof val === "string" ? val : JSON.stringify(val);
        }
    };
    // Helper to parse input as JSON, fallback to string if invalid
    const parseInput = (input) => {
        try {
            return JSON.parse(input);
        } catch {
            return input;
        }
    };

    return (
        <div className="sketch-fields-section">
            <div className="sketch-fields-title">Sketch Fields</div>
            {fields.map((key) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <label className="sketch-fields-label">{key}</label>
                    <input
                        type="text"
                        className="sketch-fields-input"
                        value={parseValue(values[key] ?? "")}
                        onChange={e => onChange(key, parseInput(e.target.value))}
                    />
                </div>
            ))}
        </div>
    );
}
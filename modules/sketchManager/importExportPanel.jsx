// --- ImportExportPanel: Import/Export buttons ---
export default function ImportExportPanel() {
    const [showEncoded, setShowEncoded] = React.useState(false);
    const [encodedBlob, setEncodedBlob] = React.useState('');
    const [encodedError, setEncodedError] = React.useState(null);

    const handleImportEncoded = () => {
        setEncodedError(null);
        try {
            const blob = JSON.parse(encodedBlob);
            window.amakit?.saveEncodedCredentials(blob);
            setEncodedBlob('');
            setShowEncoded(false);
        } catch (e) {
            setEncodedError(e.message || 'Invalid JSON');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={() => window.xemitter?.emit('remote:login')}>login</button>
                <button onClick={() => setShowEncoded(!showEncoded)}>
                    {showEncoded ? 'hide' : 'import encoded credentials'}
                </button>
                <button onClick={() => { /* TODO: import all logic */ }}>import all</button>
                <button onClick={() => { /* TODO: import single logic */ }}>import single</button>
                <button onClick={() => { /* TODO: export all logic */ }}>export all</button>
            </div>
            {showEncoded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea
                        placeholder="Paste JSON from: node scripts/encode-credentials.js"
                        value={encodedBlob}
                        onChange={(e) => setEncodedBlob(e.target.value)}
                        rows={6}
                        style={{ fontFamily: 'monospace', fontSize: 12 }}
                    />
                    <button onClick={handleImportEncoded}>save encoded credentials</button>
                    {encodedError && <span style={{ color: 'red' }}>{encodedError}</span>}
                </div>
            )}
        </div>
    );
}
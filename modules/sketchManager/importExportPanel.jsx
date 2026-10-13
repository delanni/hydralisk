// --- ImportExportPanel: Import/Export buttons ---
export default function ImportExportPanel() {
    const [showEncoded, setShowEncoded] = React.useState(false);
    const [encodedBlob, setEncodedBlob] = React.useState('');
    const [encodedError, setEncodedError] = React.useState(null);

    const handleImportEncoded = async () => {
        setEncodedError(null);
        try {
            const blob = JSON.parse(encodedBlob);
            await window.amakit?.saveEncodedCredentials(blob);
            setEncodedBlob('');
            setShowEncoded(false);
            if (window.hydraDialog?.alert) {
                window.hydraDialog.alert({
                    title: 'Credentials Saved',
                    message: 'Encrypted AWS credentials saved successfully. Click "Remote Login" to decrypt with your password.',
                });
            }
        } catch (e) {
            setEncodedError(e.message || 'Invalid JSON');
        }
    };

    const btnStyle = {
        background: '#313244',
        color: '#cdd6f4',
        border: '1px solid #45475a',
        padding: '8px 16px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.15s ease'
    };

    const primaryBtnStyle = {
        ...btnStyle,
        background: '#89b4fa',
        color: '#11111b',
        border: 'none',
        fontWeight: 600
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                    style={primaryBtnStyle}
                    onClick={() => window.xemitter?.emit('gallery:import')}
                    title="Import sketches from a JSON file or pasted text"
                >
                    📥 Import Sketches
                </button>
                <button
                    style={primaryBtnStyle}
                    onClick={() => window.xemitter?.emit('gallery:export', { altKey: true })}
                    title="Export sketches as JSON file & clipboard"
                >
                    📤 Export Sketches
                </button>
                <button
                    style={btnStyle}
                    onClick={() => window.xemitter?.emit('remote:login')}
                    title="Login to AWS DynamoDB remote draft sync"
                >
                    🔑 Remote Login
                </button>
                <button
                    style={btnStyle}
                    onClick={() => setShowEncoded(!showEncoded)}
                    title="Import pre-encoded encrypted credentials"
                >
                    {showEncoded ? '✕ Hide Credentials Form' : '🔐 Import Encrypted Credentials'}
                </button>
            </div>
            {showEncoded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#11111b', padding: 14, borderRadius: 8, border: '1px solid #313244' }}>
                    <div style={{ fontSize: 12, color: '#a6adc8' }}>
                        Paste encrypted credentials blob generated from <code>node scripts/encode-credentials.js</code>:
                    </div>
                    <textarea
                        placeholder='{ "credentialsCiphertext": "...", "salt": "...", "iv": "..." }'
                        value={encodedBlob}
                        onChange={(e) => setEncodedBlob(e.target.value)}
                        rows={6}
                        style={{
                            fontFamily: 'monospace',
                            fontSize: 12,
                            background: '#181825',
                            color: '#cdd6f4',
                            border: '1px solid #45475a',
                            borderRadius: 6,
                            padding: 8,
                            outline: 'none',
                            resize: 'vertical'
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                            style={primaryBtnStyle}
                            onClick={handleImportEncoded}
                        >
                            Save Credentials
                        </button>
                    </div>
                    {encodedError && <span style={{ color: '#f38ba8', fontSize: 12 }}>{encodedError}</span>}
                </div>
            )}
        </div>
    );
}
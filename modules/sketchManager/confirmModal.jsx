import React, { useState, useEffect, useRef } from 'react';

// --- ConfirmModal: Non-blocking custom modal dialog component ---
// Replaces window.confirm() and window.prompt() without freezing WebGL/Hydra animations.

export default function ConfirmModal({
    isOpen,
    title = 'Confirmation',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false,
    hasInput = false,
    defaultValue = '',
    placeholder = '',
    onConfirm,
    onCancel
}) {
    const [inputValue, setInputValue] = useState(defaultValue);
    const inputRef = useRef(null);

    useEffect(() => {
        setInputValue(defaultValue);
    }, [defaultValue, isOpen]);

    useEffect(() => {
        if (isOpen) {
            // Auto focus on input or confirm button
            setTimeout(() => {
                if (hasInput && inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            }, 50);
        }
    }, [isOpen, hasInput]);

    if (!isOpen) return null;

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onConfirm(hasInput ? inputValue : true);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
    };

    return (
        <div
            className="confirm-modal-overlay"
            onClick={onCancel}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                animation: 'confirmFadeIn 0.15s ease-out'
            }}
        >
            <div
                className="confirm-modal-card"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
                style={{
                    background: '#ffffff',
                    borderRadius: 10,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                    width: '100%',
                    maxWidth: 420,
                    padding: 20,
                    color: '#0f172a',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
            >
                {/* Dialog Title */}
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700, color: isDanger ? '#dc2626' : '#0f172a' }}>
                    {title}
                </h3>

                {/* Dialog Message */}
                {message && (
                    <div style={{ fontSize: 13, color: '#475569', marginBottom: hasInput ? 12 : 16, lineHeight: 1.5 }}>
                        {message}
                    </div>
                )}

                {/* Optional Text Input (Replacing window.prompt) */}
                {hasInput && (
                    <div style={{ marginBottom: 16 }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            placeholder={placeholder}
                            onChange={(e) => setInputValue(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #cbd5e1',
                                borderRadius: 6,
                                fontSize: 14,
                                boxSizing: 'border-box',
                                outline: 'none',
                                transition: 'border-color 0.15s'
                            }}
                        />
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            padding: '7px 16px',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => onConfirm(hasInput ? inputValue : true)}
                        style={{
                            background: isDanger ? '#dc2626' : '#3b82f6',
                            color: '#ffffff',
                            border: 'none',
                            padding: '7px 18px',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

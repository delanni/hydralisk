import React, { useState, useEffect, useRef } from 'react';

// --- ConfirmModal: Non-blocking custom modal dialog component ---
// Replaces window.confirm(), window.prompt(), and window.alert() without freezing WebGL/Hydra animations.

export default function ConfirmModal({
    isOpen,
    title = 'Confirmation',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false,
    isAlert = false,
    hasInput = false,
    inputType = 'text',
    defaultValue = '',
    placeholder = '',
    onConfirm,
    onCancel
}) {
    const [inputValue, setInputValue] = useState(defaultValue);
    const inputRef = useRef(null);
    const confirmBtnRef = useRef(null);

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
                } else if (confirmBtnRef.current) {
                    confirmBtnRef.current.focus();
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
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                backdropFilter: 'blur(6px)',
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
                    background: '#181825',
                    border: '1px solid #313244',
                    borderRadius: 12,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    width: '100%',
                    maxWidth: 420,
                    padding: 24,
                    color: '#cdd6f4',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    boxSizing: 'border-box'
                }}
            >
                {/* Dialog Title */}
                <h3 style={{ margin: '0 0 10px 0', fontSize: 16, fontWeight: 700, color: isDanger ? '#f38ba8' : '#cdd6f4' }}>
                    {title}
                </h3>

                {/* Dialog Message */}
                {message && (
                    <div style={{ fontSize: 13, color: '#a6adc8', marginBottom: hasInput ? 14 : 20, lineHeight: 1.5, wordBreak: 'break-word' }}>
                        {message}
                    </div>
                )}

                {/* Optional Text Input (Replacing window.prompt) */}
                {hasInput && (
                    <div style={{ marginBottom: 20 }}>
                        <input
                            ref={inputRef}
                            type={inputType || 'text'}
                            value={inputValue}
                            placeholder={placeholder}
                            onChange={(e) => setInputValue(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: '#11111b',
                                color: '#cdd6f4',
                                border: '1px solid #45475a',
                                borderRadius: 8,
                                fontSize: 14,
                                boxSizing: 'border-box',
                                outline: 'none',
                                transition: 'border-color 0.15s'
                            }}
                        />
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    {!isAlert && (
                        <button
                            onClick={onCancel}
                            style={{
                                background: '#313244',
                                color: '#cdd6f4',
                                border: '1px solid #45475a',
                                padding: '8px 18px',
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        ref={confirmBtnRef}
                        onClick={() => onConfirm(hasInput ? inputValue : true)}
                        style={{
                            background: isDanger ? '#f38ba8' : '#89b4fa',
                            color: '#11111b',
                            border: 'none',
                            padding: '8px 20px',
                            borderRadius: 8,
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


import React, { useState, useEffect, useRef } from 'react';
import './feedbackmodal.css';
import { feedbackDiagnosticService } from './feedbackService.js';

export default function FeedbackModal({ isOpen, onClose }) {
    const [category, setCategory] = useState('bug');
    const [rating, setRating] = useState(5);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [userName, setUserName] = useState('');
    const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
    const [showDiagPreview, setShowDiagPreview] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [copiedToast, setCopiedToast] = useState(false);
    const [diagPayload, setDiagPayload] = useState(null);

    const subjectInputRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const savedName = window.localStorage.getItem('hydralisk_user_handle') || '';
            setUserName(savedName);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSubmitted(false);
            setCopiedToast(false);
            const data = feedbackDiagnosticService.getDiagnosticData();
            setDiagPayload(data);

            setTimeout(() => {
                if (subjectInputRef.current) {
                    subjectInputRef.current.focus();
                }
            }, 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const categories = [
        { id: 'bug', label: '🐛 Bug Report' },
        { id: 'feature', label: '💡 Feature Request' },
        { id: 'crash', label: '💥 Crash / Blackout' },
        { id: 'general', label: '💬 General Feedback' }
    ];

    const ratingIcons = ['🐛', '⚡', '🎨', '💡', '❤️'];

    const getFullPayload = () => {
        return {
            category,
            rating,
            subject: subject || 'No Subject Provided',
            description: description || '',
            user: userName || 'Anonymous Hydralisk User',
            submittedAt: new Date().toISOString(),
            diagnostics: includeDiagnostics ? (diagPayload || feedbackDiagnosticService.getDiagnosticData()) : null
        };
    };

    const handleCopyPayload = () => {
        const payload = getFullPayload();
        const jsonStr = JSON.stringify(payload, null, 2);
        if (navigator.clipboard) {
            navigator.clipboard.writeText(jsonStr);
        }
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2500);
    };

    const handleExportJson = () => {
        const payload = getFullPayload();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
        const downloadAnchor = document.createElement('a');
        const filename = `hydralisk-report-${category}-${Date.now()}.json`;
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", filename);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (!description.trim() && !subject.trim()) {
            alert('Please provide a subject or description for your feedback.');
            return;
        }

        const payload = getFullPayload();
        feedbackDiagnosticService.saveFeedbackLocally(payload);

        if (typeof window !== 'undefined' && window.localStorage && userName) {
            window.localStorage.setItem('hydralisk_user_handle', userName);
        }

        if (typeof window !== 'undefined' && window.xemitter) {
            window.xemitter.emit('feedback:submitted', payload);
        }

        setSubmitted(true);
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div 
            className="feedback-modal-overlay" 
            onClick={handleOverlayClick}
            onKeyDown={handleKeyDown}
        >
            <div className="feedback-modal-card">
                {/* Modal Header */}
                <div className="feedback-modal-header">
                    <div className="feedback-modal-title">
                        <span>Hydralisk Feedback & Bug Report</span>
                        <span className="feedback-modal-badge">v0.0.1</span>
                    </div>
                    <button className="feedback-close-btn" onClick={onClose} title="Close (Esc)">
                        &times;
                    </button>
                </div>

                {submitted ? (
                    /* Success State */
                    <div className="feedback-success-card">
                        <div className="feedback-success-icon">🚀</div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#00f2fe' }}>
                            Thank You for Your Feedback!
                        </h3>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', maxWidth: 400, lineHeight: 1.5 }}>
                            Your report has been stored locally and emitted to the Hydralisk engine event bus.
                        </p>
                        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                            <button className="feedback-btn" onClick={handleExportJson}>
                                📥 Export .json Copy
                            </button>
                            <button className="feedback-btn primary" onClick={onClose}>
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Main Form */
                    <>
                        <div className="feedback-modal-body">
                            {/* Category Selector */}
                            <div className="feedback-field-group">
                                <label className="feedback-label">Report Category</label>
                                <div className="feedback-category-group">
                                    {categories.map((cat) => (
                                        <div
                                            key={cat.id}
                                            className={`feedback-cat-pill ${category === cat.id ? 'active' : ''}`}
                                            onClick={() => setCategory(cat.id)}
                                        >
                                            {cat.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Impression Rating */}
                            <div className="feedback-rating-container">
                                <span className="feedback-rating-label">Experience Rating:</span>
                                <div className="feedback-stars-row">
                                    {[1, 2, 3, 4, 5].map((val) => (
                                        <button
                                            key={val}
                                            type="button"
                                            className={`feedback-star-btn ${rating >= val ? 'selected' : ''}`}
                                            onClick={() => setRating(val)}
                                            title={`Score ${val}/5`}
                                        >
                                            {ratingIcons[val - 1]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* User Name & Subject */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                                <div className="feedback-field-group">
                                    <label className="feedback-label">Your Name / Handle</label>
                                    <input
                                        type="text"
                                        className="feedback-input"
                                        placeholder="e.g. dj_hydra"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                    />
                                </div>
                                <div className="feedback-field-group">
                                    <label className="feedback-label">Subject</label>
                                    <input
                                        ref={subjectInputRef}
                                        type="text"
                                        className="feedback-input"
                                        placeholder="Short summary of the issue or idea..."
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Message / Description */}
                            <div className="feedback-field-group">
                                <label className="feedback-label">Detailed Description</label>
                                <textarea
                                    className="feedback-textarea"
                                    placeholder="Describe what happened, steps to reproduce the bug, or details of your feature request..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                ></textarea>
                            </div>

                            {/* Diagnostics Checkbox */}
                            <div 
                                className="feedback-checkbox-wrapper"
                                onClick={() => setIncludeDiagnostics(!includeDiagnostics)}
                            >
                                <input
                                    type="checkbox"
                                    checked={includeDiagnostics}
                                    onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                                />
                                <span className="feedback-checkbox-text">
                                    Include system specs, WebGL renderer stats, and recent error logs
                                </span>
                            </div>

                            {/* Diagnostic Payload Preview Accordion */}
                            {includeDiagnostics && (
                                <div>
                                    <div 
                                        style={{ 
                                            display: 'flex', 
                                            justify: 'space-between', 
                                            alignItems: 'center', 
                                            fontSize: '0.75rem', 
                                            color: '#94a3b8', 
                                            cursor: 'pointer',
                                            padding: '2px 0'
                                        }}
                                        onClick={() => setShowDiagPreview(!showDiagPreview)}
                                    >
                                        <span>🔍 {showDiagPreview ? 'Hide Diagnostic JSON Payload' : 'View Diagnostic JSON Payload'}</span>
                                        <span>{showDiagPreview ? '▲' : '▼'}</span>
                                    </div>
                                    {showDiagPreview && (
                                        <div className="feedback-diag-box">
                                            {JSON.stringify(diagPayload || feedbackDiagnosticService.getDiagnosticData(), null, 2)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Action Bar */}
                        <div className="feedback-modal-actions">
                            <button className="feedback-btn" type="button" onClick={handleCopyPayload}>
                                📋 Copy JSON
                            </button>
                            <button className="feedback-btn" type="button" onClick={handleExportJson}>
                                📥 Export .json
                            </button>
                            <button className="feedback-btn primary" type="button" onClick={handleSubmit}>
                                🚀 Send Report
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Copy Toast Indicator */}
            {copiedToast && (
                <div className="feedback-toast-notification">
                    <span>✨ Diagnostic payload copied to clipboard!</span>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import FeedbackModal from './feedbackModal.jsx';
import { feedbackDiagnosticService } from './feedbackService.js';

function FeedbackHost() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = feedbackDiagnosticService.subscribe((openState) => {
            setIsOpen(openState);
        });

        const handleKeyDown = (e) => {
            // Hotkey: Cmd+Shift+F or Ctrl+Shift+F
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
                e.preventDefault();
                feedbackDiagnosticService.toggle();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            unsubscribe();
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <FeedbackModal
            isOpen={isOpen}
            onClose={() => feedbackDiagnosticService.close()}
        />
    );
}

export default class FeedbackManager {
    constructor() {
        this.service = feedbackDiagnosticService;
    }

    inject() {
        if (typeof document === 'undefined') return;

        let host = document.getElementById('hydra-feedback-app');
        if (!host) {
            host = document.createElement('div');
            host.id = 'hydra-feedback-app';
            document.body.appendChild(host);
        }

        ReactDOM.render(<FeedbackHost />, host);
        console.log('[FeedbackManager] Injected Feedback Modal Host');

        if (window.xemitter) {
            window.xemitter.on('feedback:open', () => this.service.open());
            window.xemitter.on('feedback:close', () => this.service.close());
            window.xemitter.on('feedback:toggle', () => this.service.toggle());
        }

        window.hydraFeedback = this.service;
    }

    open() {
        this.service.open();
    }

    close() {
        this.service.close();
    }

    toggle() {
        this.service.toggle();
    }
}

// Auto-register with HydraliskPlugins if present
if (typeof window !== 'undefined' && window.HydraliskPlugins) {
    window.HydraliskPlugins.register({
        id: 'feedback-modal',
        name: 'User Feedback & Bug Reporting Modal',
        init(app) {
            const manager = new FeedbackManager();
            setTimeout(() => manager.inject(), 150);
            app.expose('feedbackManager', manager);
        }
    });
}

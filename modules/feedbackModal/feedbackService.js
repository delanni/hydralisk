/**
 * Hydralisk Feedback & Diagnostic Service
 * Collects runtime diagnostics, WebGL stats, sketch details, and error logs for bug reporting.
 */

class FeedbackDiagnosticService {
    constructor() {
        this.errorBuffer = [];
        this.maxErrorBufferSize = 15;
        this.subscribers = new Set();
        this.isOpen = false;
        
        this.initErrorListeners();
    }

    initErrorListeners() {
        if (typeof window === 'undefined') return;

        // Listen for global uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            this.pushErrorLog({
                type: 'uncaught-error',
                message: event.message || String(event.error),
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error ? event.error.stack : null,
                timestamp: new Date().toISOString()
            });
        });

        // Listen for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.pushErrorLog({
                type: 'unhandled-rejection',
                message: event.reason ? (event.reason.message || String(event.reason)) : 'Unhandled Rejection',
                stack: event.reason ? event.reason.stack : null,
                timestamp: new Date().toISOString()
            });
        });

        // Optional: Intercept console.error without breaking original console behavior
        const origConsoleError = console.error;
        console.error = (...args) => {
            origConsoleError.apply(console, args);
            this.pushErrorLog({
                type: 'console-error',
                message: args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '),
                timestamp: new Date().toISOString()
            });
        };
    }

    pushErrorLog(logEntry) {
        this.errorBuffer.push(logEntry);
        if (this.errorBuffer.length > this.maxErrorBufferSize) {
            this.errorBuffer.shift();
        }
    }

    getWebGLInfo() {
        if (typeof document === 'undefined') return { renderer: 'Unknown (SSR)' };
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return { renderer: 'WebGL unsupported' };

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            return {
                vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
                renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
            };
        } catch (e) {
            return { renderer: 'Error probing WebGL: ' + e.message };
        }
    }

    getDiagnosticData() {
        const hydraCode = typeof window !== 'undefined' && window.editor && typeof window.editor.getValue === 'function'
            ? window.editor.getValue()
            : (window.currentSketchCode || null);

        const currentSketch = typeof window !== 'undefined' && window.mySketches && window.mySketches[window.sketchIdx]
            ? window.mySketches[window.sketchIdx]
            : null;

        const oblivionGuardState = typeof window !== 'undefined' && window.oblivionGuard
            ? {
                enabled: window.oblivionGuard.enabled !== false,
                consecutiveBlackouts: window.oblivionGuard.consecutiveBlackouts || 0,
                totalReverts: window.oblivionGuard.totalReverts || 0
            }
            : { status: 'not-initialized' };

        return {
            timestamp: new Date().toISOString(),
            app: {
                name: 'Hydralisk',
                version: '0.0.1',
                branch: 'add-feedback',
                url: typeof window !== 'undefined' ? window.location.href : ''
            },
            environment: {
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                screen: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
                viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
                devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
                platform: typeof navigator !== 'undefined' ? navigator.platform : ''
            },
            webgl: this.getWebGLInfo(),
            hydra: {
                bpm: typeof window !== 'undefined' ? window.bpm : 120,
                speed: typeof window !== 'undefined' ? window.speed : 1.0,
                sketchIdx: typeof window !== 'undefined' ? window.sketchIdx : 0,
                totalSketches: typeof window !== 'undefined' && window.mySketches ? window.mySketches.length : 0,
                currentSketchName: currentSketch ? (currentSketch.name || 'Untitled') : 'Unknown',
                codeSnippet: hydraCode ? (hydraCode.length > 500 ? hydraCode.substring(0, 500) + '...' : hydraCode) : null
            },
            oblivionGuard: oblivionGuardState,
            recentLogs: [...this.errorBuffer]
        };
    }

    saveFeedbackLocally(feedbackPayload) {
        if (typeof window === 'undefined' || !window.localStorage) return false;
        try {
            const key = 'hydralisk_feedback_logs';
            const existing = JSON.parse(window.localStorage.getItem(key) || '[]');
            existing.unshift(feedbackPayload);
            // Limit stored feedback logs locally to 50
            if (existing.length > 50) existing.pop();
            window.localStorage.setItem(key, JSON.stringify(existing));
            return true;
        } catch (err) {
            console.error('[FeedbackService] Error saving feedback locally:', err);
            return false;
        }
    }

    subscribe(listener) {
        this.subscribers.add(listener);
        return () => this.subscribers.delete(listener);
    }

    open() {
        this.isOpen = true;
        this.notify();
    }

    close() {
        this.isOpen = false;
        this.notify();
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.notify();
    }

    notify() {
        for (const listener of this.subscribers) {
            try {
                listener(this.isOpen);
            } catch (e) {
                console.error('[FeedbackService] Listener error:', e);
            }
        }
    }
}

export const feedbackDiagnosticService = new FeedbackDiagnosticService();

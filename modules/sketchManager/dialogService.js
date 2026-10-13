// Singleton promise-based dialog service to trigger non-blocking confirm/prompt/alert modals anywhere in the app

class DialogService {
    constructor() {
        this.listeners = [];
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Show non-blocking confirmation dialog
     * @param {string|object} optionsOrMessage
     * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
     */
    confirm(optionsOrMessage = {}) {
        const opts = typeof optionsOrMessage === 'string'
            ? { message: optionsOrMessage }
            : (optionsOrMessage || {});

        const {
            title = 'Confirm Action',
            message = 'Are you sure you want to proceed?',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            isDanger = false
        } = opts;

        return new Promise((resolve) => {
            const config = {
                isOpen: true,
                title,
                message,
                confirmText,
                cancelText,
                isDanger,
                hasInput: false,
                isAlert: false,
                resolve
            };
            this._dispatch(config);
        });
    }

    /**
     * Show non-blocking input prompt dialog
     * @param {string|object} optionsOrMessage
     * @param {string} [defaultValue]
     * @returns {Promise<string|null>} Resolves to string value if confirmed, null if cancelled
     */
    prompt(optionsOrMessage = {}, defaultValue = '') {
        const opts = typeof optionsOrMessage === 'string'
            ? { message: optionsOrMessage, defaultValue }
            : (optionsOrMessage || {});

        const {
            title = 'Enter Value',
            message = '',
            defaultValue: defVal = defaultValue || '',
            placeholder = '',
            confirmText = 'OK',
            cancelText = 'Cancel',
            inputType = 'text'
        } = opts;

        return new Promise((resolve) => {
            const config = {
                isOpen: true,
                title,
                message,
                confirmText,
                cancelText,
                isDanger: false,
                hasInput: true,
                isAlert: false,
                inputType,
                defaultValue: defVal,
                placeholder,
                resolve
            };
            this._dispatch(config);
        });
    }

    /**
     * Show non-blocking alert dialog
     * @param {string|object} optionsOrMessage
     * @param {string} [title]
     * @returns {Promise<boolean>} Resolves to true when acknowledged
     */
    alert(optionsOrMessage = {}, title = 'Notice') {
        const opts = typeof optionsOrMessage === 'string'
            ? { message: optionsOrMessage, title }
            : (optionsOrMessage || {});

        const {
            title: t = title || 'Notice',
            message = '',
            confirmText = 'OK'
        } = opts;

        return new Promise((resolve) => {
            const config = {
                isOpen: true,
                title: t,
                message,
                confirmText,
                cancelText: '',
                isDanger: false,
                hasInput: false,
                isAlert: true,
                resolve
            };
            this._dispatch(config);
        });
    }

    _dispatch(config) {
        if (this.listeners.length > 0) {
            this.listeners.forEach(l => l(config));
        } else if (typeof document !== 'undefined') {
            this._renderDomFallback(config);
        } else {
            config.resolve(config.hasInput ? null : false);
        }
    }

    _renderDomFallback(config) {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.7);backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;animation:confirmFadeIn 0.15s ease-out;';

        const card = document.createElement('div');
        card.className = 'confirm-modal-card';
        card.style.cssText = 'background:#181825;border:1px solid #313244;border-radius:12px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.7);width:100%;maxWidth:420px;padding:24px;color:#cdd6f4;font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box;';

        const titleEl = document.createElement('h3');
        titleEl.style.cssText = `margin:0 0 10px 0;font-size:16px;font-weight:700;color:${config.isDanger ? '#f38ba8' : '#cdd6f4'};`;
        titleEl.textContent = config.title;
        card.appendChild(titleEl);

        if (config.message) {
            const msgEl = document.createElement('div');
            msgEl.style.cssText = `font-size:13px;color:#a6adc8;margin-bottom:${config.hasInput ? '14px' : '20px'};line-height:1.5;word-break:break-word;`;
            msgEl.textContent = config.message;
            card.appendChild(msgEl);
        }

        let inputEl = null;
        if (config.hasInput) {
            inputEl = document.createElement('input');
            inputEl.type = config.inputType || 'text';
            inputEl.value = config.defaultValue || '';
            inputEl.placeholder = config.placeholder || '';
            inputEl.style.cssText = 'width:100%;padding:10px 12px;background:#11111b;color:#cdd6f4;border:1px solid #45475a;border-radius:8px;font-size:14px;box-sizing:border-box;outline:none;margin-bottom:20px;';
            card.appendChild(inputEl);
        }

        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;';

        const cleanup = () => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        };

        if (!config.isAlert) {
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = config.cancelText || 'Cancel';
            cancelBtn.style.cssText = 'background:#313244;color:#cdd6f4;border:1px solid #45475a;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;';
            cancelBtn.onclick = () => {
                cleanup();
                config.resolve(config.hasInput ? null : false);
            };
            btnRow.appendChild(cancelBtn);
        }

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = config.confirmText || 'OK';
        confirmBtn.style.cssText = `background:${config.isDanger ? '#f38ba8' : '#89b4fa'};color:#11111b;border:none;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;`;
        confirmBtn.onclick = () => {
            const val = config.hasInput ? (inputEl ? inputEl.value : '') : true;
            cleanup();
            config.resolve(val);
        };
        btnRow.appendChild(confirmBtn);
        card.appendChild(btnRow);

        overlay.onclick = (e) => {
            if (e.target === overlay) {
                cleanup();
                config.resolve(config.isAlert ? true : (config.hasInput ? null : false));
            }
        };

        overlay.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const val = config.hasInput ? (inputEl ? inputEl.value : '') : true;
                cleanup();
                config.resolve(val);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cleanup();
                config.resolve(config.isAlert ? true : (config.hasInput ? null : false));
            }
        };

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        setTimeout(() => {
            if (inputEl) {
                inputEl.focus();
                inputEl.select();
            } else {
                confirmBtn.focus();
            }
        }, 50);
    }
}

export const dialogService = new DialogService();

if (typeof window !== 'undefined') {
    window.hydraDialog = dialogService;
}


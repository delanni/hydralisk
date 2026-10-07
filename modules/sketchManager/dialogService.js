// Singleton promise-based dialog service to trigger non-blocking confirm/prompt modals anywhere in the app

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
     * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
     */
    confirm({
        title = 'Confirm Action',
        message = 'Are you sure you want to proceed?',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        isDanger = false
    } = {}) {
        return new Promise((resolve) => {
            const config = {
                isOpen: true,
                title,
                message,
                confirmText,
                cancelText,
                isDanger,
                hasInput: false,
                resolve
            };
            this.listeners.forEach(l => l(config));
        });
    }

    /**
     * Show non-blocking input prompt dialog
     * @returns {Promise<string|null>} Resolves to string value if confirmed, null if cancelled
     */
    prompt({
        title = 'Enter Value',
        message = '',
        defaultValue = '',
        placeholder = '',
        confirmText = 'OK',
        cancelText = 'Cancel'
    } = {}) {
        return new Promise((resolve) => {
            const config = {
                isOpen: true,
                title,
                message,
                confirmText,
                cancelText,
                isDanger: false,
                hasInput: true,
                defaultValue,
                placeholder,
                resolve
            };
            this.listeners.forEach(l => l(config));
        });
    }
}

export const dialogService = new DialogService();

if (typeof window !== 'undefined') {
    window.hydraDialog = dialogService;
}


const BACKEND_URL = "http://localhost:8000";

type LogLevel = 'info' | 'error' | 'warning' | 'debug';

interface LogContext {
    [key: string]: any;
}

class Logger {
    private async sendLog(level: LogLevel, message: string, context?: LogContext) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

        // Always log to console for immediate feedback/fallback
        if (level === 'error') {
            console.error(prefix, message, context || '');
        } else if (level === 'warning') {
            console.warn(prefix, message, context || '');
        } else {
            console.log(prefix, message, context || '');
        }

        try {
            const isServer = typeof window === 'undefined';

            const payload = {
                level,
                message,
                context: {
                    ...context,
                    source: isServer ? 'frontend-server' : 'frontend-client',
                    userAgent: isServer ? 'Server' : navigator.userAgent,
                    url: isServer ? undefined : window.location.href,
                },
            };

            let url = '/api/logs';
            if (isServer) {
                // On server, send directly to backend to avoid needing absolute URL for local API route
                url = `${BACKEND_URL}/v1/logs/`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok && isServer) {
                // Only warn on server to avoid cluttering browser console if network is down
                console.warn(`Failed to send log to backend: ${response.status}`);
            }

        } catch (err) {
            // Fail silently to avoid interrupting user flow, but log to console
            console.error('Logger failed to send to backend:', err);
        }
    }

    info(message: string, context?: LogContext) {
        this.sendLog('info', message, context);
    }

    error(message: string, context?: LogContext) {
        this.sendLog('error', message, context);
    }

    warn(message: string, context?: LogContext) {
        this.sendLog('warning', message, context);
    }

    debug(message: string, context?: LogContext) {
        this.sendLog('debug', message, context);
    }
}

export const logger = new Logger();

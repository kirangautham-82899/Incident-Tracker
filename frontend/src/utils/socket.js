import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000').replace(/\/$/, '');
export const SOCKET_ENABLED = import.meta.env.VITE_ENABLE_SOCKET !== 'false';

/**
 * Single shared Socket.IO connection.
 * Listeners registered with on() survive reconnects (e.g. after login/logout),
 * because they are re-attached to every new socket instance.
 */
class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map(); // event -> Set(callback)
        this.token = undefined;
    }

    connect(token = localStorage.getItem('token')) {
        // Serverless API hosts (e.g. Vercel) cannot keep WebSocket connections
        if (!SOCKET_ENABLED) return null;
        if (this.socket && this.token === token) {
            return this.socket;
        }
        if (this.socket) {
            this.socket.disconnect();
        }

        this.token = token;
        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            auth: token ? { token } : {},
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 30000
        });

        for (const [event, callbacks] of this.listeners) {
            callbacks.forEach(cb => this.socket.on(event, cb));
        }

        this.socket.on('connect_error', (error) => {
            console.warn('Socket connection error:', error.message);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.token = undefined;
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event).add(callback);
        this.socket?.on(event, callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        this.listeners.get(event)?.delete(callback);
        this.socket?.off(event, callback);
    }

    emit(event, data) {
        this.socket?.emit(event, data);
    }

    get connected() {
        return Boolean(this.socket?.connected);
    }
}

const socketService = new SocketService();

export default socketService;

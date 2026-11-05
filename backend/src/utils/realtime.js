import jwt from 'jsonwebtoken';
import { findUserById } from '../db/users.js';
import { STAFF_ROLES } from '../config/constants.js';
import chatbot from './chatbot.js';

export const STAFF_ROOM = 'staff';

/**
 * Broadcast an incident event.
 * Staff receive the full document (internal notes, reporter contact);
 * everyone else receives the public view.
 */
export const emitIncidentEvent = (req, event, incident, { staffOnly = false } = {}) => {
    const io = req.app.get('io');
    if (!io || !incident) return;

    const full = incident;
    io.to(STAFF_ROOM).emit(event, full);

    if (staffOnly) return;

    const publicView = { ...full };
    delete publicView.adminNotes;
    if (publicView.reporter) {
        publicView.reporter = { ...publicView.reporter };
        delete publicView.reporter.contact;
    }
    io.except(STAFF_ROOM).emit(event, publicView);
};

const MAX_CHAT_LENGTH = 500;
const CHAT_HISTORY_SIZE = 50;
const chatHistory = [];

const pushChat = (io, message) => {
    chatHistory.push(message);
    if (chatHistory.length > CHAT_HISTORY_SIZE) chatHistory.shift();
    io.emit('chat_message', message);
};

/**
 * Wire up Socket.IO: optional JWT auth on handshake, staff room,
 * per-incident rooms (for live comments) and the community chat.
 */
export const setupSocket = (io) => {
    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;
        socket.data.user = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await findUserById(decoded.id);
                if (user && user.is_active) {
                    socket.data.user = { _id: user.id, name: user.name, role: user.role };
                }
            } catch {
                // Invalid token: continue as guest
            }
        }
        next();
    });

    io.on('connection', (socket) => {
        const user = socket.data.user;
        if (user && STAFF_ROLES.includes(user.role)) {
            socket.join(STAFF_ROOM);
        }

        socket.emit('chat_history', chatHistory);
        socket.on('get_chat_history', () => socket.emit('chat_history', chatHistory));

        socket.on('join_incident', (incidentId) => {
            if (typeof incidentId === 'string') socket.join(`incident_${incidentId}`);
        });

        socket.on('leave_incident', (incidentId) => {
            if (typeof incidentId === 'string') socket.leave(`incident_${incidentId}`);
        });

        // Community chat: only logged-in users can post. Sender identity comes
        // from the verified token, never from the client payload.
        socket.on('chat_message', (payload) => {
            if (!user) {
                socket.emit('chat_error', 'Please log in to use the chat');
                return;
            }
            const text = String(payload?.text || '').trim().slice(0, MAX_CHAT_LENGTH);
            if (!text) return;

            const message = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                text,
                sender: { _id: user._id, name: user.name, role: user.role },
                timestamp: new Date().toISOString()
            };
            pushChat(io, message);

            if (chatbot.shouldRespond(text, user.role)) {
                setTimeout(() => {
                    pushChat(io, chatbot.createBotMessage(chatbot.generateResponse(text)));
                }, 800 + Math.random() * 1200);
            }
        });
    });
};

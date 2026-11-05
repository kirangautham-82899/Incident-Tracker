import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { MessageCircle, X, ArrowUp, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import socketService from '../../utils/socket';
import { IconButton, RoleTag, cx } from '../ui';
import { EASE } from '../ui/motion';
import { sameId } from '../../utils/helpers';

/**
 * Community chat. Messages are broadcast by the server (which stamps the
 * sender from the login token), so each message is rendered exactly once.
 */
const LiveChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);
    const visibleRef = useRef(false);
    const { user, isAuthenticated } = useAuthStore();

    useEffect(() => {
        visibleRef.current = isOpen && !isMinimized;
    }, [isOpen, isMinimized]);

    useEffect(() => {
        const offHistory = socketService.on('chat_history', (history) => setMessages(history || []));
        const offMessage = socketService.on('chat_message', (message) => {
            setMessages(prev => (prev.some(m => m.id === message.id) ? prev : [...prev, message].slice(-100)));
            if (!visibleRef.current) setUnreadCount(c => c + 1);
        });
        const offError = socketService.on('chat_error', (msg) => toast.error(msg));
        // The connection-time history may have arrived before this component mounted
        socketService.emit('get_chat_history');
        return () => {
            offHistory();
            offMessage();
            offError();
        };
    }, []);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isMinimized]);

    const openChat = () => {
        setIsOpen(true);
        setIsMinimized(false);
        setUnreadCount(0);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        const text = newMessage.trim();
        if (!text) return;
        if (!socketService.connected) {
            toast.error('Chat is offline. Trying to reconnect...');
            return;
        }
        socketService.emit('chat_message', { text });
        setNewMessage('');
    };

    const visible = isOpen && !isMinimized;

    return (
        <div className="fixed bottom-5 right-5 z-[1200] flex flex-col items-end gap-3">
            <AnimatePresence>
                {visible && (
                    <motion.section
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.97 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="flex h-[min(520px,75vh)] w-[min(380px,calc(100vw-2.5rem))] origin-bottom-right flex-col overflow-hidden rounded-3xl bg-paper shadow-[0_30px_80px_-30px_rgba(22,22,26,0.5)] ring-1 ring-line"
                        aria-label="Community chat"
                    >
                        <header className="flex items-center justify-between border-b border-line px-5 py-4">
                            <div>
                                <h3 className="font-semibold tracking-tight">Community chat</h3>
                                <p className="flex items-center gap-1.5 text-[12px] text-ink-muted">
                                    <span className={cx('h-1.5 w-1.5 rounded-full', socketService.connected ? 'bg-sev-low' : 'bg-ink-faint')} />
                                    {socketService.connected ? 'Connected' : 'Reconnecting…'} · ask a question or mention @bot
                                </p>
                            </div>
                            <IconButton label="Close chat" onClick={() => setIsMinimized(true)}><Minus className="h-4 w-4" /></IconButton>
                        </header>

                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                            {messages.length === 0 ? (
                                <p className="py-16 text-center text-sm text-ink-muted">No messages yet. Say hello.</p>
                            ) : (
                                messages.map((msg) => {
                                    const isOwn = sameId(msg.sender?._id, user);
                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.25, ease: EASE }}
                                            className={cx('flex flex-col', isOwn ? 'items-end' : 'items-start')}
                                        >
                                            {!isOwn && (
                                                <div className="mb-1 flex items-center gap-2 text-[12px]">
                                                    <span className="font-medium">{msg.sender?.name}</span>
                                                    <RoleTag role={msg.sender?.role} />
                                                </div>
                                            )}
                                            <p className={cx('max-w-[85%] break-words rounded-2xl px-4 py-2 text-[14px] leading-relaxed',
                                                isOwn ? 'rounded-br-md bg-ink text-paper' : 'rounded-bl-md bg-paper-deep text-ink')}>
                                                {msg.text}
                                            </p>
                                            <span className="mt-1 text-[11px] text-ink-faint">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </motion.div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="border-t border-line p-3">
                            {isAuthenticated ? (
                                <form onSubmit={handleSendMessage} className="relative">
                                    <input
                                        value={newMessage}
                                        maxLength={500}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Message…"
                                        aria-label="Chat message"
                                        className="field rounded-full py-2.5 pl-4 pr-12"
                                    />
                                    <button type="submit" disabled={!newMessage.trim()} aria-label="Send"
                                        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-paper transition-all disabled:opacity-20">
                                        <ArrowUp className="h-4 w-4" />
                                    </button>
                                </form>
                            ) : (
                                <p className="py-2 text-center text-sm text-ink-muted">
                                    <Link to="/login" className="link-underline font-medium text-ink">Log in</Link> to chat
                                </p>
                            )}
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (visible ? setIsMinimized(true) : openChat())}
                aria-label={visible ? 'Close community chat' : 'Open community chat'}
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper shadow-[0_16px_40px_-12px_rgba(22,22,26,0.6)]"
            >
                {visible ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                {!visible && unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-signal px-1 text-[11px] font-semibold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </motion.button>
        </div>
    );
};

export default LiveChat;

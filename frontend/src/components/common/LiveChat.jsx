import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import socketService from '../../utils/socket';
import { ROLE_BADGE } from '../../utils/constants';
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

    if (!isOpen) {
        return (
            <button
                onClick={openChat}
                aria-label="Open community chat"
                className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full shadow-2xl transition-transform hover:scale-110"
            >
                <MessageCircle className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className={`fixed bottom-4 right-4 left-4 sm:left-auto z-50 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col ${isMinimized ? 'sm:w-80' : 'sm:w-96 h-[500px] max-h-[80vh]'}`}>
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-white">Community Chat</h3>
                    <span className={`w-2 h-2 rounded-full ${socketService.connected ? 'bg-green-500' : 'bg-gray-500'}`} />
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => (isMinimized ? openChat() : setIsMinimized(true))} aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'} className="p-1.5 hover:bg-white/10 rounded-lg">
                        <Minimize2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button onClick={() => setIsOpen(false)} aria-label="Close chat" className="p-1.5 hover:bg-white/10 rounded-lg">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 ? (
                            <div className="text-center py-12">
                                <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">No messages yet</p>
                                <p className="text-gray-500 text-xs mt-1">Ask a question. The assistant answers questions, or mention @bot.</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isOwn = sameId(msg.sender?._id, user);
                                return (
                                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div className="max-w-[80%]">
                                            <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
                                                <span className="text-xs font-bold text-gray-400">{isOwn ? 'You' : msg.sender?.name}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${ROLE_BADGE[msg.sender?.role] || ROLE_BADGE.citizen}`}>
                                                    {msg.sender?.role === 'bot' ? 'assistant' : msg.sender?.role}
                                                </span>
                                            </div>
                                            <div className={`px-4 py-2 rounded-2xl ${isOwn ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-gray-200 rounded-tl-none'}`}>
                                                <p className="text-sm break-words">{msg.text}</p>
                                            </div>
                                            <span className="text-[11px] text-gray-500 mt-1 block">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-white/10">
                        {isAuthenticated ? (
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    maxLength={500}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    aria-label="Chat message"
                                    className="flex-1 px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 outline-none text-sm"
                                />
                                <button type="submit" disabled={!newMessage.trim()} aria-label="Send" className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-xl">
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        ) : (
                            <p className="text-center text-xs text-gray-400">
                                <Link to="/login" className="text-blue-400 hover:underline">Log in</Link> to join the chat
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default LiveChat;

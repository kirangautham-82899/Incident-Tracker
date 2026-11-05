import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, MessageCircle, Trash2 } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import api, { getErrorMessage } from '../../utils/api';
import socketService from '../../utils/socket';
import { ROLE_BADGE } from '../../utils/constants';
import { formatRelativeTime, sameId } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CommentsSection = ({ incidentId }) => {
    const { user, isAuthenticated } = useAuthStore();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setIsFetching(true);
        api.get(`/incidents/${incidentId}/comments`)
            .then(res => { if (!cancelled) setComments(res.data.data || []); })
            .catch(() => { if (!cancelled) setComments([]); })
            .finally(() => { if (!cancelled) setIsFetching(false); });

        // Live comments for this incident
        socketService.emit('join_incident', incidentId);
        const offAdded = socketService.on('comment_added', (comment) => {
            if (comment.incidentId !== incidentId) return;
            setComments(prev => (prev.some(c => c._id === comment._id) ? prev : [comment, ...prev]));
        });
        const offDeleted = socketService.on('comment_deleted', ({ _id }) => {
            setComments(prev => prev.filter(c => c._id !== _id));
        });

        return () => {
            cancelled = true;
            socketService.emit('leave_incident', incidentId);
            offAdded();
            offDeleted();
        };
    }, [incidentId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSending(true);
        try {
            const response = await api.post(`/incidents/${incidentId}/comments`, { content: newComment.trim() });
            const comment = response.data.data;
            setComments(prev => (prev.some(c => c._id === comment._id) ? prev : [comment, ...prev]));
            setNewComment('');
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to add comment'));
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async (commentId) => {
        try {
            await api.delete(`/comments/${commentId}`);
            setComments(prev => prev.filter(c => c._id !== commentId));
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to delete comment'));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
                <MessageCircle className="w-5 h-5" />
                <h3 className="text-lg font-bold">Comments ({comments.length})</h3>
            </div>

            {isAuthenticated ? (
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        maxLength={500}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add an update or ask a question..."
                        className="flex-1 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={isSending || !newComment.trim()}
                        aria-label="Post comment"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-all flex items-center gap-2 text-sm font-bold"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            ) : (
                <div className="p-3 rounded-xl bg-slate-900/50 border border-white/10 text-center text-sm text-gray-400">
                    <Link to="/login" className="text-blue-400 hover:underline">Log in</Link> to add comments
                </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {isFetching ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Loading comments...</div>
                ) : comments.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-sm">
                        No comments yet. Be the first to comment!
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment._id} className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
                            <div className="flex items-start justify-between mb-2 gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                                        {comment.userName?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-bold text-white truncate">{comment.userName}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${ROLE_BADGE[comment.userRole] || ROLE_BADGE.citizen}`}>
                                                {comment.userRole}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500">{formatRelativeTime(comment.createdAt)}</span>
                                    </div>
                                </div>
                                {(sameId(comment.userId, user) || user?.role === 'admin') && (
                                    <button
                                        onClick={() => handleDelete(comment._id)}
                                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete comment"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed break-words">{comment.content}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CommentsSection;

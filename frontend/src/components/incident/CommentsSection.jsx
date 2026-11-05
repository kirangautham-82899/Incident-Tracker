import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import api, { getErrorMessage } from '../../utils/api';
import socketService from '../../utils/socket';
import { formatRelativeTime, sameId } from '../../utils/helpers';
import { RoleTag } from '../ui';
import { EASE } from '../ui/motion';

const CommentsSection = ({ incidentId }) => {
    const { user, isAuthenticated } = useAuthStore();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        let cancelled = false;
        api.get(`/incidents/${incidentId}/comments`)
            .then(res => { if (!cancelled) setComments(res.data.data || []); })
            .catch(() => { if (!cancelled) setComments([]); })
            .finally(() => { if (!cancelled) setIsFetching(false); });

        // Live comments (when real-time is available)
        socketService.emit('join_incident', incidentId);
        const offAdded = socketService.on('comment_added', (comment) => {
            if (comment.incidentId !== incidentId) return;
            setComments(prev => (prev.some(c => c._id === comment._id) ? prev : [comment, ...prev]));
        });
        const offDeleted = socketService.on('comment_deleted', ({ _id }) => setComments(prev => prev.filter(c => c._id !== _id)));

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
        <section>
            <h3 className="eyebrow mb-5">Updates & comments · {comments.length}</h3>

            {isAuthenticated ? (
                <form onSubmit={handleSubmit} className="relative mb-2">
                    <input
                        type="text"
                        value={newComment}
                        maxLength={500}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add an update or ask a question…"
                        aria-label="Comment"
                        className="field rounded-full py-3 pl-5 pr-14"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={isSending || !newComment.trim()}
                        aria-label="Post comment"
                        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-paper transition-all hover:scale-105 disabled:scale-90 disabled:opacity-20"
                    >
                        <ArrowUp className="h-4 w-4" />
                    </button>
                </form>
            ) : (
                <p className="mb-2 text-sm text-ink-muted">
                    <Link to="/login" className="link-underline font-medium text-ink">Log in</Link> to post an update.
                </p>
            )}

            {isFetching ? (
                <p className="py-6 text-sm text-ink-muted">Loading comments…</p>
            ) : comments.length === 0 ? (
                <p className="py-6 text-sm text-ink-muted">No updates yet.</p>
            ) : (
                <ul>
                    <AnimatePresence initial={false}>
                        {comments.map((comment) => (
                            <motion.li
                                key={comment._id}
                                layout
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.35, ease: EASE }}
                                className="group flex gap-3 border-b border-line py-4"
                            >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-deep font-display text-sm font-semibold text-ink-soft">
                                    {comment.userName?.charAt(0).toUpperCase()}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-semibold">{comment.userName}</span>
                                        <RoleTag role={comment.userRole} />
                                        <span className="text-[12px] text-ink-faint">{formatRelativeTime(comment.createdAt)}</span>
                                    </div>
                                    <p className="mt-1 break-words text-[15px] leading-relaxed text-ink-soft">{comment.content}</p>
                                </div>
                                {(sameId(comment.userId, user) || user?.role === 'admin') && (
                                    <button
                                        onClick={() => handleDelete(comment._id)}
                                        className="self-start rounded-full p-1.5 text-ink-faint opacity-0 transition-opacity hover:text-sev-critical focus:opacity-100 group-hover:opacity-100"
                                        aria-label="Delete comment"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
            )}
        </section>
    );
};

export default CommentsSection;

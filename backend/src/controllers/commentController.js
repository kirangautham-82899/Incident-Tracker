import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { listComments, createComment, findCommentById, deleteCommentRow } from '../db/comments.js';
import { findIncidentById } from '../db/incidents.js';

const emitToIncident = (req, incidentId, event, payload) => {
    const io = req.app.get('io');
    if (io) io.to(`incident_${incidentId}`).emit(event, payload);
};

// @desc    Get comments for an incident
// @route   GET /api/incidents/:incidentId/comments
// @access  Public
export const getComments = asyncHandler(async (req, res) => {
    const comments = await listComments(req.params.incidentId);
    res.status(200).json({ success: true, count: comments.length, data: comments });
});

// @desc    Add comment to incident
// @route   POST /api/incidents/:incidentId/comments
// @access  Private
export const addComment = asyncHandler(async (req, res) => {
    const content = String(req.body.content || '').trim();
    if (!content) throw new ApiError(400, 'Comment cannot be empty');
    if (content.length > 500) throw new ApiError(400, 'Comment cannot exceed 500 characters');

    const incident = await findIncidentById(req.params.incidentId);
    if (!incident) throw new ApiError(404, 'Incident not found');

    const comment = await createComment({ incidentId: incident._id, user: req.user, content });
    emitToIncident(req, incident._id, 'comment_added', comment);

    res.status(201).json({ success: true, data: comment });
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private (Own comment or Admin)
export const deleteComment = asyncHandler(async (req, res) => {
    const comment = await findCommentById(req.params.id);
    if (!comment) throw new ApiError(404, 'Comment not found');

    if (comment.userId !== req.user._id && req.user.role !== 'admin') {
        throw new ApiError(403, 'Not authorized to delete this comment');
    }

    await deleteCommentRow(comment._id);
    emitToIncident(req, comment.incidentId, 'comment_deleted', { _id: comment._id, incidentId: comment.incidentId });

    res.status(200).json({ success: true, data: { _id: comment._id } });
});

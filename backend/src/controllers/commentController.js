import Comment from '../models/Comment.js';
import Incident from '../models/Incident.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const emitToIncident = (req, incidentId, event, payload) => {
    const io = req.app.get('io');
    if (io) io.to(`incident_${incidentId}`).emit(event, payload);
};

// @desc    Get comments for an incident
// @route   GET /api/incidents/:incidentId/comments
// @access  Public
export const getComments = asyncHandler(async (req, res) => {
    const comments = await Comment.find({ incidentId: req.params.incidentId })
        .sort('-createdAt')
        .limit(100);

    res.status(200).json({
        success: true,
        count: comments.length,
        data: comments
    });
});

// @desc    Add comment to incident
// @route   POST /api/incidents/:incidentId/comments
// @access  Private
export const addComment = asyncHandler(async (req, res) => {
    const content = String(req.body.content || '').trim();
    if (!content) {
        throw new ApiError(400, 'Comment cannot be empty');
    }

    const incident = await Incident.findById(req.params.incidentId);
    if (!incident) {
        throw new ApiError(404, 'Incident not found');
    }

    const comment = await Comment.create({
        incidentId: incident._id,
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        content
    });

    emitToIncident(req, incident._id, 'comment_added', comment);

    res.status(201).json({
        success: true,
        data: comment
    });
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private (Own comment or Admin)
export const deleteComment = asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        throw new ApiError(404, 'Comment not found');
    }

    if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, 'Not authorized to delete this comment');
    }

    await comment.deleteOne();
    emitToIncident(req, comment.incidentId, 'comment_deleted', { _id: comment._id, incidentId: comment.incidentId });

    res.status(200).json({
        success: true,
        data: { _id: comment._id }
    });
});

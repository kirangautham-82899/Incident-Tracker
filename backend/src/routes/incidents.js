import express from 'express';
import {
    createIncident,
    getIncidents,
    getIncident,
    updateIncident,
    verifyIncident,
    getNearbyIncidents,
    addAdminNote,
    deleteIncident
} from '../controllers/incidentController.js';
import { getComments, addComment } from '../controllers/commentController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes (a token, if sent, unlocks staff-only fields and "mine" filters)
router.post('/', optionalAuth, createIncident);
router.get('/', optionalAuth, getIncidents);
router.get('/nearby', optionalAuth, getNearbyIncidents);
router.get('/:id', optionalAuth, getIncident);

// Protected routes
router.put('/:id', protect, authorize('admin', 'responder'), updateIncident);
router.post('/:id/verify', protect, verifyIncident);
router.post('/:id/notes', protect, authorize('admin', 'responder'), addAdminNote);
router.delete('/:id', protect, authorize('admin'), deleteIncident);

// Comment routes
router.get('/:incidentId/comments', getComments);
router.post('/:incidentId/comments', protect, addComment);

export default router;

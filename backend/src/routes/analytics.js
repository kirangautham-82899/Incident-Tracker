import express from 'express';
import { getStats, getTrends, getHeatmap } from '../controllers/analyticsController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', optionalAuth, getStats);
router.get('/trends', getTrends);
router.get('/heatmap', getHeatmap);

export default router;

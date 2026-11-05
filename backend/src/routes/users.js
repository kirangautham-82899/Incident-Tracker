import express from 'express';
import { getResponders, getUsers, updateUser } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/responders', protect, authorize('admin', 'responder'), getResponders);
router.get('/', protect, authorize('admin'), getUsers);
router.put('/:id', protect, authorize('admin'), updateUser);

export default router;

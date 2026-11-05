import express from 'express';
import { register, login, getMe, updateMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { limits } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/register', limits.register, register);
router.post('/login', limits.login, login);
router.get('/me', protect, getMe);
router.put('/me', protect, limits.profile, updateMe);

export default router;

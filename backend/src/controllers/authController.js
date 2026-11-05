import jwt from 'jsonwebtoken';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import {
    createUser,
    findUserByEmail,
    findUserById,
    checkPassword,
    updateUser,
    toPublicUser
} from '../db/users.js';

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// @desc    Register new user (always a citizen; staff roles are granted by an admin)
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, 'Please provide name, email and password');
    }
    if (await findUserByEmail(email)) {
        throw new ApiError(400, 'User already exists with this email');
    }

    const user = await createUser({ name, email, password, phone });

    res.status(201).json({
        success: true,
        data: { user: toPublicUser(user), token: generateToken(user.id) }
    });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, 'Please provide email and password');
    }

    const user = await findUserByEmail(email);
    if (!user || !(await checkPassword(user, password))) {
        throw new ApiError(401, 'Invalid email or password');
    }
    if (!user.is_active) {
        throw new ApiError(403, 'This account has been deactivated');
    }

    res.status(200).json({
        success: true,
        data: { user: toPublicUser(user), token: generateToken(user.id) }
    });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
    const user = await findUserById(req.user._id);
    res.status(200).json({ success: true, data: toPublicUser(user) });
});

// @desc    Update current user's profile
// @route   PUT /api/auth/me
// @access  Private
export const updateMe = asyncHandler(async (req, res) => {
    const { name, phone, currentPassword, newPassword } = req.body;
    const updates = { name, phone };

    if (newPassword) {
        const current = await findUserById(req.user._id);
        if (!currentPassword || !(await checkPassword(current, currentPassword))) {
            throw new ApiError(400, 'Current password is incorrect');
        }
        updates.password = newPassword;
    }

    const user = await updateUser(req.user._id, updates);
    // Changing the password signs out other sessions; give this one a fresh token
    res.status(200).json({
        success: true,
        data: toPublicUser(user),
        token: newPassword ? generateToken(user.id) : undefined
    });
});

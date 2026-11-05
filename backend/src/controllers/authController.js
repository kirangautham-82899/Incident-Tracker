import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { USER_ROLES } from '../config/constants.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d'
    });
};

// @desc    Register new user (always as a citizen; staff roles are granted by an admin)
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, 'Please provide name, email and password');
    }

    const userExists = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (userExists) {
        throw new ApiError(400, 'User already exists with this email');
    }

    const user = await User.create({
        name,
        email,
        password,
        phone,
        role: USER_ROLES.CITIZEN
    });

    res.status(201).json({
        success: true,
        data: {
            user: user.toPublicJSON(),
            token: generateToken(user._id)
        }
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

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
        throw new ApiError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
        throw new ApiError(403, 'This account has been deactivated');
    }

    res.status(200).json({
        success: true,
        data: {
            user: user.toPublicJSON(),
            token: generateToken(user._id)
        }
    });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    res.status(200).json({
        success: true,
        data: user.toPublicJSON()
    });
});

// @desc    Update current user's profile
// @route   PUT /api/auth/me
// @access  Private
export const updateMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password');
    const { name, phone, currentPassword, newPassword } = req.body;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    if (newPassword) {
        if (!currentPassword || !(await user.comparePassword(currentPassword))) {
            throw new ApiError(400, 'Current password is incorrect');
        }
        user.password = newPassword;
    }

    await user.save();

    res.status(200).json({
        success: true,
        data: user.toPublicJSON()
    });
});

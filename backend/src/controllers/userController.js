import User from '../models/User.js';
import Incident from '../models/Incident.js';
import { USER_ROLES, STAFF_ROLES, OPEN_STATUSES } from '../config/constants.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

// @desc    List responders/admins with their current open workload
// @route   GET /api/users/responders
// @access  Private (Admin/Responder)
export const getResponders = asyncHandler(async (req, res) => {
    const responders = await User.find({ role: { $in: STAFF_ROLES }, isActive: true })
        .select('name email role phone')
        .sort('name');

    const workload = await Incident.aggregate([
        { $match: { assignedTo: { $ne: null }, status: { $in: OPEN_STATUSES } } },
        { $group: { _id: '$assignedTo', count: { $sum: 1 } } }
    ]);
    const workloadMap = Object.fromEntries(workload.map(w => [w._id.toString(), w.count]));

    res.status(200).json({
        success: true,
        data: responders.map(r => ({
            _id: r._id,
            name: r.name,
            email: r.email,
            role: r.role,
            phone: r.phone,
            activeAssignments: workloadMap[r._id.toString()] || 0
        }))
    });
});

// @desc    List all users
// @route   GET /api/users
// @access  Private (Admin)
export const getUsers = asyncHandler(async (req, res) => {
    const { role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
        const regex = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [{ name: regex }, { email: regex }];
    }

    const users = await User.find(query).sort('-createdAt').limit(200);

    res.status(200).json({
        success: true,
        count: users.length,
        data: users.map(u => u.toPublicJSON())
    });
});

// @desc    Change a user's role or active status
// @route   PUT /api/users/:id
// @access  Private (Admin)
export const updateUser = asyncHandler(async (req, res) => {
    const { role, isActive } = req.body;

    if (req.params.id === req.user._id.toString()) {
        throw new ApiError(400, 'You cannot change your own role or status');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (role !== undefined) {
        if (!Object.values(USER_ROLES).includes(role)) {
            throw new ApiError(400, 'Invalid role');
        }
        user.role = role;
    }
    if (isActive !== undefined) {
        user.isActive = Boolean(isActive);
    }

    await user.save();

    res.status(200).json({
        success: true,
        data: user.toPublicJSON()
    });
});

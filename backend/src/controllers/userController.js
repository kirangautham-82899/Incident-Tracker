import { USER_ROLES, OPEN_STATUSES } from '../config/constants.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { listResponders, listUsers, findUserById, updateUser as updateUserRow, toPublicUser } from '../db/users.js';

// @desc    List responders/admins with their current open workload
// @route   GET /api/users/responders
// @access  Private (Admin/Responder)
export const getResponders = asyncHandler(async (req, res) => {
    res.status(200).json({ success: true, data: await listResponders(OPEN_STATUSES) });
});

// @desc    List all users
// @route   GET /api/users
// @access  Private (Admin)
export const getUsers = asyncHandler(async (req, res) => {
    const users = await listUsers({ role: req.query.role, search: req.query.search });
    res.status(200).json({ success: true, count: users.length, data: users.map(toPublicUser) });
});

// @desc    Change a user's role or active status
// @route   PUT /api/users/:id
// @access  Private (Admin)
export const updateUser = asyncHandler(async (req, res) => {
    const { role, isActive } = req.body;

    if (req.params.id === req.user._id) {
        throw new ApiError(400, 'You cannot change your own role or status');
    }
    if (!(await findUserById(req.params.id))) {
        throw new ApiError(404, 'User not found');
    }
    if (role !== undefined && !Object.values(USER_ROLES).includes(role)) {
        throw new ApiError(400, 'Invalid role');
    }

    const user = await updateUserRow(req.params.id, {
        role,
        isActive: isActive === undefined ? undefined : Boolean(isActive)
    });
    res.status(200).json({ success: true, data: toPublicUser(user) });
});

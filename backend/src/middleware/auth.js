import jwt from 'jsonwebtoken';
import { findUserById, toAuthUser } from '../db/users.js';

const getToken = (req) => {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
        return header.split(' ')[1];
    }
    return null;
};

const loadUser = async (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    const user = await findUserById(decoded.id);
    if (!user || !user.is_active) return null;
    // Sessions created before the last password change are no longer valid
    if (user.password_changed_at && decoded.iat * 1000 < new Date(user.password_changed_at).getTime() - 1000) {
        return null;
    }
    return toAuthUser(user);
};

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
    const token = getToken(req);

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route'
        });
    }

    try {
        req.user = await loadUser(token);

        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not found or deactivated'
            });
        }

        next();
    } catch {
        return res.status(401).json({
            success: false,
            error: 'Session expired, please log in again'
        });
    }
};

// Authorize specific roles
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `User role '${req.user?.role || 'guest'}' is not authorized to access this route`
            });
        }
        next();
    };
};

// Optional authentication - sets req.user if a valid token is provided
export const optionalAuth = async (req, res, next) => {
    const token = getToken(req);
    req.user = null;

    if (token) {
        try {
            req.user = await loadUser(token);
        } catch {
            req.user = null;
        }
    }

    next();
};

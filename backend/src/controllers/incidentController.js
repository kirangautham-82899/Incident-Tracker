import mongoose from 'mongoose';
import Incident from '../models/Incident.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import {
    INCIDENT_STATUS,
    INCIDENT_TYPES,
    SEVERITY_LEVELS,
    STAFF_ROLES,
    AUTO_VERIFY_THRESHOLD,
    DUPLICATE_RADIUS_METERS,
    DUPLICATE_WINDOW_HOURS,
    OPEN_STATUSES,
    REPUTATION
} from '../config/constants.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { emitIncidentEvent } from '../utils/realtime.js';

const isStaff = (user) => Boolean(user && STAFF_ROLES.includes(user.role));

const SORT_OPTIONS = {
    '-createdAt': { createdAt: -1 },
    createdAt: { createdAt: 1 },
    '-priority': { priority: -1, createdAt: -1 },
    '-verificationCount': { verificationCount: -1, createdAt: -1 },
    '-updatedAt': { updatedAt: -1 }
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const populateIncident = (query) =>
    query
        .populate('assignedTo', 'name role email phone')
        .populate('duplicateOf', 'title status');

/**
 * Shape an incident for the requesting user.
 * Internal responder notes and reporter contact details are only for staff.
 */
export const serializeIncident = (incident, user) => {
    const obj = incident.toJSON ? incident.toJSON() : { ...incident };
    if (!isStaff(user)) {
        delete obj.adminNotes;
        if (obj.reporter) {
            const isOwner = user && obj.reporter.userId &&
                obj.reporter.userId.toString() === user._id.toString();
            if (!isOwner) delete obj.reporter.contact;
        }
    }
    return obj;
};

const adjustReputation = async (userId, amount) => {
    if (!userId || !amount) return;
    const user = await User.findById(userId);
    if (!user) return;
    user.reputation = Math.max(0, (user.reputation || 0) + amount);
    await user.save();
};

const parseCoordinates = (location) => {
    const coords = location?.coordinates;
    if (!Array.isArray(coords) || coords.length !== 2) {
        throw new ApiError(400, 'Location coordinates [longitude, latitude] are required');
    }
    const [lng, lat] = coords.map(Number);
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw new ApiError(400, 'Invalid coordinates');
    }
    return [lng, lat];
};

const sanitizeMedia = (media) => {
    if (!Array.isArray(media)) return [];
    return media
        .filter(m => m && typeof m.url === 'string' && ['image', 'video'].includes(m.type))
        .slice(0, 5)
        .map(m => ({ type: m.type, url: m.url }));
};

// @desc    Create new incident
// @route   POST /api/incidents
// @access  Public (anonymous or authenticated)
export const createIncident = asyncHandler(async (req, res) => {
    const { type, title, description, location, media, reporter, severity } = req.body;

    if (!Object.values(INCIDENT_TYPES).includes(type)) {
        throw new ApiError(400, 'Please choose a valid incident type');
    }
    if (severity && !Object.values(SEVERITY_LEVELS).includes(severity)) {
        throw new ApiError(400, 'Invalid severity');
    }

    const coordinates = parseCoordinates(location);

    // Duplicate detection: same type, open, within radius and time window
    const windowStart = new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000);
    const duplicates = await Incident.find({
        type,
        location: {
            $near: {
                $geometry: { type: 'Point', coordinates },
                $maxDistance: DUPLICATE_RADIUS_METERS
            }
        },
        createdAt: { $gte: windowStart },
        status: { $in: OPEN_STATUSES }
    }).limit(5).select('title status createdAt location verificationCount');

    const incident = new Incident({
        type,
        title,
        description,
        location: {
            type: 'Point',
            coordinates,
            address: location?.address
        },
        media: sanitizeMedia(media),
        reporter: {
            userId: req.user?._id,
            name: req.user?.name || reporter?.name?.trim() || 'Anonymous',
            contact: reporter?.contact || req.user?.phone || req.user?.email || ''
        },
        severity: severity || SEVERITY_LEVELS.MEDIUM,
        duplicateOf: duplicates[0]?._id,
        statusHistory: [{
            status: INCIDENT_STATUS.REPORTED,
            changedBy: req.user?._id,
            changedByName: req.user?.name || 'Anonymous'
        }]
    });
    incident.priority = incident.calculatePriority();
    await incident.save();

    if (req.user) {
        await User.findByIdAndUpdate(req.user._id, { $inc: { incidentsReported: 1 } });
    }

    const populated = await populateIncident(Incident.findById(incident._id));
    emitIncidentEvent(req, 'incident_created', populated);

    res.status(201).json({
        success: true,
        data: serializeIncident(populated, req.user),
        possibleDuplicates: duplicates.length > 0 ? duplicates : undefined
    });
});

// @desc    Get all incidents with filters
// @route   GET /api/incidents
// @access  Public
export const getIncidents = asyncHandler(async (req, res) => {
    const { type, status, severity, search, mine, assigned, sort = '-createdAt' } = req.query;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const query = {};
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (status === 'open') {
        query.status = { $in: OPEN_STATUSES };
    } else if (status) {
        query.status = status;
    }
    if (search && String(search).trim()) {
        const term = String(search).trim();
        const regex = new RegExp(escapeRegex(term), 'i');
        query.$or = [{ title: regex }, { description: regex }, { 'location.address': regex }];
        if (/^[a-f0-9]{24}$/i.test(term)) query.$or.push({ _id: term });
    }
    if (mine === 'true') {
        if (!req.user) throw new ApiError(401, 'Log in to see your reports');
        query['reporter.userId'] = req.user._id;
    }
    if (assigned === 'me') {
        if (!req.user) throw new ApiError(401, 'Log in to see your assignments');
        query.assignedTo = req.user._id;
    }

    const [incidents, total] = await Promise.all([
        populateIncident(Incident.find(query))
            .sort(SORT_OPTIONS[sort] || SORT_OPTIONS['-createdAt'])
            .skip((page - 1) * limit)
            .limit(limit),
        Incident.countDocuments(query)
    ]);

    res.status(200).json({
        success: true,
        count: incidents.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: incidents.map(inc => serializeIncident(inc, req.user))
    });
});

// @desc    Get single incident
// @route   GET /api/incidents/:id
// @access  Public
export const getIncident = asyncHandler(async (req, res) => {
    const incident = await populateIncident(Incident.findById(req.params.id))
        .populate('verifications.userId', 'name reputation');

    if (!incident) {
        throw new ApiError(404, 'Incident not found');
    }

    res.status(200).json({
        success: true,
        data: serializeIncident(incident, req.user)
    });
});

// @desc    Update incident (status, severity, assignment)
// @route   PUT /api/incidents/:id
// @access  Private (Admin/Responder)
export const updateIncident = asyncHandler(async (req, res) => {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
        throw new ApiError(404, 'Incident not found');
    }

    const { status, severity, assignedTo } = req.body;
    const previousStatus = incident.status;

    if (severity !== undefined) {
        if (!Object.values(SEVERITY_LEVELS).includes(severity)) {
            throw new ApiError(400, 'Invalid severity');
        }
        incident.severity = severity;
    }

    if (assignedTo !== undefined) {
        if (assignedTo === null || assignedTo === '') {
            incident.assignedTo = undefined;
        } else {
            if (!mongoose.isValidObjectId(assignedTo)) throw new ApiError(400, 'Invalid responder');
            const responder = await User.findById(assignedTo);
            if (!responder || !STAFF_ROLES.includes(responder.role) || !responder.isActive) {
                throw new ApiError(400, 'Incidents can only be assigned to active responders or admins');
            }
            incident.assignedTo = responder._id;
            // Assigning a unit means work has started
            if ([INCIDENT_STATUS.REPORTED, INCIDENT_STATUS.VERIFIED].includes(incident.status) && !status) {
                incident.status = INCIDENT_STATUS.IN_PROGRESS;
            }
        }
    }

    if (status !== undefined) {
        if (!Object.values(INCIDENT_STATUS).includes(status)) {
            throw new ApiError(400, 'Invalid status');
        }
        incident.status = status;
    }

    if (incident.status !== previousStatus) {
        incident.statusHistory.push({
            status: incident.status,
            changedBy: req.user._id,
            changedByName: req.user.name
        });

        if (incident.status === INCIDENT_STATUS.IN_PROGRESS && !incident.respondedAt) {
            incident.respondedAt = new Date();
        }
        if (incident.status === INCIDENT_STATUS.RESOLVED) {
            incident.resolvedAt = new Date();
            if (!incident.respondedAt) incident.respondedAt = incident.resolvedAt;
            await adjustReputation(incident.reporter.userId, REPUTATION.REPORT_RESOLVED);
        } else if (previousStatus === INCIDENT_STATUS.RESOLVED) {
            incident.resolvedAt = undefined; // re-opened
        }
        if (incident.status === INCIDENT_STATUS.FALSE) {
            await adjustReputation(incident.reporter.userId, REPUTATION.REPORT_FALSE);
        }
    }

    incident.priority = incident.calculatePriority();
    await incident.save();

    const populated = await populateIncident(Incident.findById(incident._id));
    emitIncidentEvent(req, 'incident_updated', populated);

    res.status(200).json({
        success: true,
        data: serializeIncident(populated, req.user)
    });
});

// @desc    Verify/upvote incident (community confirmation)
// @route   POST /api/incidents/:id/verify
// @access  Private
export const verifyIncident = asyncHandler(async (req, res) => {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
        throw new ApiError(404, 'Incident not found');
    }
    if (incident.reporter.userId && incident.reporter.userId.toString() === req.user._id.toString()) {
        throw new ApiError(400, 'You cannot verify your own report');
    }
    if (incident.hasVerificationFrom(req.user._id)) {
        throw new ApiError(400, 'You have already verified this incident');
    }
    if (!OPEN_STATUSES.includes(incident.status)) {
        throw new ApiError(400, 'This incident is already closed');
    }

    incident.verifications.push({ userId: req.user._id });

    // Staff confirmation, or enough community confirmations, verifies the report
    const shouldVerify = incident.status === INCIDENT_STATUS.REPORTED &&
        (isStaff(req.user) || incident.verifications.length >= AUTO_VERIFY_THRESHOLD);

    if (shouldVerify) {
        incident.status = INCIDENT_STATUS.VERIFIED;
        incident.statusHistory.push({
            status: INCIDENT_STATUS.VERIFIED,
            changedBy: req.user._id,
            changedByName: isStaff(req.user) ? req.user.name : 'Community verification'
        });
        await adjustReputation(incident.reporter.userId, REPUTATION.REPORT_VERIFIED);
    }

    incident.priority = incident.calculatePriority();
    await incident.save();

    await User.findByIdAndUpdate(req.user._id, {
        $inc: { incidentsVerified: 1, reputation: REPUTATION.VERIFY_GIVEN }
    });

    const populated = await populateIncident(Incident.findById(incident._id));
    emitIncidentEvent(req, 'incident_verified', populated);

    res.status(200).json({
        success: true,
        data: serializeIncident(populated, req.user)
    });
});

// @desc    Get nearby incidents
// @route   GET /api/incidents/nearby
// @access  Public
export const getNearbyIncidents = asyncHandler(async (req, res) => {
    const { type, status } = req.query;
    const longitude = parseFloat(req.query.longitude);
    const latitude = parseFloat(req.query.latitude);
    const maxDistance = Math.min(parseInt(req.query.maxDistance, 10) || 5000, 50000);

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        throw new ApiError(400, 'Please provide valid longitude and latitude');
    }

    const query = {
        location: {
            $near: {
                $geometry: { type: 'Point', coordinates: [longitude, latitude] },
                $maxDistance: maxDistance
            }
        }
    };

    if (type) query.type = type;
    if (status === 'open') query.status = { $in: OPEN_STATUSES };
    else if (status) query.status = status;

    const incidents = await Incident.find(query).limit(50);

    res.status(200).json({
        success: true,
        count: incidents.length,
        data: incidents.map(inc => serializeIncident(inc, req.user))
    });
});

// @desc    Add internal responder note to incident
// @route   POST /api/incidents/:id/notes
// @access  Private (Admin/Responder)
export const addAdminNote = asyncHandler(async (req, res) => {
    const note = String(req.body.note || '').trim();
    if (!note) {
        throw new ApiError(400, 'Note cannot be empty');
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
        throw new ApiError(404, 'Incident not found');
    }

    incident.adminNotes.push({
        adminId: req.user._id,
        adminName: req.user.name,
        note
    });
    await incident.save();

    const populated = await populateIncident(Incident.findById(incident._id));
    // Notes are internal: only broadcast to staff
    emitIncidentEvent(req, 'incident_updated', populated, { staffOnly: true });

    res.status(200).json({
        success: true,
        data: serializeIncident(populated, req.user)
    });
});

// @desc    Delete incident (and its comments)
// @route   DELETE /api/incidents/:id
// @access  Private (Admin only)
export const deleteIncident = asyncHandler(async (req, res) => {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
        throw new ApiError(404, 'Incident not found');
    }

    await Comment.deleteMany({ incidentId: incident._id });
    await incident.deleteOne();

    const io = req.app.get('io');
    if (io) io.emit('incident_deleted', { _id: incident._id.toString() });

    res.status(200).json({
        success: true,
        data: { _id: incident._id }
    });
});

import { transaction } from '../config/database.js';
import {
    INCIDENT_STATUS,
    INCIDENT_TYPES,
    SEVERITY_LEVELS,
    STAFF_ROLES,
    AUTO_VERIFY_THRESHOLD,
    OPEN_STATUSES,
    REPUTATION
} from '../config/constants.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { emitIncidentEvent } from '../utils/realtime.js';
import {
    findIncidentById,
    listIncidents,
    findDuplicates,
    findNearby,
    insertIncident,
    updateIncidentRow,
    addStatusHistory,
    addVerification,
    addNote,
    deleteIncidentRow,
    calculatePriority
} from '../db/incidents.js';
import { findUserById, adjustReputation, incrementCounters } from '../db/users.js';
import { isUuid } from '../db/util.js';

const isStaff = (user) => Boolean(user && STAFF_ROLES.includes(user.role));

/**
 * Shape an incident for the requesting user.
 * Internal responder notes and reporter contact details are only for staff
 * (the reporter can still see their own contact).
 */
export const serializeIncident = (incident, user) => {
    if (!incident || isStaff(user)) return incident;
    const obj = { ...incident, reporter: { ...incident.reporter } };
    delete obj.adminNotes;
    const isOwner = user && obj.reporter.userId && obj.reporter.userId === user._id;
    if (!isOwner) delete obj.reporter.contact;
    return obj;
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
        .filter(m => m && typeof m.url === 'string' && /^https?:\/\//.test(m.url) && ['image', 'video'].includes(m.type))
        .slice(0, 5)
        .map(m => ({ type: m.type, url: m.url, uploadedAt: new Date().toISOString() }));
};

const requireIncident = async (id, db) => {
    const incident = await findIncidentById(id, db);
    if (!incident) throw new ApiError(404, 'Incident not found');
    return incident;
};

const text = (value, field, max) => {
    const v = String(value ?? '').trim();
    if (!v) throw new ApiError(400, `Please provide a ${field}`);
    if (v.length > max) throw new ApiError(400, `${field[0].toUpperCase()}${field.slice(1)} cannot exceed ${max} characters`);
    return v;
};

// @desc    Create new incident
// @route   POST /api/incidents
// @access  Public (anonymous or authenticated)
export const createIncident = asyncHandler(async (req, res) => {
    const { type, location, media, reporter, severity } = req.body;

    if (!Object.values(INCIDENT_TYPES).includes(type)) {
        throw new ApiError(400, 'Please choose a valid incident type');
    }
    if (severity && !Object.values(SEVERITY_LEVELS).includes(severity)) {
        throw new ApiError(400, 'Invalid severity');
    }
    const title = text(req.body.title, 'title', 100);
    if (title.length < 3) throw new ApiError(400, 'Title must be at least 3 characters');
    const description = text(req.body.description, 'description', 1000);
    const [longitude, latitude] = parseCoordinates(location);

    const duplicates = await findDuplicates({ type, longitude, latitude });
    const finalSeverity = severity || SEVERITY_LEVELS.MEDIUM;

    const id = await transaction(async (db) => {
        const newId = await insertIncident(db, {
            type,
            title,
            description,
            longitude,
            latitude,
            address: location?.address ? String(location.address).trim().slice(0, 200) : null,
            severity: finalSeverity,
            reporterId: req.user?._id,
            reporterName: (req.user?.name || reporter?.name?.trim() || 'Anonymous').slice(0, 50),
            reporterContact: String(reporter?.contact || req.user?.phone || req.user?.email || '').slice(0, 100),
            media: sanitizeMedia(media),
            duplicateOf: duplicates[0]?._id,
            priority: calculatePriority({ status: INCIDENT_STATUS.REPORTED, type, severity: finalSeverity })
        });
        await addStatusHistory(db, newId, INCIDENT_STATUS.REPORTED, req.user);
        if (req.user) await incrementCounters(req.user._id, { reported: 1 }, db);
        return newId;
    });

    const incident = await findIncidentById(id);
    emitIncidentEvent(req, 'incident_created', incident);

    res.status(201).json({
        success: true,
        data: serializeIncident(incident, req.user),
        possibleDuplicates: duplicates.length > 0 ? duplicates : undefined
    });
});

// @desc    Get all incidents with filters
// @route   GET /api/incidents
// @access  Public
export const getIncidents = asyncHandler(async (req, res) => {
    const { type, status, severity, search, mine, assigned, sort } = req.query;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const filters = { type, status, severity, search };
    if (mine === 'true') {
        if (!req.user) throw new ApiError(401, 'Log in to see your reports');
        filters.reporterId = req.user._id;
    }
    if (assigned === 'me') {
        if (!req.user) throw new ApiError(401, 'Log in to see your assignments');
        filters.assignedTo = req.user._id;
    }

    const { incidents, total } = await listIncidents(filters, { sort, limit, offset: (page - 1) * limit });

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
    const incident = await requireIncident(req.params.id);
    res.status(200).json({ success: true, data: serializeIncident(incident, req.user) });
});

// @desc    Update incident (status, severity, assignment)
// @route   PUT /api/incidents/:id
// @access  Private (Admin/Responder)
export const updateIncident = asyncHandler(async (req, res) => {
    const incident = await requireIncident(req.params.id);
    const { status, severity, assignedTo } = req.body;
    const changes = {};
    let newStatus = incident.status;

    if (severity !== undefined) {
        if (!Object.values(SEVERITY_LEVELS).includes(severity)) throw new ApiError(400, 'Invalid severity');
        changes.severity = severity;
    }

    if (assignedTo !== undefined) {
        if (assignedTo === null || assignedTo === '') {
            changes.assignedTo = null;
        } else {
            if (!isUuid(assignedTo)) throw new ApiError(400, 'Invalid responder');
            const responder = await findUserById(assignedTo);
            if (!responder || !STAFF_ROLES.includes(responder.role) || !responder.is_active) {
                throw new ApiError(400, 'Incidents can only be assigned to active responders or admins');
            }
            changes.assignedTo = responder.id;
            // Assigning a unit means work has started
            if ([INCIDENT_STATUS.REPORTED, INCIDENT_STATUS.VERIFIED].includes(incident.status) && !status) {
                newStatus = INCIDENT_STATUS.IN_PROGRESS;
            }
        }
    }

    if (status !== undefined) {
        if (!Object.values(INCIDENT_STATUS).includes(status)) throw new ApiError(400, 'Invalid status');
        newStatus = status;
    }

    const statusChanged = newStatus !== incident.status;
    if (statusChanged) {
        changes.status = newStatus;
        const now = new Date();
        if (newStatus === INCIDENT_STATUS.IN_PROGRESS && !incident.respondedAt) changes.respondedAt = now;
        if (newStatus === INCIDENT_STATUS.RESOLVED) {
            changes.resolvedAt = now;
            if (!incident.respondedAt) changes.respondedAt = now;
        } else if (incident.status === INCIDENT_STATUS.RESOLVED) {
            changes.resolvedAt = null; // re-opened
        }
    }

    changes.priority = calculatePriority({
        status: newStatus,
        type: incident.type,
        severity: changes.severity || incident.severity,
        verificationCount: incident.verificationCount,
        createdAt: incident.createdAt
    });

    await transaction(async (db) => {
        await updateIncidentRow(db, incident._id, changes);
        if (statusChanged) {
            await addStatusHistory(db, incident._id, newStatus, req.user);
            const reporterId = incident.reporter.userId;
            if (newStatus === INCIDENT_STATUS.RESOLVED) await adjustReputation(reporterId, REPUTATION.REPORT_RESOLVED, db);
            if (newStatus === INCIDENT_STATUS.FALSE) await adjustReputation(reporterId, REPUTATION.REPORT_FALSE, db);
        }
    });

    const updated = await findIncidentById(incident._id);
    emitIncidentEvent(req, 'incident_updated', updated);
    res.status(200).json({ success: true, data: serializeIncident(updated, req.user) });
});

// @desc    Verify/upvote incident (community confirmation)
// @route   POST /api/incidents/:id/verify
// @access  Private
export const verifyIncident = asyncHandler(async (req, res) => {
    const incident = await requireIncident(req.params.id);

    if (incident.reporter.userId && incident.reporter.userId === req.user._id) {
        throw new ApiError(400, 'You cannot verify your own report');
    }
    if (!OPEN_STATUSES.includes(incident.status)) {
        throw new ApiError(400, 'This incident is already closed');
    }

    await transaction(async (db) => {
        const added = await addVerification(db, incident._id, req.user._id);
        if (!added) throw new ApiError(400, 'You have already verified this incident');

        const count = incident.verificationCount + 1;
        let status = incident.status;

        // Staff confirmation, or enough community confirmations, verifies the report
        if (status === INCIDENT_STATUS.REPORTED && (isStaff(req.user) || count >= AUTO_VERIFY_THRESHOLD)) {
            status = INCIDENT_STATUS.VERIFIED;
            await addStatusHistory(db, incident._id, status, isStaff(req.user)
                ? req.user
                : { _id: null, name: 'Community verification' });
            await adjustReputation(incident.reporter.userId, REPUTATION.REPORT_VERIFIED, db);
        }

        await updateIncidentRow(db, incident._id, {
            status,
            priority: calculatePriority({ ...incident, status, verificationCount: count })
        });
        await incrementCounters(req.user._id, { verified: 1, reputation: REPUTATION.VERIFY_GIVEN }, db);
    });

    const updated = await findIncidentById(incident._id);
    emitIncidentEvent(req, 'incident_verified', updated);
    res.status(200).json({ success: true, data: serializeIncident(updated, req.user) });
});

// @desc    Get nearby incidents
// @route   GET /api/incidents/nearby
// @access  Public
export const getNearbyIncidents = asyncHandler(async (req, res) => {
    const longitude = parseFloat(req.query.longitude);
    const latitude = parseFloat(req.query.latitude);
    const maxDistance = Math.min(parseInt(req.query.maxDistance, 10) || 5000, 50000);

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        throw new ApiError(400, 'Please provide valid longitude and latitude');
    }

    const incidents = await findNearby({
        longitude, latitude, maxDistance, type: req.query.type, status: req.query.status
    });

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
    if (!note) throw new ApiError(400, 'Note cannot be empty');
    if (note.length > 500) throw new ApiError(400, 'Note cannot exceed 500 characters');

    const incident = await requireIncident(req.params.id);
    await addNote(incident._id, req.user, note);

    const updated = await findIncidentById(incident._id);
    // Notes are internal: only broadcast to staff
    emitIncidentEvent(req, 'incident_updated', updated, { staffOnly: true });
    res.status(200).json({ success: true, data: serializeIncident(updated, req.user) });
});

// @desc    Delete incident (comments, notes etc. cascade)
// @route   DELETE /api/incidents/:id
// @access  Private (Admin only)
export const deleteIncident = asyncHandler(async (req, res) => {
    const incident = await requireIncident(req.params.id);
    await deleteIncidentRow(incident._id);

    const io = req.app.get('io');
    if (io) io.emit('incident_deleted', { _id: incident._id });

    res.status(200).json({ success: true, data: { _id: incident._id } });
});

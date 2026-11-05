import Incident from '../models/Incident.js';
import User from '../models/User.js';
import { INCIDENT_STATUS, OPEN_STATUSES, STAFF_ROLES } from '../config/constants.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const toMap = (rows) => Object.fromEntries(rows.map(r => [r._id, r.count]));
const HOUR = 1000 * 60 * 60;

// @desc    Get analytics summary
// @route   GET /api/analytics/stats
// @access  Public (aggregate data only; user counts for staff)
export const getStats = asyncHandler(async (req, res) => {
    const last24Hours = new Date(Date.now() - 24 * HOUR);

    const [totalIncidents, byStatus, byType, bySeverity, recentIncidents, timing, verifiedCount] = await Promise.all([
        Incident.countDocuments(),
        Incident.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Incident.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
        Incident.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
        Incident.countDocuments({ createdAt: { $gte: last24Hours } }),
        Incident.aggregate([
            {
                $group: {
                    _id: null,
                    avgResolve: {
                        $avg: {
                            $cond: [
                                { $and: [{ $eq: ['$status', INCIDENT_STATUS.RESOLVED] }, { $gt: ['$resolvedAt', null] }] },
                                { $subtract: ['$resolvedAt', '$createdAt'] },
                                null
                            ]
                        }
                    },
                    avgRespond: {
                        $avg: {
                            $cond: [
                                { $gt: ['$respondedAt', null] },
                                { $subtract: ['$respondedAt', '$createdAt'] },
                                null
                            ]
                        }
                    }
                }
            }
        ]),
        Incident.countDocuments({ verificationCount: { $gt: 0 } })
    ]);

    const statusMap = toMap(byStatus);
    const openIncidents = OPEN_STATUSES.reduce((sum, s) => sum + (statusMap[s] || 0), 0);
    const critical = await Incident.countDocuments({
        severity: { $in: ['high', 'critical'] },
        status: { $in: OPEN_STATUSES }
    });

    const data = {
        totalIncidents,
        openIncidents,
        resolvedIncidents: statusMap[INCIDENT_STATUS.RESOLVED] || 0,
        inProgressIncidents: statusMap[INCIDENT_STATUS.IN_PROGRESS] || 0,
        unassignedOpen: await Incident.countDocuments({ status: { $in: OPEN_STATUSES }, assignedTo: null }),
        criticalOpen: critical,
        communityVerified: verifiedCount,
        recentIncidents,
        avgResolutionTimeHours: Number(((timing[0]?.avgResolve || 0) / HOUR).toFixed(2)),
        avgResponseTimeHours: Number(((timing[0]?.avgRespond || 0) / HOUR).toFixed(2)),
        byStatus: statusMap,
        byType: toMap(byType),
        bySeverity: toMap(bySeverity)
    };

    if (req.user && STAFF_ROLES.includes(req.user.role)) {
        data.totalUsers = await User.countDocuments();
        data.activeResponders = await User.countDocuments({ role: { $in: STAFF_ROLES }, isActive: true });
    }

    res.status(200).json({ success: true, data });
});

// @desc    Daily incident trends (every day in range is present, zero-filled)
// @route   GET /api/analytics/trends?days=7
// @access  Public
export const getTrends = asyncHandler(async (req, res) => {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (days - 1));

    const rows = await Incident.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                reported: { $sum: 1 },
                resolved: { $sum: { $cond: [{ $eq: ['$status', INCIDENT_STATUS.RESOLVED] }, 1, 0] } },
                verified: { $sum: { $cond: [{ $gt: ['$verificationCount', 0] }, 1, 0] } },
                critical: { $sum: { $cond: [{ $in: ['$severity', ['high', 'critical']] }, 1, 0] } }
            }
        }
    ]);
    const byDate = Object.fromEntries(rows.map(r => [r._id, r]));

    const data = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setUTCDate(start.getUTCDate() + i);
        const key = d.toISOString().slice(0, 10);
        const row = byDate[key] || {};
        data.push({
            date: key,
            reported: row.reported || 0,
            resolved: row.resolved || 0,
            verified: row.verified || 0,
            critical: row.critical || 0
        });
    }

    res.status(200).json({ success: true, data });
});

// @desc    Get heatmap data
// @route   GET /api/analytics/heatmap
// @access  Public
export const getHeatmap = asyncHandler(async (req, res) => {
    const { type, status } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status === 'open') query.status = { $in: OPEN_STATUSES };
    else if (status) query.status = status;

    const incidents = await Incident.find(query)
        .select('location.coordinates type severity')
        .limit(1000);

    const heatmapData = incidents.map(inc => ({
        lat: inc.location.coordinates[1],
        lng: inc.location.coordinates[0],
        type: inc.type,
        severity: inc.severity,
        weight: inc.severity === 'critical' ? 3 : inc.severity === 'high' ? 2 : 1
    }));

    res.status(200).json({
        success: true,
        count: heatmapData.length,
        data: heatmapData
    });
});

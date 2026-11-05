import { query } from '../config/database.js';
import { OPEN_STATUSES, STAFF_ROLES } from '../config/constants.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { countUsers } from '../db/users.js';

const toMap = (rows) => Object.fromEntries(rows.map(r => [r.key, r.count]));
const hours = (seconds) => Number(((seconds || 0) / 3600).toFixed(2));

// @desc    Get analytics summary
// @route   GET /api/analytics/stats
// @access  Public (aggregate data only; user counts for staff)
export const getStats = asyncHandler(async (req, res) => {
    const [summary, byStatus, byType, bySeverity] = await Promise.all([
        query(
            `select
                count(*) as total,
                count(*) filter (where status = any($1)) as open,
                count(*) filter (where status = 'resolved') as resolved,
                count(*) filter (where status = 'in-progress') as in_progress,
                count(*) filter (where status = any($1) and assigned_to is null) as unassigned_open,
                count(*) filter (where status = any($1) and severity in ('high', 'critical')) as critical_open,
                count(*) filter (where verification_count > 0) as community_verified,
                count(*) filter (where created_at >= now() - interval '24 hours') as recent,
                avg(extract(epoch from resolved_at - created_at)) filter (where status = 'resolved' and resolved_at is not null) as avg_resolve,
                avg(extract(epoch from responded_at - created_at)) filter (where responded_at is not null) as avg_respond
             from incidents`,
            [OPEN_STATUSES]
        ),
        query('select status as key, count(*) as count from incidents group by status'),
        query('select type as key, count(*) as count from incidents group by type'),
        query('select severity as key, count(*) as count from incidents group by severity')
    ]);
    const s = summary.rows[0];

    const data = {
        totalIncidents: s.total,
        openIncidents: s.open,
        resolvedIncidents: s.resolved,
        inProgressIncidents: s.in_progress,
        unassignedOpen: s.unassigned_open,
        criticalOpen: s.critical_open,
        communityVerified: s.community_verified,
        recentIncidents: s.recent,
        avgResolutionTimeHours: hours(s.avg_resolve),
        avgResponseTimeHours: hours(s.avg_respond),
        byStatus: toMap(byStatus.rows),
        byType: toMap(byType.rows),
        bySeverity: toMap(bySeverity.rows)
    };

    if (req.user && STAFF_ROLES.includes(req.user.role)) {
        const users = await countUsers();
        data.totalUsers = users.total;
        data.activeResponders = users.activeStaff;
    }

    res.status(200).json({ success: true, data });
});

// @desc    Daily incident trends (every day in range present, zero-filled)
// @route   GET /api/analytics/trends?days=7
// @access  Public
export const getTrends = asyncHandler(async (req, res) => {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);

    const { rows } = await query(
        `with days as (
            select generate_series(
                (now() at time zone 'utc')::date - ($1::int - 1),
                (now() at time zone 'utc')::date,
                interval '1 day')::date as day
        )
        select to_char(d.day, 'YYYY-MM-DD') as date,
               count(i.id) as reported,
               count(i.id) filter (where i.status = 'resolved') as resolved,
               count(i.id) filter (where i.verification_count > 0) as verified,
               count(i.id) filter (where i.severity in ('high', 'critical')) as critical
        from days d
        left join incidents i on (i.created_at at time zone 'utc')::date = d.day
        group by d.day
        order by d.day`,
        [days]
    );

    res.status(200).json({ success: true, data: rows });
});

// @desc    Get heatmap data
// @route   GET /api/analytics/heatmap
// @access  Public
export const getHeatmap = asyncHandler(async (req, res) => {
    const { type, status } = req.query;
    const where = [];
    const params = [];
    if (type) {
        params.push(type);
        where.push(`type = $${params.length}`);
    }
    if (status === 'open') {
        params.push(OPEN_STATUSES);
        where.push(`status = any($${params.length})`);
    } else if (status) {
        params.push(status);
        where.push(`status = $${params.length}`);
    }

    const { rows } = await query(
        `select latitude, longitude, type, severity from incidents
         ${where.length ? `where ${where.join(' and ')}` : ''}
         order by created_at desc limit 1000`,
        params
    );

    const data = rows.map(r => ({
        lat: r.latitude,
        lng: r.longitude,
        type: r.type,
        severity: r.severity,
        weight: r.severity === 'critical' ? 3 : r.severity === 'high' ? 2 : 1
    }));

    res.status(200).json({ success: true, count: data.length, data });
});

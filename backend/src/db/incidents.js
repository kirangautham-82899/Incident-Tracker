import { query } from '../config/database.js';
import {
    TYPE_PRIORITY_WEIGHTS,
    SEVERITY_PRIORITY_WEIGHTS,
    OPEN_STATUSES,
    DUPLICATE_RADIUS_METERS,
    DUPLICATE_WINDOW_HOURS
} from '../config/constants.js';
import { isUuid, iso } from './util.js';

// One query returns the incident plus everything the API exposes about it
const SELECT = `
    select i.*,
        case when a.id is null then null else json_build_object(
            '_id', a.id, 'name', a.name, 'role', a.role, 'email', a.email, 'phone', a.phone) end as assigned_json,
        case when d.id is null then null else json_build_object(
            '_id', d.id, 'title', d.title, 'status', d.status) end as duplicate_json,
        coalesce((select json_agg(json_build_object('userId', v.user_id, 'timestamp', v.created_at) order by v.created_at)
                  from incident_verifications v where v.incident_id = i.id), '[]'::json) as verifications_json,
        coalesce((select json_agg(json_build_object('_id', n.id, 'adminId', n.admin_id, 'adminName', n.admin_name,
                                                    'note', n.note, 'timestamp', n.created_at) order by n.created_at)
                  from incident_notes n where n.incident_id = i.id), '[]'::json) as notes_json,
        coalesce((select json_agg(json_build_object('_id', h.id, 'status', h.status, 'changedBy', h.changed_by,
                                                    'changedByName', h.changed_by_name, 'timestamp', h.created_at) order by h.created_at)
                  from incident_status_history h where h.incident_id = i.id), '[]'::json) as history_json
    from incidents i
    left join users a on a.id = i.assigned_to
    left join incidents d on d.id = i.duplicate_of`;

// Row -> API JSON (keeps the shape the frontend was built against)
export const toIncidentJSON = (row) => row && ({
    _id: row.id,
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    location: {
        type: 'Point',
        coordinates: [row.longitude, row.latitude],
        address: row.address || undefined
    },
    severity: row.severity,
    status: row.status,
    reporter: {
        userId: row.reporter_id || undefined,
        name: row.reporter_name,
        contact: row.reporter_contact || undefined
    },
    media: row.media || [],
    verifications: row.verifications_json || [],
    verificationCount: row.verification_count,
    duplicateOf: row.duplicate_json || undefined,
    adminNotes: row.notes_json || [],
    statusHistory: row.history_json || [],
    assignedTo: row.assigned_json || undefined,
    priority: row.priority,
    respondedAt: iso(row.responded_at),
    resolvedAt: iso(row.resolved_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
});

/**
 * Priority score for the responder queue. Higher = more urgent; closed = 0.
 */
export const calculatePriority = ({ status, type, severity, verificationCount = 0, createdAt }) => {
    if (!OPEN_STATUSES.includes(status)) return 0;
    let score = 0;
    score += TYPE_PRIORITY_WEIGHTS[type] || 3;
    score += SEVERITY_PRIORITY_WEIGHTS[severity] || 0;
    score += Math.min(verificationCount * 2, 10);
    const created = createdAt ? new Date(createdAt).getTime() : Date.now();
    score += Math.min(((Date.now() - created) / 3600000) * 0.5, 5);
    return Math.round(score * 10) / 10;
};

export const findIncidentById = async (id, db = { query }) => {
    if (!isUuid(id)) return null;
    const { rows } = await db.query(`${SELECT} where i.id = $1`, [id]);
    return rows[0] ? toIncidentJSON(rows[0]) : null;
};

const SORTS = {
    '-createdAt': 'i.created_at desc',
    createdAt: 'i.created_at asc',
    '-priority': 'i.priority desc, i.created_at desc',
    '-verificationCount': 'i.verification_count desc, i.created_at desc',
    '-updatedAt': 'i.updated_at desc'
};

/**
 * filters: { type, status (or 'open'), severity, search, reporterId, assignedTo }
 */
export const listIncidents = async (filters, { sort = '-createdAt', limit = 50, offset = 0 } = {}) => {
    const where = [];
    const params = [];
    const add = (sql, value) => {
        params.push(value);
        where.push(sql.replace('?', `$${params.length}`));
    };

    if (filters.type) add('i.type = ?', filters.type);
    if (filters.severity) add('i.severity = ?', filters.severity);
    if (filters.status === 'open') add('i.status = any(?)', OPEN_STATUSES);
    else if (filters.status) add('i.status = ?', filters.status);
    if (filters.reporterId) add('i.reporter_id = ?', filters.reporterId);
    if (filters.assignedTo) add('i.assigned_to = ?', filters.assignedTo);
    if (filters.search) {
        const term = String(filters.search).trim();
        params.push(`%${term.replace(/[\\%_]/g, '\\$&')}%`);
        const p = `$${params.length}`;
        // Also match by (partial) ID, as shown in the UI (#ABC123)
        params.push(`%${term.replace(/^#/, '').toLowerCase().replace(/[\\%_]/g, '\\$&')}%`);
        where.push(`(i.title ilike ${p} or i.description ilike ${p} or i.address ilike ${p} or i.id::text like $${params.length})`);
    }

    const whereSql = where.length ? `where ${where.join(' and ')}` : '';
    const countParams = [...params];
    params.push(limit, offset);

    const [list, count] = await Promise.all([
        query(`${SELECT} ${whereSql} order by ${SORTS[sort] || SORTS['-createdAt']} limit $${params.length - 1} offset $${params.length}`, params),
        query(`select count(*) as total from incidents i ${whereSql}`, countParams)
    ]);

    return { incidents: list.rows.map(toIncidentJSON), total: count.rows[0].total };
};

// Open incidents of the same type nearby, reported recently (bounding box first, then exact distance)
export const findDuplicates = async ({ type, longitude, latitude }) => {
    const latDelta = DUPLICATE_RADIUS_METERS / 111320;
    const lngDelta = latDelta / Math.max(Math.cos((latitude * Math.PI) / 180), 0.01);
    const { rows } = await query(
        `select id, title, status, created_at, verification_count, longitude, latitude,
                distance_m($2, $3, latitude, longitude) as distance
         from incidents
         where type = $1
           and status = any($4)
           and created_at >= now() - make_interval(hours => $5)
           and latitude between $2 - $7 and $2 + $7
           and longitude between $3 - $8 and $3 + $8
           and distance_m($2, $3, latitude, longitude) <= $6
         order by distance
         limit 5`,
        [type, latitude, longitude, OPEN_STATUSES, DUPLICATE_WINDOW_HOURS, DUPLICATE_RADIUS_METERS, latDelta, lngDelta]
    );
    return rows.map(r => ({
        _id: r.id,
        title: r.title,
        status: r.status,
        createdAt: iso(r.created_at),
        verificationCount: r.verification_count,
        location: { type: 'Point', coordinates: [r.longitude, r.latitude] },
        distanceMeters: Math.round(r.distance)
    }));
};

export const findNearby = async ({ longitude, latitude, maxDistance, type, status }) => {
    const params = [latitude, longitude, maxDistance];
    const where = ['distance_m($1, $2, i.latitude, i.longitude) <= $3'];
    if (type) {
        params.push(type);
        where.push(`i.type = $${params.length}`);
    }
    if (status === 'open') {
        params.push(OPEN_STATUSES);
        where.push(`i.status = any($${params.length})`);
    } else if (status) {
        params.push(status);
        where.push(`i.status = $${params.length}`);
    }
    const { rows } = await query(
        `${SELECT} where ${where.join(' and ')}
         order by distance_m($1, $2, i.latitude, i.longitude) limit 50`,
        params
    );
    return rows.map(toIncidentJSON);
};

export const insertIncident = async (db, data) => {
    const { rows } = await db.query(
        `insert into incidents (type, title, description, longitude, latitude, address, severity,
                                reporter_id, reporter_name, reporter_contact, media, duplicate_of, priority)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         returning id`,
        [
            data.type, data.title, data.description, data.longitude, data.latitude, data.address || null,
            data.severity, data.reporterId || null, data.reporterName, data.reporterContact || null,
            JSON.stringify(data.media || []), data.duplicateOf || null, data.priority
        ]
    );
    return rows[0].id;
};

const COLUMNS = {
    status: 'status',
    severity: 'severity',
    assignedTo: 'assigned_to',
    respondedAt: 'responded_at',
    resolvedAt: 'resolved_at',
    priority: 'priority',
    verificationCount: 'verification_count'
};

export const updateIncidentRow = async (db, id, fields) => {
    const sets = [];
    const params = [];
    for (const [key, value] of Object.entries(fields)) {
        if (!(key in COLUMNS) || value === undefined) continue;
        params.push(value);
        sets.push(`${COLUMNS[key]} = $${params.length}`);
    }
    if (sets.length === 0) return;
    params.push(id);
    await db.query(`update incidents set ${sets.join(', ')}, updated_at = now() where id = $${params.length}`, params);
};

export const addStatusHistory = (db, incidentId, status, user) =>
    db.query(
        'insert into incident_status_history (incident_id, status, changed_by, changed_by_name) values ($1, $2, $3, $4)',
        [incidentId, status, user?._id || null, user?.name || 'Anonymous']
    );

// Returns false if this user already verified the incident
export const addVerification = async (db, incidentId, userId) => {
    const { rowCount } = await db.query(
        `insert into incident_verifications (incident_id, user_id) values ($1, $2)
         on conflict do nothing`,
        [incidentId, userId]
    );
    if (rowCount === 0) return false;
    await db.query(
        `update incidents set verification_count =
            (select count(*) from incident_verifications where incident_id = $1), updated_at = now()
         where id = $1`,
        [incidentId]
    );
    return true;
};

export const addNote = (incidentId, user, note) =>
    query(
        'insert into incident_notes (incident_id, admin_id, admin_name, note) values ($1, $2, $3, $4)',
        [incidentId, user._id, user.name, note]
    );

export const deleteIncidentRow = (id) => query('delete from incidents where id = $1', [id]);

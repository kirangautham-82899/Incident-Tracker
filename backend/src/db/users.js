import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import { STAFF_ROLES, USER_ROLES } from '../config/constants.js';
import { isUuid } from './util.js';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Row -> public JSON (same shape the frontend has always used)
export const toPublicUser = (row) => row && ({
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone,
    reputation: row.reputation,
    incidentsReported: row.incidents_reported,
    incidentsVerified: row.incidents_verified,
    isActive: row.is_active,
    createdAt: row.created_at
});

// Minimal user object attached to req.user
export const toAuthUser = (row) => row && ({
    _id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone,
    isActive: row.is_active
});

const validate = ({ name, email, password }, { partial = false } = {}) => {
    if (!partial || name !== undefined) {
        const n = String(name ?? '').trim();
        if (!n) throw new ApiError(400, 'Please provide a name');
        if (n.length > 50) throw new ApiError(400, 'Name cannot exceed 50 characters');
    }
    if (!partial || email !== undefined) {
        if (!EMAIL_RE.test(String(email ?? '').trim())) throw new ApiError(400, 'Please provide a valid email');
    }
    if (!partial || password !== undefined) {
        if (String(password ?? '').length < 6) throw new ApiError(400, 'Password must be at least 6 characters');
    }
};

export const findUserById = async (id) => {
    if (!isUuid(id)) return null;
    const { rows } = await query('select * from users where id = $1', [id]);
    return rows[0] || null;
};

export const findUserByEmail = async (email) => {
    const { rows } = await query('select * from users where email = $1', [String(email).toLowerCase().trim()]);
    return rows[0] || null;
};

export const createUser = async ({ name, email, password, phone, role = USER_ROLES.CITIZEN }) => {
    validate({ name, email, password });
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
        `insert into users (name, email, password_hash, phone, role)
         values ($1, $2, $3, $4, $5) returning *`,
        [String(name).trim(), String(email).toLowerCase().trim(), hash, phone || null, role]
    );
    return rows[0];
};

export const checkPassword = (row, password) => bcrypt.compare(String(password), row.password_hash);

export const updateUser = async (id, { name, phone, password, role, isActive }) => {
    validate({ name, password }, { partial: true });
    const sets = [];
    const params = [];
    const add = (col, value) => {
        params.push(value);
        sets.push(`${col} = $${params.length}`);
    };
    if (name !== undefined) add('name', String(name).trim());
    if (phone !== undefined) add('phone', phone ? String(phone).trim() : null);
    if (password !== undefined) add('password_hash', await bcrypt.hash(password, 10));
    if (role !== undefined) add('role', role);
    if (isActive !== undefined) add('is_active', Boolean(isActive));
    if (sets.length === 0) return findUserById(id);

    params.push(id);
    const { rows } = await query(
        `update users set ${sets.join(', ')}, updated_at = now() where id = $${params.length} returning *`,
        params
    );
    return rows[0] || null;
};

export const adjustReputation = async (id, delta, db = { query }) => {
    if (!id || !delta) return;
    await db.query('update users set reputation = greatest(0, reputation + $2) where id = $1', [id, delta]);
};

export const incrementCounters = async (id, { reported = 0, verified = 0, reputation = 0 }, db = { query }) => {
    if (!id) return;
    await db.query(
        `update users set incidents_reported = incidents_reported + $2,
                          incidents_verified = incidents_verified + $3,
                          reputation = greatest(0, reputation + $4)
         where id = $1`,
        [id, reported, verified, reputation]
    );
};

export const listUsers = async ({ role, search } = {}) => {
    const where = [];
    const params = [];
    if (role) {
        params.push(role);
        where.push(`role = $${params.length}`);
    }
    if (search) {
        params.push(`%${String(search).replace(/[\\%_]/g, '\\$&')}%`);
        where.push(`(name ilike $${params.length} or email ilike $${params.length})`);
    }
    const { rows } = await query(
        `select * from users ${where.length ? `where ${where.join(' and ')}` : ''}
         order by created_at desc limit 200`,
        params
    );
    return rows;
};

export const listResponders = async (openStatuses) => {
    const { rows } = await query(
        `select u.id, u.name, u.email, u.role, u.phone,
                (select count(*) from incidents i
                  where i.assigned_to = u.id and i.status = any($2)) as active_assignments
         from users u
         where u.role = any($1) and u.is_active
         order by u.name`,
        [STAFF_ROLES, openStatuses]
    );
    return rows.map(r => ({
        _id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        phone: r.phone,
        activeAssignments: r.active_assignments
    }));
};

export const countUsers = async () => {
    const { rows } = await query(
        `select count(*) as total,
                count(*) filter (where role = any($1) and is_active) as active_staff
         from users`,
        [STAFF_ROLES]
    );
    return { total: rows[0].total, activeStaff: rows[0].active_staff };
};

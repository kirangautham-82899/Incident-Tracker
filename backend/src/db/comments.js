import { query } from '../config/database.js';
import { isUuid, iso } from './util.js';

export const toCommentJSON = (row) => row && ({
    _id: row.id,
    id: row.id,
    incidentId: row.incident_id,
    userId: row.user_id,
    userName: row.user_name,
    userRole: row.user_role,
    content: row.content,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
});

export const listComments = async (incidentId) => {
    if (!isUuid(incidentId)) return [];
    const { rows } = await query(
        'select * from comments where incident_id = $1 order by created_at desc limit 100',
        [incidentId]
    );
    return rows.map(toCommentJSON);
};

export const createComment = async ({ incidentId, user, content }) => {
    const { rows } = await query(
        `insert into comments (incident_id, user_id, user_name, user_role, content)
         values ($1, $2, $3, $4, $5) returning *`,
        [incidentId, user._id, user.name, user.role, content]
    );
    return toCommentJSON(rows[0]);
};

export const findCommentById = async (id) => {
    if (!isUuid(id)) return null;
    const { rows } = await query('select * from comments where id = $1', [id]);
    return toCommentJSON(rows[0]);
};

export const deleteCommentRow = (id) => query('delete from comments where id = $1', [id]);

export const INCIDENT_TYPES = {
    ACCIDENT: 'accident',
    FIRE: 'fire',
    MEDICAL: 'medical',
    INFRASTRUCTURE: 'infrastructure',
    SAFETY: 'safety',
    OTHER: 'other'
};

export const INCIDENT_STATUS = {
    REPORTED: 'reported',
    VERIFIED: 'verified',
    IN_PROGRESS: 'in-progress',
    RESOLVED: 'resolved',
    FALSE: 'false'
};

export const OPEN_STATUSES = [INCIDENT_STATUS.REPORTED, INCIDENT_STATUS.VERIFIED, INCIDENT_STATUS.IN_PROGRESS];

export const SEVERITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

export const STAFF_ROLES = ['admin', 'responder'];
export const isStaff = (user) => Boolean(user && STAFF_ROLES.includes(user.role));

// Must match backend AUTO_VERIFY_THRESHOLD
export const AUTO_VERIFY_THRESHOLD = 3;

export const INCIDENT_TYPE_OPTIONS = [
    { value: INCIDENT_TYPES.ACCIDENT, label: 'Accident', emoji: '🚗', color: '#E06B1F' },
    { value: INCIDENT_TYPES.FIRE, label: 'Fire', emoji: '🔥', color: '#D7262E' },
    { value: INCIDENT_TYPES.MEDICAL, label: 'Medical', emoji: '🚑', color: '#2563EB' },
    { value: INCIDENT_TYPES.INFRASTRUCTURE, label: 'Infrastructure', emoji: '🏗️', color: '#7C3AED' },
    { value: INCIDENT_TYPES.SAFETY, label: 'Safety', emoji: '⚠️', color: '#C98A12' },
    { value: INCIDENT_TYPES.OTHER, label: 'Other', emoji: '📌', color: '#6E6D76' }
];

export const TYPE_COLORS = Object.fromEntries(INCIDENT_TYPE_OPTIONS.map(o => [o.value, o.color]));
export const TYPE_LABELS = Object.fromEntries(INCIDENT_TYPE_OPTIONS.map(o => [o.value, o.label]));

export const SEVERITY_OPTIONS = [
    { value: SEVERITY_LEVELS.LOW, label: 'Low' },
    { value: SEVERITY_LEVELS.MEDIUM, label: 'Medium' },
    { value: SEVERITY_LEVELS.HIGH, label: 'High' },
    { value: SEVERITY_LEVELS.CRITICAL, label: 'Critical' }
];

export const STATUS_OPTIONS = [
    { value: INCIDENT_STATUS.REPORTED, label: 'Reported' },
    { value: INCIDENT_STATUS.VERIFIED, label: 'Verified' },
    { value: INCIDENT_STATUS.IN_PROGRESS, label: 'In progress' },
    { value: INCIDENT_STATUS.RESOLVED, label: 'Resolved' },
    { value: INCIDENT_STATUS.FALSE, label: 'False report' }
];

export const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map(o => [o.value, o.label]));
export const SEVERITY_LABELS = Object.fromEntries(SEVERITY_OPTIONS.map(o => [o.value, o.label]));

// Hex colours (charts, map, dots)
export const SEVERITY_COLORS = { low: '#2F9E6E', medium: '#C98A12', high: '#E06B1F', critical: '#D7262E' };
export const STATUS_COLORS = { reported: '#B7791F', verified: '#2563EB', 'in-progress': '#7C3AED', resolved: '#2F9E6E', false: '#8A8A93' };
export const ROLE_COLORS = { admin: '#E5402A', responder: '#2563EB', citizen: '#6E6D76', bot: '#7C3AED' };

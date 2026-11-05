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
    { value: INCIDENT_TYPES.ACCIDENT, label: '🚗 Accident', color: '#ef4444' },
    { value: INCIDENT_TYPES.FIRE, label: '🔥 Fire', color: '#f97316' },
    { value: INCIDENT_TYPES.MEDICAL, label: '🚑 Medical Emergency', color: '#3b82f6' },
    { value: INCIDENT_TYPES.INFRASTRUCTURE, label: '🏗️ Infrastructure', color: '#8b5cf6' },
    { value: INCIDENT_TYPES.SAFETY, label: '⚠️ Safety Issue', color: '#eab308' },
    { value: INCIDENT_TYPES.OTHER, label: '📌 Other', color: '#6b7280' }
];

export const TYPE_COLORS = Object.fromEntries(INCIDENT_TYPE_OPTIONS.map(o => [o.value, o.color]));

export const SEVERITY_OPTIONS = [
    { value: SEVERITY_LEVELS.LOW, label: 'Low' },
    { value: SEVERITY_LEVELS.MEDIUM, label: 'Medium' },
    { value: SEVERITY_LEVELS.HIGH, label: 'High' },
    { value: SEVERITY_LEVELS.CRITICAL, label: 'Critical' }
];

export const STATUS_OPTIONS = [
    { value: INCIDENT_STATUS.REPORTED, label: 'Reported' },
    { value: INCIDENT_STATUS.VERIFIED, label: 'Verified' },
    { value: INCIDENT_STATUS.IN_PROGRESS, label: 'In Progress' },
    { value: INCIDENT_STATUS.RESOLVED, label: 'Resolved' },
    { value: INCIDENT_STATUS.FALSE, label: 'False Report' }
];

export const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map(o => [o.value, o.label]));

// Dark-theme badge classes (written out in full so Tailwind keeps them)
export const STATUS_BADGE = {
    reported: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    verified: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    'in-progress': 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    resolved: 'bg-green-500/10 text-green-300 border-green-500/30',
    false: 'bg-gray-500/10 text-gray-400 border-gray-500/30'
};

export const SEVERITY_BADGE = {
    low: 'bg-green-500/10 text-green-300 border-green-500/30',
    medium: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    high: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
    critical: 'bg-red-500/15 text-red-300 border-red-500/40'
};

export const SEVERITY_BAR = {
    low: 'from-green-500 to-emerald-500',
    medium: 'from-yellow-500 to-amber-500',
    high: 'from-orange-500 to-red-500',
    critical: 'from-red-600 to-rose-500'
};

export const ROLE_BADGE = {
    admin: 'bg-red-500/20 text-red-300 border-red-500/30',
    responder: 'bg-green-500/20 text-green-300 border-green-500/30',
    citizen: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    bot: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
};

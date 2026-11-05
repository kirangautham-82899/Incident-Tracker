// Incident Types
export const INCIDENT_TYPES = {
    ACCIDENT: 'accident',
    FIRE: 'fire',
    MEDICAL: 'medical',
    INFRASTRUCTURE: 'infrastructure',
    SAFETY: 'safety',
    OTHER: 'other'
};

// Incident Status (lifecycle: reported -> verified -> in-progress -> resolved, or -> false)
export const INCIDENT_STATUS = {
    REPORTED: 'reported',
    VERIFIED: 'verified',
    IN_PROGRESS: 'in-progress',
    RESOLVED: 'resolved',
    FALSE: 'false'
};

// Statuses that count as "open" (still needs attention)
export const OPEN_STATUSES = [
    INCIDENT_STATUS.REPORTED,
    INCIDENT_STATUS.VERIFIED,
    INCIDENT_STATUS.IN_PROGRESS
];

// Severity Levels
export const SEVERITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

// User Roles
export const USER_ROLES = {
    CITIZEN: 'citizen',
    RESPONDER: 'responder',
    ADMIN: 'admin'
};

export const STAFF_ROLES = [USER_ROLES.RESPONDER, USER_ROLES.ADMIN];

// Priority Weights for Incident Types
export const TYPE_PRIORITY_WEIGHTS = {
    [INCIDENT_TYPES.FIRE]: 10,
    [INCIDENT_TYPES.MEDICAL]: 9,
    [INCIDENT_TYPES.ACCIDENT]: 7,
    [INCIDENT_TYPES.INFRASTRUCTURE]: 5,
    [INCIDENT_TYPES.SAFETY]: 4,
    [INCIDENT_TYPES.OTHER]: 3
};

// Priority Weights for Severity
export const SEVERITY_PRIORITY_WEIGHTS = {
    [SEVERITY_LEVELS.LOW]: 0,
    [SEVERITY_LEVELS.MEDIUM]: 5,
    [SEVERITY_LEVELS.HIGH]: 10,
    [SEVERITY_LEVELS.CRITICAL]: 15
};

// Community verification: number of independent confirmations that
// automatically moves a "reported" incident to "verified".
export const AUTO_VERIFY_THRESHOLD = 3;

// Duplicate detection window
export const DUPLICATE_RADIUS_METERS = 500;
export const DUPLICATE_WINDOW_HOURS = 2;

// Reputation rewards
export const REPUTATION = {
    VERIFY_GIVEN: 1,
    REPORT_VERIFIED: 2,
    REPORT_RESOLVED: 5,
    REPORT_FALSE: -5
};

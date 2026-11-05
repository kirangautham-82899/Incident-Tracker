import mongoose from 'mongoose';
import {
    INCIDENT_TYPES,
    INCIDENT_STATUS,
    SEVERITY_LEVELS,
    TYPE_PRIORITY_WEIGHTS,
    SEVERITY_PRIORITY_WEIGHTS,
    OPEN_STATUSES
} from '../config/constants.js';

const incidentSchema = new mongoose.Schema({
    type: {
        type: String,
        required: [true, 'Please specify incident type'],
        enum: {
            values: Object.values(INCIDENT_TYPES),
            message: 'Invalid incident type'
        }
    },
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: [true, 'Please provide location coordinates'],
            validate: {
                validator: function (v) {
                    return Array.isArray(v) && v.length === 2 &&
                        Number.isFinite(v[0]) && Number.isFinite(v[1]) &&
                        v[0] >= -180 && v[0] <= 180 && // longitude
                        v[1] >= -90 && v[1] <= 90;     // latitude
                },
                message: 'Invalid coordinates'
            }
        },
        address: {
            type: String,
            trim: true,
            maxlength: 200
        }
    },
    severity: {
        type: String,
        enum: Object.values(SEVERITY_LEVELS),
        default: SEVERITY_LEVELS.MEDIUM
    },
    status: {
        type: String,
        enum: Object.values(INCIDENT_STATUS),
        default: INCIDENT_STATUS.REPORTED
    },
    reporter: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        },
        contact: {
            type: String,
            trim: true,
            maxlength: 100
        }
    },
    media: [{
        type: {
            type: String,
            enum: ['image', 'video'],
            required: true
        },
        url: {
            type: String,
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    verifications: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    verificationCount: {
        type: Number,
        default: 0
    },
    // Set when the report looks like a duplicate of an earlier open incident nearby
    duplicateOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Incident'
    },
    adminNotes: [{
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        adminName: {
            type: String,
            trim: true
        },
        note: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    // Audit trail of status changes, visible to everyone
    statusHistory: [{
        status: { type: String, enum: Object.values(INCIDENT_STATUS) },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedByName: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    respondedAt: {
        type: Date
    },
    resolvedAt: {
        type: Date
    },
    priority: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Geospatial index for location-based queries
incidentSchema.index({ location: '2dsphere' });

// Indexes for common queries
incidentSchema.index({ type: 1, status: 1 });
incidentSchema.index({ createdAt: -1 });
incidentSchema.index({ priority: -1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ 'reporter.userId': 1 });

// Keep verification count in sync
incidentSchema.pre('save', function (next) {
    this.verificationCount = this.verifications.length;
    next();
});

// Virtual for age in hours
incidentSchema.virtual('ageInHours').get(function () {
    return (Date.now() - this.createdAt) / (1000 * 60 * 60);
});

/**
 * Priority score used to order the responder queue.
 * Higher = more urgent. Closed incidents always score 0.
 */
incidentSchema.methods.calculatePriority = function () {
    if (!OPEN_STATUSES.includes(this.status)) {
        return 0;
    }

    let score = 0;
    score += TYPE_PRIORITY_WEIGHTS[this.type] || 3;
    score += SEVERITY_PRIORITY_WEIGHTS[this.severity] || 0;
    score += Math.min((this.verifications?.length || 0) * 2, 10);

    // Older unresolved incidents slowly rise in the queue (max +5)
    const created = this.createdAt ? new Date(this.createdAt).getTime() : Date.now();
    const hoursSince = (Date.now() - created) / (1000 * 60 * 60);
    score += Math.min(hoursSince * 0.5, 5);

    return Math.round(score * 10) / 10;
};

incidentSchema.methods.hasVerificationFrom = function (userId) {
    return this.verifications.some(v => v.userId.toString() === userId.toString());
};

const Incident = mongoose.model('Incident', incidentSchema);

export default Incident;

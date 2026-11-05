import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't return password by default
    },
    role: {
        type: String,
        enum: Object.values(USER_ROLES),
        default: USER_ROLES.CITIZEN
    },
    phone: {
        type: String,
        trim: true,
        maxlength: 20
    },
    reputation: {
        type: Number,
        default: 0,
        min: 0
    },
    incidentsReported: {
        type: Number,
        default: 0
    },
    incidentsVerified: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Public profile. Exposes both `_id` and `id` so the frontend can use either.
userSchema.methods.toPublicJSON = function () {
    return {
        _id: this._id,
        id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        phone: this.phone,
        reputation: this.reputation,
        incidentsReported: this.incidentsReported,
        incidentsVerified: this.incidentsVerified,
        isActive: this.isActive,
        createdAt: this.createdAt
    };
};

const User = mongoose.model('User', userSchema);

export default User;

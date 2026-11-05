/**
 * Create (or promote) an admin account directly in the database.
 *
 * Usage:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=secret123 ADMIN_NAME="Admin" npm run create-admin
 *
 * Public sign-up always creates citizens; this script is the only way to
 * bootstrap the first admin. Admins can then promote responders from the
 * Admin > Users tab.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

dotenv.config();

const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Administrator' } = process.env;

if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set MONGODB_URI (in .env), ADMIN_EMAIL and ADMIN_PASSWORD.');
    process.exit(1);
}

await mongoose.connect(MONGODB_URI);

let user = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
if (user) {
    user.role = 'admin';
    user.isActive = true;
    user.password = ADMIN_PASSWORD;
    await user.save();
    console.log(`Updated existing user ${ADMIN_EMAIL} to admin.`);
} else {
    user = await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' });
    console.log(`Created admin ${ADMIN_EMAIL}.`);
}

await mongoose.disconnect();

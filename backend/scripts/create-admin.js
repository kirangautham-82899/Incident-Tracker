/**
 * Create (or promote) an admin account directly in the database.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=secret123 ADMIN_NAME="Admin" npm run create-admin
 *
 * Public sign-up always creates citizens; this script bootstraps the first
 * admin. Admins can then promote responders from Admin > Users & Roles.
 */
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Administrator' } = process.env;
if (!process.env.DATABASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set DATABASE_URL (in .env), ADMIN_EMAIL and ADMIN_PASSWORD.');
    process.exit(1);
}

const { ensureDatabase, closeDatabase } = await import('../src/config/database.js');
const { findUserByEmail, createUser, updateUser } = await import('../src/db/users.js');

await ensureDatabase();
const existing = await findUserByEmail(ADMIN_EMAIL);
if (existing) {
    await updateUser(existing.id, { role: 'admin', isActive: true, password: ADMIN_PASSWORD });
    console.log(`Updated existing user ${ADMIN_EMAIL} to admin.`);
} else {
    await createUser({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' });
    console.log(`Created admin ${ADMIN_EMAIL}.`);
}
await closeDatabase();

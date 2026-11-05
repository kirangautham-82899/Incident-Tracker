/**
 * Run the API against a local, throwaway PostgreSQL (no install needed).
 * Seeds demo accounts and a few incidents. Data is wiped when you stop it.
 *
 *   npm run dev:local
 */
import { startLocalPostgres } from './local-postgres.js';

const db = await startLocalPostgres();
process.env.DATABASE_URL = db.url;
process.env.JWT_SECRET ||= 'dev-local-secret';
process.env.NODE_ENV ||= 'development';

const { ensureDatabase, transaction } = await import('../src/config/database.js');
await ensureDatabase();

const { createUser, incrementCounters } = await import('../src/db/users.js');
const { insertIncident, addStatusHistory, calculatePriority } = await import('../src/db/incidents.js');

const password = 'password123';
await createUser({ name: 'Demo Admin', email: 'admin@demo.local', password, role: 'admin' });
await createUser({ name: 'Demo Responder', email: 'responder@demo.local', password, role: 'responder' });
const citizen = await createUser({ name: 'Demo Citizen', email: 'citizen@demo.local', password });

const seed = [
    { type: 'fire', title: 'Smoke from apartment block', description: 'Thick smoke from the 3rd floor, alarms ringing.', severity: 'critical', longitude: 77.5946, latitude: 12.9716, address: 'MG Road, Bengaluru' },
    { type: 'accident', title: 'Two-car collision at junction', description: 'Minor injuries, left lane blocked.', severity: 'high', longitude: 77.6101, latitude: 12.9352, address: 'Koramangala 80ft Rd' },
    { type: 'infrastructure', title: 'Large pothole on main road', description: 'Deep pothole causing vehicles to swerve.', severity: 'medium', longitude: 77.58, latitude: 12.99, address: 'Seshadri Rd' }
];
for (const s of seed) {
    await transaction(async (tx) => {
        const id = await insertIncident(tx, {
            ...s,
            reporterId: citizen.id,
            reporterName: citizen.name,
            priority: calculatePriority({ status: 'reported', type: s.type, severity: s.severity })
        });
        await addStatusHistory(tx, id, 'reported', { _id: citizen.id, name: citizen.name });
    });
}
await incrementCounters(citizen.id, { reported: seed.length });

await import('../src/server.js');

console.log(`
Local PostgreSQL ready with demo data (password for all: ${password}):
  admin@demo.local · responder@demo.local · citizen@demo.local`);

const shutdown = async () => {
    await db.stop().catch(() => {});
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

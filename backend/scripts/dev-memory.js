/**
 * Run the API against a throwaway in-memory MongoDB (no install needed).
 * Seeds demo accounts and a few incidents. Data is lost when you stop it.
 *
 *   npm run dev:memory
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri('incident-tracker');
process.env.JWT_SECRET ||= 'dev-memory-secret';
process.env.NODE_ENV ||= 'development';

await import('../src/server.js');

const { default: mongoose } = await import('mongoose');
const { default: User } = await import('../src/models/User.js');
const { default: Incident } = await import('../src/models/Incident.js');

// Wait for the server's DB connection, then seed
while (mongoose.connection.readyState !== 1) {
    await new Promise(r => setTimeout(r, 200));
}

const password = 'password123';
const [admin, responder, citizen] = await User.create([
    { name: 'Demo Admin', email: 'admin@demo.local', password, role: 'admin' },
    { name: 'Demo Responder', email: 'responder@demo.local', password, role: 'responder' },
    { name: 'Demo Citizen', email: 'citizen@demo.local', password, role: 'citizen' }
]);

const seed = [
    { type: 'fire', title: 'Smoke from apartment block', description: 'Thick smoke from the 3rd floor, alarms ringing.', severity: 'critical', coords: [77.5946, 12.9716], address: 'MG Road, Bengaluru' },
    { type: 'accident', title: 'Two-car collision at junction', description: 'Minor injuries, left lane blocked.', severity: 'high', coords: [77.6101, 12.9352], address: 'Koramangala 80ft Rd' },
    { type: 'infrastructure', title: 'Large pothole on main road', description: 'Deep pothole causing vehicles to swerve.', severity: 'medium', coords: [77.5800, 12.9900], address: 'Seshadri Rd' }
];
for (const s of seed) {
    const inc = new Incident({
        type: s.type, title: s.title, description: s.description, severity: s.severity,
        location: { type: 'Point', coordinates: s.coords, address: s.address },
        reporter: { userId: citizen._id, name: citizen.name },
        statusHistory: [{ status: 'reported', changedBy: citizen._id, changedByName: citizen.name }]
    });
    inc.priority = inc.calculatePriority();
    await inc.save();
}
await User.updateOne({ _id: citizen._id }, { incidentsReported: seed.length });

console.log(`
In-memory database ready with demo data (password for all: ${password}):
  admin@demo.local · responder@demo.local · citizen@demo.local
Admin id ${admin._id}, responder id ${responder._id}`);

const shutdown = async () => {
    await mongo.stop();
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

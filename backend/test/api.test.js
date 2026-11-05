/**
 * End-to-end API tests against an in-memory MongoDB.
 * Run: npm test
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const { createApp } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: Incident } = await import('../src/models/Incident.js');

let mongo;
let server;
let base;

const call = async (method, path, { token, body } = {}) => {
    const res = await fetch(`${base}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    });
    return { status: res.status, body: await res.json() };
};

const register = async (name, email) => {
    const res = await call('POST', '/api/auth/register', { body: { name, email, password: 'secret123' } });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body.data;
};

const promote = async (email, role) => {
    await User.updateOne({ email }, { role });
    const res = await call('POST', '/api/auth/login', { body: { email, password: 'secret123' } });
    return res.body.data.token;
};

const incidentBody = (overrides = {}) => ({
    type: 'fire',
    title: 'Smoke from building',
    description: 'Thick smoke coming out of the third floor windows',
    severity: 'high',
    location: { coordinates: [77.5946, 12.9716], address: 'MG Road' },
    ...overrides
});

before(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await Incident.createIndexes();
    await User.createIndexes();
    const app = createApp();
    server = createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    server?.close();
    await mongoose.disconnect();
    await mongo?.stop();
});

let citizen, other, third, adminToken, responderToken, responderId, incidentId;

test('health reports a connected database', async () => {
    const res = await call('GET', '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.database, 'connected');
});

test('registration always creates citizens, even if a role is sent', async () => {
    const res = await call('POST', '/api/auth/register', {
        body: { name: 'Mallory', email: 'mallory@test.com', password: 'secret123', role: 'admin' }
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.role, 'citizen');
    assert.ok(res.body.data.user._id);
});

test('login rejects a wrong password with 401', async () => {
    const res = await call('POST', '/api/auth/login', { body: { email: 'mallory@test.com', password: 'nope' } });
    assert.equal(res.status, 401);
});

test('set up users', async () => {
    citizen = await register('Citizen One', 'c1@test.com');
    other = await register('Citizen Two', 'c2@test.com');
    third = await register('Citizen Three', 'c3@test.com');
    const four = await register('Citizen Four', 'c4@test.com');
    assert.ok(four.token);
    await register('Admin', 'admin@test.com');
    adminToken = await promote('admin@test.com', 'admin');
    const resp = await register('Responder', 'resp@test.com');
    responderId = resp.user._id;
    responderToken = await promote('resp@test.com', 'responder');
});

test('citizen can report an incident with priority calculated', async () => {
    const res = await call('POST', '/api/incidents', { token: citizen.token, body: incidentBody() });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.data.status, 'reported');
    assert.equal(res.body.data.reporter.name, 'Citizen One');
    assert.ok(res.body.data.priority > 0);
    incidentId = res.body.data._id;
});

test('anonymous report nearby is flagged as a possible duplicate', async () => {
    const res = await call('POST', '/api/incidents', {
        body: incidentBody({ title: 'Fire near MG Road', location: { coordinates: [77.5950, 12.9718] } })
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.reporter.name, 'Anonymous');
    assert.equal(res.body.possibleDuplicates.length, 1);
    assert.equal(res.body.data.duplicateOf._id, incidentId);
});

test('invalid incident input is rejected', async () => {
    const bad = await call('POST', '/api/incidents', { body: incidentBody({ type: 'alien' }) });
    assert.equal(bad.status, 400);
    const noLoc = await call('POST', '/api/incidents', { body: incidentBody({ location: {} }) });
    assert.equal(noLoc.status, 400);
});

test('reporter cannot verify own report; others verify once; 3 verifications auto-verify', async () => {
    const own = await call('POST', `/api/incidents/${incidentId}/verify`, { token: citizen.token });
    assert.equal(own.status, 400);

    const v1 = await call('POST', `/api/incidents/${incidentId}/verify`, { token: other.token });
    assert.equal(v1.status, 200);
    assert.equal(v1.body.data.verificationCount, 1);

    const again = await call('POST', `/api/incidents/${incidentId}/verify`, { token: other.token });
    assert.equal(again.status, 400);

    await call('POST', `/api/incidents/${incidentId}/verify`, { token: third.token });
    const four = await call('POST', '/api/auth/login', { body: { email: 'c4@test.com', password: 'secret123' } });
    const v3 = await call('POST', `/api/incidents/${incidentId}/verify`, { token: four.body.data.token });
    assert.equal(v3.body.data.verificationCount, 3);
    assert.equal(v3.body.data.status, 'verified');
});

test('citizens cannot update status; responders can assign and resolve', async () => {
    const denied = await call('PUT', `/api/incidents/${incidentId}`, { token: citizen.token, body: { status: 'resolved' } });
    assert.equal(denied.status, 403);

    const assigned = await call('PUT', `/api/incidents/${incidentId}`, { token: adminToken, body: { assignedTo: responderId } });
    assert.equal(assigned.status, 200);
    assert.equal(assigned.body.data.status, 'in-progress');
    assert.equal(assigned.body.data.assignedTo.name, 'Responder');

    const resolved = await call('PUT', `/api/incidents/${incidentId}`, { token: responderToken, body: { status: 'resolved' } });
    assert.equal(resolved.body.data.status, 'resolved');
    assert.ok(resolved.body.data.resolvedAt);
    assert.equal(resolved.body.data.priority, 0);
    assert.ok(resolved.body.data.statusHistory.length >= 4);
});

test('reporter earns reputation when their report is verified and resolved', async () => {
    const me = await call('GET', '/api/auth/me', { token: citizen.token });
    assert.equal(me.body.data.incidentsReported, 1);
    assert.ok(me.body.data.reputation >= 7);
});

test('internal notes are visible to staff only', async () => {
    const add = await call('POST', `/api/incidents/${incidentId}/notes`, { token: responderToken, body: { note: 'Unit 4 on scene' } });
    assert.equal(add.status, 200);
    assert.equal(add.body.data.adminNotes[0].adminName, 'Responder');

    const publicView = await call('GET', `/api/incidents/${incidentId}`);
    assert.equal(publicView.body.data.adminNotes, undefined);
    assert.equal(publicView.body.data.reporter.contact, undefined);

    const staffView = await call('GET', `/api/incidents/${incidentId}`, { token: adminToken });
    assert.equal(staffView.body.data.adminNotes.length, 1);
});

test('comments: add, list, delete own only', async () => {
    const add = await call('POST', `/api/incidents/${incidentId}/comments`, { token: other.token, body: { content: 'I can see it too' } });
    assert.equal(add.status, 201);
    const list = await call('GET', `/api/incidents/${incidentId}/comments`);
    assert.equal(list.body.count, 1);
    const forbidden = await call('DELETE', `/api/comments/${add.body.data._id}`, { token: citizen.token });
    assert.equal(forbidden.status, 403);
    const ok = await call('DELETE', `/api/comments/${add.body.data._id}`, { token: other.token });
    assert.equal(ok.status, 200);
});

test('listing supports filters, search, mine and priority sort', async () => {
    const all = await call('GET', '/api/incidents?sort=-priority');
    assert.equal(all.body.total, 2);
    const open = await call('GET', '/api/incidents?status=open');
    assert.equal(open.body.total, 1);
    const search = await call('GET', '/api/incidents?search=MG%20Road');
    assert.equal(search.body.total, 2);
    const mine = await call('GET', '/api/incidents?mine=true', { token: citizen.token });
    assert.equal(mine.body.total, 1);
    const mineAnon = await call('GET', '/api/incidents?mine=true');
    assert.equal(mineAnon.status, 401);
});

test('nearby and analytics endpoints', async () => {
    const near = await call('GET', '/api/incidents/nearby?longitude=77.5946&latitude=12.9716&maxDistance=2000');
    assert.equal(near.body.count, 2);
    const stats = await call('GET', '/api/analytics/stats');
    assert.equal(stats.body.data.totalIncidents, 2);
    assert.equal(stats.body.data.resolvedIncidents, 1);
    assert.equal(stats.body.data.totalUsers, undefined);
    const staffStats = await call('GET', '/api/analytics/stats', { token: adminToken });
    assert.ok(staffStats.body.data.totalUsers >= 7);
    const trends = await call('GET', '/api/analytics/trends?days=7');
    assert.equal(trends.body.data.length, 7);
    assert.equal(trends.body.data.at(-1).reported, 2);
});

test('admin user management', async () => {
    const responders = await call('GET', '/api/users/responders', { token: responderToken });
    assert.equal(responders.status, 200);
    assert.ok(responders.body.data.some(r => r.name === 'Responder'));

    const denied = await call('GET', '/api/users', { token: responderToken });
    assert.equal(denied.status, 403);

    const promoteRes = await call('PUT', `/api/users/${other.user._id}`, { token: adminToken, body: { role: 'responder' } });
    assert.equal(promoteRes.body.data.role, 'responder');

    const deactivate = await call('PUT', `/api/users/${third.user._id}`, { token: adminToken, body: { isActive: false } });
    assert.equal(deactivate.body.data.isActive, false);
    const blocked = await call('GET', '/api/auth/me', { token: third.token });
    assert.equal(blocked.status, 401);
});

test('admin can delete an incident', async () => {
    const res = await call('DELETE', `/api/incidents/${incidentId}`, { token: adminToken });
    assert.equal(res.status, 200);
    const gone = await call('GET', `/api/incidents/${incidentId}`);
    assert.equal(gone.status, 404);
});

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool, types } = pg;

// Return NUMERIC (priority) as a JS number and COUNT(*) (int8) as a number
types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));
types.setTypeParser(20, (v) => (v === null ? null : Number(v)));

const SCHEMA_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../db/schema.sql');

let pool = null;

const needsSsl = (url) =>
    !/localhost|127\.0\.0\.1/.test(url) && !/sslmode=disable/.test(url);

export const getPool = () => {
    if (!pool) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('DATABASE_URL is not set. Use your Supabase Postgres connection string.');
        }
        pool = new Pool({
            connectionString,
            ssl: needsSsl(connectionString) ? { rejectUnauthorized: false } : false,
            max: Number(process.env.DB_POOL_SIZE) || 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
        });
        pool.on('error', (err) => console.error('Postgres pool error:', err.message));
    }
    return pool;
};

export const query = (text, params) => getPool().query(text, params);

// Run fn(client) inside a transaction
export const transaction = async (fn) => {
    const client = await getPool().connect();
    try {
        await client.query('begin');
        const result = await fn(client);
        await client.query('commit');
        return result;
    } catch (error) {
        await client.query('rollback').catch(() => {});
        throw error;
    } finally {
        client.release();
    }
};

export const migrate = async () => {
    const sql = await fs.promises.readFile(SCHEMA_PATH, 'utf8');
    await query(sql);
};

let ready = null;

// Connect + apply schema once (safe to call on every request in serverless)
export const ensureDatabase = () => {
    if (!ready) {
        ready = (async () => {
            await query('select 1');
            if (process.env.DB_AUTO_MIGRATE !== 'false') await migrate();
        })().catch((err) => {
            ready = null;
            throw err;
        });
    }
    return ready;
};

export const isDatabaseHealthy = async () => {
    try {
        await query('select 1');
        return true;
    } catch {
        return false;
    }
};

export const closeDatabase = async () => {
    if (pool) {
        const p = pool;
        pool = null;
        ready = null;
        await p.end();
    }
};

const connectDB = async () => {
    try {
        await ensureDatabase();
        const host = new URL(process.env.DATABASE_URL).hostname;
        console.log(`Postgres connected: ${host}`);
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

export default connectDB;

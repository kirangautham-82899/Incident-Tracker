/**
 * Vercel serverless entry point for the REST API.
 *
 * Vercel functions are short-lived, so Socket.IO (live push + community chat)
 * is not available here; the frontend automatically falls back to polling.
 * For full real-time features run `npm start` on a persistent host instead
 * (Railway, Render, Fly.io, a VM...).
 */
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';

let connection = null;

const connect = () => {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not configured');
    }
    if (!connection) {
        connection = mongoose
            .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
            .then(async (conn) => {
                await Promise.all(Object.values(mongoose.models).map(m => m.createIndexes().catch(() => {})));
                return conn;
            })
            .catch((err) => {
                connection = null; // retry on next request
                throw err;
            });
    }
    return connection;
};

const app = createApp({
    beforeRoutes: async (req, res, next) => {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ success: false, error: 'JWT_SECRET is not configured' });
        }
        try {
            await connect();
            next();
        } catch (error) {
            console.error('Database connection failed:', error.message);
            res.status(503).json({ success: false, error: 'Database unavailable' });
        }
    }
});

export default app;

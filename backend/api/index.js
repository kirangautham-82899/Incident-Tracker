/**
 * Vercel serverless entry point for the REST API.
 *
 * Vercel functions are short-lived, so Socket.IO (live push + community chat)
 * is not available here; the frontend automatically falls back to polling.
 * For full real-time features run `npm start` on a persistent host instead
 * (Render, Railway, Fly.io, a VM...).
 *
 * Use Supabase's *transaction pooler* connection string (port 6543) as
 * DATABASE_URL here, and set DB_POOL_SIZE=1.
 */
import { createApp } from '../src/app.js';
import { ensureDatabase } from '../src/config/database.js';

const app = createApp({
    beforeRoutes: async (req, res, next) => {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ success: false, error: 'JWT_SECRET is not configured' });
        }
        try {
            await ensureDatabase();
            next();
        } catch (error) {
            console.error('Database connection failed:', error.message);
            res.status(503).json({ success: false, error: 'Database unavailable' });
        }
    }
});

export default app;

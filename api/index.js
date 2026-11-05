/**
 * Vercel serverless function serving the whole REST API under /api/*.
 * The website (frontend/dist) and this API are deployed together as one
 * Vercel project, so the browser calls the API on the same origin.
 *
 * Serverless functions can't hold WebSocket connections, so Socket.IO is off
 * here; the frontend polls for updates instead (VITE_ENABLE_SOCKET=false).
 *
 * Required Vercel env vars: DATABASE_URL (Supabase *transaction pooler*,
 * port 6543), JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Recommended: DB_POOL_SIZE=1, DB_AUTO_MIGRATE=false (run `npm run db:migrate` once).
 */
import { createApp } from '../backend/src/app.js';
import { ensureDatabase } from '../backend/src/config/database.js';

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

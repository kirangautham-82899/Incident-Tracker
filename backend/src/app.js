import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { UPLOAD_DIR } from './controllers/uploadController.js';
import { isDatabaseHealthy } from './config/database.js';

import authRoutes from './routes/auth.js';
import incidentRoutes from './routes/incidents.js';
import commentRoutes from './routes/comments.js';
import analyticsRoutes from './routes/analytics.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/uploads.js';

// Origins allowed to call the API cross-origin. In production the site and API
// share one origin on Vercel, so this mainly covers local dev, FRONTEND_URL
// (comma separated) and this project's own Vercel preview deployments.
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'https://incident-tracker-alpha.vercel.app',
    ...(process.env.FRONTEND_URL || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean)
];
const PREVIEW_ORIGIN = /^https:\/\/incident-tracker-[a-z0-9-]+-kiran-gauthams-projects-7cd1bdee\.vercel\.app$/;

export const corsOptions = {
    origin: (origin, callback) => {
        // Requests without an Origin (curl, server-to-server) carry no browser credentials
        if (!origin) return callback(null, true);
        // Unknown origins simply get no CORS headers, so the browser blocks them
        callback(null, allowedOrigins.includes(origin) || PREVIEW_ORIGIN.test(origin));
    },
    // Auth uses Bearer tokens, not cookies
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600
};

export const createApp = ({ beforeRoutes } = {}) => {
    const app = express();

    app.set('trust proxy', 1);
    app.disable('x-powered-by');
    // Security headers. Responses are JSON, so the strictest CSP applies.
    app.use(helmet({
        contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
        crossOriginResourcePolicy: { policy: 'cross-origin' } // locally stored uploads are shown by the site
    }));
    app.use(cors(corsOptions));
    if (beforeRoutes) app.use(beforeRoutes);
    app.use(express.json({ limit: '100kb' }));
    app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', dotfiles: 'deny', index: false }));

    if (process.env.NODE_ENV === 'development') {
        app.use((req, res, next) => {
            console.log(`${req.method} ${req.originalUrl}`);
            next();
        });
    }

    app.get('/', (req, res) => {
        res.json({
            message: 'Incident Tracker API is running',
            version: '3.0.0',
            endpoints: {
                auth: '/api/auth',
                incidents: '/api/incidents',
                comments: '/api/comments',
                analytics: '/api/analytics',
                users: '/api/users',
                uploads: '/api/uploads',
                health: '/api/health'
            }
        });
    });

    app.get('/api/health', async (req, res) => {
        const database = (await isDatabaseHealthy()) ? 'connected' : 'disconnected';
        res.status(database === 'connected' ? 200 : 503).json({
            status: database === 'connected' ? 'OK' : 'DEGRADED',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database
        });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/incidents', incidentRoutes);
    app.use('/api/comments', commentRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/uploads', uploadRoutes);

    app.use(notFound);
    app.use(errorHandler);

    return app;
};

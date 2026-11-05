import express from 'express';
import cors from 'cors';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { UPLOAD_DIR } from './controllers/uploadController.js';
import { isDatabaseHealthy } from './config/database.js';

import authRoutes from './routes/auth.js';
import incidentRoutes from './routes/incidents.js';
import commentRoutes from './routes/comments.js';
import analyticsRoutes from './routes/analytics.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/uploads.js';

// Origins allowed to call the API: local dev, FRONTEND_URL (comma separated
// list allowed) and any *.vercel.app preview deployment.
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    ...(process.env.FRONTEND_URL || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean)
];

export const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(new URL(origin).hostname)) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

export const createApp = ({ beforeRoutes } = {}) => {
    const app = express();

    app.set('trust proxy', 1);
    app.use(cors(corsOptions));
    if (beforeRoutes) app.use(beforeRoutes);
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

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

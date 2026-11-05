import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import { createApp, corsOptions } from './app.js';
import { setupSocket } from './utils/realtime.js';

dotenv.config({ quiet: true });

if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        console.error('JWT_SECRET must be set in production. Exiting.');
        process.exit(1);
    }
    process.env.JWT_SECRET = 'dev-only-insecure-secret';
    console.warn('JWT_SECRET not set - using an insecure development secret.');
}

const app = createApp();
const httpServer = createServer(app);

const io = new Server(httpServer, { cors: corsOptions });
setupSocket(io);
app.set('io', io);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`Incident Tracker API listening on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
});

export { io };

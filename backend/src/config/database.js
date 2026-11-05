import mongoose from 'mongoose';

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set. Copy backend/.env.example to backend/.env and fill it in.');
        process.exit(1);
    }

    mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err.message);
    });
    mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
    });

    try {
        const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
        console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
        // Make sure geo/text indexes exist before the first $near query
        await Promise.all(Object.values(mongoose.models).map(m => m.createIndexes().catch(() => {})));
        return conn;
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

export default connectDB;

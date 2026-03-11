import mongoose from 'mongoose';

// Global cache for serverless
let cachedConnection: typeof mongoose | null = null;

const connectDB = async () => {
    if (cachedConnection) {
        console.log('Using cached MongoDB connection');
        return cachedConnection;
    }

    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.warn('WARNING: MONGO_URI is not defined! Using localhost fallback.');
        }

        console.log('Connecting to MongoDB...');
        const conn = await mongoose.connect(uri || 'mongodb://localhost:27017/postersensei');
        cachedConnection = conn;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        return conn;
    } catch (error: any) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
    }
};

export default connectDB;

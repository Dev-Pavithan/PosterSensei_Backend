import mongoose from 'mongoose';

// Global cache for serverless
let cachedConnection: typeof mongoose | null = null;

const connectDB = async () => {
    if (cachedConnection) {
        console.log('Using cached MongoDB connection');
        return cachedConnection;
    }

    try {
        const uri = 'mongodb://pavithanunenthiran29_db_user:bX4R9TEyHMrPsVvM@ac-adimnut-shard-00-00.kxpruxy.mongodb.net:27017,ac-adimnut-shard-00-01.kxpruxy.mongodb.net:27017,ac-adimnut-shard-00-02.kxpruxy.mongodb.net:27017/postersensei?ssl=true&replicaSet=atlas-bqrye6-shard-0&authSource=admin&retryWrites=true&w=majority';
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
        throw error;
    }
};

export default connectDB;

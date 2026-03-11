import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import uploadRoutes from './routes/uploadRoutes';
import orderRoutes from './routes/orderRoutes';
import couponRoutes from './routes/couponRoutes';
import cookie_parser from 'cookie-parser';
import { notFound, errorHandler } from './middleware/errorMiddleware';

dotenv.config();

// Global DB connection is now handled per-request via middleware for Serverless
const app = express();
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://poster-sensei-frontend.vercel.app',
        'https://poster-sensei.vercel.app'
    ].filter(Boolean),
    credentials: true,
}));
app.use(express.json());
app.use(cookie_parser());

// Ensure DB is connected before handling any API requests
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(500).json({ message: 'Database connection failed. Please check Vercel MONGO_URI and IP Whitelist.' });
    }
});

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);

app.get('/', (req, res) => {
    res.send('PosterSensei API is running...');
});

// Diagnostic Health check for Vercel
app.get('/api/health', (req, res) => {
    const hasMongoURI = !!process.env.MONGO_URI;
    res.status(200).json({ 
        status: 'ok', 
        message: 'API is healthy',
        diagnostics: {
            hasMongoURI: hasMongoURI,
            dbState: require('mongoose').connection.readyState
        }
    });
});

app.use(notFound);
app.use(errorHandler);

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;

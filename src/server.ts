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

// Only connect to DB if we're not in a build environment
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookie_parser());

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);

app.get('/', (req, res) => {
    res.send('PosterSensei API is running...');
});

// Health check for Vercel
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is healthy' });
});

app.use(notFound);
app.use(errorHandler);

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;

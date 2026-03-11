import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Coupon from './src/models/Coupon';

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI!);
        await Coupon.deleteMany({ code: 'WELCOME10' });
        await Coupon.create({
            code: 'WELCOME10',
            discountType: 'percentage',
            discountAmount: 10,
            minPurchase: 500,
            isActive: true
        });
        console.log('Coupon seeded!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product';
import Coupon from './models/Coupon';

dotenv.config();

const checkDb = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env');
        }
        await mongoose.connect(process.env.MONGO_URI);
        const productsCount = await Product.countDocuments();
        console.log(`Products in DB: ${productsCount}`);
        
        if (productsCount === 0) {
            console.log('Seeding products...');
            await Product.create([
                {
                    title: 'Goku Ultra Instinct Poster',
                    price: 499,
                    originalPrice: 799,
                    discount: 37,
                    anime: 'Dragon Ball Super',
                    category: 'Posters',
                    imageUrl: 'https://images.unsplash.com/photo-1541562232579-512a21360020?w=800',
                    stock: 50,
                    description: 'Premium Goku Ultra Instinct poster.',
                    rating: 4.8,
                    numReviews: 120,
                    featured: true,
                    tags: ['goku', 'dragonball', 'ultra instinct'],
                    sizes: ['A4', 'A3', 'A2']
                },
                {
                    title: 'Naruto Sage Mode',
                    price: 399,
                    originalPrice: 599,
                    discount: 33,
                    anime: 'Naruto',
                    category: 'Posters',
                    imageUrl: 'https://images.unsplash.com/photo-1578632738980-23053520f393?w=800',
                    stock: 30,
                    description: 'Naruto Sage Mode high quality print.',
                    rating: 4.5,
                    numReviews: 85,
                    featured: true,
                    tags: ['naruto', 'sage mode'],
                    sizes: ['A4', 'A3']
                }
            ]);
            console.log('Products seeded.');
        }

        const coupon = await Coupon.findOne({ code: 'WELCOME10' });
        if (!coupon) {
            await Coupon.create({
                code: 'WELCOME10',
                discountType: 'percentage',
                discountAmount: 10,
                minPurchase: 500,
                isActive: true
            });
            console.log('Coupon created.');
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error during seeding:', err);
        process.exit(1);
    }
};

checkDb();

import { test, expect } from '@playwright/test';
import mongoose from 'mongoose';
import User from '../src/models/User';
import Product from '../src/models/Product';
import Order from '../src/models/Order';
import bcrypt from 'bcryptjs';

let adminToken = '';
let userToken = '';
let productId = '';
let orderId = '';

test.beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/postersensei';
    await mongoose.connect(mongoUri);

    // Clean up
    await User.deleteMany({ email: { $in: ['orderadmin@example.com', 'orderuser@example.com'] } });
    await Order.deleteMany({});
    
    // Create Admin and User
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password', salt);
    await User.create({ name: 'Admin', email: 'orderadmin@example.com', password, isAdmin: true });
    await User.create({ name: 'User', email: 'orderuser@example.com', password, isAdmin: false });

    // Create a product to order
    const product = await Product.create({
        title: 'Order Test Poster',
        anime: 'Test Anime',
        price: 15.00,
        imageUrl: '/test.jpg',
        stock: 10
    });
    productId = product._id.toString();
});

test.afterAll(async () => {
    await mongoose.disconnect();
});

test.describe('Order API Tests', () => {

    test('Authenticate users', async ({ request }) => {
        // Admin login
        let res = await request.post('/api/users/login', { data: { email: 'orderadmin@example.com', password: 'password' } });
        adminToken = res.headers()['set-cookie']?.split(';')[0]?.split('=')[1] || '';

        // User login
        res = await request.post('/api/users/login', { data: { email: 'orderuser@example.com', password: 'password' } });
        userToken = res.headers()['set-cookie']?.split(';')[0]?.split('=')[1] || '';
    });

    test('POST /api/orders - Fail without login', async ({ request }) => {
        const res = await request.post('/api/orders', {
            data: { orderItems: [] }
        });
        expect(res.status()).toBe(401);
    });

    test('POST /api/orders - Create order successfully', async ({ request }) => {
        const res = await request.post('/api/orders', {
            headers: { Authorization: `Bearer ${userToken}` },
            data: {
                orderItems: [{
                    title: 'Test Poster',
                    qty: 2,
                    image: '/test.jpg',
                    price: 15.00,
                    product: productId
                }],
                deliveryMethod: 'post',
                shippingAddress: { address: '123 Main St', city: 'Test City', postalCode: '12345', country: 'TestCountry' },
                paymentMethod: 'Cash On Delivery',
                totalPrice: 30.00
            }
        });

        expect(res.status()).toBe(201);
        const data = await res.json();
        expect(data.totalPrice).toBe(30);
        expect(data.isDelivered).toBe(false);
        orderId = data._id;
    });

    test('GET /api/orders/myorders - User can fetch their orders', async ({ request }) => {
        const res = await request.get('/api/orders/myorders', {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        expect(res.status()).toBe(200);
        const data = await res.json();
        expect(data.length).toBeGreaterThanOrEqual(1);
        expect(data[0]._id).toBe(orderId);
    });

    test('GET /api/orders/:id - Fetch single order', async ({ request }) => {
        const res = await request.get(`/api/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        expect(res.status()).toBe(200);
        const data = await res.json();
        expect(data._id).toBe(orderId);
    });

    test('GET /api/orders - Admin can view all orders', async ({ request }) => {
        let res = await request.get('/api/orders', { headers: { Authorization: `Bearer ${userToken}` } });
        expect(res.status()).toBe(401); // User fails

        res = await request.get('/api/orders', { headers: { Authorization: `Bearer ${adminToken}` } });
        expect(res.status()).toBe(200); // Admin passes
        expect((await res.json()).length).toBeGreaterThanOrEqual(1);
    });

    test('PUT /api/orders/:id/deliver - Admin marks order delivered', async ({ request }) => {
        let res = await request.put(`/api/orders/${orderId}/deliver`, { headers: { Authorization: `Bearer ${userToken}` } });
        expect(res.status()).toBe(401); // User fails

        res = await request.put(`/api/orders/${orderId}/deliver`, { headers: { Authorization: `Bearer ${adminToken}` } });
        expect(res.status()).toBe(200); // Admin passes
        const data = await res.json();
        expect(data.isDelivered).toBe(true);
    });
});

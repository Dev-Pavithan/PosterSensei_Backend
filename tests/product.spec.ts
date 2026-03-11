import { test, expect } from '@playwright/test';
import mongoose from 'mongoose';
import User from '../src/models/User';
import Product from '../src/models/Product';
import bcrypt from 'bcryptjs';

let adminToken = '';
let userToken = '';
let productId = '';

test.beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/postersensei';
    await mongoose.connect(mongoUri);

    // Clean up
    await User.deleteMany({ email: { $in: ['productadmin@example.com', 'productuser@example.com'] } });
    await Product.deleteMany({ title: { $regex: 'Test Poster' } });

    // Create Admin
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password', salt);
    await User.create({ name: 'Admin', email: 'productadmin@example.com', password, isAdmin: true });
    
    // Create Normal User
    await User.create({ name: 'User', email: 'productuser@example.com', password, isAdmin: false });
});

test.afterAll(async () => {
    await mongoose.disconnect();
});

test.describe('Product API Tests', () => {

    test('Authenticate users', async ({ request }) => {
        // Admin login
        let res = await request.post('/api/users/login', { data: { email: 'productadmin@example.com', password: 'password' } });
        adminToken = res.headers()['set-cookie']?.split(';')[0]?.split('=')[1] || '';

        // User login
        res = await request.post('/api/users/login', { data: { email: 'productuser@example.com', password: 'password' } });
        userToken = res.headers()['set-cookie']?.split(';')[0]?.split('=')[1] || '';

        expect(adminToken).toBeTruthy();
        expect(userToken).toBeTruthy();
    });

    test('GET /api/products - Should return empty or list of products', async ({ request }) => {
        const res = await request.get('/api/products');
        expect(res.status()).toBe(200);
        expect(Array.isArray(await res.json())).toBe(true);
    });

    test('POST /api/products - Should fail for unauthenticated non-admin', async ({ request }) => {
        // No token
        let res = await request.post('/api/products');
        expect(res.status()).toBe(401);

        // User token
        res = await request.post('/api/products', { headers: { Authorization: `Bearer ${userToken}` } });
        expect(res.status()).toBe(401); // "Not authorized as an admin"
    });

    test('POST /api/products - Admin can create a sample product', async ({ request }) => {
        const res = await request.post('/api/products', { headers: { Authorization: `Bearer ${adminToken}` } });
        expect(res.status()).toBe(201);
        const data = await res.json();
        expect(data.title).toBe('Sample title');
        productId = data._id;
    });

    test('PUT /api/products/:id - Should fail for non-admin', async ({ request }) => {
        const res = await request.put(`/api/products/${productId}`, { 
            headers: { Authorization: `Bearer ${userToken}` },
            data: { title: 'User Edit' }
        });
        expect(res.status()).toBe(401);
    });

    test('PUT /api/products/:id - Admin can update product', async ({ request }) => {
        const res = await request.put(`/api/products/${productId}`, { 
            headers: { Authorization: `Bearer ${adminToken}` },
            data: { title: 'Test Poster Updated', price: 29.99 }
        });
        expect(res.status()).toBe(200);
        const data = await res.json();
        expect(data.title).toBe('Test Poster Updated');
        expect(data.price).toBe(29.99);
    });

    test('GET /api/products/:id - Fetch single product', async ({ request }) => {
        const res = await request.get(`/api/products/${productId}`);
        expect(res.status()).toBe(200);
        const data = await res.json();
        expect(data.title).toBe('Test Poster Updated');
    });

    test('DELETE /api/products/:id - Should fail for non-admin', async ({ request }) => {
        const res = await request.delete(`/api/products/${productId}`, { 
            headers: { Authorization: `Bearer ${userToken}` }
        });
        expect(res.status()).toBe(401);
    });

    test('DELETE /api/products/:id - Admin can delete product', async ({ request }) => {
        const res = await request.delete(`/api/products/${productId}`, { 
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        expect(res.status()).toBe(200);
        const data = await res.json();
        expect(data.message).toBe('Product removed');
    });

    test('GET /api/products/:id - Should return 404 for deleted product', async ({ request }) => {
        const res = await request.get(`/api/products/${productId}`);
        expect(res.status()).toBe(404);
    });
});

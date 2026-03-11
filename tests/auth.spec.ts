import { test, expect } from '@playwright/test';
import mongoose from 'mongoose';
import User from '../src/models/User';

// We need to connect to MongoDB directly to clean up test users before/after tests
test.beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/postersensei';
    await mongoose.connect(mongoUri);
});

test.afterAll(async () => {
    await mongoose.disconnect();
});

test.beforeEach(async () => {
    // Clean up test users
    await User.deleteMany({ email: { $in: ['testuser@example.com', 'testadmin@example.com', 'newuser@example.com'] } });
});

test.describe('Auth API Tests', () => {

    test('should register a new USER successfully', async ({ request }) => {
        const response = await request.post('/api/users', {
            data: {
                name: 'Test User',
                email: 'testuser@example.com',
                password: 'password123'
            }
        });
        
        expect(response.status()).toBe(201);
        const data = await response.json();
        expect(data.name).toBe('Test User');
        expect(data.email).toBe('testuser@example.com');
        expect(data.isAdmin).toBe(false);
        expect(data._id).toBeDefined();

        // Check if cookie is set
        const headers = response.headers();
        expect(headers['set-cookie']).toContain('jwt=');
    });

    test('should fail to register with existing email', async ({ request }) => {
        // Create first user
        await request.post('/api/users', {
            data: { name: 'First User', email: 'newuser@example.com', password: 'password123' }
        });

        // Try to create again
        const response2 = await request.post('/api/users', {
            data: { name: 'Duplicate User', email: 'newuser@example.com', password: 'password123' }
        });

        expect(response2.status()).toBe(400);
        const data = await response2.json();
        expect(data.message).toBe('User already exists');
    });

    test('should login an existing USER successfully', async ({ request }) => {
        // First register
        await request.post('/api/users', {
            data: { name: 'Login User', email: 'testuser@example.com', password: 'password123' }
        });

        // Then login
        const response = await request.post('/api/users/login', {
            data: {
                email: 'testuser@example.com',
                password: 'password123'
            }
        });

        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.email).toBe('testuser@example.com');
        
        const headers = response.headers();
        expect(headers['set-cookie']).toContain('jwt=');
    });

    test('should fail login with incorrect password', async ({ request }) => {
        // First register
        await request.post('/api/users', {
            data: { name: 'Login User', email: 'testuser@example.com', password: 'password123' }
        });

        // Then login with wrong pass
        const response = await request.post('/api/users/login', {
            data: {
                email: 'testuser@example.com',
                password: 'wrongpassword'
            }
        });

        expect(response.status()).toBe(401);
        const data = await response.json();
        expect(data.message).toBe('Invalid email or password');
    });

    test('ADMIN role can login (mocking admin creation)', async ({ request }) => {
        // We'll create an admin directly via mongoose for this test
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('adminpass', salt);
        await User.create({
            name: 'Admin User',
            email: 'testadmin@example.com',
            password,
            isAdmin: true
        });

        const response = await request.post('/api/users/login', {
            data: { email: 'testadmin@example.com', password: 'adminpass' }
        });

        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.isAdmin).toBe(true);
    });
});

import { test, expect } from '@playwright/test';

test.describe('Product API CRUD Tests', () => {
    const adminEmail = 'pavithanunenthiran29@gmail.com';
    const adminPassword = '1234567890';
    let adminCookie = '';

    test.beforeAll(async ({ request }) => {
        const loginRes = await request.post('/api/users/auth', {
            data: { email: adminEmail, password: adminPassword }
        });
        expect(loginRes.ok()).toBeTruthy();
        const setCookie = loginRes.headers()['set-cookie'];
        adminCookie = setCookie ? setCookie.split(';')[0] : '';
    });

    let productId = '';

    test('should create a new product with new schema', async ({ request }) => {
        const res = await request.post('/api/products', {
            data: {
                title: 'Test Poster',
                character: 'Test Character',
                category: 'Posters',
                price: 500,
                discount: 10,
                imageUrl: 'https://images.unsplash.com/photo-1541562232579-512a21360020',
                sizes: ['A4', 'A3'],
                description: 'Test description',
                orientation: 'Portrait'
            },
            headers: { Cookie: adminCookie }
        });

        expect(res.status()).toBe(201);
        const data = await res.json();
        expect(data.title).toBe('Test Poster');
        expect(data.character).toBe('Test Character');
        expect(data.orientation).toBe('Portrait');
        expect(data.anime).toBeUndefined();
        expect(data.stock).toBeUndefined();
        productId = data._id;
    });

    test('should fetch products with character filter', async ({ request }) => {
        const res = await request.get('/api/products?character=Test Character');
        expect(res.ok()).toBeTruthy();
        const data = await res.json();
        expect(data.products.length).toBeGreaterThan(0);
        expect(data.products[0].character).toBe('Test Character');
    });

    test('should update product with new fields', async ({ request }) => {
        const res = await request.put(`/api/products/${productId}`, {
            data: {
                title: 'Updated Title',
                character: 'Updated Character'
            },
            headers: { Cookie: adminCookie }
        });

        expect(res.ok()).toBeTruthy();
        const data = await res.json();
        expect(data.title).toBe('Updated Title');
        expect(data.character).toBe('Updated Character');
    });

    test('should delete product', async ({ request }) => {
        const res = await request.delete(`/api/products/${productId}`, {
            headers: { Cookie: adminCookie }
        });
        expect(res.ok()).toBeTruthy();
        
        const checkRes = await request.get(`/api/products/${productId}`);
        expect(checkRes.status()).toBe(404);
    });
});

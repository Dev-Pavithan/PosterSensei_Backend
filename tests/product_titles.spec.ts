import { test, expect } from '@playwright/test';

test.describe('Product Title API', () => {
    test.beforeEach(async ({ request }) => {
        // Assume server is running at http://127.0.0.1:5000
    });

    test('should fetch unique product titles', async ({ request }) => {
        const response = await request.get('/api/products/titles');
        expect(response.ok()).toBeTruthy();
        const titles = await response.json();
        expect(Array.isArray(titles)).toBeTruthy();
        // Since we have seed data, we expect some titles
        if (titles.length > 0) {
            expect(typeof titles[0]).toBe('string');
        }
    });

    test('should filter products by exact title', async ({ request }) => {
        // 1. Get a title from the list
        const titlesRes = await request.get('/api/products/titles');
        const titles = await titlesRes.json();
        if (titles.length === 0) return;

        const targetTitle = titles[0];

        // 2. Filter by that title
        const response = await request.get(`/api/products?title=${encodeURIComponent(targetTitle)}`);
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        const products = data.products || data;

        expect(products.length).toBeGreaterThan(0);
        products.forEach(p => {
            expect(p.title).toBe(targetTitle);
        });
    });
});

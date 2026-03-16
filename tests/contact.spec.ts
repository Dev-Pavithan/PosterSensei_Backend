import { test, expect } from '@playwright/test';

test.describe('Contact Us API', () => {
  test('should submit a contact message successfully', async ({ request }) => {
    const res = await request.post('/api/contact', {
      data: {
        name: 'Test Sender',
        email: 'sender@example.com',
        message: 'This is a test message from Playwright.',
      }
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.message).toContain('received successfully');
    expect(data.contact).toHaveProperty('_id');
  });

  test('should fail if required fields are missing', async ({ request }) => {
    const res = await request.post('/api/contact', {
      data: {
        name: 'Test Sender',
      }
    });
    expect(res.status()).toBe(400);
  });
});

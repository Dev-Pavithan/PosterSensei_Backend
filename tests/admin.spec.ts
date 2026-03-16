import { test, expect } from '@playwright/test';

test.describe('Admin API Tests', () => {
  const adminEmail = 'pavithanunenthiran29@gmail.com';
  const adminPassword = '12345678';
  let token = '';

  test('should fetch contact messages as admin', async ({ request }) => {
    // Login to get cookie in this specific test's context
    const loginRes = await request.post('/api/users/auth', {
      data: {
        email: adminEmail,
        password: adminPassword,
      }
    });
    
    expect(loginRes.ok()).toBeTruthy();

    // Pass the cookie explicitly
    const setCookie = loginRes.headers()['set-cookie'];
    const res = await request.get('/api/contact', {
      headers: {
        Cookie: setCookie ? setCookie.split(';')[0] : ''
      }
    });
    
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('should return 401 for contact messages if unauthorized', async ({ playwright }) => {
    // Create a fresh unauthenticated context
    const unauthContext = await playwright.request.newContext({
        baseURL: 'http://127.0.0.1:5000'
    });
    const res = await unauthContext.get('/api/contact');
    
    expect(res.status()).toBe(401);
  });
});

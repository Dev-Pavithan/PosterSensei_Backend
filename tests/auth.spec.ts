import { test, expect } from '@playwright/test';

test.describe('Forgot Password Flow', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const newPassword = 'NewPassword456!';

  test('should register a new user successfully', async ({ request }) => {
    const res = await request.post('/api/users', {
      data: {
        name: 'Test User',
        email: testEmail,
        password: testPassword,
      }
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('_id');
    expect(data.name).toBe('Test User');
    expect(data.email).toBe(testEmail);
  });

  test('should complete the forgot password flow', async ({ request }) => {
    // 1. Request reset code
    const forgotRes = await request.post('/api/users/forgot-password', {
      data: { email: testEmail }
    });
    expect(forgotRes.ok()).toBeTruthy();
    const forgotData = await forgotRes.json();
    expect(forgotData).toHaveProperty('code');
    const resetCode = forgotData.code;

    // 2. Verify reset code
    const verifyRes = await request.post('/api/users/verify-code', {
      data: { email: testEmail, code: resetCode }
    });
    expect(verifyRes.ok()).toBeTruthy();

    // 3. Reset password
    const resetRes = await request.post('/api/users/reset-password', {
      data: { email: testEmail, code: resetCode, password: newPassword }
    });
    expect(resetRes.ok()).toBeTruthy();

    // 4. Try logging in with new password
    const loginRes = await request.post('/api/users/login', {
      data: { email: testEmail, password: newPassword }
    });
    expect(loginRes.ok()).toBeTruthy();
  });
});

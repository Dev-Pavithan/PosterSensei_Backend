import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:5000',
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },
  projects: [
    {
      name: 'api',
      testMatch: /.*\.spec\.ts/,
    },
  ],
});

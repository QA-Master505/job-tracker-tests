import { APIRequestContext } from '@playwright/test';

const API_URL = process.env.API_URL || 'https://job-tracker-backend-production-7acf.up.railway.app';

export const TEST_PASSWORD = 'TestPlaywright1';

export interface TestUser {
  email: string;
  username: string;
  password: string;
}

export async function createTestUser(request: APIRequestContext): Promise<TestUser> {
  const ts = Date.now();
  const user: TestUser = {
    email:    `testuser${ts}@example.com`,  // ← example.com is RFC-reserved, always valid
    username: `pwuser${ts}`.slice(0, 50),
    password: TEST_PASSWORD,                // ← no special chars, just alpha+digit, min 8
  };

  const MAX_ATTEMPTS = 3;
  const RETRY_DELAY_MS = 2000;
  let lastBody = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await request.post(`${API_URL}/auth/register`, { data: user });

    if (res.ok()) return user;

    lastBody = await res.text();
    const status = res.status();

    if (status < 500) {
      throw new Error(
        `createTestUser failed — ${status} ${res.statusText()}\n${lastBody}`
      );
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw new Error(
    `createTestUser failed after ${MAX_ATTEMPTS} attempts — last error:\n${lastBody}`
  );
}
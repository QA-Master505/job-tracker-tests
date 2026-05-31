import { APIRequestContext } from '@playwright/test';

const API_URL = process.env.API_URL || 'https://job-tracker-backend-production-7acf.up.railway.app';

export const TEST_PASSWORD = 'TestPlaywright1';

export interface TestUser {
  email: string;
  username: string;
  password: string;
  /**
   * Raw cookie string ready to pass as a `Cookie:` request header.
   * Format: "access_token=<jwt>"
   * Populated immediately after registration by logging in once.
   */
  cookieHeader: string;
}

export async function createTestUser(request: APIRequestContext): Promise<TestUser> {
  const ts = Date.now();
  const user = {
    email:    `testuser${ts}@example.com`,
    username: `pwuser${ts}`.slice(0, 50),
    password: TEST_PASSWORD,
  };

  const MAX_ATTEMPTS = 3;
  const RETRY_DELAY_MS = 2000;
  let lastBody = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await request.post(`${API_URL}/auth/register`, { data: user });

    if (res.ok()) {
      // Registration succeeded — login once to capture the httpOnly cookie
      const loginRes = await request.post(`${API_URL}/auth/login`, {
        data: { email: user.email, password: user.password },
      });

      if (!loginRes.ok()) {
        throw new Error(
          `createTestUser: registration ok but login failed — ` +
          `${loginRes.status()} ${loginRes.statusText()}`,
        );
      }

      // headersArray() safely handles multiple Set-Cookie lines.
      // We keep only the name=value part — the server enforces HttpOnly/SameSite.
      const cookieHeader = loginRes
        .headersArray()
        .filter(h => h.name.toLowerCase() === 'set-cookie')
        .map(h => h.value.split(';')[0].trim())  // "access_token=<jwt>"
        .join('; ');

      return { ...user, cookieHeader };
    }

    lastBody = await res.text();
    const httpStatus = res.status();

    // 4xx = client error, retrying won't help
    if (httpStatus < 500) {
      throw new Error(
        `createTestUser failed — ${httpStatus} ${res.statusText()}\n${lastBody}`,
      );
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw new Error(
    `createTestUser failed after ${MAX_ATTEMPTS} attempts — last error:\n${lastBody}`,
  );
}

/**
 * Deletes the test user via DELETE /users/me.
 *
 * Auth priority:
 *   1. Cookie header  — uses cookieHeader if provided (preferred)
 *   2. Bearer token   — falls back to a fresh login + access_token from body
 *
 * Always silent — errors are swallowed so afterAll hooks never mask real failures.
 */
export async function deleteTestUser(
  request: APIRequestContext,
  email: string,
  password: string,
  cookieHeader?: string,
): Promise<void> {
  try {
    let authHeaders: Record<string, string>;

    if (cookieHeader) {
      authHeaders = { Cookie: cookieHeader };
    } else {
      const loginRes = await request.post(`${API_URL}/auth/login`, {
        data: { email, password },
      });
      if (!loginRes.ok()) return;
      const { access_token } = await loginRes.json();
      authHeaders = { Authorization: `Bearer ${access_token}` };
    }

    await request.delete(`${API_URL}/users/me`, { headers: authHeaders });
  } catch {
    // silently ignore — user may not exist or test failed before creation
  }
}

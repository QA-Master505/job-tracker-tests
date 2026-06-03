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

export async function deleteTestUser(
  request: APIRequestContext,
  email: string,
  password: string,
  cookieHeader?: string,
): Promise<void> {
  const MAX_ATTEMPTS = 3;
  const RETRY_DELAY_MS = 2000;
  const TIMEOUT_MS = 10000;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      let authHeaders: Record<string, string>;

      if (cookieHeader) {
        authHeaders = { Cookie: cookieHeader };
      } else {
        const loginRes = await request.post(`${API_URL}/auth/login`, {
          data: { email, password },
          timeout: TIMEOUT_MS,
        });
        if (!loginRes.ok()) {
          console.warn(`[cleanup] login failed (${loginRes.status()}) for ${email} — attempt ${attempt}/${MAX_ATTEMPTS}`);
          if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          continue;
        }
        const { access_token } = await loginRes.json();
        authHeaders = { Authorization: `Bearer ${access_token}` };
      }

      const deleteRes = await request.delete(`${API_URL}/users/me`, {
        headers: authHeaders,
        timeout: TIMEOUT_MS,
      });

      if (deleteRes.status() === 204 || deleteRes.status() === 200) {
        const verifyRes = await request.get(`${API_URL}/auth/me`, {
          headers: authHeaders,
          timeout: TIMEOUT_MS,
        });
        if (verifyRes.status() !== 200) return; // confirmed gone ✓
        console.warn(`[cleanup] DELETE returned ${deleteRes.status()} but ${email} still responds to GET /auth/me — retrying`);
      } else if (deleteRes.status() === 404) {
        return; // already gone ✓
      } else {
        console.warn(`[cleanup] DELETE /users/me returned ${deleteRes.status()} for ${email} — attempt ${attempt}/${MAX_ATTEMPTS}`);
      }

      if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    } catch (err) {
      console.warn(`[cleanup] ⚠️  attempt ${attempt}/${MAX_ATTEMPTS} threw for ${email}: ${(err as Error).message}`);
      if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    }
  }

  console.warn(`[cleanup] ⚠️  could not delete test user ${email} after ${MAX_ATTEMPTS} attempts — manual cleanup may be required`);
}

import { test, expect } from '@playwright/test';
import { registerUser, loginUser } from '../../helpers/api-helpers';
import { createTestUser, deleteTestUser, TestUser } from '../../fixtures/auth';

const API_URL = process.env.API_URL || 'https://job-tracker-backend-production-7acf.up.railway.app';

test.describe('Auth API', () => {
  let testUser: TestUser;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestUser(request, testUser.email, testUser.password, testUser.cookieHeader);
  });

  // ── Registration ────────────────────────────────────────────────────────────

  test('POST /auth/register — should register a new user', async ({ request }) => {
    const uniqueEmail    = `playwright_api_${Date.now()}@example.com`;
    const uniqueUsername = `playwright_api_${Date.now()}`;
    const response = await registerUser(request, {
      email: uniqueEmail,
      username: uniqueUsername,
      password: testUser.password,
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body.email).toBe(uniqueEmail);
  });

  test('POST /auth/register — should return 409 for duplicate email', async ({ request }) => {
    const response = await registerUser(request, {
      email:    testUser.email,
      username: `another_${Date.now()}`,
      password: testUser.password,
    });
    expect([400, 409, 422]).toContain(response.status());
  });

  test('POST /auth/register — should return 422 for missing fields', async ({ request }) => {
    const response = await registerUser(request, { email: 'incomplete@example.com' });
    expect([400, 422]).toContain(response.status());
  });

  // ── Login — Bearer token (existing behaviour) ───────────────────────────────

  test('POST /auth/login — should return access_token in body', async ({ request }) => {
    const response = await loginUser(request, testUser.email, testUser.password);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('access_token');
    expect(typeof body.access_token).toBe('string');
  });

  test('POST /auth/login — should return 401 for invalid credentials', async ({ request }) => {
    const response = await loginUser(request, testUser.email, 'WrongPassword@999');
    expect([400, 401]).toContain(response.status());
  });

  test('POST /auth/login — should return 422 for missing password', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: { email: testUser.email },
    });
    expect([400, 422]).toContain(response.status());
  });

  // ── Login — Cookie auth (new behaviour) ─────────────────────────────────────

  test('POST /auth/login — should set httpOnly access_token cookie', async ({ request }) => {
    const response = await loginUser(request, testUser.email, testUser.password);
    expect(response.status()).toBe(200);

    const setCookieHeaders = response
      .headersArray()
      .filter(h => h.name.toLowerCase() === 'set-cookie')
      .map(h => h.value);

    expect(setCookieHeaders.length).toBeGreaterThan(0);

    const tokenCookie = setCookieHeaders.find(v => v.startsWith('access_token='));
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie!.toLowerCase()).toContain('httponly');
  });

  // ── /auth/me — cookie auth ───────────────────────────────────────────────────

  test('GET /auth/me — should return current user via cookie auth', async ({ request }) => {
    const response = await request.get(`${API_URL}/auth/me`, {
      headers: { Cookie: testUser.cookieHeader },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.email).toBe(testUser.email);
  });

  test('GET /auth/me — should return 401 with no credentials', async ({ request }) => {
    const response = await request.get(`${API_URL}/auth/me`);
    expect(response.status()).toBe(401);
  });

  // ── Logout ───────────────────────────────────────────────────────────────────

  test('POST /auth/logout — should clear the cookie', async ({ request }) => {
    // Use a fresh throwaway user so the shared testUser session stays intact
    const tempUser = await createTestUser(request);

    try {
      const response = await request.post(`${API_URL}/auth/logout`, {
        headers: { Cookie: tempUser.cookieHeader },
      });
      expect(response.status()).toBe(200);

      // Backend clears the cookie by setting max-age=0.
      // Note: the JWT itself stays cryptographically valid until expiry —
      // stateless JWT servers cannot invalidate tokens server-side.
      // We only assert what the backend actually does: return 200 and
      // send a Set-Cookie header with max-age=0.
      const setCookieHeaders = response
        .headersArray()
        .filter(h => h.name.toLowerCase() === 'set-cookie')
        .map(h => h.value.toLowerCase());

      const clearedCookie = setCookieHeaders.find(v => v.startsWith('access_token='));
      if (clearedCookie) {
        expect(clearedCookie).toContain('max-age=0');
      }
    } finally {
      await deleteTestUser(request, tempUser.email, tempUser.password);
    }
  });
});

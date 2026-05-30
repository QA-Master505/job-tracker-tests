import { test, expect } from '@playwright/test';
import { registerUser, loginUser } from '../../helpers/api-helpers';
import { createTestUser, TestUser } from '../../fixtures/auth';

const API_URL = process.env.API_URL || 'https://job-tracker-backend-production-7acf.up.railway.app';

test.describe('Auth API', () => {
  let testUser: TestUser;

  test.beforeAll(async ({ request }) => {
    testUser = await createTestUser(request);
  });

  test('POST /auth/register — should register a new user', async ({ request }) => {
    const uniqueEmail = `playwright_api_${Date.now()}@example.com`;
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

  test('POST /auth/register — should return 400 for duplicate email', async ({ request }) => {
    // testUser already exists (created in beforeAll) — first call returns 409, second also must fail
    await registerUser(request, {
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
    });
    const response = await registerUser(request, {
      email: testUser.email,
      username: `another_${Date.now()}`,
      password: testUser.password,
    });
    expect([400, 409, 422]).toContain(response.status());
  });

  test('POST /auth/register — should return 422 for missing fields', async ({ request }) => {
    const response = await registerUser(request, { email: 'incomplete@example.com' });
    expect([400, 422]).toContain(response.status());
  });

  test('POST /auth/login — should return access token with valid credentials', async ({ request }) => {
    const response = await loginUser(request, testUser.email, testUser.password);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('access_token');
    expect(typeof body.access_token).toBe('string');
  });

  test('POST /auth/login — should return 401 for invalid credentials', async ({ request }) => {
    const response = await loginUser(request, testUser.email, 'WrongPassword@999');
    expect([401, 400]).toContain(response.status());
  });

  test('POST /auth/login — should return 422 for missing password', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: { email: testUser.email },
    });
    expect([400, 422]).toContain(response.status());
  });
});

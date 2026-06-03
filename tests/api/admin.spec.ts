import { test, expect } from '@playwright/test';
import { getAuthCookie } from '../../helpers/api-helpers';
import { createTestUser, deleteTestUser, TestUser } from '../../fixtures/auth';

const API_URL = process.env.API_URL || 'https://job-tracker-backend-production-7acf.up.railway.app';

test.describe('Admin API', () => {
  let superadminCookie: string;
  let adminUser: TestUser;
  let adminCookie: string;
  let adminUserId: number;
  let regularUser: TestUser;
  let regularUserId: number;
  let deleteTargetUser: TestUser;
  let deleteTargetUserId: number;

  test.beforeAll(async ({ request }) => {
    const saEmail = process.env.SUPERADMIN_EMAIL;
    const saPassword = process.env.SUPERADMIN_PASSWORD;
    if (!saEmail || !saPassword) {
      throw new Error('SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in .env.test');
    }

    superadminCookie = await getAuthCookie(request, saEmail, saPassword);

    adminUser = await createTestUser(request);
    regularUser = await createTestUser(request);
    deleteTargetUser = await createTestUser(request);

    const [adminMe, regularMe, deleteTargetMe] = await Promise.all([
      request.get(`${API_URL}/auth/me`, { headers: { Cookie: adminUser.cookieHeader } }),
      request.get(`${API_URL}/auth/me`, { headers: { Cookie: regularUser.cookieHeader } }),
      request.get(`${API_URL}/auth/me`, { headers: { Cookie: deleteTargetUser.cookieHeader } }),
    ]);
    adminUserId = (await adminMe.json()).id;
    regularUserId = (await regularMe.json()).id;
    deleteTargetUserId = (await deleteTargetMe.json()).id;

    const promoteRes = await request.patch(`${API_URL}/admin/users/${adminUserId}/role`, {
      headers: { Cookie: superadminCookie },
      data: { new_role: 'admin' },
    });
    if (!promoteRes.ok()) {
      throw new Error(`Failed to promote adminUser: ${promoteRes.status()} ${await promoteRes.text()}`);
    }

    // Re-login to get a cookie with the updated role claim
    adminCookie = await getAuthCookie(request, adminUser.email, adminUser.password);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestUser(request, adminUser.email, adminUser.password, adminCookie);
    await deleteTestUser(request, regularUser.email, regularUser.password, regularUser.cookieHeader);
    // deleteTargetUser may already be gone (deleted by the superadmin delete test) —
    // use the admin endpoint so a 404 is silent rather than retried three times
    if (deleteTargetUserId && superadminCookie) {
      try {
        await request.delete(`${API_URL}/admin/users/${deleteTargetUserId}`, {
          headers: { Cookie: superadminCookie },
        });
      } catch { /* already gone */ }
    }
  });

  // ── Unauthenticated — every admin endpoint must return 401 ─────────────────

  test('GET /admin/users — should return 401 when unauthenticated', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/users`);
    expect(res.status()).toBe(401);
  });

  test('GET /admin/users/:id — should return 401 when unauthenticated', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/users/${regularUserId}`);
    expect(res.status()).toBe(401);
  });

  test('GET /admin/stats/overview — should return 401 when unauthenticated', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/stats/overview`);
    expect(res.status()).toBe(401);
  });

  test('GET /admin/audit-log — should return 401 when unauthenticated', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/audit-log`);
    expect(res.status()).toBe(401);
  });

  test('PATCH /admin/users/:id/status — should return 401 when unauthenticated', async ({ request }) => {
    const res = await request.patch(`${API_URL}/admin/users/${regularUserId}/status`);
    expect(res.status()).toBe(401);
  });

  test('PATCH /admin/users/:id/role — should return 401 when unauthenticated', async ({ request }) => {
    const res = await request.patch(`${API_URL}/admin/users/${regularUserId}/role`);
    expect(res.status()).toBe(401);
  });

  test('DELETE /admin/users/:id — should return 401 when unauthenticated', async ({ request }) => {
    const res = await request.delete(`${API_URL}/admin/users/${regularUserId}`);
    expect(res.status()).toBe(401);
  });

  // ── Regular user — every admin endpoint must return 403 ────────────────────

  test('GET /admin/users — should return 403 for regular user', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/users`, {
      headers: { Cookie: regularUser.cookieHeader },
    });
    expect(res.status()).toBe(403);
  });

  test('GET /admin/users/:id — should return 403 for regular user', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/users/${regularUserId}`, {
      headers: { Cookie: regularUser.cookieHeader },
    });
    expect(res.status()).toBe(403);
  });

  test('GET /admin/stats/overview — should return 403 for regular user', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/stats/overview`, {
      headers: { Cookie: regularUser.cookieHeader },
    });
    expect(res.status()).toBe(403);
  });

  test('GET /admin/audit-log — should return 403 for regular user', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/audit-log`, {
      headers: { Cookie: regularUser.cookieHeader },
    });
    expect(res.status()).toBe(403);
  });

  test('PATCH /admin/users/:id/status — should return 403 for regular user', async ({ request }) => {
    const res = await request.patch(`${API_URL}/admin/users/${regularUserId}/status`, {
      headers: { Cookie: regularUser.cookieHeader },
      data: { is_active: false },
    });
    expect(res.status()).toBe(403);
  });

  test('PATCH /admin/users/:id/role — should return 403 for regular user', async ({ request }) => {
    const res = await request.patch(`${API_URL}/admin/users/${regularUserId}/role`, {
      headers: { Cookie: regularUser.cookieHeader },
      data: { new_role: 'admin' },
    });
    expect(res.status()).toBe(403);
  });

  test('DELETE /admin/users/:id — should return 403 for regular user', async ({ request }) => {
    const res = await request.delete(`${API_URL}/admin/users/${regularUserId}`, {
      headers: { Cookie: regularUser.cookieHeader },
    });
    expect(res.status()).toBe(403);
  });

  // ── Admin role — permitted operations ──────────────────────────────────────

  test('GET /admin/users — admin should list users with pagination envelope', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/users`, {
      headers: { Cookie: adminCookie },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBeTruthy();
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('page_size');
    expect(body).toHaveProperty('total_pages');
  });

  test('GET /admin/users/:id — admin should get user by id', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/users/${regularUserId}`, {
      headers: { Cookie: adminCookie },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(regularUserId);
    expect(body).toHaveProperty('email');
  });

  test('GET /admin/stats/overview — admin should get stats shape', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/stats/overview`, {
      headers: { Cookie: adminCookie },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('total_users');
    expect(body).toHaveProperty('active_users');
    expect(body).toHaveProperty('total_jobs');
    expect(body).toHaveProperty('jobs_by_status');
  });

  test('GET /admin/audit-log — admin should get audit log with pagination envelope', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/audit-log`, {
      headers: { Cookie: adminCookie },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBeTruthy();
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('page_size');
    expect(body).toHaveProperty('total_pages');
  });

  test('PATCH /admin/users/:id/status — admin should toggle user status', async ({ request }) => {
    const res = await request.patch(`${API_URL}/admin/users/${regularUserId}/status`, {
      headers: { Cookie: adminCookie },
      data: { is_active: false },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('is_active');
    // Restore
    await request.patch(`${API_URL}/admin/users/${regularUserId}/status`, {
      headers: { Cookie: adminCookie },
      data: { is_active: true },
    });
  });

  // ── Admin role — forbidden operations ──────────────────────────────────────

  test('PATCH /admin/users/:id/role — admin should return 403', async ({ request }) => {
    const res = await request.patch(`${API_URL}/admin/users/${regularUserId}/role`, {
      headers: { Cookie: adminCookie },
      data: { new_role: 'superadmin' },
    });
    expect(res.status()).toBe(403);
  });

  test('DELETE /admin/users/:id — admin should return 403', async ({ request }) => {
    const res = await request.delete(`${API_URL}/admin/users/${regularUserId}`, {
      headers: { Cookie: adminCookie },
    });
    expect(res.status()).toBe(403);
  });

  // ── Superadmin — privileged operations ─────────────────────────────────────

  test('PATCH /admin/users/:id/role — superadmin should change user role', async ({ request }) => {
    const res = await request.patch(`${API_URL}/admin/users/${regularUserId}/role`, {
      headers: { Cookie: superadminCookie },
      data: { new_role: 'admin' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('role');
    // Restore
    await request.patch(`${API_URL}/admin/users/${regularUserId}/role`, {
      headers: { Cookie: superadminCookie },
      data: { new_role: 'user' },
    });
  });

  test('DELETE /admin/users/:id — superadmin should delete user', async ({ request }) => {
    const res = await request.delete(`${API_URL}/admin/users/${deleteTargetUserId}`, {
      headers: { Cookie: superadminCookie },
    });
    expect([200, 204]).toContain(res.status());
  });
});

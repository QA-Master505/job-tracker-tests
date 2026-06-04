# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api/admin.spec.ts >> Admin API >> GET /admin/users — should return 401 when unauthenticated
- Location: tests/api/admin.spec.ts:67:7

# Error details

```
Error: SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in .env.test
```

```
TypeError: Cannot read properties of undefined (reading 'email')
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { getAuthCookie } from '../../helpers/api-helpers';
  3   | import { createTestUser, deleteTestUser, TestUser } from '../../fixtures/auth';
  4   | 
  5   | const API_URL = process.env.API_URL || 'https://job-tracker-backend-production-7acf.up.railway.app';
  6   | 
  7   | test.describe('Admin API', () => {
  8   |   let superadminCookie: string;
  9   |   let adminUser: TestUser;
  10  |   let adminCookie: string;
  11  |   let adminUserId: number;
  12  |   let regularUser: TestUser;
  13  |   let regularUserId: number;
  14  |   let deleteTargetUser: TestUser;
  15  |   let deleteTargetUserId: number;
  16  | 
  17  |   test.beforeAll(async ({ request }) => {
  18  |     const saEmail = process.env.SUPERADMIN_EMAIL;
  19  |     const saPassword = process.env.SUPERADMIN_PASSWORD;
  20  |     if (!saEmail || !saPassword) {
  21  |       throw new Error('SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in .env.test');
  22  |     }
  23  | 
  24  |     superadminCookie = await getAuthCookie(request, saEmail, saPassword);
  25  | 
  26  |     adminUser = await createTestUser(request);
  27  |     regularUser = await createTestUser(request);
  28  |     deleteTargetUser = await createTestUser(request);
  29  | 
  30  |     const [adminMe, regularMe, deleteTargetMe] = await Promise.all([
  31  |       request.get(`${API_URL}/auth/me`, { headers: { Cookie: adminUser.cookieHeader } }),
  32  |       request.get(`${API_URL}/auth/me`, { headers: { Cookie: regularUser.cookieHeader } }),
  33  |       request.get(`${API_URL}/auth/me`, { headers: { Cookie: deleteTargetUser.cookieHeader } }),
  34  |     ]);
  35  |     adminUserId = (await adminMe.json()).id;
  36  |     regularUserId = (await regularMe.json()).id;
  37  |     deleteTargetUserId = (await deleteTargetMe.json()).id;
  38  | 
  39  |     const promoteRes = await request.patch(`${API_URL}/admin/users/${adminUserId}/role`, {
  40  |       headers: { Cookie: superadminCookie },
  41  |       data: { new_role: 'admin' },
  42  |     });
  43  |     if (!promoteRes.ok()) {
  44  |       throw new Error(`Failed to promote adminUser: ${promoteRes.status()} ${await promoteRes.text()}`);
  45  |     }
  46  | 
  47  |     // Re-login to get a cookie with the updated role claim
  48  |     adminCookie = await getAuthCookie(request, adminUser.email, adminUser.password);
  49  |   });
  50  | 
  51  |   test.afterAll(async ({ request }) => {
> 52  |     await deleteTestUser(request, adminUser.email, adminUser.password, adminCookie);
      |                                             ^ TypeError: Cannot read properties of undefined (reading 'email')
  53  |     await deleteTestUser(request, regularUser.email, regularUser.password, regularUser.cookieHeader);
  54  |     // deleteTargetUser may already be gone (deleted by the superadmin delete test) —
  55  |     // use the admin endpoint so a 404 is silent rather than retried three times
  56  |     if (deleteTargetUserId && superadminCookie) {
  57  |       try {
  58  |         await request.delete(`${API_URL}/admin/users/${deleteTargetUserId}`, {
  59  |           headers: { Cookie: superadminCookie },
  60  |         });
  61  |       } catch { /* already gone */ }
  62  |     }
  63  |   });
  64  | 
  65  |   // ── Unauthenticated — every admin endpoint must return 401 ─────────────────
  66  | 
  67  |   test('GET /admin/users — should return 401 when unauthenticated', async ({ request }) => {
  68  |     const res = await request.get(`${API_URL}/admin/users`);
  69  |     expect(res.status()).toBe(401);
  70  |   });
  71  | 
  72  |   test('GET /admin/users/:id — should return 401 when unauthenticated', async ({ request }) => {
  73  |     const res = await request.get(`${API_URL}/admin/users/${regularUserId}`);
  74  |     expect(res.status()).toBe(401);
  75  |   });
  76  | 
  77  |   test('GET /admin/stats/overview — should return 401 when unauthenticated', async ({ request }) => {
  78  |     const res = await request.get(`${API_URL}/admin/stats/overview`);
  79  |     expect(res.status()).toBe(401);
  80  |   });
  81  | 
  82  |   test('GET /admin/audit-log — should return 401 when unauthenticated', async ({ request }) => {
  83  |     const res = await request.get(`${API_URL}/admin/audit-log`);
  84  |     expect(res.status()).toBe(401);
  85  |   });
  86  | 
  87  |   test('PATCH /admin/users/:id/status — should return 401 when unauthenticated', async ({ request }) => {
  88  |     const res = await request.patch(`${API_URL}/admin/users/${regularUserId}/status`);
  89  |     expect(res.status()).toBe(401);
  90  |   });
  91  | 
  92  |   test('PATCH /admin/users/:id/role — should return 401 when unauthenticated', async ({ request }) => {
  93  |     const res = await request.patch(`${API_URL}/admin/users/${regularUserId}/role`);
  94  |     expect(res.status()).toBe(401);
  95  |   });
  96  | 
  97  |   test('DELETE /admin/users/:id — should return 401 when unauthenticated', async ({ request }) => {
  98  |     const res = await request.delete(`${API_URL}/admin/users/${regularUserId}`);
  99  |     expect(res.status()).toBe(401);
  100 |   });
  101 | 
  102 |   // ── Regular user — every admin endpoint must return 403 ────────────────────
  103 | 
  104 |   test('GET /admin/users — should return 403 for regular user', async ({ request }) => {
  105 |     const res = await request.get(`${API_URL}/admin/users`, {
  106 |       headers: { Cookie: regularUser.cookieHeader },
  107 |     });
  108 |     expect(res.status()).toBe(403);
  109 |   });
  110 | 
  111 |   test('GET /admin/users/:id — should return 403 for regular user', async ({ request }) => {
  112 |     const res = await request.get(`${API_URL}/admin/users/${regularUserId}`, {
  113 |       headers: { Cookie: regularUser.cookieHeader },
  114 |     });
  115 |     expect(res.status()).toBe(403);
  116 |   });
  117 | 
  118 |   test('GET /admin/stats/overview — should return 403 for regular user', async ({ request }) => {
  119 |     const res = await request.get(`${API_URL}/admin/stats/overview`, {
  120 |       headers: { Cookie: regularUser.cookieHeader },
  121 |     });
  122 |     expect(res.status()).toBe(403);
  123 |   });
  124 | 
  125 |   test('GET /admin/audit-log — should return 403 for regular user', async ({ request }) => {
  126 |     const res = await request.get(`${API_URL}/admin/audit-log`, {
  127 |       headers: { Cookie: regularUser.cookieHeader },
  128 |     });
  129 |     expect(res.status()).toBe(403);
  130 |   });
  131 | 
  132 |   test('PATCH /admin/users/:id/status — should return 403 for regular user', async ({ request }) => {
  133 |     const res = await request.patch(`${API_URL}/admin/users/${regularUserId}/status`, {
  134 |       headers: { Cookie: regularUser.cookieHeader },
  135 |       data: { is_active: false },
  136 |     });
  137 |     expect(res.status()).toBe(403);
  138 |   });
  139 | 
  140 |   test('PATCH /admin/users/:id/role — should return 403 for regular user', async ({ request }) => {
  141 |     const res = await request.patch(`${API_URL}/admin/users/${regularUserId}/role`, {
  142 |       headers: { Cookie: regularUser.cookieHeader },
  143 |       data: { new_role: 'admin' },
  144 |     });
  145 |     expect(res.status()).toBe(403);
  146 |   });
  147 | 
  148 |   test('DELETE /admin/users/:id — should return 403 for regular user', async ({ request }) => {
  149 |     const res = await request.delete(`${API_URL}/admin/users/${regularUserId}`, {
  150 |       headers: { Cookie: regularUser.cookieHeader },
  151 |     });
  152 |     expect(res.status()).toBe(403);
```
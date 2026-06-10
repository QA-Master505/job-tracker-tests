# API Tests — Job Tracker

The API test suite verifies the HTTP layer of the Job Tracker backend — authentication,
job CRUD, interview rounds, and the full admin permission matrix — using Playwright's
`APIRequestContext`. No browser is launched; tests issue HTTP requests directly against
the backend and assert on status codes, response shapes, and header values. In CI, all
tests run against a local FastAPI instance spun up within the workflow, backed by a real
PostgreSQL database — not mocks or SQLite.

The suite is split across four spec files. Three (`auth.api.spec.ts`, `jobs.api.spec.ts`,
`interview-rounds.api.spec.ts`) run together on every push to `main` and on a nightly
weekday schedule via `api-tests.yml`. The fourth (`admin.spec.ts`) runs in its own
workflow, `admin-tests.yml`, triggered manually only — because it requires a seeded
superadmin account whose credentials cannot be exposed to routine CI runs.

---

## Tools & Stack

| Item | Detail |
|------|--------|
| Test framework | Playwright `APIRequestContext` |
| Language | TypeScript |
| Target — API tests | Local FastAPI server (`http://localhost:8000`) in CI |
| Target — Admin tests | Local FastAPI server (`http://localhost:8000`) in CI |
| Authentication | `httpOnly` cookie (`access_token=<jwt>`) or Bearer token |
| CI workflow — API tests | `.github/workflows/api-tests.yml` |
| CI workflow — Admin tests | `.github/workflows/admin-tests.yml` |

---

## Test Files

| File | Tests | What it covers |
|------|-------|----------------|
| `tests/api/auth.api.spec.ts` | 10 | Registration, login (body token + httpOnly cookie), `/auth/me`, logout |
| `tests/api/jobs.api.spec.ts` | 9 | Job CRUD — create, list, update, delete — including auth and 404 guards |
| `tests/api/interview-rounds.api.spec.ts` | 6 | Interview round create, list, and delete — including auth and 404 guards |
| `tests/api/admin.spec.ts` | 23 | Full permission matrix across unauthenticated, regular user, admin, and superadmin |

---

## Test Infrastructure

### Dynamic test users

Every spec file creates a dedicated test user in `beforeAll` via `createTestUser()` and
deletes it in `afterAll` via `deleteTestUser()`, both defined in `fixtures/auth.ts`.
`createTestUser` registers a timestamped user (`testuser{timestamp}@example.com`) and
immediately logs in to capture the `httpOnly` cookie from the `Set-Cookie` response
header — because Playwright's `APIRequestContext` does not maintain a browser cookie jar,
the cookie string must be extracted manually and passed on all subsequent requests.

Registration uses a retry loop (up to 3 attempts, 2 s delay) because the Railway backend
occasionally returns 500 on cold start. Only 5xx responses trigger a retry; 4xx errors
throw immediately since retrying a client error cannot succeed. `deleteTestUser` applies
the same 3-attempt retry with a 10 s per-request timeout, and after receiving 200 or 204
from `DELETE /users/me`, it issues a `GET /auth/me` to confirm the account is actually
gone before returning. A 404 from either step is treated as success.

### Cookie authentication

`helpers/api-helpers.ts` exposes a `buildAuthHeader()` function, used internally by every
request helper, that accepts either a Bearer token or a cookie string and returns the
appropriate header map. If the `auth` argument starts with `access_token=`, it returns
`{ Cookie: auth }`; otherwise it returns `{ Authorization: "Bearer {auth}" }`. This means
job and interview-round tests can pass a Bearer token obtained via `getAuthToken()`, while
auth and admin tests use the cookie string obtained via `getAuthCookie()`, without any
branching at the call site. Both paths exercise the same backend JWT validation.

### Test isolation

Each spec file registers its own test user in `beforeAll` — no user is shared across
files. The jobs spec stores created job IDs in `createdJobId` and deletes them in
`afterEach`, so each test starts with a predictable job list. The interview-rounds spec
creates a single parent job in `beforeAll` (with a distinct `company_name` of
`'API Interview Test Job'` to avoid collision with jobs-spec cleanup) and deletes it in
`afterAll` alongside the user, relying on the database `ON DELETE CASCADE` constraint to
remove all child rounds. The admin spec manages three test users — one promoted to
`admin`, one regular, one designated as the delete target — and tears each down
explicitly in `afterAll`, using the superadmin endpoint for the delete target to handle
the case where the superadmin delete test already consumed it.

---

## API Tests Breakdown

### auth.api.spec.ts

Covers `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, and
`POST /auth/logout`. Two separate login tests verify the response body and the
`Set-Cookie` header independently: the backend returns both an `access_token` field in
the body and an `httpOnly` cookie in the same response, and each must be asserted
separately. The logout test uses a throwaway user created specifically for that test,
leaving the shared `testUser` session intact for `GET /auth/me` and `afterAll` cleanup.

| Test Name | HTTP Method | Endpoint | Expected Status | What It Verifies |
|-----------|-------------|----------|-----------------|------------------|
| POST /auth/register — should register a new user | POST | /auth/register | 201 | Response contains `id` and email matches submitted value |
| POST /auth/register — should return 409 for duplicate email | POST | /auth/register | 409 | Duplicate email is rejected by the backend |
| POST /auth/register — should return 422 for missing fields | POST | /auth/register | 422 | Incomplete body is rejected by Pydantic validation |
| POST /auth/login — should return access_token in body | POST | /auth/login | 200 | Response body contains `access_token` as a string |
| POST /auth/login — should return 401 for invalid credentials | POST | /auth/login | 401 | Wrong password is rejected |
| POST /auth/login — should return 422 for missing password | POST | /auth/login | 422 | Missing `password` field is rejected |
| POST /auth/login — should set httpOnly access_token cookie | POST | /auth/login | 200 | `Set-Cookie` header is present with `access_token=` and `httponly` attribute |
| GET /auth/me — should return current user via cookie auth | GET | /auth/me | 200 | Cookie-authenticated request returns the user's email |
| GET /auth/me — should return 401 with no credentials | GET | /auth/me | 401 | Request with no cookie or token is rejected |
| POST /auth/logout — should clear the cookie | POST | /auth/logout | 200 | `Set-Cookie` header resets `access_token` with `max-age=0` |

---

### jobs.api.spec.ts

Covers `POST /jobs`, `GET /jobs`, `PUT /jobs/:id`, and `DELETE /jobs/:id`. The list test
asserts the full pagination envelope shape — `items`, `total`, `page`, `page_size`,
`total_pages` — rather than just the status code. Tests targeting non-existent resources
use hardcoded IDs (`99999`, `999999`) guaranteed not to exist in the freshly migrated test
database.

| Test Name | HTTP Method | Endpoint | Expected Status | What It Verifies |
|-----------|-------------|----------|-----------------|------------------|
| POST /jobs — should create a new job application | POST | /jobs | 201 | Response contains `id`, `company_name`, and `job_title` |
| POST /jobs — should return 401 without auth token | POST | /jobs | 401 | Unauthenticated create is rejected |
| POST /jobs — should return 422 for missing required fields | POST | /jobs | 422 | Body missing required fields is rejected |
| GET /jobs — should return list of job applications | GET | /jobs | 200 | Response is a pagination envelope with `items`, `total`, `page`, `page_size`, `total_pages` |
| GET /jobs — should return 401 without auth token | GET | /jobs | 401 | Unauthenticated list is rejected |
| PUT /jobs/:id — should update a job application | PUT | /jobs/:id | 200 | Updated `status` field is reflected in the response body |
| PUT /jobs/:id — should return 404 for non-existent job | PUT | /jobs/:id | 404 | Update on a missing job returns not found |
| DELETE /jobs/:id — should delete a job application | DELETE | /jobs/:id | 200 or 204 | Job is deleted successfully |
| DELETE /jobs/:id — should return 404 for non-existent job | DELETE | /jobs/:id | 404 | Delete on a missing job returns not found |

---

### interview-rounds.api.spec.ts

Covers `POST /jobs/:id/interviews`, `GET /jobs/:id/interviews`, and
`DELETE /jobs/:jobId/interviews/:roundId`. A single parent job persists across all tests
in the file. Interview rounds created during individual tests are not cleaned up between
tests — the parent job deletion in `afterAll` cascades to all rounds via the database
constraint.

| Test Name | HTTP Method | Endpoint | Expected Status | What It Verifies |
|-----------|-------------|----------|-----------------|------------------|
| POST /jobs/:id/interviews — should create a new interview round | POST | /jobs/:id/interviews | 201 | Response contains `id` and matches submitted `interview_type` |
| POST /jobs/:id/interviews — should return 401 without auth token | POST | /jobs/:id/interviews | 401 | Unauthenticated create is rejected |
| POST /jobs/:id/interviews — should return 404 for non-existent job | POST | /jobs/:id/interviews | 404 | Creating a round for a missing job returns not found |
| GET /jobs/:id/interviews — should return interview rounds for a job | GET | /jobs/:id/interviews | 200 | Response is an array with at least one round |
| GET /jobs/:id/interviews — should return 401 without auth token | GET | /jobs/:id/interviews | 401 | Unauthenticated list is rejected |
| DELETE /jobs/:jobId/interviews/:roundId — should delete an interview round | DELETE | /jobs/:jobId/interviews/:roundId | 200 or 204 | Round is deleted successfully |

---

## Admin API Tests Breakdown

### Why admin.spec.ts runs separately

`admin.spec.ts` requires a seeded superadmin account before any test can run. In CI,
`scripts/seed_ci_superadmin.py` (in the backend repo) creates this account by reading
`CI_SUPERADMIN_EMAIL` and `CI_SUPERADMIN_PASSWORD` from GitHub Actions secrets. Including
this seed step in the main `api-tests.yml` workflow would expose those credentials to
every push and every nightly run. Restricting `admin-tests.yml` to `workflow_dispatch`
limits execution to intentional, manually triggered runs.

### Permission matrix

The suite verifies seven admin endpoints against four distinct principal states:

- **Unauthenticated** — no cookie or token: every endpoint must return 401
- **Regular user** — `role = 'user'`: every admin endpoint must return 403
- **Admin** — `role = 'admin'`, promoted by superadmin in `beforeAll` with a fresh cookie
  obtained after promotion: can list users, retrieve a user by id, view stats, view the
  audit log, and toggle user status; cannot change roles or delete users
- **Superadmin** — seeded from CI secrets: can change roles and delete users; all admin
  operations also permitted

The backend enforces the admin/superadmin split via two FastAPI dependencies:
`require_admin` (accepts `admin` and `superadmin`) and `require_superadmin` (accepts
`superadmin` only). Role-change and delete endpoints use `require_superadmin`. The test
suite covers both sides of the admin boundary explicitly — two tests assert 403 for the
admin role on those two endpoints.

| Test Name | HTTP Method | Endpoint | Expected Status | What It Verifies |
|-----------|-------------|----------|-----------------|------------------|
| GET /admin/users — should return 401 when unauthenticated | GET | /admin/users | 401 | No credentials rejected |
| GET /admin/users/:id — should return 401 when unauthenticated | GET | /admin/users/:id | 401 | No credentials rejected |
| GET /admin/stats/overview — should return 401 when unauthenticated | GET | /admin/stats/overview | 401 | No credentials rejected |
| GET /admin/audit-log — should return 401 when unauthenticated | GET | /admin/audit-log | 401 | No credentials rejected |
| PATCH /admin/users/:id/status — should return 401 when unauthenticated | PATCH | /admin/users/:id/status | 401 | No credentials rejected |
| PATCH /admin/users/:id/role — should return 401 when unauthenticated | PATCH | /admin/users/:id/role | 401 | No credentials rejected |
| DELETE /admin/users/:id — should return 401 when unauthenticated | DELETE | /admin/users/:id | 401 | No credentials rejected |
| GET /admin/users — should return 403 for regular user | GET | /admin/users | 403 | Regular user cannot access admin area |
| GET /admin/users/:id — should return 403 for regular user | GET | /admin/users/:id | 403 | Regular user cannot access admin area |
| GET /admin/stats/overview — should return 403 for regular user | GET | /admin/stats/overview | 403 | Regular user cannot access admin area |
| GET /admin/audit-log — should return 403 for regular user | GET | /admin/audit-log | 403 | Regular user cannot access admin area |
| PATCH /admin/users/:id/status — should return 403 for regular user | PATCH | /admin/users/:id/status | 403 | Regular user cannot access admin area |
| PATCH /admin/users/:id/role — should return 403 for regular user | PATCH | /admin/users/:id/role | 403 | Regular user cannot access admin area |
| DELETE /admin/users/:id — should return 403 for regular user | DELETE | /admin/users/:id | 403 | Regular user cannot access admin area |
| GET /admin/users — admin should list users with pagination envelope | GET | /admin/users | 200 | Returns `items`, `total`, `page`, `page_size`, `total_pages` |
| GET /admin/users/:id — admin should get user by id | GET | /admin/users/:id | 200 | Returns user object with `id` and `email` |
| GET /admin/stats/overview — admin should get stats shape | GET | /admin/stats/overview | 200 | Returns `total_users`, `active_users`, `total_jobs`, `jobs_by_status` |
| GET /admin/audit-log — admin should get audit log with pagination envelope | GET | /admin/audit-log | 200 | Returns paginated envelope with `items`, `total`, `page`, `page_size`, `total_pages` |
| PATCH /admin/users/:id/status — admin should toggle user status | PATCH | /admin/users/:id/status | 200 | `is_active` changes; status restored to original after assertion |
| PATCH /admin/users/:id/role — admin should return 403 | PATCH | /admin/users/:id/role | 403 | Role change is superadmin-only; admin is blocked |
| DELETE /admin/users/:id — admin should return 403 | DELETE | /admin/users/:id | 403 | User deletion is superadmin-only; admin is blocked |
| PATCH /admin/users/:id/role — superadmin should change user role | PATCH | /admin/users/:id/role | 200 | Returns updated user with `role`; role restored after assertion |
| DELETE /admin/users/:id — superadmin should delete user | DELETE | /admin/users/:id | 200 or 204 | Target user deleted; pre-created specifically for this test |

---

## CI/CD

### api-tests.yml

**Triggers:** push to `main`, nightly weekday schedule (`0 22 * * 1-5` — midnight Vienna
time, Monday through Friday), and manual `workflow_dispatch`.

The workflow starts a `postgres:16` service container, then clones `job-tracker-backend`
into the sibling directory, creates a Python 3.11 virtual environment, and installs
backend dependencies. Alembic migrations run against the service container, and `uvicorn`
starts in the background on port 8000. A `curl --retry 15 --retry-connrefused` health
check polls `http://localhost:8000/docs` before any tests run to confirm the server is
accepting connections. The Jira ticket dedup cache (`.jira-tickets.json`) is restored from
GitHub Actions cache before the run and saved again after — even on failure — so
open/closed ticket state persists across runs on the same branch.

```bash
npx playwright test tests/api/auth.api.spec.ts tests/api/jobs.api.spec.ts tests/api/interview-rounds.api.spec.ts
```

Artifacts uploaded: `playwright-report` (HTML) and `junit-results` (JUnit XML for Allure
ingestion), both retained for 30 days.

### admin-tests.yml

**Trigger:** manual `workflow_dispatch` only.

Setup is identical to `api-tests.yml` with one additional step inserted between migrations
and server start: `scripts/seed_ci_superadmin.py` runs with `CI_SUPERADMIN_EMAIL` and
`CI_SUPERADMIN_PASSWORD` from GitHub Actions secrets. This script creates (or upserts) the
superadmin account in the fresh test database. The same credentials are passed to the test
run as `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD`, which `admin.spec.ts` reads in
`beforeAll` to authenticate as superadmin.

```bash
npx playwright test tests/api/admin.spec.ts --reporter=list
```

Artifact uploaded: `admin-playwright-report`, retained for 30 days. The Jira cache step
is not present in this workflow.

---

## Running Locally

Create a `.env.test` file in the project root. For the three main API spec files,
`API_URL` is the only required variable — the tests register and delete their own users
and need no seed data. For `admin.spec.ts`, the superadmin credentials must also be
present.

```env
API_URL=http://localhost:8000
SUPERADMIN_EMAIL=your-superadmin@example.com
SUPERADMIN_PASSWORD=YourSuperadminPassword
```

> The backend must already be running on the port specified in `API_URL`. Playwright loads
> `.env.test` automatically. If the backend is not running, tests will fail immediately
> when `createTestUser` cannot reach `/auth/register`.

```bash
# Auth, jobs, and interview-rounds together
npx playwright test tests/api/auth.api.spec.ts tests/api/jobs.api.spec.ts tests/api/interview-rounds.api.spec.ts

# Or via the Makefile shortcut
make test-api

# A single spec file
npx playwright test tests/api/auth.api.spec.ts

# Admin suite — requires SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in .env.test
npx playwright test tests/api/admin.spec.ts
```

---

## Test Scenarios

### Scenario 1 — Asserting the httpOnly cookie on login

**Why this matters:** The application's security model depends on the `httpOnly` flag
being present on the `access_token` cookie. Without it, an injected script could read
`document.cookie` and steal the token. Reading the backend source confirms the intent;
this test confirms the flag is present in the actual HTTP response delivered to a client.

**Setup:** `testUser` is created in `beforeAll`. No additional setup is needed.

**HTTP call:**

```typescript
const response = await loginUser(request, testUser.email, testUser.password);
// → POST /auth/login  { email, password }
```

**Assertions:**

```typescript
expect(response.status()).toBe(200);

const setCookieHeaders = response
  .headersArray()
  .filter(h => h.name.toLowerCase() === 'set-cookie')
  .map(h => h.value);

expect(setCookieHeaders.length).toBeGreaterThan(0);

const tokenCookie = setCookieHeaders.find(v => v.startsWith('access_token='));
expect(tokenCookie).toBeDefined();
expect(tokenCookie!.toLowerCase()).toContain('httponly');
```

`headersArray()` is used rather than a convenience accessor because Playwright's
`APIRequestContext` does not aggregate `Set-Cookie` lines into a cookie jar — each header
must be read from the raw list. The `httponly` check is lowercased because HTTP attribute
casing is not standardised across server implementations.

---

### Scenario 2 — Updating a job application's status field

**Why this matters:** The `PUT /jobs/:id` endpoint must accept a partial payload and
return the updated record. This test confirms the write path reaches the database and the
read path reflects the change in the same request cycle — ruling out stale cached
responses.

**Setup:** A job is created inside the test body and its `id` stored in `createdJobId` so
`afterEach` can clean it up regardless of outcome.

**HTTP call:**

```typescript
const created = await createJob(request, token, testJob);
const job = await created.json();
createdJobId = job.id;

const response = await updateJob(request, token, createdJobId, { status: 'phone_interview' });
// → PUT /jobs/:id  { status: 'phone_interview' }  Authorization: Bearer <token>
```

**Assertions:**

```typescript
expect(response.status()).toBe(200);
const body = await response.json();
expect(body.status).toBe('phone_interview');
```

This test uses a Bearer token obtained via `getAuthToken()` rather than a cookie, which
exercises the `Authorization: Bearer` branch of `buildAuthHeader()` in `api-helpers.ts`.
The backend validates both forms, so using the token here keeps coverage orthogonal to the
cookie-focused tests in `auth.api.spec.ts`.

---

### Scenario 3 — Admin role blocked from role escalation

**Why this matters:** An admin who could promote other users to `admin` or `superadmin`
would represent a privilege escalation path. The boundary between the two roles is a
security boundary and must be enforced at the HTTP layer — not just in application logic.

**Setup:** `adminUser` was promoted to `admin` by the superadmin in `beforeAll`. A fresh
`adminCookie` was obtained after promotion to ensure the JWT role claim is current.

**HTTP call:**

```typescript
const res = await request.patch(`${API_URL}/admin/users/${regularUserId}/role`, {
  headers: { Cookie: adminCookie },
  data: { new_role: 'superadmin' },
});
// → PATCH /admin/users/:id/role  Cookie: access_token=<admin-jwt>
```

**Assertion:**

```typescript
expect(res.status()).toBe(403);
```

The backend enforces this via the `require_superadmin` dependency on the role-change route
in `app/routers/admin.py`, which rejects any token whose `role` claim is not `superadmin`.
The paired test (`PATCH /admin/users/:id/role — superadmin should change user role`) uses
`superadminCookie` and expects 200 — so both sides of the permission boundary are verified
within the same spec file.

# E2E Tests — Job Tracker

End-to-end tests exercise the Job Tracker application as a real user would experience it:
a browser opens, navigates to pages, fills forms, clicks buttons, and waits for the UI to
respond. Unlike unit tests that verify isolated functions or API tests that verify HTTP
contracts in isolation, E2E tests verify that the entire production stack works together —
the React frontend, the FastAPI backend, and the PostgreSQL database — within a single test
run. They sit at the top of the testing pyramid: they are the slowest and most expensive to
run, but they catch integration failures that no lower-level test can surface.

The suite contains two spec files. `user-journey.spec.ts` covers the user account lifecycle
from first registration through profile management to logout. `job-journey.spec.ts` covers
the core job application workflow — creating a job via the UI form, updating its status via
the edit modal, and deleting it with confirmation. Both spec files follow the same
cross-validation pattern: an action is performed through the browser, then the resulting
state is independently verified by querying the production API. This dual-assertion
strategy catches scenarios where the UI renders a success message but the backend write
failed silently.

---

## Tools & Stack

| Item | Detail |
|------|--------|
| Framework | Playwright (`@playwright/test`) |
| Language | TypeScript |
| Browser | Chromium (`devices['Desktop Chrome']`) |
| Page Object Models | `LoginPage`, `RegisterPage`, `DashboardPage`, `ProfilePage` |
| Target environment | Production — Vercel + Railway |
| CI workflow | `.github/workflows/allure-report.yml` (E2E step) |

---

## Folder Structure

```
tests/e2e/
├── job-journey.spec.ts    ← Job CRUD journey — create, update status, delete; UI + API cross-validation
└── user-journey.spec.ts   ← User lifecycle journey — register, update profile, logout; UI + API cross-validation

pages/
├── DashboardPage.ts       ← Dashboard interactions — job form, job card actions, logout
├── LoginPage.ts           ← Login page — fill credentials, submit, error retrieval
├── ProfilePage.ts         ← Profile page — update username/email, read success/error messages
└── RegisterPage.ts        ← Registration page — fill form, submit, success redirect
```

---

## Page Object Model

The Page Object Model pattern wraps all raw Playwright interactions in typed classes, one
per page. Step definitions and test functions call named methods on these classes rather
than manipulating selectors directly. This keeps the test code readable (intent is clear
from method names) and maintainable (if a `data-testid` attribute changes, the fix is in
one place in the POM, not scattered across every test that used that selector).

### LoginPage

`LoginPage` wraps the `/login` route. It exposes granular methods for individual field
operations (`fillEmail`, `fillPassword`, `clickLogin`) as well as a combined `login()`
convenience method. `getErrorMessage()` retrieves the content of the error `<p>` element
(identified by CSS class `p.bg-red-50`, since the login form has no `data-testid` on the
error element). `expectLoginPageVisible()` asserts the current URL matches `/login`.

### RegisterPage

`RegisterPage` wraps the `/register` route. The registration form has no `name` or `id`
attributes on its inputs — `register()` fills them by type order: `input[type="text"]`
for username, `input[type="email"]`, then `input[type="password"]`. After a successful
`register()` call, the server redirects the browser to `/login`; `expectSuccessRedirect()`
asserts that URL transition. `getErrorMessage()` reads the same `p.bg-red-50` error
element pattern used by `LoginPage`.

### DashboardPage

`DashboardPage` wraps the `/dashboard` route and is the most interaction-heavy POM.
`waitForDashboard()` waits for the URL, network idle, the "Add Application" button, and
the stats bar to be visible before returning — this is the safe entry-point after login.
`fillJobForm()` populates the job creation modal by `data-testid`; optional fields (`job_url`,
`applied_date`, `notes`) are only filled if provided. `deleteJob()` registers a one-time
dialog handler to accept the confirmation prompt before clicking the delete button, which
avoids a race condition where the dialog fires before the handler is registered.

### ProfilePage

`ProfilePage` wraps the `/profile` route. `updateUsername()` and `updateEmail()` both
call `.clear()` before `.fill()` to ensure the existing value is fully replaced rather
than appended to. `saveProfile()` clicks `save-username-btn`; `saveEmailSection()` clicks
the separate `save-email-btn`. `getSuccessMessage()` and `getErrorMessage()` return the
text content of their respective elements, both with a short `waitFor` so callers do not
need to add explicit waits before reading feedback.

**Example — POM method called from a test:**

```typescript
// user-journey.spec.ts
const profilePage = new ProfilePage(page);
await profilePage.updateUsername(newUsername);
await profilePage.saveProfile();

// After save, assert success message then cross-validate via API
await expect(page.getByTestId('profile-success-msg')).toBeVisible({ timeout: 10000 });
const meRes = await request.get(`${API_URL}/users/me`, {
  headers: { Authorization: `Bearer ${authToken}` }
});
const userData = await meRes.json();
expect(userData.username).toBe(newUsername);
```

The test reads naturally: update the username, save it, check the UI confirmed success,
then confirm the API returns the new value. The raw `fill` and `click` calls are hidden
inside `ProfilePage`.

---

## Test Files Breakdown

### user-journey.spec.ts

Covers the complete user account lifecycle in three sequential tests. A `SHARED_USER` is
registered and logged in via the API in `beforeAll`, and its `access_token` is stored as
`authToken` for use in API cross-validation calls within tests. Test 1 creates a second
ephemeral user via the UI; its credentials are tracked in `ephemeralUser` so `afterAll`
can clean it up alongside `SHARED_USER`.

| Test Name | Steps | What It Verifies |
|-----------|-------|-----------------|
| should register a new user and login successfully | Navigate to `/register`; fill username, email, password; submit. Wait for redirect to `/login`. Fill credentials; click login. Wait for redirect to `/dashboard`. Call `GET /users/me` via API. | UI registration form creates a real account; successful login redirects to dashboard; API confirms user exists with correct email |
| should update user profile and verify via API | Login via UI with SHARED_USER; navigate to `/profile` via nav link; `ProfilePage.updateUsername()`; `saveProfile()`; assert success message. Call `GET /users/me` via API with `authToken`. | Profile form writes through to the database; API returns the updated username after a UI-only save |
| should logout successfully and return to login page | Login via UI with SHARED_USER; assert logout button visible; click logout button; wait for URL to be `/login`; assert login form inputs visible. | Logout clears session and redirects to `/login`; login form is re-rendered after logout |

---

### job-journey.spec.ts

Covers the job application CRUD lifecycle. A `SHARED_USER` is registered via the API in
`beforeAll` and its `access_token` stored as `authToken`. A `beforeEach` hook runs the
full browser login flow before every test so each test starts at the dashboard. All three
tests use timestamped company names (`E2E Create {ts}`, `E2E Update {ts}`,
`E2E Delete {ts}`) to prevent cross-test interference if a previous test's cleanup
failed.

| Test Name | Steps | What It Verifies |
|-----------|-------|-----------------|
| should create a job via UI and verify via API | Click `add-application-btn`; fill company, position, status; click `job-submit-btn`; assert company name visible in dashboard. Call `GET /jobs` via API. Clean up via `DELETE /jobs/{id}`. | UI form submits a job write to the database; API confirms the job exists with the correct company name |
| should update job status via UI and verify via API | Create job via UI; locate the specific job card by company name; click `job-edit-btn`; change status select to `phone_interview`; click `job-save-btn`; wait for modal to close. Call `GET /jobs` via API. Clean up via `DELETE /jobs/{id}`. | Edit modal updates the job record in the database; API confirms the status field changed from `applied` to `phone_interview` |
| should delete job via UI and verify via API | Create job via UI; call `GET /jobs` via API to capture the job ID; register dialog handler; click `job-delete-btn` on the specific job card; assert company name disappears from UI. Call `GET /jobs/{id}` via API. | Deletion removes the record from the database; UI removes the card; API returns 404 for the deleted job ID |

---

## Test Infrastructure

### createTestUser / deleteTestUser in E2E context

The E2E spec files do not call `createTestUser()` from `fixtures/auth.ts` — they
register test users directly via `request.post('/auth/register')` and then log in via
`request.post('/auth/login')` to capture a Bearer token. This is intentional: the E2E
test lifecycle needs a Bearer token for API cross-validation, whereas `createTestUser`
is designed to capture the `httpOnly` cookie format used by the Playwright API suites.

Cleanup is handled by `deleteTestUser()` from `fixtures/auth.ts` in `afterAll`. This
function is hardened with 3 retry attempts, a 10-second timeout per attempt, and a
post-delete verification that calls `GET /auth/me` and confirms it no longer returns 200.
If the DELETE response is 404, the function exits silently — the account is already gone
and no error is raised.

`user-journey.spec.ts` tracks two users: `SHARED_USER` (the main account) and
`ephemeralUser` (the user registered via the UI in test 1). Both are deleted in
`afterAll`. The `ephemeralUser` variable is declared at module scope and set inside
test 1, so `afterAll` can reference it even though it was created during a test body.

### Authentication state across tests

The `authToken` Bearer token captured in `beforeAll` is stored as a module-level
variable and used exclusively for `APIRequestContext` calls — API cross-validation and
cleanup. It is not injected into the browser; the browser manages its own session via the
`httpOnly` cookie set by the server on login.

Each test in `user-journey.spec.ts` performs its own full browser login via `LoginPage`
before the steps it needs. Each test in `job-journey.spec.ts` is preceded by a
`beforeEach` that performs the browser login. In both cases, Playwright provides a fresh
browser context per test by default, so there is no session bleed between tests via
browser storage.

### Why beforeAll not beforeEach for user creation

User registration is an expensive operation — it requires an API round-trip, a database
write, and a follow-up login call. Registering a new user before every test would
multiply that cost by the number of tests in each suite and would also leave more
accounts requiring cleanup.

More importantly, `user-journey.spec.ts` tests 2 and 3 intentionally share the same
account: test 2 updates the username of `SHARED_USER` and test 3 logs that same user
out. If `beforeEach` recreated the user, the username update from test 2 would be lost
and the tests would be testing against a clean slate every time rather than an account
that accumulated real state. Using `beforeAll` once gives the suite a persistent account
to work with across its tests, mirroring how a real user's account persists across
browser sessions.

---

## CI/CD

### allure-report.yml (E2E step)

E2E tests run inside `allure-report.yml`, the unified report workflow, rather than in a
dedicated standalone workflow. The workflow triggers on completion of any of four upstream
workflows — "API Tests", "Full Test Suite", "E2E Tests", or "UI Spec Tests" — on the
`main` branch, or manually via `workflow_dispatch`.

The E2E test step runs after BDD tests and before UI Spec tests:

```bash
npx playwright test tests/e2e/
```

The step is marked `if: always()`, which means it runs even if earlier steps (API tests,
Newman, BDD) fail — E2E results are independent of upstream suite outcomes.

**Environment:** E2E tests in CI target the production stack:

```yaml
BASE_URL: https://job-tracker-frontend-green-sigma.vercel.app
API_URL: https://job-tracker-backend-production-7acf.up.railway.app
```

This is different from the API tests in the same workflow, which run against a local
FastAPI instance (`API_URL: http://localhost:8000`). E2E tests cannot use the local
backend because they drive a real browser against the production Vercel frontend, which
is configured to call the production Railway backend — a local backend URL would never
be reached by the browser.

After the E2E step completes, the workflow generates the Allure report from all
accumulated `allure-results/` output and publishes it to GitHub Pages. E2E results
appear under the **E2E Tests** suite label in the live report.

---

## Running Locally

E2E tests target production by default. No local backend is required for a standard run.

```bash
# Run all E2E tests headless
make test-e2e

# Run with visible browser
make test-e2e-headed

# Run in Playwright debug mode (step through interactions)
make test-e2e-debug

# Or directly via npx
npx playwright test tests/e2e/
npx playwright test tests/e2e/ --headed
npx playwright test tests/e2e/ --debug
```

> `make test-e2e` and variants clear `test-results/` before running. This prevents
> stale trace and screenshot files from a previous run from appearing in the new report.

`BASE_URL` and `API_URL` default to production and do not need to be set for a standard
run. Both can be overridden in `.env.test`:

```env
BASE_URL=https://job-tracker-frontend-green-sigma.vercel.app
API_URL=https://job-tracker-backend-production-7acf.up.railway.app
```

To run against a local stack, override both:

```bash
BASE_URL=http://localhost:5173 API_URL=http://localhost:8000 npx playwright test tests/e2e/
```

On failure, Playwright captures a screenshot and retains a video recording automatically
(`screenshot: 'only-on-failure'`, `video: 'retain-on-failure'` in `playwright.config.ts`).
A trace file is saved on the first retry (`trace: 'on-first-retry'`) and can be inspected
with `npx playwright show-trace`.

---

## Test Scenarios

### Scenario 1 — Register a new user and login successfully (user-journey.spec.ts)

**Why this matters:** Registration is the first action any new user takes in the
application. If the registration form, the backend `/auth/register` endpoint, and the
post-registration login flow all work correctly in production, users can join and access
the dashboard. This test verifies that complete chain end to end through a real browser —
not just that the API returns 200, but that the form submits, the redirect fires, the
login form accepts the new credentials, and the dashboard renders for that account. The
final API cross-validation (`GET /users/me`) confirms the user record was persisted with
the correct email, not just that the UI displayed a success screen.

**Test setup:**

```typescript
const ts = Date.now();
const newUser = {
  email: `e2e_reg_${ts}@test.com`,
  username: `e2ereg_${ts}`,
  password: 'Test123!',
};
ephemeralUser = { email: newUser.email, password: newUser.password };
```

A fresh timestamped user is created for this test only. The credentials are stored in
`ephemeralUser` at module scope so `afterAll` can delete the account after the suite
finishes.

**Browser interactions:**

```typescript
// Register via UI
const registerPage = new RegisterPage(page);
await page.goto(`${BASE_URL}/register`);
await registerPage.register(newUser.username, newUser.email, newUser.password);

// Verify redirect to login page
await page.waitForURL(`${BASE_URL}/login`, { timeout: 15000 });

// Login via UI
const loginPage = new LoginPage(page);
await loginPage.fillEmail(newUser.email);
await loginPage.fillPassword(newUser.password);
await loginPage.clickLogin();
await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 20000 });
await page.waitForLoadState('networkidle');
await expect(page.locator('body')).toBeVisible();
```

`RegisterPage.register()` fills the three inputs by type order (text → email → password)
because the form has no `name` or `id` attributes. After submit, the test waits for a URL
change to `/login` — confirming that the server completed the registration and redirected.
The test then drives the login flow through `LoginPage` and waits for a URL change to
`/dashboard`.

**API cross-validation:**

```typescript
const loginRes = await request.post(`${API_URL}/auth/login`, {
  data: { email: newUser.email, password: newUser.password }
});
expect(loginRes.ok()).toBeTruthy();
const { access_token } = await loginRes.json();

const meRes = await request.get(`${API_URL}/users/me`, {
  headers: { Authorization: `Bearer ${access_token}` }
});
expect(meRes.ok()).toBeTruthy();
const userData = await meRes.json();
expect(userData.email).toBe(newUser.email);
```

A second login via the API (separate from the browser session) obtains a Bearer token,
which is then used to call `GET /users/me`. The assertion on `userData.email` confirms the
user record was written to the database with the exact email submitted in the form — not
a cached or transformed value.

---

### Scenario 2 — Delete a job via UI and verify via API (job-journey.spec.ts)

**Why this matters:** Deletion is the most destructive operation in the application and
the one most likely to surface race conditions. The browser triggers a confirmation
dialog before the delete fires — if the dialog handler is not registered before the
click, the dialog auto-dismisses and the delete never completes. This test also verifies
that the UI removes the card immediately (not just hides it) and that the backend record
is gone — a `GET /jobs/{id}` returning 404 is the only reliable confirmation that the
deletion reached the database.

**Test setup:**

```typescript
const ts = Date.now();
const companyName = `E2E Delete ${ts}`;
```

A timestamped company name is used so this test's job can be identified in the UI and via
the API even if other jobs exist on the account from previous test runs.

**Browser interactions and dialog handling:**

```typescript
// Create the job via UI first so there is something to delete
await page.getByTestId('add-application-btn').click();
await page.getByTestId('job-company-input').fill(companyName);
await page.getByTestId('job-position-input').fill('Tester');
await page.getByTestId('job-status-select').selectOption('applied');
await page.getByTestId('job-submit-btn').click();
await page.waitForLoadState('networkidle');
await expect(page.getByText(companyName)).toBeVisible({ timeout: 10000 });

// Capture the job ID via API before deleting
const listRes = await request.get(`${API_URL}/jobs`, {
  headers: { Authorization: `Bearer ${authToken}` }
});
const listData = await listRes.json();
const job = listData.items.find((j: any) => j.company_name === companyName);

// Register dialog handler BEFORE clicking — avoids race condition
page.once('dialog', async dialog => { await dialog.accept(); });

// Click delete on the specific card, not page.getByTestId which might match wrong card
const deleteCard = page.locator('[data-testid="job-card"]').filter({ hasText: companyName });
await deleteCard.getByTestId('job-delete-btn').click();

// Confirm the card disappears from the UI
await expect(page.getByText(companyName)).toBeHidden({ timeout: 10000 });
await page.waitForLoadState('networkidle');
```

`page.once('dialog', ...)` registers a one-time handler before the click that triggered
the dialog — this is the correct order. Registering it after the click creates a window
where the dialog can fire before the handler is in place and auto-dismiss without
accepting. The test uses `locator.filter({ hasText: companyName })` to scope the delete
button to the specific card rather than clicking whatever `job-delete-btn` appears first.

**API verification:**

```typescript
if (job) {
  const verifyRes = await request.get(`${API_URL}/jobs/${job.id}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  expect(verifyRes.status()).toBe(404);
}
```

The job ID was captured before the deletion so the API call can target the exact record.
A 404 response from the API is the definitive confirmation that the DELETE reached the
database — UI-only disappearance could be explained by a re-render or local state update
that failed to persist.

---

*Last verified: 2026-06-10 — Mustafa (QA-Master505)*

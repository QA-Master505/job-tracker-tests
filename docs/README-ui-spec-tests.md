# UI Spec Tests — Job Tracker

UI spec tests verify individual UI features in isolation using a real browser. Where
end-to-end tests treat the application as a black box and verify complete user journeys,
UI spec tests focus on a specific feature and assert that it behaves correctly on its own
— the login form shows the right error, the job modal opens when the button is clicked,
the status badge updates after a save. The goal is to test each UI feature independently
so that when a test fails, the cause is immediately obvious rather than buried inside a
multi-step flow.

The suite contains seven spec files organised by domain. Two files cover authentication:
login behaviour (form validation, success redirect, route protection) and registration
(form validation, duplicate email handling, success redirect). Three files cover the job
application CRUD operations: creating a job via the modal form, updating a job's status
and notes via the edit modal, and deleting a job with dialog confirmation. One file covers
interview rounds: adding and removing rounds attached to a job. One file covers the user
profile page: displaying account information, updating the username, and email validation.
Together the seven files contain 26 tests across all core UI surfaces.

---

## Tools & Stack

| Item | Detail |
|------|--------|
| Framework | Playwright (`@playwright/test`) |
| Language | TypeScript |
| Browser | Chromium (`devices['Desktop Chrome']`) |
| Selector strategy | `data-testid` attributes for instrumented elements; CSS type selectors as fallback for auth forms |
| Target environment | Production — Vercel + Railway |
| CI workflow | `.github/workflows/allure-report.yml` (UI Spec step) |

---

## Folder Structure

```
tests/ui/
├── auth/
│   ├── login.spec.ts                ← Login form — display, success, errors, route protection (6 tests)
│   └── register.spec.ts             ← Registration form — display, success, duplicate email, validation (5 tests)
├── jobs/
│   ├── create-job.spec.ts           ← Job creation modal — button, modal open, form submit, validation (4 tests)
│   ├── delete-job.spec.ts           ← Job deletion — confirm dialog, successful removal from UI (2 tests)
│   └── update-job.spec.ts           ← Job editing — update status and notes via edit modal (2 tests)
├── interview-rounds/
│   └── interview-rounds.spec.ts     ← Interview rounds panel — add and delete rounds on a job (3 tests)
└── profile/
    └── profile.spec.ts              ← Profile page — display, update username, email validation (4 tests)
```

---

## Selector Strategy

UI spec tests use `data-testid` attributes as the primary selector strategy. These
attributes are stable across visual refactors — renaming a CSS class, restructuring
layout, or changing a button's text does not break a `data-testid` selector. They also
express intent clearly: a locator like `getByTestId('job-submit-btn')` is unambiguous,
whereas `page.locator('button.px-4.py-2.bg-blue-600')` encodes implementation details
that will change.

The auth forms (`/login` and `/register`) are not instrumented with `data-testid`
attributes on their inputs. Tests for those pages fall back to attribute selectors
(`input[type="email"]`, `input[type="password"]`, `button[type="submit"]`) and CSS class
selectors (`p.bg-red-50` for error messages). These selectors are noted with inline
comments in the spec files and page objects wherever they apply.

| `data-testid` | Element | Used in |
|---------------|---------|---------|
| `add-application-btn` | "Add Application" button on dashboard | `create-job.spec.ts`, `DashboardPage` |
| `job-company-input` | Company name input in job modal | `create-job.spec.ts`, `DashboardPage` |
| `job-position-input` | Position input in job modal | `DashboardPage` |
| `job-status-select` | Status dropdown in job modal and edit form | `update-job.spec.ts`, `DashboardPage` |
| `job-submit-btn` | Submit button in job creation modal | `create-job.spec.ts`, `DashboardPage` |
| `job-save-btn` | Save button in job edit modal | `update-job.spec.ts` |
| `job-edit-btn` | Edit button on a job card | `DashboardPage` |
| `job-delete-btn` | Delete button on a job card | `delete-job.spec.ts`, `DashboardPage` |
| `job-card` | Job card container element | `delete-job.spec.ts`, `interview-rounds.spec.ts` |
| `profile-username-input` | Username input on profile page | `profile.spec.ts`, `ProfilePage` |
| `profile-email-input` | Email input on profile page | `profile.spec.ts`, `ProfilePage` |
| `save-username-btn` | Save button in the Change Username section | `profile.spec.ts`, `ProfilePage` |
| `save-email-btn` | Save button in the Change Email section | `profile.spec.ts`, `ProfilePage` |
| `profile-success-msg` | Success confirmation on profile page | `profile.spec.ts`, `ProfilePage` |

---

## Test Files Breakdown

### auth/login.spec.ts

Verifies the login form UI: element visibility, successful redirect on valid credentials,
error display on invalid credentials, native browser validation for empty fields, and
route protection (navigating directly to `/dashboard` while logged out should redirect to
`/login`). A shared `testUser` is created in `beforeAll` and the login page is opened
in `beforeEach`.

| Test Name | What It Verifies |
|-----------|-----------------|
| should display the login form | Email input, password input, and submit button are all visible on the login page |
| should login with valid credentials | Submitting valid credentials redirects to `/dashboard` |
| should show error for invalid credentials | Submitting wrong credentials displays an error message (`p.bg-red-50`) |
| should show error for empty email | Submitting with no email triggers either browser native validation or a server error |
| should show error for empty password | Submitting with no password triggers either browser native validation or a server error |
| should redirect to login when accessing protected route while logged out | Navigating directly to `/dashboard` without a session redirects to `/login` |

---

### auth/register.spec.ts

Verifies the registration form UI: element visibility, successful registration and
redirect, duplicate email rejection, invalid email format, and empty field handling. This
file does not use `createTestUser` — tests that need an existing account create one
inline via `registerUser()` from `api-helpers.ts`. The duplicate email test uses a fresh
browser context to ensure there is no existing session cookie that might affect the
registration result.

| Test Name | What It Verifies |
|-----------|-----------------|
| should display the registration form | Username (text), email, and password inputs plus submit button are visible |
| should register a new user successfully | Submitting a valid unique set of credentials redirects to `/login` |
| should show error for duplicate email | Submitting a previously registered email stays on `/register` and shows an error message |
| should show error for invalid email format | Submitting a non-email string triggers browser native validation or a server error |
| should show error when required fields are empty | Clicking submit with all fields empty triggers native or server-side validation |

---

### jobs/create-job.spec.ts

Verifies the job creation flow: the "Add Application" button is visible on the dashboard,
clicking it opens the modal, submitting a complete form adds the job to the dashboard
list, and submitting with empty required fields triggers validation. A shared `testUser`
is created in `beforeAll`; each test logs in via `LoginPage` in `beforeEach`. An
`afterEach` cleans up any jobs matching the test company name via the API to keep the
account clean between tests.

| Test Name | What It Verifies |
|-----------|-----------------|
| should display the Add Application button on the dashboard | `add-application-btn` is visible after login |
| should open the add job modal | Clicking `add-application-btn` makes `job-company-input` visible |
| should create a new job application | Filling and submitting the form causes the company name to appear in the dashboard list |
| should show error when required fields are missing | Clicking `job-submit-btn` on an empty form triggers native or server-side validation |

---

### jobs/update-job.spec.ts

Verifies that the job edit modal updates persist in the UI. Each test gets a fresh job
created via the API in `beforeEach` (with a timestamped company name to prevent
interference between tests), logs in, and navigates to the dashboard. `afterEach` deletes
the job via the API regardless of the test outcome.

| Test Name | What It Verifies |
|-----------|-----------------|
| should update job status | Selecting a new status and saving displays the updated status as a badge (`span.rounded-full:has-text("Phone Interview")`) |
| should update job notes | Editing the notes textarea and saving makes the new text visible in the UI |

---

### jobs/delete-job.spec.ts

Verifies the job deletion flow: the job disappears from the UI after deletion, and the
delete button shows a confirmation dialog before proceeding. The dialog test dismisses
rather than accepts — it is testing only that the dialog fires, not that the deletion
completes. Each test starts with a job created via the API in `beforeEach`; `afterEach`
calls `deleteJob` silently (`.catch(() => {})`) in case the test itself already deleted
the job.

| Test Name | What It Verifies |
|-----------|-----------------|
| should delete a job application | After accepting the confirmation dialog, the company name disappears from the dashboard |
| should show confirmation dialog before deleting | Clicking `job-delete-btn` triggers a browser dialog with a non-empty message |

---

### interview-rounds/interview-rounds.spec.ts

Verifies the interview rounds panel: the panel toggle button is visible on jobs with a
non-`applied` status, rounds can be added via the form, and rounds can be deleted. Each
test creates a job with status `phone_interview` via the API in `beforeEach` — the
Interview Rounds button only appears on jobs that have progressed past the applied stage.
`afterEach` deletes the job via the API.

| Test Name | What It Verifies |
|-----------|-----------------|
| should display the Interview Rounds section for non-applied jobs | The "Interview Rounds" toggle button is visible on a `phone_interview` job card |
| should add an interview round to a job | Filling and submitting the Add Interview Round form causes "Round 1" to appear |
| should delete an interview round | After creating a round, clicking its Delete button (with dialog accepted) removes "Round 1" from the UI |

---

### profile/profile.spec.ts

Verifies the profile page: the page renders at `/profile`, the current user's email is
displayed in the Account Details section, the username can be updated with a success
confirmation, and submitting an invalid email format triggers validation. A shared
`testUser` is created in `beforeAll`; each test logs in and navigates to the profile page
in `beforeEach`.

| Test Name | What It Verifies |
|-----------|-----------------|
| should display the profile page | URL matches `/profile` after navigation |
| should display current user information in Account Details | The test user's email is visible as plain text (rendered in `<dd>` elements, not inputs) |
| should update username successfully | Filling a new username, clicking `save-username-btn`, and checking `profile-success-msg` is visible and non-empty |
| should show browser validation for invalid email on profile update | Entering a non-email string and clicking `save-email-btn` triggers native or server-side validation |

---

## Test Infrastructure

### Test user lifecycle

Six of the seven spec files call `createTestUser(request)` in `beforeAll`. This function
registers a fresh timestamped user (`testuser{timestamp}@example.com`), then immediately
logs in via the API to capture the `httpOnly` cookie from the `Set-Cookie` response
header. The returned `TestUser` object carries four fields: `email`, `username`,
`password`, and `cookieHeader` (a ready-to-use `access_token=<jwt>` string).

`cookieHeader` is used directly in all `api-helpers.ts` calls for that suite —
`createJob`, `deleteJob`, `getJobs`. The `buildAuthHeader()` function in `api-helpers.ts`
detects the `access_token=` prefix and sends it as a `Cookie:` header rather than
`Authorization: Bearer`, matching the format the server's `httpOnly` cookie middleware
expects.

Cleanup is done in `afterAll` via `deleteTestUser(request, email, password, cookieHeader)`.
Passing `cookieHeader` skips the re-login step inside `deleteTestUser` — the function
uses the already-captured cookie directly for the `DELETE /users/me` call and the
subsequent `GET /auth/me` verification.

`register.spec.ts` is the exception: it does not register a shared user. The test
`'should register a new user successfully'` creates a user via the UI and does not clean
it up (the account is ephemeral and timestamped). The `'should show error for duplicate
email'` test registers a user via `registerUser()` from `api-helpers.ts` and also does
not clean it up.

### Job creation via API in beforeEach

Three spec files — `update-job.spec.ts`, `delete-job.spec.ts`, and
`interview-rounds.spec.ts` — need an existing job in the database before the browser
interaction can begin. Rather than creating the job through the UI in every test (which
would add extra browser steps and couple the setup to the UI form), they call
`createJob(request, testUser.cookieHeader, {...})` directly in `beforeEach`. The API
response returns the job ID, which is stored in `jobId` for use in `afterEach` cleanup.

Each call uses a timestamped company name (`Update Job Co ${Date.now()}`,
`Delete Job Co ${Date.now()}`, `IR Co ${Date.now()}`). This prevents any cross-test
interference: if a previous test's `afterEach` cleanup failed, the next test's job has a
different name and ID and is unaffected.

`create-job.spec.ts` takes the opposite approach — its tests exercise the creation flow
itself, so there is no pre-created job. Instead its `afterEach` uses `getJobs` +
`deleteJob` to find and remove any jobs matching the shared `testJob.company_name`
(`'Playwright Test Company'`), regardless of how many were created.

### Why beforeAll not beforeEach for user creation

`createTestUser` makes two API calls (register + login) and a database write. Running it
before every test in a suite would multiply that cost and leave more accounts needing
cleanup. More practically, the test user's credentials (`email`, `password`,
`cookieHeader`) do not change between tests in the same suite — there is no reason to
create a new identity for each one. A single account created in `beforeAll` is shared
safely across all tests in that `describe` block.

---

## CI/CD

### allure-report.yml (UI Spec step)

UI spec tests run inside `allure-report.yml`, the same unified workflow that also runs
API, BDD, and E2E tests. The workflow triggers on completion of any of four upstream
workflows — "API Tests", "Full Test Suite", "E2E Tests", or "UI Spec Tests" — on the
`main` branch, or manually via `workflow_dispatch`.

The UI Spec test step runs last among the test suites, after E2E:

```bash
npx playwright test tests/ui/
```

The step is marked `if: always()`, so it runs even when earlier suites in the same
workflow job fail.

**Environment:** UI spec tests target the production stack:

```yaml
BASE_URL: https://job-tracker-frontend-green-sigma.vercel.app
API_URL: https://job-tracker-backend-production-7acf.up.railway.app
```

The `API_URL` is used by the `createJob`, `deleteJob`, and `getJobs` calls in `beforeEach`
and `afterEach`. The browser interacts with the production Vercel frontend, which in turn
calls the production Railway backend — the same path a real user's browser would take.

After the step completes, the workflow generates the Allure report from the accumulated
`allure-results/` output and publishes it to GitHub Pages. UI spec results appear under
the **UI Spec Tests** suite label in the live report.

---

## Running Locally

UI spec tests target production by default. No local server setup is required for a
standard run.

```bash
# Run all UI spec tests (headed — Makefile default)
make test-ui

# Run headless via npx
npx playwright test tests/ui/

# Run a single spec file
npx playwright test tests/ui/auth/login.spec.ts
npx playwright test tests/ui/jobs/create-job.spec.ts

# Run with visible browser
npx playwright test tests/ui/ --headed

# Run in Playwright debug mode
npx playwright test tests/ui/ --debug
```

> `make test-ui` launches Chromium in headed mode (visible browser). Use
> `npx playwright test tests/ui/` directly for a headless run without the Makefile.

`BASE_URL` and `API_URL` default to production and do not need to be set for a standard
run. Both can be overridden in `.env.test`:

```env
BASE_URL=https://job-tracker-frontend-green-sigma.vercel.app
API_URL=https://job-tracker-backend-production-7acf.up.railway.app
```

On failure, Playwright automatically captures a screenshot, retains a video recording,
and saves a trace on the first retry — all configured in `playwright.config.ts`.

---

## Test Scenarios

### Scenario 1 — Login with valid credentials (auth/login.spec.ts)

**Why this matters:** Login is the gateway to every other test in the UI spec suite —
six of the seven spec files log in as part of their `beforeEach`. If the login step
is broken in production, every suite that depends on it will fail. This test isolates
the login outcome specifically: it verifies that a known-good account navigates from
`/login` to `/dashboard` after submitting credentials, independently of any subsequent
page interaction.

**Test setup:**

```typescript
test.beforeAll(async ({ request }) => {
  testUser = await createTestUser(request);
});

test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page);
  await loginPage.goto();
});
```

`createTestUser` registers a timestamped user via `POST /auth/register`, then logs in
via `POST /auth/login` to capture the `httpOnly` cookie. The `beforeEach` navigates to
`/login` before every test in the suite.

**Browser interactions:**

```typescript
test('should login with valid credentials', async ({ page }) => {
  await loginPage.login(testUser.email, testUser.password);
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
});
```

`LoginPage.login()` fills the email and password inputs using CSS type selectors
(`input[type="email"]`, `input[type="password"]`) and clicks `button[type="submit"]`.
These selectors are necessary because the login form has no `data-testid` attributes on
its inputs. The URL assertion waits up to 10 seconds for the navigation to `/dashboard`
to complete.

**What it verifies:** The frontend's authentication flow — form submission, JWT issuance
by the backend, cookie storage, and the redirect to the authenticated view — all work
correctly in the production environment. A failure here indicates a problem in the
login endpoint, the session middleware, or the frontend's post-login navigation logic.

---

### Scenario 2 — Update job status (jobs/update-job.spec.ts)

**Why this matters:** The status field is the primary way users track where a job
application stands in the pipeline. This test verifies that the edit modal correctly
receives a status change, persists it, and reflects the update as a visible badge in the
UI — a sequence that touches the modal open/close logic, the `PATCH /jobs/{id}` API
call, and the dashboard re-render.

**Test setup:**

```typescript
test.beforeEach(async ({ page, request }) => {
  jobCompanyName = `Update Job Co ${Date.now()}`;
  const response = await createJob(request, testUser.cookieHeader, {
    ...testJob,
    company_name: jobCompanyName,
  });
  const job = await response.json();
  jobId = job.id;

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(testUser.email, testUser.password);
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  dashboardPage = new DashboardPage(page);
  await dashboardPage.goto();
});
```

The job is created via the API (`createJob` uses `testUser.cookieHeader` as the `Cookie:`
header). The job ID is captured from the response and stored for cleanup in `afterEach`.
The browser is then logged in via `LoginPage` and navigated to the dashboard.

**Browser interactions:**

```typescript
test('should update job status', async ({ page }) => {
  await dashboardPage.clickJobCard(jobCompanyName);
  await page.getByTestId('job-status-select').selectOption('phone_interview');
  await page.getByTestId('job-save-btn').click();
  await expect(
    page.locator('span.rounded-full:has-text("Phone Interview")')
  ).toBeVisible({ timeout: 10000 });
});
```

`DashboardPage.clickJobCard()` opens the edit modal by clicking `job-edit-btn` on the
first card. The status dropdown is targeted by `data-testid='job-status-select'` and
the save button by `data-testid='job-save-btn'`. After the modal closes, the test asserts
that the status badge text has updated — the badge is not identified by a `data-testid`
but by a combined CSS class and text selector (`span.rounded-full:has-text("Phone
Interview")`), which is stable as long as the badge element and label text do not change.

**What it verifies:** The end-to-end edit path for a job's status field: the edit modal
opens correctly for a specific card, the select input accepts the new value, the save
persists the change to the backend, and the dashboard re-renders with the updated badge.
The distinction from an E2E test is that this test does not cross-validate via the API —
it asserts only what the user would see on screen.

---

*Last verified: 2026-06-10 — Mustafa (QA-Master505)*

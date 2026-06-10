# Postman / Newman Tests — Job Tracker

The Postman collection for Job Tracker did not start as a CI/CD artefact — it started
as a tool for understanding the API. Before any browser automation existed, every
endpoint needed to be manually exercised to establish a baseline: what did a successful
registration look like, what did the JWT payload contain, how did the jobs pagination
work, what status codes did the backend return for invalid input. Postman was the right
tool for that exploration because it provides an immediate response panel, a URL preview
that shows the resolved variable values before sending, and an environment system that
lets the same requests run against different backends just by switching a dropdown. The
collection grew from that foundation — first adding test scripts to capture tokens and
assert status codes, then chaining requests to automate the multi-step flows, then
running the entire collection headlessly via Newman in GitHub Actions.

The result is a 53-request collection with 84 assertions organised into eight folders
covering health, authentication, job CRUD, interview rounds, user profile, structured
test scenarios (happy path, negative, edge case), an E2E API suite, and a CI cleanup
step. Newman executes the collection on a scheduled Sunday cron and as part of the
unified `allure-report.yml` pipeline, producing a JUnit XML report that feeds into the
live Allure report on GitHub Pages and a Slack summary to `#qa-automation`.

---

## Tools & Stack

| Item | Detail |
|------|--------|
| API client | Postman 12 (GUI, for authoring and manual runs) |
| CLI runner | Newman (`newman` npm package) |
| Collection format | Postman Collection v2.1 JSON |
| Environment management | Postman environment files (`production-environment.json`) |
| CI workflows | `postman-tests.yml` (standalone) + `allure-report.yml` (unified pipeline) |
| Reporting format | Newman HTML Extra (standalone) + JUnit XML → Allure (unified) |

---

## Phase 1: Manual Exploration in Postman

I started by importing the backend's OpenAPI spec into Postman and firing each endpoint
individually against the local development server. The goal at this stage was not to
test — it was to understand. I wanted to know what the response bodies looked like, which
fields were required, what the error shapes were when validation failed, and whether the
JWT returned in the login response was a Bearer token in the body or an `httpOnly` cookie
in the header. (It turned out to be both, depending on how the frontend used the API.)

I created two environments in Postman: `dev` pointing at `http://localhost:8000` and
`production` pointing at the Railway deployment. Each environment had the same variable
keys — `baseUrl`, `authToken`, `jobId` — so the same request could be pointed at any
environment just by switching the active environment in the top-right dropdown. Before
sending any request, I used the URL preview panel to verify that `{{baseUrl}}/jobs` was
resolving to the correct URL for the active environment. This caught several early
mistakes where variables were misspelled or the wrong environment was selected. Results
were inspected manually in the response panel: status code, headers, body, response time.
This phase gave me a concrete mental model of how the API behaved before I added any
assertions.

---

## Phase 2: Adding Test Scripts and Request Chaining

Once I understood how each endpoint behaved, I started adding test scripts in the Tests
tab of individual requests using Postman's sandbox JavaScript — `pm.test()` for named
assertions and `pm.expect()` for Chai-style value checks. I added the simplest assertion
first: `pm.response.to.have.status(200)`. Then I added structural assertions: does the
response body have an `access_token` field? Does the jobs response have an `items`
array? I ran each request individually and watched the test results pane to confirm the
assertion passed before moving to the next.

The biggest quality-of-life improvement came when I added pre-request scripts to chain
requests together. The Login request's test script saves the JWT to the environment:

```javascript
const json = pm.response.json();
if (json.access_token) {
    pm.environment.set("authToken", json.access_token);
    console.log("✅ Token saved:", json.access_token.substring(0, 20) + "...");
}
```

After that, every subsequent request that needed authentication simply referenced
`{{authToken}}` in its Authorization header — no manual copy-paste between requests.
Similarly, the Create Job test script saved `{{jobId}}`, so Update Job and Delete Job
would automatically target the job that was just created. I enabled "Stop run if an
error occurs" in the Collection Runner during manual runs so that if Login failed (and
the token was never saved), every downstream request would halt immediately rather than
running with an empty `authToken` and producing misleading 401 failures.

The collection grew incrementally in this phase: the Authentication folder was built and
verified first, then Job Applications, then Interview Rounds, then User Profile. Each
folder was run in isolation using the "Run folder" button to confirm it passed before
being wired into the full collection run. By the end of this phase, the entire collection
could be run end to end in the Postman GUI with a single click and produce a clear
pass/fail count.

---

## Phase 3: Collection Structure and Suite Organisation

The final collection has nine top-level folders and two standalone requests at the root
level. Folders were verified independently first, then the full collection was run using
the "Run collection" button with "Stop run if an error occurs" enabled:

```
Job Application Tracker
├── 🏥 Health & Status
│   └── Health Check
├── 🔐 Authentication
│   ├── Register
│   ├── Login
│   └── Get Current User
├── 💼 Job Applications
│   ├── 📋 Interview Rounds (subfolder)
│   │   ├── Setup: Create Job for Interviews
│   │   ├── Add Interview Rounds
│   │   ├── Get All Rounds
│   │   ├── Update Rounds
│   │   └── Delete Round
│   ├── Get All Jobs
│   ├── Get Job by ID
│   ├── Create Job
│   ├── Update Job
│   └── Delete Job
├── 👤 User Profile
│   ├── Get Current User
│   ├── Update Profile
│   ├── Update Email
│   ├── Update Username
│   └── Change Password
├── 🧪 Test Scenarios
│   ├── ✅ Happy Path (3 requests)
│   ├── ❌ Negative Tests (16 requests)
│   └── 🔄 Edge Cases (1 request)
├── ⚙️ Environment Variables
│   └── README — Setup Guide (documentation request)
├── Logout (standalone)
├── Delete Account (standalone)
└── E2E Test Suite (10 requests + CI Cleanup)
```

The collection runs 53 requests with 84 assertions. The Interview Rounds subfolder sits
inside Job Applications because rounds are a resource that belongs to a job — the setup
request creates a job and saves `{{jobId}}` before any round requests fire. The Test
Scenarios folder organises the more targeted assertion tests separately from the CRUD
operations so they can be run independently or skipped without affecting the core flow.
The E2E Test Suite folder runs a complete lifecycle — register, login, create job, add
interview round, update status, update profile, delete job, logout, delete account — as
a single chained sequence and ends with the CI Cleanup request.

---

## Phase 4: Newman CLI Automation

Newman is Postman's official command-line runner. It executes a collection file against
an environment file without requiring the Postman GUI to be open, which is the
prerequisite for running in CI. The output from Newman can be formatted as JUnit XML
(readable by Allure and other report aggregators), HTML Extra (a rich standalone HTML
report), or plain CLI output. Adding Newman to the pipeline meant the exact same
collection that was verified manually in Postman could now run automatically on a
schedule.

The Newman command used in `postman-tests.yml`:

```bash
newman run postman/job-tracker-collection.json \
  --environment postman/production-environment.json \
  --reporters cli,htmlextra,junit \
  --reporter-htmlextra-export results/postman-report.html \
  --reporter-junit-export results/postman-junit.xml \
  --suppress-exit-code
```

Each flag serves a specific purpose:

- `--environment postman/production-environment.json` — injects the environment variable
  set into the run, overriding the empty `authToken` and `jobId` placeholders in the
  collection file with whatever values the production environment file specifies. This is
  how `{{baseUrl}}` resolves to the Railway URL without hard-coding it in the collection.
- `--reporters cli,htmlextra,junit` — produces three output formats simultaneously: a
  live pass/fail summary to stdout, a rich HTML report with request/response details, and
  a JUnit XML file for machine-readable ingestion.
- `--reporter-junit-export results/postman-junit.xml` — writes the JUnit file to the
  `results/` directory, uploaded as a CI artifact for 30 days.
- `--suppress-exit-code` — tells Newman to always exit 0 even when assertions fail. This
  is intentional: without it, a single test failure causes Newman to exit non-zero, which
  marks the entire CI step as failed before the Slack notification step can fire. With
  `--suppress-exit-code`, the step completes normally, the Slack notification always
  runs, and the actual pass/fail information is communicated through the JUnit XML and
  the Slack message content.

In `allure-report.yml`, the same collection runs with a slightly different command — only
`cli,junit` reporters are used (no HTML Extra), and the JUnit output goes to
`allure-results/newman-junit.xml` so Allure can pick it up when generating the unified
report.

---

## Collection Deep Dive

### 🏥 Health & Status

A single `GET /health` request that verifies the API server is reachable and returns a
`status` field. This is the first request in every collection run — if it fails, the
backend is down and no further assertions make sense.

| Request | Method | Endpoint |
|---------|--------|----------|
| Health Check | GET | `/health` |

Test script asserts `status 200` and that the `response.status` property exists.

---

### 🔐 Authentication

Registers a new user, logs in to capture the JWT, and calls the `/auth/me` endpoint to
verify the token works. The Login request is the pivot point for the entire collection —
its test script writes `{{authToken}}` to the environment, which every subsequent
authenticated request depends on.

| Request | Method | Endpoint |
|---------|--------|----------|
| Register | POST | `/auth/register` |
| Login | POST | `/auth/login` |
| Get Current User | GET | `/auth/me` |

The Register test script saves `{{registeredEmail}}` and `{{registeredUsername}}` to the
environment — these are referenced later by the Negative Tests duplicate email/username
requests. The Login pre-request script calls `pm.environment.unset('authToken')` to
ensure the token is always freshly obtained from the response body, not carried over from
a previous run.

A collection-level pre-request script runs before every request in the collection and
auto-generates timestamped credentials if `{{email}}` is not already set:

```javascript
if (!pm.environment.get("email") || !pm.environment.get("email").includes("testuser_")) {
    const ts = Date.now();
    pm.environment.set("email", `testuser_${ts}@test.com`);
    pm.environment.set("password", "Test123!");
    pm.environment.set("username", `testuser_${ts}`);
    console.log("Generated new test user:", `testuser_${ts}@test.com`);
} else {
    console.log("Reusing credentials:", pm.environment.get("email"));
}
```

---

### 💼 Job Applications

Covers the full job CRUD cycle. Create Job saves `{{jobId}}` to the environment; Update
Job and Delete Job use that ID automatically. The folder also contains the Interview
Rounds subfolder.

| Request | Method | Endpoint |
|---------|--------|----------|
| Get All Jobs | GET | `/jobs?page=1&page_size=10` |
| Get Job by ID | GET | `/jobs/{{jobId}}` |
| Create Job | POST | `/jobs` |
| Update Job | PUT | `/jobs/{{jobId}}` |
| Delete Job | DELETE | `/jobs/{{jobId}}` |

Get All Jobs asserts the paginated response shape (`items`, `total`, `page`, `page_size`,
`total_pages`). Update Job asserts `response.status === "phone_interview"` — a concrete
field-level assertion rather than just a status code check.

The folder has a folder-level test script that handles 204 responses safely:

```javascript
if (pm.response.text().trim() !== '') {
    const response = pm.response.json();
    if (response.id && response.user_id) {
        pm.environment.set('jobId', response.id);
    }
    if (response.access_token) {
        pm.environment.set('authToken', response.access_token);
    }
}
```

This guard fires for every request in the folder — DELETE returns 204 with an empty body,
and calling `pm.response.json()` on an empty body throws a parse error. The
`trim() !== ''` check prevents that.

#### 📋 Interview Rounds (subfolder)

The subfolder creates a job specifically for interview round tests (saving a separate
`{{jobId}}`), then exercises the full interview round lifecycle.

| Request | Method | Endpoint |
|---------|--------|----------|
| Setup: Create Job for Interviews | POST | `/jobs` |
| Add Interview Rounds | POST | `/jobs/{{jobId}}/interviews` |
| Get All Rounds | GET | `/jobs/{{jobId}}/interviews` |
| Update Rounds | PUT | `/jobs/{{jobId}}/interviews/{{interviewId}}` |
| Delete Round | DELETE | `/jobs/{{jobId}}/interviews/{{interviewId}}` |

Add Interview Rounds saves `{{interviewId}}` to the environment. Get All Rounds asserts
the response is an array. Update Rounds asserts `response.notes` exists.

---

### 👤 User Profile

Covers reading and updating the authenticated user's profile. The Update Profile and
Update Username pre-request scripts generate timestamped values (`profile_${Date.now()}`
and `user_${Date.now()}`) to avoid uniqueness conflicts on repeated runs.

| Request | Method | Endpoint |
|---------|--------|----------|
| Get Current User | GET | `/users/me` |
| Update Profile | PUT | `/users/me` |
| Update Email | PUT | `/users/me` |
| Update Username | PUT | `/users/me` |
| Change Password | PUT | `/users/me` |

---

### 🧪 Test Scenarios

Three subfolders that target specific pass/fail behaviours rather than exercising CRUD
flows.

**✅ Happy Path** verifies that a fresh dynamic user (credentials generated in the
pre-request script) can register, log in, and create a job — the complete acquisition
funnel in three requests. The Valid Job Creation test also asserts response time is below
2000 ms.

**❌ Negative Tests** covers 16 error scenarios: unauthenticated access to protected
endpoints (401), accessing another user's job (403/404), duplicate email and username
registration (409), wrong current password (400), invalid token (401), missing required
fields in job creation (422), and non-existent resource (404). Several of these use
`pm.expect(pm.response.code).to.be.oneOf([...])` rather than a single fixed code to
handle cases where the backend's exact response can legitimately vary.

**🔄 Edge Cases** has one request: posting a job with empty string values for required
fields. Expected response is 422 Unprocessable Entity.

---

### E2E Test Suite

A self-contained end-to-end chain that registers a new user, logs in, creates a job
application, adds an interview round, updates the job's status, reads the jobs list,
updates the user's profile, deletes the job, logs out, and deletes the account. Each
step saves its output to the environment so the next step can reference it. The final
🧹 CI Cleanup request is a safety net — it issues a `DELETE /users/me` after all other
steps finish, accepting 200, 204, 401, or 404 as valid responses so it always passes
regardless of whether the account still exists.

---

## Environment Management

The collection uses two environments, each defined with the same variable keys but
different values for `baseUrl`:

| Environment | `baseUrl` |
|-------------|-----------|
| dev | `http://localhost:8000` |
| production | `https://job-tracker-backend-production-7acf.up.railway.app` |

Switching environments in the Postman GUI is a single dropdown selection — the same
requests immediately target the new base URL without any edits to the collection. Newman
selects the environment via the `--environment` flag: `--environment postman/production-environment.json`.

The exported `production-environment.json` stores three variables:

| Variable | Type | Description |
|----------|------|-------------|
| `baseUrl` | default | Railway production URL |
| `authToken` | secret | JWT (empty at export time; auto-populated by Login test script) |
| `jobId` | default | Job ID (empty at export time; auto-populated by Create Job test script) |

All other variables (`email`, `password`, `username`, `registeredEmail`,
`registeredUsername`, `interviewId`, `e2eEmail`, `e2eUsername`, etc.) are created
dynamically at runtime by pre-request and test scripts using `pm.environment.set()`.
They do not need to be pre-populated in the environment file.

---

## CI/CD Integration

### postman-tests.yml

**Trigger:** manual `workflow_dispatch` and scheduled weekly (`0 22 * * 0` — Sunday at
22:00 UTC, midnight Vienna time).

The workflow clones `job-tracker-backend`, sets up Python 3.11, runs Alembic migrations
against a PostgreSQL 16 service container, and starts the FastAPI server on port 8000.
Newman is then installed globally and the collection is run:

```bash
newman run postman/job-tracker-collection.json \
  --environment postman/production-environment.json \
  --reporters cli,htmlextra,junit \
  --reporter-htmlextra-export results/postman-report.html \
  --reporter-junit-export results/postman-junit.xml \
  --suppress-exit-code
```

Newman targets the production Railway URL (from `production-environment.json`) rather
than the local backend started earlier in the workflow. After the Newman step,
`scripts/notify-newman-slack.mjs` runs unconditionally (`if: always()`) and parses
`allure-results/newman-junit.xml` to post a result summary to `#qa-automation`. The
`results/` folder is uploaded as a `postman-report` artifact retained for 30 days.

### allure-report.yml (Newman step)

The unified report workflow includes a Newman step that runs after API tests and before
BDD tests, as part of the same job:

```bash
newman run postman/job-tracker-collection.json \
  --environment postman/production-environment.json \
  --reporters cli,junit \
  --reporter-junit-export allure-results/newman-junit.xml \
  --suppress-exit-code
```

The JUnit output lands in `allure-results/` alongside Playwright Allure results. A
subsequent step renames the `<testsuite name>` attribute in the XML to `"Postman Tests"`
so the Allure report labels the Newman results correctly in the **Postman Tests** suite
section. After all suites complete, `npx allure generate allure-results --clean -o allure-report`
produces the unified report published to GitHub Pages.

---

## Running Locally

**Via Newman CLI:**

```bash
# Install Newman globally (one-time)
npm install -g newman
npm install -g newman-reporter-htmlextra

# Run against production
newman run postman/job-tracker-collection.json \
  --environment postman/production-environment.json

# Run with HTML report output
newman run postman/job-tracker-collection.json \
  --environment postman/production-environment.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export results/postman-report.html

# Run a specific folder only
newman run postman/job-tracker-collection.json \
  --environment postman/production-environment.json \
  --folder "🔐 Authentication"
```

**Via Postman GUI:**

1. Open Postman and import `postman/job-tracker-collection.json` (File → Import)
2. Import `postman/production-environment.json` as an environment
3. Select the `Production` environment from the top-right dropdown
4. Open the Collection Runner (right-click the collection → Run collection)
5. Enable "Stop run if an error occurs" for sequential chained runs
6. Click "Run Job Application Tracker"

**Updating the collection:**

After making changes in the Postman GUI, export the updated collection:
File → Export → Collection v2.1 → save over `postman/job-tracker-collection.json`. Export
the environment the same way and save over `postman/production-environment.json`. Commit
both files — Newman reads them directly from the repository.

---

## Key Design Decisions

### Why `--suppress-exit-code` instead of letting Newman fail the CI step

When Newman encounters a failing assertion, it exits with a non-zero code by default.
In GitHub Actions, a non-zero exit code marks the step as failed and, depending on the
`if:` condition on subsequent steps, can prevent them from running. The Slack
notification step uses `if: always()`, which does fire after a failed step — but the
workflow log still shows a failed step in red, which can obscure whether the failure was
a real assertion failure or a Newman configuration problem. More importantly, in the
`allure-report.yml` workflow, a Newman failure that exits non-zero would interrupt the
entire workflow job before BDD and UI spec tests run, preventing those results from
appearing in the Allure report. Using `--suppress-exit-code` ensures Newman always exits
cleanly. The real pass/fail signal is carried by the JUnit XML content, which the Slack
script and Allure both read correctly.

### Why 204 responses are guarded before JSON parsing

HTTP 204 No Content responses have an empty body by specification. Several endpoints in
the collection — Delete Job, Delete Round — return 204. If a test script or the
folder-level script calls `pm.response.json()` on a 204 response, Postman's sandbox
throws a JSON parse error, which is recorded as a test failure even though the status
code was correct. The Job Applications folder-level script guards every response with
`if (pm.response.text().trim() !== '')` before attempting to parse. This pattern avoids
false failures while still enabling the script to extract data (like `jobId` or
`authToken`) from responses that do have a body.

### Why `pm.environment` is used instead of `pm.collectionVariables` for token storage

`pm.collectionVariables` stores values in the collection file itself — they persist
between Postman sessions but cannot be injected from outside the collection. Using
`pm.environment.set("authToken", ...)` stores the token in the active environment, which
can be pre-seeded externally and which Newman resolves at runtime from the `--environment`
file. This means the `authToken` value in `production-environment.json` could be
pre-populated with a long-lived token for read-only CI scenarios without modifying the
collection. In practice the Login request always refreshes it, but the architecture
supports pre-seeding. Environment variables are also visible in the Postman Environment
panel during manual debugging, making it easy to inspect the current token value without
opening the Login response.

### Why the collection targets production Railway rather than a local backend in CI

The Playwright E2E and UI spec tests in the same pipeline drive a real browser against
the production Vercel frontend, which calls the production Railway backend. If the Newman
tests targeted a local FastAPI instance instead, a passing Newman run would not validate
the same deployment that users hit — it would only validate that the code works locally.
Running Newman against production ensures that every CI run tests the exact deployed API,
including any Railway configuration, environment variables, and migration state. A failure
in Newman means something is wrong in the production environment, not just in the test
setup. The `production-environment.json` file makes this explicit: `baseUrl` is the
Railway URL, and there is no mechanism in the collection to fall back to localhost.

---

*Last verified: 2026-06-10 — Mustafa (QA-Master505)*

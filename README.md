# Job Tracker — QA Automation Platform

A full-stack QA automation platform for the
[Job Tracker](https://job-tracker-frontend-green-sigma.vercel.app)
application, built with Playwright, Cucumber BDD, Newman/Postman,
GitHub Actions CI/CD, Slack notifications, Jira integration, and
unified Allure reporting.

---

## 🚀 Overview

This repository contains a multi-layered test automation suite covering
API, Admin API, BDD, End-to-End, UI Spec, Postman contract tests, and
planned database automation tests — all integrated into a scheduled
CI/CD pipeline with real-time Slack alerts, automatic Jira bug
management, and a live Allure report.

---

## 🧭 How to Navigate This Repo

| If you want to...                  | Go to...                                                                                        |
|------------------------------------|-------------------------------------------------------------------------------------------------|
| Understand the full test strategy  | [`## 🧪 Test Suites`](#-test-suites)                                                            |
| Read detailed docs for a suite     | [`## 📚 Test Documentation`](#-test-documentation)                                              |
| Run tests locally right now        | [`## 🏃 Running Tests`](#-running-tests)                                                        |
| Understand the CI/CD pipeline      | [`## 🔄 CI/CD Pipeline`](#-cicd-pipeline)                                                       |
| See the live Allure report         | [qa-master505.github.io/job-tracker-tests](https://qa-master505.github.io/job-tracker-tests/)  |
| Find the backend or frontend repos | [`## 🔗 Related Repositories`](#-related-repositories)                                          |
| Read database test documentation   | [README-database-automation-tests.md](docs/README-database-automation-tests.md)                 |
| Understand the security defence mechanisms | [`docs/README-security-defence-testing.md`](docs/README-security-defence-testing.md) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Application Under Test                │
│                                                         │
│   Frontend (React + Vercel)  ←→  Backend (FastAPI +     │
│   job-tracker-frontend-           Railway)              │
│   green-sigma.vercel.app          job-tracker-backend-  │
│                                   production.railway.app│
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    Test Suites                          │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  API Tests   │  │  Admin API   │  │  BDD Tests   │  │
│  │  Playwright  │  │  Tests       │  │  Cucumber +  │  │
│  │  21 tests    │  │  23 tests    │  │  Playwright  │  │
│  │  tests/api/  │  │  admin.spec  │  │  9 scenarios │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  E2E Tests   │  │  UI Spec     │  │  Postman /   │  │
│  │  Playwright  │  │  Playwright  │  │  Newman      │  │
│  │  6 tests     │  │  25 tests    │  │  52 requests │  │
│  │  tests/e2e/  │  │  tests/ui/   │  │  postman/    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│               Database Automation Tests                 │
│               (job-tracker-backend repo)                │
│   pytest + SQLAlchemy · Docker PostgreSQL (port 5433)   │
│   tests/db/ · 5 files · constraints + migrations +      │
│   cascades + queries + audit log                        │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                  CI/CD Pipeline                         │
│                                                         │
│  GitHub Actions                                         │
│  ├── api-tests.yml       (push to main + nightly)       │
│  ├── admin-tests.yml     (manual dispatch)              │
│  ├── ui-tests.yml        (BDD scheduled)                │
│  ├── postman-tests.yml   (Sunday scheduled)             │
│  ├── full-suite.yml      (manual, 16 combinations)      │
│  └── allure-report.yml   (auto after API/Full Suite)    │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   Integrations                          │
│                                                         │
│  Slack (#qa-automation, #ci-cd-reports, #bugs)          │
│  Jira (auto-create / auto-close bug tickets)            │
│  Allure (unified report → GitHub Pages)                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Suites

| Suite            | Framework                    | Tests                       | Location                        |
|------------------|------------------------------|-----------------------------|---------------------------------|
| API Tests        | Playwright APIRequestContext  | 25                          | `tests/api/`                    |
| Admin API Tests  | Playwright APIRequestContext  | 23                          | `tests/api/admin.spec.ts`       |
| BDD Tests        | Cucumber + Playwright         | 9 scenarios (48 steps)      | `tests/bdd/`                    |
| E2E Tests        | Playwright Chromium           | 6                           | `tests/e2e/`                    |
| UI Spec Tests    | Playwright Chromium           | 26                          | `tests/ui/`                     |
| Postman / Newman | Newman CLI                   | 53 requests · 84 assertions | `postman/`                      |
| Database Tests   | pytest + SQLAlchemy           | 23                          | `job-tracker-backend/tests/db/` |
| **Total**        |                              | **171+**                    |                                 |

> ⚠️ Database automation tests live in the `job-tracker-backend` repository
> under `tests/db/` and are not executed from this repo. The count will be
> updated once all DB test files are complete.
>
> Admin API Tests run separately from the main API suite via their own CI
> workflow (`admin-tests.yml`) because they require a seeded superadmin account.
>
> BDD count shows 9 scenarios (the Gherkin-level test count). Allure reports 48
> because it counts individual Gherkin steps. Postman count shows 53 requests
> executed with 84 assertions verified.

---

## 📚 Test Documentation

Detailed documentation for each test suite lives in the [`docs/`](docs/) folder.
Each file covers purpose, tools, environment setup, test case tables, and
execution commands for that specific suite.

| Suite                     | Status         | Documentation                                                                   |
|---------------------------|----------------|---------------------------------------------------------------------------------|
| API Tests                 | ✅ Complete    | [README-api-tests.md](docs/README-api-tests.md)                                 |
| Admin API Tests           | ✅ Complete    | [README-api-tests.md](docs/README-api-tests.md)                                 |
| BDD Tests                 | ✅ Complete    | [README-bdd-tests.md](docs/README-bdd-tests.md)                                 |
| E2E Tests                 | ✅ Complete    | [README-e2e-tests.md](docs/README-e2e-tests.md)                                 |
| UI Spec Tests             | 🚧 In progress | [README-ui-spec-tests.md](docs/README-ui-spec-tests.md)                         |
| Postman / Newman          | 🚧 In progress | [README-postman-newman-tests.md](docs/README-postman-newman-tests.md)           |
| Database Manual Tests     | ✅ Complete    | [README-database-manual-tests.md](docs/README-database-manual-tests.md)         |
| Database Automation Tests | ✅ Complete    | [README-database-automation-tests.md](docs/README-database-automation-tests.md) |
| Security Defence & Pen Testing | ✅ Complete | [README-security-defence-testing.md](docs/README-security-defence-testing.md) |

> All links above are relative — they resolve correctly on GitHub without absolute URLs.

---

## 🧩 Test Suite Breakdown

### API Tests — `tests/api/`
Pure HTTP tests using Playwright's `APIRequestContext`. No browser launched.
Covers auth (register, login, logout, `/auth/me`), job CRUD, and interview rounds.
Each test creates its own user via `createTestUser()` and deletes it in `afterAll`.
Runs against a local FastAPI instance spun up in CI.

### Admin API Tests — `tests/api/admin.spec.ts`
Privileged operation tests requiring a seeded superadmin account. Covers the full
401/403 permission matrix, role promotion, status toggling, user deletion, stats
endpoint shape, and audit log ordering. Triggered manually via `admin-tests.yml`
to avoid exposing CI superadmin secrets on every push.

### BDD Tests — `tests/bdd/`
Cucumber.js scenarios written in Gherkin (`features/`) with TypeScript step
definitions (`steps/`). Covers auth flows, job management, and profile updates.
Shared browser state is managed via `support/world.ts`. Runs against production.

### E2E Tests — `tests/e2e/`
Full browser journey tests using Playwright Chromium. Two spec files:
`user-journey.spec.ts` (register → login → profile → logout) and
`job-journey.spec.ts` (create → update → delete job application). Exercises the
complete stack — frontend, backend, and database — in one flow. Runs against
production Vercel + Railway.

### UI Spec Tests — `tests/ui/`
Component-level browser tests for individual UI features. Organised by domain:
`auth/` (login, register), `jobs/` (create, update, delete), `interview-rounds/`,
and `profile/`. All use `data-testid` selectors for stable element targeting.
Runs against production.

### Postman / Newman Tests — `postman/`
Newman CLI executes the Postman collection against the production Railway API.
Pre-request scripts handle login and token injection automatically. Test scripts
assert status codes and response shapes on every request. Results are exported
as JUnit XML and included in the Allure report.

### Database Automation Tests — `job-tracker-backend/tests/db/`
pytest + SQLAlchemy tests running against a real Docker PostgreSQL instance
(port 5433). Verifies constraints, cascade behaviour, migration integrity, and
query correctness — things SQLite cannot test accurately. Uses a
rollback-after-every-test fixture for full isolation. Lives in the backend repo
because it imports directly from `app/`.

---

## 🗂️ docs/ File Index

| File                                  | Status         | Contents                                                                          |
|---------------------------------------|----------------|-----------------------------------------------------------------------------------|
| `README-api-tests.md`                 | ✅ Complete    | Playwright API + Admin test suite documentation — 25 API tests + 23 Admin tests   |
| `README-bdd-tests.md`                 | ✅ Complete    | Cucumber BDD suite — 9 Gherkin scenarios, 3 feature files, infrastructure walkthrough |
| `README-e2e-tests.md`                 | ✅ Complete    | Playwright E2E suite — 6 tests across 2 spec files, POM walkthrough, UI + API cross-validation |
| `README-ui-spec-tests.md`             | 🚧 In progress | UI spec test documentation                                                        |
| `README-postman-newman-tests.md`      | 🚧 In progress | Postman collection and Newman execution documentation                             |
| `README-database-manual-tests.md`     | ✅ Complete    | TablePlus manual DB tests — 8 test cases, SQL queries, findings                   |
| `README-database-automation-tests.md` | ✅ Complete    | pytest + SQLAlchemy DB automation — Docker setup, rollback pattern, 20 test cases |

---

## 📋 Prerequisites

- Node.js 24+
- npm
- Playwright browsers (`npx playwright install --with-deps chromium`)

---

## 🛠️ Installation

```bash
npm install
npx playwright install --with-deps chromium
```

---

## 🏃 Running Tests

All test commands are available via `make`. Run `make help` to see the full reference.

### Test Suite Commands

| Command | What It Runs | Target |
|---------|-------------|--------|
| `make test` | All Playwright tests | Production |
| `make test-api` | API tests (auth + jobs + interviews) | Local backend required |
| `make test-admin` | Admin API tests | Local backend + superadmin seed required |
| `make test-ui` | UI spec tests | Production |
| `make test-e2e` | E2E tests | Production |
| `make test-e2e-headed` | E2E tests with visible browser | Production |
| `make test-e2e-debug` | E2E tests in debug mode | Production |
| `make test-postman` | Newman / Postman collection | Production |
| `make bdd` | Cucumber BDD tests | Production |
| `make bdd-headed` | BDD tests with visible browser | Production |
| `make test-auth` | Auth tests only | Local backend required |
| `make test-jobs` | Jobs tests only | Local backend required |

### Reporting Commands

| Command | Description |
|---------|-------------|
| `make report` | Open the last Playwright HTML report |

### Debug & Tooling Commands

| Command | Description |
|---------|-------------|
| `make codegen` | Launch Playwright codegen against production |
| `make test-debug` | Run all tests in Playwright debug mode |
| `make install-browsers` | Install Playwright browser binaries |

### Setup

```bash
npm install
make install-browsers
```

Environment variables are loaded from `.env.test` for local runs. Copy the example and fill in values:

```bash
cp .env.test.example .env.test
```

See ⚙️ Environment Variables for the full variable reference.

### Docker Note

The tests repo itself does not require Docker. However, `make test-api` and `make test-admin`
require the backend to be running locally. The fastest way to spin up the backend with its
database is via Docker Compose in the `job-tracker-backend` repo:

```bash
# In job-tracker-backend/
make docker-up
```

This starts PostgreSQL and the FastAPI server together. Once running, `make test-api` and
`make test-admin` will connect to `http://localhost:8000`.

---

## 🔄 CI/CD Pipeline

### Workflows

| Workflow              | Trigger                                 | Purpose                                                       |
|-----------------------|-----------------------------------------|---------------------------------------------------------------|
| `api-tests.yml`       | Push to `main` + nightly weekdays 22:00 | API suite — spins up local FastAPI + Postgres                 |
| `admin-tests.yml`     | Manual (`workflow_dispatch`)            | Admin API suite — separated for superadmin secret safety      |
| `ui-tests.yml`        | Scheduled BDD runs                      | Cucumber BDD scenarios against production                     |
| `postman-tests.yml`   | Scheduled Sunday 22:00                  | Newman collection against production API                      |
| `full-suite.yml`      | Manual (`workflow_dispatch`)            | Any combination of all 5 suites (16 options)                  |
| `allure-report.yml`   | Auto after API Tests or Full Suite      | Generates and publishes unified Allure report to GitHub Pages |
| `playwright.yml`      | Legacy                                  | Original auto-generated workflow                              |

### Full Suite Combinations

`api` · `ui` · `postman` · `bdd` · `e2e` · `api+ui` · `api+postman` · `api+bdd` · `ui+postman` · `ui+bdd` · `postman+bdd` · `api+ui+postman` · `api+postman+bdd` · `api+ui+bdd` · `ui+postman+bdd` · `api+ui+postman+bdd`

---

## 📊 Allure Report

Live unified report covering all test suites:

**[https://qa-master505.github.io/job-tracker-tests/](https://qa-master505.github.io/job-tracker-tests/)**

Automatically regenerated after every successful API Tests or Full Suite run.
Organises results into named suite sections: **API Tests**, **Admin API Tests**,
**Postman Tests**, **BDD UI Tests**, **E2E Tests**, **UI Spec Tests**.

---

## 🔔 Integrations

### Slack

Real-time notifications posted to three channels on every CI run via incoming
webhooks. The custom Playwright reporter (`reporters/slack-reporter.ts`) captures
the active project name dynamically and posts pass/fail summaries at run end.

**Channels:**

| Channel          | Secret                    | Purpose                                    |
|------------------|---------------------------|--------------------------------------------|
| `#qa-automation` | `SLACK_WEBHOOK_URL`       | Test pass/fail results (API, BDD, Postman) |
| `#ci-cd-reports` | `SLACK_CICD_WEBHOOK_URL`  | Pipeline status and deployment events      |
| `#bugs`          | `SLACK_BUGS_WEBHOOK_URL`  | New bug alerts when tests fail             |

**Setup:**
1. Slack workspace → Settings → Integrations → Incoming Webhooks → create one per channel
2. Add all three webhook URLs as GitHub repository secrets
3. Add to `.env.test` for local runs:

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_CICD_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_BUGS_WEBHOOK_URL=https://hooks.slack.com/services/...
```

**Key files:**
- `reporters/slack-reporter.ts` — custom Playwright reporter; reads project name from `suite.suites` at `onBegin`, posts at `onEnd`
- `helpers/slack-notifier.ts` — `sendSlackNotification()` and `sendCiCdNotification()`
- `scripts/notify-newman-slack.mjs` — parses `allure-results/newman-junit.xml` and posts Newman results
- `scripts/notify-bdd-slack.mjs` — parses `results/cucumber-report.json` and posts BDD results

> If webhook URLs are absent, the reporter and scripts skip silently — tests still run.

---

### Jira

Automatic bug lifecycle management via the Jira REST API. A ticket is created
when a test fails for the first time in CI; it is closed automatically when the
same test passes again. Duplicate tickets are prevented via a local cache.

**Setup:**
1. Jira → Account Settings → Security → API Tokens → Create token
2. Add the following as GitHub repository secrets:

| Secret             | Description                                           |
|--------------------|-------------------------------------------------------|
| `JIRA_API_TOKEN`   | Personal API token from Jira                          |
| `JIRA_EMAIL`       | Email address associated with the Jira account        |
| `JIRA_BASE_URL`    | Jira instance URL, e.g. `https://yourorg.atlassian.net` |
| `JIRA_PROJECT_KEY` | Project key, e.g. `JT`                               |

3. Add to `.env.test` for local runs:

```env
JIRA_API_TOKEN=your-token-here
JIRA_EMAIL=you@example.com
JIRA_BASE_URL=https://yourorg.atlassian.net
JIRA_PROJECT_KEY=JT
```

**Key files:**
- `helpers/jira-notifier.ts` — creates and closes tickets via Jira REST API
- `helpers/jira-ticket-tracker.ts` — reads/writes `.jira-tickets.json` dedup cache
- Cache is persisted between CI runs via GitHub Actions cache (`jira-tickets-${{ github.ref_name }}`)

---

### Postman / Newman

Newman (Postman's CLI runner) executes the collection against the **production
Railway API**. No local server needed.

**Files:**
- `postman/job-tracker-collection.json` — full collection with pre-request scripts and test assertions
- `postman/production-environment.json` — environment variables (base URL, saved tokens)

**Updating the collection:**
1. Make changes in the Postman desktop app
2. Export → Collection v2.1 → overwrite `postman/job-tracker-collection.json`
3. Export → Environment → overwrite `postman/production-environment.json`
4. Commit both files

**Running locally:**
```bash
make test-postman
```

**Notes:**
- `--suppress-exit-code` prevents Newman's non-zero exit from halting CI — Slack notification still fires
- 204 responses are guarded in test scripts (`if (pm.response.text().trim() !== '')`) to avoid JSON parse errors
- Pre-request scripts store tokens in `pm.environment` (not `pm.collectionVariables`) so they are accessible across requests

---

## 🌐 Live URLs

| Resource      | URL                                                                                                                                    |
|---------------|----------------------------------------------------------------------------------------------------------------------------------------|
| Frontend      | [job-tracker-frontend-green-sigma.vercel.app](https://job-tracker-frontend-green-sigma.vercel.app)                                     |
| API Docs      | [job-tracker-backend-production-7acf.up.railway.app/docs](https://job-tracker-backend-production-7acf.up.railway.app/docs)             |
| Allure Report | [qa-master505.github.io/job-tracker-tests](https://qa-master505.github.io/job-tracker-tests/)                                         |

---

## 🏗️ Test Infrastructure

### Dynamic User Registration

All suites that require authentication register a fresh timestamped user per run
via the API — no shared static credentials exist in the codebase.

```typescript
// fixtures/auth.ts
const testUser = await createTestUser(request); // called once in test.beforeAll
// → { email: 'testuser1716000000000@example.com', password: '...', cookieHeader: '...' }
```

`createTestUser` retries up to 3 times (2 s delay) to handle Railway cold-start
500 errors. 4xx errors throw immediately without retry.

`deleteTestUser` is hardened with 3-attempt retry, 10 s timeout, and post-delete
verification via `GET /auth/me`. 404 exits silently (already gone).

### data-testid Selectors

All UI interactions use `data-testid` attributes on the React frontend:

```typescript
await page.getByTestId('add-application-btn').click();
await page.getByTestId('job-company-input').fill('Acme Corp');
await page.getByTestId('job-submit-btn').click();
```

### Test Isolation

- Each suite registers its own user in `beforeAll` (not `beforeEach`)
- Job-level tests use timestamped company names to prevent cross-worker conflicts
- API-created resources are cleaned up in `afterEach` / `afterAll`
- Admin tests use a seeded CI superadmin account, separate from all test users

---

## ⚙️ Environment Variables

All variables are loaded from `.env.test` locally. In CI they are injected via
GitHub Actions secrets.

| Variable                 | Used by                   | Required locally      | Description                        |
|--------------------------|---------------------------|-----------------------|------------------------------------|
| `API_URL`                | All Playwright API + E2E  | Yes                   | Backend base URL                   |
| `BASE_URL`               | UI / E2E / BDD suites     | Yes                   | Frontend base URL                  |
| `SUPERADMIN_EMAIL`       | `admin.spec.ts`           | Yes (for admin tests) | Superadmin account email           |
| `SUPERADMIN_PASSWORD`    | `admin.spec.ts`           | Yes (for admin tests) | Superadmin account password        |
| `SLACK_WEBHOOK_URL`      | Slack reporter, scripts   | Optional              | `#qa-automation` channel webhook   |
| `SLACK_CICD_WEBHOOK_URL` | CI/CD notifications       | Optional              | `#ci-cd-reports` channel webhook   |
| `SLACK_BUGS_WEBHOOK_URL` | Bug alert notifications   | Optional              | `#bugs` channel webhook            |
| `JIRA_API_TOKEN`         | Jira notifier             | Optional              | Jira personal API token            |
| `JIRA_BASE_URL`          | Jira notifier             | Optional              | Jira instance URL                  |
| `JIRA_EMAIL`             | Jira notifier             | Optional              | Jira account email                 |
| `JIRA_PROJECT_KEY`       | Jira notifier             | Optional              | Jira project key (e.g. `JT`)      |

Slack and Jira integrations degrade gracefully when their variables are absent —
tests still run and report locally.

---

## 📁 Project Structure

```
job-tracker-tests/
│
├── .github/workflows/
│   ├── allure-report.yml          # Unified Allure report + GitHub Pages
│   ├── api-tests.yml              # API tests — push to main + nightly
│   ├── admin-tests.yml            # Admin API tests — manual dispatch only
│   ├── full-suite.yml             # Manual — 16 test suite combinations
│   ├── playwright.yml             # Legacy Playwright workflow
│   ├── postman-tests.yml          # Newman — scheduled Sunday
│   └── ui-tests.yml               # BDD — scheduled
│
├── docs/
│   ├── README-api-tests.md                  # 🚧 API + Admin test documentation
│   ├── README-bdd-tests.md                  # ✅ BDD suite documentation
│   ├── README-e2e-tests.md                  # ✅ E2E test documentation
│   ├── README-ui-spec-tests.md              # 🚧 UI spec test documentation
│   ├── README-postman-newman-tests.md       # 🚧 Postman/Newman documentation
│   ├── README-database-manual-tests.md      # ✅ Manual DB tests (TablePlus)
│   └── README-database-automation-tests.md  # ✅ DB automation (pytest + SQLAlchemy)
│
├── fixtures/
│   ├── auth.ts                    # createTestUser() + deleteTestUser() + TEST_PASSWORD
│   └── test-data.ts               # Shared job/interview-round test constants
│
├── helpers/
│   ├── api-helpers.ts             # getAuthCookie() + shared API request utilities
│   ├── jira-notifier.ts           # Jira ticket creation/closure via REST API
│   ├── jira-ticket-tracker.ts     # .jira-tickets.json dedup cache
│   ├── newman-slack-notifier.ts   # Newman Slack payload types
│   └── slack-notifier.ts          # sendSlackNotification() + sendCiCdNotification()
│
├── pages/                         # Page Object Models
│   ├── DashboardPage.ts
│   ├── LoginPage.ts
│   ├── ProfilePage.ts
│   └── RegisterPage.ts
│
├── postman/
│   ├── job-tracker-collection.json       # Full Postman collection (v2.1)
│   └── production-environment.json       # Environment variables for Newman
│
├── reporters/
│   └── slack-reporter.ts          # Custom Playwright reporter — dynamic suite name + Slack
│
├── scripts/
│   ├── notify-bdd-slack.mjs       # Parses cucumber-report.json → Slack
│   └── notify-newman-slack.mjs    # Parses newman-junit.xml → Slack
│
├── tests/
│   ├── api/
│   │   ├── auth.api.spec.ts              # 13 tests — auth endpoints
│   │   ├── jobs.api.spec.ts              # 13 tests — job CRUD
│   │   ├── interview-rounds.api.spec.ts  #  9 tests — interview rounds
│   │   └── admin.spec.ts                 # 23 tests — admin + superadmin operations
│   ├── bdd/
│   │   ├── features/    auth.feature · jobs.feature · profile.feature
│   │   ├── steps/       auth.steps.ts · jobs.steps.ts · profile.steps.ts
│   │   └── support/     config.ts · hooks.ts · world.ts
│   ├── e2e/
│   │   ├── job-journey.spec.ts    # 3 tests — job CRUD e2e
│   │   └── user-journey.spec.ts   # 3 tests — user auth/profile e2e
│   └── ui/
│       ├── auth/            login.spec.ts · register.spec.ts
│       ├── interview-rounds/  interview-rounds.spec.ts
│       ├── jobs/            create-job.spec.ts · delete-job.spec.ts · update-job.spec.ts
│       └── profile/         profile.spec.ts
│
├── .env.test                      # Local environment variables (not committed)
├── cucumber.config.js             # Cucumber/BDD runner config
├── Makefile                       # Shortcut targets (run `make help`)
├── package.json
├── playwright.config.ts           # Project scoping by testMatch + reporter config
└── tsconfig.json
```

---

## 🛠️ Tech Stack

| Category         | Technology                                               |
|------------------|----------------------------------------------------------|
| Test framework   | [Playwright](https://playwright.dev/)                    |
| BDD framework    | [Cucumber.js](https://cucumber.io/)                      |
| API testing      | Playwright `APIRequestContext`                           |
| Contract testing | [Newman](https://www.npmjs.com/package/newman) + Postman |
| Language         | TypeScript                                               |
| CI/CD            | GitHub Actions                                           |
| Reporting        | [Allure](https://allurereport.org/) → GitHub Pages       |
| Notifications    | Slack Incoming Webhooks                                  |
| Bug tracking     | Jira REST API                                            |
| Frontend hosting | Vercel                                                   |
| Backend hosting  | Railway                                                  |
| Runtime          | Node.js 24                                               |

---

## 🔗 Related Repositories

| Repository             | Description                                                                               | Link                                                            |
|------------------------|-------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| `job-tracker-backend`  | FastAPI + PostgreSQL backend. Also contains all pytest DB automation tests in `tests/db/`. | [GitHub](https://github.com/QA-Master505/job-tracker-backend)  |
| `job-tracker-frontend` | React + Vite + Tailwind CSS frontend. Deployed on Vercel.                                 | [GitHub](https://github.com/QA-Master505/job-tracker-frontend) |
| `job-tracker-tests`    | This repository — all QA automation suites.                                               | [GitHub](https://github.com/QA-Master505/job-tracker-tests)    |

For full cross-repo context, see the Testing sections in each repository's README.

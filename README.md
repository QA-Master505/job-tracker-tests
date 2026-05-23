# Job Tracker — Playwright Test Automation Framework

End-to-end and API test suite for the [Job Application Tracker](https://github.com/QA-Master505/job-tracker-frontend) web app, built with Playwright and TypeScript.

---

## Project Overview

This framework covers:

- **UI tests** — Full browser automation using the Page Object Model pattern (Chromium + Firefox)
- **API tests** — Direct API validation against the FastAPI backend
- **CI/CD** — GitHub Actions pipeline with HTML + JUnit reports and artifact upload

**Frontend:** http://localhost:5173 (React + Tailwind)  
**Backend API:** http://localhost:8000 (FastAPI)

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm 9+
- Both the frontend and backend servers running locally

### Install dependencies

```bash
npm install
npx playwright install
```

### Configure environment

Copy `.env.test` and update values if needed:

```bash
BASE_URL=http://localhost:5173
API_URL=http://localhost:8000
TEST_USER_EMAIL=playwright@example.com
TEST_USER_PASSWORD=Playwright@1234
```

> The test user must already be registered in the backend before running UI login/auth tests.

---

## How to Run Tests

| Command | Description |
|---|---|
| `npm test` | Run all tests (headless) |
| `npm run test:ui` | Run only UI tests |
| `npm run test:api` | Run only API tests |
| `npm run test:headed` | Run with visible browser |
| `npm run test:debug` | Run in Playwright debug mode |
| `npm run report` | Open the HTML test report |

### Run a specific spec file

```bash
npx playwright test tests/ui/auth/login.spec.ts
```

### Run on a specific browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
```

---

## Folder Structure

```
job-tracker-tests/
├── tests/
│   ├── ui/                        # Browser-based end-to-end tests
│   │   ├── auth/
│   │   │   ├── register.spec.ts   # Registration flow tests
│   │   │   └── login.spec.ts      # Login / auth redirect tests
│   │   ├── jobs/
│   │   │   ├── create-job.spec.ts
│   │   │   ├── update-job.spec.ts
│   │   │   └── delete-job.spec.ts
│   │   ├── interview-rounds/
│   │   │   └── interview-rounds.spec.ts
│   │   └── profile/
│   │       └── profile.spec.ts
│   └── api/                       # API-level tests (no browser)
│       ├── auth.api.spec.ts
│       ├── jobs.api.spec.ts
│       └── interview-rounds.api.spec.ts
├── pages/                         # Page Object Models
│   ├── LoginPage.ts
│   ├── RegisterPage.ts
│   ├── DashboardPage.ts
│   └── ProfilePage.ts
├── fixtures/
│   └── test-data.ts               # Shared test data constants
├── helpers/
│   └── api-helpers.ts             # Reusable API request functions
├── .env.test                      # Local environment variables (not committed)
├── playwright.config.ts           # Playwright configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json
```

---

## Design Principles

- **Page Object Model** — All UI interactions are encapsulated in `pages/`. Tests never access selectors directly.
- **Independent tests** — Each test sets up and tears down its own data. No shared state between tests.
- **API-first setup** — UI tests that need pre-existing data use API helpers in `beforeEach` to create it, and clean up in `afterEach`.
- **Environment variables** — All URLs, credentials, and sensitive config are read from `.env.test` (local) or GitHub Secrets (CI).

---

## CI/CD

The `.github/workflows/playwright.yml` pipeline runs on:

- Every push to `main`
- Every pull request targeting `main`
- Daily at midnight UTC (scheduled)

### Artifacts uploaded after each run

- `playwright-report/` — Interactive HTML report (30-day retention)
- `results/junit.xml` — JUnit XML for integration with reporting tools

### Required GitHub Secrets / Variables

| Name | Type | Description |
|---|---|---|
| `TEST_USER_EMAIL` | Secret | Test account email |
| `TEST_USER_PASSWORD` | Secret | Test account password |
| `BASE_URL` | Variable | Frontend URL (defaults to `http://localhost:5173`) |
| `API_URL` | Variable | Backend URL (defaults to `http://localhost:8000`) |

---

## Playwright CLI

The `@playwright/cli` package is installed both globally and as a dev dependency, enabling browser automation from the command line.

### CLI Commands

| Command | Description |
|---|---|
| `make cli-open` | Open the app in a headed browser via CLI |
| `make cli-snapshot` | Capture an accessibility snapshot of the current page |
| `make cli-screenshot` | Take a screenshot of the current page |
| `make cli-show` | Open the visual Playwright dashboard |
| `make install-skills` | Install CLI skills to `.claude/skills/playwright-cli` |

### CLI Config

The CLI is configured via [`.playwright/cli.config.json`](.playwright/cli.config.json):

```json
{
  "browser": "chromium",
  "headed": false,
  "timeout": 30000,
  "baseURL": "http://localhost:5173"
}
```

### Self-Healing Snapshots

After each test run, the CLI can capture accessibility snapshots to track UI state. These snapshots are stored locally and can be used to detect unintended visual or structural changes between runs.

```bash
# After running tests, capture a snapshot for later comparison
playwright-cli snapshot
```

> **Note:** `@healenium/playwright` (AI-based self-healing selectors) is not currently available on npm and is not included in this project. The timestamp-based unique company names and `fullyParallel: false` config are the current strategy for test isolation and stability.

---

## Future Integrations

- **Jira integration** — Automatically create Jira tickets for failing tests using the Jira REST API
- **Allure reporting** — Richer test reporting with `allure-playwright`
- **Visual regression** — Screenshot diffing with `@playwright/experimental-ct-react` or Percy

---

## Slack Integration

Playwright test results are automatically posted to three Slack channels via the **JobTracker QA Bot** after every CI run.

### Channels

| Channel | Webhook Secret | When it fires |
|---|---|---|
| `#qa-automation` | `SLACK_WEBHOOK_URL` | Every run (pass or fail) |
| `#ci-cd-reports` | `SLACK_CICD_WEBHOOK_URL` | Every run (pass or fail) |
| `#bugs` | `SLACK_BUGS_WEBHOOK_URL` | Failed runs only |

### What each channel receives

**#qa-automation** — Full test result summary:
- Passed / failed / skipped / total counts
- Run duration
- Branch and triggered-by info
- Link to the GitHub Actions run
- List of up to 5 failed test names with truncated error messages (on failure)

**#ci-cd-reports** — CI/CD pipeline summary:
- Workflow name and overall status (success / failure)
- Branch, triggered-by, and duration
- Link to the GitHub Actions run

**#bugs** — Failure alert (only sent when at least one test fails):
- Number of failures
- Failed test names and truncated error messages (up to 5)
- Branch, triggered-by, and link to the GitHub Actions run

### How it works

Notifications are sent by a custom Playwright reporter (`reporters/slack-reporter.ts`) that calls three functions from `helpers/slack-notifier.ts` at the end of every test run:

1. `sendSlackNotification()` → `#qa-automation`
2. `sendCiCdNotification()` → `#ci-cd-reports`
3. `sendBugsNotification()` → `#bugs` (skipped automatically when all tests pass)

The three webhook URLs are stored as GitHub repository secrets and injected into the CI environment. Notifications are triggered on every push to `main`, pull request targeting `main`, and the nightly scheduled run.

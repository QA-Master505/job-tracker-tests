# Job Tracker — QA Automation Platform

A full-stack QA automation platform for the [Job Tracker](https://job-tracker-frontend-green-sigma.vercel.app) application, built with Playwright, Cucumber BDD, Newman/Postman, GitHub Actions CI/CD, Slack notifications, Jira integration, and unified Allure reporting.

---

## 🚀 Overview

This repository contains a multi-layered test automation suite covering API, UI (BDD), End-to-End, Playwright UI spec, and contract-level Postman tests — all integrated into a scheduled CI/CD pipeline with real-time Slack alerts, automatic Jira bug management, and a live Allure report.

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
│  │  API Tests   │  │  BDD UI Tests│  │  E2E Tests   │  │
│  │  Playwright  │  │  Cucumber +  │  │  Playwright  │  │
│  │  21 tests    │  │  Playwright  │  │  6 tests     │  │
│  │  tests/api/  │  │  9 scenarios │  │  tests/e2e/  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌──────────────┐  ┌──────────────────────────────────┐ │
│  │  UI Spec     │  │     Postman / Newman Tests       │ │
│  │  Playwright  │  │     52 requests · postman/       │ │
│  │  25 tests    │  └──────────────────────────────────┘ │
│  │  tests/ui/   │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                  CI/CD Pipeline                         │
│                                                         │
│  GitHub Actions                                         │
│  ├── api-tests.yml       (push to main + nightly)       │
│  ├── ui-tests.yml        (Sun + Wed scheduled)          │
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

| Suite | Framework | Tests | Location |
|-------|-----------|-------|----------|
| API Tests | Playwright | 21 | `tests/api/` |
| BDD UI Tests | Cucumber + Playwright | 9 | `tests/bdd/` |
| E2E Tests | Playwright | 6 | `tests/e2e/` |
| UI Spec Tests | Playwright | 25 (1 skipped) | `tests/ui/` |
| Postman Tests | Newman | 52 | `postman/` |
| **Total** | | **113** | |

---

## 📋 Prerequisites

- Node.js 24+
- npm
- Playwright browsers (`make install-browsers`)

---

## 🛠️ Installation

```bash
npm install
make install-browsers
```

---

## 🏃 Running Tests

| Command | Description |
|---------|-------------|
| `make test` | Run all Playwright tests |
| `make test-api` | Run API tests against production backend |
| `make test-ui` | Run UI spec tests headed against production |
| `make test-e2e` | Run E2E tests against production |
| `make test-e2e-headed` | Run E2E with visible browser |
| `make test-e2e-debug` | Run E2E in debug mode |
| `make bdd` | Run BDD Cucumber tests |
| `make bdd-headed` | Run BDD with visible browser |
| `make test-headed` | Run all tests with visible browser |
| `make test-debug` | Run all tests in debug mode |
| `make test-auth` | Run auth tests only |
| `make test-jobs` | Run jobs tests only |

> Run `make help` to see all available commands.

All `test-api`, `test-ui`, and `test-e2e*` targets automatically set `API_URL` and `BASE_URL` to the production Railway/Vercel endpoints.

---

## 🔄 CI/CD Pipeline

### Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **API Tests** | Push to `main` + nightly weekdays 22:00 | Playwright API suite — spins up local FastAPI + Postgres |
| **UI Tests (BDD)** | Scheduled Sun + Wed 22:00 | Cucumber BDD scenarios against production |
| **Postman Tests** | Scheduled Sunday 22:00 | Newman collection against production API |
| **Full Test Suite** | Manual (`workflow_dispatch`) | Any combination of all 5 suites |
| **Allure Report CI** | Auto after API Tests or Full Suite | Generates and publishes unified Allure report |

### Full Suite Combinations

The Full Test Suite workflow supports 16 selectable combinations:

`api` · `ui` · `postman` · `bdd` · `e2e` · `api+ui` · `api+postman` · `api+bdd` · `ui+postman` · `ui+bdd` · `postman+bdd` · `api+ui+postman` · `api+postman+bdd` · `api+ui+bdd` · `ui+postman+bdd` · `api+ui+postman+bdd`

---

## 📊 Allure Report

Live unified report covering all test suites:

**[https://qa-master505.github.io/job-tracker-tests/](https://qa-master505.github.io/job-tracker-tests/)**

The report is automatically regenerated after every successful API Tests or Full Suite run and organises results into suite sections:

- **API Tests** — Playwright API results
- **Postman Tests** — Newman JUnit results
- **BDD UI Tests** — Cucumber JSON results

---

## 🔔 Integrations

### Slack
Real-time notifications posted to three channels on every CI run:

| Channel | Purpose |
|---------|---------|
| `#qa-automation` | Test pass/fail results (API, BDD, Postman) |
| `#ci-cd-reports` | Pipeline status and deployment events |
| `#bugs` | New bug alerts when tests fail |

### Jira
Automatic bug lifecycle management:
- **Creates** a Jira ticket when a test fails for the first time
- **Closes** the ticket automatically when the test passes again
- Prevents duplicate tickets across runs using a local cache

### Allure
- Unified report across all test types
- Published to GitHub Pages after every CI run
- Separate suite sections for API, Postman, and BDD results

---

## 🌐 Live URLs

| Resource | URL |
|----------|-----|
| Frontend | [job-tracker-frontend-green-sigma.vercel.app](https://job-tracker-frontend-green-sigma.vercel.app) |
| API Docs | [job-tracker-backend-production-7acf.up.railway.app/docs](https://job-tracker-backend-production-7acf.up.railway.app/docs) |
| Allure Report | [qa-master505.github.io/job-tracker-tests](https://qa-master505.github.io/job-tracker-tests/) |

---

## 🏗️ Test Infrastructure

### Dynamic User Registration

All test suites that require authentication register a fresh timestamped user per suite run via the API — no shared static credentials exist in the codebase.

```typescript
// fixtures/auth.ts
const testUser = await createTestUser(request); // called once in test.beforeAll
// → { email: 'testuser1716000000000@example.com', username: 'pwuser...', password: TEST_PASSWORD }
```

`createTestUser` retries up to 3 times with a 2-second delay between attempts to handle Railway backend cold-start 500 errors. 4xx errors (bad request, conflict) throw immediately without retry.

### data-testid Selectors

All UI interactions use `data-testid` attributes added to the React frontend for stable, role-independent element targeting:

```typescript
await page.getByTestId('add-application-btn').click();
await page.getByTestId('job-company-input').fill('Acme Corp');
await page.getByTestId('job-submit-btn').click();
```

Key testids: `add-application-btn`, `job-card`, `job-edit-btn`, `job-save-btn`, `job-delete-btn`, `job-company-input`, `job-position-input`, `job-status-select`, `job-submit-btn`, `logout-btn`, `nav-profile-link`, `nav-dashboard-link`, `profile-username-input`, `profile-email-input`, `save-username-btn`, `save-email-btn`, `profile-success-msg`.

### Test Isolation

- Each suite registers its own unique user in `beforeAll` (not `beforeEach`)
- Job-level tests use timestamped company names to prevent cross-worker conflicts
- API-created jobs are cleaned up in `afterEach` / `afterAll`

---

## ⚙️ Environment Variables

| Variable | Used by | Default |
|----------|---------|---------|
| `API_URL` | All test suites | `https://job-tracker-backend-production-7acf.up.railway.app` |
| `BASE_URL` | UI / E2E / BDD suites | `https://job-tracker-frontend-green-sigma.vercel.app` |
| `SLACK_WEBHOOK_URL` | Slack notifications | — |
| `SLACK_CICD_WEBHOOK_URL` | CI/CD channel notifications | — |
| `SLACK_BUGS_WEBHOOK_URL` | Bug alert notifications | — |
| `JIRA_API_TOKEN` | Jira ticket creation | — |
| `JIRA_BASE_URL` | Jira instance URL | — |
| `JIRA_EMAIL` | Jira authentication | — |
| `JIRA_PROJECT_KEY` | Jira project target | — |

Secrets are stored in GitHub repository settings and injected into CI workflows automatically.

---

## 📁 Project Structure

```
job-tracker-tests/
│
├── .github/workflows/
│   ├── allure-report.yml          # Unified Allure report + GitHub Pages
│   ├── api-tests.yml              # API tests — push to main + nightly
│   ├── full-suite.yml             # Manual — 16 test suite combinations
│   ├── playwright.yml             # Legacy Playwright workflow
│   ├── postman-tests.yml          # Newman — scheduled Sunday
│   └── ui-tests.yml               # BDD — scheduled Sun + Wed
│
├── fixtures/
│   ├── auth.ts                    # createTestUser() factory + TEST_PASSWORD
│   └── test-data.ts               # Shared test job/interview-round constants
│
├── helpers/
│   ├── api-helpers.ts             # API request functions
│   ├── jira-notifier.ts           # Jira ticket creation/closure
│   ├── jira-ticket-tracker.ts     # Jira dedup cache
│   ├── newman-slack-notifier.ts   # Newman Slack types
│   └── slack-notifier.ts          # Slack notification functions
│
├── pages/                         # Page Object Models
│   ├── DashboardPage.ts
│   ├── LoginPage.ts
│   ├── ProfilePage.ts
│   └── RegisterPage.ts
│
├── postman/
│   ├── job-tracker-collection.json
│   └── production-environment.json
│
├── reporters/
│   └── slack-reporter.ts          # Custom Playwright reporter
│
├── scripts/
│   ├── notify-bdd-slack.mjs       # BDD Slack notifications
│   └── notify-newman-slack.mjs    # Newman Slack notifications
│
├── tests/
│   ├── api/                       # Playwright API tests (21 tests)
│   │   ├── auth.api.spec.ts
│   │   ├── interview-rounds.api.spec.ts
│   │   └── jobs.api.spec.ts
│   │
│   ├── bdd/                       # Cucumber BDD tests (9 scenarios)
│   │   ├── features/
│   │   │   ├── auth.feature
│   │   │   ├── jobs.feature
│   │   │   └── profile.feature
│   │   ├── steps/
│   │   │   ├── auth.steps.ts
│   │   │   ├── jobs.steps.ts
│   │   │   └── profile.steps.ts
│   │   └── support/
│   │       ├── config.ts
│   │       ├── hooks.ts
│   │       └── world.ts
│   │
│   ├── e2e/                       # E2E combined UI + API tests (6 tests)
│   │   ├── job-journey.spec.ts    # Job CRUD e2e (3 tests)
│   │   └── user-journey.spec.ts   # User auth/profile e2e (3 tests)
│   │
│   └── ui/                        # Playwright UI spec tests (25 tests, 1 skipped)
│       ├── auth/
│       │   ├── login.spec.ts
│       │   └── register.spec.ts
│       ├── interview-rounds/
│       │   └── interview-rounds.spec.ts
│       ├── jobs/
│       │   ├── create-job.spec.ts
│       │   ├── delete-job.spec.ts
│       │   └── update-job.spec.ts
│       └── profile/
│           └── profile.spec.ts
│
├── cucumber.config.js
├── Makefile
├── package.json
├── playwright.config.ts
├── README.md
└── tsconfig.json
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Test framework | [Playwright](https://playwright.dev/) |
| BDD framework | [Cucumber.js](https://cucumber.io/) |
| API testing | Playwright `request` fixture |
| Contract testing | [Newman](https://www.npmjs.com/package/newman) + Postman |
| Language | TypeScript |
| CI/CD | GitHub Actions |
| Reporting | [Allure](https://allurereport.org/) → GitHub Pages |
| Notifications | Slack Incoming Webhooks |
| Bug tracking | Jira REST API |
| Frontend hosting | Vercel |
| Backend hosting | Railway |
| Runtime | Node.js 24 |

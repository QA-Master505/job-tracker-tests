# Job Tracker — QA Automation Platform

A full-stack QA automation platform for the [Job Tracker](https://job-tracker-frontend-green-sigma.vercel.app) application, built with Playwright, Cucumber BDD, Newman/Postman, GitHub Actions CI/CD, Slack notifications, Jira integration, and unified Allure reporting.

---

## 🚀 Overview

This repository contains a multi-layered test automation suite covering API, UI (BDD), End-to-End, and contract-level Postman tests — all integrated into a scheduled CI/CD pipeline with real-time Slack alerts, automatic Jira bug management, and a live Allure report.

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
│  │  21 tests    │  │  Playwright  │  │  3 tests     │  │
│  │  tests/api/  │  │  9 scenarios │  │  tests/e2e/  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌──────────────────────────────────┐                   │
│  │       Postman / Newman Tests     │                   │
│  │       52 requests · postman/     │                   │
│  └──────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                  CI/CD Pipeline                         │
│                                                         │
│  GitHub Actions                                         │
│  ├── api-tests.yml       (push to main + nightly)       │
│  ├── ui-tests.yml        (Sun + Wed scheduled)          │
│  ├── postman-tests.yml   (Sunday scheduled)             │
│  ├── full-suite.yml      (manual, 15 combinations)      │
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
| BDD UI Tests | Cucumber + Playwright | 9 | `tests/ui/features/` |
| E2E Tests | Playwright | 3 | `tests/e2e/` |
| Postman Tests | Newman | 52 | `postman/` |
| **Total** | | **85** | |

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
| `make test-api` | Run API tests only |
| `make test-ui` | Run UI Playwright tests |
| `make test-e2e` | Run E2E tests (production URLs) |
| `make test-e2e-headed` | Run E2E with visible browser |
| `make test-e2e-debug` | Run E2E in debug mode |
| `make bdd` | Run BDD Cucumber tests |
| `make bdd-headed` | Run BDD with visible browser |
| `make test-headed` | Run all tests with visible browser |
| `make test-debug` | Run all tests in debug mode |
| `make test-auth` | Run auth tests only |
| `make test-jobs` | Run jobs tests only |

> Run `make help` to see all available commands.

---

## 🔄 CI/CD Pipeline

### Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **API Tests** | Push to `main` + nightly weekdays 22:00 | Playwright API test suite against local backend |
| **UI Tests (BDD)** | Scheduled Sun + Wed 22:00 | Cucumber BDD scenarios against production |
| **Postman Tests** | Scheduled Sunday 22:00 | Newman collection against production API |
| **Full Test Suite** | Manual (`workflow_dispatch`) | Any combination of all 4 suites |
| **Allure Report CI** | Auto after API Tests or Full Suite | Generates and publishes unified Allure report |

### Full Suite Combinations

The Full Test Suite workflow supports 15 selectable combinations:

`api` · `ui` · `postman` · `bdd` · `api+ui` · `api+postman` · `api+bdd` · `ui+postman` · `ui+bdd` · `postman+bdd` · `api+ui+postman` · `api+postman+bdd` · `api+ui+bdd` · `ui+postman+bdd` · `api+ui+postman+bdd`

---

## 📊 Allure Report

Live unified report covering all test suites:

**[https://qa-master505.github.io/job-tracker-tests/](https://qa-master505.github.io/job-tracker-tests/)**

The report is automatically regenerated after every successful API Tests or Full Suite run and organises results into three suite sections:

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
- Unified report across all four test types
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

## 📁 Project Structure

```
job-tracker-tests/
├── .github/
│   └── workflows/
│       ├── api-tests.yml          # API test pipeline
│       ├── ui-tests.yml           # BDD UI test pipeline
│       ├── postman-tests.yml      # Newman pipeline
│       ├── full-suite.yml         # Manual full suite
│       └── allure-report.yml      # Allure generation + publish
├── fixtures/                      # Shared test data
├── helpers/                       # API helpers, Slack/Jira notifiers
├── pages/                         # Page Object Models
│   ├── LoginPage.ts
│   ├── RegisterPage.ts
│   ├── DashboardPage.ts
│   └── ProfilePage.ts
├── postman/                       # Postman collection + environment
├── reporters/                     # Custom reporters
├── scripts/                       # Slack notification scripts (.mjs)
├── tests/
│   ├── api/                       # Playwright API tests
│   │   ├── auth.api.spec.ts
│   │   ├── jobs.api.spec.ts
│   │   └── interview-rounds.api.spec.ts
│   ├── e2e/                       # End-to-end UI + API tests
│   │   └── job-journey.spec.ts
│   └── ui/
│       ├── auth/                  # UI auth tests
│       ├── jobs/                  # UI job CRUD tests
│       ├── profile/               # UI profile tests
│       ├── interview-rounds/      # UI interview round tests
│       ├── features/              # Cucumber feature files
│       │   ├── auth.feature
│       │   ├── jobs.feature
│       │   └── profile.feature
│       ├── steps/                 # Cucumber step definitions
│       └── support/               # World, hooks, config
├── cucumber.config.js
├── playwright.config.ts
├── Makefile
└── package.json
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

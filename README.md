# Job Tracker — Test Suite

Standalone QA portfolio repository covering six test types across the Job Tracker
platform. Tests run against the FastAPI backend (Railway) and React frontend (Vercel).

## Repositories

| Repo | Purpose | Link |
|------|---------|------|
| job-tracker-backend | FastAPI / PostgreSQL backend | [GitHub](https://github.com/QA-Master505/job-tracker-backend) |
| job-tracker-frontend | React / Vite / Tailwind frontend | [GitHub](https://github.com/QA-Master505/job-tracker-frontend) |
| job-tracker-tests | This repository — all test suites | [GitHub](https://github.com/QA-Master505/job-tracker-tests) |

## Live Artifacts

- [Allure Report](https://qa-master505.github.io/job-tracker-tests/)

## Test Suites

| Suite | Tool | Target | Docs |
|-------|------|--------|------|
| API Tests | Playwright APIRequestContext | Local backend (CI) | [README](docs/README-api-tests.md) |
| Admin API Tests | Playwright APIRequestContext | Local backend (CI) | [README](docs/README-api-tests.md) |
| BDD Tests | Cucumber.js + Playwright | Production | [README](docs/README-bdd-tests.md) |
| E2E Tests | Playwright Chromium | Production | [README](docs/README-e2e-tests.md) |
| UI Spec Tests | Playwright Chromium | Production | [README](docs/README-ui-spec-tests.md) |
| Postman / Newman | Newman CLI | Production | [README](docs/README-postman-newman-tests.md) |
| Database Tests | pytest + SQLAlchemy | Docker PostgreSQL | [README](docs/README-database-automation-tests.md) |

## CI/CD

Seven GitHub Actions workflows handle all test execution and reporting.
See [`.github/workflows/`](.github/workflows/) for full pipeline definitions.

## Quick Start

```bash
# Install dependencies
npm install
npx playwright install

# API tests
npx playwright test tests/api/

# BDD tests
npm run test:bdd

# Postman / Newman
make test-postman

# Full suite
npx playwright test
```

All environment variables are loaded from `.env.test`. See the individual suite
READMEs in `docs/` for environment variable requirements per suite.

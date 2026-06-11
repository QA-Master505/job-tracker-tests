# Job Tracker — QA Automation Platform

[![CI](https://github.com/QA-Master505/job-tracker-tests/actions/workflows/api-tests.yml/badge.svg)](https://github.com/QA-Master505/job-tracker-tests/actions/workflows/api-tests.yml)
[![Allure Report](https://img.shields.io/badge/Allure-Report-brightgreen?logo=github)](https://qa-master505.github.io/job-tracker-tests/)
[![GitHub last commit](https://img.shields.io/github/last-commit/QA-Master505/job-tracker-tests)](https://github.com/QA-Master505/job-tracker-tests/commits/main)
[![GitHub repo size](https://img.shields.io/github/repo-size/QA-Master505/job-tracker-tests)](https://github.com/QA-Master505/job-tracker-tests)

---

## 💡 Why This Project Exists

Most QA portfolios are built on top of demo applications — Swagger Petstore, sample todo
apps, tutorial projects with artificial data and no real constraints. I was frustrated
with that. You cannot do meaningful security testing on a system you did not build. You
cannot find real database gaps in a schema someone else designed to be clean. You cannot
test authentication flows that were never meant to be broken.

I also had a practical problem. I was tracking dozens of job applications across emails,
spreadsheets, and browser tabs — and losing track of all of it. So I built something I
actually needed.

That decision turned out to be exactly right. Building the application myself meant I
controlled the backend, the database schema, the authentication architecture, and the
deployment. Which meant when I switched roles from developer to QA engineer, I was
testing something real — with real constraints, real security decisions, and real
consequences if something was wrong.

That is what this project is. Not a showcase of test scripts written against someone
else's system. A complete engineering platform — built, broken, hardened, and automated
from the ground up.

---

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
| UI Spec Tests             | ✅ Complete    | [README-ui-spec-tests.md](docs/README-ui-spec-tests.md)                         |
| Postman / Newman          | ✅ Complete    | [README-postman-newman-tests.md](docs/README-postman-newman-tests.md)           |
| Database Manual Tests     | ✅ Complete    | [README-database-manual-tests.md](docs/README-database-manual-tests.md)         |
| Database Automation Tests | ✅ Complete    | [README-database-automation-tests.md](docs/README-database-automation-tests.md) |
| Security Defence Testing  | 🚧 In progress | [README-security-defence-testing.md](docs/README-security-defence-testing.md) |

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

### Security Defence Testing — `docs/README-security-defence-testing.md`
Manual and automated security verification covering XSS defence (input sanitisation,
React JSX auto-escaping, `javascript:` and `data:` protocol blocklist), HTTP security
headers deployed via `vercel.json` (CSP, X-Frame-Options, X-Content-Type-Options,
Referrer-Policy, Permissions-Policy), and the two-layer validation model (Pydantic at
HTTP layer, PostgreSQL at DB layer). Documents the security audit methodology and
findings.

---

## 🔍 What Each Suite Tests — Purpose, Tools, and Approach

---

### API Testing with Pytest

**Purpose**

The first layer of testing targets the backend directly — before any frontend exists and
before any browser is involved. The goal is to verify that every API endpoint returns the
correct response, the correct status code, and the correct error when something goes
wrong. This layer gives confidence that the foundation is solid before anything is built
on top of it.

**Tool and Language**

Pytest with Python — the same language the backend is written in. Testing at the same
layer as the code means issues are caught at their source, not filtered through a browser
or a UI framework.

**What Is Tested**

Authentication flows — registration, login, logout, token handling. Job application
endpoints — create, read, update, delete. Interview round endpoints. Admin-only endpoints
tested against a full permission matrix: seven endpoints crossed against four principal
states — unauthenticated, regular user, admin, and superadmin. Every cell in that matrix
is a distinct test case. 75 tests total across auth, jobs, interviews, and admin — these
tests live in the `job-tracker-backend` repository alongside the database automation
suite.

**Why This Matters**

If the API layer is broken, everything above it is broken. Catching failures here is
faster and cheaper than catching them through the UI.

---

### API Contract Testing with Postman and Newman

**Purpose**

After pytest covers the backend logic, Postman provides a second independent layer —
testing the API exactly the way an external consumer would use it. No internal access, no
test clients, no framework shortcuts. Raw HTTP requests, the same as any real client
would send.

**Tools**

Postman for building the request collections. Newman for running them in CI
automatically. Postman is the industry standard for API testing and produces collections
that are readable by anyone on a team — not just engineers.

**What Is Tested**

53 requests covering 84 assertions — authentication flows, job CRUD operations, interview
round management, and error scenarios. Environment variables are configured so the same
collection runs locally and in CI without any manual changes.

**Why This Matters**

A passing pytest suite proves the internal logic works. A passing Newman suite proves the
external interface works. These are not the same thing. Contract testing catches
regressions in response shapes, status codes, and headers that internal tests can miss.

---

### End-to-End Testing with Playwright

**Purpose**

API tests confirm the backend works. End-to-end tests confirm the whole application
works — from the user's perspective, in a real browser, against the live production
stack. If something breaks between the frontend and the backend, E2E catches it.

**Tool and Language**

Playwright with TypeScript. Playwright is one of the most reliable browser automation
frameworks available — it handles async behaviour correctly, supports multiple browsers,
and integrates cleanly with CI pipelines. Tests run against the live Vercel deployment —
no local server required.

**What Is Tested**

Six core user journeys — the complete lifecycle a real user would experience: register an
account, log in, create a job application, update it, add an interview round, and log
out. Each test is a full browser session from start to finish.

**Why This Matters**

E2E tests are the closest approximation to a real user. They catch integration failures,
navigation breaks, and frontend-backend mismatches that unit and API tests cannot see.

---

### UI Specification Testing with Playwright

**Purpose**

Separate from full user journeys, UI spec tests verify the interface itself — that every
element renders correctly, labels are accurate, buttons are present, forms behave as
expected, and error messages appear when they should. This is the interface matching the
specification.

**Tool and Language**

Playwright with TypeScript — the same framework as E2E, different focus. Keeping both
suites in one tool means one consistent setup, one CI configuration, and one unified
report.

**What Is Tested**

26 UI spec tests covering login form behaviour, registration validation, job creation
modal, status update interactions, interview round management, and profile editing. If a
field label changes, a button disappears, or an error message stops rendering, these
tests catch it immediately.

**Why This Matters**

UI regressions are silent. A broken button does not throw an exception. UI spec tests
exist specifically to catch visual and structural regressions that functional tests miss.

---

### Behaviour-Driven Testing with Cucumber

**Purpose**

BDD — Behaviour Driven Development — bridges the gap between business requirements and
technical implementation. Tests are written in plain language that non-technical
stakeholders can read and verify. The test scenario describes what the system should do,
not how it does it.

**Tools and Language**

Cucumber with Playwright and TypeScript. Gherkin syntax — the Given / When / Then format
— makes each scenario readable by product managers, designers, and clients, not just
engineers.

**What Is Tested**

Nine BDD scenarios covering the core business flows — authentication and job management.
Each scenario is written as a user story: Given I am a registered user, When I log in
with valid credentials, Then I should see my job dashboard. The step definitions behind
each scenario drive real browser interactions via Playwright.

**Why This Matters**

BDD scenarios serve as living documentation. They describe exactly what the system does
in language everyone understands, and they fail immediately when the system no longer
does what it claims.

---

### Database Testing — Manual

**Purpose**

Automated tests verify that the application behaves correctly. Manual database testing
verifies that the data is stored correctly and that the database itself enforces its own
rules — independently of the application layer. This distinction matters: the application
can behave correctly while the database silently accepts invalid data.

**Tool**

TablePlus 7.1.0 connected directly to the Railway PostgreSQL production database. Manual
testing allows direct inspection of actual stored data, execution of raw SQL queries, and
verification of constraint behaviour that only shows up at the database layer.

**What Is Tested**

Eight structured test cases: unique constraints on email and username, NOT NULL
constraints on required fields, foreign key enforcement on user-to-job relationships,
CASCADE delete behaviour across the full chain — users to job applications to interview
rounds — and SET NULL behaviour on audit log actor references. A real schema gap was also
identified: the job status column is stored as plain text rather than a native PostgreSQL
enum, meaning invalid values can be inserted if the API is bypassed entirely. This was
formally documented as a known vulnerability.

**Why This Matters**

The database is the last line of defence for data integrity. If constraints are not
enforced at the database layer, no amount of application-level validation fully protects
the system. Manual testing verifies this in the actual production environment, not a
simulated one.

---

### Database Testing — Automated

**Purpose**

After manual testing identified the constraint behaviour and the schema gap, automated
tests formalise those findings as regression tests. If anyone changes the schema in the
future — intentionally or accidentally — the test suite catches it immediately in CI.

**Tools**

Pytest with SQLAlchemy against a real PostgreSQL instance running in Docker on port 5433,
isolated from the main database. A rollback-per-test fixture ensures every test runs in a
transaction that is rolled back afterward — no test data persists and no test interferes
with another.

**What Is Tested**

23 automated database tests across five files — constraint enforcement, cascade delete
chains, the varchar schema gap formalised as a regression test, query correctness,
pagination logic, and admin service behaviour including audit log creation and atomic
transaction verification. These tests hit the database directly, bypassing the API
entirely — which is exactly the access path an attacker or a rogue internal service
might use.

**Why This Matters**

Automated database tests close the gap between what the application validates and what
the database actually enforces. They also verify that database-level behaviour cannot be
silently changed by a future migration.

---

### Security Testing — XSS Defence Audit

**Purpose**

To verify the application is protected against cross-site scripting — an attack where
malicious JavaScript is injected into a page and executed in another user's browser,
potentially stealing session tokens, reading private data, or performing actions on
behalf of the victim.

**Approach**

Manual penetration testing — not an automated scanner. Each attack vector was tested
deliberately to understand the exact protection in place, not just to generate a report.
Every input surface in the application was enumerated first: job title, company name, job
URL, notes, interview round fields. A payload matrix was then executed against each
surface, covering classic script tag injection, image onerror event handlers, SVG onload
vectors, javascript: protocol links, and data: URI attacks. Static code analysis was also
performed — a grep across the entire codebase to verify the absence of
dangerouslySetInnerHTML, the React API that bypasses framework-level output encoding.

**What Was Found**

React JSX auto-escaping protected all text content fields. Static analysis confirmed
dangerouslySetInnerHTML was absent from the entire codebase. One real vulnerability was
identified: the URL renderer in JobCard.jsx was neutralising javascript: protocol links
as an accidental side effect of URL normalisation — not by explicit design. An accidental
control is not a real control. It was remediated with an explicit javascript: and data:
protocol blocklist, and documented as a deliberate security decision.

**Why This Matters**

XSS is consistently in the OWASP Top 10. Most XSS audits stop at "we use React, so we
are safe." This audit went further — testing the URL rendering context separately,
distinguishing accidental protection from intentional protection, and verifying the fix
in production.

---

### Security Testing — HTTP Security Headers

**Purpose**

To verify that the browser is instructed to behave safely, independent of the application
code. Security headers are server-to-browser instructions that restrict dangerous browser
behaviour — they apply even if the application code has a flaw.

**Approach**

All five headers were implemented in vercel.json — the CDN configuration layer — rather
than in application code. This means headers are applied to every response by the
infrastructure itself, before any application code runs, and cannot be accidentally
removed by an application-level change. All five headers were verified on the live
production URL using curl -I.

**What Was Implemented**

Content Security Policy — restricts which scripts, styles, and resources the browser will
execute, preventing injected scripts from loading external malicious resources or
exfiltrating data even if injection occurs. X-Frame-Options DENY — prevents the
application from being embedded in an iframe on any other site, closing the clickjacking
attack vector entirely. X-Content-Type-Options nosniff — prevents the browser from
guessing content types, blocking MIME confusion attacks where an uploaded file could be
executed as a script. Referrer-Policy strict-origin-when-cross-origin — limits what URL
information is shared with third parties via the Referer header, preventing sensitive URL
parameters from leaking to analytics or CDN providers. Permissions-Policy — explicitly
disables browser APIs the application has no reason to use, including camera, microphone,
and geolocation, reducing the blast radius of any successful attack.

**Why This Matters**

Missing security headers are one of the most common findings in real security audits.
They require no complex code — just correct configuration. Verifying them against the
live production site, not just the codebase, is the difference between assuming they work
and knowing they work.

---

### Continuous Integration and Reporting

**Purpose**

All testing only has value if it runs consistently, automatically, and with visible
results. CI ensures the test suite is not something that was run once — it runs on every
push, every PR, and on a schedule. Any regression, any broken endpoint, any failed
security check is caught automatically and reported immediately.

**Tools**

GitHub Actions for pipeline execution. Allure for test reporting, published automatically
to GitHub Pages after every run. Slack notifications to two dedicated channels — one for
QA results, one for CI/CD status. Jira integration with full bug lifecycle automation —
tests automatically create Jira tickets when they fail and close them when they pass,
with deduplication logic to prevent duplicate tickets across consecutive failing runs.

**What Runs in CI**

Five GitHub Actions workflows — api-tests, admin-tests, full-suite, postman-tests, and
allure-report. Branch protection on main requires CI status checks to pass before any
merge. No code reaches main without the test suite signing off.

**Why This Matters**

A test suite that only runs locally is a safety net with holes. CI makes the suite the
gatekeeper — nothing ships without passing it. The Allure report and Slack notifications
mean failures are visible immediately, not discovered days later.

---

## 🐳 Why Docker for Database Testing

### The Problem: "Works on My Machine"

Database testing has a fundamental challenge. You need to verify that data is stored
correctly and that the database itself enforces its constraints — NOT NULL, UNIQUE,
foreign keys, CASCADE delete chains. This is critical testing that cannot be done with
mocks or in-memory SQLite.

But here is the catch: PostgreSQL running on your local machine might be a different
version than PostgreSQL in production. The configuration might be different. The system
libraries might be different. A test that passes locally could fail in production for
reasons that have nothing to do with your code — they are environmental differences.

This is the classic problem: "works on my machine but fails in CI."

---

### Why Not Just Use Local PostgreSQL?

You might ask — why not install PostgreSQL locally and connect to it for testing?
Technically, you could. But there are practical problems.

**Problem 1: Version Management**
If you install PostgreSQL 14 locally but production runs PostgreSQL 15, you are testing
against a different database. Some constraint behaviours, performance characteristics,
and features differ between versions. A test that passes against PostgreSQL 14 might
fail against PostgreSQL 15. You would not know until CI runs.

**Problem 2: Configuration Drift**
Your local PostgreSQL instance has your personal configuration. A teammate's installation
has theirs. The CI environment has yet another. Three different configurations, three
different test results. Debugging which environment caused a failure becomes a guessing
game.

**Problem 3: Test Isolation**
Running tests against a local PostgreSQL instance means data from one test run can leak
into the next. You have to manually clean up. Or you risk one test failing because of
leftover data from a previous test. With multiple people running tests against the same
local instance, test interference becomes inevitable.

**Problem 4: Reproducibility**
If a test fails in CI but passes locally, the only way to debug is to recreate the exact
CI environment on your machine. That is hard with a locally installed database. With
Docker, you run the exact same container locally and in CI — no guessing.

---

### The Docker Solution

Docker solves all four problems at once.

A Docker container is a self-contained environment — it includes PostgreSQL, system
libraries, configuration, and everything else needed to run the database. You build the
image once. That same image runs identically on your machine, a teammate's machine, and
the CI server. No version drift. No configuration drift. No surprises.

For database testing specifically, the workflow is:

1. Start Docker container with PostgreSQL on port 5433 (isolated from any local PostgreSQL on 5432)
2. Run pytest database tests against that container
3. Tests connect to the same environment everywhere — local, CI, any machine
4. Container stops, database is gone, next test run starts fresh

No test data pollution, no state leakage, no manual cleanup.

---

### Why This Project Uses Docker — The Specific Decision

In the Job Tracker project, database testing is non-negotiable. You need to verify:

- NOT NULL and UNIQUE constraints are enforced
- Foreign key relationships cascade correctly
- Invalid data cannot be inserted if the API is bypassed
- The varchar schema gap (status column as text instead of enum) is caught and regressed against

**These constraints are PostgreSQL-specific.** SQLite enforces them differently — in
fact, SQLite is much more permissive and would not catch many of these gaps at all.

Testing against SQLite locally and PostgreSQL in production would give false confidence.
You would think you tested the constraint behaviour, but actually you only tested
SQLite's permissive behaviour. Real PostgreSQL constraint violations would not surface
until production.

**The decision: Docker PostgreSQL for all database tests, everywhere — local and CI.**

This means:

- Database tests run against real PostgreSQL, not an in-memory mock
- The exact same PostgreSQL version and configuration runs locally and in CI
- Test failures are caught immediately, locally, where they are cheapest to fix
- There is no environment surprise when code moves from local to CI to production
- Every developer and CI machine runs tests against identical infrastructure

| | SQLite (in-memory) | Local PostgreSQL | Docker PostgreSQL |
|---|---|---|---|
| FK constraints enforced by default | No | Yes | Yes |
| Matches production engine exactly | No | Version-dependent | Yes — pinned to `postgres:15` |
| Consistent across all machines | No | No | Yes |
| Zero manual cleanup between runs | Yes | No | Yes |
| CI-compatible without extra setup | Yes | No | Yes |

---

### How It Works in This Project

**First-time setup** — create the container once:

```bash
docker run --name job-tracker-db-test \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=job_tracker_test \
  -p 5433:5432 \
  -d postgres:15
```

> Port 5433 is used deliberately — it avoids conflicts with any local PostgreSQL
> instance already running on the default port 5432.

**Local workflow** — start, test, stop:

```bash
# Start the isolated test database container
docker start job-tracker-db-test

# Run database tests against it
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/job_tracker_test pytest tests/db/ -v

# Container stays running until you stop it
docker stop job-tracker-db-test
```

**CI setup (GitHub Actions):**

GitHub Actions runs the PostgreSQL container as a [service container](https://docs.github.com/en/actions/using-containerized-services/about-service-containers) — the database starts automatically before the test job runs, connects on port 5433, and is torn down after the workflow completes. No manual start or stop required.

```bash
# Tests connect to the same port 5433, same configuration, same image
pytest tests/db/ -v
```

Same tests. Same database. Same results everywhere.

---

### The Key Insight

Docker is not about convenience or looking sophisticated. It is about **correctness and
confidence**.

Without Docker, you are testing against a moving target — your environment might differ
from CI, which might differ from production. Tests pass locally, fail in CI, and you
spend hours debugging environmental differences instead of actual bugs.

With Docker, you test against a locked, identical environment everywhere. Failures are
real failures in your code, not environmental surprises.

That is why Docker belongs in this project.

---

## 🗂️ docs/ File Index

| File                                  | Status         | Contents                                                                          |
|---------------------------------------|----------------|-----------------------------------------------------------------------------------|
| `README-api-tests.md`                 | ✅ Complete    | Playwright API + Admin test suite documentation — 25 API tests + 23 Admin tests   |
| `README-bdd-tests.md`                 | ✅ Complete    | Cucumber BDD suite — 9 Gherkin scenarios, 3 feature files, infrastructure walkthrough |
| `README-e2e-tests.md`                 | ✅ Complete    | Playwright E2E suite — 6 tests across 2 spec files, POM walkthrough, UI + API cross-validation |
| `README-ui-spec-tests.md`             | ✅ Complete    | Playwright UI spec suite — 26 tests across 7 spec files, selector strategy, testid reference |
| `README-postman-newman-tests.md`      | ✅ Complete    | Postman collection and Newman CLI — 53 requests, 84 assertions, 4-phase build narrative, CI/CD integration |
| `README-security-defence-testing.md`  | 🚧 In progress | XSS defence audit, HTTP security headers, input validation layer verification |
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
│   ├── README-ui-spec-tests.md              # ✅ UI spec test documentation
│   ├── README-postman-newman-tests.md       # ✅ Postman/Newman documentation
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

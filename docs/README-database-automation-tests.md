# Database Automation Testing — Job Tracker

Automated database-layer tests that target real PostgreSQL directly using pytest
and SQLAlchemy. These tests complement the existing HTTP-layer tests in
`tests/conftest.py`, `test_auth.py`, `test_jobs.py`, `test_interviews.py`, and
`test_admin.py`, which use SQLite in-memory via FastAPI's `TestClient`. Where
the HTTP tests verify endpoint behaviour, these tests verify what the database
itself enforces — constraints, cascades, enum gaps, migration integrity, and
query correctness — against the same engine that runs in production.

---

## Why Automated DB Tests

The existing test suite uses SQLite, which differs from PostgreSQL in ways that
matter for production confidence:

- **SQLite does not enforce FK constraints by default.** A missing `PRAGMA foreign_keys = ON` means orphaned rows pass tests silently.
- **SQLite does not support CASCADE / SET NULL properly.** `ON DELETE CASCADE` and `ON DELETE SET NULL` behaviour cannot be trusted in SQLite-backed tests.
- **`SAEnum` behaviour differs between SQLite and PostgreSQL.** SQLAlchemy enums are stored as `VARCHAR` in SQLite but can be enforced natively in PostgreSQL.
- **Goal: test exactly what runs in production.** Only a real PostgreSQL instance exposes the constraints, types, and referential integrity that Railway uses.

These tests sit **between unit tests and API tests** in the testing pyramid —
below the HTTP layer, above raw SQL manual testing.

---

## Tools & Stack

| Item | Detail |
|------|--------|
| Test runner | pytest |
| ORM | SQLAlchemy |
| Database | Local PostgreSQL via Docker |
| Migration tool | Alembic |
| Language | Python |
| No new packages required | SQLAlchemy, psycopg2, pytest already in `requirements.txt` |

---

## Environment Setup

### 1. Install Docker Desktop

Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) if not already installed.

### 2. Spin up a local PostgreSQL container

```bash
docker run --name job-tracker-db-test \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=job_tracker_test \
  -p 5433:5432 \
  -d postgres:15
```

> **Why port 5433?** Avoids conflict with any local PostgreSQL instance already running on the default port 5432.

### 3. Connection string for tests

```
postgresql://postgres:postgres@localhost:5433/job_tracker_test
```

### 4. Run Alembic migrations against the test database

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/job_tracker_test alembic upgrade head
```

### 5. Stop and remove the container after testing

```bash
docker stop job-tracker-db-test && docker rm job-tracker-db-test
```

---

## Folder Structure

```
job-tracker-backend/
└── tests/
    └── db/
        ├── conftest.py           ← test engine, session fixture, rollback strategy
        ├── test_user_model.py    ← uniqueness, NOT NULL, bcrypt, defaults
        ├── test_job_model.py     ← FK, CASCADE, timestamps, enum gap
        ├── test_migrations.py    ← alembic upgrade/downgrade integrity
        ├── test_queries.py       ← pagination, filtering, aggregations
        └── test_admin_service.py ← audit log, role change, stats
```

---

## Core Pattern — Rollback After Every Test

Every test runs inside a database transaction that is **always rolled back** when
the test finishes — whether it passes, fails, or errors. This means:

- The database is always clean for the next test
- No need to manually truncate tables between tests
- Tests are fully isolated and can run in any order
- Teardown is guaranteed even if assertions throw

```python
@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    yield session
    session.close()
    transaction.rollback()  # always runs, even if test fails
    connection.close()
```

The `yield` hands the session to the test. Everything after it is teardown —
`transaction.rollback()` fires unconditionally, undoing any inserts, updates,
or deletes made during the test.

---

### Exception — `test_admin_service.py`

Admin service functions (`update_user_role`, `toggle_user_status`, `delete_user_by_id`)
call `db.commit()` internally. The rollback fixture cannot undo a committed transaction,
so `test_admin_service.py` uses **explicit cleanup** instead — a `try/finally` block
that deletes inserted rows and commits the deletion after each test. A shared
`admin_test_users` fixture manages actor and target user lifecycle across all four tests.

## Test Plan — File by File

### `tests/db/test_user_model.py`

Verifies schema-level constraints on the `users` table.

| Test ID | Test Name | What It Verifies |
|---------|-----------|------------------|
| DB-A-U-01 | Unique email enforced | PostgreSQL rejects duplicate email at DB level |
| DB-A-U-02 | Unique username enforced | PostgreSQL rejects duplicate username at DB level |
| DB-A-U-03 | NOT NULL `is_active` | PostgreSQL rejects missing `is_active` |
| DB-A-U-04 | Password is hashed | `hashed_password` starts with `$2b$` |
| DB-A-U-05 | Default role is `user` | `role` defaults to `'user'` without explicit value |
| DB-A-U-06 | `is_active` defaults to `true` | New users are active by default |

---

### `tests/db/test_job_model.py`

Verifies FK integrity, cascade behaviour, and column constraints on
`job_applications` and `interview_rounds`.

| Test ID | Test Name | What It Verifies |
|---------|-----------|------------------|
| DB-A-J-01 | FK `user_id` enforced | Cannot insert a job for a non-existent user |
| DB-A-J-02 | CASCADE delete — jobs | Deleting a user removes all owned job applications |
| DB-A-J-03 | CASCADE delete — rounds | Deleting a job removes all interview rounds |
| DB-A-J-04 | `applied_date` NOT NULL | PostgreSQL rejects a job application missing `applied_date` |
| DB-A-J-05 | Enum gap — `status` varchar | `INVALID_STATUS` is accepted — finding confirmed in automation |

---

### `tests/db/test_migrations.py`

Verifies Alembic migration integrity against the real PostgreSQL schema.

| Test ID | Test Name | What It Verifies |
|---------|-----------|------------------|
| DB-A-M-01 | Upgrade to head | All migrations apply cleanly with no errors |
| DB-A-M-02 | Downgrade one step | Previous migration state is valid and reversible |
| DB-A-M-03 | All tables exist after upgrade | `users`, `job_applications`, `interview_rounds`, `audit_logs` are present |

---

### `tests/db/test_queries.py`

Verifies query correctness: pagination, aggregation, and filtering logic.

| Test ID | Test Name | What It Verifies |
|---------|-----------|------------------|
| DB-A-Q-01 | Insert and retrieve user | Basic ORM write/read path works end to end |
| DB-A-Q-02 | Filter user by field | `.filter_by()` returns correct record, None for no match |
| DB-A-Q-03 | Deleted user is not retrievable | ORM delete propagates correctly through session |
| DB-A-Q-04 | Pagination offset/limit | `get_jobs_paginated` returns correct slice, total, and metadata |
| DB-A-Q-05 | Job count aggregation | `func.count` result matches actual row count per user |
| DB-A-Q-06 | Filter jobs by user_id | Jobs returned belong only to the requesting user |

---

### `tests/db/test_admin_service.py`

Verifies audit trail behaviour and admin service atomicity.

| Test ID | Test Name | What It Verifies |
|---------|-----------|------------------|
| DB-A-AS-01 | Audit log created on role change | An `audit_logs` row is written after a role update |
| DB-A-AS-02 | Atomic transaction | Role change and audit log succeed or fail together |
| DB-A-AS-03 | `actor_id` SET NULL on delete | `audit_logs` rows are preserved after the actor user is deleted |
| DB-A-AS-04 | Stats overview accuracy | User count and job count match actual rows in the database |

---

## Test Execution

```bash
# Start Docker PostgreSQL
docker run --name job-tracker-db-test \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=job_tracker_test \
  -p 5433:5432 \
  -d postgres:15

# Run migrations
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/job_tracker_test \
  alembic upgrade head

# Run all DB automation tests
pytest tests/db/ -v

# Run a specific file
pytest tests/db/test_user_model.py -v

# Teardown
docker stop job-tracker-db-test && docker rm job-tracker-db-test
```

---

## Relationship to Existing Tests

| Layer | Tool | Database | What It Tests |
|-------|------|----------|---------------|
| HTTP / API layer | pytest + FastAPI `TestClient` | SQLite in-memory | Endpoints, status codes, response shapes |
| Database layer | pytest + SQLAlchemy | Real PostgreSQL via Docker | Constraints, cascades, queries, migrations |
| E2E layer | Playwright | Railway (production) | Full user journeys through the browser |

---

## Findings Carried Forward from Manual Testing

`DB-A-J-05` (enum gap — `status` is `varchar`, not a native PostgreSQL enum)
was first discovered during manual database testing (`DB-M-06` in
[`README-database-manual-tests.md`](README-database-manual-tests.md)).
It is now formally automated in `test_job_model.py` to prevent regression —
ensuring that if a future migration ever adds a `CHECK` constraint or native
enum, the test suite detects the change rather than silently passing.

---

## Test Results

All 23 DB automation tests pass against Docker PostgreSQL (port 5433).

| File | Tests | Status |
|------|-------|--------|
| `test_user_model.py` | 5 | ✅ Complete |
| `test_job_model.py` | 5 | ✅ Complete |
| `test_migrations.py` | 3 | ✅ Complete |
| `test_queries.py` | 6 | ✅ Complete |
| `test_admin_service.py` | 4 | ✅ Complete |
| **Total** | **23** | ✅ All passing |

Last verified: June 2026 against PostgreSQL 15 via Docker on port 5433.

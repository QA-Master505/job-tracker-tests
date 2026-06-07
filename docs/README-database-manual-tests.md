# Database Manual Testing — Job Tracker

Manual database-layer tests executed directly against the PostgreSQL database
using TablePlus. These tests verify constraints, referential integrity, cascade
behaviour, and data-layer guarantees that sit below the application/API layer.

---

## Tools & Setup

| Item | Detail |
|------|--------|
| GUI client | TablePlus 7.1.0 |
| Database | Railway PostgreSQL (production) |
| Backend stack | FastAPI + SQLAlchemy + Alembic |
| Tables tested | `users`, `job_applications`, `interview_rounds`, `audit_logs` |

> **Note:** All destructive test rows (duplicate inserts, FK violation attempts)
> were rolled back or rejected by the database. The CASCADE delete test used a
> dedicated throwaway user row that was removed as part of the test.

---

## Environment Setup

### Install TablePlus

```bash
brew install --cask tableplus
```

### Connect to Railway PostgreSQL

Open TablePlus → Create Connection → PostgreSQL

Fill in:

- **Name:** Job Tracker Railway
- **Host:** `kodama.proxy.rlwy.net`
- **Port:** `19804`
- **User:** `postgres`
- **Password:** (from `.env` → `DATABASE_URL`)
- **Database:** `railway`
- **SSL mode:** `PREFERRED`

Click **Test** → then **Connect**.

---

## Test Execution Order

Run tests in this sequence to avoid state dependencies between test cases:

1. **Orient yourself** — browse all four tables (`users`, `job_applications`, `interview_rounds`, `audit_logs`); note real `id` values to use in write tests
2. **Uniqueness constraints** — DB-M-01, DB-M-02 (safe; all inserts are rejected by PostgreSQL)
3. **NOT NULL constraints** — DB-M-03, DB-M-04 (safe; all inserts are rejected by PostgreSQL)
4. **Foreign key constraints** — DB-M-05 (safe; insert is rejected by PostgreSQL)
5. **Enum gap test** — DB-M-06 (insert succeeds; clean up the row immediately after)
6. **CASCADE delete test** — DB-M-07 (creates a full chain then destroys it; run last among write tests)
7. **SET NULL verification** — DB-M-08 (read-only; verify `audit_logs` after the CASCADE delete)

---

## Test Data Strategy

- **Never modify real production rows.** All test inserts use clearly identifiable throwaway data.
- **Use recognisable email patterns** such as `cascade.test@example.com` so test rows are easy to spot and clean up.
- **Always clean up after write tests.** After any successful insert, delete the row immediately using its specific `id` (e.g. `DELETE FROM job_applications WHERE id = 675`). Never use unqualified deletes.
- **The CASCADE delete test creates a full chain before tearing it down:** insert a test user → insert a job application referencing that user → insert an interview round referencing that application → delete the user. PostgreSQL handles the rest; verify all child rows are gone with `SELECT` afterwards.

---

## Test Cases

| Test ID | Test Name | What Was Tested | Expected Result | Actual Result | Status |
|---------|-----------|-----------------|-----------------|---------------|--------|
| DB-M-01 | Unique email constraint | `INSERT` into `users` with a duplicate email | Rejected with unique-constraint violation | `duplicate key value violates unique constraint "ix_users_email"` | ✅ Pass |
| DB-M-02 | Unique username constraint | `INSERT` into `users` with a duplicate username | Rejected with unique-constraint violation | `duplicate key value violates unique constraint "ix_users_username"` | ✅ Pass |
| DB-M-03 | NOT NULL — `is_active` | `INSERT` into `users` omitting `is_active` | Rejected with not-null violation | `null value in column "is_active" violates not-null constraint` | ✅ Pass |
| DB-M-04 | NOT NULL — `applied_date` | `INSERT` into `job_applications` omitting `applied_date` | Rejected with not-null violation | `null value in column "applied_date" violates not-null constraint` | ✅ Pass |
| DB-M-05 | Foreign key — `user_id` | `INSERT` into `job_applications` with `user_id = 99999` (non-existent) | Rejected with FK violation | `insert or update on table "job_applications" violates foreign key constraint "job_applications_user_id_fkey"` | ✅ Pass |
| DB-M-06 | Enum gap — `status` column | `INSERT` into `job_applications` with `status = 'INVALID_STATUS'` | Rejected at DB level | Row inserted successfully — validation is Pydantic-only; no native PostgreSQL enum | ⚠️ Finding |
| DB-M-07 | CASCADE delete | Delete a user who owns job applications and interview rounds | All child rows deleted automatically | All rows across `job_applications` and `interview_rounds` removed by PostgreSQL | ✅ Pass |
| DB-M-08 | SET NULL — `actor_id` | Delete a user referenced in `audit_logs.actor_id` | Audit rows preserved; `actor_id` set to NULL | `audit_logs` rows retained with `actor_id = NULL` | ✅ Pass |

---

## Test Case Details

### DB-M-01 — Unique Email Constraint

**What it checks:** PostgreSQL enforces email uniqueness at the schema level via a unique index (`ix_users_email`), independent of application-layer validation.

**Why it matters:** Duplicate email accounts would break authentication. The constraint must hold even if the API is bypassed.

```sql
INSERT INTO users (email, username, hashed_password, is_active)
VALUES ('qa.engineer505+test@gmail.com', 'brandnewuser', 'fakehash123', true);
```

**Expected output:** `duplicate key value violates unique constraint "ix_users_email"`  
**Actual output:** `duplicate key value violates unique constraint "ix_users_email"`  
**What it proves:** Email uniqueness is enforced at the database layer, not only in application code.

---

### DB-M-02 — Unique Username Constraint

**What it checks:** PostgreSQL enforces username uniqueness via a unique index (`ix_users_username`).

**Why it matters:** Duplicate usernames would cause identity collisions in the UI and audit trail.

```sql
INSERT INTO users (email, username, hashed_password, is_active)
VALUES ('totallynew@example.com', 'TestAccount', 'fakehash123', true);
```

**Expected output:** `duplicate key value violates unique constraint "ix_users_username"`  
**Actual output:** `duplicate key value violates unique constraint "ix_users_username"`  
**What it proves:** Username uniqueness is enforced at the database layer.

---

### DB-M-03 — NOT NULL: `is_active`

**What it checks:** The `is_active` column on `users` has a `NOT NULL` constraint and no default value set at the DB level.

**Why it matters:** A missing `is_active` flag could render account status indeterminate.

```sql
INSERT INTO users (email, username, hashed_password)
VALUES ('test@example.com', 'testuser', 'fakehash123');
```

**Expected output:** `null value in column "is_active" violates not-null constraint`  
**Actual output:** `null value in column "is_active" violates not-null constraint`  
**What it proves:** Account activation status cannot be omitted; the DB rejects incomplete rows.

---

### DB-M-04 — NOT NULL: `applied_date`

**What it checks:** The `applied_date` column on `job_applications` has a `NOT NULL` constraint.

**Why it matters:** Every job application must record when it was applied. A missing date breaks reporting and sorting.

```sql
INSERT INTO job_applications (user_id, company_name, job_title, status)
VALUES (792, 'Test Company', 'QA Engineer', 'applied');
```

**Expected output:** `null value in column "applied_date" violates not-null constraint`  
**Actual output:** `null value in column "applied_date" violates not-null constraint`  
**What it proves:** Application date is mandatory at the schema level.

---

### DB-M-05 — Foreign Key: `user_id`

**What it checks:** PostgreSQL enforces referential integrity between `job_applications.user_id` and `users.id`.

**Why it matters:** Orphaned job applications (no parent user) would be unreachable and corrupt aggregated stats.

```sql
INSERT INTO job_applications (user_id, company_name, job_title, status, applied_date)
VALUES (99999, 'Fake Company', 'QA Engineer', 'applied', '2026-06-07');
```

**Expected output:** `insert or update on table "job_applications" violates foreign key constraint "job_applications_user_id_fkey"`  
**Actual output:** `insert or update on table "job_applications" violates foreign key constraint "job_applications_user_id_fkey"`  
**What it proves:** Orphaned job applications cannot be created; the FK constraint holds at the DB layer.

---

### DB-M-06 — Enum Gap: `status` Column

**What it checks:** Whether PostgreSQL rejects an invalid `status` value at the database layer.

**Why it matters:** If `status` is a native enum, invalid values are caught even when the API is bypassed. If it is `varchar`, only Pydantic validation guards against bad data.

```sql
INSERT INTO job_applications (user_id, company_name, job_title, status, applied_date)
VALUES (792, 'Test Company', 'QA Engineer', 'INVALID_STATUS', '2026-06-07');

-- Cleanup
DELETE FROM job_applications WHERE id = 675;
```

**Expected output:** Rejection at the database layer  
**Actual output:** Row inserted successfully — no DB error  
**What it proves:** `status` is `varchar`, not a native PostgreSQL enum. Validation is Pydantic-only. **Finding logged** — see Findings section.

---

### DB-M-07 — CASCADE Delete

**What it checks:** Deleting a `users` row cascades automatically to `job_applications` and then to `interview_rounds`.

**Why it matters:** When a user account is deleted, all owned data must be cleaned up atomically by PostgreSQL to prevent orphan rows.

```sql
-- Step 1: Create test user
INSERT INTO users (email, username, hashed_password, is_active)
VALUES ('cascade.test@example.com', 'cascadetestuser', 'fakehash123', true);

-- Step 2: Get the new user id
SELECT id FROM users WHERE email = 'cascade.test@example.com';

-- Step 3: Create job application
INSERT INTO job_applications (user_id, company_name, job_title, status, applied_date)
VALUES (902, 'Cascade Test Company', 'QA Engineer', 'applied', '2026-06-07');

-- Step 4: Create interview round
INSERT INTO interview_rounds (job_application_id, round_number, interview_type, interview_date)
VALUES (677, 1, 'virtual', '2026-06-10');

-- Step 5: Delete the user — triggers full cascade
DELETE FROM users WHERE id = 902;

-- Step 6: Verify all child rows are gone
SELECT * FROM job_applications WHERE user_id = 902;
SELECT * FROM interview_rounds WHERE job_application_id = 677;
```

**Expected output:** Both `SELECT` queries return 0 rows  
**Actual output:** Both `SELECT` queries return 0 rows  
**What it proves:** `ON DELETE CASCADE` is correctly configured across all three tables; PostgreSQL handles the full chain atomically.

---

### DB-M-08 — SET NULL: `actor_id` in `audit_logs`

**What it checks:** When a user referenced in `audit_logs.actor_id` is deleted, the audit rows are preserved with `actor_id` set to `NULL` rather than being cascade-deleted.

**Why it matters:** Audit history must be retained for compliance. Rows must survive user deletion; only the actor reference is nullified.

```sql
SELECT * FROM audit_logs WHERE actor_id IS NULL;
```

**Expected output:** Rows exist with `actor_id = NULL`  
**Actual output:** Rows exist with `actor_id = NULL` — confirmed after the CASCADE delete in DB-M-07  
**What it proves:** `audit_logs.actor_id` uses `ON DELETE SET NULL`, preserving the full audit trail while removing the deleted user reference.

---

## Findings

### Finding: `status` column is not a native PostgreSQL enum (DB-M-06)

**Severity:** Medium  
**Table:** `job_applications`  
**Column:** `status` (`varchar`)

**What happened:**  
An `INSERT` with `status = 'INVALID_STATUS'` was accepted by PostgreSQL without error. The row was committed successfully.

**Root cause:**  
The `status` column is defined as `varchar` rather than a PostgreSQL `ENUM` type. Input validation is enforced exclusively at the Pydantic model layer in the FastAPI application. If the API is bypassed (direct DB access, a future migration error, a faulty admin script), invalid status values can be written silently.

**Recommendation:**  
Consider altering the column to a native PostgreSQL `ENUM` or adding a `CHECK` constraint:

```sql
ALTER TABLE job_applications
  ADD CONSTRAINT chk_job_status
  CHECK (status IN ('APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'));
```

This would enforce the constraint at the database layer, independent of the application.

---

## Lessons Learned

- **Constraint enforcement depth matters.** Relying solely on Pydantic validation means any path that bypasses the API (scripts, migrations, direct DB writes) can insert invalid data. Database-level constraints provide a true safety net.
- **CASCADE vs SET NULL is intentional design.** The schema uses `ON DELETE CASCADE` for owned data (`job_applications`, `interview_rounds`) and `ON DELETE SET NULL` for audit references (`audit_logs.actor_id`). This correctly preserves audit history while cleaning up user-owned records.
- **TablePlus is effective for exploratory DB testing.** Direct SQL execution against Railway PostgreSQL allows fast verification of schema-level guarantees without spinning up the full application stack.
- **Manual DB tests complement API tests.** Playwright API tests verify behaviour through the application layer; these manual tests confirm the database enforces its own guarantees independently.

---

## Query Reference Log

| Query ID | Purpose | Table | Query | Expected Outcome |
|----------|---------|-------|-------|------------------|
| Q-01 | Unique email violation | `users` | `INSERT INTO users (email, username, hashed_password, is_active) VALUES ('qa.engineer505+test@gmail.com', 'brandnewuser', 'fakehash123', true)` | Rejected: `duplicate key value violates unique constraint "ix_users_email"` |
| Q-02 | Unique username violation | `users` | `INSERT INTO users (email, username, hashed_password, is_active) VALUES ('totallynew@example.com', 'TestAccount', 'fakehash123', true)` | Rejected: `duplicate key value violates unique constraint "ix_users_username"` |
| Q-03 | NOT NULL — `is_active` | `users` | `INSERT INTO users (email, username, hashed_password) VALUES ('test@example.com', 'testuser', 'fakehash123')` | Rejected: `null value in column "is_active" violates not-null constraint` |
| Q-04 | NOT NULL — `applied_date` | `job_applications` | `INSERT INTO job_applications (user_id, company_name, job_title, status) VALUES (792, 'Test Company', 'QA Engineer', 'applied')` | Rejected: `null value in column "applied_date" violates not-null constraint` |
| Q-05 | Foreign key violation | `job_applications` | `INSERT INTO job_applications (user_id, company_name, job_title, status, applied_date) VALUES (99999, 'Fake Company', 'QA Engineer', 'applied', '2026-06-07')` | Rejected: FK constraint violation on `user_id` |
| Q-06 | Enum gap test | `job_applications` | `INSERT INTO job_applications (user_id, company_name, job_title, status, applied_date) VALUES (792, 'Test Company', 'QA Engineer', 'INVALID_STATUS', '2026-06-07')` | ⚠️ Accepted — no DB-level rejection |
| Q-06b | Enum gap cleanup | `job_applications` | `DELETE FROM job_applications WHERE id = 675` | Row removed |
| Q-07a | Create cascade test user | `users` | `INSERT INTO users (email, username, hashed_password, is_active) VALUES ('cascade.test@example.com', 'cascadetestuser', 'fakehash123', true)` | Row inserted |
| Q-07b | Fetch cascade test user id | `users` | `SELECT id FROM users WHERE email = 'cascade.test@example.com'` | Returns new `id` |
| Q-07c | Create cascade job application | `job_applications` | `INSERT INTO job_applications (user_id, company_name, job_title, status, applied_date) VALUES (902, 'Cascade Test Company', 'QA Engineer', 'applied', '2026-06-07')` | Row inserted |
| Q-07d | Create cascade interview round | `interview_rounds` | `INSERT INTO interview_rounds (job_application_id, round_number, interview_type, interview_date) VALUES (677, 1, 'virtual', '2026-06-10')` | Row inserted |
| Q-07e | Delete user (cascade trigger) | `users` | `DELETE FROM users WHERE id = 902` | All child rows deleted automatically by PostgreSQL |
| Q-07f | Verify cascade — job applications | `job_applications` | `SELECT * FROM job_applications WHERE user_id = 902` | 0 rows returned |
| Q-07g | Verify cascade — interview rounds | `interview_rounds` | `SELECT * FROM interview_rounds WHERE job_application_id = 677` | 0 rows returned |
| Q-08 | Verify SET NULL | `audit_logs` | `SELECT * FROM audit_logs WHERE actor_id IS NULL` | Rows exist with `actor_id = NULL` |

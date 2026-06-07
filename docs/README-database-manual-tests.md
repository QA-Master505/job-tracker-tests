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

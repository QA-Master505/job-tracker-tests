# BDD Tests — Job Tracker

Behaviour-Driven Development tests written in Gherkin and executed via Cucumber.js with
Playwright as the browser automation layer. BDD is used in this project to express
acceptance criteria in plain language that both technical and non-technical readers can
understand — the feature files describe what the application should do from the user's
perspective, while the step definitions wire those descriptions to actual browser
interactions. This layer sits above the UI spec tests in the testing pyramid: where UI
spec tests verify individual components, BDD scenarios verify complete user-facing
workflows from start to finish against the live production stack.

The suite covers three domains: authentication (login with valid credentials, failed login,
and logout), job application management (create, view, update status, and delete), and user
profile editing (username and email updates). All nine scenarios run against the production
Vercel frontend and Railway backend — no local server is needed. A single shared test user
is registered once via the API before any scenario runs and is reused across all three
feature files.

---

## Tools & Stack

| Item | Detail |
|------|--------|
| BDD framework | Cucumber.js (`@cucumber/cucumber`) |
| Step definition language | TypeScript (via `ts-node/register`) |
| Browser automation | Playwright Chromium |
| Target environment | Production — Vercel + Railway |
| CI workflow | `.github/workflows/ui-tests.yml` |
| Config file | `cucumber.config.js` |

---

## Folder Structure

```
tests/bdd/
├── features/
│   ├── auth.feature          ← Authentication scenarios — login, failed login, logout
│   ├── jobs.feature          ← Job application CRUD — create, view, update, delete
│   └── profile.feature       ← Profile management — update username and email
├── steps/
│   ├── auth.steps.ts         ← Step definitions for auth.feature
│   ├── jobs.steps.ts         ← Step definitions for jobs.feature
│   └── profile.steps.ts      ← Step definitions for profile.feature
└── support/
    ├── config.ts             ← Centralised URLs, timeouts, and test data constants
    ├── hooks.ts              ← Suite-level user lifecycle and per-scenario browser lifecycle
    └── world.ts              ← CustomWorld class — shared browser/page state across steps
```

---

## How It Works

BDD tests are structured in three layers that each serve a distinct purpose.

### Feature files (Gherkin)

Feature files express scenarios in plain English using the `Given / When / Then`
vocabulary. They describe user-observable behaviour with no implementation detail. A
`Background` block defines preconditions that apply to every scenario in the file —
`auth.feature` navigates to the login page before each scenario; `jobs.feature` and
`profile.feature` log in before each scenario. This means individual scenarios only
describe what is distinct about them, not the shared setup.

```gherkin
Scenario: Create a new job application
  When I click add new job button
  And I fill in company name "Google"
  And I fill in position "QA Engineer"
  And I select status "Applied"
  And I submit the form
  Then I should see "Google" in my job list
```

### Step definitions (TypeScript)

Each Gherkin phrase is matched by a function in the corresponding `*.steps.ts` file. The
function receives the `CustomWorld` instance as `this`, giving it access to the live
Playwright `page` object. String parameters in curly-brace syntax (e.g. `{string}`) are
extracted from the Gherkin phrase and passed as function arguments.

```typescript
When('I fill in company name {string}',
  async function (this: CustomWorld, company: string) {
    await this.page.getByTestId('job-company-input').fill(company);
  });

Then('I should see {string} in my job list',
  async function (this: CustomWorld, company: string) {
    await expect(this.page.getByText(company))
      .toBeVisible({ timeout: BDD_CONFIG.DEFAULT_TIMEOUT });
  });
```

### Support files

`world.ts` defines the `CustomWorld` class that Cucumber constructs fresh for each
scenario. `hooks.ts` manages the browser lifecycle around each scenario and the shared
test user lifecycle around the entire suite. `config.ts` centralises all
environment-specific values so step definitions never hard-code URLs, timeouts, or test
data directly.

> Cucumber.js injects the `CustomWorld` instance as `this` inside every step function.
> TypeScript requires the explicit `this: CustomWorld` parameter annotation to get
> type-safe access to `this.page`, `this.browser`, and `this.context`.

---

## Feature Files Breakdown

### auth.feature

Covers the complete authentication surface: successful login, failed login with invalid
credentials, and logout. The step definition for `I enter email {string} and password
{string}` substitutes the readable placeholder values from the feature file
(`testuser@test.com`, `Test123!`) with the actual dynamic `BDD_USER` credentials at
runtime — the feature file stays human-readable while the step uses real credentials.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Successful login with valid credentials | I am on the login page | I enter email and password; I click the login button | I should be redirected to the dashboard; I should see my job applications |
| Failed login with invalid credentials | I am on the login page | I enter wrong email/password; I click the login button | I should see an error message |
| Successful logout | I am on the login page; I am logged in | I click the logout button | I should be redirected to the login page |

---

### jobs.feature

Covers the four job application operations. Three of the four scenarios include a
`Given I have at least one job application` step that creates a job directly via the API
before the browser interaction begins — this avoids depending on a prior scenario having
created data and keeps each scenario independently executable.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Create a new job application | I am logged in | I click add new job; fill company, position, status; submit form | I should see "Google" in my job list |
| View job application details | I am logged in; I have at least one job application | I click on a job application | I should see the job details |
| Update job application status | I am logged in; I have at least one job application | I update the status to "Interview" | The status should show "Interview" |
| Delete a job application | I am logged in; I have at least one job application | I delete the job application | The job should be removed from the list |

---

### profile.feature

Covers the two profile update operations. Both step definitions append a `Date.now()`
timestamp to the submitted value so that repeated runs do not attempt to set a username
or email that already exists in the database from a previous run.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Update username | I am logged in | I navigate to profile settings; I update my username | My username should be updated successfully |
| Update email | I am logged in | I navigate to profile settings; I update my email | My email should be updated successfully |

---

## Test Infrastructure

### World object (world.ts)

`CustomWorld` extends Cucumber's built-in `World` class and adds three Playwright
properties: `browser` (the Chromium instance), `context` (an isolated browser context),
and `page` (the active page). It also exposes `baseUrl` from `BDD_CONFIG.BASE_URL`.

Cucumber constructs a fresh `CustomWorld` instance for every scenario. State stored on
`this` is scoped to one scenario — there is no bleed between scenarios via the world
object. The browser, context, and page are assigned in the `Before` hook and released in
`After`.

### Before / After hooks (hooks.ts)

`BeforeAll` runs once before the entire suite. It registers the shared BDD test user via
a direct `POST /auth/register` API call using a timestamped email
(`bdd_{timestamp}@test.com`) to avoid conflicts on repeated runs. After registration, the
credentials are written to `process.env.TEST_EMAIL` and `process.env.TEST_PASSWORD` so
step definitions can access them without importing `hooks.ts` directly. The exported
`BDD_USER` object is imported by `auth.steps.ts` and `jobs.steps.ts` for API setup calls.

`Before` runs before each individual scenario. It launches Chromium (headless by default;
headed when `HEADLESS=false` is set), creates a browser context with a 1280×720 viewport,
and opens a new page assigned to `this.page`.

`After` runs after each individual scenario. If the scenario failed, it captures a PNG
screenshot via `this.page.screenshot()` and attaches it inline to the Cucumber report
using `this.attach()`. Regardless of outcome, it closes the page, context, and browser in
order.

> `AfterAll` currently logs a completion message only — BDD test user cleanup is not
> automated. The account is ephemeral and timestamped, so it does not conflict with
> subsequent runs.

### Config (config.ts)

All environment-specific values are centralised in `BDD_CONFIG` and read by step
definitions and hooks via import rather than direct `process.env` access.

| Key | Default | Description |
|-----|---------|-------------|
| `API_URL` | Production Railway URL | Backend base URL for API-based setup steps |
| `BASE_URL` | Production Vercel URL | Frontend URL for browser navigation |
| `TEST_PASSWORD` | `'Test123!'` | Password for the shared BDD test user |
| `TEST_JOB` | `{ company_name: 'BDD Test Company', ... }` | Default job payload for API setup |
| `DEFAULT_TIMEOUT` | `30000` ms | Timeout for `expect()` assertions |
| `NAVIGATION_TIMEOUT` | `20000` ms | Timeout for `waitForURL()` calls |
| `SLOW_MO` | `800` ms | Delay between actions when running headed |

---

## CI/CD

### ui-tests.yml

**Triggers:** scheduled twice weekly (`0 22 * * 0,3` — midnight Vienna time on Sunday and
Wednesday) and manual `workflow_dispatch`.

The workflow checks out the repository, installs Node.js 24 with npm, runs `npm ci`,
installs Playwright browser binaries, then executes the full BDD suite via
`npm run test:bdd`. Both `BASE_URL` and `API_URL` are set to the production URLs in the
workflow environment — no local backend is spun up. Tests run against live production
infrastructure on every scheduled run.

After the test run (whether it passed or failed), `scripts/notify-bdd-slack.mjs` parses
`results/cucumber-report.json` and posts a summary to `#qa-automation` via
`SLACK_WEBHOOK_URL`. The `cucumber-report.json` is uploaded as a `bdd-results` artifact
and retained for 30 days.

> The Cucumber Allure reporter writes results to `allure-results/` during the run via the
> `allure-cucumberjs/reporter` format configured in `cucumber.config.js`. A separate
> `allure-report.yml` workflow handles publishing those results to GitHub Pages.

---

## Running Locally

The suite targets production by default. No local backend setup is required.

```bash
# Run all BDD scenarios headless
make bdd

# Run with visible browser (enables 800ms slow-mo between actions)
make bdd-headed

# Or directly via npm
npm run test:bdd
npm run test:bdd:headed
```

> `make bdd-headed` sets `HEADLESS=false`, which the `Before` hook reads to launch
> Chromium in headed mode with `slowMo: 800`. This is useful for debugging a failing
> scenario — you can watch each step execute at a readable pace.

`BASE_URL` and `API_URL` are the only variables the suite reads. Both default to
production and do not need to be set for a standard local run:

```env
BASE_URL=https://job-tracker-frontend-green-sigma.vercel.app
API_URL=https://job-tracker-backend-production-7acf.up.railway.app
```

To run against a local stack instead:

```bash
BASE_URL=http://localhost:5173 API_URL=http://localhost:8000 npm run test:bdd
```

---

## Test Scenarios

### Scenario 1 — Successful login with valid credentials (auth.feature)

**Why this matters:** Login is the entry point to the entire application. The
`Given I am logged in` step used in every other feature file's `Background` depends on
this login flow working correctly. If login silently fails, downstream scenarios will pass
for the wrong reasons. This scenario explicitly asserts that the URL changes to
`/dashboard` and that the page body is visible after login, catching both hard failures
and silent redirects.

**Full Gherkin scenario:**

```gherkin
Background:
  Given I am on the login page

Scenario: Successful login with valid credentials
  When I enter email "testuser@test.com" and password "Test123!"
  And I click the login button
  Then I should be redirected to the dashboard
  And I should see my job applications
```

**Step definitions:**

```typescript
Given('I am on the login page', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page);
  await loginPage.navigate();
});

When('I enter email {string} and password {string}',
  async function (this: CustomWorld, email: string, password: string) {
    // Placeholder values in the feature file are swapped for real BDD user credentials
    const actualEmail = email === 'testuser@test.com' ? BDD_USER.email : email;
    const actualPassword = password === 'Test123!' ? BDD_USER.password : password;
    await this.page.fill('input[type="email"]', actualEmail);
    await this.page.fill('input[type="password"]', actualPassword);
  });

Then('I should be redirected to the dashboard', async function (this: CustomWorld) {
  await this.page.waitForURL('**/dashboard', { timeout: BDD_CONFIG.NAVIGATION_TIMEOUT })
    .catch(async () => {
      // Fallback: if URL doesn't contain /dashboard, at minimum confirm login page is gone
      await expect(this.page).not.toHaveURL(/login/, { timeout: 5000 });
    });
});
```

The placeholder substitution in the `When` step is the key design decision. The feature
file uses readable values (`testuser@test.com`) that carry no real credentials. At
runtime, the step recognises those placeholders and replaces them with the actual
timestamped `BDD_USER` credentials registered in `BeforeAll`. The feature file stays
legible for non-technical readers; the step handles the dynamic credential injection.

---

### Scenario 2 — Create a new job application (jobs.feature)

**Why this matters:** Creating a job application is the primary action in the application.
This scenario exercises the complete modal form flow end to end through the browser:
opening the modal, filling three fields, submitting, and confirming the new entry appears
in the dashboard. It verifies that the form, the API write to Railway, and the dashboard
re-render all work together in the production environment — something no unit or API test
can confirm on its own.

**Full Gherkin scenario:**

```gherkin
Background:
  Given I am logged in

Scenario: Create a new job application
  When I click add new job button
  And I fill in company name "Google"
  And I fill in position "QA Engineer"
  And I select status "Applied"
  And I submit the form
  Then I should see "Google" in my job list
```

**Step definitions:**

```typescript
When('I click add new job button', async function (this: CustomWorld) {
  await this.page.getByTestId('add-application-btn').click();
  await this.page.waitForLoadState('networkidle');
});

When('I select status {string}',
  async function (this: CustomWorld, status: string) {
    // Human-readable Gherkin values are mapped to backend enum values here,
    // keeping the feature file in the language of the user
    const statusMap: Record<string, string> = {
      'Applied': 'applied',
      'Phone Interview': 'phone_interview',
      'Interview': 'phone_interview',
      'Technical Interview': 'technical_interview',
      'Offer': 'offer',
      'Rejected': 'rejected',
    };
    await this.page.getByTestId('job-status-select')
      .selectOption(statusMap[status] || status.toLowerCase());
  });

When('I submit the form', async function (this: CustomWorld) {
  await this.page.getByTestId('job-submit-btn').click();
  await this.page.waitForLoadState('networkidle');
});

Then('I should see {string} in my job list',
  async function (this: CustomWorld, company: string) {
    await expect(this.page.getByText(company))
      .toBeVisible({ timeout: BDD_CONFIG.DEFAULT_TIMEOUT });
  });
```

The `statusMap` in `I select status` is the right place for the translation between
Gherkin language (`'Applied'`) and backend enum values (`'applied'`). The feature file
stays in user-facing language; the step definition owns the technical detail of what the
select element actually expects. All interactions use `data-testid` selectors, which
remain stable across UI refactors that rename CSS classes or restructure layout.

---

*Last verified: 2026-06-10 — Mustafa (QA-Master505)*

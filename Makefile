.PHONY: test test-api test-ui test-headed test-debug test-chrome test-firefox test-file test-fast test-auth test-jobs bdd bdd-headed test-e2e test-e2e-headed test-e2e-debug report report-junit codegen codegen-auth codegen-jobs cli-open cli-show cli-snapshot cli-screenshot debug-login debug-dashboard debug-jobs install install-browsers install-skills help

# ============================================================
# TESTING
# ============================================================

# Run all tests
test:
	npx playwright test

# Run API tests only (no frontend needed)
test-api:
	API_URL=https://job-tracker-backend-production-7acf.up.railway.app \
	npx playwright test tests/api/

# Run UI tests only
test-ui:
	BASE_URL=https://job-tracker-frontend-green-sigma.vercel.app \
	API_URL=https://job-tracker-backend-production-7acf.up.railway.app \
	npx playwright test tests/ui/ --headed

# Run tests with visible browser
test-headed:
	npx playwright test --headed

# Run tests in debug mode
test-debug:
	npx playwright test --debug

# Run on Chrome only
test-chrome:
	npx playwright test --project=chromium

# Run on Firefox only
test-firefox:
	npx playwright test --project=firefox

# Run specific file — Usage: make test-file FILE=tests/ui/auth/login.spec.ts
test-file:
	npx playwright test $(FILE)

# Run with 1 worker (safer, slower)
test-fast:
	npx playwright test --workers=1

# Run auth tests only
test-auth:
	npx playwright test tests/ui/auth/ tests/api/auth.api.spec.ts

# Run jobs tests only
test-jobs:
	npx playwright test tests/ui/jobs/ tests/api/jobs.api.spec.ts

# Run BDD/Cucumber UI tests
bdd:
	npm run test:bdd

# Run BDD/Cucumber UI tests with visible browser
bdd-headed:
	npm run test:bdd:headed

# Run E2E tests
test-e2e:
	rm -rf test-results/
	API_URL=https://job-tracker-backend-production-7acf.up.railway.app \
	BASE_URL=https://job-tracker-frontend-green-sigma.vercel.app \
	npx playwright test tests/e2e/

# Run E2E tests with visible browser
test-e2e-headed:
	rm -rf test-results/
	API_URL=https://job-tracker-backend-production-7acf.up.railway.app \
	BASE_URL=https://job-tracker-frontend-green-sigma.vercel.app \
	npx playwright test tests/e2e/ --headed

# Run E2E tests in debug mode
test-e2e-debug:
	rm -rf test-results/
	API_URL=https://job-tracker-backend-production-7acf.up.railway.app \
	BASE_URL=https://job-tracker-frontend-green-sigma.vercel.app \
	npx playwright test tests/e2e/ --debug

# ============================================================
# REPORTS
# ============================================================

# Open HTML report
report:
	npx playwright show-report

# View JUnit XML
report-junit:
	cat results/junit.xml

# ============================================================
# RECORDING
# ============================================================

# Record new tests
codegen:
	npx playwright codegen http://localhost:5173

# Record auth flow
codegen-auth:
	npx playwright codegen http://localhost:5173/login

# Record jobs flow
codegen-jobs:
	npx playwright codegen http://localhost:5173/dashboard

# ============================================================
# PLAYWRIGHT CLI
# ============================================================

# Open browser with CLI
cli-open:
	playwright-cli open http://localhost:5173 --headed

# Show visual dashboard
cli-show:
	playwright-cli show

# Take page snapshot
cli-snapshot:
	playwright-cli snapshot

# Take screenshot
cli-screenshot:
	playwright-cli screenshot

# ============================================================
# DEBUGGING
# ============================================================

# Debug login page
debug-login:
	playwright-cli open http://localhost:5173/login --headed

# Debug dashboard page
debug-dashboard:
	playwright-cli open http://localhost:5173/dashboard --headed

# Debug jobs flow
debug-jobs:
	playwright-cli open http://localhost:5173/dashboard --headed

# ============================================================
# SETUP
# ============================================================

# Install dependencies
install:
	npm install

# Install all browsers
install-browsers:
	npx playwright install --with-deps

# Install Playwright CLI skills
install-skills:
	playwright-cli install --skills

# ============================================================
# HELP
# ============================================================

help:
	@echo ""
	@echo "================================================"
	@echo "  Job Tracker Tests — Available Commands"
	@echo "================================================"
	@echo ""
	@echo "  TESTING:"
	@echo "  make test              - Run all tests (2 workers)"
	@echo "  make test-api          - Run API tests only"
	@echo "  make test-ui           - Run UI tests only"
	@echo "  make test-headed       - Run with visible browser"
	@echo "  make test-debug        - Run in debug mode"
	@echo "  make test-chrome       - Run on Chrome only"
	@echo "  make test-firefox      - Run on Firefox only"
	@echo "  make test-auth         - Run auth tests only"
	@echo "  make test-jobs         - Run jobs tests only"
	@echo "  make test-fast         - Run with 1 worker"
	@echo "  make test-file FILE=p  - Run specific test file"
	@echo "  make test-e2e          - Run E2E tests (UI + API combined)"
	@echo "  make test-e2e-headed   - Run E2E tests with visible browser"
	@echo "  make test-e2e-debug    - Run E2E tests in debug mode"
	@echo ""
	@echo "  REPORTS:"
	@echo "  make report            - Open HTML report"
	@echo ""
	@echo "  RECORDING:"
	@echo "  make codegen           - Record new tests"
	@echo "  make codegen-auth      - Record auth flow"
	@echo "  make codegen-jobs      - Record jobs flow"
	@echo ""
	@echo "  PLAYWRIGHT CLI:"
	@echo "  make cli-open          - Open browser with CLI"
	@echo "  make cli-show          - Visual dashboard"
	@echo "  make cli-snapshot      - Take page snapshot"
	@echo "  make cli-screenshot    - Take screenshot"
	@echo ""
	@echo "  DEBUGGING:"
	@echo "  make debug-login       - Debug login page"
	@echo "  make debug-dashboard   - Debug dashboard"
	@echo ""
	@echo "  SETUP:"
	@echo "  make install           - Install dependencies"
	@echo "  make install-browsers  - Install browsers"
	@echo "  make install-skills    - Install CLI skills"
	@echo "================================================"

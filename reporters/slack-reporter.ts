import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import { sendSlackNotification, sendCiCdNotification, sendBugsNotification, sendBugFixedNotification } from '../helpers/slack-notifier';
import type { FailureDetail } from '../helpers/slack-notifier';
import { createJiraBug, closeJiraBugByKey } from '../helpers/jira-notifier';
import { loadAllTicketKeys, deleteTicketKey } from '../helpers/jira-ticket-tracker';

class SlackReporter implements Reporter {
  private passed = 0;
  private failed = 0;
  private skipped = 0;
  private failures: FailureDetail[] = [];
  private startTime = 0;
  private suiteName = 'Playwright Tests';

  onBegin(_config: FullConfig, suite: Suite): void {
    this.startTime = Date.now();
    const projectNames = suite.suites
      .map(s => s.title)
      .filter(t => t !== 'setup');
    if (projectNames.length > 0) this.suiteName = projectNames.join(', ');
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === 'passed') {
      this.passed++;
    } else if (result.status === 'skipped') {
      this.skipped++;
    } else if (result.retry === 0) {
      // failed | timedOut | interrupted — only record on first attempt to prevent retry duplicates
      this.failed++;
      const rawMessage =
        result.error?.message ?? result.errors[0]?.message ?? 'Unknown error';
      this.failures.push({
        testName: test.titlePath().join(' > '),
        // strip ANSI escape codes that appear in Playwright error output
        errorMessage: rawMessage.replace(/\[[0-9;]*m/g, '').trim(),
      });
    }
  }

  async onEnd(result: FullResult): Promise<void> {
    const durationMs = result.duration ?? Date.now() - this.startTime;
    const total = this.passed + this.failed + this.skipped;

    const actor = process.env.GITHUB_ACTOR ?? 'local';
    const branch = process.env.GITHUB_REF_NAME ?? 'local';
    const runId = process.env.GITHUB_RUN_ID;
    const repository = process.env.GITHUB_REPOSITORY;
    const runUrl =
      runId && repository
        ? `https://github.com/${repository}/actions/runs/${runId}`
        : '';

    await sendSlackNotification({
      passed: this.passed,
      failed: this.failed,
      skipped: this.skipped,
      total,
      durationMs,
      branch,
      actor,
      runUrl,
      failures: this.failures,
      suiteName: this.suiteName,
    });

    await sendCiCdNotification({
      workflowName: process.env.GITHUB_WORKFLOW ?? this.suiteName,
      status: this.failed > 0 ? 'failure' : 'success',
      branch,
      actor,
      durationMs,
      runUrl,
    });

    const jiraKeys: string[] = [];
    for (const failure of this.failures.slice(0, 5)) {
      const key = await createJiraBug(failure, runUrl);
      if (key) jiraKeys.push(key);
    }

    await sendBugsNotification({
      passed: this.passed,
      failed: this.failed,
      skipped: this.skipped,
      total,
      durationMs,
      branch,
      actor,
      runUrl,
      failures: this.failures,
    }, jiraKeys);

    if (this.failed === 0) {
      const ticketMap = loadAllTicketKeys();
      const closedKeys: string[] = [];
      for (const [testTitle, ticketKey] of Object.entries(ticketMap)) {
        await closeJiraBugByKey(ticketKey);
        deleteTicketKey(testTitle);
        closedKeys.push(ticketKey);
      }
      if (closedKeys.length > 0) {
        await sendBugFixedNotification(closedKeys);
        console.log(`[JiraReporter] Auto-closed ${closedKeys.length} bug${closedKeys.length !== 1 ? 's' : ''}`);
      }
    }
  }
}

export default SlackReporter;

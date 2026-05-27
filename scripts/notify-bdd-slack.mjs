import { readFileSync } from 'fs';
import { join } from 'path';

const REPORT_PATH = join(process.cwd(), 'results', 'cucumber-report.json');

function parseCucumberReport(reportPath) {
  try {
    const raw = JSON.parse(readFileSync(reportPath, 'utf-8'));
    let total = 0, passed = 0, failed = 0, durationNs = 0;
    for (const feature of raw) {
      for (const scenario of (feature.elements ?? [])) {
        total++;
        const scenarioFailed = scenario.steps.some(
          (s) => s.result?.status === 'failed'
        );
        scenarioFailed ? failed++ : passed++;
        for (const step of scenario.steps) {
          durationNs += step.result?.duration ?? 0;
        }
      }
    }
    return { total, passed, failed, durationMs: Math.round(durationNs / 1_000_000) };
  } catch {
    console.warn('[BDDSlack] Could not read cucumber-report.json — sending with zeros');
    return { total: 0, passed: 0, failed: 0, durationMs: 0 };
  }
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${seconds}s`;
}

async function sendBddSlackNotification({ total, passed, failed, durationMs, branch, actor, runUrl }) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[BDDSlack] SLACK_WEBHOOK_URL not set — skipping');
    return;
  }

  const hasFailed = failed > 0;
  const color = hasFailed ? '#e01e5a' : '#2eb886';
  const statusEmoji = hasFailed ? '❌' : '✅';
  const headerText = hasFailed
    ? `BDD UI Tests Failed — ${failed} scenario${failed !== 1 ? 's' : ''} failed`
    : 'BDD UI Tests Passed';

  const fields = [
    { type: 'mrkdwn', text: `*Total:* ${total}` },
    { type: 'mrkdwn', text: `*Passed:* ${passed}` },
    { type: 'mrkdwn', text: `*Failed:* ${failed}` },
    { type: 'mrkdwn', text: `*Duration:* ${formatDuration(durationMs)}` },
    { type: 'mrkdwn', text: `*Branch:* \`${branch}\`` },
    { type: 'mrkdwn', text: `*Triggered by:* ${actor}` },
  ];

  if (runUrl) {
    fields.push({ type: 'mrkdwn', text: `*Run:* <${runUrl}|View on GitHub>` });
  }

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `${statusEmoji} ${headerText}`, emoji: true },
    },
    { type: 'section', fields },
  ];

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachments: [{ color, blocks }] }),
    });
    if (!response.ok) {
      console.warn(`[BDDSlack] Webhook returned ${response.status}: ${await response.text()}`);
    } else {
      console.log(`[BDDSlack] Notification sent (${hasFailed ? 'FAIL' : 'PASS'})`);
    }
  } catch (err) {
    console.warn('[BDDSlack] Failed to send notification:', err);
  }
}

const { total, passed, failed, durationMs } = parseCucumberReport(REPORT_PATH);
const runId = process.env.GITHUB_RUN_ID ?? '';
const repo = process.env.GITHUB_REPOSITORY ?? '';
const runUrl = runId && repo ? `https://github.com/${repo}/actions/runs/${runId}` : '';

await sendBddSlackNotification({
  total,
  passed,
  failed,
  durationMs,
  branch: process.env.GITHUB_REF_NAME ?? 'unknown',
  actor: process.env.GITHUB_ACTOR ?? 'unknown',
  runUrl,
});

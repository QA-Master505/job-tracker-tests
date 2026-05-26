import { readFileSync } from 'fs';
import { join } from 'path';

const JUNIT_PATH = join(process.cwd(), 'allure-results', 'newman-junit.xml');

function parseJunit(xmlPath) {
  try {
    const xml = readFileSync(xmlPath, 'utf-8');
    const total = parseInt(xml.match(/tests="(\d+)"/)?.[1] ?? '0', 10);
    const failed = parseInt(xml.match(/failures="(\d+)"/)?.[1] ?? '0', 10);
    const errors = parseInt(xml.match(/errors="(\d+)"/)?.[1] ?? '0', 10);
    const durationMs = Math.round(parseFloat(xml.match(/time="([\d.]+)"/)?.[1] ?? '0') * 1000);
    return { total, failed: failed + errors, durationMs };
  } catch {
    console.warn('[NewmanSlack] Could not read JUnit XML — sending with zeros');
    return { total: 0, failed: 0, durationMs: 0 };
  }
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${seconds}s`;
}

async function sendNewmanSlackNotification({ total, failed, durationMs, branch, actor, runUrl }) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[NewmanSlack] SLACK_WEBHOOK_URL not set — skipping');
    return;
  }

  const hasFailed = failed > 0;
  const color = hasFailed ? '#e01e5a' : '#2eb886';
  const statusEmoji = hasFailed ? '❌' : '✅';
  const headerText = hasFailed
    ? `Postman Tests Failed — ${failed} failure${failed !== 1 ? 's' : ''}`
    : 'Postman Tests Passed';

  const fields = [
    { type: 'mrkdwn', text: `*Total:* ${total}` },
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
      console.warn(`[NewmanSlack] Webhook returned ${response.status}: ${await response.text()}`);
    } else {
      console.log(`[NewmanSlack] Notification sent (${hasFailed ? 'FAIL' : 'PASS'})`);
    }
  } catch (err) {
    console.warn('[NewmanSlack] Failed to send notification:', err);
  }
}

const { total, failed, durationMs } = parseJunit(JUNIT_PATH);
const runId = process.env.GITHUB_RUN_ID ?? '';
const repo = process.env.GITHUB_REPOSITORY ?? '';
const runUrl = runId && repo ? `https://github.com/${repo}/actions/runs/${runId}` : '';

await sendNewmanSlackNotification({
  total,
  failed,
  durationMs,
  branch: process.env.GITHUB_REF_NAME ?? 'unknown',
  actor: process.env.GITHUB_ACTOR ?? 'unknown',
  runUrl,
});

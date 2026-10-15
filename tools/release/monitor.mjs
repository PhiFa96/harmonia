import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
export const config = JSON.parse(
  readFileSync(new URL('./readiness.json', import.meta.url), 'utf8'),
);
export function evaluateOperations(
  input,
  { dailyTutorBudgetNanoUsd = config.dailyTutorBudgetNanoUsd } = {},
  now = Date.now(),
) {
  const exact = (value, keys) =>
    value &&
    typeof value === 'object' &&
    Object.keys(value).sort().join() === keys.split(' ').sort().join();
  if (
    !exact(
      input,
      'version asOf windowStart services ai billingPendingOverHour privacyPendingOverDay',
    ) ||
    !exact(input?.ai, 'spentNanoUsd reservedNanoUsd failedRequestsHour')
  )
    throw Error('Unexpected operational fields');
  if (
    input?.version !== 1 ||
    !Array.isArray(input.services) ||
    !Number.isFinite(Date.parse(input.asOf)) ||
    Math.abs(Date.parse(input.asOf) - now) > 5 * 60000
  )
    throw Error('Operational snapshot missing or stale');
  const counts = [
    input.billingPendingOverHour,
    input.privacyPendingOverDay,
    input.ai?.failedRequestsHour,
  ];
  for (const row of input.services)
    counts.push(row.requests, row.failures, row.rejected, row.max_response_ms);
  if (!counts.every((value) => Number.isSafeInteger(value) && value >= 0))
    throw Error('Invalid operational counts');
  if (
    new Set(input.services.map((row) => row.service)).size !== input.services.length ||
    input.services.some(
      (row) =>
        !exact(row, 'service requests failures rejected max_response_ms') ||
        !['learning-sync', 'tutor', 'billing-webhook'].includes(row.service),
    )
  )
    throw Error('Invalid service aggregation');
  const alerts = [];
  if (input.billingPendingOverHour)
    alerts.push({
      signal: 'billing_backlog',
      severity: 'critical',
      value: input.billingPendingOverHour,
    });
  if (input.privacyPendingOverDay)
    alerts.push({
      signal: 'privacy_backlog',
      severity: 'critical',
      value: input.privacyPendingOverDay,
    });
  if (input.ai.failedRequestsHour)
    alerts.push({
      signal: 'tutor_failed_requests',
      severity: 'warning',
      value: input.ai.failedRequestsHour,
    });
  if (
    typeof input.ai.spentNanoUsd !== 'string' ||
    typeof input.ai.reservedNanoUsd !== 'string' ||
    !/^\d+$/.test(input.ai.spentNanoUsd) ||
    !/^\d+$/.test(input.ai.reservedNanoUsd)
  )
    throw Error('Invalid cost counters');
  if (dailyTutorBudgetNanoUsd === null)
    alerts.push({ signal: 'cost_budget_unconfigured', severity: 'unknown' });
  else {
    if (
      typeof dailyTutorBudgetNanoUsd !== 'string' ||
      !/^\d+$/.test(dailyTutorBudgetNanoUsd) ||
      BigInt(dailyTutorBudgetNanoUsd) <= 0n
    )
      throw Error('Invalid operations budget');
    if (
      BigInt(input.ai.spentNanoUsd) + BigInt(input.ai.reservedNanoUsd) >
      BigInt(dailyTutorBudgetNanoUsd)
    )
      alerts.push({ signal: 'tutor_budget', severity: 'critical' });
  }
  const sync = input.services.find((row) => row.service === 'learning-sync');
  if (!sync || sync.requests - sync.rejected < 100)
    alerts.push({ signal: 'sync_sample_missing', severity: 'unknown' });
  else if (sync.failures / (sync.requests - sync.rejected) > 0.01)
    alerts.push({
      signal: 'sync_failure_rate',
      severity: 'critical',
      numerator: sync.failures,
      denominator: sync.requests - sync.rejected,
    });
  for (const row of input.services)
    if (
      row.failures > row.requests ||
      row.rejected > row.requests ||
      row.rejected + row.failures > row.requests
    )
      throw Error('Contradictory operational counts');
  return {
    version: 1,
    asOf: input.asOf,
    windowStart: input.windowStart,
    alerts,
    serverSignalsHealthy: alerts.length === 0,
    nativeCrashCoverage: 'not measured by this server report',
    snapshot: input,
  };
}
export async function operationsMain(args) {
  if (args.includes('--local') === args.includes('--remote'))
    throw Error('Choose --local or --remote');
  let url, key;
  if (args.includes('--local')) {
    const status = JSON.parse(
      execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    );
    url = status.API_URL;
    key = status.SERVICE_ROLE_KEY;
    if (!/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(url))
      throw Error('Local project required');
  } else {
    url = process.env.HARMONIA_OPERATIONS_URL;
    key = process.env.HARMONIA_OPERATIONS_SERVICE_ROLE_KEY;
    const origin = new URL(url);
    if (origin.protocol !== 'https:' || origin.origin !== config.productionSupabaseOrigin || !key)
      throw Error('Bound production project required');
  }
  const response = await fetch(new URL('/rest/v1/rpc/operations_snapshot', url), {
    method: 'POST',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw Error('Operational snapshot unavailable');
  const report = evaluateOperations(await response.json());
  console.log(JSON.stringify(report, null, 2));
  if (args.includes('--check') && !report.serverSignalsHealthy)
    process.exitCode = report.alerts.some((row) => row.severity === 'critical') ? 1 : 2;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  operationsMain(process.argv.slice(2)).catch(() => {
    console.error(
      'Operations monitoring failed; check project binding and private server credentials.',
    );
    process.exitCode = 1;
  });

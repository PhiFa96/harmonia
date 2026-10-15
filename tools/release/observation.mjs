import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { validInstant } from '../beta/access.mjs';
export const checkpoints = [0, 1, 6, 12, 24, 48, 72];
export function observationProblems(input, now = Date.now()) {
  if (
    input?.version !== 1 ||
    !['real', 'synthetic'].includes(input.dataKind) ||
    !Array.isArray(input.observations) ||
    !Array.isArray(input.incidents) ||
    !input.channels
  )
    throw Error('Invalid launch observation journal');
  const missing = [];
  if (input.dataKind !== 'real') missing.push('real observations');
  if (!/^[a-f\d]{40}$/.test(input.releaseCommit ?? '')) missing.push('release commit');
  if (!validInstant(input.launchedAt) || Date.parse(input.launchedAt) > now)
    missing.push('actual launch timestamp');
  for (const platform of ['ios', 'android', 'web'])
    if (
      input.channels[platform]?.verified !== true ||
      !input.channels[platform]?.evidenceReference?.trim()
    )
      missing.push('live channel.' + platform);
  const start = Date.parse(input.launchedAt);
  if (!Number.isFinite(start) || now - start < 72 * 3600000)
    missing.push('72 actual elapsed hours');
  const seen = new Set();
  for (const row of input.observations) {
    if (
      !checkpoints.includes(row.checkpointHour) ||
      seen.has(row.checkpointHour) ||
      !validInstant(row.observedAt) ||
      Date.parse(row.observedAt) > now ||
      !row.reviewer?.trim() ||
      !row.evidenceReference?.trim() ||
      !['ok', 'incident'].includes(row.result)
    )
      throw Error('Invalid or duplicate observation');
    seen.add(row.checkpointHour);
    if (
      Date.parse(row.observedAt) < start + row.checkpointHour * 3600000 ||
      Date.parse(row.observedAt) > start + (row.checkpointHour + 2) * 3600000
    )
      throw Error('Observation does not cover the checkpoint window');
    if (row.result === 'incident' && !input.incidents.some((issue) => issue.id === row.incidentId))
      throw Error('Incident observation requires a tracked incident');
  }
  for (const hour of checkpoints)
    if (!seen.has(hour)) missing.push('observed checkpoint.' + hour + 'h');
  for (const issue of input.incidents) {
    if (
      !issue.id?.trim() ||
      !['critical', 'high', 'medium', 'low'].includes(issue.severity) ||
      !['open', 'planned', 'resolved'].includes(issue.status) ||
      !issue.owner?.trim() ||
      !issue.trackingReference?.trim()
    )
      throw Error('Invalid incident');
    if (issue.severity === 'critical' && issue.status !== 'resolved')
      missing.push('open critical incident.' + issue.id);
    if (
      issue.status === 'resolved' &&
      (!issue.verificationReference?.trim() ||
        !validInstant(issue.resolvedAt) ||
        Date.parse(issue.resolvedAt) > now)
    )
      throw Error('Resolved incident requires actual verification');
  }
  if (!input.retrospective?.completed || !input.retrospective.evidenceReference?.trim())
    missing.push('phase 2 retrospective');
  if (!input.phase3Plan?.updated || !input.phase3Plan.evidenceReference?.trim())
    missing.push('updated phase 3 plan');
  return missing;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const file = process.argv[process.argv.indexOf('--journal') + 1];
    const missing = observationProblems(JSON.parse(readFileSync(file, 'utf8')));
    if (missing.length) throw Error('Launch observation incomplete: ' + missing.join(', '));
    console.log('Observation fields checked; real launch and evidence remain human-reviewed.');
  } catch {
    console.error('Launch observation incomplete or invalid; no completed 72-hour watch inferred.');
    process.exitCode = 1;
  }
}

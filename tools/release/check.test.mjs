import { test } from 'node:test';
import assert from 'node:assert/strict';
import { config } from './monitor.mjs';
import {
  validateReleaseConfig,
  releaseProblems,
  actualProblems,
  verifyGitHubRelease,
} from './check.mjs';
import { observationProblems, checkpoints } from './observation.mjs';
import { supportReply, validateSupportTemplates } from './support.mjs';
test('P2 preparation does not turn incomplete content, beta or approval fields into a release', async () => {
  validateReleaseConfig(config);
  assert.ok(releaseProblems(config).includes('complete published stages 1 and 2'));
  assert.ok((await actualProblems()).includes('beta.completed real beta journal'));
  const copy = structuredClone(config);
  copy.approvals.support.approved = true;
  assert.throws(() => validateReleaseConfig(copy), /evidence/);
});
test('release requires the approved merged main PR and every successful candidate check', () => {
  const commit = 'a'.repeat(40),
    pr = {
      baseRefName: 'main',
      state: 'MERGED',
      isDraft: false,
      reviewDecision: 'APPROVED',
      mergeCommit: { oid: commit },
    };
  const names = [
    'Lint, Typen, Tests',
    'Tutor-Batchmechanik ohne Modellkosten',
    'Web-Build der App',
    'Deno-Kompatibilität',
    'Supabase und Profil-Zugriffsschutz',
  ];
  const checks = {
    check_runs: names.map((name, i) => ({
      name,
      id: i,
      status: 'completed',
      conclusion: 'success',
    })),
  };
  verifyGitHubRelease(pr, commit, checks);
  assert.throws(
    () => verifyGitHubRelease({ ...pr, reviewDecision: null }, commit, checks),
    /Reviewed/,
  );
  assert.throws(() => verifyGitHubRelease(pr, 'b'.repeat(40), checks), /Reviewed/);
  checks.check_runs.push({ ...checks.check_runs[0], id: 100, conclusion: 'failure' });
  assert.throws(() => verifyGitHubRelease(pr, commit, checks), /not successful/);
});
test('72-hour completion needs actual elapsed time, all channels and recorded checkpoints', () => {
  const start = Date.parse('2026-10-01T12:00:00.000Z');
  const input = {
    version: 1,
    dataKind: 'synthetic',
    releaseCommit: 'a'.repeat(40),
    launchedAt: new Date(start).toISOString(),
    channels: Object.fromEntries(
      ['ios', 'android', 'web'].map((platform) => [
        platform,
        { verified: true, evidenceReference: 'synthetic-only' },
      ]),
    ),
    observations: checkpoints.map((hour) => ({
      checkpointHour: hour,
      observedAt: new Date(start + hour * 3600000).toISOString(),
      reviewer: 'fixture',
      evidenceReference: 'synthetic-only',
      result: 'ok',
    })),
    incidents: [],
    retrospective: { completed: true, evidenceReference: 'synthetic-only' },
    phase3Plan: { updated: true, evidenceReference: 'synthetic-only' },
  };
  assert.deepEqual(observationProblems(input, start + 73 * 3600000), ['real observations']);
  input.dataKind = 'real';
  assert.deepEqual(observationProblems(input, start + 73 * 3600000), []); // validates fields, not real-world evidence
  assert.throws(() => observationProblems(input, start + 2 * 3600000), /Invalid/);
  input.observations = input.observations.filter((row) => row.checkpointHour <= 1);
  assert.ok(observationProblems(input, start + 2 * 3600000).includes('72 actual elapsed hours'));
});
test('support templates retain language parity and require actual fix references', () => {
  validateSupportTemplates();
  assert.throws(
    () => supportReply('de', 'resolved', { reference: 'own-fixture' }),
    /reviewed placeholder/,
  );
  const reply = supportReply('en', 'received', { reference: 'own-fixture' });
  assert.ok(reply.body.includes('does not confirm a fix or refund'));
  assert.throws(
    () => supportReply('en', 'received', { reference: 'private\nnew-header' }),
    /reviewed placeholder/,
  );
});

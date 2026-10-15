import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  symlinkSync,
  chmodSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { once } from 'node:events';
import {
  readiness,
  validateReadiness,
  betaStartProblems,
  actualBetaProblems,
  runtimeProblems,
} from './readiness.mjs';
import {
  issueAccess,
  tokenHash,
  validAuthorization,
  readPrivateJson,
  savePrivateJson,
  validateAccess,
} from './access.mjs';
import { createBetaServer } from './server.mjs';
import { candidateFiles, verifyCandidate } from './web.mjs';
import { sha256 } from '../storefront/media.mjs';
import { validateMessages, renderGuide } from './guide.mjs';
import { validateStudy, summarizeWeek, betaCompletionProblems, metrics } from './study.mjs';
import { renderWeeklyReport } from './report.mjs';
import { newPrivateOutput } from './paths.mjs';

const now = Date.parse('2026-09-10T12:00:00.000Z');
const emptyStudy = () =>
  JSON.parse(readFileSync(new URL('./study.example.json', import.meta.url), 'utf8'));
const issue = () => ({
  id: 'BETA-0001',
  severity: 'high',
  status: 'planned',
  summary: 'Own synthetic issue',
  owner: 'fixture-reviewer',
  trackingReference: 'private-fixture-task',
  createdAt: '2026-09-01T13:00:00.000Z',
  triagedAt: '2026-09-02T12:00:00.000Z',
  fixCommit: null,
  verificationReference: null,
  verifiedAt: null,
  resolutionReference: null,
});
function completedStudy() {
  const study = emptyStudy();
  study.dataKind = 'synthetic';
  study.startedOn = '2026-09-01';
  study.endedOn = '2026-09-08';
  study.participants = Array.from({ length: 30 }, (_, i) => ({
    id: 'bt-' + i.toString(16).padStart(16, '0'),
    group: ['beginner', 'choir', 'instrumental', 'student'][i % 4],
    platforms: [['ios', 'android', 'web'][i % 3]],
    locale: 'de-DE',
    firstUsedAt: '2026-09-01T12:00:00.000Z',
  }));
  study.reviews = [
    {
      from: '2026-09-01',
      toExclusive: '2026-09-08',
      reviewedAt: '2026-09-08T12:00:00.000Z',
      reviewer: 'fixture-reviewer',
      summary: 'Synthetic weekly review',
    },
  ];
  study.metricReview = {
    reviewedAt: '2026-09-09T12:00:00.000Z',
    reviewer: 'fixture-reviewer',
    baselineReference: 'synthetic-private-baseline',
    approvalReference: 'synthetic-approval-only',
    targets: metrics.map((metric) => ({
      metric,
      target: metric === 'aiCostPerRequest' ? 0.02 : 50,
      baselineNumerator: 1,
      baselineDenominator: 10,
      denominator: 'Synthetic consented cohort',
      window: 'Full mature observation window',
      rationale: 'Synthetic mechanism test; no production target',
    })),
  };
  return study;
}
test('beta preparation keeps real approvals and observations open', () => {
  validateReadiness(readiness);
  validateMessages();
  assert.ok(actualBetaProblems('web').includes('content.publishedLessons'));
  assert.ok(actualBetaProblems('ios').includes('channels.ios'));
  assert.ok(betaCompletionProblems(emptyStudy(), now).includes('30–100 actual testers'));
  assert.throws(
    () =>
      validateReadiness({
        ...readiness,
        channels: { ...readiness.channels, web: { approved: true, evidenceReference: ' ' } },
      }),
    /reference/,
  );
  assert.throws(() => validateReadiness({ ...readiness, campaignId: undefined }), /campaign/);
});
test('private reports cannot enter a candidate directory or follow a symlinked parent', () => {
  const outside = mkdtempSync(join(tmpdir(), 'harmonia-beta-output-'));
  const reportParent = newPrivateOutput(
    join(process.cwd(), 'artifacts/beta/reports', 'path-fixture-' + outside.split('/').at(-1)),
    'reports',
  );
  try {
    assert.throws(
      () =>
        newPrivateOutput(join(process.cwd(), 'artifacts/beta/candidates/report-leak'), 'reports'),
      /new child/,
    );
    symlinkSync(outside, reportParent);
    assert.throws(() => newPrivateOutput(join(reportParent, 'out'), 'reports'), /symlinked/);
    assert.equal(candidateFiles(outside).length, 0);
  } finally {
    rmSync(reportParent, { force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
test('beta gate requires each evaluated prerequisite and the selected channel', () => {
  const config = structuredClone(readiness);
  config.coordinator = 'fixture';
  config.feedbackEmail = 'fixture@example.org';
  config.bindings = {
    supabaseOrigin: 'https://beta-project.supabase.co',
    easProjectId: '00000000-0000-0000-0000-000000000001',
  };
  for (const section of ['approvals', 'channels'])
    for (const item of Object.values(config[section])) {
      item.approved = true;
      item.evidenceReference = 'synthetic-only';
    }
  assert.ok(betaStartProblems(config, 'web').includes('legal.not evaluated'));
  const evidence = { legal: [], device: [], website: [], runtime: [], publishedLessons: 1 };
  assert.deepEqual(betaStartProblems(config, 'web', evidence), []);
  config.channels.ios.approved = false;
  assert.ok(betaStartProblems(config, 'ios', evidence).includes('channels.ios'));
  assert.deepEqual(betaStartProblems(config, 'web', evidence), []);
  assert.throws(() => betaStartProblems(config, 'preview', evidence), /Choose/);
});
test('EAS beta uses production content and a draft internal Play submission; hook blocks missing evidence', async () => {
  const eas = JSON.parse(
    readFileSync(new URL('../../apps/mobile/eas.json', import.meta.url), 'utf8'),
  );
  assert.equal(eas.build.beta.env.APP_VARIANT, 'production');
  assert.equal(eas.build.beta.distribution, 'store');
  assert.equal(eas.build.beta.channel, 'beta');
  assert.equal(eas.submit.beta.android.track, 'internal');
  assert.equal(eas.submit.beta.android.releaseStatus, 'draft');
  const { default: appConfig } = await import('../../apps/mobile/app.config.ts');
  const original = { profile: process.env.EAS_BUILD_PROFILE, variant: process.env.APP_VARIANT };
  try {
    process.env.EAS_BUILD_PROFILE = 'beta';
    process.env.APP_VARIANT = 'preview';
    assert.throws(() => appConfig({ config: {} }), /Produktionskatalog/);
    process.env.APP_VARIANT = 'production';
    assert.equal(appConfig({ config: {} }).extra.variant, 'production');
  } finally {
    for (const [key, value] of [
      ['EAS_BUILD_PROFILE', original.profile],
      ['APP_VARIANT', original.variant],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
  for (const profile of ['beta', 'preview']) {
    const result = spawnSync(process.execPath, ['tools/beta/eas-hook.mjs'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        EAS_BUILD_PROFILE: profile,
        EAS_BUILD_PLATFORM: 'ios',
        APP_VARIANT: 'production',
      },
    });
    assert.equal(result.status, profile === 'beta' ? 1 : 0);
    if (profile === 'beta') assert.match(result.stderr, /Beta start blocked/);
  }
});
test('beta runtime rejects a different Supabase or EAS project even with valid public bindings', () => {
  const patch = {
    APP_VARIANT: 'production',
    EXPO_PUBLIC_SUPABASE_URL: 'https://beta-project.supabase.co',
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_' + 'a'.repeat(24),
    EAS_PROJECT_ID: '00000000-0000-0000-0000-000000000001',
  };
  const previous = Object.fromEntries(Object.keys(patch).map((key) => [key, process.env[key]]));
  const config = structuredClone(readiness);
  config.bindings = {
    supabaseOrigin: patch.EXPO_PUBLIC_SUPABASE_URL,
    easProjectId: patch.EAS_PROJECT_ID,
  };
  try {
    Object.assign(process.env, patch);
    let missing = runtimeProblems({ native: true, config });
    assert.ok(!missing.includes('boundBetaSupabaseProject'));
    assert.ok(!missing.includes('boundBetaEasProject'));
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://other-project.supabase.co';
    process.env.EAS_PROJECT_ID = '00000000-0000-0000-0000-000000000002';
    missing = runtimeProblems({ native: true, config });
    assert.ok(missing.includes('boundBetaSupabaseProject'));
    assert.ok(missing.includes('boundBetaEasProject'));
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
test('default beta export and server refuse the unapproved state before creating output/listening', () => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-beta-blocked-'));
  try {
    for (const script of ['web.mjs', 'server.mjs']) {
      const result = spawnSync(
        process.execPath,
        ['tools/beta/' + script, '--output', join(dir, 'must-not-exist')],
        { encoding: 'utf8' },
      );
      assert.equal(result.status, 1);
      assert.match(result.stderr, /blocked/);
      assert.equal(result.stdout, '');
    }
    assert.equal(candidateFiles(dir).length, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test('individual access uses 256-bit generated secrets, hashes and bounded expiry', () => {
  const { id, token, access } = issueAccess(
    { version: 1, testers: [] },
    '2026-09-20T00:00:00.000Z',
    now,
  );
  assert.match(token, /^[\w-]{43}$/);
  assert.ok(!JSON.stringify(access).includes(token));
  const header = 'Basic ' + Buffer.from(id + ':' + token).toString('base64');
  assert.equal(validAuthorization(header, access, now), true);
  assert.equal(validAuthorization(header, access, Date.parse('2026-09-20')), false);
  assert.equal(validAuthorization('Bearer ' + token, access, now), false);
  assert.equal(
    validAuthorization('Basic ' + Buffer.from(id + ':wrong').toString('base64'), access, now),
    false,
  );
  access.testers[0].revoked = true;
  assert.equal(validAuthorization(header, access, now), false);
  assert.throws(
    () => issueAccess({ version: 1, testers: [] }, '2026-12-31T00:00:00.000Z', now),
    /90 days/,
  );
  assert.throws(
    () =>
      validateAccess({
        version: 1,
        testers: [{ ...access.testers[0], email: 'not-stored@example.org' }],
      }),
    /Invalid/,
  );
});
test('web beta protects every route/asset/HEAD and applies revocation, expiry and corrupt-file denial', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-beta-server-')),
    root = join(dir, 'web'),
    file = join(dir, 'access.json');
  mkdirSync(root);
  writeFileSync(join(root, 'index.html'), 'Own app fixture');
  writeFileSync(join(root, 'entry.js'), 'const ownFixture = true;');
  writeFileSync(join(dir, 'outside.txt'), 'must not leak');
  symlinkSync(join(dir, 'outside.txt'), join(root, 'link.txt'));
  const issued = issueAccess({ version: 1, testers: [] }, '2026-09-20T00:00:00.000Z', now);
  savePrivateJson(file, issued.access);
  let clock = now;
  const server = createBetaServer({
    root,
    accessFile: file,
    files: [{ path: 'index.html' }, { path: 'entry.js' }],
    now: () => clock,
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port,
    authorization = 'Basic ' + Buffer.from(issued.id + ':' + issued.token).toString('base64');
  const request = (path, options = {}) => fetch(base + path, options);
  try {
    for (const path of [
      '/',
      '/lesson',
      '/entry.js',
      '/beta/de-DE.html',
      '/does-not-exist.txt',
      '/link.txt',
    ]) {
      for (const method of ['GET', 'HEAD']) {
        const response = await request(path, { method });
        assert.equal(response.status, 401, path);
        assert.equal(await response.text(), '');
        assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.match(response.headers.get('www-authenticate'), /^Basic/);
      }
    }
    const response = await request('/entry.js', { headers: { authorization } });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'const ownFixture = true;');
    assert.equal(response.headers.get('cross-origin-embedder-policy'), 'require-corp');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert.match(response.headers.get('x-robots-tag'), /noindex/);
    assert.equal((await request('/lesson', { headers: { authorization } })).status, 200);
    writeFileSync(join(root, 'accidental-private.txt'), 'must not serve a new unlisted file');
    assert.equal(
      (await request('/accidental-private.txt', { headers: { authorization } })).status,
      404,
    );
    assert.equal((await request('/link.txt', { headers: { authorization } })).status, 403);
    assert.equal(
      (await request('/entry.js', { method: 'POST', headers: { authorization } })).status,
      405,
    );
    issued.access.testers[0].revoked = true;
    savePrivateJson(file, issued.access);
    assert.equal((await request('/entry.js', { headers: { authorization } })).status, 401);
    issued.access.testers[0].revoked = false;
    savePrivateJson(file, issued.access);
    clock = Date.parse('2026-09-20');
    assert.equal((await request('/entry.js', { headers: { authorization } })).status, 401);
    clock = now;
    writeFileSync(file, 'not json');
    assert.equal((await request('/entry.js', { headers: { authorization } })).status, 401);
    savePrivateJson(file, issued.access);
    chmodSync(file, 0o644);
    assert.equal((await request('/entry.js', { headers: { authorization } })).status, 401);
    assert.throws(() => createBetaServer({ root, accessFile: join(root, 'entry.js') }), /outside/);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  }
});
test('private access CLI writes handout only to mode 0600 files, without printing its secret', () => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-beta-cli-')),
    file = join(dir, 'access.json');
  try {
    const expires = new Date(Date.now() + 86400000).toISOString();
    const result = spawnSync(
      process.execPath,
      ['tools/beta/access.mjs', 'add', '--file', file, '--expires', expires],
      { encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr);
    const access = readPrivateJson(file),
      entry = access.testers[0];
    const handout = readFileSync(join(dir, entry.id + '.txt'), 'utf8'),
      token = handout.match(/Password: ([\w-]+)/)[1];
    assert.equal(tokenHash(token), entry.tokenHash);
    assert.ok(!result.stdout.includes(token));
    const revoked = spawnSync(
      process.execPath,
      ['tools/beta/access.mjs', 'revoke', '--file', file, '--id', entry.id],
      { encoding: 'utf8' },
    );
    assert.equal(revoked.status, 0);
    assert.equal(readPrivateJson(file).testers[0].revoked, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test('candidate verification binds all assets to production content/commit and rejects QA exports and tampering', () => {
  const root = mkdtempSync(join(tmpdir(), 'harmonia-beta-candidate-')),
    commit = 'a'.repeat(40);
  mkdirSync(join(root, '_expo/js/web'), { recursive: true });
  writeFileSync(join(root, 'index.html'), 'Own synthetic app');
  writeFileSync(join(root, '_expo/js/web/entry-fixture.js'), 'own fixture');
  const manifest = {
    version: 1,
    campaignId: readiness.campaignId,
    variant: 'production',
    sourceDirty: false,
    sourceCommit: commit,
    contentSha256: sha256(new URL('../../packages/content/src/published.json', import.meta.url)),
    files: candidateFiles(root),
  };
  const save = () =>
    writeFileSync(join(root, 'harmonia-beta-candidate.json'), JSON.stringify(manifest));
  save();
  try {
    assert.equal(verifyCandidate(root, commit).sourceCommit, commit);
    assert.throws(() => verifyCandidate(root, 'b'.repeat(40)), /stale/);
    manifest.variant = 'preview';
    save();
    assert.throws(() => verifyCandidate(root, commit), /Invalid/);
    manifest.variant = 'production';
    save();
    writeFileSync(join(root, 'index.html'), 'changed');
    assert.throws(() => verifyCandidate(root, commit), /changed/);
    writeFileSync(join(root, 'index.html'), 'Own synthetic app');
    writeFileSync(join(root, 'harmonia-qa-fixture.json'), '{}');
    assert.throws(() => verifyCandidate(root, commit), /Invalid/);
    rmSync(join(root, 'harmonia-qa-fixture.json'));
    writeFileSync(join(root, 'extra.txt'), 'extra');
    assert.throws(() => verifyCandidate(root, commit), /changed/);
    rmSync(join(root, 'extra.txt'));
    symlinkSync(join(root, 'index.html'), join(root, 'symlink.html'));
    assert.throws(() => verifyCandidate(root, commit), /symlink/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test('localized guides escape contact and preserve guest report and optional consent rules', () => {
  for (const locale of ['de-DE', 'en-US', 'en-GB']) {
    const html = renderGuide(locale, 'test+beta@example.org');
    assert.ok(html.includes('lang="' + locale + '"'));
    assert.ok(html.includes('noindex,nofollow'));
    assert.ok(html.includes('feedback-' + locale + '.txt'));
    assert.ok(!html.includes('<script'));
    assert.ok(html.includes('mailto:test%2Bbeta%40example.org'));
  }
  assert.ok(!renderGuide('de-DE').includes('mailto:'));
  assert.ok(!renderGuide('en-US', '"><script>alert(1)</script>').includes('<script>'));
  assert.throws(() => validateMessages({ 'de-DE': {} }), /languages/);
});
test('study rejects duplicate identities, invalid calendar/future dates and dangling feedback', () => {
  const study = completedStudy();
  validateStudy(study, now);
  study.participants.push({ ...study.participants[0] });
  assert.throws(() => validateStudy(study, now), /Duplicate participant/);
  study.participants.pop();
  study.participants[0].firstUsedAt = '2026-02-30T12:00:00.000Z';
  assert.throws(() => validateStudy(study, now), /first observed/);
  study.participants[0].firstUsedAt = '2026-09-11T12:00:00.000Z';
  assert.throws(() => validateStudy(study, now), /first observed/);
  study.participants[0].firstUsedAt = '2026-09-01T12:00:00.000Z';
  study.feedback.push({
    id: 'FB-0001',
    participantId: 'bt-ffffffffffffffff',
    receivedAt: '2026-09-02T12:00:00.000Z',
    source: 'general',
    summary: 'Own fixture',
    issueId: null,
  });
  assert.throws(() => validateStudy(study, now), /dangling/);
  study.feedback = [];
  study.participants[0].email = 'not-recorded@example.org';
  assert.throws(() => validateStudy(study, now), /fields/);
});
test('weekly report distinguishes actual usage, repeat reports, untriaged feedback and snapshot status', () => {
  const study = completedStudy();
  study.issues = [issue()];
  study.participants[0].firstUsedAt = null;
  study.feedback = Array.from({ length: 3 }, (_, i) => ({
    id: 'FB-000' + (i + 1),
    participantId: null,
    receivedAt: '2026-09-02T12:00:00.000Z',
    source: 'general',
    summary: 'Synthetic feedback',
    issueId: i === 2 ? null : 'BETA-0001',
  }));
  const report = summarizeWeek(study, '2026-09-01', '2026-09-08', now);
  assert.equal(report.participants, 29);
  assert.equal(report.feedback, 3);
  assert.equal(report.untriaged, 1);
  assert.equal(report.issuesReportedThisWeek.length, 1);
  assert.equal(report.groups.beginner, 7);
  assert.ok(report.completionProblems.includes('untriaged feedback.FB-0003'));
  assert.throws(() => summarizeWeek(study, '2026-09-01', '2026-09-09', now), /1–7/);
  assert.throws(() => summarizeWeek(study, '2026-09-05', '2026-09-11', now), /fully closed/);
});
test('completion cannot accept simulation, unresolved critical issues, missing reviews or empty metric baselines', () => {
  const study = completedStudy();
  assert.ok(betaCompletionProblems(study, now).some((item) => item.includes('synthetic')));
  study.dataKind = 'real';
  assert.deepEqual(betaCompletionProblems(study, now), []); // Fields only; not evidence of real people.
  study.issues = [{ ...issue(), severity: 'critical' }];
  assert.ok(betaCompletionProblems(study, now).includes('open critical issue.BETA-0001'));
  study.issues[0].status = 'fixed';
  assert.throws(() => validateStudy(study, now), /regression evidence/);
  study.issues[0].fixCommit = 'b'.repeat(40);
  study.issues[0].verificationReference = 'synthetic-regression';
  study.issues[0].verifiedAt = '2026-09-03T12:00:00.000Z';
  assert.deepEqual(betaCompletionProblems(study, now), []);
  study.issues[0].verifiedAt = '2026-09-09T12:00:00.000Z';
  assert.ok(
    betaCompletionProblems(study, now).includes('review of latest feedback and issue evidence'),
  );
  study.issues[0].verifiedAt = '2026-09-03T12:00:00.000Z';
  study.reviews = [];
  assert.ok(betaCompletionProblems(study, now).some((item) => item.includes('weekly reviews')));
  study.metricReview.targets[0].baselineDenominator = 0;
  assert.throws(() => validateStudy(study, now), /empty baseline/);
});
test('private weekly HTML escapes issue content and never turns tracking references into active links', () => {
  const study = completedStudy();
  study.issues = [
    { ...issue(), summary: '<script>private</script>', trackingReference: 'javascript:alert(1)' },
  ];
  study.feedback = [
    {
      id: 'FB-0001',
      participantId: null,
      receivedAt: '2026-09-02T12:00:00.000Z',
      source: 'content',
      summary: 'Own fixture',
      issueId: 'BETA-0001',
    },
  ];
  const html = renderWeeklyReport(summarizeWeek(study, '2026-09-01', '2026-09-08', now));
  assert.ok(html.includes('SYNTHETISCHE TESTDATEN'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(!html.includes(study.participants[0].id));
});

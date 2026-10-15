import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { config } from './monitor.mjs';
import { actualReleaseProblems } from '../storefront/check.mjs';
import { betaCompletionProblems } from '../beta/study.mjs';
import { publicOrigin } from '../storefront/model.mjs';
import { configuredAuth } from '../../apps/mobile/src/auth/config.ts';
import { catalogue as plan } from '../../packages/content/src/authoring.ts';
const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const approvalKeys = [
  'authProvidersAndRevocation',
  'settingsCrossDevice',
  'nativeOta',
  'pushDelivery',
  'tutorLiveCalibration',
  'billingAndCancellation',
  'backupRestore',
  'monitoringDrill',
  'nativeCrashMonitoring',
  'support',
  'rollbackDrill',
];
export function validateReleaseConfig(input) {
  if (
    input?.version !== 1 ||
    Object.keys(input.approvals ?? {})
      .sort()
      .join() !== [...approvalKeys].sort().join()
  )
    throw Error('Release configuration');
  if (
    input.productionSupabaseOrigin !== null &&
    publicOrigin(input.productionSupabaseOrigin) !== input.productionSupabaseOrigin
  )
    throw Error('Production origin');
  if (
    input.productionEasProjectId !== null &&
    !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(input.productionEasProjectId)
  )
    throw Error('Production EAS project');
  if (
    input.dailyTutorBudgetNanoUsd !== null &&
    (typeof input.dailyTutorBudgetNanoUsd !== 'string' ||
      !/^\d+$/.test(input.dailyTutorBudgetNanoUsd) ||
      BigInt(input.dailyTutorBudgetNanoUsd) <= 0n)
  )
    throw Error('Release budget');
  for (const item of Object.values(input.approvals))
    if (
      typeof item.approved !== 'boolean' ||
      (item.approved &&
        (typeof item.evidenceReference !== 'string' || !item.evidenceReference.trim()))
    )
      throw Error('Release approval requires evidence');
}
export function releaseProblems(
  input,
  {
    store = ['not evaluated'],
    beta = ['not evaluated'],
    tutor = ['not evaluated'],
    runtime = ['not evaluated'],
    contentComplete = false,
  } = {},
) {
  validateReleaseConfig(input);
  const missing = [];
  for (const key of [
    'productionSupabaseOrigin',
    'productionEasProjectId',
    'dailyTutorBudgetNanoUsd',
    'owner',
  ])
    if (!input[key]) missing.push(key);
  for (const key of approvalKeys)
    if (!input.approvals[key].approved || !input.approvals[key].evidenceReference?.trim())
      missing.push('approvals.' + key);
  for (const [group, fields] of Object.entries({ store, beta, tutor, runtime }))
    for (const field of fields) missing.push(group + '.' + field);
  if (!contentComplete) missing.push('complete published stages 1 and 2');
  return missing;
}
export async function actualProblems({ study = null, tutorEvaluation = null, media = null } = {}) {
  const catalogue = read('../../packages/content/src/published.json');
  const contentComplete = [
    'units',
    'skills',
    'lessons',
    'knowledgeCards',
    'knowledgeArticles',
  ].every((key) => catalogue[key]?.length > 0 && catalogue[key].length === plan[key]?.length);
  const runtime = [];
  if (process.env.APP_VARIANT !== 'production') runtime.push('production variant');
  const auth = configuredAuth();
  if (!auth || auth.url !== config.productionSupabaseOrigin)
    runtime.push('bound production Supabase');
  if (process.env.EAS_PROJECT_ID !== config.productionEasProjectId)
    runtime.push('bound production EAS');
  if (
    process.env.EXPO_PUBLIC_AUTH_APPLE_ENABLED !== 'true' ||
    process.env.EXPO_PUBLIC_AUTH_GOOGLE_ENABLED !== 'true'
  )
    runtime.push('configured Apple and Google sign-in');
  if (process.env.EXPO_PUBLIC_LEGAL_RELEASE_APPROVED !== 'true')
    runtime.push('approved legal bindings');
  const tutor = [];
  if (
    !tutorEvaluation ||
    tutorEvaluation.simulation !== false ||
    tutorEvaluation.releaseEligible !== true ||
    tutorEvaluation.lane !== 'published' ||
    !Number.isInteger(tutorEvaluation.total) ||
    tutorEvaluation.total < 735 ||
    !Number.isFinite(tutorEvaluation.factualPercent) ||
    tutorEvaluation.factualPercent < 98 ||
    tutorEvaluation.completed !== tutorEvaluation.total ||
    tutorEvaluation.reviewed !== tutorEvaluation.total ||
    tutorEvaluation.catalogueApproved !== tutorEvaluation.total
  )
    tutor.push('current real accepted calibration');
  else {
    const { runtimeHash } = await import('../tutor-benchmark.mjs');
    if (tutorEvaluation.runtimeHash !== (await runtimeHash()))
      tutor.push('current runtime/prompt hash');
  }
  return releaseProblems(config, {
    store: actualReleaseProblems('store', media),
    beta: study ? betaCompletionProblems(study) : ['completed real beta journal'],
    tutor,
    runtime,
    contentComplete,
  });
}
export function verifyGitHubRelease(pr, commit, checks) {
  const required = [
    'Lint, Typen, Tests',
    'Tutor-Batchmechanik ohne Modellkosten',
    'Web-Build der App',
    'Deno-Kompatibilität',
    'Supabase und Profil-Zugriffsschutz',
  ];
  if (
    pr?.baseRefName !== 'main' ||
    pr.state !== 'MERGED' ||
    pr.isDraft ||
    pr.reviewDecision !== 'APPROVED' ||
    pr.mergeCommit?.oid !== commit
  )
    throw Error('Reviewed main release PR required');
  const runs = checks?.check_runs;
  if (!Array.isArray(runs)) throw Error('Commit CI evidence missing');
  for (const name of required) {
    const latest = runs.filter((run) => run.name === name).sort((a, b) => b.id - a.id)[0];
    if (!latest || latest.status !== 'completed' || latest.conclusion !== 'success')
      throw Error('Required commit check not successful: ' + name);
  }
}
export async function releaseMain(args) {
  const value = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : null);
  const json = (flag) => (value(flag) ? JSON.parse(readFileSync(value(flag), 'utf8')) : null);
  const missing = await actualProblems({
    study: json('--study'),
    tutorEvaluation: json('--tutor-evaluation'),
    media: json('--media'),
  });
  if (!args.includes('--start')) {
    if (args.includes('--json')) {
      console.log(
        JSON.stringify(
          {
            version: 1,
            prerequisitesComplete: missing.length === 0,
            prAndCiChecked: false,
            openPrerequisites: missing,
          },
          null,
          2,
        ),
      );
      return;
    }
    console.log(
      `P2 release preparation checked: ${missing.length} open prerequisites; no beta, publication or launch approval inferred.`,
    );
    return;
  }
  if (missing.length) throw Error('P2 release blocked: ' + missing.join(', '));
  const git = (...params) =>
    execFileSync('git', params, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  if (git('branch', '--show-current') !== 'main' || git('status', '--porcelain'))
    throw Error('Reviewed clean main required');
  const prNumber = value('--pr');
  if (!/^\d+$/.test(prNumber ?? '')) throw Error('Merged PR number required');
  const commit = git('rev-parse', 'HEAD');
  const gh = (params) =>
    JSON.parse(execFileSync('gh', params, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  const pr = gh([
    'pr',
    'view',
    prNumber,
    '--repo',
    'PhiFa96/harmonia',
    '--json',
    'baseRefName,state,isDraft,reviewDecision,mergeCommit',
  ]);
  const checks = gh([
    'api',
    'repos/PhiFa96/harmonia/commits/' + commit + '/check-runs?per_page=100',
  ]);
  verifyGitHubRelease(pr, commit, checks);
  console.log(
    'Release prerequisite and PR/CI evidence checked. Deployment remains an explicit separate operation.',
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  releaseMain(process.argv.slice(2)).catch((error) => {
    console.error(
      error.message.startsWith('P2 release blocked:')
        ? error.message
        : 'P2 release check failed; verify prerequisites, input files and GitHub access.',
    );
    process.exitCode = 1;
  });

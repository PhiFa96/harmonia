import { aiActReleaseProblems } from '../ai-act/model.mjs';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { legalReleaseMissing } from '../../apps/mobile/src/legal/readiness.ts';
import { legalConfig } from '../../apps/mobile/src/legal/config.ts';
import { configuredAuth } from '../../apps/mobile/src/auth/config.ts';
import { missingDeviceEvidence } from '../qa/release.mjs';
import { validateConfig as validateWebsite, publicOrigin } from '../storefront/model.mjs';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
export const readiness = read('./readiness.json');
export const platforms = ['ios', 'android', 'web'];
const approvals = [
  'participantNotice',
  'feedbackPrivacyAndRetention',
  'backendAuthAndSmtp',
  'providerSandboxAndTutor',
  'privacyOperations',
  'weeklyTriageAndSupport',
  'rollbackDrill',
];
export const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const approved = (value) => value?.approved === true && hasText(value.evidenceReference);
export function validateReadiness(config) {
  if (
    config?.version !== 1 ||
    typeof config.campaignId !== 'string' ||
    !/^[a-z0-9-]{1,64}$/.test(config.campaignId)
  )
    throw Error('Invalid beta campaign');
  if (
    Object.keys(config).sort().join() !==
    ['version', 'campaignId', 'coordinator', 'feedbackEmail', 'bindings', 'approvals', 'channels']
      .sort()
      .join()
  )
    throw Error('Invalid beta readiness fields');
  if (
    Object.keys(config.bindings ?? {})
      .sort()
      .join() !== 'easProjectId,supabaseOrigin'
  )
    throw Error('Invalid beta bindings');
  if (
    config.bindings.supabaseOrigin !== null &&
    publicOrigin(config.bindings.supabaseOrigin) !== config.bindings.supabaseOrigin
  )
    throw Error('Canonical beta Supabase origin required');
  if (
    config.bindings.easProjectId !== null &&
    (typeof config.bindings.easProjectId !== 'string' ||
      !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(config.bindings.easProjectId))
  )
    throw Error('Invalid beta EAS project');
  for (const value of [config.coordinator, config.feedbackEmail])
    if (value !== null && !hasText(value)) throw Error('Invalid beta contact');
  if (config.feedbackEmail && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(config.feedbackEmail))
    throw Error('Invalid beta feedback email');
  for (const [section, keys] of [
    ['approvals', approvals],
    ['channels', platforms],
  ]) {
    if (
      Object.keys(config[section] ?? {})
        .sort()
        .join() !== [...keys].sort().join()
    )
      throw Error('Invalid beta approval fields: ' + section);
    for (const key of keys) {
      const item = config[section][key];
      if (
        typeof item?.approved !== 'boolean' ||
        (item.evidenceReference !== null && !hasText(item.evidenceReference)) ||
        (item.approved && !approved(item))
      )
        throw Error('Beta approval requires a reference: ' + key);
    }
  }
}
export function betaStartProblems(config, platform, evidence = {}) {
  validateReadiness(config);
  if (!platforms.includes(platform)) throw Error('Choose ios, android or web');
  const missing = [];
  for (const key of ['coordinator', 'feedbackEmail']) if (!hasText(config[key])) missing.push(key);
  if (!config.bindings.supabaseOrigin) missing.push('bindings.supabaseOrigin');
  if (platform !== 'web' && !config.bindings.easProjectId) missing.push('bindings.easProjectId');
  for (const key of approvals)
    if (!approved(config.approvals[key])) missing.push('approvals.' + key);
  if (!approved(config.channels[platform])) missing.push('channels.' + platform);
  for (const group of ['legal', 'device', 'website', 'runtime'])
    for (const field of evidence[group] ?? ['not evaluated']) missing.push(group + '.' + field);
  if (!Number.isInteger(evidence.publishedLessons) || evidence.publishedLessons < 1)
    missing.push('content.publishedLessons');
  return missing;
}
export function runtimeProblems({ native = false, betaBuild = false, config = readiness } = {}) {
  const missing = [];
  if (process.env.APP_VARIANT !== 'production') missing.push('APP_VARIANT.production');
  const auth = configuredAuth();
  if (!auth || !auth.url.startsWith('https://')) missing.push('remoteAuth');
  if (auth && auth.url !== config.bindings.supabaseOrigin) missing.push('boundBetaSupabaseProject');
  if (
    process.env.EXPO_PUBLIC_LEGAL_RELEASE_APPROVED !== 'true' ||
    !Object.values(legalConfig()).every(Boolean)
  )
    missing.push('approvedLegalBindings');
  if (native) {
    if (!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(process.env.EAS_PROJECT_ID ?? ''))
      missing.push('EAS_PROJECT_ID');
    if (betaBuild && process.env.EAS_BUILD_PROFILE !== 'beta')
      missing.push('EAS_BUILD_PROFILE.beta');
    if (process.env.EAS_PROJECT_ID !== config.bindings.easProjectId)
      missing.push('boundBetaEasProject');
  }
  return missing;
}
export function actualBetaProblems(
  platform,
  { native = platform !== 'web', betaBuild = false } = {},
) {
  const website = read('../../website/readiness.json');
  validateWebsite(website);
  const websiteMissing = [];
  for (const key of ['publicOrigin', 'supportEmail'])
    if (!hasText(website[key])) websiteMissing.push(key);
  for (const key of ['brand', 'domain', ...(native ? ['currentStoreRequirements'] : [])])
    if (!approved(website.approvals[key])) websiteMissing.push('approvals.' + key);
  return betaStartProblems(readiness, platform, {
    legal: [
      ...legalReleaseMissing(read('../../apps/mobile/legal-readiness.json')),
      ...aiActReleaseProblems().map((p) => 'aiAct.' + p),
    ],
    device: missingDeviceEvidence(read('../qa/device-readiness.json')),
    website: websiteMissing,
    runtime: runtimeProblems({ native, betaBuild }),
    publishedLessons: read('../../packages/content/src/published.json').lessons.length,
  });
}
export function assertBetaReady(platform, options) {
  const missing = actualBetaProblems(platform, options);
  if (missing.length) throw Error('Beta start blocked: ' + missing.join(', '));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    validateReadiness(readiness);
    const index = process.argv.indexOf('--platform');
    if (process.argv.includes('--start')) assertBetaReady(process.argv[index + 1]);
    else {
      for (const platform of platforms)
        console.log(`${platform}: ${actualBetaProblems(platform).length} open beta prerequisites.`);
      console.log('Preparation checked; no tester, approval or deployment inferred.');
    }
  } catch (error) {
    console.error(
      error.message.startsWith('Beta start blocked:')
        ? error.message
        : 'Beta check failed; validate prerequisite fields and public runtime bindings.',
    );
    process.exitCode = 1;
  }
}

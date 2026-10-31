import { readFileSync, readdirSync, realpathSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { z } from 'zod';
export const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const SCOPES = ['general', 'school', 'certificates'];
const requiredIds = [
  'tutor',
  'learner-planner',
  'satb-feedback',
  'adaptive-path',
  'voice-training',
  'history-fiction',
  'school-assessment',
  'certificates',
  'ai-live-call',
  'advanced-analysis',
];
const controlIds = [
  'classification',
  'roles',
  'transparency',
  'literacy',
  'oversight',
  'data-protection',
  'high-risk-controls',
  'monitoring',
];
const excluded = [
  'emotion-inference-in-education',
  'sensitive-biometric-categorisation',
  'automated-institutional-admission',
  'exam-proctoring',
];
const text = z.string().trim().min(1).max(4000),
  ref = text.nullable(),
  id = z.string().regex(/^[a-z][a-z0-9-]*$/),
  tri = z.enum(['yes', 'no', 'unreviewed']);
const translated = z.object({ de: text, 'en-US': text, 'en-GB': text }).strict();
const repoPath = z
  .string()
  .regex(/^[a-zA-Z0-9_./-]+$/)
  .refine((p) => !p.startsWith('/') && !p.split('/').includes('..'));
const assessment = z
  .object({
    aiSystem: tri,
    annexIII: tri,
    profiling: tri,
    outcome: z.enum([
      'unreviewed',
      'outside-ai-definition',
      'not-high-risk',
      'annex-iii-exemption',
      'high-risk',
    ]),
  })
  .strict();
const review = z
  .object({
    status: z.enum(['pending', 'approved']),
    dataKind: z.enum(['draft', 'synthetic', 'real']),
    reviewer: ref,
    evidenceReference: ref,
    reviewedAt: z.iso.datetime({ offset: true }).nullable(),
    validUntil: z.iso.datetime({ offset: true }).nullable(),
    snapshotHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
  })
  .strict();
const schema = z
  .object({
    version: z.literal(1),
    sourcesObservedAt: z.iso.date(),
    legalBaseline: text,
    excludedPurposes: z.array(id),
    sources: z
      .array(
        z
          .object({
            id,
            url: z.url().refine((u) => {
              const x = new URL(u);
              return (
                x.protocol === 'https:' &&
                [
                  'eur-lex.europa.eu',
                  'digital-strategy.ec.europa.eu',
                  'ai-act-service-desk.ec.europa.eu',
                ].includes(x.hostname) &&
                !x.username &&
                !x.password
              );
            }),
            retrieval: z.enum(['retrieved', 'blocked']),
            note: translated,
          })
          .strict(),
      )
      .min(8),
    components: z.array(
      z
        .object({
          id,
          title: translated,
          technology: z.enum([
            'llm',
            'hybrid',
            'statistical-rules',
            'signal-processing',
            'static-content',
            'rules',
            'planned',
          ]),
          deployment: z.enum(['implemented', 'internal-draft', 'planned']),
          scopes: z.array(z.enum(SCOPES)).min(1),
          files: z.array(repoPath).min(1),
          purpose: translated,
          concern: translated,
          assessment,
        })
        .strict(),
    ),
    controls: z.array(
      z
        .object({
          id,
          title: translated,
          owner: text,
          waivable: z.boolean(),
          status: z.enum(['open', 'verified', 'not-applicable']),
          evidenceReference: ref,
          rationale: ref,
        })
        .strict(),
    ),
    reviews: z.object({ general: review, school: review, certificates: review }).strict(),
  })
  .strict();
const sha = (v) => createHash('sha256').update(v).digest('hex');
function canonical(v) {
  return Array.isArray(v)
    ? v.map(canonical)
    : v && typeof v === 'object'
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, canonical(v[k])]),
        )
      : v;
}
export function validateInventory(input) {
  const data = schema.parse(input);
  for (const rows of [data.components, data.controls, data.sources])
    if (new Set(rows.map((r) => r.id)).size !== rows.length)
      throw Error('Duplicate AI inventory ID');
  if (
    requiredIds.some((id) => !data.components.some((c) => c.id === id)) ||
    controlIds.some((id) => !data.controls.some((c) => c.id === id)) ||
    data.controls.length !== controlIds.length
  )
    throw Error('Missing AI inventory coverage');
  if ([...data.excludedPurposes].sort().join() !== [...excluded].sort().join())
    throw Error('AI purpose boundaries changed');
  for (const c of data.controls)
    if (c.waivable !== (c.id === 'high-risk-controls')) throw Error('Invalid AI control waiver');
  return data;
}
export function readInventory() {
  return validateInventory(
    JSON.parse(readFileSync(new URL('./inventory.json', import.meta.url), 'utf8')),
  );
}
// Collect complete runtime directories so a newly added module also invalidates reviews.
const roots = [
  'supabase/functions/tutor',
  'supabase/functions/_shared',
  'apps/mobile/src/tutor',
  'apps/mobile/src/microphone',
  'apps/mobile/src/choir',
  'apps/mobile/src/placement',
  'apps/mobile/src/legal',
  'apps/mobile/src/preview',
  'packages/exercises/src',
  'packages/content/src',
  'packages/i18n/src',
  'packages/theory/src',
  'packages/notation/src',
  'packages/audio/src',
  'tools/certificates',
  'tools/school',
  'tools/ai-act',
];
function safeFile(path) {
  const absolute = realpathSync(resolve(ROOT, path));
  if (relative(ROOT, absolute).startsWith('..')) throw Error('AI evidence outside repository');
  return absolute;
}
export function runtimeDigests(data) {
  const paths = new Set(data.components.flatMap((c) => c.files));
  function walk(dir) {
    for (const d of readdirSync(resolve(ROOT, dir), { withFileTypes: true })) {
      const p = dir + '/' + d.name;
      if (d.isSymbolicLink()) throw Error('AI runtime symlink requires review');
      if (d.isDirectory()) walk(p);
      else if (
        /\.(ts|tsx|mjs|json|sql)$/.test(p) &&
        !/(?:\.test\.|\.spec\.|-fixture\.|inventory\.json$)/.test(p)
      )
        paths.add(p);
    }
  }
  for (const dir of roots) walk(dir);
  for (const p of [
    'apps/mobile/src/components/tutor-screen.tsx',
    'packages/i18n/src/ai-act-review.ts',
    'tools/check-legal-release.mjs',
    'tools/storefront/check.mjs',
    'tools/beta/readiness.mjs',
    'tools/release/check.mjs',
  ])
    paths.add(p);
  return Object.fromEntries([...paths].sort().map((p) => [p, sha(readFileSync(safeFile(p)))]));
}
export function snapshotHash(input, digests = runtimeDigests(input)) {
  const bound = Object.fromEntries(
    Object.entries(validateInventory(input)).filter(([key]) => key !== 'reviews'),
  );
  return sha(JSON.stringify(canonical({ inventory: bound, files: digests })));
}
function activeComponents(data, scope) {
  return data.components.filter(
    (c) =>
      c.scopes.includes(scope) &&
      (c.deployment !== 'planned' || (c.id === 'certificates' && scope === 'certificates')),
  );
}
export function releaseProblems(input, scope, hash, { now = Date.now() } = {}) {
  if (!SCOPES.includes(scope) || !Number.isFinite(now))
    throw Error('Invalid AI review scope or clock');
  const data = validateInventory(input),
    problems = [],
    r = data.reviews[scope];
  const observed = Date.parse(data.sourcesObservedAt + 'T00:00:00Z');
  if (observed > now || now - observed > 90 * 86400000) problems.push('sources.refresh-required');
  if (data.sources.some((s) => s.retrieval !== 'retrieved'))
    problems.push('sources.direct-legal-text-review');
  if (r.status !== 'approved' || r.dataKind !== 'real')
    problems.push('review.real-written-assessment');
  if (!r.reviewer || !r.evidenceReference) problems.push('review.reviewer-and-reference');
  if (
    !r.reviewedAt ||
    !r.validUntil ||
    Date.parse(r.reviewedAt) > now ||
    Date.parse(r.validUntil) <= now ||
    Date.parse(r.validUntil) <= Date.parse(r.reviewedAt)
  )
    problems.push('review.validity');
  if (r.snapshotHash !== hash) problems.push('review.current-snapshot');
  for (const c of activeComponents(data, scope)) {
    const a = c.assessment;
    if (Object.values(a).includes('unreviewed')) problems.push(c.id + '.classification');
    if (
      (a.outcome === 'outside-ai-definition' && a.aiSystem !== 'no') ||
      (a.outcome !== 'outside-ai-definition' && a.outcome !== 'unreviewed' && a.aiSystem !== 'yes')
    )
      problems.push(c.id + '.ai-definition');
    if (a.outcome === 'not-high-risk' && a.annexIII !== 'no') problems.push(c.id + '.annex-iii');
    if (a.outcome === 'annex-iii-exemption' && (a.annexIII !== 'yes' || a.profiling !== 'no'))
      problems.push(c.id + '.exemption-not-supported');
    if (a.outcome === 'high-risk' && a.annexIII !== 'yes') problems.push(c.id + '.high-risk-basis');
  }
  const highRisk = activeComponents(data, scope).some((c) => c.assessment.outcome === 'high-risk');
  for (const c of data.controls) {
    const verified = c.status === 'verified' && Boolean(c.evidenceReference);
    const waived =
      c.waivable &&
      !highRisk &&
      c.status === 'not-applicable' &&
      Boolean(c.rationale) &&
      Boolean(c.evidenceReference);
    if (!verified && !waived) problems.push('controls.' + c.id);
  }
  return problems;
}
export function inspectInventory(
  input = readInventory(),
  { digests = runtimeDigests(input), now = Date.now() } = {},
) {
  const data = validateInventory(input),
    hash = snapshotHash(data, digests);
  return {
    version: 1,
    legalApprovalInferred: false,
    snapshotHash: hash,
    fileDigests: digests,
    sourceCount: data.sources.length,
    componentCount: data.components.length,
    scopes: Object.fromEntries(
      SCOPES.map((s) => {
        const missing = releaseProblems(data, s, hash, { now });
        return [s, { readinessComplete: missing.length === 0, missing }];
      }),
    ),
  };
}
export function aiActReleaseProblems(scope = 'general') {
  try {
    return inspectInventory().scopes[scope]?.missing ?? ['inventory.unknown-scope'];
  } catch {
    return ['inventory.invalid-or-missing-evidence'];
  }
}

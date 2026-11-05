import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import {
  SCOPES,
  assessmentSchema,
  reviewSchema,
  validateInventory,
  readInventory,
  snapshotHash,
  runtimeDigests,
  inspectInventory,
} from './model.mjs';
import { reviewDocuments } from './evidence.mjs';
import { reviewHtml } from './report.mjs';
import { writePrivate } from './private-files.mjs';

const note = z.string().trim().min(1).max(4000).nullable();
const formSchema = z
  .object({
    version: z.literal(1),
    scope: z.enum(SCOPES),
    baseSnapshotHash: z.string().regex(/^[a-f0-9]{64}$/),
    review: reviewSchema,
    components: z.array(
      z
        .object({
          id: z.string(),
          assessment: assessmentSchema,
          rationale: note,
          evidenceReference: note,
        })
        .strict(),
    ),
    controls: z.array(
      z
        .object({
          id: z.string(),
          status: z.enum(['open', 'verified', 'not-applicable']),
          evidenceReference: note,
          rationale: note,
        })
        .strict(),
    ),
    sources: z.array(
      z
        .object({
          id: z.string(),
          retrieval: z.enum(['retrieved', 'blocked']),
          evidenceReference: note,
        })
        .strict(),
    ),
  })
  .strict();

/** Blank, scoped worksheet; generation does not approve a source, control or classification. */
export function assessmentTemplate(input, scope, { digests = runtimeDigests(input) } = {}) {
  if (!SCOPES.includes(scope)) throw Error('Unknown AI assessment scope');
  const data = validateInventory(input);
  return {
    version: 1,
    scope,
    baseSnapshotHash: snapshotHash(data, digests),
    review: structuredClone(data.reviews[scope]),
    components: data.components
      .filter((c) => c.scopes.includes(scope))
      .map((c) => ({
        id: c.id,
        assessment: c.assessment,
        rationale: null,
        evidenceReference: null,
      })),
    controls: data.controls.map(({ id, status, evidenceReference, rationale }) => ({
      id,
      status,
      evidenceReference,
      rationale,
    })),
    sources: data.sources.map(({ id, retrieval }) => ({ id, retrieval, evidenceReference: null })),
  };
}

function sameIds(rows, expected) {
  if (
    rows.length !== expected.length ||
    new Set(rows.map((r) => r.id)).size !== rows.length ||
    rows
      .map((r) => r.id)
      .sort()
      .join() !==
      expected
        .map((r) => r.id)
        .sort()
        .join()
  )
    throw Error('Incomplete or duplicate AI assessment coverage');
}

/** Preview a proposed legal-review record. No inventory, release flag or external system is changed. */
export function inspectAssessment(
  input,
  form,
  { digests = runtimeDigests(input), now = Date.now(), documentOptions } = {},
) {
  const data = validateInventory(input),
    parsed = formSchema.parse(form);
  if (parsed.baseSnapshotHash !== snapshotHash(data, digests))
    throw Error('Outdated AI assessment worksheet');
  const components = data.components.filter((c) => c.scopes.includes(parsed.scope));
  sameIds(parsed.components, components);
  sameIds(parsed.controls, data.controls);
  sameIds(parsed.sources, data.sources);
  const preparationProblems = [];
  for (const row of parsed.components) {
    data.components.find((c) => c.id === row.id).assessment = row.assessment;
    if (row.assessment.outcome !== 'unreviewed' && (!row.rationale || !row.evidenceReference))
      preparationProblems.push('components.' + row.id + '.reason-and-evidence');
  }
  for (const row of parsed.controls)
    Object.assign(
      data.controls.find((c) => c.id === row.id),
      row,
    );
  for (const row of parsed.sources) {
    data.sources.find((s) => s.id === row.id).retrieval = row.retrieval;
    if (row.retrieval === 'retrieved' && !row.evidenceReference)
      preparationProblems.push('sources.' + row.id + '.evidence');
  }
  data.reviews[parsed.scope] = parsed.review;
  const documents = reviewDocuments(data, documentOptions);
  const inspection = inspectInventory(data, { digests, now, documents });
  return {
    version: 1,
    scope: parsed.scope,
    legalApprovalInferred: false,
    baseSnapshotHash: parsed.baseSnapshotHash,
    projectedSnapshotHash: inspection.snapshotHash,
    preparationProblems,
    missing: inspection.scopes[parsed.scope].missing,
    inventory: data,
    inspection,
    worksheet: parsed,
  };
}

export function writeHandoff(input, scope, options = {}) {
  const template = assessmentTemplate(input, scope, options),
    inspection = inspectInventory(input, options),
    directory = 'artifacts/ai-act/handoff/' + template.baseSnapshotHash + '/' + scope;
  writePrivate(
    directory,
    'snapshot.json',
    JSON.stringify({ inventory: input, ...inspection }, null, 2) + '\n',
    options,
  );
  // A repeated export of the same snapshot preserves human annotations.
  const path = writePrivate(
    directory,
    'assessment.json',
    JSON.stringify(template, null, 2) + '\n',
    { ...options, overwrite: false },
  );
  for (const locale of ['de', 'en-US', 'en-GB'])
    writePrivate(directory, locale + '.html', reviewHtml(input, inspection, locale), options);
  return { scope, path, snapshotHash: template.baseSnapshotHash };
}

export function handoffMain(args) {
  let scope,
    inspectFile,
    write = false;
  const flags = new Set();
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flags.has(flag) || !['--scope', '--inspect', '--write'].includes(flag))
      throw Error('Invalid AI handoff argument');
    flags.add(flag);
    if (flag === '--scope') {
      scope = args[++i];
      if (!SCOPES.includes(scope)) throw Error('Invalid AI handoff scope');
    }
    if (flag === '--inspect') {
      inspectFile = args[++i];
      if (!inspectFile) throw Error('Missing worksheet');
    }
    if (flag === '--write') write = true;
  }
  const data = readInventory();
  if (!inspectFile) {
    if (write) throw Error('Write requires an inspected worksheet');
    for (const s of scope ? [scope] : SCOPES) console.log(JSON.stringify(writeHandoff(data, s)));
  } else {
    const raw = readFileSync(inspectFile, 'utf8');
    if (Buffer.byteLength(raw) > 1024 * 1024) throw Error('AI worksheet is too large');
    const result = inspectAssessment(data, JSON.parse(raw));
    if (scope && result.scope !== scope) throw Error('AI worksheet scope mismatch');
    if (write) {
      const directory =
        'artifacts/ai-act/proposals/' + result.projectedSnapshotHash + '/' + result.scope;
      writePrivate(
        directory,
        'inventory-proposal.json',
        JSON.stringify(result.inventory, null, 2) + '\n',
      );
      writePrivate(directory, 'assessment.json', JSON.stringify(result.worksheet, null, 2) + '\n');
      for (const locale of ['de', 'en-US', 'en-GB'])
        writePrivate(
          directory,
          locale + '.html',
          reviewHtml(result.inventory, result.inspection, locale),
        );
    }
    console.log(
      JSON.stringify({
        scope: result.scope,
        legalApprovalInferred: false,
        baseSnapshotHash: result.baseSnapshotHash,
        projectedSnapshotHash: result.projectedSnapshotHash,
        preparationProblems: result.preparationProblems,
        missing: result.missing,
      }),
    );
  }
  return 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = handoffMain(process.argv.slice(2));
  } catch {
    console.error(
      'AI review handoff rejected; check scope, worksheet, snapshot and private evidence.',
    );
    process.exitCode = 1;
  }
}

import {
  LOCALES,
  CRITERIA,
  catalogueReviewSchema,
  gradesSchema,
  reportInputSchema,
} from './schema.ts';
import type {
  BenchmarkCatalogue,
  Preparation,
  BenchmarkOutcome,
  CatalogueReview,
  AnswerGrades,
  ReportInput,
  Budget,
  BenchmarkConfig,
} from './schema.ts';
import { fingerprint, canonical } from './hash.ts';
import { automaticChecks } from './replay.ts';
import { verifiedBinding } from './binding.ts';

export function percentile(values: number[], fraction: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)] ?? null;
}
export async function catalogueApprovals(
  catalogue: BenchmarkCatalogue,
  review: CatalogueReview | null,
) {
  const result = new Set<string>();
  if (!review) return result;
  catalogueReviewSchema.parse(review);
  if (review.catalogueHash !== (await fingerprint(catalogue)))
    throw Error('Katalogreview ist veraltet');
  const seen = new Set<string>();
  for (const row of review.reviews) {
    const c = catalogue.cases.find((c) => c.id === row.caseId),
      id = row.caseId + '/' + row.locale;
    if (
      !c ||
      seen.has(id) ||
      row.caseHash !== (await fingerprint(c)) ||
      new Set(row.methods).size < 2
    )
      throw Error('Ungültiger Katalogreview: ' + id);
    seen.add(id);
    if (row.approved) result.add(id);
  }
  return result;
}
export interface Cell {
  caseId: string;
  locale: (typeof LOCALES)[number];
  variant: string;
  role: string;
  episodeId: string;
  status: 'missing' | 'failed' | 'needs-review' | 'reviewed';
  factualPassed: boolean;
  accepted: boolean;
  catalogueApproved: boolean;
  verdicts: Record<(typeof CRITERIA)[number], boolean> | null;
  checks: BenchmarkOutcome['checks'] | null;
  batchCostNanoUsd: number | null;
  projectedStreamCostNanoUsd: number | null;
  estimated: boolean;
}
export interface Summary {
  schemaVersion: 1;
  simulation: boolean;
  catalogueHash: string;
  configHash: string;
  runtimeHash: string;
  runHash: string;
  receiptsHash: string;
  configuration: BenchmarkConfig | null;
  lane: 'preview' | 'published';
  sourceMode: 'postgres' | 'supplied';
  total: number;
  completed: number;
  reviewed: number;
  catalogueApproved: number;
  factualCorrect: number;
  factualPercent: number;
  accepted: number;
  acceptancePercent: number;
  releaseEligible: boolean;
  blockedReasons: string[];
  regressions: string[];
  groups: Record<
    string,
    { total: number; reviewed: number; factualPercent: number; acceptancePercent: number }
  >;
  cells: Cell[];
  metrics: {
    batchCostNanoUsd: number;
    projectedStreamCostNanoUsd: number;
    estimated: boolean;
    costPerAcceptedAnswerNanoUsd: number | null;
    batchCostPerAcceptedAnswerNanoUsd: number | null;
    p50ProjectedCostNanoUsd: number | null;
    p95ProjectedCostNanoUsd: number | null;
    rounds: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    inputTokens: number;
    outputTokens: number;
  };
  candidates: {
    role: string;
    variant: string;
    qualityEligible: boolean;
    total: number;
    acceptancePercent: number;
    p95ProjectedCostNanoUsd: number | null;
  }[];
  selection: null | {
    roleVariants: Record<string, string>;
    total: number;
    factualPercent: number;
    acceptancePercent: number;
    costPerAcceptedAnswerNanoUsd: number;
    p95ProjectedCostNanoUsd: number;
  };
  recommendation: null | {
    roleVariants: Record<string, string>;
    projectedP95NanoUsd: number;
    quotaSuggestion: null | {
      premiumDailyQuestions: number;
      maxDailyQuestions: number;
      basis: Budget;
    };
  };
}
export async function evaluateReport({
  catalogue,
  preparation,
  report,
  review = null,
  grades = null,
  baseline = null,
  budget = null,
  configuration = null,
}: {
  catalogue: BenchmarkCatalogue;
  preparation: Preparation;
  report: ReportInput;
  review?: CatalogueReview | null;
  grades?: AnswerGrades | null;
  baseline?: Summary | null;
  budget?: Budget | null;
  configuration?: BenchmarkConfig | null;
}): Promise<Summary> {
  reportInputSchema.parse(report);
  const runHash = await fingerprint(report);
  if (configuration && (await fingerprint(configuration)) !== report.configHash)
    throw Error('Konfiguration gehört zu einem anderen Lauf');
  if (
    report.catalogueHash !== (await fingerprint(catalogue)) ||
    report.preparationHash !== (await fingerprint(preparation)) ||
    report.configHash !== preparation.configHash ||
    report.runtimeHash !== preparation.runtimeHash
  )
    throw Error('Run-/Katalog-/Konfigurations-/Vorbereitungshash stimmt nicht');
  const approvals = await catalogueApprovals(catalogue, review),
    outcomes = new Map<string, BenchmarkOutcome>(),
    graded = new Map<string, AnswerGrades['grades'][number]>();
  const episodeIds = new Set(preparation.episodes.map((e) => e.id));
  if (episodeIds.size !== preparation.episodes.length) throw Error('Doppelte Episoden');
  const variants = new Set(preparation.episodes.map((e) => e.variant));
  const combinations = new Set(
    preparation.episodes.map((e) => e.caseId + '/' + e.locale + '/' + e.variant),
  );
  if (
    combinations.size !== preparation.episodes.length ||
    preparation.episodes.length !== catalogue.cases.length * LOCALES.length * variants.size
  )
    throw Error(
      'Unvollständiger Testlauf: jeder Fall muss in jeder Sprache und Variante enthalten sein',
    );
  for (const c of catalogue.cases)
    for (const locale of LOCALES)
      for (const variant of variants)
        if (!combinations.has(c.id + '/' + locale + '/' + variant))
          throw Error('Katalogfall fehlt im festen Nenner');
  for (const out of report.outcomes) {
    if (!episodeIds.has(out.episodeId) || outcomes.has(out.episodeId))
      throw Error('Unbekanntes/doppeltes Ergebnis');
    if (out.answerHash !== (await fingerprint([out.answer, out.tools, out.checks, out.rounds])))
      throw Error('Antwortbeleg wurde verändert');
    const episode = preparation.episodes.find((e) => e.id === out.episodeId),
      c = catalogue.cases.find((c) => c.id === episode?.caseId);
    if (
      !c ||
      canonical(out.checks) !==
        canonical(automaticChecks(c, out.answer, out.tools, episode?.knowledge))
    )
      throw Error('Automatische Prüfbelege stimmen nicht mit Antwort und Werkzeugen überein');
    outcomes.set(out.episodeId, out);
  }
  if (grades) {
    gradesSchema.parse(grades);
    if (grades.runHash !== runHash) throw Error('Antwortreview gehört zu einem anderen Lauf');
    for (const row of grades.grades) {
      const out = outcomes.get(row.episodeId);
      if (!out || graded.has(row.episodeId) || out.answerHash !== row.answerHash)
        throw Error('Unbekannter/doppelter/veralteter Antwortreview');
      graded.set(row.episodeId, row);
    }
  }
  const cells: Cell[] = preparation.episodes.map((e) => {
    const c = catalogue.cases.find((c) => c.id === e.caseId),
      out = outcomes.get(e.id),
      grade = graded.get(e.id);
    if (!c) throw Error('Fall fehlt');
    const factual = Boolean(
      grade?.verdicts.factual && out?.checks.completed && out.checks.noRuntimeError,
    );
    return {
      caseId: c.id,
      locale: e.locale,
      variant: e.variant,
      role: c.scope.mode,
      episodeId: e.id,
      status: !out
        ? 'missing'
        : !out.checks.completed
          ? 'failed'
          : !grade
            ? 'needs-review'
            : 'reviewed',
      factualPassed: factual,
      accepted:
        factual &&
        Boolean(grade && CRITERIA.every((k) => grade.verdicts[k])) &&
        Boolean(out && Object.values(out.checks).every(Boolean)),
      catalogueApproved: approvals.has(c.id + '/' + e.locale),
      verdicts: grade?.verdicts ?? null,
      checks: out?.checks ?? null,
      batchCostNanoUsd: out?.batchUsage.costNanoUsd ?? null,
      projectedStreamCostNanoUsd: out?.streamUsage.costNanoUsd ?? null,
      estimated: !out || out.batchUsage.estimated || out.streamUsage.estimated,
    };
  });
  const aggregate = (rows: Cell[]) => ({
    total: rows.length,
    reviewed: rows.filter((c) => c.verdicts !== null).length,
    factualPercent: rows.length
      ? (100 * rows.filter((c) => c.factualPassed).length) / rows.length
      : 0,
    acceptancePercent: rows.length
      ? (100 * rows.filter((c) => c.accepted).length) / rows.length
      : 0,
  });
  const groups: Summary['groups'] = {};
  for (const locale of LOCALES)
    groups['locale:' + locale] = aggregate(cells.filter((c) => c.locale === locale));
  for (const role of ['chat', 'explain', 'hint', 'solution'])
    groups['role:' + role] = aggregate(cells.filter((c) => c.role === role));
  for (const category of ['facts', 'task', 'library', 'trap', 'off-topic'])
    groups['category:' + category] = aggregate(
      cells.filter((c) => catalogue.cases.find((v) => v.id === c.caseId)?.category === category),
    );
  const blockedReasons: string[] = [];
  if (report.simulation) blockedReasons.push('simulation');
  if (configuration && !verifiedBinding(configuration))
    blockedReasons.push('binding-evidence-expired-or-unverified');
  if (report.lane !== 'published') blockedReasons.push('preview-content');
  if (report.sourceMode !== 'postgres') blockedReasons.push('retrieval-not-production');
  if (
    preparation.episodes.some(
      (e) =>
        e.knowledge.lane !== report.lane ||
        e.knowledge.chunks.some((c) => c.status !== 'freigegeben'),
    ) &&
    report.lane === 'published'
  )
    blockedReasons.push('draft-or-mismatched-sources');
  if (cells.some((c) => !c.catalogueApproved)) blockedReasons.push('catalogue-review-incomplete');
  if (cells.some((c) => c.verdicts === null)) blockedReasons.push('answer-review-incomplete');
  if (cells.some((c) => c.estimated)) blockedReasons.push('incomplete-cost-evidence');
  const aggregateAll = aggregate(cells);
  const regressions: string[] = [];
  if (
    baseline &&
    (baseline.simulation ||
      !baseline.releaseEligible ||
      !baseline.selection ||
      !Array.isArray(baseline.cells))
  )
    throw Error(
      'Basis muss eine vollständige freigegebene echte Rollenwahl desselben Katalogs sein',
    );
  const oldCells =
    baseline?.cells.filter((c) => baseline.selection?.roleVariants[c.role] === c.variant) ?? [];
  if (
    baseline &&
    (baseline.simulation ||
      !baseline.releaseEligible ||
      baseline.catalogueHash !== report.catalogueHash ||
      !baseline.selection ||
      oldCells.length !== catalogue.cases.length * LOCALES.length)
  )
    throw Error(
      'Basis muss eine vollständige freigegebene echte Rollenwahl desselben Katalogs sein',
    );
  if (baseline)
    for (const old of oldCells) {
      const matches = cells.filter((c) => c.caseId === old.caseId && c.locale === old.locale);
      if (!matches.length) throw Error('Basisfall fehlt im aktuellen Lauf');
      for (const row of matches)
        if (old.factualPassed && !row.factualPassed)
          regressions.push(row.caseId + '/' + row.locale + '/' + row.variant);
    }
  const values = report.outcomes.map((o) => o.streamUsage.costNanoUsd),
    accepted = cells.filter((c) => c.accepted).length;
  const sum = (field: 'batchUsage' | 'streamUsage') =>
    report.outcomes.reduce((n, o) => n + o[field].costNanoUsd, 0);
  const batchCost = sum('batchUsage'),
    streamCost = sum('streamUsage');
  const candidates: Summary['candidates'] = [];
  for (const role of ['chat', 'explain', 'hint', 'solution'])
    for (const variant of new Set(cells.map((c) => c.variant))) {
      const rows = cells.filter((c) => c.role === role && c.variant === variant),
        a = aggregate(rows);
      const quality =
        !report.simulation &&
        report.lane === 'published' &&
        report.sourceMode === 'postgres' &&
        rows.length > 0 &&
        rows.every((c) => c.verdicts !== null && c.catalogueApproved && !c.estimated) &&
        a.factualPercent >= 98 &&
        a.acceptancePercent >= 98 &&
        LOCALES.every((l) => aggregate(rows.filter((c) => c.locale === l)).factualPercent >= 98) &&
        rows.every((c) => c.verdicts?.sources && c.verdicts.hints) &&
        rows.every(
          (c) =>
            !oldCells.some(
              (old) =>
                old.caseId === c.caseId &&
                old.locale === c.locale &&
                old.factualPassed &&
                !c.factualPassed,
            ),
        );
      candidates.push({
        role,
        variant,
        qualityEligible: quality,
        total: rows.length,
        acceptancePercent: a.acceptancePercent,
        p95ProjectedCostNanoUsd: percentile(
          rows.flatMap((c) =>
            c.projectedStreamCostNanoUsd === null ? [] : [c.projectedStreamCostNanoUsd],
          ),
          0.95,
        ),
      });
    }
  let recommendation: Summary['recommendation'] = null;
  let selection: Summary['selection'] = null;
  if (!blockedReasons.length) {
    const roleVariants: Record<string, string> = {};
    for (const role of ['chat', 'explain', 'hint', 'solution']) {
      const best = candidates
        .filter((c) => c.role === role && c.qualityEligible && c.p95ProjectedCostNanoUsd !== null)
        .sort(
          (a, b) =>
            (a.p95ProjectedCostNanoUsd ?? Infinity) - (b.p95ProjectedCostNanoUsd ?? Infinity),
        )[0];
      if (best) roleVariants[role] = best.variant;
    }
    if (Object.keys(roleVariants).length === 4) {
      const selected = cells.filter((c) => roleVariants[c.role] === c.variant),
        p95 = percentile(
          selected.flatMap((c) =>
            c.projectedStreamCostNanoUsd === null ? [] : [c.projectedStreamCostNanoUsd],
          ),
          0.95,
        );
      if (p95 !== null && p95 > 0) {
        const selectedAggregate = aggregate(selected),
          selectedAccepted = selected.filter((c) => c.accepted).length;
        const perAccepted =
          selected.reduce((n, c) => n + (c.projectedStreamCostNanoUsd ?? 0), 0) / selectedAccepted;
        selection = {
          roleVariants,
          total: selected.length,
          factualPercent: selectedAggregate.factualPercent,
          acceptancePercent: selectedAggregate.acceptancePercent,
          costPerAcceptedAnswerNanoUsd: perAccepted,
          p95ProjectedCostNanoUsd: p95,
        };
        const guarded = Math.ceil(Math.max(p95, perAccepted) * (budget?.safetyMultiplier ?? 1));
        recommendation = {
          roleVariants,
          projectedP95NanoUsd: p95,
          quotaSuggestion: budget
            ? {
                premiumDailyQuestions: Math.min(
                  1000,
                  Math.floor(
                    budget.premiumMonthlyModelBudgetNanoUsd / budget.activeDaysPerMonth / guarded,
                  ),
                ),
                maxDailyQuestions: Math.min(
                  1000,
                  Math.floor(
                    budget.maxMonthlyModelBudgetNanoUsd / budget.activeDaysPerMonth / guarded,
                  ),
                ),
                basis: budget,
              }
            : null,
        };
      }
    }
  }
  if (!selection) {
    blockedReasons.push('no-qualifying-role-variant');
    if (aggregateAll.factualPercent < 98) blockedReasons.push('factual-below-98-percent');
    if (regressions.length) blockedReasons.push('factual-regression');
  }
  return {
    schemaVersion: 1,
    simulation: report.simulation,
    catalogueHash: report.catalogueHash,
    configHash: report.configHash,
    runtimeHash: report.runtimeHash,
    runHash,
    receiptsHash: report.receiptsHash,
    configuration,
    lane: report.lane,
    sourceMode: report.sourceMode,
    total: cells.length,
    completed: cells.filter((c) => c.checks?.completed).length,
    reviewed: aggregateAll.reviewed,
    catalogueApproved: cells.filter((c) => c.catalogueApproved).length,
    factualCorrect: cells.filter((c) => c.factualPassed).length,
    factualPercent: aggregateAll.factualPercent,
    accepted,
    acceptancePercent: aggregateAll.acceptancePercent,
    releaseEligible: blockedReasons.length === 0,
    blockedReasons,
    regressions,
    groups,
    cells,
    metrics: {
      batchCostNanoUsd: batchCost,
      projectedStreamCostNanoUsd: streamCost,
      estimated: cells.some((c) => c.estimated),
      costPerAcceptedAnswerNanoUsd: accepted ? streamCost / accepted : null,
      batchCostPerAcceptedAnswerNanoUsd: accepted ? batchCost / accepted : null,
      p50ProjectedCostNanoUsd: percentile(values, 0.5),
      p95ProjectedCostNanoUsd: percentile(values, 0.95),
      rounds: report.outcomes.reduce((n, o) => n + o.rounds, 0),
      cacheReadTokens: report.outcomes.reduce((n, o) => n + o.batchUsage.cacheReadTokens, 0),
      cacheWriteTokens: report.outcomes.reduce(
        (n, o) => n + o.batchUsage.cacheWrite5mTokens + o.batchUsage.cacheWrite1hTokens,
        0,
      ),
      inputTokens: report.outcomes.reduce((n, o) => n + o.batchUsage.inputTokens, 0),
      outputTokens: report.outcomes.reduce((n, o) => n + o.batchUsage.outputTokens, 0),
    },
    candidates,
    selection,
    recommendation,
  };
}

// Operator journal, deliberately independent of consent-based app analytics and account IDs.
import { testerId, validInstant } from './access.mjs';
import { hasText } from './readiness.mjs';
export const groups = ['beginner', 'choir', 'instrumental', 'student'];
export const metrics = [
  'activation',
  'retentionD1',
  'retentionD7',
  'retentionD30',
  'lessonCompletion',
  'premiumConversion',
  'aiCostPerRequest',
];
const feedbackId = /^FB-\d{4,6}$/,
  issueId = /^BETA-\d{4,6}$/;
const dayMs = 86400000;
export function dateOnly(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d\d-\d\d$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
function shape(value, keys, label) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).sort().join() !== keys.split(' ').sort().join()
  )
    throw Error('Invalid fields: ' + label);
}
function text(value, max = 1000) {
  return hasText(value) && value.length <= max;
}
function instant(value, now) {
  return validInstant(value) && Date.parse(value) <= now;
}
function unique(values, label) {
  if (new Set(values).size !== values.length) throw Error('Duplicate ' + label);
}
export function validateStudy(study, now = Date.now()) {
  shape(
    study,
    'version campaignId dataKind startedOn endedOn participants feedback issues reviews metricReview',
    'study',
  );
  if (
    study.version !== 1 ||
    typeof study.campaignId !== 'string' ||
    !/^[a-z0-9-]{1,64}$/.test(study.campaignId) ||
    !['real', 'synthetic'].includes(study.dataKind)
  )
    throw Error('Invalid study');
  for (const key of ['participants', 'feedback', 'issues', 'reviews'])
    if (!Array.isArray(study[key]) || study[key].length > (key === 'participants' ? 100 : 10000))
      throw Error('Invalid study collection');
  for (const key of ['startedOn', 'endedOn'])
    if (study[key] !== null && (!dateOnly(study[key]) || Date.parse(study[key]) > now))
      throw Error('Invalid campaign date');
  if (study.endedOn && (!study.startedOn || study.endedOn <= study.startedOn))
    throw Error('Invalid campaign interval');
  if (
    !study.startedOn &&
    (study.participants.length ||
      study.feedback.length ||
      study.issues.length ||
      study.reviews.length ||
      study.metricReview)
  )
    throw Error('Study has not started');
  for (const row of study.participants) {
    shape(row, 'id group platforms locale firstUsedAt', 'participant');
    if (
      !testerId.test(row.id) ||
      !groups.includes(row.group) ||
      !['de-DE', 'en-US', 'en-GB'].includes(row.locale) ||
      !Array.isArray(row.platforms) ||
      !row.platforms.length ||
      !row.platforms.every((key) => ['ios', 'android', 'web'].includes(key))
    )
      throw Error('Invalid participant');
    unique(row.platforms, 'participant platform');
    if (
      row.firstUsedAt !== null &&
      (!instant(row.firstUsedAt, now) ||
        row.firstUsedAt < study.startedOn ||
        (study.endedOn && row.firstUsedAt >= study.endedOn))
    )
      throw Error('Invalid first observed use');
  }
  unique(
    study.participants.map((row) => row.id),
    'participant',
  );
  for (const row of study.issues) {
    shape(
      row,
      'id severity status summary owner trackingReference createdAt triagedAt fixCommit verificationReference verifiedAt resolutionReference',
      'issue',
    );
    if (
      !issueId.test(row.id) ||
      !['critical', 'high', 'medium', 'low'].includes(row.severity) ||
      !['new', 'planned', 'fixed', 'dismissed'].includes(row.status) ||
      !text(row.summary) ||
      !instant(row.createdAt, now) ||
      row.createdAt < study.startedOn
    )
      throw Error('Invalid issue');
    for (const key of [
      'owner',
      'trackingReference',
      'verificationReference',
      'resolutionReference',
    ])
      if (row[key] !== null && !text(row[key])) throw Error('Invalid issue reference');
    if (row.fixCommit !== null && !/^[a-f\d]{40}$/.test(row.fixCommit))
      throw Error('Invalid fix commit');
    if (row.triagedAt !== null && (!instant(row.triagedAt, now) || row.triagedAt < row.createdAt))
      throw Error('Invalid triage time');
    if (
      row.verifiedAt !== null &&
      (!instant(row.verifiedAt, now) || !row.triagedAt || row.verifiedAt < row.triagedAt)
    )
      throw Error('Invalid verification time');
    if (
      row.status !== 'new' &&
      (!row.triagedAt || !text(row.owner) || !text(row.trackingReference))
    )
      throw Error('Triaged issues need an owner and tracking reference');
    if (
      row.status === 'fixed' &&
      (!row.fixCommit || !text(row.verificationReference) || !row.verifiedAt)
    )
      throw Error('A fix needs commit and regression evidence');
    if (row.status === 'dismissed' && !text(row.resolutionReference))
      throw Error('Dismissal needs a review rationale');
    if (
      row.severity === 'critical' &&
      row.status === 'dismissed' &&
      (!text(row.verificationReference) || !row.verifiedAt)
    )
      throw Error('Dismissing a critical issue needs verification evidence');
  }
  unique(
    study.issues.map((row) => row.id),
    'issue',
  );
  const ids = new Set(study.participants.map((row) => row.id)),
    issues = new Set(study.issues.map((row) => row.id));
  for (const row of study.feedback) {
    shape(row, 'id participantId receivedAt source summary issueId', 'feedback');
    if (
      !feedbackId.test(row.id) ||
      !instant(row.receivedAt, now) ||
      row.receivedAt < study.startedOn ||
      !['general', 'content', 'tutor'].includes(row.source) ||
      !text(row.summary) ||
      (row.participantId !== null && !ids.has(row.participantId)) ||
      (row.issueId !== null && !issues.has(row.issueId))
    )
      throw Error('Invalid feedback or dangling reference');
  }
  unique(
    study.feedback.map((row) => row.id),
    'feedback',
  );
  for (const row of study.reviews) {
    shape(row, 'from toExclusive reviewedAt reviewer summary', 'weekly review');
    validatePeriod(row.from, row.toExclusive, now);
    if (
      row.from < study.startedOn ||
      !instant(row.reviewedAt, now) ||
      row.reviewedAt < row.toExclusive ||
      !text(row.reviewer) ||
      !text(row.summary)
    )
      throw Error('Invalid completed weekly review');
  }
  unique(
    study.reviews.map((row) => row.from + ':' + row.toExclusive),
    'weekly review',
  );
  if (study.metricReview !== null) {
    const review = study.metricReview;
    shape(
      review,
      'reviewedAt reviewer baselineReference approvalReference targets',
      'metric review',
    );
    if (
      !study.endedOn ||
      !instant(review.reviewedAt, now) ||
      review.reviewedAt < study.endedOn ||
      !text(review.reviewer) ||
      !text(review.baselineReference) ||
      !text(review.approvalReference) ||
      !Array.isArray(review.targets)
    )
      throw Error('Metric targets need a post-beta baseline and approval');
    if (
      review.targets
        .map((row) => row.metric)
        .sort()
        .join() !== [...metrics].sort().join()
    )
      throw Error('Missing or duplicate metric targets');
    for (const row of review.targets) {
      shape(
        row,
        'metric target baselineNumerator baselineDenominator denominator window rationale',
        'metric target',
      );
      if (
        ![row.target, row.baselineNumerator, row.baselineDenominator].every(Number.isFinite) ||
        !Number.isInteger(row.baselineDenominator) ||
        row.baselineDenominator <= 0 ||
        row.baselineNumerator < 0 ||
        row.target < 0 ||
        !text(row.denominator) ||
        !text(row.window) ||
        !text(row.rationale)
      )
        throw Error('Invalid metric target or empty baseline');
      if (
        row.metric !== 'aiCostPerRequest' &&
        (row.target > 100 ||
          row.baselineNumerator > row.baselineDenominator ||
          !Number.isInteger(row.baselineNumerator))
      )
        throw Error('Invalid percentage baseline');
    }
  }
  return study;
}
export function validatePeriod(from, to, now = Date.now()) {
  const days = (Date.parse(to) - Date.parse(from)) / dayMs;
  const today = new Date(now).toISOString().slice(0, 10);
  if (!dateOnly(from) || !dateOnly(to) || days < 1 || days > 7 || to > today)
    throw Error('Use 1–7 fully closed UTC days, end exclusive');
}
export function betaCompletionProblems(study, now = Date.now()) {
  validateStudy(study, now);
  const missing = [];
  if (study.dataKind !== 'real')
    missing.push('real observations (synthetic data cannot finish beta)');
  if (!study.startedOn || !study.endedOn) missing.push('completed beta interval');
  const participants = study.participants.filter((row) => row.firstUsedAt);
  if (participants.length < 30) missing.push('30–100 actual testers');
  for (const group of groups)
    if (!participants.some((row) => row.group === group)) missing.push('tester group.' + group);
  for (const platform of ['ios', 'android', 'web'])
    if (!participants.some((row) => row.platforms.includes(platform)))
      missing.push('tested channel.' + platform);
  for (const row of study.feedback) if (!row.issueId) missing.push('untriaged feedback.' + row.id);
  for (const row of study.issues) {
    if (row.status === 'new') missing.push('unplanned issue.' + row.id);
    if (row.severity === 'critical' && !['fixed', 'dismissed'].includes(row.status))
      missing.push('open critical issue.' + row.id);
  }
  if (study.startedOn && study.endedOn) {
    let covered = study.startedOn;
    for (const review of [...study.reviews].sort((a, b) => a.from.localeCompare(b.from))) {
      if (review.from <= covered && review.toExclusive > covered) covered = review.toExclusive;
    }
    if (covered < study.endedOn) missing.push('weekly reviews cover beta interval');
    const last = study.reviews
      .map((row) => row.reviewedAt)
      .sort()
      .at(-1);
    const latestEvidence = [
      ...study.feedback.map((row) => row.receivedAt),
      ...study.issues.flatMap((row) => [row.triagedAt, row.verifiedAt]).filter(Boolean),
    ];
    if (latestEvidence.some((value) => !last || value > last))
      missing.push('review of latest feedback and issue evidence');
  }
  if (!study.metricReview)
    missing.push('approved post-beta metric targets with nonempty observed baselines');
  return missing;
}
export function summarizeWeek(study, from, toExclusive, now = Date.now()) {
  validateStudy(study, now);
  validatePeriod(from, toExclusive, now);
  const feedback = study.feedback.filter(
    (row) => row.receivedAt >= from && row.receivedAt < toExclusive,
  );
  const participants = study.participants.filter(
    (row) => row.firstUsedAt && row.firstUsedAt < toExclusive,
  );
  const issueIds = new Set(feedback.map((row) => row.issueId).filter(Boolean));
  return {
    version: 1,
    campaignId: study.campaignId,
    dataKind: study.dataKind,
    startedOn: study.startedOn,
    endedOn: study.endedOn,
    from,
    toExclusive,
    asOf: new Date(now).toISOString(),
    participants: participants.length,
    newlyObserved: participants.filter((row) => row.firstUsedAt >= from).length,
    groups: Object.fromEntries(
      groups.map((group) => [group, participants.filter((row) => row.group === group).length]),
    ),
    platforms: Object.fromEntries(
      ['ios', 'android', 'web'].map((platform) => [
        platform,
        participants.filter((row) => row.platforms.includes(platform)).length,
      ]),
    ),
    feedback: feedback.length,
    untriaged: feedback.filter((row) => !row.issueId).length,
    sources: Object.fromEntries(
      ['general', 'content', 'tutor'].map((source) => [
        source,
        feedback.filter((row) => row.source === source).length,
      ]),
    ),
    issuesReportedThisWeek: study.issues.filter((row) => issueIds.has(row.id)),
    openCritical: study.issues.filter(
      (row) => row.severity === 'critical' && !['fixed', 'dismissed'].includes(row.status),
    ),
    completionProblems: betaCompletionProblems(study, now),
    metricsReviewed: study.metricReview !== null,
  };
}

import { readFileSync } from 'node:fs';
import { catalogue } from '../../packages/content/src/authoring.ts';
import { createExamRun } from '../../packages/content/src/exam.ts';
import { lessonExerciseSources, textAt } from '../../packages/content/src/catalogue.ts';
import {
  evaluateExercise,
  exercisePrompt,
  choiceLabel,
} from '../../packages/exercises/src/index.ts';
import { layoutScore, layoutToSvg } from '../../packages/notation/src/index.ts';
import { contentMessages } from '../../packages/i18n/src/authoring-content-messages.ts';
import { CERTIFICATE_REVIEW_MESSAGES } from '../../packages/i18n/src/certificate-review.ts';
import { inspectInventory } from '../ai-act/model.mjs';
import { certificateDigests, certificateSourceHash } from './binding.mjs';
import { CERTIFICATE_PROFILES } from './profiles.ts';

export const REVIEW_SEEDS = [
  'certificate-review-a',
  'certificate-review-b',
  'certificate-review-c',
];
export const OPEN_REQUIREMENTS = [
  'draftOnly',
  'content',
  'rules',
  'identity',
  'payments',
  'operations',
  'devices',
  'phase4',
];

/** Private deterministic samples, not an approved exam bank or an independent grading oracle. */
export function certificateReview({
  digests = certificateDigests(),
  ai = inspectInventory(),
} = {}) {
  const profiles = CERTIFICATE_PROFILES.map((profile) => {
    const selectedIds = new Set(profile.template.questions.map((q) => q.lessonId));
    const lessons = [...selectedIds].map((id) => {
      const lesson = catalogue.lessons.find((l) => l.id === id);
      if (!lesson) throw Error('Missing certificate lesson');
      return { id, titleKey: lesson.titleKey, unitId: lesson.unitId, status: lesson.status };
    });
    const levelIds = new Set(
      catalogue.levels.filter((l) => l.number === profile.stage).map((l) => l.id),
    );
    const units = catalogue.units.filter((u) => levelIds.has(u.levelId));
    if (lessons.some((l) => !units.some((u) => u.id === l.unitId)))
      throw Error('Certificate stage mismatch');
    const covered = new Set(lessons.map((l) => l.unitId));
    const samples = REVIEW_SEEDS.map((seed) => {
      const run = createExamRun(catalogue, [profile.template], profile.id, seed, 0);
      return {
        seed,
        questions: run.session.items.map((item, index) => {
          const source = profile.template.questions[index];
          const spec = lessonExerciseSources(catalogue, source.lessonId)?.[source.sourceIndex]
            ?.spec;
          const correct = item.choices.filter((choice) => evaluateExercise(item, choice).correct);
          if (!spec || new Set(item.choices).size !== item.choices.length || correct.length !== 1)
            throw Error('Ambiguous certificate review answer');
          return { index, ...source, spec, item, correctAnswer: correct[0] };
        }),
      };
    });
    return {
      id: profile.id,
      stage: profile.stage,
      version: profile.version,
      minutes: profile.template.minutes,
      pointsPerQuestion: profile.template.pointsPerQuestion,
      thresholdPercent: profile.thresholdPercent,
      lessons,
      uncoveredUnits: units
        .filter((u) => !covered.has(u.id))
        .map((u) => ({ id: u.id, titleKey: u.titleKey })),
      samples,
    };
  });
  return {
    version: 1,
    draft: true,
    releaseEligible: false,
    legalApprovalInferred: false,
    sourceHash: certificateSourceHash(digests),
    fileDigests: digests,
    aiSnapshotHash: ai.snapshotHash,
    missing: [
      ...OPEN_REQUIREMENTS.map((id) => 'certificate.' + id),
      ...ai.scopes.certificates.missing.map((id) => 'aiAct.certificates.' + id),
    ],
    profiles,
  };
}

const escape = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export function certificateReviewHtml(packet, locale) {
  if (!Object.hasOwn(CERTIFICATE_REVIEW_MESSAGES, locale)) throw Error('Invalid review locale');
  const t = (key) => escape(CERTIFICATE_REVIEW_MESSAGES[locale][key]);
  const fontRoot = new URL(
    '../../packages/notation/node_modules/@vexflow-fonts/bravura/',
    import.meta.url,
  );
  const font = readFileSync(new URL('bravura.woff2', fontRoot)).toString('base64');
  const license = escape(readFileSync(new URL('LICENSE.txt', fontRoot), 'utf8'));
  const title = (record) =>
    escape(textAt({ content: contentMessages[locale] }, record.titleKey) ?? record.id);
  const profiles = packet.profiles
    .map((profile) => {
      const samples = profile.samples
        .map(
          (sample, sampleIndex) =>
            `<section><h3>${t('sample')} ${sampleIndex + 1} · ${escape(sample.seed)}</h3>${sample.questions
              .map((q) => {
                const item = q.item;
                const score =
                  'score' in item
                    ? item.score
                    : item.type === 'CONTEXT_CHOICE' && item.source.kind === 'score'
                      ? item.source.score
                      : null;
                return `<article><h4>${t('question')} ${q.index + 1}</h4><p>${t('source')}: <code>${escape(q.lessonId)}</code> [${q.sourceIndex}] · ${t('area')}: ${t(q.area)}</p><p>${escape(exercisePrompt(item, locale))}</p>${score ? `<div class="score" role="region" aria-label="${t('source')} · ${t('stage')} ${profile.stage} · ${t('sample')} ${sampleIndex + 1} · ${t('question')} ${q.index + 1}" tabindex="0">${layoutToSvg(layoutScore(score))}</div>` : ''}<ul>${item.choices.map((c) => `<li>${escape(choiceLabel(item, c, locale))}${c === q.correctAnswer ? ` <strong>(${t('correct')})</strong>` : ''}</li>`).join('')}</ul><details><summary>${t('source')}</summary><pre>${escape(JSON.stringify(q.spec, null, 2))}</pre></details></article>`;
              })
              .join('')}</section>`,
        )
        .join('');
      return `<section><h2>${t('profile')}: ${t('stage')} ${profile.stage}</h2><p>${t('version')}: ${profile.version} · ${t('minutes')}: ${profile.minutes} · ${t('points')}: ${profile.pointsPerQuestion} · ${t('threshold')}: ${profile.thresholdPercent}</p><p>${t('policy')}</p><h3>${t('coverage')}</h3><h4>${t('selected')}</h4><ul>${profile.lessons.map((l) => `<li>${title(l)} · <code>${escape(l.id)}</code> · ${escape(l.status)}</li>`).join('')}</ul><h4>${t('omitted')}</h4><ul>${profile.uncoveredUnits.map((u) => `<li>${title(u)} · <code>${escape(u.id)}</code></li>`).join('')}</ul><p>${t('coverageLimit')}</p><h3>${t('examples')}</h3><p>${t('sampleLimit')}</p>${samples}</section>`;
    })
    .join('');
  return `<!doctype html><html lang="${locale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none'"><title>${t('title')}</title><style>@font-face{font-family:Bravura;src:url(data:font/woff2;base64,${font}) format('woff2')}body{font:17px/1.6 system-ui;max-width:1100px;margin:auto;padding:1rem;background:#fff;color:#17202a}article{border-top:1px solid #68737e;padding-block:1rem}pre,.score{overflow:auto}.score svg{display:block;max-width:none}code,p,li{overflow-wrap:anywhere}.draft{padding:1rem;background:#fff1b8;border:2px solid #554000}</style><main><h1>${t('title')}</h1><p class="draft">${t('draft')}</p><p>${t('intro')}</p><h2>${t('snapshot')}</h2><code>${escape(packet.sourceHash)}</code><h2>${t('aiSnapshot')}</h2><code>${escape(packet.aiSnapshotHash)}</code><h2>${t('blockers')}</h2><ul>${OPEN_REQUIREMENTS.map((id) => `<li>${t(id)}</li>`).join('')}<li>${t('ai')}<ul>${packet.missing
    .filter((id) => id.startsWith('aiAct.'))
    .map((id) => `<li>${escape(id)}</li>`)
    .join(
      '',
    )}</ul></li></ul>${profiles}<details><summary>${t('files')} (${Object.keys(packet.fileDigests).length})</summary><ul>${Object.entries(
    packet.fileDigests,
  )
    .map(([p, h]) => `<li>${escape(p)} <code>${escape(h)}</code></li>`)
    .join(
      '',
    )}</ul></details><p>${t('limits')}</p><details><summary>${t('fontLicense')}</summary><pre>${license}</pre></details></main></html>`;
}

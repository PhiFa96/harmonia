import { aiReviewText } from '../../packages/i18n/src/ai-act-review.ts';
import { SCOPES } from './model.mjs';
const escape = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export function reviewHtml(data, result, locale) {
  const t = (key) => escape(aiReviewText(locale, key));
  const labels = { 'internal-draft': 'internalDraft', 'not-applicable': 'notApplicable' };
  const label = (s) => t(labels[s] ?? s);
  const features = data.components
    .map(
      (c) =>
        `<tr><td><strong>${escape(c.title[locale])}</strong><p>${escape(c.purpose[locale])}</p><p>${label(c.deployment)} · ${escape(c.technology)}</p></td><td>${escape(c.concern[locale])}</td><td><dl>${['aiSystem', 'annexIII', 'profiling'].map((k, i) => `<dt>${t(['ai', 'annex', 'profiling'][i])}</dt><dd>${label(c.assessment[k])}</dd>`).join('')}<dt>${t('outcome')}</dt><dd>${escape(c.assessment.outcome)}</dd></dl></td></tr>`,
    )
    .join('');
  const controls = data.controls
    .map(
      (c) =>
        `<tr><td>${escape(c.title[locale])}</td><td>${escape(c.owner)}</td><td>${label(c.status)}</td><td>${escape(c.evidenceReference ?? aiReviewText(locale, 'open'))}${c.rationale ? `<p>${escape(c.rationale)}</p>` : ''}</td></tr>`,
    )
    .join('');
  const scopes = SCOPES.map((scope) => {
    const s = result.scopes[scope],
      r = data.reviews[scope];
    return `<section><h3>${t(scope)}</h3><p>${t(s.readinessComplete ? 'complete' : 'incomplete')}</p><p>${t('review')}: ${escape(r.reviewer ?? aiReviewText(locale, 'open'))} · ${escape(r.evidenceReference ?? aiReviewText(locale, 'open'))}</p><ul>${s.missing.map((p) => `<li>${escape(p)}</li>`).join('')}</ul></section>`;
  }).join('');
  return `<!doctype html><html lang="${locale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${t('title')}</title><style>body{font:17px/1.6 system-ui;max-width:1200px;margin:auto;padding:1rem;color:#17202a;background:#fff}table{border-collapse:collapse;width:100%}th,td{text-align:left;vertical-align:top;padding:.7rem;border:1px solid #68737e}code,p,li,a,dd{overflow-wrap:anywhere}dl{margin:0}dd{margin-left:0}dt{font-weight:600}.draft{padding:1rem;background:#fff1b8;border:2px solid #554000}@media(max-width:700px){.scroll{overflow-x:auto}table{min-width:650px}}</style><main><h1>${t('title')}</h1><p class="draft">${t('draft')}</p><p>${t('intro')}</p><p>${t('sourcesDate')}: ${escape(data.sourcesObservedAt)} · ${escape(data.legalBaseline)}</p><h2>${t('snapshot')}</h2><code>${escape(result.snapshotHash)}</code><h2>${t('readiness')}</h2>${scopes}<h2>${t('components')}</h2><div class="scroll" role="region" aria-label="${t('components')}" tabindex="0"><table><thead><tr><th scope="col">${t('component')}</th><th scope="col">${t('concern')}</th><th scope="col">${t('assessment')}</th></tr></thead><tbody>${features}</tbody></table></div><h2>${t('controls')}</h2><div class="scroll" role="region" aria-label="${t('controls')}" tabindex="0"><table><thead><tr><th scope="col">${t('controls')}</th><th scope="col">${t('owner')}</th><th scope="col">${t('state')}</th><th scope="col">${t('reference')}</th></tr></thead><tbody>${controls}</tbody></table></div><h2>${t('boundaries')}</h2><ul>${data.excludedPurposes.map((s) => `<li>${escape(s)}</li>`).join('')}</ul><h2>${t('sources')}</h2><ul>${data.sources.map((s) => `<li><a href="${escape(s.url)}" rel="noreferrer">${escape(s.id)}</a>: ${t(s.retrieval)}<p>${escape(s.note[locale])}</p></li>`).join('')}</ul><details><summary>${t('files')} (${Object.keys(result.fileDigests).length})</summary><ul>${Object.entries(
    result.fileDigests,
  )
    .map(([p, h]) => `<li>${escape(p)} <code>${escape(h)}</code></li>`)
    .join('')}</ul></details><p>${t('limit')}</p></main></html>`;
}

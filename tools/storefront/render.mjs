import { locales, catalog, pagePath, escapeHtml as h } from './model.mjs';
const icon = (kind) => {
  const shapes = {
    notes:
      '<path d="M15 5v15m0-11 12-3v12M15 9l12-3"/><ellipse cx="11" cy="21" rx="4" ry="3"/><ellipse cx="23" cy="19" rx="4" ry="3"/>',
    keys: '<rect x="5" y="6" width="22" height="21" rx="2"/><path d="M12 6v21m8-21v21M9 6v11m8-11v11m7-11v11"/>',
    path: '<circle cx="9" cy="24" r="3"/><circle cx="24" cy="8" r="3"/><path d="M9 21v-5a4 4 0 0 1 4-4h7a4 4 0 0 0 4-4"/>',
    hint: '<path d="M11 22c0-5-4-5-4-11a9 9 0 0 1 18 0c0 6-4 6-4 11m-10 0h10m-9 5h8"/>',
  };
  return `<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${shapes[kind]}</svg>`;
};
export function renderPage(
  locale,
  config,
  { support = false, release = false, legalLinks = {} } = {},
) {
  const t = catalog[locale];
  const canonical = config.publicOrigin
    ? new URL(pagePath(locale, support), config.publicOrigin).href
    : null;
  const languages = locales
    .map(
      (l) =>
        `<a lang="${h(catalog[l].lang)}" hreflang="${h(catalog[l].lang)}" href="${pagePath(l, support)}"${l === locale ? ' aria-current="page"' : ''}>${h(catalog[l].language)}</a>`,
    )
    .join('');
  const storeLinks = [
    config.availability.ios &&
      `<a class="button secondary" href="${h(config.links.appStore)}">${h(t.apple)}</a>`,
    config.availability.android &&
      `<a class="button secondary" href="${h(config.links.googlePlay)}">${h(t.google)}</a>`,
  ]
    .filter(Boolean)
    .join('');
  const contact = config.supportEmail
    ? `<a class="button" href="mailto:${h(config.supportEmail)}">${h(t.contact)}</a><p class="muted">${h(config.supportEmail)}</p>`
    : `<p class="notice">${h(t.supportUnavailable)}</p>`;
  const content = support
    ? `<section class="support"><a class="text-link" href="${pagePath(locale)}">← ${h(t.back)}</a><p class="eyebrow">${h(t.navSupport)}</p><h1>${h(t.supportTitle)}</h1><p class="lead">${h(t.supportIntro)}</p>${contact}<div class="support-card"><h2>${h(t.supportChecklistTitle)}</h2><ul>${t.supportChecklist.map((line) => `<li>${h(line)}</li>`).join('')}</ul><p>${h(t.supportPrivacy)}</p></div></section>`
    : `
<section class="hero"><div class="hero-copy"><p class="eyebrow">${h(t.eyebrow)}</p><h1>${h(t.headline)}</h1><p class="lead">${h(t.intro)}</p><div class="actions"><a class="button" href="/">${h(t.openApp)} <span aria-hidden="true">↗</span></a><a class="text-link" href="#discover">${h(t.explore)} ↓</a></div><p class="muted">${h(t.mobileStatus)}</p>${storeLinks}</div>
<div class="music-card"><div class="music-label"><span class="dot" aria-hidden="true"></span>${h(t.visualTitle)}</div><svg class="score" viewBox="0 0 420 200" aria-hidden="true"><g class="staff">${[65, 85, 105, 125, 145].map((y) => `<path d="M30 ${y}H390"/>`).join('')}</g><g class="notes"><ellipse cx="105" cy="145" rx="15" ry="10" transform="rotate(-18 105 145)"/><path d="M119 142V65"/><ellipse cx="210" cy="125" rx="15" ry="10" transform="rotate(-18 210 125)"/><path d="M224 122V45"/></g><g class="active-note"><ellipse cx="315" cy="105" rx="15" ry="10" transform="rotate(-18 315 105)"/><path d="M329 102V25"/></g></svg><p>${h(t.visualBody)}</p><div class="tags">${t.visualTags.map((tag) => `<span>${h(tag)}</span>`).join('')}</div></div></section>
<section id="discover"><div class="section-heading"><p class="eyebrow">${h(t.navFeatures)}</p><h2>${h(t.featuresTitle)}</h2><p class="lead">${h(t.featuresIntro)}</p></div><div class="features">${t.features.map((f) => `<article class="feature"><div class="feature-icon">${icon(f.icon)}</div><h3>${h(f.title)}</h3><p>${h(f.body)}</p></article>`).join('')}</div></section>
<section id="how" class="how"><h2>${h(t.howTitle)}</h2><ol class="steps">${t.steps.map((s) => `<li><h3>${h(s.title)}</h3><p>${h(s.body)}</p></li>`).join('')}</ol></section>
<section class="faq"><h2>${h(t.faqTitle)}</h2>${t.faq.map((f) => `<details><summary>${h(f.question)}</summary><p>${h(f.answer)}</p></details>`).join('')}</section>
<section class="closing"><h2>${h(t.closingTitle)}</h2><p>${h(t.closingBody)}</p><a class="button" href="/">${h(t.openApp)} <span aria-hidden="true">↗</span></a></section>`;
  return `<!doctype html><html lang="${h(t.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="robots" content="${release ? 'index,follow' : 'noindex,nofollow'}"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'"><title>${h(support ? t.navSupport + ' – Harmonia' : t.pageTitle)}</title><meta name="description" content="${h(support ? t.supportIntro : t.description)}"><meta property="og:title" content="${h(support ? t.navSupport + ' – Harmonia' : t.pageTitle)}"><meta property="og:description" content="${h(support ? t.supportIntro : t.description)}"><meta property="og:type" content="website">${canonical ? `<link rel="canonical" href="${h(canonical)}">${locales.map((l) => `<link rel="alternate" hreflang="${h(catalog[l].lang)}" href="${h(new URL(pagePath(l, support), config.publicOrigin).href)}">`).join('')}` : ''}<link rel="icon" type="image/svg+xml" href="/about/assets/mark.svg"><link rel="stylesheet" href="/about/styles.css"></head><body><a class="skip" href="#main">${h(t.skip)}</a><header><a class="brand" href="${pagePath(locale)}"><img src="/about/assets/mark.svg" width="40" height="40" alt=""><span>Harmonia</span></a><nav class="main-nav" aria-label="${h(t.navigation)}"><a href="${pagePath(locale)}#discover">${h(t.navFeatures)}</a><a href="${pagePath(locale)}#how">${h(t.navHow)}</a><a href="${pagePath(locale, true)}">${h(t.navSupport)}</a></nav><span class="status">${h(t.status)}</span></header><nav class="languages" aria-label="${h(t.languageNavigation)}">${languages}</nav><main id="main" tabindex="-1">${content}</main><footer><div><a class="brand" href="${pagePath(locale)}">Harmonia</a><p>${h(t.footer)}</p></div><nav aria-label="${h(t.footerNavigation)}"><a href="${h(legalLinks.imprint ?? '/legal')}">${h(t.legal)}</a><a href="${h((locale === 'de-DE' ? legalLinks.privacyDe : legalLinks.privacyEn) ?? '/legal')}">${h(t.privacy)}</a><a href="/privacy">${h(t.privacyChoices)}</a><a href="${pagePath(locale, true)}">${h(t.navSupport)}</a><a href="/cancel-subscription">${h(t.cancellation)}</a></nav></footer></body></html>`;
}

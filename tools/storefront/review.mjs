import { catalog, locales, escapeHtml as h } from './model.mjs';
import { COLORS, SPACE, RADIUS } from '../../packages/ui/src/tokens.ts';
export function reviewHtml(report) {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Harmonia · Store-Prüfpaket</title><link rel="stylesheet" href="review.css"></head><body><header><h1>Harmonia · Store-Prüfpaket</h1><p>Eigene Web-Referenzaufnahmen mit Entwurfsinhalten. Keine nativen Storebelege oder Upload-Freigabe.</p><nav>${locales.map((l) => `<a href="#${l}">${h(catalog[l].language)}</a>`).join('')}</nav></header><main>${locales
    .map((locale) => {
      const text = catalog[locale],
        store = text.store;
      return `<section id="${locale}" lang="${h(text.lang)}"><h2>${h(text.language)}</h2><h3>${h(store.name)}</h3><p>${h(store.subtitle)}</p><p>${h(store.promotionalText)}</p><dl><dt>Google Play · Short description</dt><dd>${h(store.shortDescription)}</dd><dt>App Store · Keywords</dt><dd>${h(store.keywords)}</dd><dt>Description</dt><dd class="description">${h(store.description)}</dd></dl><div class="gallery">${report.files
        .filter((a) => a.locale === locale && a.kind === 'screenshot')
        .map(
          (asset) =>
            `<figure><a href="${h(asset.path)}"><img src="${h(asset.path)}" alt="${h(asset.alt)}" loading="lazy" width="264" height="574"></a><figcaption>${h(asset.title)}</figcaption></figure>`,
        )
        .join('')}</div>${report.files
        .filter((a) => a.locale === locale && a.kind === 'video')
        .map(
          (asset) =>
            `<video controls muted playsinline preload="metadata" width="270" height="480" aria-label="${h(text.visualTitle)}"><source src="${h(asset.path)}" type="video/mp4"></video>`,
        )
        .join('')}</section>`;
    })
    .join('')}</main></body></html>`;
}
export const reviewCss = `body{max-width:1160px;margin:auto;padding:${SPACE.xl}px;background:${COLORS.light.background};color:${COLORS.light.text};font:17px/1.6 system-ui,sans-serif;overflow-wrap:anywhere}nav,.gallery{display:flex;flex-wrap:wrap;gap:${SPACE.xl}px}a{color:${COLORS.light.primaryText};min-height:48px;display:inline-flex;align-items:center}section{padding-block:${SPACE.xxxl}px;border-bottom:1px solid ${COLORS.light.borderStrong}}.description{white-space:pre-wrap}dt{font-weight:700;margin-top:${SPACE.xl}px}dd{margin-left:0}figure{margin:0;max-width:100%}img,video{max-width:100%;height:auto;border-radius:${RADIUS.card}px}figcaption{max-width:264px}a:focus-visible{outline:3px solid ${COLORS.light.primary};outline-offset:4px}`;

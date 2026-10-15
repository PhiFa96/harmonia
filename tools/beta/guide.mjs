import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
export const messages = JSON.parse(
  readFileSync(new URL('../../packages/i18n/src/beta.json', import.meta.url), 'utf8'),
);
export const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
export function validateMessages(input = messages) {
  const keys = [
    'title',
    'label',
    'intro',
    'start',
    'tasksTitle',
    'tasks',
    'feedbackTitle',
    'feedback',
    'content',
    'contact',
    'pending',
    'template',
    'templateBody',
    'privacy',
    'access',
  ]
    .sort()
    .join();
  if (Object.keys(input).sort().join() !== ['de-DE', 'en-US', 'en-GB'].sort().join())
    throw Error('Beta guide languages');
  for (const text of Object.values(input)) {
    if (
      Object.keys(text).sort().join() !== keys ||
      !Array.isArray(text.tasks) ||
      text.tasks.length !== 4 ||
      !Object.values(text)
        .flat()
        .every((entry) => typeof entry === 'string' && entry.trim())
    )
      throw Error('Incomplete beta guide');
  }
}
export function renderGuide(locale, contact = null) {
  validateMessages();
  const t = messages[locale];
  if (!t) throw Error('Unknown beta guide locale');
  const e = escapeHtml;
  return `<!doctype html><html lang="${locale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'"><title>Harmonia · ${e(t.label)}</title><link rel="stylesheet" href="/about/styles.css"><link rel="stylesheet" href="/beta/styles.css"><body><header class="site-header"><a href="/" class="brand">Harmonia</a><nav aria-label="Language">${Object.keys(
    messages,
  )
    .map(
      (key) =>
        `<a href="/beta/${key}.html" lang="${key}" ${key === locale ? 'aria-current="page"' : ''}>${key}</a>`,
    )
    .join(
      ' ',
    )}</nav></header><main class="beta-main"><section><p class="eyebrow">${e(t.label)}</p><h1>${e(t.title)}</h1><p>${e(t.intro)}</p><a class="button" href="/">${e(t.start)}</a></section><section><h2>${e(t.tasksTitle)}</h2><ol>${t.tasks.map((task) => `<li><p>${e(task)}</p></li>`).join('')}</ol></section><section><h2>${e(t.feedbackTitle)}</h2><p>${e(t.feedback)}</p><p>${e(t.content)}</p><p>${contact ? `<a href="mailto:${e(encodeURIComponent(contact))}">${e(t.contact)}</a>` : e(t.pending)}</p><p><a href="/beta/feedback-${locale}.txt" download>${e(t.template)}</a></p><p>${e(t.privacy)}</p><p>${e(t.access)}</p></section></main></body></html>`;
}
export function buildGuides(root, contact) {
  mkdirSync(join(root, 'beta'), { recursive: true });
  writeFileSync(
    join(root, 'beta', 'styles.css'),
    '.beta-main{max-width:var(--content-width)}.beta-main>section{padding-block:var(--space-xxl)}.beta-main h1{font-size:clamp(var(--title1),6vw,var(--display))}.beta-main p,.beta-main li{max-width:65ch}.beta-main ol{padding-inline-start:var(--space-xl)}.beta-main .button{margin-block-start:var(--space-l)}',
  );
  for (const locale of Object.keys(messages)) {
    writeFileSync(join(root, 'beta', locale + '.html'), renderGuide(locale, contact));
    writeFileSync(join(root, 'beta', `feedback-${locale}.txt`), messages[locale].templateBody);
  }
}

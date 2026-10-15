import { readFileSync } from 'node:fs';
export const supportTemplates = JSON.parse(
  readFileSync(new URL('../../packages/i18n/src/support.json', import.meta.url), 'utf8'),
);
export function validateSupportTemplates() {
  const required = ['received', 'reproduction', 'subscription', 'privacy', 'incident', 'resolved'];
  for (const locale of ['de', 'en']) {
    if (
      Object.keys(supportTemplates[locale] ?? {})
        .sort()
        .join() !== [...required].sort().join()
    )
      throw Error('Support template languages');
    for (const type of required)
      for (const field of ['subject', 'body'])
        if (
          typeof supportTemplates[locale][type][field] !== 'string' ||
          !supportTemplates[locale][type][field].trim()
        )
          throw Error('Empty support template');
  }
  for (const type of required) {
    const tokens = (locale) =>
      [...JSON.stringify(supportTemplates[locale][type]).matchAll(/\{\{(\w+)\}\}/g)]
        .map((value) => value[1])
        .sort()
        .join();
    if (tokens('de') !== tokens('en')) throw Error('Support template placeholders');
  }
}
/** Produce text only. No transport, ticket mutation or automatic message is part of this tool. */
export function supportReply(locale, type, values) {
  validateSupportTemplates();
  const template = supportTemplates[locale]?.[type];
  if (!template) throw Error('Unknown support template');
  const render = (text) =>
    text.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
      if (
        typeof values[key] !== 'string' ||
        !values[key].trim() ||
        values[key].length > 200 ||
        /[\r\n]/.test(values[key])
      )
        throw Error('Support reply requires reviewed placeholder: ' + key);
      return values[key];
    });
  return { subject: render(template.subject), body: render(template.body) };
}

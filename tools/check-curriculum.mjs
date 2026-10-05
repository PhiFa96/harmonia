import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { catalogue, curriculumPlan } from '../packages/content/src/authoring.ts';
import { createI18n } from '../packages/i18n/src/index.ts';
import { contentMessages } from '../packages/i18n/src/authoring-content-messages.ts';
import { renderCurriculum } from './curriculum-view.mjs';

const mode = process.argv[2] ?? '--check';
if (!['--check', '--write'].includes(mode))
  throw new Error('Aufruf: node tools/check-curriculum.mjs [--check|--write] [Datei]');
const instances = Object.fromEntries(
  Object.entries(contentMessages).map(([locale, content]) => {
    const instance = createI18n(locale);
    instance.addResourceBundle(locale, 'translation', { content }, true, true);
    return [locale, instance];
  }),
);
const expected = renderCurriculum(catalogue, curriculumPlan, (key, locale) => {
  const instance = instances[locale];
  if (!instance.exists(key)) throw new Error(`Planungstext fehlt: ${locale} ${key}`);
  return instance.t(key);
});
const file = process.argv[3]
  ? pathToFileURL(resolve(process.argv[3]))
  : new URL('../docs/plan/faehigkeitsgraph-diagramme.md', import.meta.url);
if (mode === '--write') writeFileSync(file, expected);
else if (readFileSync(file, 'utf8') !== expected)
  throw new Error('Planungsdiagramme veraltet; pnpm curriculum:render ausführen und Diff prüfen.');
console.log(
  `Fähigkeitsplan geprüft: ${catalogue.skills.length} Fähigkeiten, vollständige Zuordnung und aktuelle Planungsdiagramme.`,
);

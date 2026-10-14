// Inhaltsprüfung und deterministische öffentliche Artefakte. Keine Netzwerk-/Dateisystem-APIs im Paket.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import {
  parseCatalogue,
  publicCatalogue,
  publicMessages,
  knowledgeArticles,
} from '../packages/content/src/index.ts';
import { catalogue as authored, curriculumPlan } from '../packages/content/src/authoring.ts';
import { RESOURCES, checkTranslations } from '../packages/i18n/src/index.ts';
import { contentMessages } from '../packages/i18n/src/authoring-content-messages.ts';
import { validateContentExample } from './validate-content-example.mjs';

const mode = process.argv[2] ?? '--check';
if (!['--check', '--write'].includes(mode))
  throw new Error('Aufruf: node tools/check-content.mjs [--check|--write]');
const messages = Object.fromEntries(
  Object.entries(contentMessages).map(([locale, content]) => [locale, { content }]),
);
const catalogue = parseCatalogue(authored, {
  messages,
  validateScore: validateContentExample,
});
const authoredResources = Object.fromEntries(
  Object.entries(RESOURCES).map(([locale, resources]) => [
    locale,
    {
      ...resources,
      translation: { ...resources.translation, content: contentMessages[locale] },
    },
  ]),
);
const translations = checkTranslations(authoredResources);
if (translations.length > 0) throw new Error(translations.join('\n'));
const published = publicCatalogue(catalogue);
const files = [
  ['../packages/content/src/published.json', published],
  [
    '../packages/content/src/published-knowledge-stages.json',
    Object.fromEntries(
      knowledgeArticles(catalogue, 'published').map(({ article, stage }) => [article.id, stage]),
    ),
  ],
  [
    '../packages/i18n/src/published-content.json',
    Object.fromEntries(
      Object.entries(messages).map(([locale, source]) => [
        locale,
        publicMessages(published, source).content ?? {},
      ]),
    ),
  ],
];
for (const [path, value] of files) {
  const url = new URL(path, import.meta.url);
  const expected = await prettier.format(JSON.stringify(value), {
    ...(await prettier.resolveConfig(fileURLToPath(url))),
    parser: 'json',
  });
  if (mode === '--write') writeFileSync(url, expected);
  else if (readFileSync(url, 'utf8') !== expected)
    throw new Error(
      `${path}: öffentliches Artefakt veraltet oder unzulässig; pnpm content:publish ausführen und Diff prüfen.`,
    );
}
console.log(
  `Inhalte gültig: ${catalogue.skills.length} Fähigkeiten in ${curriculumPlan.units.length} geplanten Einheiten; ${catalogue.lessons.length} interne, ${published.lessons.length} freigegebene Lektionen; öffentliche Daten und Texte stimmen.`,
);

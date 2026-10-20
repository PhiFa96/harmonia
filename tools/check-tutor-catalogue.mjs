import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildBenchmarkCatalogue } from './tutor-benchmark/catalogue.ts';
import { canonical, fingerprint } from './tutor-benchmark/hash.ts';
import { LOCALES, catalogueReviewSchema } from './tutor-benchmark/schema.ts';
const target = fileURLToPath(new URL('./tutor-benchmark/catalogue.json', import.meta.url));
const catalogue = buildBenchmarkCatalogue();
if (process.argv.includes('--write'))
  writeFileSync(target, JSON.stringify(catalogue, null, 2) + '\n');
else if (canonical(JSON.parse(readFileSync(target, 'utf8'))) !== canonical(catalogue))
  throw Error('Testkatalog veraltet. pnpm tutor:catalogue:write ausführen und den Diff prüfen.');
const questions = LOCALES.map((locale) => catalogue.cases.map((c) => c.questions[locale]));
if (questions.some((q) => new Set(q).size !== q.length))
  throw Error('Doppelte Fragen innerhalb einer Sprache.');
const types = new Set(catalogue.cases.map((c) => c.exerciseType).filter(Boolean));
const tools = new Set(catalogue.cases.flatMap((c) => c.calls.map((call) => call.name)));
if (types.size !== 19 || tools.size !== 8)
  throw Error('Aufgaben-/Werkzeugabdeckung unvollständig.');
const reviewIndex = process.argv.indexOf('--review');
if (reviewIndex !== -1) {
  const path = process.argv[reviewIndex + 1];
  if (!path) throw Error('Reviewdatei fehlt.');
  const review = catalogueReviewSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
  if (review.catalogueHash !== (await fingerprint(catalogue)))
    throw Error('Review gehört zu einem anderen Katalog.');
  const seen = new Set();
  for (const row of review.reviews) {
    const c = catalogue.cases.find((c) => c.id === row.caseId),
      id = row.caseId + ':' + row.locale;
    if (
      !c ||
      seen.has(id) ||
      row.caseHash !== (await fingerprint(c)) ||
      new Set(row.methods).size < 2
    )
      throw Error(
        'Unbekannter/doppelter/veralteter Review oder weniger als zwei unabhängige Prüfmittel.',
      );
    seen.add(id);
  }
  if (
    review.reviews.length !== catalogue.cases.length * 3 ||
    review.reviews.some((row) => !row.approved)
  )
    throw Error('Getrennte fachliche Freigabe durch Claude ist noch unvollständig.');
}
console.log(
  `${catalogue.cases.length} eigene Testfälle / ${catalogue.cases.length * 3} Sprachfassungen, ${types.size} Übungstypen und ${tools.size} Engine-Werkzeuge (Katalog v1) geprüft. Fachliche Freigabe ${reviewIndex === -1 ? 'nicht behauptet (Entwurf)' : 'vollständig belegt'}.`,
);

// Prüft alle Übersetzungen (packages/i18n): gleiche Schlüssel in DE und EN, keine leeren Texte,
// vollständige Pluralformen, gleiche Platzhalter, gültige Verweise auf das Glossar.
// Aufruf: pnpm check:i18n (läuft in der CI)

import { checkTranslations } from '../packages/i18n/src/check.ts';

const problems = checkTranslations();
if (problems.length > 0) {
  console.error(`Übersetzungen unvollständig (${String(problems.length)}):`);
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  throw new Error('Übersetzungen prüfen');
}
console.log('Übersetzungen vollständig.');

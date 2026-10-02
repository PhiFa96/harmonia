// Prüft, dass Workspace-Pakete nur erlaubte interne Abhängigkeiten haben.
// Quelle der Regeln: docs/plan/architektur.md, Abschnitt „Paket-Abhängigkeiten“.
// Neue Pakete müssen hier bewusst eingetragen werden.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SCOPE = '@harmonia/';

/** Erlaubte interne Abhängigkeiten je Paket (ohne Scope). `config` ist überall erlaubt. */
const ALLOWED = {
  mobile: ['ui', 'exercises', 'notation', 'audio', 'content', 'i18n', 'api'],
  dashboard: ['ui', 'exercises', 'notation', 'audio', 'content', 'i18n', 'api'],
  exercises: ['theory', 'notation', 'audio', 'i18n'],
  notation: ['theory'],
  audio: ['theory'],
  content: ['theory', 'exercises'],
  i18n: ['theory'],
  ui: [],
  api: [],
  theory: [],
  config: [],
};
const ALWAYS_ALLOWED = ['config'];

const root = new URL('..', import.meta.url).pathname;
const errors = [];

for (const group of ['apps', 'packages']) {
  const dir = join(root, group);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir)) {
    const manifestPath = join(dir, name, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const pkg = String(manifest.name ?? '').replace(SCOPE, '');
    const allowed = ALLOWED[pkg];
    if (!allowed) {
      errors.push(
        `${manifest.name}: unbekanntes Paket – bitte in tools/check-package-graph.mjs eintragen`,
      );
      continue;
    }
    const deps = {
      ...manifest.dependencies,
      ...manifest.devDependencies,
      ...manifest.peerDependencies,
    };
    for (const dep of Object.keys(deps).filter((d) => d.startsWith(SCOPE))) {
      const target = dep.replace(SCOPE, '');
      if (!allowed.includes(target) && !ALWAYS_ALLOWED.includes(target)) {
        errors.push(
          `${manifest.name} darf nicht von ${dep} abhängen (siehe docs/plan/architektur.md)`,
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error('Paket-Abhängigkeiten verletzt:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log('Paket-Abhängigkeiten in Ordnung.');

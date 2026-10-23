// Prüft den tatsächlichen Produktions-Export, einschließlich escapeter JavaScript-Strings.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { catalogue } from '../packages/content/src/authoring.ts';
import { publicCatalogue, textAt, textKeys, COLLECTIONS } from '../packages/content/src/index.ts';
import { contentMessages } from '../packages/i18n/src/authoring-content-messages.ts';
import { RESOURCES } from '../packages/i18n/src/index.ts';
import historyDraft from '../packages/i18n/src/history-journey-draft.json' with { type: 'json' };
import { CERTIFICATE_DRAFT_MESSAGES } from '../packages/i18n/src/certificate-draft.ts';

const directory = resolve(process.argv[2] ?? 'apps/mobile/dist');
const published = publicCatalogue(catalogue);
const allowedKeys = new Set(textKeys(published));
const allowedTexts = new Set();
// Diese beiden Qualitätsnamen werden unabhängig vom Kursinhalt bereits von der
// öffentlichen P3.13-Akkord-Engine für freie Übungen ausgeliefert.
for (const term of ['Mollseptakkord', 'Dominantseptakkord']) allowedTexts.add(term);
// Allgemeine UI-/Glossarbegriffe sind schon öffentlich (z. B. „Dreiklänge“).
// Die Standard-Ressourcen laden nur veröffentlichte Inhaltstexte, niemals Authoring-Daten.
const resources = [RESOURCES];
while (resources.length > 0) {
  const value = resources.pop();
  if (typeof value === 'string') allowedTexts.add(value);
  else if (value && typeof value === 'object') resources.push(...Object.values(value));
}
for (const content of Object.values(contentMessages))
  for (const key of allowedKeys) allowedTexts.add(textAt({ content }, key));
const forbidden = new Map();
for (const id of ['certificate-draft-1', 'certificate-draft-2']) forbidden.set(id, `P4.18 ${id}`);
for (const [locale, messages] of Object.entries(CERTIFICATE_DRAFT_MESSAGES))
  for (const key of ['title', 'intro', 'policy', 'pdfTitle'])
    forbidden.set(messages[key], `P4.18 ${locale}.${key}`);
for (const collection of COLLECTIONS)
  for (const record of catalogue[collection])
    if (record.status !== 'freigegeben') forbidden.set(record.id, record.id);
for (const key of textKeys(catalogue))
  if (!allowedKeys.has(key))
    for (const content of Object.values(contentMessages)) {
      const text = textAt({ content }, key);
      if (text && !allowedTexts.has(text)) forbidden.set(text, key);
    }
for (const [locale, stories] of Object.entries(historyDraft))
  for (const [era, copy] of Object.entries(stories))
    for (const [field, value] of Object.entries(copy))
      for (const text of Array.isArray(value) ? value : [value])
        if (typeof text === 'string' && text.length > 24 && !allowedTexts.has(text))
          forbidden.set(text, `P4.12 ${locale}.${era}.${field}`);
const files = [];
function visit(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const full = resolve(path, entry.name);
    if (entry.isDirectory()) visit(full);
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(full);
  }
}
visit(directory);
if (files.length === 0)
  throw new Error('Kein JavaScript-Bundle gefunden. Zuerst den Produktions-Export bauen.');
for (const file of files) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.JS,
  );
  const nodes = [source];
  while (nodes.length > 0) {
    const node = nodes.pop();
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const key = forbidden.get(node.text);
      if (key) throw new Error(`Entwurfsinhalt im öffentlichen Bundle gefunden: ${key}`);
    }
    ts.forEachChild(node, (child) => {
      nodes.push(child);
    });
  }
}
console.log(
  `Öffentlichen Export geprüft: ${files.length} JavaScript-Dateien ohne unveröffentlichte Katalog-IDs oder Inhaltstexte.`,
);

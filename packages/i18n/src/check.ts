// Prüfung der Übersetzungen (läuft in der CI über tools/check-translations.ts):
// gleiche Schlüssel in allen Sprachen, keine leeren Texte, vollständige Pluralformen,
// gleiche Platzhalter und gültige Verweise ($t(…)).

import type { AppLocale } from './locale.ts';
import type { MessageTree } from './messages/types.ts';
import { RESOURCES } from './resources.ts';

export type ResourceSet = Readonly<Record<AppLocale, Readonly<Record<string, MessageTree>>>>;

/** Vollständige Sprachen; die erste gibt die Schlüssel vor. */
const COMPLETE: readonly AppLocale[] = ['de', 'en-US'];

/** Varianten mit nur einem Teil der Texte und ihre Rückfallsprache. */
const PARTIAL: Readonly<Partial<Record<AppLocale, AppLocale>>> = { 'en-GB': 'en-US' };

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;
const PLACEHOLDER = /\{\{\s*([^\s,}]+)\s*(?:,[^}]*)?\}\}/g;
const NESTING = /\$t\(([^,)]+)(?:,[^)]*)?\)/g;

type Flat = ReadonlyMap<string, string>;

/** Alle Probleme als lesbare Zeilen; leer, wenn alles stimmt. */
export function checkTranslations(resources: ResourceSet = RESOURCES): string[] {
  const problems: string[] = [];
  const [reference = 'de'] = COMPLETE;
  const namespaces = Object.keys(resources[reference]);

  for (const ns of namespaces) {
    const flat = (locale: AppLocale): Flat => flatten(resources[locale][ns] ?? {});
    const where = (locale: AppLocale, key: string): string => `${locale} ${ns}:${key}`;

    for (const locale of [...COMPLETE, ...(Object.keys(PARTIAL) as AppLocale[])]) {
      for (const [key, value] of flat(locale)) {
        if (value.trim() === '') {
          problems.push(`${where(locale, key)}: leerer Text`);
        }
      }
      for (const [base, keys] of groups(flat(locale))) {
        const missing = missingPluralForms(locale, keys);
        if (missing.length > 0) {
          problems.push(`${where(locale, base)}: Pluralformen fehlen (${missing.join(', ')})`);
        }
      }
    }

    // Vollständige Sprachen: gleiche Schlüssel, gleiche Platzhalter wie die Referenz
    const referenceGroups = groups(flat(reference));
    for (const locale of COMPLETE.slice(1)) {
      const localeGroups = groups(flat(locale));
      for (const base of referenceGroups.keys()) {
        if (!localeGroups.has(base)) {
          problems.push(`${where(locale, base)}: fehlt (vorhanden in ${reference})`);
        }
      }
      for (const [base, keys] of localeGroups) {
        const referenceKeys = referenceGroups.get(base);
        if (referenceKeys === undefined) {
          problems.push(`${where(locale, base)}: gibt es in ${reference} nicht`);
          continue;
        }
        if (isPlural(keys) !== isPlural(referenceKeys)) {
          problems.push(`${where(locale, base)}: Pluralformen nur in einer der Sprachen`);
        }
        const expected = placeholders(flat(reference), referenceKeys);
        const actual = placeholders(flat(locale), keys);
        if (!sameSet(expected, actual)) {
          problems.push(
            `${where(locale, base)}: Platzhalter ${format(actual)} statt ${format(expected)} wie in ${reference}`,
          );
        }
      }
    }

    // Varianten: nur Schlüssel der Basis, Pluralgruppen ganz oder gar nicht, keine neuen Platzhalter
    for (const [locale, baseLocale] of Object.entries(PARTIAL) as [AppLocale, AppLocale][]) {
      const baseGroups = groups(flat(baseLocale));
      for (const [base, keys] of groups(flat(locale))) {
        const baseKeys = baseGroups.get(base);
        if (baseKeys === undefined) {
          problems.push(`${where(locale, base)}: gibt es in ${baseLocale} nicht`);
          continue;
        }
        const missing = baseKeys.filter((k) => !keys.includes(k));
        if (missing.length > 0) {
          problems.push(
            `${where(locale, base)}: unvollständig überschrieben, es fehlt ${missing.join(', ')}`,
          );
        }
        const allowed = placeholders(flat(baseLocale), baseKeys);
        const extra = [...placeholders(flat(locale), keys)].filter((p) => !allowed.has(p));
        if (extra.length > 0) {
          problems.push(`${where(locale, base)}: unbekannte Platzhalter ${format(new Set(extra))}`);
        }
      }
    }
  }

  // Verweise $t(ns:key) müssen in jeder Sprache auflösbar sein
  for (const locale of [...COMPLETE, ...(Object.keys(PARTIAL) as AppLocale[])]) {
    const lookup = (ns: string, key: string): boolean => {
      const chain = [locale, ...(PARTIAL[locale] ? [PARTIAL[locale]] : [])];
      return chain.some((l) => {
        const flat = flatten(resources[l][ns] ?? {});
        return flat.has(key) || [...flat.keys()].some((k) => baseKey(k) === key);
      });
    };
    for (const ns of namespaces) {
      for (const [key, value] of flatten(resources[locale][ns] ?? {})) {
        for (const [, reference = ''] of value.matchAll(NESTING)) {
          const [targetNs, targetKey] = reference.includes(':')
            ? (reference.split(':', 2) as [string, string])
            : ['translation', reference];
          if (!lookup(targetNs, targetKey.trim())) {
            problems.push(`${locale} ${ns}:${key}: Verweis auf unbekannten Text ${reference}`);
          }
        }
      }
    }
  }

  return problems;
}

function flatten(tree: MessageTree, prefix = ''): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    if (typeof value === 'string') {
      result.set(path, value);
    } else {
      for (const [k, v] of flatten(value, path)) {
        result.set(k, v);
      }
    }
  }
  return result;
}

function baseKey(key: string): string {
  return key.replace(PLURAL_SUFFIX, '');
}

/** Schlüssel nach Grundform gruppiert: „x“, „x_one“, „x_other“ → x. */
function groups(flat: Flat): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const key of flat.keys()) {
    const base = baseKey(key);
    result.set(base, [...(result.get(base) ?? []), key]);
  }
  return result;
}

function isPlural(keys: readonly string[]): boolean {
  return keys.some((k) => PLURAL_SUFFIX.test(k));
}

/** Pluralkategorien, die die Sprache laut CLDR braucht (Deutsch und Englisch: one, other). */
function missingPluralForms(locale: AppLocale, keys: readonly string[]): string[] {
  if (!isPlural(keys)) {
    return [];
  }
  const base = baseKey(keys[0] ?? '');
  const required = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
  return required.filter((category) => !keys.includes(`${base}_${category}`));
}

function placeholders(flat: Flat, keys: readonly string[]): Set<string> {
  const names = new Set<string>();
  for (const key of keys) {
    for (const [, name = ''] of (flat.get(key) ?? '').matchAll(PLACEHOLDER)) {
      names.add(name);
    }
  }
  return names;
}

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  return a.size === b.size && [...a].every((x) => b.has(x));
}

function format(set: ReadonlySet<string>): string {
  return set.size === 0 ? '(keine)' : [...set].map((p) => `{{${p}}}`).join(', ');
}

import { describe, expect, it } from 'vitest';

import authored from './authored-content.json' with { type: 'json' };
import levelFour from './messages/level-four-exercise.json' with { type: 'json' };
import levelThree from './messages/level-three-exercise.json' with { type: 'json' };
import { createI18n } from './instance.ts';
import type { AppLocale } from './locale.ts';

// Stufe 3/4: Alle Karten-, Artikel-, Fähigkeits- und Aufgabentexte müssen über die echte i18n-Instanz in
// allen drei Sprachen lesbar rendern; Entwicklerhinweise und falsche US/UK-Schreibweisen sind verboten.
const LOCALES: readonly AppLocale[] = ['de', 'en-US', 'en-GB'];
const STAGES = ['levelThree', 'levelFour'] as const;
type Units = Record<string, Record<string, string>>;
const content = authored as unknown as Record<AppLocale, Record<string, { units: Units }>>;
const exercises: Record<AppLocale, Record<string, string>> = {
  de: { ...levelThree.de, ...levelFour.de },
  'en-US': { ...levelThree['en-US'], ...levelFour['en-US'] },
  'en-GB': { ...levelThree['en-GB'], ...levelFour['en-GB'] },
};

function instance(locale: AppLocale) {
  const i18n = createI18n(locale);
  i18n.addResourceBundle(locale, 'translation', { content: authored[locale] }, true, true);
  return i18n;
}

function entries(locale: AppLocale): [string, string, string][] {
  const found: [string, string, string][] = [];
  for (const stage of STAGES)
    for (const [slug, unit] of Object.entries(content[locale][stage]?.units ?? {}))
      for (const [key, value] of Object.entries(unit))
        found.push([`content.${stage}.units.${slug}.${key}`, `${stage}.${slug}.${key}`, value]);
  for (const [key, value] of Object.entries(exercises[locale]))
    found.push([`exercise.${key}`, `exercise.${key}`, value]);
  return found;
}

const DEVELOPER_NOTES =
  /getrennt prüfen|auf echten Geräten|Fehlerwiederholungen|klassifizieren nur|keine gemessene|real devices|check text and sound|measured listener|error review uses|separate(ly)? validat/i;
const US_ONLY_BAD =
  /\b(centre\w*|centred|metres?|favour\w*|realis\w*|idealis\w*|contextualis\w*|recognis\w*|neighbour\w*|colour\w*|bars?(?! line)|crotchets?|quavers?|minims?|staves|stave|leading[- ]note|tonal centre)\b/i;
const GB_ONLY_BAD =
  /\b(center\w*|meters?|favor\w*|realiz\w*|idealiz\w*|contextualiz\w*|recogniz\w*|neighbor\w*|color\w*|quarter[- ]notes?|half[- ]notes?|eighth[- ]notes?|sixteenth[- ]notes?|whole[- ]notes?|whole[- ]steps?|half[- ]steps?|measures?|staff|leading[- ]tone|emphasiz\w*|tonicization)\b/i;
const withoutReferences = (text: string) => text.replace(/\$t\([^)]*\)/g, ' ');

describe.each(LOCALES)('Stufe-3/4-Texte (%s)', (locale) => {
  const i18n = instance(locale);
  const all = entries(locale);

  it('enthält Karten, Artikel, Fähigkeiten und Aufgabentexte', () => {
    expect(all.length).toBeGreaterThan(700);
  });

  it('rendert jeden Text lesbar, ohne Rohschlüssel, Platzhalter oder Randleerzeichen', () => {
    for (const [key, label, raw] of all) {
      const text: string = i18n.t(key as never);
      expect(text, label).not.toMatch(/^(content|exercise)\./);
      expect(text.trim().length, label).toBeGreaterThan(0);
      expect(text, label).toBe(text.trim());
      expect(text, label).not.toMatch(/\$t\(|\{\{|undefined|NaN/);
      expect(raw, label).toBe(raw.trim());
    }
  });

  it('enthält keine Entwicklerhinweise', () => {
    const found = all.filter(([, , raw]) => DEVELOPER_NOTES.test(raw)).map(([, label]) => label);
    expect(found).toEqual([]);
  });

  it('verwendet die Schreibweise der gewählten Sprachvariante', () => {
    const pattern = locale === 'en-US' ? US_ONLY_BAD : locale === 'en-GB' ? GB_ONLY_BAD : undefined;
    if (!pattern) return;
    const found = all
      .filter(([, , raw]) => pattern.test(withoutReferences(raw)))
      .map(([, label]) => label);
    expect(found).toEqual([]);
  });
});

describe('Stufe-3/4-Texte: Fachbegriffe folgen der Variante', () => {
  it('Takt und Notenwert kommen aus dem Glossar', () => {
    expect(instance('en-US').t('content.levelThree.units.formsDesigns.rondoBody')).toContain(
      'measures',
    );
    expect(instance('en-GB').t('content.levelThree.units.formsDesigns.rondoBody')).toContain(
      'bars',
    );
    expect(instance('en-GB').t('content.levelFour.units.sonata.expositionCaption')).toContain(
      'crotchets',
    );
  });

  it('Tp und Sp sind in DE und EN erklärt', () => {
    expect(instance('de').t('content.levelThree.units.harmonyFunctions.subdominantBody')).toMatch(
      /Tonikaparallele \(Tp\).*Subdominantparallele \(Sp\)/,
    );
    expect(
      instance('en-US').t('content.levelThree.units.harmonyFunctions.subdominantBody'),
    ).toMatch(/Tp \(tonic parallel.*German function theory.*Roman numerals/);
  });
});

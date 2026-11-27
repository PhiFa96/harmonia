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

describe('Stufe 1–2 Korrekturen', () => {
  it('rendert beide deutschen Registerkarten mit dem richtigen Akkusativ', () => {
    const de = instance('de');
    expect(de.t('content.registerStart.repetitionBody' as never)).toContain(
      'den vollständigen Tonnamen',
    );
    expect(de.t('content.registerStart.matchBody' as never)).toContain(
      'den vollständigen Tonnamen',
    );
  });

  it.each(['en-US', 'en-GB'] as const)('beginnt englische Geschichtssätze groß (%s)', (locale) => {
    const i18n = instance(locale);
    expect(i18n.t('content.historySourcesStart.card9Body' as never)).toContain('Authorship asks');
    expect(i18n.t('content.historyOverviewStart.card6Body' as never)).toContain('Function asks');
    expect(i18n.t('content.historyOverviewStart.card8Body' as never)).toMatch(/^Source label may/);
  });
});

const titleFragments = [
  ['trebleNatural', /e¹ bis f²/, /E4 to F5/, /E4 to F5/],
  ['noteValues', /Sechzehntelnoten/, /sixteenth notes/, /semiquavers/],
  ['rests', /Sechzehntelpausen/, /sixteenth notes/, /semiquavers/],
  ['barlines', /Schlussstrich/, /final bar line/, /final bar line/],
  ['staff', /Linien und in Zwischenräumen/, /lines and in spaces/, /lines and in spaces/],
  ['trebleClef', /g¹ auf der zweiten Linie/, /G4 on the second line/, /G4 on the second line/],
  [
    'hearPulse',
    /zwei, drei oder vier Schlägen/,
    /two, three or four beats/,
    /two, three or four beats/,
  ],
  ['rhythmChoiceBasic', /und Pausen/, /and rests/, /and rests/],
  [
    'soundSource',
    /Aufnahme als Wiedergabemedium/,
    /recordings as a playback medium/,
    /recordings as a playback medium/,
  ],
  ['sourceTypes', /Programmzettel/, /programs/, /programmes/],
  ['genreFunction', /Funktion der Musik/, /function of music/, /function of music/],
  [
    'hearPitchDirection',
    /Höher, tiefer oder gleich/,
    /higher, lower and repeated/,
    /higher, lower and repeated/,
  ],
  ['countIn', /Auftakt/, /a pickup/, /an upbeat/],
  [
    'accidentalScope',
    /gleicher Ton, gleiche Oktavlage/,
    /same note, same octave/,
    /same note, same octave/,
  ],
  ['triplet', /Achteltriole/, /triplet eighth notes/, /triplet quavers/],
  [
    'majorBuild',
    /mit bis zu drei Vorzeichen/,
    /with up to three sharps or flats/,
    /with up to three sharps or flats/,
  ],
  [
    'triadInversions',
    /zweite Umkehrung bestimmen$/,
    /second-inversion triads$/,
    /second-inversion triads$/,
  ],
] as const;
describe('Korrigierte Titel in Stufen 1–2', () => {
  it.each(titleFragments)(
    'rendert den korrigierten Titel %s in allen Sprachen',
    (key, de, us, gb) => {
      for (const [locale, fragment] of [
        ['de', de],
        ['en-US', us],
        ['en-GB', gb],
      ] as const) {
        expect(instance(locale).t(`content.curriculum.skills.${key}` as never)).toMatch(fragment);
      }
    },
  );
});

describe('Korrigierte Begriffe und Grammatik in Stufen 1–2', () => {
  const de = instance('de');
  const us = instance('en-US');
  const gb = instance('en-GB');
  it('rendert Halbtöne und Zählgruppen in korrektem Kasus', () => {
    expect(de.t('content.keyboardStart.stepsBody' as never)).toMatch(
      /besteht aus zwei Schritten zu je einem Halbton/,
    );
    for (const [key, count] of [
      ['duple', 'zwei'],
      ['triple', 'drei'],
      ['quadruple', 'vier'],
    ] as const)
      expect(de.t(`exercise.knowledge_beatGroup_${key}`)).toContain(`aus ${count} Schlägen`);
    expect(
      de.t('exercise.intervalExplanation', {
        from: 'C',
        to: 'F',
        diatonic: 4,
        distance: '5 Halbtöne',
        answer: 'reine Quarte',
      }),
    ).toContain('Klangabstand: 5 Halbtöne.');
  });
  it('verwendet britische Notensystem- und Halbtonbegriffe', () => {
    for (const key of ['extendTitle', 'upperArticle', 'matchArticle'])
      expect(gb.t(`content.registerStart.${key}` as never)).not.toMatch(/\bstaff\b/);
    expect(gb.t('content.registerStart.extendTitle' as never)).toContain('stave');
    expect(gb.t('content.registerStart.upperArticle' as never)).toContain('stave edge');
    expect(us.t('exercise.knowledgeHint_accidentals')).toMatch(
      /removing an alteration: sharps and flats/,
    );
    expect(gb.t('exercise.knowledgeHint_accidentals')).not.toContain('half step');
    expect(us.t('exercise.knowledgeHint_accidentals')).toContain('half step');
  });
  it('rendert Terzen im Plural und verwendet Herkunftsinformation', () => {
    for (const i18n of [us, gb]) {
      expect(i18n.t('content.auralPitchStart.card7Body' as never)).toContain('Both are thirds');
      expect(i18n.t('content.historyOverviewStart.card8Title' as never)).toContain('source label');
    }
    expect(de.t('content.historyOverviewStart.card8Title' as never)).toContain('Herkunftsangabe');
  });
  it('ordnet die Position zwischen zwei Schlägen dem zweiten Achtel zu', () => {
    expect(de.t('content.simpleMeterStart.readBody' as never)).toContain(
      'das zweite Achtel jedes Paares',
    );
    expect(us.t('content.simpleMeterStart.readBody' as never)).toContain('the second eighth');
    expect(gb.t('content.simpleMeterStart.readBody' as never)).toContain('the second quaver');
  });
  it('erzeugt deutsche Kasusformen und englische Grundformen aus demselben Glossar', () => {
    expect(de.t('glossary:noteName_one_acc' as never)).toBe('Tonnamen');
    expect(de.t('glossary:noteName_one_dat' as never)).toBe('Tonnamen');
    expect(de.t('glossary:noteName_one_gen' as never)).toBe('Tonnamens');
    for (const i18n of [us, gb])
      expect(i18n.t('glossary:noteName_one_acc' as never)).toBe('note name');
    expect(gb.t('glossary:notes.eighth_other_cap' as never)).toBe('Quavers');
  });
});

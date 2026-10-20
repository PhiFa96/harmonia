import { key, relativeKey, parallelKey } from '@harmonia/theory';
import { describe, expect, it } from 'vitest';

import type { GlossaryEntry } from './glossary.ts';
import { GLOSSARY, glossaryResource, noteValueEntries } from './glossary.ts';

const entries: [string, GlossaryEntry][] = Object.entries(GLOSSARY);

describe('Glossar: Form der Einträge', () => {
  it.each(entries)('%s: Begriffe nicht leer', (_, entry) => {
    for (const term of [entry.de, entry.en, ...(entry.enGB ? [entry.enGB] : [])]) {
      expect(term.term.trim()).not.toBe('');
      expect(term.plural?.trim()).not.toBe('');
    }
  });

  it.each(entries)('%s: Mehrzahl in allen Sprachen oder in keiner', (_, entry) => {
    const hasPlural = entry.de.plural !== undefined;
    expect(entry.en.plural !== undefined).toBe(hasPlural);
    if (entry.enGB) {
      expect(entry.enGB.plural !== undefined).toBe(hasPlural);
    }
  });

  it.each(entries)('%s: britischer Eintrag nur, wenn er abweicht', (_, entry) => {
    if (entry.enGB) {
      expect(entry.enGB).not.toEqual(entry.en);
    }
  });

  it('deutsche Substantive groß, englische Begriffe in Grundform klein', () => {
    for (const [id, entry] of entries) {
      // Ausnahme: das Versetzungszeichen „b“ (Duden: das b)
      if (id.startsWith('dynamic')) {
        // Italian performance directions are not German nouns.
        expect(entry.de.term, id).toBe(entry.de.term.toLowerCase());
      } else if (id === 'grandStaff' || id === 'scientificNotation') {
        // Adjektive bleiben klein; das folgende Substantiv wird großgeschrieben.
        expect(entry.de.term.split(' ')[1]?.[0], id).toMatch(/\p{Lu}/u);
      } else if (id !== 'flat') {
        expect(entry.de.term[0], id).toMatch(/\p{Lu}/u);
      }
      if (id === 'beatsPerMinute') expect(entry.en.term).toBe('BPM (beats per minute)');
      else if (id === 'helmholtzNotation') expect(entry.en.term).toBe('Helmholtz pitch notation');
      else if (
        ['medieval', 'renaissance', 'baroque', 'classicalPeriod', 'romanticPeriod'].includes(id)
      ) {
        const proper: Readonly<Record<string, string>> = {
          medieval: 'Middle Ages',
          renaissance: 'Renaissance',
          baroque: 'Baroque',
          classicalPeriod: 'Classical period',
          romanticPeriod: 'Romantic period',
        };
        expect(entry.en.term, id).toBe(proper[id]);
      } else expect(entry.en.term, id).toBe(entry.en.term.toLowerCase());
      expect(entry.enGB?.term ?? '', id).toBe((entry.enGB?.term ?? '').toLowerCase());
    }
  });
});

describe('Glossar: Fachbegriffe', () => {
  const term = <K extends keyof typeof GLOSSARY>(id: K): (typeof GLOSSARY)[K] => GLOSSARY[id];

  it('britische und amerikanische Begriffe (F02)', () => {
    expect(term('measure').en.term).toBe('measure');
    expect(term('measure').enGB.term).toBe('bar');
    expect(term('semitone').en.term).toBe('half step');
    expect(term('semitone').enGB.term).toBe('semitone');
    expect(term('wholeTone').en.term).toBe('whole step');
    expect(term('wholeTone').enGB.term).toBe('tone');
    expect(term('staff').enGB.term).toBe('stave');
    expect(term('meter').enGB.term).toBe('metre');
  });

  it('falsche Freunde: Paralleltonart = relative key, Varianttonart = parallel key', () => {
    expect(term('relativeKey').de.term).toBe('Paralleltonart');
    expect(term('parallelKey').de.term).toBe('Varianttonart');
    // Gegenprobe mit der Engine: Paralleltonart von C-Dur ist a-Moll, Varianttonart ist c-Moll.
    expect(relativeKey(key({ letter: 'C', alter: 0 }))).toMatchObject({
      tonic: { letter: 'A', alter: 0 },
      mode: 'minor',
    });
    expect(parallelKey(key({ letter: 'C', alter: 0 }))).toMatchObject({
      tonic: { letter: 'C', alter: 0 },
      mode: 'minor',
    });
  });

  it('Grundton: tonic (Tonleiter) und root (Akkord) sind getrennte Einträge', () => {
    expect(term('tonic').de.term).toBe('Grundton');
    expect(term('root').de.term).toBe('Grundton');
    expect([term('tonic').en.term, term('root').en.term]).toEqual(['tonic', 'root']);
  });

  it('Taktangabe (Zeichen) und Taktart (Art des Takts) sind verschieden', () => {
    expect(term('timeSignature').de.term).toBe('Taktangabe');
    expect(term('timeSignature').en.term).toBe('time signature');
    expect(term('meter').de.term).toBe('Taktart');
  });
});

describe('Glossar: Notenwerte aus der Engine', () => {
  // Eigene Erwartungstabelle als zweites Mittel neben den Namen der Engine (P1.11)
  const EXPECTED = {
    breve: ['doppelganze Noten', 'double whole notes', 'breves'],
    whole: ['ganze Noten', 'whole notes', 'semibreves'],
    half: ['halbe Noten', 'half notes', 'minims'],
    quarter: ['Viertelnoten', 'quarter notes', 'crotchets'],
    eighth: ['Achtelnoten', 'eighth notes', 'quavers'],
    sixteenth: ['Sechzehntelnoten', 'sixteenth notes', 'semiquavers'],
    thirtySecond: ['Zweiunddreißigstelnoten', 'thirty-second notes', 'demisemiquavers'],
    sixtyFourth: ['Vierundsechzigstelnoten', 'sixty-fourth notes', 'hemidemisemiquavers'],
  } as const;

  it.each(Object.entries(EXPECTED))('%s: Mehrzahl DE, US, UK', (value, [de, us, uk]) => {
    const entry = noteValueEntries('note')[value as keyof typeof EXPECTED];
    expect([entry.de.plural, entry.en.plural, entry.enGB?.plural]).toEqual([de, us, uk]);
  });

  it('Pausen', () => {
    const quarter = noteValueEntries('rest').quarter;
    expect([quarter.de.term, quarter.en.term, quarter.enGB?.term]).toEqual([
      'Viertelpause',
      'quarter rest',
      'crotchet rest',
    ]);
    expect([quarter.de.plural, quarter.en.plural, quarter.enGB?.plural]).toEqual([
      'Viertelpausen',
      'quarter rests',
      'crotchet rests',
    ]);
  });
});

describe('Glossar als i18next-Namensraum', () => {
  it('Grundform, Einzahl und Mehrzahl', () => {
    const de = glossaryResource('de');
    expect(de['measure']).toBe('Takt');
    expect(de['measure_one']).toBe('Takt');
    expect(de['measure_other']).toBe('Takte');
    expect(de['tempo']).toBe('Tempo');
    expect(de['tempo_other']).toBeUndefined();
    expect(de['notes']).toMatchObject({ quarter: 'Viertelnote', quarter_other: 'Viertelnoten' });
  });

  it('en-GB enthält nur die britischen Abweichungen', () => {
    const { notes, rests, ...terms } = glossaryResource('en-GB');
    const ids = new Set(Object.keys(terms).map((k) => k.replace(/_(one|other)$/, '')));
    expect([...ids].sort()).toEqual([
      'grandStaff',
      'measure',
      'meter',
      'pickup',
      'programmeSource',
      'semitone',
      'staff',
      'wholeTone',
    ]);
    expect(terms['pickup_one']).toBe('upbeat');
    expect(notes).toMatchObject({ quarter: 'crotchet', quarter_other: 'crotchets' });
    expect(rests).toMatchObject({ half: 'minim rest' });
  });
});

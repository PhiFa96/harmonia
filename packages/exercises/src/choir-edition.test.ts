import { describe, expect, it } from 'vitest';
import { midi, analyzeVoiceLeading, parsePitch } from '@harmonia/theory';
import {
  createRng,
  generateChoir,
  SATB_DRAFT_RULES,
  SATB_VOICES,
  createLessonSession,
  answerLesson,
  nextLessonExercise,
  itemVariantKey,
  choirAnswerId,
  ratingBucket,
} from './index.ts';

describe('new choir music', () => {
  it.each(['alto', 'tenor'] as const)(
    '%s has at least three pitches across a major third',
    (voice) => {
      for (const piece of ['home', 'arch'] as const) {
        const item = generateChoir({ voice, piece, fifths: 0, edition: 2 }, createRng(1));
        const notes = item.parts[voice].map(midi);
        expect(new Set(notes).size).toBeGreaterThanOrEqual(3);
        expect(Math.max(...notes) - Math.min(...notes)).toBeGreaterThanOrEqual(4);
      }
    },
  );
  it('gives the two alto melodies different interval sequences', () => {
    const contour = (piece: 'home' | 'arch') => {
      const notes = generateChoir(
        { voice: 'alto', piece, fifths: 0, edition: 2 },
        createRng(1),
      ).parts.alto.map(midi);
      return notes.slice(1).map((note, index) => note - (notes[index] ?? note));
    };
    expect(contour('home')).not.toEqual(contour('arch'));
  });
  for (const piece of ['home', 'arch'] as const)
    for (const fifths of [-2, 0, 2] as const)
      it(`${piece}/${String(fifths)}: stays within voice and tracker ranges and follows the intended triads`, () => {
        const item = generateChoir({ voice: 'soprano', piece, fifths, edition: 2 }, createRng(1));
        const shift = fifths === -2 ? -2 : fifths === 2 ? 2 : 0;
        const expected =
          piece === 'home'
            ? [
                [0, 4, 7],
                [0, 4, 9],
                [0, 5, 9],
                [2, 5, 9],
                [2, 7, 11],
                [4, 7, 11],
                [2, 7, 11],
                [0, 4, 7],
              ]
            : [
                [0, 4, 7],
                [0, 5, 9],
                [0, 4, 9],
                [4, 7, 11],
                [2, 5, 9],
                [0, 5, 9],
                [2, 7, 11],
                [0, 4, 7],
              ];
        const slices = item.parts.soprano.map((_, index) => {
          const get = (voice: (typeof SATB_VOICES)[number]) => {
            const p = item.parts[voice][index];
            if (!p) throw Error('Missing composition pitch');
            const hz = 440 * 2 ** ((midi(p) - 69) / 12);
            expect(hz).toBeGreaterThanOrEqual(75);
            expect(hz).toBeLessThanOrEqual(1200);
            return p;
          };
          return {
            soprano: get('soprano'),
            alto: get('alto'),
            tenor: get('tenor'),
            bass: get('bass'),
          };
        });
        for (let index = 0; index < 8; index++) {
          const slice = slices[index];
          if (!slice) throw Error('Missing slice');
          const pcs = [
            ...new Set(Object.values(slice).map((p) => (midi(p) - shift + 12) % 12)),
          ].sort((a, b) => a - b);
          expect(pcs).toEqual(expected[index]);
        }
        const rules = Object.fromEntries(
          Object.entries(SATB_DRAFT_RULES)
            .filter(
              ([r]) =>
                !['leading-tone-resolution', 'seventh-resolution', 'doubled-leading-tone'].includes(
                  r,
                ),
            )
            .map(([r]) => [r, 'error' as const]),
        );
        const options = {
          ranges: {
            bass: { min: parsePitch('E2'), max: parsePitch('C4') },
            tenor: { min: parsePitch('C3'), max: parsePitch('G4') },
            alto: { min: parsePitch('G3'), max: parsePitch('D5') },
            soprano: { min: parsePitch('C4'), max: parsePitch('G5') },
          },
          maxMelodicInterval: 8,
          hiddenPerfectMotion: 'soprano-leap',
          contraryPerfectScope: 'all',
        } as const;
        expect(
          analyzeVoiceLeading(
            slices,
            { ...rules, 'contrary-fifth': 'error', 'contrary-octave': 'error' },
            options,
          ),
        ).toEqual([]);
      });
  it.each(SATB_VOICES)(
    '%s: reviews change contour and key and never duplicate either initial task',
    (voice) => {
      for (let seed = 0; seed < 50; seed++) {
        let lesson = createLessonSession(
          {
            id: 'choir.edition2',
            contentVersion: 29,
            exercises: [
              { type: 'CHOIR_PART', params: { voice, piece: 'home', fifths: 0, edition: 2 } },
              { type: 'CHOIR_PART', params: { voice, piece: 'arch', fifths: 2, edition: 2 } },
            ],
          },
          seed,
        );
        const keys = lesson.initial.items.map(itemVariantKey);
        for (let index = 0; index < 2; index++)
          lesson = nextLessonExercise(
            answerLesson(
              lesson,
              choirAnswerId(Array.from({ length: 8 }, () => Array<null>(12).fill(null))),
            ),
          );
        for (const index of [0, 1]) {
          const repeated = lesson.review?.items[index],
            original = lesson.initial.items[index];
          if (repeated?.type !== 'CHOIR_PART' || original?.type !== 'CHOIR_PART')
            throw Error('Missing choir review');
          expect(keys).not.toContain(itemVariantKey(repeated));
          expect(repeated.params.piece).not.toBe(original.params.piece);
          expect(repeated.params.fifths).not.toBe(original.params.fifths);
          const intervals = (notes: typeof repeated.parts.alto) =>
            notes.slice(1).map((p, i) => midi(p) - midi(notes[i] ?? p));
          expect(intervals(repeated.parts[voice])).not.toEqual(intervals(original.parts[voice]));
        }
      }
    },
  );
  it('separates revised ratings while retaining the original source profile', () => {
    const oldSpec = {
      type: 'CHOIR_PART',
      params: { voice: 'alto', piece: 'home', fifths: 0 },
    } as const;
    const revised = { ...oldSpec, params: { ...oldSpec.params, edition: 2 as const } };
    expect(ratingBucket(oldSpec, 25)).not.toBe(ratingBucket(revised, 29));
    expect(ratingBucket(oldSpec, 25)).toBe(
      'g2:1:25:CHOIR_PART:{"fifths":0,"piece":"home","voice":"alto"}',
    );
  });
});

import { describe, expect, it } from 'vitest';
import { exerciseSpecSchema } from './schema.ts';
import { catalogue } from './authoring.ts';
import { resolveLesson } from './catalogue.ts';
import { applyLessonAction } from './lesson-flow.ts';
import { lessonEvent, validateLearningEvent } from './learning-evidence.ts';
import {
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  isVoiceItem,
  nextLessonExercise,
} from '@harmonia/exercises';

describe('Mikrofon-Aufgabenschema', () => {
  it.each(['SIGHT_SING', 'SING_INTERVAL', 'PLAY_BACK'] as const)(
    'akzeptiert %s für Stufe 1–3',
    (type) => {
      for (const level of [1, 2, 3]) {
        expect(
          exerciseSpecSchema.safeParse({
            type,
            params: {
              level,
              clefs: ['treble'],
              range: { minMidi: 60, maxMidi: 76 },
              ...(type === 'SIGHT_SING' ? {} : { intervals: ['m3', 'M3'] }),
            },
          }).success,
        ).toBe(true);
      }
    },
  );

  it.each([0, 4, '2'])('verwirft ungültige Stufe %s', (level) => {
    expect(exerciseSpecSchema.safeParse({ type: 'SIGHT_SING', params: { level } }).success).toBe(
      false,
    );
  });
  it('verwirft fehlende Intervalle beim Nachspielen', () => {
    expect(exerciseSpecSchema.safeParse({ type: 'PLAY_BACK', params: { level: 2 } }).success).toBe(
      false,
    );
  });

  it('reproduziert einzeln übersprungene Mikrofonaufgaben ohne Fehlerwertung', () => {
    const id = 'aural.l1.pitch-intervals.intervals';
    const lesson = resolveLesson(catalogue, id);
    if (!lesson) throw new Error('Lektion fehlt');
    let state = createLessonSession(lesson, 'microphone-skip');
    while (state.phase === 'initial') {
      const item = currentItem(state.initial);
      if (!item) throw new Error('Aufgabe fehlt');
      state = isVoiceItem(item)
        ? applyLessonAction(state, { type: 'skipVoice' })
        : nextLessonExercise(answerLesson(state, expectedAnswer(item)));
    }
    expect(state.phase).toBe('complete');
    expect(state.initial.skipped).toHaveLength(4);
    expect(state.initial.records).toHaveLength(8);
    const event = lessonEvent(id, state, 1, 2);
    // ADR 0037: übersprungene Mikrofonaufgaben stehen nicht im Nenner (8 von 8 gezählten).
    expect(validateLearningEvent(catalogue, event).lesson).toMatchObject({
      eligibleCorrect: 8,
      total: 12,
      voiceSkipped: 4,
      passed: true,
    });
  });
});

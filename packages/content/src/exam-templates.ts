import type { ExamTemplate } from './exam.ts';

/** Original combinations of the versioned Harmonia exercise specifications. */
export const EXAM_TEMPLATES: readonly ExamTemplate[] = [
  {
    id: 'foundation',
    minutes: 20,
    pointsPerQuestion: 5,
    questions: [
      { lessonId: 'notation.l4.multivoice.lesson1', sourceIndex: 0, area: 'theory' },
      { lessonId: 'rhythm.l4.complex.lesson1', sourceIndex: 0, area: 'theory' },
      { lessonId: 'chords.l3.sevenths.lesson1', sourceIndex: 0, area: 'theory' },
      { lessonId: 'harmony.l3.functions.lesson1', sourceIndex: 0, area: 'theory' },
      { lessonId: 'harmony.l3.cadences.lesson1', sourceIndex: 0, area: 'theory' },
      { lessonId: 'forms.l3.phrases.lesson1', sourceIndex: 0, area: 'theory' },
      { lessonId: 'aural.l4.preparation.lesson1', sourceIndex: 0, area: 'aural' },
      { lessonId: 'aural.l4.preparation.lesson1', sourceIndex: 4, area: 'aural' },
      { lessonId: 'aural.l3.dictation.lesson1', sourceIndex: 0, area: 'aural' },
      { lessonId: 'aural.l3.dictation.lesson2', sourceIndex: 0, area: 'aural' },
      { lessonId: 'aural.l4.preparation.lesson2', sourceIndex: 0, area: 'aural' },
      { lessonId: 'aural.l4.preparation.lesson2', sourceIndex: 5, area: 'aural' },
    ],
  },
  {
    id: 'advanced',
    minutes: 30,
    pointsPerQuestion: 5,
    questions: [
      { lessonId: 'notation.l4.multivoice.lesson2', sourceIndex: 4, area: 'theory' },
      { lessonId: 'rhythm.l4.complex.lesson3', sourceIndex: 6, area: 'theory' },
      { lessonId: 'chords.l4.extensions.lesson1', sourceIndex: 4, area: 'theory' },
      { lessonId: 'harmony.l4.applied.lesson1', sourceIndex: 4, area: 'theory' },
      { lessonId: 'satz.l4.voice-leading.lesson1', sourceIndex: 4, area: 'theory' },
      { lessonId: 'satz.l4.figured-bass.lesson1', sourceIndex: 4, area: 'theory' },
      { lessonId: 'forms.l4.sonata.lesson1', sourceIndex: 0, area: 'theory' },
      { lessonId: 'analysis.l4.score.lesson1', sourceIndex: 0, area: 'theory' },
      { lessonId: 'aural.l4.preparation.lesson1', sourceIndex: 0, area: 'aural' },
      { lessonId: 'aural.l4.preparation.lesson1', sourceIndex: 4, area: 'aural' },
      { lessonId: 'aural.l4.preparation.lesson2', sourceIndex: 0, area: 'aural' },
      { lessonId: 'aural.l4.preparation.lesson2', sourceIndex: 5, area: 'aural' },
      { lessonId: 'aural.l3.dictation.lesson1', sourceIndex: 0, area: 'aural' },
      { lessonId: 'aural.l3.dictation.lesson2', sourceIndex: 0, area: 'aural' },
      { lessonId: 'aural.l4.preparation.lesson2', sourceIndex: 1, area: 'aural' },
      { lessonId: 'aural.l4.preparation.lesson2', sourceIndex: 6, area: 'aural' },
    ],
  },
];

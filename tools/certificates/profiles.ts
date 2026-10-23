import type { ExamTemplate } from '../../packages/content/src/exam.ts';

/** Internal technical fixtures, not approved completion exams or passing policies. */
export const CERTIFICATE_PROFILES = [1, 2].map((stage) => {
  const theory =
    stage === 1
      ? [
          'notation.l1.staff.reading',
          'notation.l1.register.ledger',
          'rhythm.l1.values.notes',
          'rhythm.l1.values.rests',
          'rhythm.l1.simple-meter.meter',
          'intervals.l1.size.numbers',
          'intervals.l1.first-qualities.thirds',
          'intervals.l1.first-qualities.perfect',
        ]
      : [
          'notation.l2.clefs-registers.bass',
          'notation.l2.clefs-registers.bass',
          'scales.l2.keys.foundation',
          'scales.l2.keys.foundation',
          'intervals.l2.qualities-build.foundation',
          'intervals.l2.qualities-build.foundation',
          'chords.l2.qualities.foundation',
          'chords.l2.inversions.foundation',
        ];
  const aural =
    stage === 1
      ? Array<string>(4).fill('aural.l1.pitch-intervals.intervals')
      : [
          'aural.l2.melody.foundation',
          'aural.l2.melody.foundation',
          'aural.l2.triads.foundation',
          'aural.l2.triads.foundation',
        ];
  const template: ExamTemplate<'certificate-draft-1' | 'certificate-draft-2'> = {
    id: stage === 1 ? 'certificate-draft-1' : 'certificate-draft-2',
    minutes: 20,
    pointsPerQuestion: 5,
    questions: [
      ...theory.map((lessonId, index) => ({
        lessonId,
        sourceIndex: index % 2,
        area: 'theory' as const,
      })),
      ...aural.map((lessonId, index) => ({ lessonId, sourceIndex: index, area: 'aural' as const })),
    ],
  };
  return { id: template.id, stage, version: 1, thresholdPercent: 80, template } as const;
});

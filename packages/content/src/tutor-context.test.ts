import { describe, expect, it } from 'vitest';
import { tutorRequestSchema } from './tutor.ts';
import { tutorScopeSchema } from './tutor-interface.ts';

const scope = {
  locale: 'de',
  noteNaming: 'de',
  mode: 'explain',
  hintLevel: null,
  context: {
    source: { kind: 'practice', set: 'pitch', contentVersion: 1, seed: 'tutor-context', index: 0 },
    answer: 'submitted-answer',
    checked: false,
  },
};
const request = {
  ...scope,
  id: '11111111-1111-4111-8111-111111111111',
  conversationId: '22222222-2222-4222-8222-222222222222',
  message: 'Erkläre meine Antwort',
};

describe('tutor context admission', () => {
  it.each([false, true])(
    'accepts a submitted answer for server evaluation with checked=%s',
    (checked) => {
      const context = { ...scope.context, checked };
      expect(tutorRequestSchema.safeParse({ ...request, context }).success).toBe(true);
      expect(tutorScopeSchema.safeParse({ ...scope, context }).success).toBe(true);
    },
  );
  it.each([false, true])('checked=%s cannot replace the missing answer or source', (checked) => {
    const context = { ...scope.context, checked, answer: null };
    expect(tutorRequestSchema.safeParse({ ...request, context }).success).toBe(false);
    expect(tutorScopeSchema.safeParse({ ...scope, context }).success).toBe(false);
    expect(tutorRequestSchema.safeParse({ ...request, context: null }).success).toBe(false);
  });
  it('keeps explicit solution mode separate from answer evaluation', () => {
    expect(
      tutorRequestSchema.safeParse({
        ...request,
        mode: 'solution',
        context: { ...scope.context, answer: null },
      }).success,
    ).toBe(true);
    expect(tutorRequestSchema.safeParse({ ...request, mode: 'hint', hintLevel: 3 }).success).toBe(
      false,
    );
  });
  it('rejects client-supplied grading fields and non-boolean legacy metadata', () => {
    for (const extra of [
      { correct: true },
      { evaluation: { correct: true } },
      { solution: 'forged' },
    ])
      expect(
        tutorRequestSchema.safeParse({ ...request, context: { ...scope.context, ...extra } })
          .success,
      ).toBe(false);
    expect(
      tutorRequestSchema.safeParse({ ...request, context: { ...scope.context, checked: 'true' } })
        .success,
    ).toBe(false);
  });
});

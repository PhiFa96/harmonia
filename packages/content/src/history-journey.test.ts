import { describe, expect, it } from 'vitest';
import {
  chooseHistoryAnswer,
  checkHistoryQuestion,
  createHistoryQuestion,
} from './history-journey.ts';

describe('ungraded history question flow', () => {
  it.each([0, 1, 2] as const)('assesses every choice against correct index %s', (correct) => {
    for (const choice of [0, 1, 2] as const) {
      const selected = chooseHistoryAnswer(createHistoryQuestion(), choice);
      const assessed = checkHistoryQuestion(selected, correct);
      expect(assessed).toEqual({
        choice,
        feedback: choice === correct ? 'correct' : 'incorrect',
        attempts: 1,
      });
      expect(selected.feedback).toBe('unanswered');
    }
  });
  it('requires an answer and readiness before a check can change the question', () => {
    const empty = createHistoryQuestion();
    expect(checkHistoryQuestion(empty, 1)).toBe(empty);
    const selected = chooseHistoryAnswer(empty, 1);
    expect(checkHistoryQuestion(selected, 1, false)).toBe(selected);
    expect(checkHistoryQuestion(selected, 1, true).feedback).toBe('correct');
  });
  it('requires a different choice after an error and ignores repeated checks', () => {
    const wrong = checkHistoryQuestion(chooseHistoryAnswer(createHistoryQuestion(), 0), 1);
    expect(chooseHistoryAnswer(wrong, 0)).toBe(wrong);
    expect(checkHistoryQuestion(wrong, 1)).toBe(wrong);
    const selected = chooseHistoryAnswer(wrong, 2);
    expect(selected).toEqual({ choice: 2, feedback: 'unanswered', attempts: 1 });
    const second = checkHistoryQuestion(selected, 1);
    expect(second).toEqual({ choice: 2, feedback: 'incorrect', attempts: 2 });
    const correct = checkHistoryQuestion(chooseHistoryAnswer(second, 1), 1);
    expect(correct.feedback).toBe('correct');
    expect(correct.attempts).toBe(3);
  });
  it('locks a correct answer and does not count double activation as another attempt', () => {
    const correct = checkHistoryQuestion(chooseHistoryAnswer(createHistoryQuestion(), 1), 1);
    for (const choice of [0, 1, 2] as const)
      expect(chooseHistoryAnswer(correct, choice)).toBe(correct);
    expect(checkHistoryQuestion(correct, 1)).toBe(correct);
  });
  it('creates independent, empty questions for station and step changes', () => {
    const finished = checkHistoryQuestion(chooseHistoryAnswer(createHistoryQuestion(), 0), 0);
    const next = createHistoryQuestion();
    expect(next).toEqual({ choice: null, feedback: 'unanswered', attempts: 0 });
    expect(finished.feedback).toBe('correct');
  });
});

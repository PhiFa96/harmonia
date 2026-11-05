import { describe, expect, it } from 'vitest';
import {
  chooseHistoryAnswer,
  checkHistoryQuestion,
  createHistoryQuestion,
  createHistoryInterview,
  askHistoryInterview,
  revealHistoryHint,
} from './history-journey.ts';
import type { HistoryChoice } from './history-journey.ts';

describe('local scripted interview', () => {
  it('opens each reply and records each question once without changing the previous state', () => {
    const initial = createHistoryInterview();
    let state = initial;
    for (const question of [2, 0, 1] as const) state = askHistoryInterview(state, question);
    expect(initial).toEqual({ selected: null, asked: [] });
    expect(state).toEqual({ selected: 1, asked: [2, 0, 1] });
    expect(askHistoryInterview(state, 1)).toBe(state);
    expect(askHistoryInterview(state, 2)).toEqual({ selected: 2, asked: [2, 0, 1] });
  });
  it('rejects unknown question indices and keeps a new interview independent', () => {
    const state = askHistoryInterview(createHistoryInterview(), 0);
    for (const value of [-1, 3, NaN, 1.5])
      expect(askHistoryInterview(state, value as HistoryChoice)).toBe(state);
    expect(createHistoryInterview()).toEqual({ selected: null, asked: [] });
    expect(state).toEqual({ selected: 0, asked: [0] });
  });
});

describe('ungraded history question flow', () => {
  it('lets the user reveal the specific hint once after an error without another answer', () => {
    const empty = createHistoryQuestion();
    expect(revealHistoryHint(empty)).toBe(empty);
    const wrong = checkHistoryQuestion(chooseHistoryAnswer(empty, 0), 1);
    const selected = chooseHistoryAnswer(wrong, 2);
    for (const state of [wrong, selected]) {
      const hinted = revealHistoryHint(state);
      expect(hinted).toEqual({ ...state, hintLevel: 2 });
      expect(revealHistoryHint(hinted)).toBe(hinted);
      expect(hinted.attempts).toBe(1);
      expect(hinted.feedback).toBe(state.feedback);
    }
    const correct = checkHistoryQuestion(chooseHistoryAnswer(wrong, 1), 1);
    expect(revealHistoryHint(correct)).toBe(correct);
  });
  it('ignores invalid answer indices without changing the current question', () => {
    const state = createHistoryQuestion();
    for (const choice of [-1, 3, NaN, 0.5])
      expect(chooseHistoryAnswer(state, choice as HistoryChoice)).toBe(state);
  });
  it('offers a general hint after the first error and a more specific hint after the second', () => {
    const initial = createHistoryQuestion();
    expect(initial).toHaveProperty('hintLevel', 0);
    const first = checkHistoryQuestion(chooseHistoryAnswer(initial, 0), 1);
    expect(first).toHaveProperty('hintLevel', 1);
    expect(checkHistoryQuestion(first, 1)).toBe(first);
    const selected = chooseHistoryAnswer(first, 2);
    expect(selected).toHaveProperty('hintLevel', 1);
    const second = checkHistoryQuestion(selected, 1);
    expect(second).toHaveProperty('hintLevel', 2);
    const correct = checkHistoryQuestion(chooseHistoryAnswer(second, 1), 1);
    expect(correct.feedback).toBe('correct');
    expect(createHistoryQuestion()).toHaveProperty('hintLevel', 0);
  });
  it.each([0, 1, 2] as const)('assesses every choice against correct index %s', (correct) => {
    for (const choice of [0, 1, 2] as const) {
      const selected = chooseHistoryAnswer(createHistoryQuestion(), choice);
      const assessed = checkHistoryQuestion(selected, correct);
      expect(assessed).toEqual({
        choice,
        feedback: choice === correct ? 'correct' : 'incorrect',
        attempts: 1,
        hintLevel: choice === correct ? 0 : 1,
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
    expect(selected).toEqual({ choice: 2, feedback: 'unanswered', attempts: 1, hintLevel: 1 });
    const second = checkHistoryQuestion(selected, 1);
    expect(second).toEqual({ choice: 2, feedback: 'incorrect', attempts: 2, hintLevel: 2 });
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
    expect(next).toEqual({ choice: null, feedback: 'unanswered', attempts: 0, hintLevel: 0 });
    expect(finished.feedback).toBe('correct');
  });
});

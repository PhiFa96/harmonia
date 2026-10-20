import { describe, expect, it } from 'vitest';
import { currentItem, expectedAnswer, isAuralExercise } from '@harmonia/exercises';
import { catalogue, examTemplates } from './authoring.ts';
import { catalogue as published, examTemplates as publishedTemplates } from './published.ts';
import {
  answerExam,
  availableExamTemplates,
  createExamRun,
  examResult,
  finishExam,
  skipExamAural,
} from './exam.ts';

describe('Prüfungssimulation', () => {
  it('hat zwei spielbare, gemischte Vorlagen; unveröffentlichte Inhalte bleiben verborgen', () => {
    expect(availableExamTemplates(catalogue, examTemplates).map((template) => template.id)).toEqual(
      ['foundation', 'advanced'],
    );
    expect(availableExamTemplates(published, publishedTemplates)).toEqual([]);
    expect(() => createExamRun(published, publishedTemplates, 'foundation', 1, 1000)).toThrow();
    for (const template of availableExamTemplates(catalogue, examTemplates)) {
      const run = createExamRun(catalogue, examTemplates, template.id, 'same-seed', 1000);
      expect(run.session.items).toHaveLength(template.questions.length);
      expect(
        template.questions.filter((question) => question.area === 'theory').length,
      ).toBeGreaterThan(0);
      expect(
        template.questions.filter((question) => question.area === 'aural').length,
      ).toBeGreaterThan(0);
      expect(
        createExamRun(catalogue, examTemplates, template.id, 'same-seed', 1000).session.items,
      ).toEqual(run.session.items);
      expect(run.deadlineAt).toBe(1000 + template.minutes * 60_000);
    }
  });

  it('wertet erst nach dem Durchgang und zählt jede Frage nur einmal', () => {
    let run = createExamRun(catalogue, examTemplates, 'foundation', 91, 1000);
    const first = currentItem(run.session);
    if (!first) throw new Error('Erste Aufgabe fehlt');
    run = answerExam(run, expectedAnswer(first), 1001);
    expect(run.session.records).toHaveLength(1);
    expect(run.session.index).toBe(1);
    for (let now = 1002; run.endedAt === undefined; now++) {
      const item = currentItem(run.session);
      if (!item) throw new Error('Aufgabe fehlt');
      run = answerExam(run, expectedAnswer(item), now);
    }
    const result = examResult(run);
    expect(run.endReason).toBe('completed');
    expect(result.points).toBe(result.maxPoints);
    expect(result.areas.map((area) => area.correct)).toEqual([6, 6]);
    expect(result.recommendations).toEqual([]);
    expect(answerExam(run, 'wrong', run.endedAt + 1)).toBe(run);
  });

  it('stoppt an der Frist und empfiehlt Lektionen für Fehler und Auslassungen', () => {
    const initial = createExamRun(catalogue, examTemplates, 'advanced', 'deadline', 1000);
    const first = currentItem(initial.session);
    if (!first) throw new Error('Erste Aufgabe fehlt');
    const expired = answerExam(initial, expectedAnswer(first), initial.deadlineAt);
    expect(expired.endReason).toBe('timeout');
    expect(expired.session.records).toHaveLength(0);
    const result = examResult(expired);
    expect(result.points).toBe(0);
    expect(result.maxPoints).toBe(80);
    expect(result.recommendations).toHaveLength(3);
    expect(result.areas.map((area) => area.maxPoints)).toEqual([40, 40]);
    expect(finishExam(initial, 1500).endReason).toBe('submitted');
  });

  it('wertet eine falsche Antwort mit null Punkten und empfiehlt die Quelllektion', () => {
    const initial = createExamRun(catalogue, examTemplates, 'foundation', 'wrong', 1000);
    const first = currentItem(initial.session);
    if (!first) throw new Error('Erste Aufgabe fehlt');
    const wrong = first.choices.find((choice) => choice !== expectedAnswer(first));
    if (!wrong) throw new Error('Falsche Auswahl fehlt');
    const run = finishExam(answerExam(initial, wrong, 1001), 1002);
    expect(run.session.records).toHaveLength(1);
    expect(run.session.records[0]?.result.correct).toBe(false);
    expect(examResult(run).areas.map((area) => area.points)).toEqual([0, 0]);
    expect(examResult(run).recommendations).toContain(initial.template.questions[0]?.lessonId);
  });

  it('überspringt bei Hörproblemen alle offenen Hörfragen ohne Gratispunkte', () => {
    let run = createExamRun(catalogue, examTemplates, 'foundation', 'no-audio', 1000);
    for (let now = 1001; run.template.questions[run.session.index]?.area === 'theory'; now++) {
      const item = currentItem(run.session);
      if (!item) throw new Error('Aufgabe fehlt');
      run = answerExam(run, expectedAnswer(item), now);
    }
    run = skipExamAural(run, 2000);
    expect(run.endReason).toBe('completed');
    expect(examResult(run).areas.map((area) => area.points)).toEqual([30, 0]);
    expect(run.session.skipped).toHaveLength(6);
  });
});

describe('Prüfungsbereiche', () => {
  it('ordnet jede Frage dem Bereich zu, den ihre Aufgabenart tatsächlich verlangt', () => {
    for (const template of availableExamTemplates(catalogue, examTemplates)) {
      for (const seed of [1, 2, 3]) {
        const run = createExamRun(catalogue, examTemplates, template.id, seed, 1000);
        template.questions.forEach((question, index) => {
          const item = run.session.items[index];
          if (!item) throw new Error('Aufgabe fehlt');
          expect(
            isAuralExercise(item) ? 'aural' : 'theory',
            `${template.id} #${String(index)} ${question.lessonId}`,
          ).toBe(question.area);
        });
      }
    }
  });
});

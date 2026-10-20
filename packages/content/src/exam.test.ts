import { describe, expect, it } from 'vitest';
import { currentItem, expectedAnswer, isAuralExercise } from '@harmonia/exercises';
import { catalogue, examTemplates } from './authoring.ts';
import { lessonExerciseSources } from './catalogue.ts';
import { catalogue as published, examTemplates as publishedTemplates } from './published.ts';
import {
  answerExam,
  availableExamTemplates,
  createExamRun,
  examEndKey,
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
    // Der Abschluss darf nicht „alle bearbeitet“ behaupten: Auswertung nennt die übersprungenen Fragen.
    const result = examResult(run);
    expect(result.skipped).toBe(6);
    expect(result.unanswered).toBe(6);
    expect(examEndKey(run, result)).toBe('skippedAural');
  });

  it('wählt den Abschlusstext nach dem tatsächlichen Verlauf', () => {
    let full = createExamRun(catalogue, examTemplates, 'foundation', 'complete', 1000);
    for (let now = 1001; full.endedAt === undefined; now++) {
      const item = currentItem(full.session);
      if (!item) throw new Error('Aufgabe fehlt');
      full = answerExam(full, expectedAnswer(item), now);
    }
    expect(examResult(full)).toMatchObject({ skipped: 0, unanswered: 0 });
    expect(examEndKey(full, examResult(full))).toBe('completed');
    const early = finishExam(createExamRun(catalogue, examTemplates, 'advanced', 3, 1000), 2000);
    expect(examEndKey(early, examResult(early))).toBe('submitted');
    expect(examResult(early).unanswered).toBe(16);
    const late = finishExam(early, 5_000_000);
    expect(late).toBe(early);
    const timeout = finishExam(createExamRun(catalogue, examTemplates, 'advanced', 3, 1000), 1e9);
    expect(examEndKey(timeout, examResult(timeout))).toBe('timeout');
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

  it('schreibt pro Frage die erwartete Aufgabenart fest, damit Umsortierungen auffallen', () => {
    const expected = {
      foundation: [
        'theory:KNOWLEDGE_MC',
        'theory:KNOWLEDGE_MC',
        'theory:CHORD_IDENTIFY',
        'theory:FUNCTION_ANALYSIS',
        'theory:KNOWLEDGE_MC',
        'theory:KNOWLEDGE_MC',
        'aural:INTERVAL_IDENTIFY_AURAL',
        'aural:CHORD_IDENTIFY',
        'aural:MELODY_DICTATION',
        'aural:RHYTHM_DICTATION',
        'aural:MELODY_DICTATION',
        'aural:RHYTHM_DICTATION',
      ],
      advanced: [
        'theory:CONTEXT_CHOICE',
        'theory:KNOWLEDGE_MC',
        'theory:CHORD_IDENTIFY',
        'theory:FUNCTION_ANALYSIS',
        'theory:CONTEXT_CHOICE',
        'theory:CONTEXT_CHOICE',
        'theory:KNOWLEDGE_MC',
        'theory:KNOWLEDGE_MC',
        'aural:INTERVAL_IDENTIFY_AURAL',
        'aural:CHORD_IDENTIFY',
        'aural:MELODY_DICTATION',
        'aural:RHYTHM_DICTATION',
        'aural:MELODY_DICTATION',
        'aural:RHYTHM_DICTATION',
        'aural:MELODY_DICTATION',
        'aural:RHYTHM_DICTATION',
      ],
    } as const;
    for (const template of availableExamTemplates(catalogue, examTemplates))
      expect(
        template.questions.map(
          (question) =>
            `${question.area}:${lessonExerciseSources(catalogue, question.lessonId)?.[question.sourceIndex]?.spec.type ?? '?'}`,
        ),
        template.id,
      ).toEqual(expected[template.id]);
  });

  it('erzeugt innerhalb eines Durchgangs keine zwei identischen Aufgaben', () => {
    for (const template of availableExamTemplates(catalogue, examTemplates))
      for (let seed = 0; seed < 25; seed++) {
        const run = createExamRun(catalogue, examTemplates, template.id, seed, 1000);
        const keys = run.session.items.map((item) => JSON.stringify(item));
        expect(new Set(keys).size, `${template.id} Seed ${String(seed)}`).toBe(keys.length);
      }
  });
});

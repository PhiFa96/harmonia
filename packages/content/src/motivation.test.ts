import { describe, it, expect } from 'vitest';
import { firstLesson } from './authoring.ts';
import {
  DEFAULT_REWARD_RULE,
  streakSummary,
  motivationSummary,
  rewardRuleAt,
  rewardRuleSchema,
  motivationRequestSchema,
} from './motivation.ts';
import type { MotivationActivity, FreezePurchase, MotivationPreferences } from './motivation.ts';
import { reminderTimes, reminderDue, reminderTTL } from './reminders.ts';
import { lessonReward } from './lesson-rewards.ts';
import {
  createLessonSession,
  activeLessonSession,
  currentItem,
  expectedAnswer,
  answerLesson,
  nextLessonExercise,
} from '@harmonia/exercises';
const at = (date: string) => Date.parse(date);
const activity = (date: string, id = date, timeZone = 'UTC'): MotivationActivity => ({
  id,
  at: at(date),
  timeZone,
  qualified: true,
  amount: 18,
  coins: 3,
});
const week = (start = '2026-10-01'): MotivationActivity[] =>
  Array.from({ length: 7 }, (_, n) =>
    activity(new Date(at(`${start}T12:00:00Z`) + n * 86400000).toISOString()),
  );
const purchase = (date: string, id = '00000000-0000-4000-8000-000000000001'): FreezePurchase => ({
  id,
  at: at(date),
  price: 10,
  ruleVersion: 1,
  timeZone: 'UTC',
});
const prefs: MotivationPreferences = {
  dailyGoal: 20,
  reminderConsent: true,
  reminderTime: '18:00',
  timeZone: 'Europe/Berlin',
  locale: 'de',
};
describe('Streak, Münzen, Reisen und serverseitige Regeln', () => {
  it('verbraucht gekauften Schutz nur für eine bestehende Serie, nicht während einer bereits unterbrochenen Pause', () => {
    const days = [activity('2026-10-01T12:00Z')],
      purchases = [purchase('2026-10-10T12:00Z')];
    expect(streakSummary(days, at('2026-10-15T12:00Z'), 'UTC', purchases)).toMatchObject({
      current: 0,
      freezesUsed: 0,
      freezesAvailable: 1,
    });
    expect(
      streakSummary(
        [...days, activity('2026-10-16T12:00Z')],
        at('2026-10-18T12:00Z'),
        'UTC',
        purchases,
      ),
    ).toMatchObject({ current: 1, freezesUsed: 1, freezesAvailable: 0 });
  });
  it('lässt einen späten Push spätestens um 21 Uhr Ortszeit verfallen', () => {
    expect(reminderTTL(at('2026-10-14T18:59:30Z'), 'Europe/Berlin')).toBe(30);
    expect(reminderTTL(at('2026-10-14T19:00:00Z'), 'Europe/Berlin')).toBe(0);
    expect(reminderTTL(at('2026-10-14T16:00:00Z'), 'Europe/Berlin')).toBe(1800);
    expect(reminderTTL(at('2026-03-29T18:59:30Z'), 'Europe/Berlin')).toBe(30);
  });
  it('belohnt doppelte Tage einmal, verdient Schutz nach sieben Lerntagen und bewahrt eine Lücke ohne zusätzliche XP', () => {
    const days = week(),
      before = streakSummary([...days, ...days.slice(0, 1)], at('2026-10-08T12:00Z'), 'UTC');
    expect(before).toMatchObject({ current: 7, freezesAvailable: 1, daysUntilFreeze: 7 });
    const after = streakSummary(
      [...days, activity('2026-10-09T12:00Z')],
      at('2026-10-09T13:00Z'),
      'UTC',
    );
    expect(after).toMatchObject({ current: 8, freezesUsed: 1, freezesAvailable: 0, longest: 8 });
    expect(motivationSummary(days, at('2026-10-08T12:00Z'), 'UTC').todayXP).toBe(0);
  });
  it('verbraucht Schutz automatisch am geschlossenen verpassten Tag und startet nach einer längeren Lücke neu', () => {
    expect(streakSummary(week(), at('2026-10-09T12:00Z'), 'UTC')).toMatchObject({
      current: 7,
      freezesUsed: 1,
    });
    expect(streakSummary(week(), at('2026-10-10T12:00Z'), 'UTC')).toMatchObject({
      current: 0,
      longest: 7,
      freezesAvailable: 0,
    });
    expect(
      streakSummary([...week(), activity('2026-10-11T12:00Z')], at('2026-10-11T13:00Z'), 'UTC'),
    ).toMatchObject({ current: 1, longest: 7, daysUntilFreeze: 6 });
  });
  it('begrenzt den Vorrat auf zwei und berechnet spät geladene Offline-Tage erneut', () => {
    const days = Array.from({ length: 28 }, (_, n) =>
      activity(new Date(at('2026-09-01T12:00Z') + n * 86400000).toISOString()),
    );
    expect(streakSummary(days, at('2026-09-28T13:00Z'), 'UTC').freezesAvailable).toBe(2);
    const missing = week().filter((_a, i) => i !== 3),
      now = at('2026-10-08T12:00Z');
    expect(streakSummary(missing, now, 'UTC').current).toBe(3);
    expect(streakSummary(week(), now, 'UTC').current).toBe(7);
  });
  it.each(['Europe/Berlin', 'America/New_York', 'Pacific/Auckland', 'Asia/Kolkata', 'UTC'])(
    'zählt Mitternacht und Sommerzeit in %s',
    (timeZone) => {
      const base = at('2026-10-24T12:00Z'),
        days = Array.from({ length: 4 }, (_, n) => ({
          ...activity(new Date(base + n * 86400000).toISOString()),
          timeZone,
        }));
      expect(streakSummary(days, base + 3 * 86400000 + 1000, timeZone).current).toBe(4);
    },
  );
  it('bewahrt Reisen nach Osten, Westen und über die Datumsgrenze', () => {
    const west = activity('2026-10-02T03:00Z', 'one', 'America/Los_Angeles'),
      east = activity('2026-10-02T14:00Z', 'two', 'Pacific/Auckland');
    expect(streakSummary([west, east], at('2026-10-02T15:00Z'), 'Pacific/Auckland')).toMatchObject({
      current: 2,
      travel: true,
      freezesUsed: 0,
    });
    expect(
      streakSummary(
        [east, activity('2026-10-03T03:00Z', 'three', 'America/Los_Angeles')],
        at('2026-10-03T04:00Z'),
        'America/Los_Angeles',
      ),
    ).toMatchObject({ current: 1, travel: true });
    expect(streakSummary([west], at('2026-10-02T15:00Z'), 'Pacific/Auckland').current).toBe(1);
  });
  it('zählt echte mehrtägige Reisepausen und fehlgeschlagene Aufgaben nicht als Lerntage', () => {
    const a = activity('2026-10-01T12:00Z');
    expect(
      streakSummary(
        [a, activity('2026-10-04T12:00Z', 'later', 'Asia/Tokyo')],
        at('2026-10-04T13:00Z'),
        'Asia/Tokyo',
      ).current,
    ).toBe(1);
    expect(
      streakSummary([{ ...a, qualified: false }], at('2026-10-01T13:00Z'), 'UTC').current,
    ).toBe(0);
  });
  it('bucht Münzen und Schutz getrennt von XP und erstattet nach Offline-Replay überflüssigen Vorrat', () => {
    const days = week(),
      p = purchase('2026-10-07T13:00Z');
    expect(motivationSummary(days, at('2026-10-07T14:00Z'), 'UTC', 0, [p])).toMatchObject({
      coins: 11,
      totalXP: 126,
      streak: { freezesAvailable: 2 },
    });
    const more = Array.from({ length: 14 }, (_, n) =>
      activity(new Date(at('2026-10-01T12:00Z') + n * 86400000).toISOString()),
    );
    const refunded = motivationSummary(more, at('2026-10-14T14:00Z'), 'UTC', 0, [
      purchase('2026-10-14T13:00Z'),
    ]);
    expect(refunded.coins).toBe(42);
    expect(refunded.streak.refunds).toHaveLength(1);
  });
  it('zählt das Tagesziel in der aktuellen Ortszeit und unterdrückt Erinnerungen auch nach freiem Üben', () => {
    const a = activity('2026-10-13T23:30Z');
    expect(motivationSummary([a], at('2026-10-14T00:00Z'), 'Europe/Berlin').todayXP).toBe(18);
    expect(motivationSummary([a], at('2026-10-14T00:00Z'), 'UTC').todayXP).toBe(0);
    expect(
      motivationSummary([], at('2026-10-14T15:00Z'), 'Europe/Berlin', at('2026-10-14T13:00Z'))
        .practiced,
    ).toBe(true);
  });
  it('verwendet historische Regelversionen und lässt bestehende Gutschriften unverändert', () => {
    let session = createLessonSession(firstLesson, 1);
    while (session.phase === 'initial') {
      const active = activeLessonSession(session),
        item = active && currentItem(active);
      if (!item) throw new Error('Aufgabe fehlt');
      session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
    }
    const changed = {
      ...DEFAULT_REWARD_RULE,
      version: 2,
      effectiveAt: 1000,
      lesson: 20,
      repeat: 10,
      freezePrice: 15,
    };
    expect(lessonReward(session, false)).toBe(18);
    expect(lessonReward(session, false, changed)).toBe(28);
    expect(rewardRuleAt([changed, DEFAULT_REWARD_RULE], 999).version).toBe(1);
    expect(rewardRuleAt([changed, DEFAULT_REWARD_RULE], 1000).version).toBe(2);
    expect(() => rewardRuleSchema.parse({ ...changed, hintWeights: [100, 20, 80, 0] })).toThrow();
  });
  it('verwirft fremde Buchungs-/Kontofelder', () => {
    expect(() =>
      motivationRequestSchema.parse({
        deviceId: '00000000-0000-4000-8000-000000000001',
        deviceKey: '00000000-0000-4000-8000-000000000002',
        deviceRevision: 1,
        coins: 10000,
      }),
    ).toThrow();
  });
});
describe('Einwilligung, Ortszeit und Ruhezeit der Erinnerungen', () => {
  it('plant keine Erinnerung ohne Einwilligung oder nach heutigem Üben', () => {
    const now = at('2026-10-14T10:00Z');
    expect(reminderTimes(now, { ...prefs, reminderConsent: false }, false)).toEqual([]);
    expect(reminderTimes(now, prefs, true)[0]?.date).toBe('2026-10-15');
  });
  it('plant höchstens sieben einzelne Tage und wechselt den UTC-Zeitpunkt an der Zeitumstellung', () => {
    const times = reminderTimes(at('2026-10-24T10:00Z'), prefs, false);
    expect(times).toHaveLength(7);
    expect(times[0]?.at).toBe(at('2026-10-24T16:00Z'));
    expect(times[1]?.at).toBe(at('2026-10-25T17:00Z'));
    expect(new Set(times.map((t) => t.date)).size).toBe(7);
  });
  it('vermeidet eine zweite Erinnerung am selben Tag und in weniger als 23 Stunden', () => {
    const now = at('2026-10-14T16:30Z');
    expect(reminderTimes(now, prefs, false, at('2026-10-14T15:00Z'))[0]?.date).toBe('2026-10-15');
    expect(reminderDue(at('2026-10-14T19:00Z'), prefs, false)).toBe(false);
    expect(reminderDue(at('2026-10-14T16:00Z'), prefs, false)).toBe(true);
    expect(reminderDue(at('2026-10-14T16:00Z'), prefs, true)).toBe(false);
  });
});

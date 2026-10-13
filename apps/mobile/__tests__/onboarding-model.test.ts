import { expectedAnswer, evaluateExercise } from '@harmonia/exercises';
import {
  DEFAULT_SETTINGS,
  canContinue,
  completeOnboarding,
  miniSession,
  newOnboarding,
  nextOnboarding,
  parseDeviceSnapshot,
  previousOnboarding,
} from '@/onboarding/model';
import { completedDeviceFixture } from '../jest/device-fixture.ts';

describe('Onboarding-Ablauf und gespeicherte Eingaben', () => {
  it('fragt Ziel, Erfahrung und Einstufungswunsch wirklich ab und hat kein vorgewähltes Opt-in', () => {
    let d = nextOnboarding(newOnboarding(1000), 1100);
    expect(d.step).toBe('goal');
    expect(canContinue(d)).toBe(false);
    expect(nextOnboarding(d, 1200)).toBe(d);
    d = nextOnboarding({ ...d, goal: 'ensemble' }, 1300);
    expect(d.step).toBe('experience');
    expect(canContinue(d)).toBe(false);
    d = nextOnboarding({ ...d, experience: 'basics' }, 1400);
    expect(d.step).toBe('placement');
    expect(canContinue(d)).toBe(false);
    d = nextOnboarding({ ...d, placement: 'requested' }, 1500);
    expect(d.step).toBe('daily');
    d = nextOnboarding(d, 1600);
    expect(d.step).toBe('reminders');
    expect(d.reminderConsent).toBe(false);
    d = nextOnboarding(d, 1700);
    expect(d.step).toBe('mini');
    expect(d.firstTaskAt).toBe(1700);
    expect(d.completedAt).toBeNull();
    expect(canContinue(d)).toBe(false);
    expect(previousOnboarding(d).step).toBe('reminders');
    expect(nextOnboarding(previousOnboarding(d), 1800).firstTaskAt).toBe(1700);
  });
  it('ein Fehler in der Mini-Aufgabe sperrt den Einstieg nicht, die fehlende Altersbestätigung schon', () => {
    let d = {
      ...completedDeviceFixture(),
      step: 'mini' as const,
      completedAt: null,
      ageConfirmed: false,
    };
    const item = miniSession(d).items[0];
    if (!item) throw new Error('Aufgabe fehlt');
    const answer = item.choices.find((v) => v !== expectedAnswer(item));
    if (!answer) throw new Error('Falsche Antwort fehlt');
    d = { ...d, mini: { ...d.mini, answer } };
    expect(miniSession(d).result?.correct).toBe(false);
    const account = nextOnboarding(d, 2000);
    expect(account.step).toBe('account');
    expect(canContinue(account)).toBe(false);
    expect(() => completeOnboarding(account, 2100)).toThrow();
    expect(completeOnboarding({ ...account, ageConfirmed: true }, 2100).step).toBe('complete');
  });
  it('ein Konto verlangt eine bestätigte ID; kein lokaler Konto-Knopf erfindet eine Anmeldung', () => {
    const d = {
      ...completedDeviceFixture(),
      step: 'account' as const,
      completedAt: null,
      account: 'email' as const,
      accountId: null,
    };
    expect(canContinue(d)).toBe(false);
    expect(() => completeOnboarding(d, 2000)).toThrow();
    expect(canContinue({ ...d, accountId: '00000000-0000-4000-8000-000000000002' })).toBe(true);
  });
  it('100 Mini-Quellen werden reproduzierbar aus derselben Engine bewertet, auch nach JSON-Restore', () => {
    for (let seed = 0; seed < 100; seed++) {
      const d = newOnboarding(seed),
        item = miniSession(d).items[0];
      if (!item) throw new Error('Aufgabe fehlt');
      const done = {
        ...d,
        mini: { ...d.mini, checked: true, answer: expectedAnswer(item), hintLevel: 2 as const },
      };
      const restored = parseDeviceSnapshot(
        JSON.stringify({ schemaVersion: 1, settings: DEFAULT_SETTINGS, onboarding: done }),
      );
      expect(miniSession(restored.onboarding)).toEqual(miniSession(done));
      expect(miniSession(done).result).toMatchObject({ correct: true });
      expect(evaluateExercise(item, expectedAnswer(item))).toMatchObject({ correct: true });
    }
  });
  it.each([
    { schemaVersion: 2 },
    { settings: { ...DEFAULT_SETTINGS, locale: 'fr' } },
    { onboarding: { ...completedDeviceFixture(), ageConfirmed: false } },
    { onboarding: { ...completedDeviceFixture(), goal: null } },
    { onboarding: { ...completedDeviceFixture(), firstTaskAt: 999 } },
    { onboarding: { ...completedDeviceFixture(), completedAt: null } },
    { onboarding: { ...completedDeviceFixture(), accountId: 'admin' } },
    {
      onboarding: {
        ...completedDeviceFixture(),
        mini: { seed: 1000, checked: true, answer: 'unknown', hintLevel: 0 },
      },
    },
  ])('weist beschädigte oder fremde lokale Datensätze zurück: %j', (change) => {
    expect(() =>
      parseDeviceSnapshot(
        JSON.stringify({
          schemaVersion: 1,
          settings: DEFAULT_SETTINGS,
          onboarding: completedDeviceFixture(),
          ...change,
        }),
      ),
    ).toThrow();
  });
});

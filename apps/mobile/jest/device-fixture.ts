import { expectedAnswer } from '@harmonia/exercises';
import { newOnboarding, miniSession } from '../src/onboarding/model.ts';
import type { OnboardingData } from '../src/onboarding/model.ts';
/** Bestehende Screen-Tests beginnen mit einem bereits eingerichteten Gerät; neue Onboarding-Tests setzen explizit einen frischen Start. */
export function completedDeviceFixture(): OnboardingData {
  const draft = newOnboarding(1000),
    item = miniSession(draft).items[0];
  if (!item) throw new Error('Mini-Aufgabe fehlt');
  return {
    ...draft,
    step: 'complete',
    goal: 'hobby',
    experience: 'new',
    placement: 'later',
    ageConfirmed: true,
    firstTaskAt: 1100,
    completedAt: 1200,
    mini: { ...draft.mini, checked: true, answer: expectedAnswer(item) },
  };
}

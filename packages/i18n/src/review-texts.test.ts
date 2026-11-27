import { describe, expect, it } from 'vitest';
import { createI18n } from './instance.ts';

describe.each(['de', 'en-US', 'en-GB'] as const)('Wiederholungstexte %s', (locale) => {
  const i18n = createI18n(locale);
  it('bewertet die Erinnerung an die Erklärung nach dem Aufdecken', () => {
    expect(i18n.t('review.ratingHelp')).toContain(
      locale === 'de'
        ? 'wie gut du dich erinnert hast, bevor du die Erklärung gesehen hast'
        : 'how well you remembered before you saw the explanation',
    );
  });
  it.each([
    [1, 1],
    [1, 2],
    [2, 1],
    [2, 2],
  ])('verwendet die Plurale unabhängig für %s und %s', (skills, cards) => {
    const german = `${String(skills)} ${skills === 1 ? 'Fähigkeit' : 'Fähigkeiten'} und ${String(cards)} ${cards === 1 ? 'Wissenskarte' : 'Wissenskarten'} sind fällig.`;
    const english = `${String(skills)} ${skills === 1 ? 'skill' : 'skills'} and ${String(cards)} ${cards === 1 ? 'knowledge card' : 'knowledge cards'} are due.`;
    expect(i18n.t('review.due', { skills, cards })).toBe(locale === 'de' ? german : english);
  });
});

import { describe, expect, it } from 'vitest';

import { createI18n } from './instance.ts';

// Nacharbeit der Fachprüfung Phase 3: Pluralformen und Anweisungen, die zur Bedienung passen.
describe('Texte der Lernlogik', () => {
  it('Fälligkeitshinweis: Singular und Plural je Zahl', () => {
    const de = createI18n('de');
    expect(de.t('review.due', { skills: 1, cards: 1 })).toBe(
      '1 Fähigkeit und 1 Wissenskarte sind fällig.',
    );
    expect(de.t('review.due', { skills: 3, cards: 2 })).toBe(
      '3 Fähigkeiten und 2 Wissenskarten sind fällig.',
    );
    expect(de.t('review.due', { skills: 0, cards: 1 })).toBe(
      '0 Fähigkeiten und 1 Wissenskarte sind fällig.',
    );
    const en = createI18n('en-US');
    expect(en.t('review.due', { skills: 1, cards: 1 })).toBe(
      '1 skill and 1 knowledge card are due.',
    );
    expect(en.t('review.due', { skills: 4, cards: 2 })).toBe(
      '4 skills and 2 knowledge cards are due.',
    );
  });

  it('Freundesstand: „1 Tag“ statt „1 Tage“', () => {
    expect(createI18n('de').t('friends.stats', { count: 1, tier: 0 })).toBe(
      'Lernserie: 1 Tag · Liga-Stufe: 0',
    );
    expect(createI18n('de').t('friends.stats', { count: 5, tier: 2 })).toBe(
      'Lernserie: 5 Tage · Liga-Stufe: 2',
    );
    expect(createI18n('en-US').t('friends.stats', { count: 1, tier: 0 })).toBe(
      'Learning streak: 1 day · League tier: 0',
    );
    expect(createI18n('en-GB').t('friends.stats', { count: 7, tier: 1 })).toBe(
      'Learning streak: 7 days · League tier: 1',
    );
  });

  it('Bewertungshilfe der Karten: Selbsteinschätzung der Erinnerung, bevor die Erklärung zu sehen war', () => {
    // Die Bewertungsknöpfe erscheinen erst nach dem Aufdecken; der Text darf nichts anderes verlangen.
    for (const locale of ['de', 'en-US', 'en-GB'] as const) {
      const text = createI18n(locale).t('review.ratingHelp');
      expect(text).not.toMatch(/vor dem Aufdecken|before revealing/i);
      expect(text).toMatch(/bevor du die Erklärung|before you saw the explanation/);
    }
    // Beschriftungen beziehen sich auf die Erinnerung, nicht auf die Schwierigkeit des Stoffs.
    const de = createI18n('de');
    expect(de.t('review.hard')).toBe('Mit Mühe gewusst');
    expect(de.t('review.easy')).toBe('Mühelos gewusst');
    expect(createI18n('en-US').t('review.hard')).toBe('Remembered with effort');
    expect(createI18n('en-US').t('review.easy')).toBe('Remembered easily');
  });
});

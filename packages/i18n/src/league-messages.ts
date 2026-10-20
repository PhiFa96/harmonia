import type { AppLocale } from './locale.ts';
export function leagueResultMessage(locale: AppLocale) {
  return locale === 'de'
    ? {
        title: 'Dein Liga-Ergebnis',
        body: 'Die Woche ist abgeschlossen. Dein Ergebnis findest du in den Ligen.',
      }
    : { title: 'Your league result', body: 'The week has ended. Open Leagues to see your result.' };
}

import { lessonDay } from '@harmonia/content';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { useMotivation } from '@/state/motivation';
import { useAuthState } from '@/auth';
import { useSettings } from '@/state/settings';
import { i18n } from '@/i18n';
import { motivationFixture, motivationResponse } from '../jest/motivation-fixture';
beforeEach(async () => {
  useAuthState.setState({ ready: true, session: null });
  useSettings.setState({ locale: 'de' });
  await i18n.changeLanguage('de');
});
function confirmed() {
  const data = motivationFixture(),
    server = motivationResponse();
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  data.preferences.timeZone = zone;
  server.summary.timeZone = zone;
  server.summary.today = lessonDay(Date.now(), zone);
  server.summary.todayXP = 30;
  server.summary.totalXP = 30;
  server.summary.coins = 9;
  server.summary.streak.current = 2;
  data.server = server;
  data.serverEvidenceKey = '[]';
  useMotivation.setState({ data, phase: 'ready', scope: 'guest' });
}
it('zeigt den aktuellen Tagesfortschritt kompakt im Lernpfad und die erklärten Schutzregeln im Profil', () => {
  confirmed();
  const app = renderRouter('./src/app', { initialUrl: '/' });
  expect(screen.getByText('30 von 20 XP')).toBeTruthy();
  expect(screen.getByText('2 Lerntage in Folge')).toBeTruthy();
  expect(screen.getByText('9 Münzen')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Serie und Streak-Schutz ansehen' }));
  expect(app.getPathname()).toBe('/profile');
  expect(screen.getByText('Tagesziel erreicht. Gut geübt!')).toBeTruthy();
  expect(screen.getByText(/Schutz bewahrt eine bestehende Serie/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Streak-Schutz für 10 Münzen kaufen' })).toBeDisabled();
});
it('übernimmt ein geändertes Tagesziel und erklärt Web-Erinnerungen ohne Systemanfrage', async () => {
  confirmed();
  useMotivation.setState({ permission: 'unsupported' });
  const app = renderRouter('./src/app', { initialUrl: '/preferences' });
  fireEvent.press(screen.getByTestId('setup-choice-50'));
  await waitFor(() => {
    expect(useMotivation.getState().data?.preferences.dailyGoal).toBe(50);
  });
  expect(screen.getByText(/Web-Push folgt später/)).toBeTruthy();
  fireEvent.press(screen.getByRole('switch', { name: 'Lernerinnerungen aktivieren' }));
  await screen.findByTestId('setup-choice-19:00');
  fireEvent.press(screen.getByTestId('setup-choice-19:00'));
  await waitFor(() => {
    expect(useMotivation.getState().data?.preferences.reminderTime).toBe('19:00');
  });
  fireEvent.press(screen.getByText('Zurück zum Profil'));
  expect(app.getPathname()).toBe('/profile');
  expect(screen.getByText('30 von 50 XP')).toBeTruthy();
  expect(screen.getByText('Noch 20 XP bis zum Tagesziel.')).toBeTruthy();
});
it('verbirgt fremde Kontowerte während eines Konto-Wechsels und zeigt Fehler ohne einen falschen Nullstand', async () => {
  confirmed();
  renderRouter('./src/app', { initialUrl: '/profile' });
  await act(async () => {
    useMotivation.setState({ scope: 'other', phase: 'loading', data: null });
    await Promise.resolve();
  });
  expect(screen.queryByText('9 Münzen')).toBeNull();
  await act(async () => {
    useMotivation.setState({ scope: 'guest', phase: 'error' });
    await Promise.resolve();
  });
  expect(screen.getByText(/Motivationsstand konnte nicht geladen werden/)).toBeTruthy();
});

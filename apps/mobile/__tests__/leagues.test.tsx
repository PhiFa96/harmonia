import { renderRouter, screen, fireEvent, waitFor } from 'expo-router/testing-library';
import type { Session } from '@supabase/supabase-js';
import type { LeagueSnapshot } from '@harmonia/content';
import type * as LeagueModule from '@/state/leagues';
jest.mock('@/state/leagues', () => ({
  ...jest.requireActual<typeof LeagueModule>('@/state/leagues'),
  refreshLeagues: jest.fn(() => Promise.resolve()),
  acknowledgeLeagueResult: jest.fn(() => Promise.resolve()),
}));
import { useLeagues, acknowledgeLeagueResult } from '@/state/leagues';
import { useAuthState } from '@/auth';
import { usePrivacy, initializePrivacy } from '@/privacy/state';
import { useMotivation } from '@/state/motivation';
import { i18n } from '@/i18n';
import LeaguesScreen from '@/app/(tabs)/leagues';
import { UiProvider } from '@harmonia/ui/native';
function FixtureScreen() {
  return (
    <UiProvider scheme="light">
      <LeaguesScreen />
    </UiProvider>
  );
}
import { motivationFixture } from '../jest/motivation-fixture';
const fixture: LeagueSnapshot = {
  weekStart: '2026-10-12',
  weekEnd: '2026-10-19',
  tier: 3,
  pushConsent: false,
  cohort: {
    capacity: 30,
    movement: 5,
    entries: [
      { slot: 2, rank: 1, xp: 250, isYou: false },
      { slot: 1, rank: 2, xp: 140, isYou: true },
    ],
  },
  result: {
    weekStart: '2026-10-05',
    tier: 2,
    nextTier: 3,
    rank: 1,
    xp: 300,
    outcome: 'promoted',
    seen: false,
  },
};
beforeEach(async () => {
  await i18n.changeLanguage('de');
  jest.clearAllMocks();
  useAuthState.setState({ session: { user: { id: 'own' }, access_token: 'own-token' } as Session });
  await initializePrivacy();
  useLeagues.setState({ owner: 'own', data: fixture, loading: false, error: false });
  usePrivacy.setState({
    owner: 'own',
    phase: 'ready',
    choices: { push: false, analytics: false, marketing: false },
  });
  useMotivation.setState({
    scope: 'own',
    phase: 'ready',
    data: motivationFixture(),
    notificationError: false,
  });
});
it('offers guests an account without invented ranks', () => {
  useAuthState.setState({ session: null });
  renderRouter({ index: FixtureScreen });
  expect(screen.getByRole('button', { name: 'Anmelden oder Konto erstellen' })).toBeTruthy();
  expect(screen.queryByText(/Platz 1/)).toBeNull();
});
it('shows an own real ranking, provisional movement and an acknowledgeable result', async () => {
  renderRouter({ index: FixtureScreen });
  expect(screen.getByText('Platz 1 · Lernperson 2 · 250 XP')).toBeTruthy();
  expect(screen.getByText('Platz 2 · Du · 140 XP')).toBeTruthy();
  expect(screen.getByText('Voraussichtlicher Aufstiegsplatz')).toBeTruthy();
  expect(screen.getByText('Voraussichtlicher Abstiegsplatz')).toBeTruthy();
  expect(screen.getByText('Aufgestiegen in die Liga mf · mezzo forte.')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Als gelesen markieren' }));
  await waitFor(() => {
    expect(acknowledgeLeagueResult).toHaveBeenCalledWith('2026-10-05');
  });
});
it('hides another account snapshot immediately and labels stale own data', () => {
  useAuthState.setState({ session: { user: { id: 'other' } } as Session });
  const app = renderRouter({ index: FixtureScreen });
  expect(screen.queryByText(/140 XP/)).toBeNull();
  app.unmount();
  useAuthState.setState({ session: { user: { id: 'own' } } as Session });
  useLeagues.setState({ error: true });
  renderRouter({ index: FixtureScreen });
  expect(screen.getByText(/Diese Rangliste stammt vom letzten Abruf/)).toBeTruthy();
  expect(screen.getByText('Platz 2 · Du · 140 XP')).toBeTruthy();
});
it.each(['de', 'en-US', 'en-GB'])(
  'uses correct Italian dynamics and localized explanations in %s',
  async (locale) => {
    await i18n.changeLanguage(locale);
    renderRouter({ index: FixtureScreen });
    expect(screen.getByText('fff · fortississimo')).toBeTruthy();
    expect(screen.getByText('pp · pianissimo')).toBeTruthy();
    expect(screen.getByText(locale === 'de' ? 'äußerst laut' : 'extremely loud')).toBeTruthy();
    expect(screen.queryByText(/glossary:/)).toBeNull();
  },
);

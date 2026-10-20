import { renderRouter, screen, fireEvent, waitFor } from 'expo-router/testing-library';
import type { Session } from '@supabase/supabase-js';
import type { RushView } from '@harmonia/content';
import { UiProvider } from '@harmonia/ui/native';
import { i18n } from '@/i18n';
import { useAuthState } from '@/auth';
import { useRush, clearRush, endRush } from '@/state/rush';
import RushScreen from '@/app/rush';
import type * as RushModule from '@/state/rush';
jest.mock('@/state/rush', () => ({
  ...jest.requireActual<typeof RushModule>('@/state/rush'),
  refreshRush: jest.fn(() => Promise.resolve()),
  refreshRushBoard: jest.fn(() => Promise.resolve()),
  startRush: jest.fn(() => Promise.resolve()),
  endRush: jest.fn(() => Promise.resolve()),
}));
function Fixture() {
  return (
    <UiProvider scheme="light">
      <RushScreen />
    </UiProvider>
  );
}
const run: RushView = {
  id: 'b3050000-0000-4000-8000-000000000001',
  mode: 'three',
  bank: 'a'.repeat(64),
  state: 'active',
  startedAt: Date.now(),
  deadline: Date.now() + 180000,
  serverNow: Date.now(),
  index: 0,
  correct: 0,
  mistakes: 0,
  score: 0,
  xp: 0,
  question: { spec: { type: 'NOTE_NAME', params: {} }, difficulty: 1, seed: 'rush-ui' },
  last: null,
};
beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('de');
  useAuthState.setState({ session: { user: { id: 'rush-ui' }, access_token: 'token' } as Session });
  clearRush();
  useRush.setState({
    status: { remaining: 1, limit: 1, resetAt: Date.now() + 86400000, run: null },
  });
});
it('offers guests an account and no invented score', () => {
  useAuthState.setState({ session: null });
  renderRouter({ index: Fixture });
  expect(screen.getByRole('button', { name: 'Zum Konto' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Lauf starten' })).toBeNull();
});
it('shows a live server run without hints and requires explicit abandonment', async () => {
  useRush.setState({ run });
  renderRouter({ index: Fixture });
  expect(screen.getByTestId('rush-clock')).toBeTruthy();
  expect(screen.queryByText('Hinweis 1')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Lauf beenden' }));
  expect(screen.getByRole('button', { name: 'Weiterspielen' })).toBeTruthy();
  expect(endRush).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Lauf abbrechen' }));
  await waitFor(() => {
    expect(endRush).toHaveBeenCalledWith(run.id, true);
  });
});
it('shows confirmed rewards separately from a lesson pass', () => {
  useRush.setState({
    run: {
      ...run,
      state: 'finished',
      question: null,
      index: 5,
      correct: 2,
      mistakes: 3,
      score: 20,
      xp: 2,
    },
    status: { remaining: 0, limit: 1, resetAt: Date.now() + 86400000, run: null },
  });
  renderRouter({ index: Fixture });
  expect(screen.getByText('2 XP wurden gutgeschrieben.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Lauf starten' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Abos ansehen' })).toBeTruthy();
});
it('hides another account’s active run immediately', () => {
  useRush.setState({ owner: 'other', run });
  renderRouter({ index: Fixture });
  expect(screen.queryByTestId('rush-clock')).toBeNull();
});
it('disables choice controls while a server confirmation is pending', () => {
  useRush.setState({ run, loading: true });
  renderRouter({ index: Fixture });
  for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
});
it.each(['en-US', 'en-GB'] as const)('uses natural English labels in %s', async (locale) => {
  await i18n.changeLanguage(locale);
  renderRouter({ index: Fixture });
  expect(screen.getByRole('button', { name: 'Survival' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'All time' })).toBeTruthy();
  expect(screen.getByText('Theory Rush')).toBeTruthy();
});

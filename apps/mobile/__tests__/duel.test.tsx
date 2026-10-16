import { renderRouter, screen } from 'expo-router/testing-library';
import { act } from '@testing-library/react-native';
import type { Session } from '@supabase/supabase-js';
import { UiProvider } from '@harmonia/ui/native';
import { i18n } from '@/i18n';
import { useAuthState } from '@/auth';
import { clearDuel, useDuel } from '@/state/duel';
import DuelScreen from '@/app/duel';
import type * as DuelModule from '@/state/duel';
jest.mock('@/state/duel', () => ({
  ...jest.requireActual<typeof DuelModule>('@/state/duel'),
  refreshDuel: jest.fn(() => Promise.resolve()),
  findDuel: jest.fn(() => Promise.resolve()),
  watchDuel: jest.fn(() => () => undefined),
}));
function Fixture() {
  return (
    <UiProvider scheme="light">
      <DuelScreen />
    </UiProvider>
  );
}
beforeEach(async () => {
  await i18n.changeLanguage('de');
  useAuthState.setState({ session: { user: { id: 'duel-ui' }, access_token: 'token' } as Session });
  clearDuel();
});
it('labels a recording explicitly and keeps an old account game hidden', () => {
  useDuel.setState({
    view: {
      phase: 'game',
      id: 'c3060000-0000-4000-8000-000000000001',
      kind: 'ghost',
      state: 'finished',
      startsAt: 1,
      deadline: 181001,
      serverNow: 181001,
      own: { index: 1, correct: 1, mistakes: 0, score: 10 },
      rival: { index: 1, score: 20 },
      ghostScore: 20,
      outcome: 'loss',
      ratingBefore: null,
      ratingAfter: null,
      question: null,
      last: null,
    },
  });
  renderRouter({ index: Fixture });
  expect(screen.getByText('Ghost-Duell')).toBeTruthy();
  expect(screen.getByText(/Aufzeichnung eines echten Rush-Laufs/)).toBeTruthy();
  expect(screen.getByText('Dieses Duell zählt nicht für das Rating.')).toBeTruthy();
  act(() => {
    useDuel.setState({ owner: 'another-account' });
  });
  expect(screen.queryByText('Ghost-Duell')).toBeNull();
});
it('offers an account instead of a fictional duel to a guest', () => {
  useAuthState.setState({ session: null });
  renderRouter({ index: Fixture });
  expect(screen.getByRole('button', { name: 'Zum Konto' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Live-Duell suchen' })).toBeNull();
});

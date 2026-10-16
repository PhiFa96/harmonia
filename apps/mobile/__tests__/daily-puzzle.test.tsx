import { renderRouter, screen } from 'expo-router/testing-library';
import type { Session } from '@supabase/supabase-js';
import { UiProvider } from '@harmonia/ui/native';
import { lessonDay } from '@harmonia/content';
import { i18n } from '@/i18n';
import { useAuthState } from '@/auth';
import { deviceTimeZone } from '@/state/motivation';
import { clearDailyPuzzle, useDailyPuzzle } from '@/state/daily-puzzle';
import DailyPuzzleScreen from '@/app/daily-puzzle';
import type * as PuzzleModule from '@/state/daily-puzzle';
jest.mock('@/state/daily-puzzle', () => ({
  ...jest.requireActual<typeof PuzzleModule>('@/state/daily-puzzle'),
  refreshDailyPuzzle: jest.fn(() => Promise.resolve()),
}));
function Fixture() {
  return (
    <UiProvider scheme="light">
      <DailyPuzzleScreen />
    </UiProvider>
  );
}
beforeEach(async () => {
  await i18n.changeLanguage('de');
  useAuthState.setState({
    session: { user: { id: 'puzzle-ui' }, access_token: 'token' } as Session,
  });
  clearDailyPuzzle();
});
it('shows a solution-free result for the current day', () => {
  const day = lessonDay(Date.now(), deviceTimeZone() || 'UTC');
  useDailyPuzzle.setState({
    owner: 'puzzle-ui',
    view: {
      day,
      resetAt: Date.now() + 86400000,
      available: true,
      difficulty: 2,
      streak: 3,
      completed: true,
      correct: true,
      question: null,
    },
  });
  renderRouter({ index: Fixture });
  expect(screen.getByText('Richtig gelöst!')).toBeTruthy();
  expect(screen.getByText(`Harmonia-Rätsel ${day} 🟩 · Serie: 3`)).toBeTruthy();
  expect(screen.queryByText('Ein Versuch für das heutige Rätsel')).toBeNull();
});
it('requires an account', () => {
  useAuthState.setState({ session: null });
  renderRouter({ index: Fixture });
  expect(screen.getByRole('button', { name: 'Zum Konto' })).toBeTruthy();
});

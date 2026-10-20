import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Share } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { UiProvider } from '@harmonia/ui/native';
import { i18n } from '@/i18n';
import { useAuthState } from '@/auth';
import { useFriends } from '@/state/friends';
import FriendsScreen from '@/app/friends';
import type * as FriendsModule from '@/state/friends';
jest.mock('@/state/friends', () => ({
  ...jest.requireActual<typeof FriendsModule>('@/state/friends'),
  refreshFriends: jest.fn(() => Promise.resolve()),
  changeFriends: jest.fn(() => Promise.resolve()),
}));
function Fixture() {
  return (
    <UiProvider scheme="light">
      <FriendsScreen />
    </UiProvider>
  );
}
const ids = [1, 2, 3, 4].map((n) => `a3080000-0000-4000-8000-00000000000${String(n)}`);
beforeEach(async () => {
  await i18n.changeLanguage('de');
  useAuthState.setState({
    session: { user: { id: 'friends-ui' }, access_token: 'token' } as Session,
  });
  useFriends.setState({
    owner: 'friends-ui',
    loading: false,
    error: null,
    view: {
      invite: { token: 'b3080000-0000-4000-8000-000000000001', expiresAt: Date.now() + 86400000 },
      friends: [
        { id: ids[0] ?? '', streak: 1, leagueTier: 0 },
        { id: ids[1] ?? '', streak: 5, leagueTier: 2 },
      ],
      blocked: [ids[2] ?? '', ids[3] ?? ''],
      badges: 0,
      questUsed: false,
      quest: null,
    },
  });
});
it('benennt Aktionen je Person, damit Screenreader sie unterscheiden können', () => {
  renderRouter({ index: Fixture });
  for (const name of [
    'Freund 1 entfernen',
    'Freund 2 entfernen',
    'Freund 1 blockieren',
    'Freund 2 blockieren',
    'Wochenquest zusammen starten mit Freund 1',
    'Wochenquest zusammen starten mit Freund 2',
    'Blockierung aufheben für blockierte Person 1',
    'Blockierung aufheben für blockierte Person 2',
  ])
    expect(screen.getAllByRole('button', { name })).toHaveLength(1);
  expect(screen.getByText('Lernserie: 1 Tag · Liga-Stufe: 0')).toBeTruthy();
});
it('meldet Erfolg und Misserfolg des Teilens als Status', async () => {
  const share = jest.spyOn(Share, 'share');
  try {
    share.mockResolvedValueOnce({ action: 'sharedAction' });
    renderRouter({ index: Fixture });
    expect(screen.queryByText('Einladung wurde geteilt oder kopiert.')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Link teilen oder kopieren' }));
    await waitFor(() => {
      expect(screen.getByText('Einladung wurde geteilt oder kopiert.')).toBeTruthy();
    });
    share.mockRejectedValueOnce(new Error('denied'));
    fireEvent.press(screen.getByRole('button', { name: 'Link teilen oder kopieren' }));
    await waitFor(() => {
      expect(screen.getByText('Teilen oder Kopieren hat nicht geklappt.')).toBeTruthy();
    });
    expect(screen.queryByText('Einladung wurde geteilt oder kopiert.')).toBeNull();
  } finally {
    share.mockRestore();
  }
});

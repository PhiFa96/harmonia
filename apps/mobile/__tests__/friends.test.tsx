import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Share } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { UiProvider } from '@harmonia/ui/native';
import { i18n } from '@/i18n';
import { useAuthState } from '@/auth';
import { changeFriends, useFriends } from '@/state/friends';
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
  jest.clearAllMocks();
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

it('öffnet eine Einladung mit vorausgefülltem Code und wartet auf die Bestätigung', () => {
  const token = 'b3080000-0000-4000-8000-000000000002';
  renderRouter({ friends: Fixture }, { initialUrl: '/friends?invite=' + token });
  expect(screen.getByDisplayValue(token)).toBeTruthy();
  expect(changeFriends).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Einladung annehmen' }));
  expect(changeFriends).toHaveBeenCalledWith({ action: 'accept', token });
});

it('widerruft erst nach Bestätigung und zeigt die mögliche Rotation an', async () => {
  jest.mocked(changeFriends).mockImplementationOnce(() => {
    const { view } = useFriends.getState();
    if (view) useFriends.setState({ view: { ...view, invite: null } });
    return Promise.resolve();
  });
  renderRouter({ index: Fixture });
  fireEvent.press(screen.getByRole('button', { name: 'Einladung zurückziehen' }));
  expect(changeFriends).not.toHaveBeenCalled();
  expect(screen.getByText('Diese Einladung zurückziehen?')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: i18n.t('friends.confirm') }));
  expect(changeFriends).toHaveBeenCalledWith({ action: 'revoke' });
  expect(await screen.findByText('Einladung zurückgezogen.')).toBeTruthy();
  expect(screen.getByRole('button', { name: i18n.t('friends.createInvite') })).toBeEnabled();
});

it.each([
  ['de', 'Lernserie: 1 Tag · Liga-Stufe: 0', 'Lernserie: 5 Tage · Liga-Stufe: 2'],
  ['en-US', 'Learning streak: 1 day · League tier: 0', 'Learning streak: 5 days · League tier: 2'],
])('rendert Singular und Plural in %s', async (locale, one, many) => {
  await i18n.changeLanguage(locale);
  renderRouter({ index: Fixture });
  expect(screen.getByText(one)).toBeTruthy();
  expect(screen.getByText(many)).toBeTruthy();
});

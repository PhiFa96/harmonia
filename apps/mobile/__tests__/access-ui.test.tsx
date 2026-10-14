import { UiProvider } from '@harmonia/ui/native';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import Practice from '@/app/(tabs)/practice';
import { authorizeStart } from '@/access/state';
import { DEFAULT_ACCESS_POLICY, guestAccessStatus } from '@harmonia/content';
import type { AccessGrant } from '@harmonia/content';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';
const authorize = jest.mocked(authorizeStart);
const grant = (allowed = true): AccessGrant => ({
  allowed,
  reason: allowed ? 'allowed' : 'limit',
  id: 'fixture',
  cost: 9,
  status: guestAccessStatus(DEFAULT_ACCESS_POLICY, null, Date.now()),
});
function view() {
  return renderRouter(
    { '(tabs)/practice': Practice, paywall: () => null },
    {
      initialUrl: '/practice',
      wrapper: ({ children }) => <UiProvider scheme="light">{children}</UiProvider>,
    },
  );
}
beforeEach(async () => {
  authorize.mockReset().mockResolvedValue(grant());
  useSettings.setState({ locale: 'de' });
  await i18n.changeLanguage('de');
});
it('shows the limit before an exercise and routes to the defined paywall', async () => {
  authorize.mockResolvedValue(grant(false));
  const app = view();
  await act(async () => {
    fireEvent.press(screen.getByText('Übungssatz starten'));
    await Promise.resolve();
  });
  expect(app.getPathname()).toBe('/paywall');
  expect(app.getSearchParams()).toMatchObject({ reason: 'limit' });
  expect(screen.queryByTestId('exercise-next')).toBeNull();
});
it('deduplicates double taps while access is pending, then starts canonical tasks', async () => {
  let resolve!: (grant: AccessGrant) => void;
  authorize.mockReturnValue(
    new Promise((value) => {
      resolve = value;
    }),
  );
  view();
  fireEvent.press(screen.getByText('Übungssatz starten'));
  fireEvent.press(screen.getByText('Übungssatz starten'));
  expect(authorize).toHaveBeenCalledTimes(1);
  expect(screen.getAllByText('Zugang wird geprüft …')).toBeTruthy();
  expect(screen.queryByText('Aufgabe 1 von 9')).toBeNull();
  await act(async () => {
    resolve(grant());
    await Promise.resolve();
  });
  expect(screen.getByText('Aufgabe 1 von 9')).toBeTruthy();
});
it('offers retry without starting or upselling a network error', async () => {
  authorize.mockRejectedValue(new Error('network'));
  const app = view();
  await act(async () => {
    fireEvent.press(screen.getByText('Übungssatz starten'));
    await Promise.resolve();
  });
  expect(app.getPathname()).toBe('/practice');
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.queryByText('Aufgabe 1 von 9')).toBeNull();
});

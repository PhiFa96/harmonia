import { UiProvider } from '@harmonia/ui/native';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import Privacy from '@/app/privacy';
import Legal from '@/app/legal';
import { usePrivacy, initializePrivacy } from '@/privacy/state';
import { useMotivation } from '@/state/motivation';
import { useAuthState } from '@/auth';
import { useDeviceState } from '@/state/device';
import type { Session } from '@supabase/supabase-js';
import { i18n } from '@/i18n';
const mockExport = jest.fn(() => Promise.resolve()),
  mockDelete = jest.fn(() => Promise.resolve());
jest.mock('@/privacy/state', () => ({
  ...jest.requireActual<object>('@/privacy/state'),
  exportPrivacyData: () => mockExport(),
  deletePrivacyAccount: () => mockDelete(),
  syncPrivacy: () => Promise.resolve(),
}));
const owner = '00000000-0000-4000-8000-000000000071';
const session = (id: string) => ({ user: { id, is_anonymous: false } }) as Session;
function view(route = 'privacy') {
  return renderRouter(
    { privacy: Privacy, legal: Legal, subscription: () => null, index: () => null },
    {
      initialUrl: '/' + route,
      wrapper: ({ children }) => <UiProvider scheme="light">{children}</UiProvider>,
    },
  );
}
beforeEach(async () => {
  mockExport.mockClear();
  mockDelete.mockClear();
  useAuthState.setState({ ready: true, session: null });
  usePrivacy.setState({ owner: 'guest', phase: 'ready' });
  await i18n.changeLanguage('de');
});
it('lets guests open privacy and export only after an explicit press', async () => {
  view();
  expect(screen.getByText('Datenschutz und Daten')).toBeTruthy();
  expect(mockExport).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Kontolöschung öffnen' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Daten herunterladen' }));
  await waitFor(() => {
    expect(mockExport).toHaveBeenCalledTimes(1);
  });
});
it('requires a separate confirmation and subscription acknowledgement before deleting', async () => {
  useAuthState.setState({ session: session(owner) });
  view();
  fireEvent.press(screen.getByRole('button', { name: 'Kontolöschung öffnen' }));
  expect(mockDelete).not.toHaveBeenCalled();
  const button = screen.getByRole('button', { name: 'Konto endgültig löschen' });
  expect(button).toBeDisabled();
  fireEvent.press(
    screen.getByRole('switch', {
      name: 'Ich weiß, dass die Kontolöschung laufende Abos nicht kündigt.',
    }),
  );
  expect(button).not.toBeDisabled();
  fireEvent.press(button);
  await waitFor(() => {
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });
});
it('invalidates the open deletion confirmation when the signed-in account changes', () => {
  useAuthState.setState({ session: session(owner) });
  view();
  fireEvent.press(screen.getByRole('button', { name: 'Kontolöschung öffnen' }));
  act(() => {
    useAuthState.setState({ session: session('00000000-0000-4000-8000-000000000072') });
  });
  expect(screen.queryByRole('button', { name: 'Konto endgültig löschen' })).toBeNull();
  expect(mockDelete).not.toHaveBeenCalled();
});
it.each(['en-US', 'en-GB'])(
  'shows the public legal area in %s with missing publications visibly disabled',
  async (locale) => {
    await i18n.changeLanguage(locale);
    view('legal');
    expect(screen.getByText('Legal information')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Privacy and data' })).toBeTruthy();
  },
);
it('keeps exports and account deletion disabled until device storage has initialized', () => {
  useAuthState.setState({ session: session(owner) });
  useDeviceState.setState({ phase: 'loading' });
  view();
  expect(screen.getByRole('button', { name: 'Daten herunterladen' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Kontolöschung öffnen' })).toBeDisabled();
});

it('provides an explicit global withdrawal without re-enabling learning reminders', async () => {
  await initializePrivacy();
  usePrivacy.setState({
    owner: 'guest',
    phase: 'ready',
    choices: { push: true, analytics: false, marketing: false },
  });
  useMotivation.setState((s) => ({
    scope: 'guest',
    phase: 'ready',
    memory: true,
    data: s.data
      ? { ...s.data, preferences: { ...s.data.preferences, reminderConsent: true } }
      : null,
  }));
  view();
  fireEvent.press(screen.getByRole('switch', { name: 'Systemmitteilungen erlauben' }));
  await waitFor(() => {
    expect(usePrivacy.getState().choices.push).toBe(false);
    expect(useMotivation.getState().data?.preferences.reminderConsent).toBe(false);
  });
});

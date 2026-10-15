import { UiProvider } from '@harmonia/ui/native';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { Session } from '@supabase/supabase-js';
import { EmailSignIn } from '@/components/email-sign-in';
import { useAuthState } from '@/auth';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';
const owner = '70000000-0000-4000-8000-000000000001';
const session = (id: string) => ({ user: { id, email: 'own@example.test' } }) as Session;
const mockSend = jest.fn<Promise<void>, [string, string, boolean]>(() => Promise.resolve());
const mockVerify = jest.fn(() => Promise.resolve(session(owner)));
const mockSignOut = jest.fn(() => Promise.resolve());
jest.mock('@/auth', () => ({
  ...jest.requireActual<object>('@/auth'),
  getAuthClient: () => ({}),
  sendEmailCode: (address: string, locale: string, reauthenticate: boolean) =>
    mockSend(address, locale, reauthenticate),
  verifyEmailCode: () => mockVerify(),
  signOutDevice: () => mockSignOut(),
}));
beforeEach(async () => {
  jest.clearAllMocks();
  mockVerify.mockImplementation(() => Promise.resolve(session(owner)));
  useAuthState.setState({ ready: true, session: session(owner), error: false });
  useSettings.setState({ locale: 'de' });
  await i18n.changeLanguage('de');
});
function view(onVerified: (actor: string) => void) {
  return renderRouter(
    { index: () => <EmailSignIn reauthenticate ageConfirmed onVerified={onVerified} /> },
    {
      initialUrl: '/',
      wrapper: ({ children }) => <UiProvider scheme="light">{children}</UiProvider>,
    },
  );
}
it('requires an actual new OTP ceremony despite an existing session', async () => {
  const verified = jest.fn();
  view(verified);
  expect(screen.getByTestId('email-address')).toHaveProp('editable', false);
  fireEvent.press(screen.getByRole('button', { name: 'Code senden' }));
  await waitFor(() => {
    expect(mockSend).toHaveBeenCalledWith('own@example.test', 'de', true);
  });
  expect(verified).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByTestId('email-code'), '123456');
  fireEvent.press(screen.getByRole('button', { name: 'Adresse bestätigen' }));
  await waitFor(() => {
    expect(verified).toHaveBeenCalledWith(owner);
  });
});
it('rejects a verified session for another account during deletion reauthentication', async () => {
  mockVerify.mockImplementation(() =>
    Promise.resolve(session('70000000-0000-4000-8000-000000000002')),
  );
  const verified = jest.fn();
  view(verified);
  fireEvent.press(screen.getByRole('button', { name: 'Code senden' }));
  await screen.findByTestId('email-code');
  fireEvent.changeText(screen.getByTestId('email-code'), '123456');
  fireEvent.press(screen.getByRole('button', { name: 'Adresse bestätigen' }));
  await waitFor(() => {
    expect(mockSignOut).toHaveBeenCalled();
  });
  expect(verified).not.toHaveBeenCalled();
});

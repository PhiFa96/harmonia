import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ErrorBoundary } from '@/app/_layout';
import { i18n } from '@/i18n';
import { newOnboarding } from '@/onboarding/model';
import { useDeviceState } from '@/state/device';
beforeEach(async () => {
  await i18n.changeLanguage('de');
});
it('keeps saved data and hides the raw render error until a deliberate retry', async () => {
  // Ein echter gespeicherter Zustand, sonst prüfte der Vergleich nur null === null.
  useDeviceState.setState({ data: newOnboarding(Date.UTC(2026, 9, 16)) });
  const data = useDeviceState.getState().data,
    retry = jest.fn(() => Promise.resolve());
  expect(data).not.toBeNull();
  render(<ErrorBoundary error={new Error('secret-account@example.invalid')} retry={retry} />);
  expect(screen.getByText('Hier ist etwas schiefgelaufen.')).toBeTruthy();
  expect(screen.queryByText(/secret-account/)).toBeNull();
  expect(retry).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Erneut versuchen' }));
  await waitFor(() => {
    expect(retry).toHaveBeenCalledTimes(1);
  });
  expect(useDeviceState.getState().data).toBe(data);
});
it('shows a safe retry failure instead of leaking the rejected error', async () => {
  render(
    <ErrorBoundary
      error={new Error('private')}
      retry={() => Promise.reject(new Error('internal token'))}
    />,
  );
  fireEvent.press(screen.getByRole('button', { name: 'Erneut versuchen' }));
  await waitFor(() => {
    expect(screen.getByRole('alert')).toBeTruthy();
  });
  expect(screen.queryByText(/internal token/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Erneut versuchen' })).not.toBeDisabled();
});

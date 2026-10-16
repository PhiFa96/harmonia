import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { UiProvider } from '@harmonia/ui/native';
import { useAuthState } from '@/auth';
import { useMotivation } from '@/state/motivation';
import { useLeagues } from '@/state/leagues';
import * as privacy from '@/privacy/state';
import { ReminderControls } from '@/components/reminder-controls';
import { motivationFixture } from '../jest/motivation-fixture';
import { i18n } from '@/i18n';
it('turning off learning reminders leaves global permission for other categories intact even before league preferences load', async () => {
  await i18n.changeLanguage('de');
  useAuthState.setState({ session: null });
  await privacy.initializePrivacy();
  useLeagues.setState({ owner: null, data: null });
  const data = motivationFixture();
  data.preferences.reminderConsent = true;
  useMotivation.setState({ scope: 'guest', phase: 'ready', data, memory: true });
  privacy.usePrivacy.setState({
    owner: 'guest',
    phase: 'ready',
    choices: { push: true, analytics: false, marketing: false },
  });
  const consent = jest.spyOn(privacy, 'setPrivacyConsent');
  render(
    <UiProvider scheme="light">
      <ReminderControls />
    </UiProvider>,
  );
  fireEvent.press(screen.getByRole('switch', { name: 'Lernerinnerungen aktivieren' }));
  await waitFor(() => {
    expect(useMotivation.getState().data?.preferences.reminderConsent).toBe(false);
  });
  expect(consent).not.toHaveBeenCalled();
  expect(privacy.usePrivacy.getState().choices.push).toBe(true);
  consent.mockRestore();
});

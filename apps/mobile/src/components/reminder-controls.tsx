import { setPrivacyConsent, usePrivacy } from '@/privacy/state';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import { AppText, Button, ListGroup, ListItem } from '@harmonia/ui/native';
import { OnboardingChoices } from './onboarding-choices';
import { useAuthState } from '@/auth';
import { updateOnboarding } from '@/state/device';
import { useMotivation, changeMotivationPreferences } from '@/state/motivation';
import { optInReminders, reconcileReminders } from '@/reminders';
export function ReminderControls() {
  const { t } = useTranslation(),
    state = useMotivation(),
    auth = useAuthState(),
    privacy = usePrivacy();
  if (state.phase !== 'ready' || state.scope !== (auth.session?.user.id ?? 'guest') || !state.data)
    return null;
  const p = state.data.preferences;
  return (
    <>
      {state.writeError ? (
        <AppText role="alert" tone="danger">
          {t('motivation.writeError')}
        </AppText>
      ) : null}
      <AppText variant="title2">{t('motivation.remindersTitle')}</AppText>
      <AppText tone="muted">{t('motivation.remindersBody')}</AppText>
      <ListGroup>
        <ListItem
          icon="bell"
          label={t('motivation.remindersEnabled')}
          toggle={{
            value: p.reminderConsent && privacy.choices.push,
            onValueChange: (value) => {
              if (!value || state.permission === 'unsupported' || state.memory) {
                updateOnboarding((d) => ({ ...d, reminderConsent: value }));
                void (!value ? Promise.resolve() : setPrivacyConsent('push', true))
                  .then(() => changeMotivationPreferences({ reminderConsent: value }))
                  .then(() => reconcileReminders())
                  .catch(() => undefined);
              } else void optInReminders();
            },
          }}
          last
        />
      </ListGroup>
      {state.permission === 'unsupported' ? (
        <AppText tone="muted">{t('motivation.webReminders')}</AppText>
      ) : state.memory ? (
        <AppText tone="muted">{t('motivation.memoryReminders')}</AppText>
      ) : (
        <>
          {state.permission === 'denied' ? (
            <>
              <AppText tone="muted">{t('motivation.permissionDenied')}</AppText>
              <Button
                label={t('motivation.openSettings')}
                variant="secondary"
                onPress={() => {
                  void Linking.openSettings().catch(() => undefined);
                }}
              />
            </>
          ) : null}
          {p.reminderConsent && state.permission !== 'granted' ? (
            <Button
              label={t('motivation.allowNotifications')}
              onPress={() => {
                void optInReminders();
              }}
            />
          ) : null}
          {p.reminderConsent && state.permission === 'granted' ? (
            <AppText variant="footnote">
              {t(
                state.data.server?.remoteReminders
                  ? 'motivation.remoteReminder'
                  : 'motivation.localReminder',
              )}
            </AppText>
          ) : null}
        </>
      )}
      {p.reminderConsent ? (
        <OnboardingChoices
          label={t('onboarding.reminderTime')}
          selected={p.reminderTime}
          options={['17:00', '18:00', '19:00', '20:00'].map((value) => ({
            value,
            label: t('onboarding.timeOption', { time: value }),
          }))}
          onSelect={(reminderTime) => {
            updateOnboarding((d) => ({
              ...d,
              reminderTime: reminderTime as '17:00' | '18:00' | '19:00' | '20:00',
            }));
            void changeMotivationPreferences({ reminderTime }).catch(() => undefined);
          }}
        />
      ) : null}
      {state.notificationError ? (
        <AppText tone="danger">{t('motivation.notificationError')}</AppText>
      ) : null}
      {(state.retirePending || (!p.reminderConsent && state.data.server?.remoteReminders)) &&
      state.sync === 'error' ? (
        <AppText tone="danger">{t('motivation.retirePending')}</AppText>
      ) : null}
    </>
  );
}

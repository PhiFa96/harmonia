import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, ListGroup, ListItem } from '@harmonia/ui/native';
import { useDeviceState, updateOnboarding } from '@/state/device';
import { signOutDevice, useAuthState } from '@/auth';
import { DeviceStatus } from './device-status';

export function LearningProfile() {
  const { t } = useTranslation(),
    router = useRouter(),
    data = useDeviceState((s) => s.data),
    auth = useAuthState();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  if (!data) return null;
  const logout = async () => {
    setBusy(true);
    setError(false);
    try {
      await signOutDevice();
      updateOnboarding((d) => ({ ...d, account: 'guest', accountId: null }));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <AppText variant="overline" tone="muted">
        {t('onboarding.profileTitle')}
      </AppText>
      <Card>
        <AppText variant="title3">
          {t('onboarding.profileSummary', {
            goal: data.goal ? t(`onboarding.goal_${data.goal}`) : '',
            experience: data.experience ? t(`onboarding.experience_${data.experience}`) : '',
          })}
        </AppText>
      </Card>
      <ListGroup>
        <ListItem
          icon="target"
          label={t('onboarding.profileDaily')}
          value={t('onboarding.dailyOption', { count: data.dailyGoal })}
          onPress={() => {
            router.push('/preferences');
          }}
        />
        <ListItem
          icon="bell"
          label={t('onboarding.profileReminder')}
          value={
            data.reminderConsent
              ? t('onboarding.reminderOn', { time: data.reminderTime })
              : t('onboarding.reminderOff')
          }
          onPress={() => {
            router.push('/preferences');
          }}
        />
        <ListItem
          icon="path"
          label={t('onboarding.profilePlacement')}
          value={t(
            data.placement === 'requested'
              ? 'onboarding.placementRequested'
              : 'onboarding.placementLater',
          )}
          onPress={() => {
            router.push('/preferences');
          }}
        />
        <ListItem
          icon="person"
          label={t('onboarding.profileAccount')}
          value={
            auth.session
              ? t('onboarding.signedIn', { email: auth.session.user.email ?? '' })
              : t(data.account === 'email' ? 'onboarding.signedOut' : 'onboarding.guestLabel')
          }
          onPress={() => {
            router.push('/account');
          }}
          last
        />
      </ListGroup>
      <Button
        variant="secondary"
        label={t('onboarding.profileEdit')}
        onPress={() => {
          router.push('/preferences');
        }}
      />
      {auth.session ? (
        <Button
          variant="ghost"
          size="medium"
          label={t('auth.signOut')}
          disabled={busy}
          onPress={() => {
            void logout();
          }}
        />
      ) : null}
      {error ? (
        <AppText role="alert" tone="danger">
          {t('auth.signOutError')}
        </AppText>
      ) : null}
      <DeviceStatus />
    </>
  );
}

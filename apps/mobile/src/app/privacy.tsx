import { changeMotivationPreferences } from '@/state/motivation';
import { refreshLeagues } from '@/state/leagues';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card, ListGroup, ListItem, BottomSheet } from '@harmonia/ui/native';
import {
  usePrivacy,
  exportPrivacyData,
  deletePrivacyAccount,
  syncPrivacy,
  setPrivacyConsent,
  privacyOwner,
} from '@/privacy/state';
import { useAuthState } from '@/auth';
import { ReminderControls } from '@/components/reminder-controls';
import { EmailSignIn } from '@/components/email-sign-in';
import { useDeviceState, initializeDeviceState } from '@/state/device';
import { downloadPrivateFile } from '@/privacy/download';
export default function PrivacyScreen() {
  const { t } = useTranslation(),
    router = useRouter(),
    state = usePrivacy(),
    auth = useAuthState(),
    age = useDeviceState((data) => data.data?.ageConfirmed ?? false);
  const devicePhase = useDeviceState((data) => data.phase);
  const [confirm, setConfirm] = useState(false),
    [ack, setAck] = useState(false),
    [error, setError] = useState<'export' | 'delete' | 'reauth' | 'consent' | null>(null),
    [done, setDone] = useState(false);
  const [confirmedActor, setConfirmedActor] = useState<string | null>(null);
  const actor = auth.session?.user.id ?? null;
  useEffect(() => {
    if (confirmedActor && confirmedActor !== actor) {
      setConfirm(false);
      setAck(false);
      setConfirmedActor(null);
      setError(null);
    }
  }, [actor, confirmedActor]);
  const account = auth.session?.user && !auth.session.user.is_anonymous;
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('privacy.title') }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <AppText variant="title1">{t('privacy.title')}</AppText>
          <AppText>{t('privacy.body')}</AppText>
          {devicePhase !== 'ready' ? (
            <Card>
              <AppText aria-live="polite">
                {t(devicePhase === 'error' ? 'onboarding.loadError' : 'onboarding.loading')}
              </AppText>
              {devicePhase === 'error' ? (
                <Button
                  label={t('onboarding.retry')}
                  onPress={() => {
                    void initializeDeviceState();
                  }}
                />
              ) : null}
            </Card>
          ) : null}
          <Button
            variant="ghost"
            label={t('legal.title')}
            onPress={() => {
              router.push('/legal');
            }}
          />
          <Card>
            <AppText variant="title3">{t('privacy.retentionTitle')}</AppText>
            <AppText>{t('privacy.retention')}</AppText>
          </Card>
          <AppText variant="title2">{t('privacy.choices')}</AppText>
          <ListGroup>
            <ListItem label={t('privacy.marketing')} value={t('privacy.inactive')} />
            <ListItem
              label={t('leagues.globalPushTitle')}
              last
              toggle={{
                value: state.choices.push,
                onValueChange: (granted) => {
                  setError(null);
                  void setPrivacyConsent('push', granted)
                    .then(async () => {
                      if (!granted && state.owner === privacyOwner())
                        await changeMotivationPreferences({ reminderConsent: false });
                    })
                    .then(() => syncPrivacy())
                    .then(() => refreshLeagues())
                    .catch(() => {
                      setError('consent');
                    });
                },
              }}
            />
          </ListGroup>
          <AppText variant="footnote" tone="muted">
            {t('leagues.globalPushBody')}
          </AppText>
          <Card>
            <AppText variant="title3">{t('analytics.choiceTitle')}</AppText>
            <AppText>{t('analytics.choiceBody')}</AppText>
            {account &&
            (state.choices.analytics ||
              (state.phase === 'ready' &&
                state.policy?.analyticsEnabled &&
                state.policy.legalPublished)) ? (
              <ListGroup>
                <ListItem
                  label={t('analytics.allow')}
                  toggle={{
                    value: state.choices.analytics,
                    onValueChange: (granted) => {
                      setError(null);
                      void setPrivacyConsent('analytics', granted).catch(() => {
                        setError('consent');
                      });
                    },
                  }}
                  last
                />
              </ListGroup>
            ) : (
              <AppText tone="muted">
                {t(account ? 'analytics.unavailable' : 'analytics.accountOnly')}
              </AppText>
            )}
          </Card>
          <AppText variant="footnote" tone="muted">
            {t('privacy.optionalLater')}
          </AppText>
          <ReminderControls />
          {state.pending ? (
            <>
              <AppText aria-live="polite">{t('privacy.pending')}</AppText>
              <Button
                variant="secondary"
                label={t('privacy.retry')}
                onPress={() => void syncPrivacy()}
              />
            </>
          ) : null}
          <AppText variant="title2">{t('privacy.exportTitle')}</AppText>
          <AppText>{t(account ? 'privacy.exportBody' : 'privacy.guestBody')}</AppText>
          <Button
            label={t('privacy.export')}
            disabled={state.busy || devicePhase !== 'ready'}
            onPress={() => {
              setError(null);
              void exportPrivacyData()
                .then(() => {
                  setDone(true);
                })
                .catch(() => {
                  setError('export');
                });
            }}
          />
          {done ? <AppText aria-live="polite">{t('privacy.exported')}</AppText> : null}
          {account ? (
            <>
              <AppText variant="title2">{t('privacy.deleteTitle')}</AppText>
              <AppText>{t('privacy.deleteBody')}</AppText>
              <Button
                variant="secondary"
                label={t('billing.title')}
                onPress={() => {
                  router.push('/subscription');
                }}
              />
              <Button
                variant="danger"
                label={t('privacy.delete')}
                disabled={state.busy || devicePhase !== 'ready'}
                onPress={() => {
                  setAck(false);
                  setConfirmedActor(actor);
                  setConfirm(true);
                  setError(null);
                }}
              />
            </>
          ) : null}
          {state.receipt ? (
            <Card>
              <AppText variant="title3">{t('privacy.deleted')}</AppText>
              <AppText>
                {t(
                  state.receipt.externalPending
                    ? 'privacy.externalPending'
                    : 'privacy.externalCompleted',
                )}
              </AppText>
              <Button
                label={t('privacy.saveReceipt')}
                onPress={() => {
                  void downloadPrivateFile(
                    JSON.stringify(state.receipt, null, 2),
                    'harmonia-erasure-' + (state.receipt?.id ?? 'receipt') + '.json',
                  ).catch(() => {
                    setError('export');
                  });
                }}
              />
            </Card>
          ) : null}
          {state.busy ? <AppText aria-live="polite">{t('privacy.working')}</AppText> : null}
          {error ? <AppText role="alert">{t(`privacy.error_${error}`)}</AppText> : null}
        </View>
      </ScrollView>
      <BottomSheet
        visible={confirm}
        closeLabel={t('privacy.cancel')}
        title={t('privacy.confirmTitle')}
        onClose={() => {
          if (!state.busy) setConfirm(false);
        }}
      >
        <View style={styles.content}>
          <AppText>{t('privacy.confirmBody')}</AppText>
          <ListGroup>
            <ListItem
              label={t('privacy.ackSubscriptions')}
              toggle={{ value: ack, onValueChange: setAck }}
              last
            />
          </ListGroup>
          {error === 'reauth' ? (
            <EmailSignIn
              reauthenticate
              ageConfirmed={age}
              onVerified={() => {
                setError(null);
              }}
            />
          ) : null}
          {error ? <AppText role="alert">{t(`privacy.error_${error}`)}</AppText> : null}
          <Button
            variant="danger"
            label={t('privacy.confirmDelete')}
            disabled={!ack || state.busy || confirmedActor !== actor}
            onPress={() => {
              setError(null);
              void deletePrivacyAccount()
                .then(() => {
                  setConfirm(false);
                })
                .catch((e: unknown) => {
                  setError(e instanceof Error && e.message === 'reauth' ? 'reauth' : 'delete');
                });
            }}
          />
          <Button
            variant="ghost"
            label={t('privacy.cancel')}
            disabled={state.busy}
            onPress={() => {
              setConfirm(false);
            }}
          />
        </View>
      </BottomSheet>
    </>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: LAYOUT.screenPadding },
  content: { alignSelf: 'center', width: '100%', maxWidth: LAYOUT.maxContentWidth, gap: SPACE.m },
});

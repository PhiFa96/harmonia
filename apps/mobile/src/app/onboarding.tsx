import { router } from 'expo-router';
import { ReminderControls } from '@/components/reminder-controls';
import { APP_LOCALES, LOCALE_NAMES } from '@harmonia/i18n';
import { LAYOUT, RADIUS, SPACE } from '@harmonia/ui';
import type { IconName } from '@harmonia/ui/native';
import {
  AppText,
  Button,
  Card,
  Icon,
  ListGroup,
  ListItem,
  ProgressBar,
  useUiTheme,
} from '@harmonia/ui/native';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DeviceStatus } from '@/components/device-status';
import { EmailSignIn } from '@/components/email-sign-in';
import { OnboardingChoices } from '@/components/onboarding-choices';
import { OnboardingMini } from '@/components/onboarding-mini';
import {
  ONBOARDING_STEPS,
  canContinue,
  nextOnboarding,
  previousOnboarding,
} from '@/onboarding/model';
import { finishOnboarding, updateOnboarding, useDeviceState } from '@/state/device';
import { useSettings } from '@/state/settings';
import { trackAnalytics } from '@/analytics/track';

const ICONS: Readonly<Record<(typeof ONBOARDING_STEPS)[number], IconName>> = {
  language: 'globe',
  goal: 'target',
  experience: 'person',
  placement: 'path',
  daily: 'flame',
  reminders: 'bell',
  mini: 'sparkle',
  account: 'person',
};
export default function OnboardingScreen() {
  const { t } = useTranslation(),
    { colors } = useUiTheme(),
    state = useDeviceState(),
    settings = useSettings(),
    data = state.data;
  const scroll = useRef<ScrollView>(null),
    heading = useRef<View>(null),
    [finishError, setFinishError] = useState(false);
  const step = data?.step === 'complete' ? 'account' : (data?.step ?? 'language');
  const title = t(`onboarding.${step}Title`);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    if (Platform.OS === 'web')
      (heading.current as unknown as HTMLElement | null)?.focus({ preventScroll: true });
    else AccessibilityInfo.announceForAccessibility(title);
  }, [step]);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (state.completing) return true;
      if (step === 'language') return false;
      updateOnboarding((d) => previousOnboarding(d));
      return true;
    });
    return () => {
      sub.remove();
    };
  }, [step, state.completing]);
  if (!data) return null;
  const index = ONBOARDING_STEPS.indexOf(step),
    disabled = state.completing;
  const finish = async () => {
    setFinishError(false);
    try {
      await finishOnboarding();
      trackAnalytics({ name: 'onboarding_completed' }, data.accountId ?? 'guest');
      router.replace({ pathname: '/paywall', params: { reason: 'onboarding' } });
    } catch {
      setFinishError(true);
    }
  };
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.brand}>
            <Icon name="sparkle" color={colors.primaryText} />
            <AppText variant="small" tone="primary">
              {t('onboarding.brand')}
            </AppText>
          </View>
          <ProgressBar
            value={index / ONBOARDING_STEPS.length}
            label={t('onboarding.progressLabel')}
            valueText={t('onboarding.progress', {
              current: index + 1,
              total: ONBOARDING_STEPS.length,
            })}
          />
          <AppText variant="footnote" tone="muted">
            {t('onboarding.progress', { current: index + 1, total: ONBOARDING_STEPS.length })}
          </AppText>
          <View style={[styles.symbol, { backgroundColor: colors.primarySoft }]}>
            <Icon name={ICONS[step]} color={colors.primaryText} size={SPACE.xl} />
          </View>
          <View
            ref={heading}
            aria-label={title}
            {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}
          >
            <AppText variant="title1">{title}</AppText>
          </View>
          <AppText tone="muted">{t(`onboarding.${step}Body`)}</AppText>
          {step === 'language' ? (
            <OnboardingChoices
              label={title}
              selected={settings.locale ?? 'device'}
              disabled={disabled}
              options={[
                {
                  value: 'device',
                  label: t('onboarding.languageDevice'),
                  description: t('onboarding.languageDeviceBody'),
                },
                ...APP_LOCALES.map((locale) => ({
                  value: locale,
                  label: LOCALE_NAMES[locale],
                  description: t(
                    locale === 'de'
                      ? 'onboarding.languageDeBody'
                      : locale === 'en-US'
                        ? 'onboarding.languageUsBody'
                        : 'onboarding.languageUkBody',
                  ),
                })),
              ]}
              onSelect={(locale) => {
                settings.setLocale(locale === 'device' ? null : locale);
              }}
            />
          ) : null}
          {step === 'goal' ? (
            <OnboardingChoices
              label={title}
              selected={data.goal}
              disabled={disabled}
              options={(['hobby', 'school', 'exam', 'ensemble'] as const).map((value) => ({
                value,
                label: t(`onboarding.goal_${value}`),
                description: t(`onboarding.goal_${value}Body`),
              }))}
              onSelect={(goal) => {
                updateOnboarding((d) => ({ ...d, goal }));
              }}
            />
          ) : null}
          {step === 'experience' ? (
            <OnboardingChoices
              label={title}
              selected={data.experience}
              disabled={disabled}
              options={(['new', 'basics', 'experienced'] as const).map((value) => ({
                value,
                label: t(`onboarding.experience_${value}`),
                description: t(`onboarding.experience_${value}Body`),
              }))}
              onSelect={(experience) => {
                updateOnboarding((d) => ({ ...d, experience }));
              }}
            />
          ) : null}
          {step === 'placement' ? (
            <>
              <OnboardingChoices
                label={title}
                selected={data.placement}
                disabled={disabled}
                options={(['later', 'requested'] as const).map((value) => ({
                  value,
                  label: t(`onboarding.placement_${value}`),
                }))}
                onSelect={(placement) => {
                  updateOnboarding((d) => ({ ...d, placement }));
                }}
              />
              <AppText variant="footnote" tone="muted">
                {t('onboarding.placementHint')}
              </AppText>
            </>
          ) : null}
          {step === 'daily' ? (
            <>
              <OnboardingChoices
                label={title}
                selected={data.dailyGoal}
                disabled={disabled}
                options={([10, 20, 30, 50] as const).map((value) => ({
                  value,
                  label: t('onboarding.dailyOption', { count: value }),
                }))}
                onSelect={(dailyGoal) => {
                  updateOnboarding((d) => ({ ...d, dailyGoal }));
                }}
              />
              <AppText variant="footnote" tone="muted">
                {t('onboarding.dailyHint')}
              </AppText>
            </>
          ) : null}
          {step === 'reminders' ? <ReminderControls /> : null}
          {step === 'mini' ? <OnboardingMini data={data} scroll={scroll} /> : null}
          {step === 'account' ? (
            <>
              <OnboardingChoices
                label={title}
                selected={data.account}
                disabled={disabled}
                options={(['guest', 'email'] as const).map((value) => ({
                  value,
                  label: t(`onboarding.account_${value}`),
                  description: t(`onboarding.account_${value}Body`),
                }))}
                onSelect={(account) => {
                  updateOnboarding((d) => ({
                    ...d,
                    account,
                    accountId: account === 'guest' ? null : d.accountId,
                  }));
                }}
              />
              <ListGroup>
                <ListItem
                  label={t('onboarding.ageConfirmed')}
                  toggle={{
                    value: data.ageConfirmed,
                    onValueChange: (ageConfirmed) => {
                      updateOnboarding((d) => ({ ...d, ageConfirmed }));
                    },
                  }}
                  last
                />
              </ListGroup>
              {data.account === 'email' ? (
                <EmailSignIn
                  ageConfirmed={data.ageConfirmed}
                  onVerified={(accountId) => {
                    updateOnboarding((d) => ({ ...d, account: 'email', accountId }));
                  }}
                />
              ) : null}
              <Card>
                <AppText variant="footnote" tone="muted">
                  {t('onboarding.localProgress')}
                </AppText>
              </Card>
            </>
          ) : null}
          <DeviceStatus />
          {finishError ? (
            <AppText role="alert" tone="danger">
              {t('onboarding.finishError')}
            </AppText>
          ) : null}
          {step !== 'mini' ? (
            <Button
              testID="setup-next"
              label={t(step === 'account' ? 'onboarding.finish' : 'onboarding.continue')}
              disabled={disabled || !canContinue(data)}
              onPress={() => {
                if (step === 'account') void finish();
                else updateOnboarding((d) => nextOnboarding(d, Date.now()));
              }}
            />
          ) : null}
          {step !== 'language' ? (
            <Button
              variant="ghost"
              size="medium"
              label={t('onboarding.back')}
              disabled={disabled}
              onPress={() => {
                updateOnboarding((d) => previousOnboarding(d));
              }}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flexGrow: 1, padding: LAYOUT.screenPadding, paddingBottom: SPACE.xxxl },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', gap: SPACE.m },
  brand: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s },
  symbol: {
    width: SPACE.xxxl,
    height: SPACE.xxxl,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

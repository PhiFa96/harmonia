import { RushLifecycle } from '@/components/rush-lifecycle';
import { DuelLifecycle } from '@/components/duel-lifecycle';
import { DailyPuzzleLifecycle } from '@/components/daily-puzzle-lifecycle';
import { FriendsLifecycle } from '@/components/friends-lifecycle';
import bravura from '@vexflow-fonts/bravura/bravura.otf';
import accidentals from '../../assets/fonts/HarmoniaAccidentals.otf';
import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import { Figtree_800ExtraBold } from '@expo-google-fonts/figtree/800ExtraBold';
import { ACCIDENTAL_FONT, FONT_FAMILIES, COLORS } from '@harmonia/ui';
import { UiProvider } from '@harmonia/ui/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, ThemeProvider, usePathname } from 'expo-router';
import type { ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { useTranslation } from 'react-i18next';

// Übersetzungen vor dem ersten Rendern einrichten
import '@/i18n';
import { useSettings } from '@/state/settings';
import { navigationTheme, useAppColorScheme } from '@/theme';
import { initializeDeviceState, startTemporarySession, useDeviceState } from '@/state/device';
import { initializeAuth } from '@/auth';
import { LeagueLifecycle } from '@/components/league-lifecycle';
import { MotivationLifecycle } from '@/components/motivation-lifecycle';
import { ReportLifecycle } from '@/components/report-lifecycle';
import { LearningLifecycle } from '@/components/learning-lifecycle';
import { PrivacyLifecycle } from '@/components/privacy-lifecycle';
import { AnalyticsLifecycle } from '@/components/analytics-lifecycle';
import { LegalFooter } from '@/components/legal-footer';
import { AccessLifecycle } from '@/components/access-lifecycle';
import { BillingLifecycle } from '@/components/billing-lifecycle';
import { ProfileLifecycle } from '@/components/profile-lifecycle';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const { t } = useTranslation();
  const device = useDeviceState();
  const pathname = usePathname();
  useEffect(() => {
    void initializeDeviceState();
    void initializeAuth();
  }, []);
  const scheme = useAppColorScheme();
  const reduceMotion = useSettings((state) => state.reduceMotion);
  const haptics = useSettings((state) => state.haptics);
  const theme = useMemo(() => navigationTheme(scheme), [scheme]);
  // Notenfont Bravura, Textschrift Figtree und Vorzeichen für Fließtext (alle SIL OFL 1.1). Bis sie geladen sind, nichts zeigen
  // (sonst erscheinen Ersatzzeichen bzw. springt die Schrift); schlägt das Laden fehl, startet die App trotzdem.
  const [fontsLoaded, fontError] = useFonts({
    Bravura: bravura,
    [ACCIDENTAL_FONT]: accidentals,
    [FONT_FAMILIES.regular]: Figtree_400Regular,
    [FONT_FAMILIES.semibold]: Figtree_600SemiBold,
    [FONT_FAMILIES.bold]: Figtree_700Bold,
    [FONT_FAMILIES.extrabold]: Figtree_800ExtraBold,
  });
  if (!fontsLoaded && !fontError) {
    return null;
  }
  return (
    <UiProvider scheme={scheme} reduceMotion={reduceMotion} haptics={haptics}>
      <ThemeProvider value={theme}>
        <QueryClientProvider client={queryClient}>
          <LearningLifecycle />
          <ProfileLifecycle />
          <ReportLifecycle />
          <MotivationLifecycle />
          <LeagueLifecycle />
          <RushLifecycle />
          <DuelLifecycle />
          <DailyPuzzleLifecycle />
          <FriendsLifecycle />
          <BillingLifecycle />
          <AccessLifecycle />
          <PrivacyLifecycle />
          <AnalyticsLifecycle />
          <View
            style={[bootStyles.application, { backgroundColor: COLORS[scheme].background }]}
            {...(Platform.OS === 'web' ? { role: 'main' as const } : {})}
          >
            {device.phase !== 'ready' &&
            !['/cancel-subscription', '/legal', '/privacy', '/auth/callback'].includes(pathname) ? (
              <View style={bootStyles.container}>
                <Card>
                  <AppText aria-live="polite">
                    {t(device.phase === 'error' ? 'onboarding.loadError' : 'onboarding.loading')}
                  </AppText>
                  {device.phase === 'error' ? (
                    <View style={bootStyles.actions}>
                      <Button
                        label={t('onboarding.retry')}
                        onPress={() => {
                          void initializeDeviceState();
                        }}
                      />
                      <Button
                        variant="ghost"
                        label={t('onboarding.temporary')}
                        onPress={startTemporarySession}
                      />
                    </View>
                  ) : null}
                </Card>
              </View>
            ) : (
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Protected guard={!device.completed}>
                  <Stack.Screen name="onboarding" />
                </Stack.Protected>
                <Stack.Protected guard={device.completed}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="lesson" />
                  <Stack.Screen name="rush" />
                  <Stack.Screen name="duel" />
                  <Stack.Screen name="daily-puzzle" />
                  <Stack.Screen name="friends" />
                  <Stack.Screen name="article" />
                  <Stack.Screen name="tutor-task" />
                  <Stack.Screen name="note-input" />
                  <Stack.Screen name="audio-test" />
                  <Stack.Screen name="gallery" />
                  <Stack.Screen name="preferences" />
                  <Stack.Screen name="account" />
                  <Stack.Screen name="subscription" />
                  <Stack.Screen name="paywall" />
                  <Stack.Screen name="placement" />
                </Stack.Protected>
                <Stack.Screen name="report" />
                <Stack.Screen name="cancel-subscription" />
                <Stack.Screen name="legal" />
                <Stack.Screen name="privacy" />
                <Stack.Screen name="auth/callback" />
                <Stack.Screen name="+not-found" />
              </Stack>
            )}
            <LegalFooter />
          </View>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        </QueryClientProvider>
      </ThemeProvider>
    </UiProvider>
  );
}
/** A render failure must not expose raw errors or destroy a learner's saved work. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();
  const scheme = useAppColorScheme();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <UiProvider scheme={scheme}>
      <View
        style={[bootStyles.application, { backgroundColor: COLORS[scheme].background }]}
        {...(Platform.OS === 'web' ? { role: 'main' as const } : {})}
      >
        <View style={bootStyles.container}>
          <Card>
            <AppText variant="title1">{t('quality.failureTitle')}</AppText>
            <AppText>{t('quality.failureBody')}</AppText>
            {failed ? <AppText role="alert">{t('quality.retryFailed')}</AppText> : null}
            <Button
              label={t('onboarding.retry')}
              disabled={busy}
              onPress={() => {
                setBusy(true);
                setFailed(false);
                void Promise.resolve()
                  .then(retry)
                  .catch(() => {
                    setFailed(true);
                  })
                  .finally(() => {
                    setBusy(false);
                  });
              }}
            />
          </Card>
        </View>
      </View>
    </UiProvider>
  );
}
const bootStyles = StyleSheet.create({
  application: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: LAYOUT.screenPadding,
    maxWidth: LAYOUT.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  actions: { marginTop: SPACE.m, gap: SPACE.s },
});

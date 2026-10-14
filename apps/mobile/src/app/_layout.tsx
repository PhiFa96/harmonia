import bravura from '@vexflow-fonts/bravura/bravura.otf';
import accidentals from '../../assets/fonts/HarmoniaAccidentals.otf';
import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import { Figtree_800ExtraBold } from '@expo-google-fonts/figtree/800ExtraBold';
import { ACCIDENTAL_FONT, FONT_FAMILIES } from '@harmonia/ui';
import { UiProvider } from '@harmonia/ui/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { useTranslation } from 'react-i18next';

// Übersetzungen vor dem ersten Rendern einrichten
import '@/i18n';
import { useSettings } from '@/state/settings';
import { navigationTheme, useAppColorScheme } from '@/theme';
import { initializeDeviceState, startTemporarySession, useDeviceState } from '@/state/device';
import { initializeAuth } from '@/auth';
import { MotivationLifecycle } from '@/components/motivation-lifecycle';
import { ReportLifecycle } from '@/components/report-lifecycle';
import { LearningLifecycle } from '@/components/learning-lifecycle';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const { t } = useTranslation();
  const device = useDeviceState();
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
          <ReportLifecycle />
          <MotivationLifecycle />
          {device.phase !== 'ready' ? (
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
                <Stack.Screen name="article" />
                <Stack.Screen name="note-input" />
                <Stack.Screen name="audio-test" />
                <Stack.Screen name="gallery" />
                <Stack.Screen name="preferences" />
                <Stack.Screen name="account" />
                <Stack.Screen name="placement" />
              </Stack.Protected>
              <Stack.Screen name="report" />
            </Stack>
          )}
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        </QueryClientProvider>
      </ThemeProvider>
    </UiProvider>
  );
}
const bootStyles = StyleSheet.create({
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

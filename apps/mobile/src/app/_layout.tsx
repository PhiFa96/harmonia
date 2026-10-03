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
import { useMemo, useState } from 'react';

// Übersetzungen vor dem ersten Rendern einrichten
import '@/i18n';
import { useSettings } from '@/state/settings';
import { navigationTheme, useAppColorScheme } from '@/theme';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
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
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        </QueryClientProvider>
      </ThemeProvider>
    </UiProvider>
  );
}

import bravura from '@vexflow-fonts/bravura/bravura.otf';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const scheme = useColorScheme();
  // Notenfont Bravura (SIL OFL 1.1). Bis er geladen ist, nichts zeigen (sonst erscheinen Ersatzzeichen);
  // schlägt das Laden fehl, startet die App trotzdem.
  const [fontsLoaded, fontError] = useFonts({ Bravura: bravura });
  if (!fontsLoaded && !fontError) {
    return null;
  }
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

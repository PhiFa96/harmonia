// Expo-Konfiguration mit drei Umgebungen über APP_VARIANT: development (Standard), preview, production.
// Die Bundle-IDs sind Platzhalter, bis Name und Domain feststehen (F16); vor dem ersten Store-Build festlegen.

import type { ConfigContext, ExpoConfig } from 'expo/config';

type Variant = 'development' | 'preview' | 'production';

const VARIANTS: Readonly<Record<Variant, { name: string; id: string }>> = {
  development: { name: 'Harmonia (Dev)', id: 'app.harmonia.mobile.dev' },
  preview: { name: 'Harmonia (Vorschau)', id: 'app.harmonia.mobile.preview' },
  production: { name: 'Harmonia', id: 'app.harmonia.mobile' },
};

function currentVariant(): Variant {
  // process.env ist im React-Native-Umfeld als `any` deklariert, deshalb ausdrücklich prüfen.
  const raw: unknown = process.env['APP_VARIANT'];
  const value = typeof raw === 'string' && raw !== '' ? raw : 'development';
  if (value === 'development' || value === 'preview' || value === 'production') {
    return value;
  }
  throw new Error(`Unbekannte APP_VARIANT: ${value} (erlaubt: development, preview, production)`);
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = currentVariant();
  const { name, id } = VARIANTS[variant];
  return {
    ...config,
    name,
    slug: 'harmonia',
    scheme: 'harmonia',
    version: '0.1.0',
    orientation: 'default',
    userInterfaceStyle: 'automatic',
    ios: { bundleIdentifier: id, supportsTablet: true },
    android: { package: id },
    web: { output: 'single', bundler: 'metro' },
    plugins: [
      'expo-router',
      'expo-localization',
      'expo-sqlite',
      [
        'react-native-audio-api',
        {
          // Klang nur im Vordergrund: kein Hintergrund-Audio (iOS) und kein Vordergrunddienst (Android).
          // Beides bräuchte eine Begründung im App-Review und eine Benachrichtigung auf Android.
          iosBackgroundMode: false,
          androidForegroundService: false,
          androidPermissions: [],
        },
      ],
    ],
    extra: { variant },
  };
};

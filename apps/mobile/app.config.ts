// Expo-Konfiguration mit drei Umgebungen über APP_VARIANT: development (Standard), preview, production.
// Die Bundle-IDs sind Platzhalter, bis Name und Domain feststehen (F16); vor dem ersten Store-Build festlegen.

import type { ConfigContext, ExpoConfig } from 'expo/config';
import { configuredAuth } from './src/auth/config.ts';
import { billingConfig } from './src/billing/config.ts';

import readiness from './legal-readiness.json' with { type: 'json' };
import { legalReleaseMissing } from './src/legal/readiness.ts';
import { legalConfig } from './src/legal/config.ts';

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
  // Vor Metro abbrechen, damit ein versehentlich eingetragener Service-Schlüssel nie in ein Bundle gelangt.
  configuredAuth();
  billingConfig();
  legalConfig();
  if (
    process.env.EXPO_PUBLIC_LEGAL_RELEASE_APPROVED === 'true' &&
    legalReleaseMissing(readiness).length
  )
    throw new Error('Legal release evidence is incomplete');
  const variant = currentVariant();
  if (process.env['EAS_BUILD_PROFILE'] === 'beta' && variant !== 'production')
    throw new Error('Beta-Builds verwenden ausschließlich den freigegebenen Produktionskatalog.');
  const { name, id } = VARIANTS[variant];
  // Öffentliche Projekt-ID, keine Zugangsdaten. Ohne Bindung bleiben OTA-Updates deaktiviert.
  const rawProjectId: unknown = process.env['EAS_PROJECT_ID'];
  const projectId =
    typeof rawProjectId === 'string' && rawProjectId !== '' ? rawProjectId : undefined;
  if (
    projectId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)
  ) {
    throw new Error('EAS_PROJECT_ID muss eine gültige UUID sein.');
  }
  return {
    ...config,
    name,
    slug: 'harmonia',
    scheme: 'harmonia',
    version: '0.1.0',
    runtimeVersion: { policy: 'appVersion' },
    updates: {
      enabled: projectId !== undefined,
      ...(projectId ? { url: `https://u.expo.dev/${projectId}` } : {}),
    },
    orientation: 'default',
    userInterfaceStyle: 'automatic',
    ios: { bundleIdentifier: id, supportsTablet: true },
    android: { package: id },
    web: { output: 'single', bundler: 'metro' },
    plugins: [
      'expo-router',
      'expo-localization',
      'expo-sqlite',
      'expo-secure-store',
      [
        'expo-notifications',
        { defaultChannel: 'learning', enableBackgroundRemoteNotifications: false },
      ],
      [
        'react-native-audio-api',
        {
          // Klang nur im Vordergrund: kein Hintergrund-Audio (iOS) und kein Vordergrunddienst (Android).
          // Beides bräuchte eine Begründung im App-Review und eine Benachrichtigung auf Android.
          iosBackgroundMode: false,
          androidForegroundService: false,
          androidPermissions: ['android.permission.RECORD_AUDIO'],
          iosMicrophonePermission:
            'Harmonia uses the microphone only while you tune a note. Audio stays on this device and is not saved or uploaded.',
        },
      ],
    ],
    extra: { variant, ...(projectId ? { eas: { projectId } } : {}) },
  };
};

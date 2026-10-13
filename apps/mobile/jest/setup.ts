// Tests laufen ohne echte Schriftdateien: Fonts gelten als geladen.
jest.mock('expo-font', () => ({
  ...jest.requireActual<object>('expo-font'),
  useFonts: () => [true, null],
}));

// Klang: react-native-audio-api bringt eine Attrappe für Jest mit (keine native Audio-Ausgabe im Test).
// Ihr AudioManager kennt setAudioSessionOptions nicht (Version 0.13.6); hier ergänzt.
jest.mock('react-native-audio-api', () => {
  const mock = jest.requireActual<{ AudioManager: object }>('react-native-audio-api/mock');
  return {
    ...mock,
    AudioManager: Object.assign(mock.AudioManager, { setAudioSessionOptions: jest.fn() }),
  };
});

// Animationen: Reanimated bringt eine Attrappe mit (Werte werden sofort gesetzt, Layout-Animationen entfallen).
// Die Test-Bibliothek von expo-router setzt dieselbe Attrappe; hier für Tests ohne Router.
jest.mock('react-native-reanimated', () =>
  jest.requireActual<object>('react-native-reanimated/mock'),
);
jest.mock('react-native-worklets', () =>
  jest.requireActual<object>('react-native-worklets/lib/module/mock'),
);

// Gerätedatenbank wird separat mit echter SQLite geprüft; UI-Tests ersetzen nur den Treiber.
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      execAsync: jest.fn(() => Promise.resolve()),
      runAsync: jest.fn(() => Promise.resolve()),
      getFirstAsync: jest.fn(() => Promise.resolve(null)),
      closeAsync: jest.fn(() => Promise.resolve()),
    }),
  ),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => '00000000-0000-4000-8000-000000000001' }));

// Bestehende Routen prüfen ein bereits eingerichtetes Gerät. Der echte neue Ablauf,
// Loader, SQLite-Neustart und Fehlerfälle werden in den Onboarding-Prüfungen abgedeckt.
jest.mock('@/state/device', () => ({
  ...jest.requireActual<object>('@/state/device'),
  initializeDeviceState: () => Promise.resolve(),
}));

// Screen-Prüfungen verwenden einen vorbereiteten Pfad. Repository, Freischaltung
// und Synchronisation werden separat mit echten Nachweisen geprüft.
jest.mock('expo-network', () => ({
  useNetworkState: () => ({ isConnected: true, isInternetReachable: true }),
}));
jest.mock('@/state/learning', () => ({
  ...jest.requireActual<object>('@/state/learning'),
  initializeLearning: () => Promise.resolve(),
  syncLearning: () => Promise.resolve(),
  recordLessonLearning: () => Promise.resolve(),
}));

// Eigene Meldungsdatenbank und Sync werden separat geprüft.
jest.mock('@/state/reports', () => ({
  ...jest.requireActual<object>('@/state/reports'),
  initializeReports: () => Promise.resolve(),
  syncReports: () => Promise.resolve(),
}));

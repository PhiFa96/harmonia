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

// Systemberechtigungen und Zustellung werden im Erinnerungsadapter separat geprüft.
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true })),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('reminder-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
  addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExpoPushToken[test]' })),
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { DEFAULT: 3 },
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' },
}));
jest.mock('expo-device', () => ({ isDevice: false }));
jest.mock('@/state/motivation', () => ({
  ...jest.requireActual<object>('@/state/motivation'),
  initializeMotivation: () => Promise.resolve(),
  syncMotivation: () => Promise.resolve(),
}));
jest.mock('@/reminders', () => ({
  ...jest.requireActual<object>('@/reminders'),
  reconcileReminders: () => Promise.resolve(),
  refreshReminderPermission: () => Promise.resolve(),
  initializeReminderHandler: () => undefined,
}));

// Existing exercise/notation UI tests isolate grading from access transport.
// P2.20 separately tests real SQLite, server decisions and blocked/pending UI.
jest.mock('@/access/state', () => ({
  ...jest.requireActual<object>('@/access/state'),
  initializeAccess: () => undefined,
  refreshAccess: () => Promise.resolve(),
  authorizeStart: jest.fn((id: string) =>
    Promise.resolve({ allowed: true, reason: 'allowed', id, cost: 0 }),
  ),
}));

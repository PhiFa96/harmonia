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

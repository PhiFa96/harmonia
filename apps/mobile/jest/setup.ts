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

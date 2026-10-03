// Tests laufen ohne echte Schriftdateien: Fonts gelten als geladen.
jest.mock('expo-font', () => ({
  ...jest.requireActual<object>('expo-font'),
  useFonts: () => [true, null],
}));

import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { AudioManager } from 'react-native-audio-api';

import { i18n } from '@/i18n';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));

beforeEach(() => {
  void i18n.changeLanguage('de');
});

describe('Audio-Test', () => {
  it('erreichbar über das Profil', () => {
    renderRouter('./src/app', { initialUrl: '/profile' });
    expect(screen.getByText('Audio-Test (Messungen)')).toBeTruthy();
  });

  it('Klang startet beim Berühren; danach Abtastrate und Hinweis zur Latenz', () => {
    renderRouter('./src/app', { initialUrl: '/audio-test' });
    expect(screen.getByText('Der Klang startet beim ersten Tippen.')).toBeTruthy();
    fireEvent(screen.getByText('Ton a¹'), 'pressIn');
    expect(screen.getByText(/^Abtastrate: [\d.]+ Hz/)).toBeTruthy();
  });

  it('iOS: Audio-Session für ausdrücklich gestartete Wiedergabe (vorläufig bis F12)', () => {
    const setOptions = jest.spyOn(AudioManager, 'setAudioSessionOptions');
    renderRouter('./src/app', { initialUrl: '/audio-test' });
    fireEvent(screen.getByText('Ton a¹'), 'pressIn');
    expect(setOptions).toHaveBeenCalledWith({
      iosCategory: 'playback',
      iosMode: 'default',
      iosOptions: ['mixWithOthers'],
    });
  });

  it('Akkord, Sequenz, Metronom und Stopp laufen ohne Fehler', () => {
    renderRouter('./src/app', { initialUrl: '/audio-test' });
    for (const label of [
      'C-Dur-Dreiklang',
      'Tonleiter mit Metronom',
      'Metronom 90 BPM',
      'Alles stoppen',
    ]) {
      fireEvent(screen.getByText(label), 'pressIn');
    }
    expect(screen.getByText(/^Abtastrate/)).toBeTruthy();
  });
});

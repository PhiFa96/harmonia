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
  it('erreichbar über das Profil, dort auch der Lizenzhinweis zum Klavier', () => {
    renderRouter('./src/app', { initialUrl: '/profile' });
    expect(screen.getByText('Audio-Test (Messungen)')).toBeTruthy();
    expect(screen.getByText(/Salamander Grand Piano von Alexander Holm, CC BY 3\.0/)).toBeTruthy();
  });

  it('Klang startet beim Berühren; danach Abtastrate, Latenzhinweis und Klavier geladen', async () => {
    renderRouter('./src/app', { initialUrl: '/audio-test' });
    expect(screen.getByText('Der Klang startet beim ersten Tippen.')).toBeTruthy();
    expect(screen.getByText('Klavier: lädt beim ersten Ton.')).toBeTruthy();
    fireEvent(screen.getByText('Ton a¹'), 'pressIn');
    expect(screen.getByText(/^Abtastrate: [\d.]+ Hz/)).toBeTruthy();
    expect(await screen.findByText('Klavier bereit.')).toBeTruthy();
  });

  it('iOS: Audio-Session für ausdrücklich gestartete Wiedergabe (F12)', async () => {
    const setOptions = jest.spyOn(AudioManager, 'setAudioSessionOptions');
    renderRouter('./src/app', { initialUrl: '/audio-test' });
    fireEvent(screen.getByText('Ton a¹'), 'pressIn');
    expect(setOptions).toHaveBeenCalledWith({
      iosCategory: 'playback',
      iosMode: 'default',
      iosOptions: ['mixWithOthers'],
    });
    await screen.findByText('Klavier bereit.');
  });

  it('Akkord, Sequenz, Metronom und Stopp laufen ohne Fehler', async () => {
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
    await screen.findByText('Klavier bereit.');
  });
});

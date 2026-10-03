import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));

beforeEach(() => {
  useSettings.setState({ locale: null, appearance: 'system', reduceMotion: false, haptics: true });
  void i18n.changeLanguage('de');
});

describe('Einstellungen im Profil', () => {
  it('Vibration und „Bewegung reduzieren“ sind Schalter mit Zustand', () => {
    renderRouter('./src/app', { initialUrl: '/profile' });
    fireEvent.press(screen.getByRole('switch', { name: 'Vibration', checked: true }));
    expect(useSettings.getState().haptics).toBe(false);
    expect(screen.getByRole('switch', { name: 'Vibration', checked: false })).toBeTruthy();
    fireEvent.press(screen.getByRole('switch', { name: 'Bewegung reduzieren', checked: false }));
    expect(useSettings.getState().reduceMotion).toBe(true);
  });

  it('Erscheinungsbild im Blatt von unten wählen', () => {
    renderRouter('./src/app', { initialUrl: '/profile' });
    fireEvent.press(screen.getByRole('button', { name: 'Erscheinungsbild, Wie das Gerät' }));
    expect(screen.getByRole('radio', { name: 'Wie das Gerät', checked: true })).toBeTruthy();
    fireEvent.press(screen.getByRole('radio', { name: 'Dunkel' }));
    expect(useSettings.getState().appearance).toBe('dark');
    expect(screen.getByRole('button', { name: 'Erscheinungsbild, Dunkel' })).toBeTruthy();
  });

  it('Blatt schließt mit dem Schließen-Knopf', () => {
    renderRouter('./src/app', { initialUrl: '/profile' });
    fireEvent.press(screen.getByRole('button', { name: 'Erscheinungsbild, Wie das Gerät' }));
    fireEvent.press(screen.getByRole('button', { name: 'Schließen' }));
    expect(screen.queryByRole('radio', { name: 'Dunkel' })).toBeNull();
  });

  it('nennt die Lizenz der Textschrift', () => {
    renderRouter('./src/app', { initialUrl: '/profile' });
    expect(screen.getByText(/Figtree.*SIL Open Font License 1\.1/)).toBeTruthy();
  });
});

describe('Galerie der Bausteine (Entwicklung)', () => {
  it('erreichbar über das Profil; zeigt Bausteine und reagiert', () => {
    const router = renderRouter('./src/app', { initialUrl: '/profile' });
    fireEvent.press(screen.getByRole('button', { name: 'Bausteine (nur Entwicklung)' }));
    expect(router.getPathname()).toBe('/gallery');
    expect(screen.getByRole('progressbar', { value: { now: 40, text: '4 von 10' } })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Eine Runde weiter' }));
    expect(screen.getByRole('progressbar', { value: { now: 50 } })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Richtig!' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Noch nicht ganz' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Blatt öffnen' }));
    expect(screen.getByRole('heading', { name: 'Erscheinungsbild' })).toBeTruthy();
  });
});

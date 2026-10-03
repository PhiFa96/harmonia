import type { Locale } from 'expo-localization';
import { getLocales } from 'expo-localization';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { deviceLocale, i18n } from '@/i18n';
import { useSettings } from '@/state/settings';

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'de', regionCode: 'DE' }]),
}));

/** Bevorzugte Sprache des Geräts setzen und die App-Sprache neu bestimmen. */
function setDevice(languageCode: string, regionCode: string): void {
  jest.mocked(getLocales).mockReturnValue([{ languageCode, regionCode } as Locale]);
  void i18n.changeLanguage(deviceLocale());
}

beforeEach(() => {
  useSettings.setState({ locale: null });
  setDevice('de', 'DE');
});

describe('Grundnavigation', () => {
  it('zeigt die drei Tabs in der Gerätesprache', () => {
    renderRouter('./src/app', { initialUrl: '/' });
    expect(screen.getAllByText('Lernen').length).toBeGreaterThan(0);
    expect(screen.getByText('Üben')).toBeTruthy();
    expect(screen.getByText('Profil')).toBeTruthy();
  });

  it('wechselt zu Profil und schaltet die Sprache zur Laufzeit um', () => {
    const router = renderRouter('./src/app', { initialUrl: '/profile' });
    expect(router.getPathname()).toBe('/profile');
    fireEvent.press(screen.getByText('English (US)'));
    expect(screen.getAllByText('Profile').length).toBeGreaterThan(0);
    expect(screen.getByText('Learn')).toBeTruthy();
    expect(screen.getByText('Licenses')).toBeTruthy();
    fireEvent.press(screen.getByText('English (UK)'));
    expect(screen.getByText('Licences')).toBeTruthy();
    fireEvent.press(screen.getByText('Same as device'));
    expect(screen.getByText('Lizenzen')).toBeTruthy();
  });

  it('nennt die Lizenz des Notenfonts', () => {
    renderRouter('./src/app', { initialUrl: '/profile' });
    expect(screen.getByText(/Bravura.*SIL Open Font License 1\.1/)).toBeTruthy();
  });
});

describe('Englisch: US- und UK-Begriffe', () => {
  it('Gerät in Australien: britische Begriffe in Text und Notenbild', () => {
    setDevice('en', 'AU');
    renderRouter('./src/app', { initialUrl: '/' });
    expect(screen.getByText('Example: C major scale in crotchets')).toBeTruthy();
    expect(screen.getByLabelText('Crotchet, C 4')).toBeTruthy();
  });

  it('Gerät in den USA: amerikanische Begriffe', () => {
    setDevice('en', 'US');
    renderRouter('./src/app', { initialUrl: '/' });
    expect(screen.getByText('Example: C major scale in quarter notes')).toBeTruthy();
    expect(screen.getByLabelText('Quarter note, C 4')).toBeTruthy();
  });
});

describe('Notenbild', () => {
  it('jede Note ist für Screenreader beschriftet (Deutsch)', () => {
    renderRouter('./src/app', { initialUrl: '/' });
    expect(screen.getByText('Beispiel: C-Dur-Tonleiter in Viertelnoten')).toBeTruthy();
    expect(screen.getByLabelText('Viertelnote, eingestrichenes c')).toBeTruthy();
    expect(screen.getByLabelText('Viertelnote, zweigestrichenes c')).toBeTruthy();
    expect(screen.getAllByRole('img')).toHaveLength(8);
  });

  it('Beschriftung folgt der gewählten Sprache', () => {
    useSettings.setState({ locale: 'en-US' });
    renderRouter('./src/app', { initialUrl: '/' });
    expect(screen.getByLabelText('Quarter note, C 4')).toBeTruthy();
  });
});

import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { useSettings } from '@/state/settings';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de' }],
}));

beforeEach(() => {
  useSettings.setState({ language: null });
});

describe('Grundnavigation', () => {
  it('zeigt die drei Tabs in der Gerätesprache', () => {
    renderRouter('./src/app', { initialUrl: '/' });
    expect(screen.getAllByText('Lernen').length).toBeGreaterThan(0);
    expect(screen.getByText('Üben')).toBeTruthy();
    expect(screen.getByText('Profil')).toBeTruthy();
  });

  it('wechselt zu Profil und schaltet die Sprache um', () => {
    const router = renderRouter('./src/app', { initialUrl: '/profile' });
    expect(router.getPathname()).toBe('/profile');
    fireEvent.press(screen.getByText('English'));
    expect(screen.getAllByText('Profile').length).toBeGreaterThan(0);
    expect(screen.getByText('Learn')).toBeTruthy();
  });
});

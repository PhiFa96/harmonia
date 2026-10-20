import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));
jest.mock('@harmonia/content/catalogue', () => ({
  catalogue: {
    schemaVersion: 1,
    contentVersion: 1,
    areas: [],
    levels: [],
    units: [],
    skills: [],
    exerciseSets: [],
    knowledgeCards: [],
    knowledgeArticles: [],
    lessons: [],
  },
}));
const mockRepository = jest.fn<Promise<never>, []>();
jest.mock('@/storage/lessons', () => ({ getLessonRepository: () => mockRepository() }));

beforeEach(() => {
  mockRepository.mockClear();
  useSettings.setState({ locale: null });
  void i18n.changeLanguage('de');
});

it('zeigt bei leerem öffentlichen Katalog keine Entwurfslektion und lädt keine Ergebnisse dafür', () => {
  renderRouter('./src/app', { initialUrl: '/' });
  expect(
    screen.getByText('Neue Lektionen werden vorbereitet. Du kannst schon frei üben.'),
  ).toBeTruthy();
  expect(screen.queryByText('Lektion ansehen')).toBeNull();
  expect(mockRepository).not.toHaveBeenCalled();
});
it('ein direkter Einstufungslink verwendet im öffentlichen Build keine Entwurfsaufgaben', () => {
  renderRouter('./src/app', { initialUrl: '/placement' });
  expect(
    screen.getByText(/Der Einstufungstest braucht fachlich freigegebene Kursaufgaben/),
  ).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Test beginnen' })).toBeNull();
  expect(screen.queryByTestId('exercise-question')).toBeNull();
});

it('ein direkter Lektionslink umgeht die Freigabe nicht; Rückweg und Englisch funktionieren', () => {
  useSettings.setState({ locale: 'en-US' });
  const router = renderRouter('./src/app', { initialUrl: '/lesson' });
  expect(
    screen.getByText('New lessons are being prepared. You can already practice freely.'),
  ).toBeTruthy();
  expect(screen.queryByText(/Introduction 1/)).toBeNull();
  expect(screen.queryByText('Start 10 questions')).toBeNull();
  fireEvent.press(screen.getByText('Back to learning'));
  expect(router.getPathname()).toBe('/');
  expect(mockRepository).not.toHaveBeenCalled();
});

it.each(['anchor', 'positions', 'reading'])(
  'ein Direktlink zur neuen %s-Lektion lädt im öffentlichen Build keinen Entwurf oder Verlauf',
  (name) => {
    renderRouter('./src/app', { initialUrl: `/lesson?id=notation.l1.staff.${name}` });
    expect(
      screen.getByText('Neue Lektionen werden vorbereitet. Du kannst schon frei üben.'),
    ).toBeTruthy();
    expect(screen.queryByText(/Einführung 1/)).toBeNull();
    expect(mockRepository).not.toHaveBeenCalled();
  },
);

it.each(['keys', 'steps', 'accidentals'])(
  'die interne Klaviaturlektion %s samt Beispiel ist im öffentlichen Katalog nicht erreichbar',
  (name) => {
    renderRouter('./src/app', { initialUrl: `/lesson?id=notation.l1.keyboard.${name}` });
    expect(
      screen.getByText('Neue Lektionen werden vorbereitet. Du kannst schon frei üben.'),
    ).toBeTruthy();
    expect(screen.queryByTestId('keyboard-example')).toBeNull();
    expect(screen.queryByTestId('piano-canvas')).toBeNull();
    expect(mockRepository).not.toHaveBeenCalled();
  },
);

it.each(['octaves', 'ledger', 'match'])(
  'die interne Registerlektion %s ist im öffentlichen Katalog nicht erreichbar',
  (name) => {
    renderRouter('./src/app', { initialUrl: `/lesson?id=notation.l1.register.${name}` });
    expect(
      screen.getByText('Neue Lektionen werden vorbereitet. Du kannst schon frei üben.'),
    ).toBeTruthy();
    expect(screen.queryByTestId('keyboard-example')).toBeNull();
    expect(screen.queryByTestId('piano-canvas')).toBeNull();
    expect(mockRepository).not.toHaveBeenCalled();
  },
);

it.each(['steady', 'tempo', 'groups'])(
  'die interne Pulslektion %s samt Klangbeispiel ist öffentlich nicht erreichbar',
  (name) => {
    renderRouter('./src/app', { initialUrl: `/lesson?id=rhythm.l1.pulse.${name}` });
    expect(
      screen.getByText('Neue Lektionen werden vorbereitet. Du kannst schon frei üben.'),
    ).toBeTruthy();
    expect(screen.queryByTestId('pulse-example')).toBeNull();
    expect(mockRepository).not.toHaveBeenCalled();
  },
);

it.each(['notes', 'rests', 'fill'])(
  'die interne Notenwertlektion %s samt Klangbeispiel ist öffentlich nicht erreichbar',
  (name) => {
    renderRouter('./src/app', { initialUrl: `/lesson?id=rhythm.l1.values.${name}` });
    expect(
      screen.getByText('Neue Lektionen werden vorbereitet. Du kannst schon frei üben.'),
    ).toBeTruthy();
    expect(screen.queryByTestId('duration-symbol')).toBeNull();
    expect(mockRepository).not.toHaveBeenCalled();
  },
);

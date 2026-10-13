import { fireEvent, renderRouter, screen, within } from 'expo-router/testing-library';
import { catalogue } from '@harmonia/content/authoring';
import { learningPath } from '@harmonia/content';
import { useLearningState } from '@/state/learning';
import { useAuthState } from '@/auth';
import { useSettings } from '@/state/settings';
import { i18n } from '@/i18n';
import type { ParseKeys } from 'i18next';
const title = (key: string): string => {
  if (!i18n.exists(key)) throw new Error('Übersetzung fehlt');
  return i18n.t(key as ParseKeys);
};
function fresh() {
  useLearningState.setState({
    phase: 'ready',
    scope: 'guest',
    path: learningPath(catalogue, []),
    expanded: [],
    areaId: null,
    level: null,
    memory: false,
    sync: 'guest',
    rows: [],
    outdated: 0,
  });
}
beforeEach(() => {
  useAuthState.setState({ ready: true, session: null, error: false });
  useSettings.setState({ locale: 'de' });
  fresh();
});
describe('Lernpfad und gesicherte Lektionszugänge', () => {
  it('zeigt Status, die verbindliche Regel und gesperrte weitere Lektionen', () => {
    renderRouter('./src/app', { initialUrl: '/' });
    expect(screen.getByText('Dein Lernpfad')).toBeTruthy();
    expect(screen.getByText(/mindestens 80 % richtige Erstversuchsantworten/)).toBeTruthy();
    const unit = useLearningState
      .getState()
      .path.find((u) => u.status === 'open' && u.lessons.length > 1);
    if (!unit) throw new Error('Einheit fehlt');
    const card = within(screen.getByTestId(`lesson-group-${unit.id}`));
    fireEvent.press(
      card.getByRole('button', { name: `Lektionen in ${title(unit.titleKey)} anzeigen` }),
    );
    const first = unit.lessons[0],
      second = unit.lessons[1];
    if (!first || !second) throw new Error('Lektion fehlt');
    expect(card.getByRole('button', { name: `${title(first.titleKey)} öffnen` })).toBeEnabled();
    expect(card.getByRole('button', { name: `${title(second.titleKey)} öffnen` })).toBeDisabled();
  });
  it('ein direkter Link umgeht die Freischaltung nicht', () => {
    const locked = useLearningState
      .getState()
      .path.flatMap((u) => u.lessons)
      .find((l) => l.status === 'locked');
    if (!locked) throw new Error('Lektion fehlt');
    renderRouter('./src/app', { initialUrl: `/lesson?id=${locked.id}` });
    expect(screen.getByText(/Diese Lektion ist noch gesperrt/)).toBeTruthy();
    expect(screen.queryByText(/^Aufgabe 1 von/)).toBeNull();
  });
  it('Kontowechsel und Ladephase zeigen keine fremde oder noch ungeprüfte Lektion', () => {
    useLearningState.setState({ scope: 'another-account' });
    renderRouter('./src/app', { initialUrl: '/lesson' });
    expect(screen.getByText('Lernpfad wird geladen …')).toBeTruthy();
    expect(screen.queryByText(/^Einführung 1 von/)).toBeNull();
  });
  it('getestete Einheiten sind ohne Abschlussgutschrift freiwillig erreichbar', () => {
    useLearningState.setState({
      path: learningPath(
        catalogue,
        [],
        catalogue.units.map((u) => u.id),
      ),
    });
    const lesson = catalogue.lessons.find((l) => l.id.startsWith('notation.l2'));
    if (!lesson) throw new Error('Lektion fehlt');
    renderRouter('./src/app', { initialUrl: `/lesson?id=${lesson.id}` });
    expect(screen.queryByText(/Diese Lektion ist noch gesperrt/)).toBeNull();
    expect(screen.getByText(/^Einführung 1 von/)).toBeTruthy();
  });
  it('wechselt Bereiche und Stufen und erhält die Auswahl im Zustand', () => {
    renderRouter('./src/app', { initialUrl: '/' });
    fireEvent.press(screen.getByTestId('path-area-area.rhythm'));
    expect(useLearningState.getState().areaId).toBe('area.rhythm');
    expect(screen.queryByTestId('lesson-group-notation.l1.staff')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Stufe 2' }));
    expect(useLearningState.getState().level).toBe(2);
    fireEvent.press(screen.getByTestId('path-area-all'));
    expect(useLearningState.getState().level).toBeNull();
  });
  it('bietet bei Speicherfehler Wiederholung oder ausdrücklich temporäres Lernen', () => {
    useLearningState.setState({ phase: 'error' });
    renderRouter('./src/app', { initialUrl: '/' });
    expect(screen.getByText(/Der Lernpfad konnte nicht geladen werden/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Nur für diese Sitzung starten' }));
    expect(useLearningState.getState().memory).toBe(true);
    expect(
      screen.getAllByText(/Nach dem Schließen sind sie nicht gespeichert/).length,
    ).toBeGreaterThan(0);
  });
  it('verwendet englische Texte für Status und Bestehensregel', () => {
    useSettings.setState({ locale: 'en-US' });
    renderRouter('./src/app', { initialUrl: '/' });
    expect(screen.getByText('Your learning path')).toBeTruthy();
    expect(screen.getByText(/at least 80% correct first-attempt answers/)).toBeTruthy();
  });
});

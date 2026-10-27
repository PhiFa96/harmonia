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
  it('zeigt die internen Stufe-3-Einheiten und ihre gesperrten Lektionen', () => {
    renderRouter('./src/app', { initialUrl: '/' });
    fireEvent.press(screen.getByRole('button', { name: 'Stufe 3' }));
    expect(useLearningState.getState().level).toBe(3);
    const unit = within(screen.getByTestId('lesson-group-scales.l3.modes'));
    expect(unit.getByText('Modale Tonleitern')).toBeTruthy();
    fireEvent.press(unit.getByRole('button', { name: 'Lektionen in Modale Tonleitern anzeigen' }));
    expect(unit.getByRole('button', { name: 'Begriffe und Beispiele öffnen' })).toBeDisabled();
    fireEvent.press(screen.getByTestId('path-area-area.jazzpop'));
    expect(screen.getByTestId('lesson-group-jazzpop.l3.harmony')).toBeTruthy();
  });
  it('zeigt die internen Stufe-4-Einheiten nur als gesperrte Entwürfe', () => {
    renderRouter('./src/app', { initialUrl: '/' });
    fireEvent.press(screen.getByRole('button', { name: 'Stufe 4' }));
    expect(useLearningState.getState().level).toBe(4);
    const unit = within(screen.getByTestId('lesson-group-satz.l4.voice-leading'));
    expect(unit.getByText('Vierstimmiger Satz')).toBeTruthy();
    fireEvent.press(unit.getByRole('button', { name: 'Lektionen in Vierstimmiger Satz anzeigen' }));
    expect(unit.getByRole('button', { name: 'Begriffe verstehen öffnen' })).toBeDisabled();
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
  it.each(['de', 'en-US', 'en-GB'] as const)(
    '%s: öffnet Bass direkt ohne bestandene andere Chorstimmen',
    (locale) => {
      useSettings.setState({ locale });
      const progress = catalogue.lessons
        .filter((lesson) => lesson.unitId !== 'aural.l4.choir')
        .map((lesson) => ({
          lessonId: lesson.id,
          contentVersion: lesson.contentVersion,
          passed: true,
          eligibleCorrect: 10,
          total: 10,
        }));
      useLearningState.setState({
        path: learningPath(catalogue, progress),
        level: 4,
        areaId: 'area.aural',
        expanded: ['aural.l4.choir'],
        memory: true,
      });
      renderRouter('./src/app', { initialUrl: '/' });
      expect(screen.getByText(i18n.t('path.independentLessons'))).toBeTruthy();
      for (const voice of ['soprano', 'alto', 'tenor', 'bass']) {
        const row = within(screen.getByTestId(`path-lesson-aural.l4.choir.${voice}.lesson`));
        expect(
          row.getByRole('button', {
            name: i18n.t('lesson.openNamed', {
              title: title(`content.choir.${voice}`),
            }),
          }),
        ).toBeEnabled();
      }
      fireEvent.press(
        within(screen.getByTestId('path-lesson-aural.l4.choir.bass.lesson')).getByRole('button', {
          name: i18n.t('lesson.openNamed', { title: title('content.choir.bass') }),
        }),
      );
      expect(screen.getByTestId('lesson-example-scroll')).toBeTruthy();
      expect(screen.queryByText(i18n.t('path.independentLessonLocked'))).toBeNull();
    },
  );
  it('zeigt fehlendes Basslesen nur bei Tenor und Bass und verlinkt die richtige Grundlage', () => {
    const progress = catalogue.lessons
      .filter(
        (lesson) => !['aural.l4.choir', 'notation.l2.clefs-registers'].includes(lesson.unitId),
      )
      .map((lesson) => ({
        lessonId: lesson.id,
        contentVersion: lesson.contentVersion,
        passed: true,
        eligibleCorrect: 10,
        total: 10,
      }));
    useLearningState.setState({
      path: learningPath(catalogue, progress),
      level: 4,
      areaId: 'area.aural',
      expanded: ['aural.l4.choir'],
    });
    renderRouter('./src/app', { initialUrl: '/' });
    const soprano = within(screen.getByTestId('path-lesson-aural.l4.choir.soprano.lesson'));
    const bass = within(screen.getByTestId('path-lesson-aural.l4.choir.bass.lesson'));
    expect(
      soprano.getByRole('button', {
        name: i18n.t('lesson.openNamed', { title: title('content.choir.soprano') }),
      }),
    ).toBeEnabled();
    expect(
      bass.getByRole('button', {
        name: i18n.t('lesson.openNamed', { title: title('content.choir.bass') }),
      }),
    ).toBeDisabled();
    const prerequisite = catalogue.units.find((unit) => unit.id === 'notation.l2.clefs-registers');
    if (!prerequisite) throw Error('Missing bass reading unit');
    const label = i18n.t('path.prerequisite', { title: title(prerequisite.titleKey) });
    expect(soprano.queryByRole('button', { name: label })).toBeNull();
    fireEvent.press(bass.getByRole('button', { name: label }));
    expect(useLearningState.getState().areaId).toBe('area.notation');
    expect(useLearningState.getState().level).toBe(2);
    expect(useLearningState.getState().expanded).toContain(prerequisite.id);
  });
  it('erklärt beim direkten gesperrten Chor-Link die eigenen Voraussetzungen', () => {
    renderRouter('./src/app', { initialUrl: '/lesson?id=aural.l4.choir.bass.lesson' });
    expect(screen.getByText(i18n.t('path.independentLessonLocked'))).toBeTruthy();
    expect(screen.queryByTestId('lesson-example-scroll')).toBeNull();
  });
});

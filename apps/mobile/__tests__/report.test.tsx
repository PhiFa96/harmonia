import { act as settleAct } from 'expo-router/testing-library';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { expectedAnswer } from '@harmonia/exercises';
import type { ContentReport } from '@harmonia/content';
import { useAuthState } from '@/auth';
import { useReports } from '@/state/reports';
import { useSettings } from '@/state/settings';
import { i18n } from '@/i18n';
import { createPracticeSession } from '@/exercises/practice';
const mockSave = jest.fn<Promise<void>, [string, ContentReport]>(() => Promise.resolve());
jest.mock('@/storage/reports', () => ({
  getReportRepository: () => Promise.resolve({ save: mockSave, list: () => Promise.resolve([]) }),
}));
beforeEach(async () => {
  useAuthState.setState({ ready: true, session: null });
  useSettings.setState({ locale: 'de' });
  await i18n.changeLanguage('de');
  mockSave.mockReset().mockResolvedValue(undefined);
});
async function open() {
  const app = renderRouter('./src/app', { initialUrl: '/practice' });
  await settleAct(async () => {
    fireEvent.press(screen.getByText('Übungssatz starten'));
    await Promise.resolve();
  });
  return app;
}
it('hält Antwort und Hinweise beim Melden und Zurückkehren stabil', async () => {
  const app = await open();
  const answer = screen.getAllByTestId(/^answer-/)[0];
  if (!answer) throw new Error('Antwort fehlt');
  fireEvent.press(answer);
  fireEvent.press(screen.getByText('Hinweis 1'));
  fireEvent.press(screen.getByRole('button', { name: 'Fehler melden' }));
  await waitFor(() => {
    expect(app.getPathname()).toBe('/report');
  });
  const draft = useReports.getState().draft;
  expect(draft?.report.source.kind).toBe('practice');
  expect(draft?.report.hintLevel).toBe(1);
  expect(draft?.report.checked).toBe(false);
  expect(screen.getByText(/Als Gast speicherst/)).toBeTruthy();
  fireEvent.press(screen.getByText('Zurück ohne Speichern'));
  await waitFor(() => {
    expect(app.getPathname()).toBe('/practice');
  });
  fireEvent.press(screen.getByRole('button', { name: 'Fehler melden' }));
  expect(useReports.getState().draft?.report.answer).toBe(draft?.report.answer);
});
it('speichert den Kontext nach Bewertung, ohne die Bewertung zu verändern', async () => {
  const app = await open();
  const first = screen.getAllByTestId(/^answer-/)[0];
  if (!first) throw new Error('Antwort fehlt');
  fireEvent.press(first);
  fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
  const before = screen.getByTestId('exercise-next');
  expect(before).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Fehler melden' }));
  expect(useReports.getState().draft?.report.checked).toBe(true);
  fireEvent.press(screen.getByText('Notenbild'));
  fireEvent.changeText(
    screen.getByLabelText('Beschreibung (optional, bis zu 2000 Zeichen)'),
    'Der Abstand ist unklar.',
  );
  fireEvent.press(screen.getByText('Meldung speichern'));
  await screen.findByText('Meldung gespeichert');
  expect(mockSave).toHaveBeenCalledTimes(1);
  expect(mockSave.mock.calls[0]?.[1]).toMatchObject({
    category: 'notation',
    message: 'Der Abstand ist unklar.',
    checked: true,
  });
  fireEvent.press(screen.getByText('Zur Aufgabe zurück'));
  await waitFor(() => {
    expect(app.getPathname()).toBe('/practice');
  });
  expect(screen.getByTestId('exercise-next')).toBeTruthy();
});
it('bewahrt einen Speicherversuch und verwendet bei Wiederholung dieselbe ID', async () => {
  await open();
  fireEvent.press(screen.getByRole('button', { name: 'Fehler melden' }));
  fireEvent.changeText(
    screen.getByLabelText('Beschreibung (optional, bis zu 2000 Zeichen)'),
    'Meine Meldung',
  );
  mockSave.mockRejectedValueOnce(new Error('disk'));
  fireEvent.press(screen.getByText('Meldung speichern'));
  await screen.findByText(/Die Meldung konnte nicht gespeichert/);
  fireEvent.press(screen.getByText('Meldung speichern'));
  await screen.findByText('Meldung gespeichert');
  expect(mockSave.mock.calls[1]).toEqual(mockSave.mock.calls[0]);
});
it('weist einen direkten Link ohne Aufgabenquelle verständlich zurück', () => {
  renderRouter('./src/app', { initialUrl: '/report' });
  expect(screen.getByText(/Öffne „Fehler melden“ direkt/)).toBeTruthy();
  expect(screen.queryByText('Meldung speichern')).toBeNull();
});
it.each(['en-US', 'en-GB'] as const)(
  'zeigt Meldung und bewertbare Aufgabe vollständig in %s',
  async (locale) => {
    useSettings.setState({ locale });
    await i18n.changeLanguage(locale);
    const seed = 123456;
    jest.spyOn(Date, 'now').mockReturnValue(seed);
    renderRouter('./src/app', { initialUrl: '/practice' });
    await settleAct(async () => {
      fireEvent.press(screen.getByText(i18n.t('exercise.start')));
      await Promise.resolve();
    });
    const item = createPracticeSession(seed).items[0];
    if (!item) throw new Error('Aufgabe');
    fireEvent.press(screen.getByTestId('answer-' + expectedAnswer(item)));
    fireEvent.press(screen.getByText('Check'));
    fireEvent.press(screen.getByRole('button', { name: 'Report an error' }));
    expect(screen.getByText('Area')).toBeTruthy();
    expect(useReports.getState().draft?.report.locale).toBe(locale);
    act(() => {
      useAuthState.setState({
        session: { user: { id: 'other' } } as NonNullable<
          ReturnType<typeof useAuthState.getState>['session']
        >,
      });
    });
    expect(screen.queryByLabelText('Description (optional, up to 2000 characters)')).toBeNull();
    jest.restoreAllMocks();
  },
);

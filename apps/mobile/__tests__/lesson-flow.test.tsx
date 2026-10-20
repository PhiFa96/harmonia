import { act as settleAct } from 'expo-router/testing-library';
import { DatabaseSync } from 'node:sqlite';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { router } from 'expo-router';
import { catalogue } from '@harmonia/content/authoring';
import { lessonPlan } from '@harmonia/content';
import { createLessonSession, expectedAnswer } from '@harmonia/exercises';
import {
  createLearningRepository,
  initializeLearningDatabase,
} from '@/storage/learning-repository';
import { useLearningState } from '@/state/learning';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';
import type { LessonAttempt } from '@/storage/lesson-repository';

let mockRepo: ReturnType<typeof createLearningRepository>;
const mockSave = jest.fn<Promise<void>, [LessonAttempt]>();
jest.mock('@/storage/learning', () => ({ getLearningRepository: () => Promise.resolve(mockRepo) }));
jest.mock('@/storage/lessons', () => ({
  getLessonRepository: () => Promise.resolve({ save: mockSave }),
}));
const id = 'notation.l1.staff.positions';
const plan = lessonPlan(catalogue, id);
if (!plan) throw new Error('Plan fehlt');
const content = plan;
let db: DatabaseSync;
beforeEach(async () => {
  await i18n.changeLanguage('de');
  useSettings.setState({ locale: 'de' });
  db = new DatabaseSync(':memory:');
  const adapter = {
    execAsync: (sql: string) => {
      db.exec(sql);
      return Promise.resolve();
    },
    runAsync: (sql: string, ...params: (string | number)[]) =>
      Promise.resolve(db.prepare(sql).run(...params)),
    getFirstAsync: <T,>(sql: string, ...params: (string | number)[]) =>
      Promise.resolve((db.prepare(sql).get(...params) as T | undefined) ?? null),
  };
  await initializeLearningDatabase(adapter);
  mockRepo = createLearningRepository(adapter);
  mockSave.mockReset().mockResolvedValue(undefined);
});
afterEach(() => {
  db.close();
});
function open() {
  return renderRouter('./src/app', { initialUrl: `/lesson?id=${id}` });
}
async function start() {
  for (let n = 1; n < content.introduction.length; n++)
    fireEvent.press(screen.getByText('Nächste Einführungskarte'));
  fireEvent.press(screen.getByText(`Mit ${String(content.exercises.length)} Aufgaben starten`));
  await settleAct(async () => {
    await Promise.resolve();
  });
}
async function persisted() {
  await waitFor(() => {
    expect(screen.getByText('Dein aktueller Stand ist auf diesem Gerät gespeichert.')).toBeTruthy();
  });
  return await mockRepo.draft('guest', id);
}
async function coldLoad(unmount: () => void) {
  unmount();
  const drafts = await mockRepo.drafts('guest');
  useLearningState.setState({ drafts });
  return open();
}
describe('P2.12 mit echtem lokalem Lektionsspeicher', () => {
  it('setzt die Einführung nach kaltem Laden an der gespeicherten Karte fort', async () => {
    const app = open();
    fireEvent.press(screen.getByText('Nächste Einführungskarte'));
    expect((await persisted())?.introCard).toBe(1);
    await coldLoad(app.unmount);
    expect(screen.getByText('Deine Lektion wartet')).toBeTruthy();
    await settleAct(async () => {
      fireEvent.press(screen.getByText('Lektion fortsetzen'));
      await Promise.resolve();
    });
    expect(
      screen.getByText(`Einführung 2 von ${String(content.introduction.length)}`),
    ).toBeTruthy();
    await persisted();
  });
  it('bewahrt ungeprüfte Antworten und Hinweise beim Neustart', async () => {
    const app = open();
    await start();
    const snapshot = await persisted();
    if (!snapshot) throw new Error('Snapshot fehlt');
    const item = createLessonSession(content, snapshot.seed).initial.items[0];
    if (!item) throw new Error('Frage fehlt');
    fireEvent.press(screen.getByTestId(`answer-${expectedAnswer(item)}`));
    fireEvent.press(screen.getByText('Hinweis 1'));
    const saved = await persisted();
    expect(saved?.answer).toBe(expectedAnswer(item));
    expect(saved?.actions).toEqual([{ type: 'hint' }]);
    await coldLoad(app.unmount);
    await settleAct(async () => {
      fireEvent.press(screen.getByText('Lektion fortsetzen'));
      await Promise.resolve();
    });
    expect(screen.getByText('Prüfen')).toBeEnabled();
    expect(screen.getByText('Hinweis 2')).toBeTruthy();
    expect(screen.getByTestId(`answer-${expectedAnswer(item)}`)).toBeChecked();
    await persisted();
  });
  it('stellt sichtbares Feedback wieder her und wertet dieselbe Antwort nicht noch einmal', async () => {
    const app = open();
    await start();
    const snapshot = await persisted();
    if (!snapshot) throw new Error('Snapshot fehlt');
    const item = createLessonSession(content, snapshot.seed).initial.items[0];
    if (!item) throw new Error('Frage fehlt');
    fireEvent.press(screen.getByTestId(`answer-${expectedAnswer(item)}`));
    fireEvent.press(screen.getByText('Prüfen'));
    expect((await persisted())?.actions).toHaveLength(1);
    await coldLoad(app.unmount);
    await settleAct(async () => {
      fireEvent.press(screen.getByText('Lektion fortsetzen'));
      await Promise.resolve();
    });
    expect(screen.getByText('Richtig!')).toBeTruthy();
    fireEvent.press(screen.getByTestId('exercise-next'));
    expect(screen.getByText(`Aufgabe 2 von ${String(content.exercises.length)}`)).toBeTruthy();
    expect((await persisted())?.actions).toHaveLength(2);
  });
  it('pausiert, kehrt zum Pfad zurück und bietet denselben Durchgang wieder an', async () => {
    open();
    await start();
    await persisted();
    fireEvent.press(screen.getByText('Pausieren oder abbrechen'));
    expect(screen.queryByTestId('exercise-question')).toBeNull();
    fireEvent.press(screen.getByText('Speichern und zurück zum Lernpfad'));
    await waitFor(() => {
      expect(screen.getByText('Dein Lernpfad')).toBeTruthy();
    });
    act(() => {
      router.push({ pathname: '/lesson', params: { id } });
    });
    expect(screen.getByText('Deine Lektion wartet')).toBeTruthy();
    await settleAct(async () => {
      fireEvent.press(screen.getByText('Lektion fortsetzen'));
      await Promise.resolve();
    });
    await persisted();
    expect(mockSave).not.toHaveBeenCalled();
  }, 60_000);
  it('fängt Zurück-Navigation ab und lässt den Durchgang anschließend fortsetzen', async () => {
    renderRouter('./src/app', { initialUrl: '/' });
    act(() => {
      router.push({ pathname: '/lesson', params: { id } });
    });
    await start();
    await persisted();
    act(() => {
      router.back();
    });
    expect(screen.getByText('Lektion pausieren?')).toBeTruthy();
    fireEvent.press(screen.getByText('Hier weiterlernen'));
    expect(screen.getByTestId('exercise-question')).toBeTruthy();
    await persisted();
  }, 60_000);
  it('ein neuer Durchgang nach kaltem Laden bekommt einen anderen Seed', async () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000000);
    try {
      const app = open();
      const previous = await persisted();
      await coldLoad(app.unmount);
      fireEvent.press(screen.getByText('Neuen Durchgang beginnen'));
      const next = await persisted();
      expect(next?.seed).not.toBe(previous?.seed);
      expect(next?.actions).toEqual([]);
    } finally {
      clock.mockRestore();
    }
  });
  it('verwirft einen Durchgang ohne Ergebnis und ohne XP', async () => {
    open();
    await start();
    await persisted();
    fireEvent.press(screen.getByText('Pausieren oder abbrechen'));
    fireEvent.press(screen.getByText('Durchgang verwerfen'));
    await waitFor(() => {
      expect(screen.getByText('Dein Lernpfad')).toBeTruthy();
    });
    expect(await mockRepo.draft('guest', id)).toBeNull();
    expect(useLearningState.getState().drafts[id]).toBeUndefined();
    expect(mockSave).not.toHaveBeenCalled();
    expect(await mockRepo.list('guest')).toEqual([]);
  }, 60_000);
  it('zeigt bei Speicherfehler eine echte Wiederholung des Schreibvorgangs an', async () => {
    const save = jest.spyOn(mockRepo, 'saveDraft').mockRejectedValueOnce(new Error('full'));
    open();
    await waitFor(() => {
      expect(screen.getByText(/Dein aktueller Stand konnte nicht gespeichert/)).toBeTruthy();
    });
    fireEvent.press(screen.getByText('Speichern erneut versuchen'));
    await persisted();
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[0]?.[1]).toEqual(save.mock.calls[1]?.[1]);
  });
  it('ersetzt veraltete gespeicherte Pläne erst nach einem ausdrücklich neuen Durchgang', async () => {
    open();
    const snapshot = await persisted();
    if (!snapshot) throw new Error('Snapshot fehlt');
    screen.unmount();
    await mockRepo.saveDraft('guest', { ...snapshot, planKey: 'old' });
    useLearningState.setState({ drafts: await mockRepo.drafts('guest') });
    open();
    expect(screen.getByText('Die Aufgaben wurden aktualisiert')).toBeTruthy();
    expect(screen.queryByText('Lektion fortsetzen')).toBeNull();
    expect((await mockRepo.draft('guest', id))?.planKey).toBe('old');
    fireEvent.press(screen.getByText('Neuen Durchgang beginnen'));
    expect((await persisted())?.planKey).toBe(content.planKey);
  });
});

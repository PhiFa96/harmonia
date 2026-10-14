import { act as settleAct } from 'expo-router/testing-library';
import type { ExerciseItem, MatchItem, OrderItem } from '@harmonia/exercises';
import {
  choiceLabel,
  expectedAnswer,
  knowledgeFactId,
  orderedValues,
  orderValueId,
} from '@harmonia/exercises';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { createKnowledgeSession } from '@/exercises/practice';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));
const mockAudio = jest.fn();
jest.mock('@/audio', () => ({
  usePianoStatus: () => 'ready',
  getAudioEngine: () => {
    mockAudio();
    throw new Error('Wissensaufgaben brauchen keinen Klang');
  },
}));
const SEED = 19019;
let clock: jest.SpyInstance;
beforeEach(() => {
  clock = jest.spyOn(Date, 'now').mockReturnValue(SEED);
  mockAudio.mockClear();
  useSettings.setState({ locale: null });
  void i18n.changeLanguage('de');
});
afterEach(() => {
  clock.mockRestore();
});
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}
async function start() {
  renderRouter('./src/app', { initialUrl: '/practice' });
  fireEvent.press(screen.getByRole('button', { name: 'Wissen, Zuordnen und Reihenfolgen üben' }));
  await settleAct(async () => {
    await Promise.resolve();
  });
}
function fill(item: ExerciseItem) {
  if (item.type === 'KNOWLEDGE_MC')
    fireEvent.press(screen.getByTestId(`answer-${expectedAnswer(item)}`));
  else if (item.type === 'MATCH')
    for (const [index, fact] of item.facts.entries()) {
      fireEvent.press(screen.getByTestId(`match-term-${String(index)}`));
      fireEvent.press(screen.getByTestId(`answer-${knowledgeFactId(fact)}`));
    }
  else if (item.type === 'ORDER')
    for (const value of orderedValues(item))
      fireEvent.press(screen.getByTestId(`order-option-${orderValueId(value)}`));
  else throw new Error('Wissensaufgabe erwartet');
}
async function toMatch(): Promise<MatchItem> {
  await start();
  const items = createKnowledgeSession(SEED).items;
  fill(required(items[0]));
  fireEvent.press(screen.getByText('Prüfen'));
  fireEvent.press(screen.getByText('Weiter'));
  const item = required(items[1]);
  if (item.type !== 'MATCH') throw new Error('Zuordnung fehlt');
  return item;
}
async function toOrder(): Promise<OrderItem> {
  const match = await toMatch();
  fill(match);
  fireEvent.press(screen.getByText('Prüfen'));
  fireEvent.press(screen.getByText('Weiter'));
  const item = required(createKnowledgeSession(SEED).items[2]);
  if (item.type !== 'ORDER') throw new Error('Reihenfolge fehlt');
  return item;
}
describe('Wissensfragen in der App', () => {
  it('neun Aufgaben einschließlich Zuordnung und Reihenfolge lassen sich korrekt abschließen; kein Klang oder künstliches Notenbild', async () => {
    await start();
    const items = createKnowledgeSession(SEED).items;
    for (const [index, item] of items.entries()) {
      expect(screen.getByText(`Aufgabe ${String(index + 1)} von 9`)).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
      expect(screen.queryByRole('img')).toBeNull();
      fill(item);
      expect(screen.getByRole('button', { name: 'Prüfen' })).not.toBeDisabled();
      fireEvent.press(screen.getByText('Prüfen'));
      expect(screen.getByText('Richtig!')).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Noch einmal hören' })).toBeNull();
      fireEvent.press(screen.getByText(index === 8 ? 'Ergebnis ansehen' : 'Weiter'));
    }
    expect(screen.getByText('9 von 9 Antworten richtig.')).toBeTruthy();
    expect(screen.getByText('9 Antworten ohne Hinweis richtig.')).toBeTruthy();
    expect(mockAudio).not.toHaveBeenCalled();
    await settleAct(async () => {
      fireEvent.press(screen.getByText('Neuen Übungssatz starten'));
      await Promise.resolve();
    });
    expect(screen.getByText('Aufgabe 1 von 9')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  });
  it('jede Erklärung kann nur einmal zugeordnet werden; Umordnen löst die alte Verbindung und Löschen entfernt nur die gewählte', async () => {
    const item = await toMatch(),
      first = knowledgeFactId(required(item.facts[0]));
    fireEvent.press(screen.getByTestId(`answer-${first}`));
    expect(screen.getByText('1 von 3 Begriffen zugeordnet.')).toBeTruthy();
    fireEvent.press(screen.getByTestId('match-term-1'));
    fireEvent.press(screen.getByTestId(`answer-${first}`));
    expect(screen.getByText('1 von 3 Begriffen zugeordnet.')).toBeTruthy();
    expect(screen.getByTestId('match-term-0')).toHaveAccessibleName(/noch nicht zugeordnet/);
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    fireEvent.press(screen.getByText('Zuordnung löschen'));
    expect(screen.getByText('0 von 3 Begriffen zugeordnet.')).toBeTruthy();
    fill(item);
    expect(screen.getByRole('button', { name: 'Prüfen' })).not.toBeDisabled();
  });
  it('vertauschte Zuordnung wird pro Paar markiert und die erste Wertung sperrt alle Begriffe', async () => {
    const item = await toMatch(),
      ids = item.facts.map(knowledgeFactId);
    for (const [index, id] of [required(ids[1]), required(ids[0]), required(ids[2])].entries()) {
      fireEvent.press(screen.getByTestId(`match-term-${String(index)}`));
      fireEvent.press(screen.getByTestId(`answer-${id}`));
    }
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByText('Noch nicht ganz')).toBeTruthy();
    expect(screen.getByTestId('match-term-0')).toHaveAccessibleName(/, falsch$/);
    expect(screen.getByTestId('match-term-2')).toHaveAccessibleName(/, richtig$/);
    for (let index = 0; index < 3; index++)
      expect(screen.getByTestId(`match-term-${String(index)}`)).toBeDisabled();
    expect(screen.queryByText('Zuordnung löschen')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Prüfen' })).toBeNull();
  });
  it('Reihenfolge verlangt alle Angaben; Verschieben und Entfernen ändern nur den ungewerteten Entwurf', async () => {
    const item = await toOrder(),
      sorted = orderedValues(item).map(orderValueId);
    fireEvent.press(screen.getByTestId(`order-option-${required(sorted[0])}`));
    expect(screen.getByTestId(`order-option-${required(sorted[0])}`)).toBeDisabled();
    expect(screen.getByTestId('order-up-0')).toHaveTextContent('Nach oben');
    expect(screen.getByTestId('order-up-0')).toHaveAccessibleName(
      `${choiceLabel(item, required(sorted[0]), 'de')} nach oben`,
    );
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    fireEvent.press(screen.getByTestId(`order-option-${required(sorted[1])}`));
    fireEvent.press(screen.getByTestId('order-down-0'));
    expect(
      screen.getByText(`Position 1: ${choiceLabel(item, required(sorted[1]), 'de')}`),
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId('order-up-1'));
    expect(
      screen.getByText(`Position 1: ${choiceLabel(item, required(sorted[0]), 'de')}`),
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId('order-remove-1'));
    expect(screen.getByTestId(`order-option-${required(sorted[1])}`)).not.toBeDisabled();
    for (const id of sorted.slice(1)) fireEvent.press(screen.getByTestId(`order-option-${id}`));
    expect(screen.getByRole('button', { name: 'Prüfen' })).not.toBeDisabled();
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByText('Richtig!')).toBeTruthy();
  });
  it('eine falsche Reihenfolge bleibt nach Prüfen gesperrt und zeigt Positionsfehler als Text', async () => {
    const item = await toOrder(),
      sorted = orderedValues(item).map(orderValueId);
    for (const id of [...sorted].reverse())
      fireEvent.press(screen.getByTestId(`order-option-${id}`));
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByText('Noch nicht ganz')).toBeTruthy();
    expect(screen.getAllByText('falsch')).toHaveLength(4);
    for (let index = 0; index < 4; index++)
      for (const action of ['up', 'down', 'remove'])
        expect(screen.getByTestId(`order-${action}-${String(index)}`)).toBeDisabled();
    fireEvent.press(screen.getByTestId('order-up-1'));
    expect(screen.queryByText('Prüfen')).toBeNull();
  });
  it('Hinweise 1 und 2 grenzen ein; erst Hinweis 3 erklärt alle Lösungen und bleibt als Hilfe gezählt', async () => {
    await start();
    const first = required(createKnowledgeSession(SEED).items[0]);
    fireEvent.press(screen.getByText('Hinweis 1'));
    expect(screen.getByText(/Vergleiche die Folge der Halbtonschritte/)).toBeTruthy();
    fireEvent.press(screen.getByText('Hinweis 2'));
    expect(screen.getByText(/Grenze deine Auswahl/)).toBeTruthy();
    fireEvent.press(screen.getByText('Lösung erklären'));
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    fill(first);
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByText('Mit Hinweis beantwortet')).toBeTruthy();
    expect(mockAudio).not.toHaveBeenCalled();
  });
  it('Wissensfehler wechseln zum nächsten Typ; die nächste Zuordnung beginnt ohne alte Verbindungen', async () => {
    await start();
    const first = required(createKnowledgeSession(SEED).items[0]);
    fireEvent.press(
      screen.getByTestId(
        `answer-${required(first.choices.find((id) => id !== expectedAnswer(first)))}`,
      ),
    );
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByText('Noch nicht ganz')).toBeTruthy();
    fireEvent.press(screen.getByText('Weiter'));
    expect(screen.getByText('0 von 3 Begriffen zugeordnet.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  });
  it.each([
    ['en-US', 'Practice knowledge, matching and ordering', 'quarter note'],
    ['en-GB', 'Practise knowledge, matching and ordering', 'crotchet'],
  ] as const)(
    'Bezeichnungen und Notenwerte in %s sind vollständig',
    async (locale, label, value) => {
      useSettings.setState({ locale });
      renderRouter('./src/app', { initialUrl: '/practice' });
      await settleAct(async () => {
        fireEvent.press(screen.getByRole('button', { name: label }));
        await Promise.resolve();
      });
      const items = createKnowledgeSession(SEED).items;
      for (const item of items.slice(0, 2)) {
        fill(item);
        fireEvent.press(screen.getByText('Check'));
        fireEvent.press(screen.getByText('Continue'));
      }
      expect(screen.getByText('Question 3 of 9')).toBeTruthy();
      expect(screen.getByRole('button', { name: value })).toBeTruthy();
      fireEvent.press(screen.getByText('Hint 1'));
      fireEvent.press(screen.getByText('Hint 2'));
      expect(screen.queryByText(/exercise\.|glossary:|\{\{|\$t\(/)).toBeNull();
    },
  );
});

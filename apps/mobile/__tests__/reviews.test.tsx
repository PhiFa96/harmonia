import {
  act,
  fireEvent,
  renderHook,
  renderRouter,
  screen,
  waitFor,
} from 'expo-router/testing-library';
import { catalogue } from '@harmonia/content/authoring';
import {
  applyReviewEvent,
  emptyReviewState,
  lessonEvent,
  lessonPlan,
  REVIEW_LESSON_ID,
} from '@harmonia/content';
import {
  answerLesson,
  createLessonSession,
  expectedAnswer,
  nextLessonExercise,
} from '@harmonia/exercises';
import * as learning from '@/state/learning';
import type * as LearningModule from '@/state/learning';
import { useAuthState } from '@/auth';
import { useReviews } from '@/storage/use-reviews';
import { i18n } from '@/i18n';
jest.mock('@/state/learning', () => {
  const actual = jest.requireActual<typeof LearningModule>('@/state/learning');
  return {
    ...actual,
    initializeLearning: () => Promise.resolve(),
    syncLearning: () => Promise.resolve(),
    recordLessonLearning: () => Promise.resolve(),
    recordLearningEvent: jest.fn(actual.recordLearningEvent),
  };
});
function required<T>(v: T | undefined): T {
  if (v === undefined) throw Error('Fixture');
  return v;
}
const plan = required(lessonPlan(catalogue, 'notation.l1.staff.anchor'));
let s = createLessonSession(plan, 'review-ui');
for (const item of s.initial.items) s = nextLessonExercise(answerLesson(s, expectedAnswer(item)));
const event = lessonEvent('review-ui', s, 1000, 2000, 'Europe/Berlin');
const state = applyReviewEvent(catalogue, emptyReviewState(), event);
beforeEach(async () => {
  await i18n.changeLanguage('de');
  useAuthState.setState({ session: null, ready: true });
  learning.useLearningState.setState({
    scope: 'guest',
    phase: 'ready',
    reviews: null,
    memory: true,
    rows: [{ event, sequence: null, position: 1, pending: false }],
  });
});
it('never renders another account snapshot during a delayed scope change', () => {
  learning.useLearningState.setState({
    reviews: { ...state, throughSequence: 5, throughPosition: 0 },
    rows: [],
  });
  const hook = renderHook(useReviews);
  expect(hook.result.current).toEqual(state);
  act(() => {
    learning.useLearningState.setState({ scope: 'someone-else' });
  });
  expect(hook.result.current).toEqual(emptyReviewState());
});
it('reveals the card only after recall and stores a single rating without XP', async () => {
  const app = renderRouter('./src/app', { initialUrl: '/review' });
  expect(screen.getByText('Fällige Wissenskarten')).toBeTruthy();
  fireEvent.press(required(screen.getAllByRole('button', { name: /^Karte öffnen:/ })[0]));
  expect(app.getPathname()).toBe('/card-review');
  expect(screen.queryByText('Wie gut konntest du dich erinnern?')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Erklärung aufdecken' }));
  expect(screen.getByText('Wie gut konntest du dich erinnern?')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Gewusst' }));
  await waitFor(() => {
    expect(screen.getByText('Wiederholung gespeichert.')).toBeTruthy();
  });
  const stored = learning.useLearningState
    .getState()
    .rows.filter((r) => r.event.kind === 'card-review');
  expect(stored).toHaveLength(1);
  expect(stored[0]?.event).toMatchObject({ kind: 'card-review', rating: 3 });
  expect(screen.queryByText(/^\d+ XP$/)).toBeNull();
  expect(screen.getByText(/Nächste Wiederholung:/)).toBeTruthy();
});
it('opens due skills with the shared paused lesson flow and canonical references', async () => {
  const app = renderRouter('./src/app', { initialUrl: '/review' });
  fireEvent.press(screen.getByRole('button', { name: 'Fähigkeiten wiederholen' }));
  expect(app.getPathname()).toBe('/lesson');
  expect(screen.getByText('Fällige Fähigkeiten')).toBeTruthy();
  const start = screen.getByRole('button', { name: /Mit \d+ Aufgaben starten/ });
  fireEvent.press(start);
  await waitFor(() => {
    expect(screen.getByTestId('exercise-question')).toBeTruthy();
  });
  const draft = learning.useLearningState.getState().drafts[REVIEW_LESSON_ID];
  expect(draft?.planKey.startsWith('["review:1"')).toBe(true);
  expect(screen.queryByText(/Neue Aufgaben/)).toBeNull();
  act(() => {
    learning.useLearningState.setState({
      drafts: {},
      rows: [],
      reviews: {
        ...state,
        throughSequence: 0,
        throughPosition: 0,
        skills: Object.fromEntries(
          Object.entries(state.skills).map(([id, c]) => [id, { ...c, due: Date.now() + 86400000 }]),
        ),
      },
    });
  });
  expect(screen.getByTestId('exercise-question')).toBeTruthy();
});
it('shows an empty state without inventing cards for a new learner', () => {
  learning.useLearningState.setState({ rows: [] });
  renderRouter('./src/app', { initialUrl: '/review' });
  expect(screen.getByText(/Nach deinen ersten Lektionen/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Fähigkeiten wiederholen' })).toBeNull();
});

it('behält eine fehlgeschlagene Einschätzung mit derselben ID für den erneuten Versuch', async () => {
  const spy = jest
    .mocked(learning.recordLearningEvent)
    .mockClear()
    .mockRejectedValueOnce(new Error('Disk full'));
  try {
    renderRouter('./src/app', { initialUrl: '/review' });
    fireEvent.press(required(screen.getAllByRole('button', { name: /^Karte öffnen:/ })[0]));
    fireEvent.press(screen.getByRole('button', { name: 'Erklärung aufdecken' }));
    fireEvent.press(screen.getByRole('button', { name: 'Schwer' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Erneut speichern' })).toBeTruthy();
    });
    const original = spy.mock.calls[0]?.[0];
    expect(original).toMatchObject({ kind: 'card-review', rating: 2 });
    fireEvent.press(screen.getByRole('button', { name: 'Erneut speichern' }));
    await waitFor(() => {
      expect(screen.getByText('Wiederholung gespeichert.')).toBeTruthy();
    });
    expect(spy.mock.calls[1]?.[0]).toEqual(original);
    expect(
      learning.useLearningState.getState().rows.filter((r) => r.event.kind === 'card-review'),
    ).toHaveLength(1);
  } finally {
    spy.mockClear();
  }
});

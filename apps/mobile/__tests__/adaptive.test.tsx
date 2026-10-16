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
  lessonEvent,
  lessonPlan,
  localLearningRatings,
  weaknessPlan,
  WEAKNESS_LESSON_ID,
} from '@harmonia/content';
import {
  answerLesson,
  createLessonSession,
  expectedAnswer,
  nextLessonExercise,
} from '@harmonia/exercises';
import { useLearningState } from '@/state/learning';
import { useLearningRatings } from '@/storage/use-learning-ratings';
import { useAuthState } from '@/auth';
import { i18n } from '@/i18n';
import { lessonSelectionGroup, lessonSelectionExperiment } from '@/content/adaptive-config';
import { WeaknessEntry } from '@/components/weakness-entry';
import { UiProvider } from '@harmonia/ui/native';
import { render } from '@testing-library/react-native';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing fixture');
  return value;
}
const plan = required(lessonPlan(catalogue, 'notation.l1.staff.anchor'));
let session = createLessonSession(plan, 'weak-ui');
for (const item of session.initial.items)
  session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
const event = lessonEvent('weak-ui-evidence', session, 1, 2);
const ratings = localLearningRatings(catalogue, [event]);
beforeEach(async () => {
  await i18n.changeLanguage('de');
  useAuthState.setState({ session: null, ready: true });
  useLearningState.setState({ ratings: null, memory: true });
});
it('keeps the weakness entry disabled without independent evidence', () => {
  render(
    <UiProvider scheme="light">
      <WeaknessEntry />
    </UiProvider>,
  );
  expect(screen.getByText(/Beantworte zunächst einige Aufgaben selbstständig/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Gezielt üben' })).toBeDisabled();
});
it('opens a ten-question weakness session, persists its plan, and does not show course rewards', async () => {
  useLearningState.setState({ rows: [{ event, sequence: null, position: 1, pending: false }] });
  const app = renderRouter('./src/app', { initialUrl: '/practice' });
  fireEvent.press(screen.getByRole('button', { name: 'Gezielt üben' }));
  expect(app.getPathname()).toBe('/lesson');
  expect(screen.getByText(/Zehn Aufgaben aus bis zu drei Fähigkeiten/)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Mit 10 Aufgaben starten' }));
  await waitFor(() => {
    expect(screen.getByTestId('exercise-question')).toBeTruthy();
  });
  const draft = required(useLearningState.getState().drafts[WEAKNESS_LESSON_ID]);
  expect(draft.planKey.startsWith('["weak:1"')).toBe(true);
  const selected = required(
    weaknessPlan(
      catalogue,
      ratings,
      catalogue.lessons.map((l) => l.id),
      Date.now(),
    ),
  );
  expect(selected.exercises).toHaveLength(10);
  expect(screen.queryByText(/Neue Aufgaben/)).toBeNull();
  expect(screen.getByText('Gezieltes Üben')).toBeTruthy();
});
it('uses the server cursor without replaying acknowledged evidence twice; clears ratings on an owner transition', () => {
  useLearningState.setState({
    rows: [{ event, sequence: 10, position: 1, pending: false }],
    ratings: { ...ratings, throughSequence: 10 },
  });
  const hook = renderHook(useLearningRatings);
  expect(hook.result.current.skills).toEqual(ratings.skills);
  act(() => {
    useLearningState.setState({ scope: 'different-account' });
  });
  expect(hook.result.current).toEqual({ skills: {}, buckets: {} });
});
it('adds only new pending evidence to the account snapshot while offline', () => {
  const pending = { ...event, id: 'pending' };
  useLearningState.setState({
    rows: [
      { event, sequence: 10, position: 1, pending: false },
      { event: pending, sequence: null, position: 2, pending: true },
    ],
    ratings: { ...ratings, throughSequence: 10 },
  });
  const hook = renderHook(useLearningRatings);
  expect(hook.result.current).toEqual(localLearningRatings(catalogue, [pending], ratings));
});
it('does not replay an acknowledged older retry whose sequence was not in the current page', () => {
  useLearningState.setState({
    rows: [{ event, sequence: null, position: 1, pending: false }],
    ratings: { ...ratings, throughSequence: 10 },
  });
  expect(renderHook(useLearningRatings).result.current.skills).toEqual(ratings.skills);
});
it('supports a fixed control and deterministic beta groups without enabling analytics', () => {
  const previous = process.env.EXPO_PUBLIC_ADAPTIVE_LESSONS;
  try {
    Object.assign(process.env, { EXPO_PUBLIC_ADAPTIVE_LESSONS: 'control' });
    expect(lessonSelectionGroup('a')).toBe('control');
    expect(lessonSelectionExperiment('a')).toBeUndefined();
    Object.assign(process.env, { EXPO_PUBLIC_ADAPTIVE_LESSONS: 'beta' });
    expect(lessonSelectionGroup('guest')).toBe('control');
    expect(lessonSelectionExperiment('guest')).toBeUndefined();
    expect(lessonSelectionExperiment('account-a')).toBe('p302-beta-v1');
    expect(lessonSelectionGroup('account-a')).toBe(lessonSelectionGroup('account-a'));
    expect(
      new Set(Array.from({ length: 100 }, (_, i) => lessonSelectionGroup(`account-${String(i)}`)))
        .size,
    ).toBe(2);
  } finally {
    if (previous === undefined) Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_ADAPTIVE_LESSONS');
    else Object.assign(process.env, { EXPO_PUBLIC_ADAPTIVE_LESSONS: previous });
  }
});

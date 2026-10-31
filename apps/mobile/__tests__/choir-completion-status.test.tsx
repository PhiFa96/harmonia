import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { render } from '@testing-library/react-native';
import { UiProvider } from '@harmonia/ui/native';
import { catalogue } from '@harmonia/content/authoring';
import {
  applyLessonAction,
  learningPath,
  lessonPlan,
  lessonProgress,
  resolveLesson,
} from '@harmonia/content';
import type { LessonAction, LessonDraft } from '@harmonia/content';
import {
  activeLessonSession,
  createLessonSession,
  currentItem,
  expectedAnswer,
} from '@harmonia/exercises';
import { LessonCompletionStatus } from '@/components/lesson-completion-status';
import { i18n } from '@/i18n';
import { useLearningState } from '@/state/learning';
import { useSettings } from '@/state/settings';
import { useAuthState } from '@/auth';
import type { StoredLearningEvent } from '@/storage/learning-repository';
import type * as LearningModule from '@/state/learning';

// Screen defaults stub writes. These resumed-route checks intentionally exercise the real writer.
jest.mock('@/state/learning', () => ({
  ...jest.requireActual<typeof LearningModule>('@/state/learning'),
  initializeLearning: () => Promise.resolve(),
  syncLearning: () => Promise.resolve(),
}));

const id = 'aural.l4.choir.bass.lesson';
const plan = lessonPlan(catalogue, id);
if (!plan) throw Error('Missing choir plan');
const definition = plan;
function completed(sing: boolean) {
  let session = createLessonSession(definition, 'completion-ui');
  const actions: LessonAction[] = [];
  let sung = false;
  for (let guard = 0; session.phase !== 'complete' && guard < 100; guard++) {
    const active = activeLessonSession(session);
    const item = active && currentItem(active);
    if (!item) throw Error('Missing task');
    const skip = item.type === 'CHOIR_PART' && (!sing || sung);
    const next: LessonAction[] = skip
      ? [{ type: 'skipVoice' }]
      : [{ type: 'answer', answer: expectedAnswer(item) }, { type: 'next' }];
    if (item.type === 'CHOIR_PART' && !skip) sung = true;
    for (const action of next) {
      actions.push(action);
      session = applyLessonAction(session, action);
    }
  }
  const draft: LessonDraft = {
    schemaVersion: 1,
    id: 'choir-completion-ui',
    lessonId: id,
    contentVersion: 28,
    planKey: definition.planKey,
    seed: 'completion-ui',
    startedAt: 1000,
    finishedAt: 2000,
    timeZone: 'Europe/Berlin',
    introCard: 0,
    started: true,
    actions,
    answer: null,
  };
  return { session, draft };
}

for (const locale of ['de', 'en-US', 'en-GB'] as const)
  it(`${locale}: explains the missing singing criterion even at 100 percent and displays successful singing`, async () => {
    await i18n.changeLanguage(locale);
    const failed = lessonProgress(completed(false).session);
    const app = render(
      <UiProvider scheme="light">
        <LessonCompletionStatus progress={failed} minimumChoirCorrect={1} />
      </UiProvider>,
    );
    expect(
      screen.getByText(i18n.t('path.choirRequiredResult', { correct: 5, total: 5, percent: 80 })),
    ).toBeTruthy();
    expect(screen.getByText(i18n.t('path.choirProgress', { count: 0 }))).toBeTruthy();
    expect(screen.queryByText(i18n.t('path.passed', { correct: 5, total: 5 }))).toBeNull();
    const passed = lessonProgress(completed(true).session);
    app.rerender(
      <UiProvider scheme="light">
        <LessonCompletionStatus progress={passed} minimumChoirCorrect={1} />
      </UiProvider>,
    );
    expect(screen.getByText(i18n.t('path.passed', { correct: 6, total: 6 }))).toBeTruthy();
    expect(screen.getByText(i18n.t('path.choirProgress', { count: 1 }))).toBeTruthy();
    expect(
      screen.queryByText(i18n.t('path.choirRequiredResult', { correct: 5, total: 5, percent: 80 })),
    ).toBeNull();
  });

it.each([false, true])(
  'restores the actual completed lesson route and reports singing=%s consistently',
  async (sing) => {
    useSettings.setState({ locale: 'de' });
    useAuthState.setState({ ready: true, session: null, error: false });
    const { draft } = completed(sing);
    const rows: StoredLearningEvent[] = catalogue.lessons
      .filter((lesson) => lesson.unitId !== 'aural.l4.choir')
      .map((lesson, index) => {
        const resolved = resolveLesson(catalogue, lesson.id);
        if (!resolved) throw Error('Missing prerequisite fixture');
        return {
          sequence: index + 1,
          position: index + 1,
          pending: false,
          event: {
            kind: 'retained',
            sourceKind: 'lesson',
            id: `prerequisite-${String(index)}`,
            finishedAt: 2000,
            lessonId: lesson.id,
            contentVersion: lesson.contentVersion,
            progress: {
              lessonId: lesson.id,
              contentVersion: lesson.contentVersion,
              passed: true,
              eligibleCorrect: resolved.exercises.length,
              total: resolved.exercises.length,
            },
          },
        };
      });
    const prerequisites = rows.flatMap((row) =>
      row.event.kind === 'retained' && row.event.sourceKind === 'lesson'
        ? [row.event.progress]
        : [],
    );
    useLearningState.setState({
      phase: 'ready',
      scope: 'guest',
      memory: true,
      rows,
      path: learningPath(catalogue, prerequisites),
      drafts: { [id]: draft },
    });
    renderRouter('./src/app', { initialUrl: `/lesson?id=${id}` });
    await act(async () => {
      fireEvent.press(screen.getByText(i18n.t('flow.resume')));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByText(i18n.t('path.choirProgress', { count: sing ? 1 : 0 }))).toBeTruthy();
    });
    await waitFor(() => {
      expect(useLearningState.getState().rows.some((row) => row.event.id === draft.id)).toBe(true);
    });
    const result = sing
      ? i18n.t('path.passed', { correct: 6, total: 6 })
      : i18n.t('path.choirRequiredResult', { correct: 5, total: 5, percent: 80 });
    expect(screen.getByText(result)).toBeTruthy();
    if (!sing) expect(screen.getByText(i18n.t('flow.xp', { count: 0 }))).toBeTruthy();
  },
);

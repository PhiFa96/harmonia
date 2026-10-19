import { currentMotivation, useMotivation } from '@/state/motivation';
import { catalogue } from '@harmonia/content/catalogue';
import {
  lessonProgress,
  lessonPlan,
  lessonReward,
  DEFAULT_REWARD_RULE,
  rewardRuleAt,
  validateLearningEvent,
  PASS_PERCENT,
  adaptiveLessonPlan,
  weaknessPlan,
  WEAKNESS_LESSON_ID,
  REVIEW_LESSON_ID,
  isPracticeLesson,
  practiceSourceLessons,
  reviewSkillPlan,
  dueReviews,
} from '@harmonia/content';
import {
  activeLessonSession,
  currentItem,
  exercisePrompt,
  lessonSummary,
  nextExercise,
} from '@harmonia/exercises';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card, Icon, useUiTheme } from '@harmonia/ui/native';
import { router, Stack, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ExerciseTask } from '@/components/exercise-task';
import { LessonIntroduction } from '@/components/lesson-introduction';
import { useLocale } from '@/i18n';
import { useLessonFlow } from '@/storage/use-lesson-flow';
import { useLessonResult } from '@/storage/use-lesson-result';
import { selectedLesson } from '@/content';
import { useContentText } from '@/content/use-content-text';
import { useLearningState } from '@/state/learning';
import { useAuthState } from '@/auth';
import { useLearningRatings } from '@/storage/use-learning-ratings';
import { useReviews } from '@/storage/use-reviews';
import { lessonSelectionGroup } from '@/content/adaptive-config';

export default function LessonScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const learning = useLearningState();
  const owner = useAuthState((s) => s.session?.user.id ?? 'guest');
  const ratings = useLearningRatings();
  const reviews = useReviews();
  const frozenReview = useRef<{
    owner: string;
    plan: NonNullable<ReturnType<typeof lessonPlan>>;
  } | null>(null);
  if (frozenReview.current?.owner !== owner || id !== REVIEW_LESSON_ID || learning.scope !== owner)
    frozenReview.current = null;
  const selectedContent = useMemo(() => {
    if (id === REVIEW_LESSON_ID) {
      const saved = learning.drafts[REVIEW_LESSON_ID];
      const reached = learning.path
        .flatMap((u) => u.lessons)
        .filter((l) => l.status !== 'locked')
        .map((l) => l.id);
      return (
        (saved && lessonPlan(catalogue, id, saved.planKey)) ??
        reviewSkillPlan(
          catalogue,
          dueReviews(catalogue, reviews, Date.now(), reached).skills.map((s) => s.id),
          reached,
        )
      );
    }
    if (id === WEAKNESS_LESSON_ID) {
      const saved = learning.drafts[WEAKNESS_LESSON_ID];
      return (
        (saved && lessonPlan(catalogue, id, saved.planKey)) ??
        weaknessPlan(
          catalogue,
          ratings,
          learning.path
            .flatMap((u) => u.lessons)
            .filter((l) => l.status !== 'locked')
            .map((l) => l.id),
          Date.now(),
        )
      );
    }
    const selected = selectedLesson(id);
    return selected
      ? lessonSelectionGroup(owner) === 'adaptive'
        ? adaptiveLessonPlan(catalogue, selected.id, ratings, Date.now())
        : lessonPlan(catalogue, selected.id)
      : undefined;
  }, [id, owner, ratings, reviews, learning.path, learning.drafts]);
  if (
    id === REVIEW_LESSON_ID &&
    learning.phase === 'ready' &&
    learning.scope === owner &&
    selectedContent &&
    !frozenReview.current
  )
    frozenReview.current = { owner, plan: selectedContent };
  // Completing the last due skill clears its draft and removes it from the queue.
  // Keep this route's plan so its saved result remains visible until the learner leaves.
  const content =
    id === REVIEW_LESSON_ID ? (frozenReview.current?.plan ?? selectedContent) : selectedContent;
  const practice = content !== undefined && isPracticeLesson(content.id);
  const status = learning.path
    .flatMap((unit) => unit.lessons)
    .find((l) => l.id === content?.id)?.status;
  if (!content)
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: t('tabs.learn') }} />
        <Card>
          <AppText>{t('learn.unavailable')}</AppText>
        </Card>
        <Button
          variant="ghost"
          label={t('lesson.home')}
          onPress={() => {
            router.dismissTo('/');
          }}
        />
      </View>
    );
  const reached = new Set(
    learning.path
      .flatMap((u) => u.lessons)
      .filter((l) => l.status !== 'locked')
      .map((l) => l.id),
  );
  const accessible = practice
    ? practiceSourceLessons(content.planKey).every((id) => reached.has(id))
    : status && status !== 'locked';
  if (learning.phase !== 'ready' || learning.scope !== owner || !accessible)
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: t('tabs.learn') }} />
        <Card>
          <AppText role="alert">
            {t(
              learning.phase === 'ready' && learning.scope === owner
                ? 'path.lessonLocked'
                : 'path.loading',
            )}
          </AppText>
        </Card>
        <Button
          label={t('lesson.home')}
          onPress={() => {
            router.dismissTo('/');
          }}
        />
      </View>
    );
  return (
    <LessonPlayer
      key={`${owner}:${content.id}:${String(content.contentVersion)}`}
      content={content}
    />
  );
}

function LessonPlayer({
  content: initialContent,
}: {
  readonly content: NonNullable<ReturnType<typeof lessonPlan>>;
}) {
  const { t } = useTranslation();
  const contentText = useContentText();
  const locale = useLocale();
  const { colors } = useUiTheme();
  const flow = useLessonFlow(initialContent);
  const content = flow.plan;
  const practice = isPracticeLesson(content.id);
  const title = practice
    ? t(content.id === REVIEW_LESSON_ID ? 'review.skillsTitle' : 'adaptive.weaknessTitle')
    : contentText(content.titleKey);
  const lesson = flow.session;
  const answer = flow.draft.answer;
  const navigation = useNavigation();
  const [paused, setPaused] = useState(false);
  const [exitError, setExitError] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const exitAction = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);
  const learning = useLearningState();
  const scroll = useRef<ScrollView>(null);
  const question = useRef<View>(null);
  const session = lesson ? activeLessonSession(lesson) : undefined;
  const item = session ? currentItem(session) : undefined;
  const summary = lesson ? lessonSummary(lesson) : undefined;
  const storage = useLessonResult(
    flow.resume ? null : lesson,
    flow.draft.id,
    new Date(flow.draft.startedAt).toISOString(),
    flow.draft.finishedAt,
    flow.draft.timeZone,
  );
  usePreventRemove(
    !leaving &&
      !(
        lesson?.phase === 'complete' &&
        (storage.status === 'saved' || storage.status === 'memory')
      ),
    ({ data }) => {
      exitAction.current = data.action;
      setPaused(true);
    },
  );
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const href = window.location.href;
    const historyState: unknown = window.history.state;
    // Expo verarbeitet Browser-Popstate außerhalb von beforeRemove. Vor dessen Listener
    // die aktuelle Route erhalten; der bestätigte Rückweg läuft über den Router.
    const onPop = (event: PopStateEvent) => {
      if (
        leaving ||
        (lesson?.phase === 'complete' &&
          (storage.status === 'saved' || storage.status === 'memory')) ||
        window.location.href === href
      )
        return;
      event.stopImmediatePropagation();
      window.history.pushState(historyState, '', href);
      exitAction.current = null;
      setPaused(true);
    };
    window.addEventListener('popstate', onPop, true);
    return () => {
      window.removeEventListener('popstate', onPop, true);
    };
  }, [leaving, lesson?.phase, storage.status]);
  useEffect(() => {
    if (!leaving) return;
    if (exitAction.current) navigation.dispatch(exitAction.current);
    else router.dismissTo(practice ? '/practice' : '/');
  }, [leaving, navigation, practice]);
  useEffect(() => {
    if (storage.status === 'saved' || storage.status === 'memory')
      void flow.clear().catch(() => {
        setExitError(true);
      });
  }, [storage.status, flow.clear]);
  const leave = async (discard = false) => {
    setExitError(false);
    try {
      if (discard) await flow.clear();
      else await flow.flush();
      setLeaving(true);
    } catch {
      setExitError(true);
    }
  };
  const repeated = useMemo(() => {
    const previous = learning.rows.filter(
      (row) =>
        row.event.id !== flow.draft.id &&
        row.event.kind === 'lesson' &&
        row.event.lessonId === content.id &&
        row.event.contentVersion === content.contentVersion &&
        row.event.timeZone,
    );
    return previous.some((row) => {
      try {
        return validateLearningEvent(catalogue, row.event).lesson?.passed;
      } catch {
        return false;
      }
    });
  }, [learning.rows, flow.draft.id, content.id, content.contentVersion]);
  const own = learning.rows.find((row) => row.event.id === flow.draft.id);
  const motivation = useMotivation();
  const finishedAt = flow.draft.finishedAt ?? Date.now();
  const rule = rewardRuleAt(motivation.data?.rules ?? [DEFAULT_REWARD_RULE], finishedAt);
  const xp = own?.reward?.amount ?? (lesson ? lessonReward(lesson, repeated, rule) : 0);
  const qualified = !practice && lesson ? lessonProgress(lesson).passed : false;
  const coins =
    own?.reward?.coins ?? (qualified ? (repeated ? rule.repeatCoins : rule.newCoins) : 0);
  const motivationView = currentMotivation(
    Date.now(),
    lesson?.phase === 'complete'
      ? {
          id: flow.draft.id,
          at: finishedAt,
          timeZone: flow.draft.timeZone,
          amount: xp,
          qualified,
          coins,
        }
      : undefined,
  );
  const streak = motivationView.summary.streak.current;
  const heading = item
    ? exercisePrompt(item, locale)
    : lesson?.phase === 'review-intro'
      ? t('lesson.reviewTitle')
      : lesson?.phase === 'complete'
        ? t(practice ? 'exercise.complete' : 'lesson.complete')
        : title;
  const focusQuestion = useCallback(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    if (Platform.OS === 'web')
      (question.current as unknown as HTMLElement | null)?.focus({ preventScroll: true });
    else if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(heading);
  }, [heading]);
  useFocusEffect(
    useCallback(() => {
      focusQuestion();
    }, [focusQuestion, item, lesson?.phase]),
  );
  const start = flow.start;
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title }} />
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.container}
        {...(Platform.OS === 'web' ? { tabIndex: 0 } : {})}
      >
        <View style={styles.content}>
          {flow.accessError ? <AppText role="alert">{t('paywall.accessError')}</AppText> : null}
          {flow.accessPending ? <AppText aria-live="polite">{t('paywall.loading')}</AppText> : null}
          {flow.resume && !paused ? (
            <Card>
              <View style={styles.result}>
                <AppText variant="title2">
                  {t(flow.changed ? 'flow.changed' : 'flow.resumeTitle')}
                </AppText>
                <AppText>{t(flow.changed ? 'flow.changedHint' : 'flow.resumeHint')}</AppText>
                {!flow.changed ? <Button label={t('flow.resume')} onPress={flow.continue} /> : null}
                <Button
                  variant="secondary"
                  label={t('flow.newAttempt')}
                  onPress={() => {
                    flow.restart();
                  }}
                />
              </View>
            </Card>
          ) : paused ? (
            <Card>
              <View style={styles.result}>
                <AppText variant="title2">{t('flow.pauseTitle')}</AppText>
                <AppText>{t('flow.pauseHint')}</AppText>
                <Button
                  label={t('flow.continueHere')}
                  onPress={() => {
                    setPaused(false);
                    exitAction.current = null;
                  }}
                />
                <Button
                  variant="secondary"
                  label={t(practice ? 'adaptive.returnPractice' : 'flow.pauseLeave')}
                  disabled={flow.status === 'saving' || flow.status === 'error'}
                  onPress={() => {
                    void leave();
                  }}
                />
                <Button
                  variant="ghost"
                  label={t('flow.discard')}
                  onPress={() => {
                    void leave(true);
                  }}
                />
                {flow.status === 'error' || exitError ? (
                  <AppText role="alert" tone="danger">
                    {t('flow.saveError')}
                  </AppText>
                ) : null}
                {flow.status === 'error' ? (
                  <Button label={t('lesson.retrySave')} onPress={flow.retry} />
                ) : null}
              </View>
            </Card>
          ) : !lesson ? (
            <>
              <View
                ref={question}
                aria-label={heading}
                {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}
              >
                <AppText variant="title1">{title}</AppText>
              </View>
              <AppText variant="footnote" tone="muted">
                {practice
                  ? t('adaptive.weaknessIntro')
                  : t('flow.mix', {
                      newCount: content.newCount,
                      repeatCount: content.repetitionCount,
                    })}
              </AppText>
              {!practice && content.planKey.startsWith('["flow:2"') ? (
                <AppText tone="muted">{t('adaptive.lessonHint')}</AppText>
              ) : null}
              {content.introduction.length > 0 ? (
                <LessonIntroduction
                  lesson={content}
                  initialCard={flow.draft.introCard}
                  onCardSave={flow.card}
                  onStart={start}
                  onCardChange={focusQuestion}
                />
              ) : (
                <Button
                  label={t('lesson.start', { count: content.exercises.length })}
                  onPress={start}
                />
              )}
            </>
          ) : item && session ? (
            <>
              <AppText variant="footnote" tone="muted">
                {t(
                  practice
                    ? 'adaptive.practiceLabel'
                    : lesson.phase === 'review'
                      ? 'flow.errorPractice'
                      : content.repetitionIndices.includes(session.index)
                        ? 'flow.repetition'
                        : 'flow.newMaterial',
                )}
              </AppText>
              <ExerciseTask
                session={session}
                reportSource={{
                  kind: 'lesson',
                  lessonId: lesson.lesson.id,
                  contentVersion: lesson.lesson.contentVersion,
                  ...(lesson.lesson.planKey ? { planKey: lesson.lesson.planKey } : {}),
                  seed: lesson.seed,
                  round: lesson.phase === 'review' ? 'review' : 'initial',
                  index:
                    lesson.phase === 'review'
                      ? (lesson.reviewOrigins[session.index] ?? -1)
                      : session.index,
                }}
                item={item}
                answer={answer}
                question={question}
                scroll={scroll}
                progressText={t(
                  lesson.phase === 'review' ? 'lesson.reviewProgress' : 'exercise.progress',
                  { current: session.index + 1, total: session.items.length },
                )}
                progressLabel={t(
                  lesson.phase === 'review' ? 'lesson.reviewProgressLabel' : 'lesson.progressLabel',
                )}
                hearingPausedText={t('lesson.hearingPaused')}
                continueLabel={t(
                  currentItem(nextExercise(session)) ? 'exercise.next' : 'lesson.roundEnd',
                )}
                onSelect={flow.select}
                onCheck={(value) => {
                  flow.act({ type: 'answer', answer: value });
                }}
                onHint={() => {
                  flow.act({ type: 'hint' });
                }}
                onSkip={() => {
                  flow.act({ type: 'skip' });
                }}
                onSkipVoice={() => {
                  flow.act({ type: 'skipVoice' });
                }}
                onNext={() => {
                  flow.act({ type: 'next' });
                }}
              />
            </>
          ) : lesson.phase === 'review-intro' && summary ? (
            <>
              <View
                ref={question}
                aria-label={heading}
                {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}
              >
                <AppText variant="title1">{t('lesson.reviewTitle')}</AppText>
              </View>
              <Card>
                <AppText>
                  {t('lesson.reviewIntro', { count: summary.reviewTotal - summary.reviewSkipped })}
                </AppText>
              </Card>
              {summary.reviewSkipped > 0 ? (
                <AppText tone="muted">
                  {t('lesson.reviewSkipped', { count: summary.reviewSkipped })}
                </AppText>
              ) : null}
              <Button
                label={t('lesson.reviewStart')}
                onPress={() => {
                  flow.act({ type: 'review' });
                }}
              />
            </>
          ) : lesson.phase === 'complete' && summary ? (
            <>
              <View
                ref={question}
                aria-label={heading}
                {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}
              >
                <AppText variant="title1">
                  {t(practice ? 'exercise.complete' : 'lesson.complete')}
                </AppText>
              </View>
              <Card>
                <View style={styles.result}>
                  <Icon
                    name={!practice && lessonProgress(lesson).passed ? 'check' : 'target'}
                    color={colors.primaryText}
                    size={SPACE.xxl}
                  />
                  <AppText variant="title2">{t('lesson.initialResult', summary)}</AppText>
                  {practice ? (
                    <AppText>
                      {t(
                        content.id === REVIEW_LESSON_ID
                          ? 'review.noRewards'
                          : 'adaptive.practiceResult',
                      )}
                    </AppText>
                  ) : (
                    <>
                      <AppText variant="title2">{t('flow.xp', { count: xp })}</AppText>
                      <AppText>{t('flow.streak', { count: streak })}</AppText>
                      <AppText>{t('motivation.coinsEarned', { count: coins })}</AppText>
                      <AppText>
                        {t('motivation.dailyProgress', {
                          xp: motivationView.summary.todayXP,
                          goal: motivationView.preferences.dailyGoal,
                        })}
                      </AppText>
                      {!own?.reward ? (
                        <AppText variant="footnote" tone="muted">
                          {t('flow.localReward')}
                        </AppText>
                      ) : null}
                      <AppText tone={lessonProgress(lesson).passed ? 'success' : 'default'}>
                        {t(lessonProgress(lesson).passed ? 'path.passed' : 'path.failed', {
                          correct: lessonProgress(lesson).eligibleCorrect,
                          total: lessonProgress(lesson).total,
                          percent: PASS_PERCENT,
                        })}
                      </AppText>
                      <AppText variant="footnote" tone="muted">
                        {t('path.resultHint')}
                      </AppText>
                    </>
                  )}
                  {summary.accuracy !== null ? (
                    <AppText>
                      {t('lesson.accuracy', { value: Math.round(summary.accuracy * 100) })}
                    </AppText>
                  ) : null}
                  <AppText>
                    {t('exercise.independent', { count: summary.independentCorrect })}
                  </AppText>
                  {summary.assisted > 0 ? (
                    <AppText>{t('exercise.assistedSummary', { count: summary.assisted })}</AppText>
                  ) : null}
                  {summary.skipped > 0 ? (
                    <AppText>{t('exercise.skippedSummary', { count: summary.skipped })}</AppText>
                  ) : null}
                  {summary.reviewTotal > 0 ? (
                    <AppText>
                      {t('lesson.reviewResult', {
                        correct: summary.reviewCorrect,
                        count: summary.reviewAnswered,
                      })}
                    </AppText>
                  ) : null}
                  {summary.reviewAssisted > 0 ? (
                    <AppText>
                      {t('lesson.reviewAssisted', { count: summary.reviewAssisted })}
                    </AppText>
                  ) : null}
                  {summary.reviewSkipped > 0 ? (
                    <AppText>{t('lesson.reviewSkipped', { count: summary.reviewSkipped })}</AppText>
                  ) : null}
                  <AppText>
                    {summary.unresolved > 0
                      ? t('lesson.unresolved', { count: summary.unresolved })
                      : t('lesson.allResolved')}
                  </AppText>
                  {storage.attempt ? (
                    <AppText tone="muted">
                      {t('lesson.duration', {
                        minutes: Math.floor(storage.attempt.durationMs / 60000),
                        seconds: Math.floor(storage.attempt.durationMs / 1000) % 60,
                      })}
                    </AppText>
                  ) : null}
                </View>
              </Card>
              <AppText aria-live="polite" tone={storage.status === 'error' ? 'danger' : 'muted'}>
                {storage.status === 'memory'
                  ? t('onboarding.temporaryHint')
                  : storage.status === 'saved'
                    ? t('lesson.saved')
                    : storage.status === 'error'
                      ? t('lesson.saveError')
                      : t('lesson.saving')}
              </AppText>
              {storage.status === 'error' ? (
                <Button label={t('lesson.retrySave')} onPress={storage.retrySave} />
              ) : null}
              <Button
                label={t(practice ? 'exercise.restart' : 'lesson.restart')}
                disabled={storage.status !== 'saved' && storage.status !== 'memory'}
                onPress={() => {
                  flow.restart(true);
                }}
              />
              <Button
                variant="ghost"
                label={t(practice ? 'adaptive.returnPractice' : 'lesson.home')}
                disabled={storage.status !== 'saved' && storage.status !== 'memory'}
                onPress={() => {
                  router.dismissTo(practice ? '/practice' : '/');
                }}
              />
            </>
          ) : null}
          {!flow.resume && !paused && lesson?.phase !== 'complete' ? (
            <>
              <AppText
                variant="footnote"
                tone={flow.status === 'error' ? 'danger' : 'muted'}
                aria-live="polite"
              >
                {t(
                  flow.status === 'error'
                    ? 'flow.saveError'
                    : flow.status === 'saving'
                      ? 'lesson.saving'
                      : flow.status === 'memory'
                        ? 'onboarding.temporaryHint'
                        : 'flow.saved',
                )}
              </AppText>
              {flow.status === 'error' ? (
                <Button label={t('lesson.retrySave')} onPress={flow.retry} />
              ) : null}
              <Button
                variant="ghost"
                label={t('flow.pause')}
                onPress={() => {
                  setPaused(true);
                }}
              />
            </>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}
const styles = StyleSheet.create({
  container: { padding: LAYOUT.screenPadding, paddingBottom: SPACE.xxxl },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', gap: SPACE.m },
  result: { gap: SPACE.m },
});

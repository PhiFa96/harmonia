import type { LessonContent } from '@harmonia/content';
import { lessonProgress, PASS_PERCENT } from '@harmonia/content';
import type { LessonSession } from '@harmonia/exercises';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  exercisePrompt,
  lessonSummary,
  nextExercise,
  nextLessonExercise,
  revealLessonHint,
  skipLessonAural,
  startLessonReview,
} from '@harmonia/exercises';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card, Icon, useUiTheme } from '@harmonia/ui/native';
import { randomUUID } from 'expo-crypto';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ExerciseTask } from '@/components/exercise-task';
import { LessonIntroduction } from '@/components/lesson-introduction';
import { useLocale } from '@/i18n';
import { useLessonResult } from '@/storage/use-lesson-result';
import { selectedLesson } from '@/content';
import { useContentText } from '@/content/use-content-text';
import { useLearningState } from '@/state/learning';
import { useAuthState } from '@/auth';

export default function LessonScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const content = useMemo(() => selectedLesson(id), [id]);
  const learning = useLearningState();
  const owner = useAuthState((s) => s.session?.user.id ?? 'guest');
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
  if (learning.phase !== 'ready' || learning.scope !== owner || status === 'locked' || !status)
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

function LessonPlayer({ content }: { readonly content: LessonContent }) {
  const { t } = useTranslation();
  const contentText = useContentText();
  const locale = useLocale();
  const { colors } = useUiTheme();
  const [lesson, setLesson] = useState<LessonSession | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [identity, setIdentity] = useState({ id: '', startedAt: '' });
  const run = useRef(0);
  const scroll = useRef<ScrollView>(null);
  const question = useRef<View>(null);
  const session = lesson ? activeLessonSession(lesson) : undefined;
  const item = session ? currentItem(session) : undefined;
  const summary = lesson ? lessonSummary(lesson) : undefined;
  const storage = useLessonResult(lesson, identity.id, identity.startedAt);
  const heading = item
    ? exercisePrompt(item, locale)
    : lesson?.phase === 'review-intro'
      ? t('lesson.reviewTitle')
      : lesson?.phase === 'complete'
        ? t('lesson.complete')
        : contentText(content.titleKey);
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
  const start = () => {
    setIdentity({ id: randomUUID(), startedAt: new Date(Date.now()).toISOString() });
    setAnswer(null);
    const session = createLessonSession(content, Date.now() + run.current++);
    setLesson(session);
  };
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: contentText(content.titleKey) }} />
      <ScrollView ref={scroll} contentContainerStyle={styles.container}>
        <View style={styles.content}>
          {!lesson ? (
            <>
              <View
                ref={question}
                aria-label={heading}
                {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}
              >
                <AppText variant="title1">{contentText(content.titleKey)}</AppText>
              </View>
              {content.introduction.length > 0 ? (
                <LessonIntroduction lesson={content} onStart={start} onCardChange={focusQuestion} />
              ) : (
                <Button
                  label={t('lesson.start', { count: content.exercises.length })}
                  onPress={start}
                />
              )}
            </>
          ) : item && session ? (
            <ExerciseTask
              session={session}
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
              onSelect={setAnswer}
              onCheck={(value) => {
                setLesson(answerLesson(lesson, value));
              }}
              onHint={() => {
                setLesson(revealLessonHint(lesson));
              }}
              onSkip={() => {
                setAnswer(null);
                setLesson(skipLessonAural(lesson));
              }}
              onNext={() => {
                setAnswer(null);
                setLesson(nextLessonExercise(lesson));
              }}
            />
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
                  setLesson(startLessonReview(lesson));
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
                <AppText variant="title1">{t('lesson.complete')}</AppText>
              </View>
              <Card>
                <View style={styles.result}>
                  <Icon name="check" color={colors.primaryText} size={SPACE.xxl} />
                  <AppText variant="title2">{t('lesson.initialResult', summary)}</AppText>
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
                label={t('lesson.restart')}
                disabled={storage.status !== 'saved' && storage.status !== 'memory'}
                onPress={start}
              />
              <Button
                variant="ghost"
                label={t('lesson.home')}
                disabled={storage.status !== 'saved' && storage.status !== 'memory'}
                onPress={() => {
                  router.dismissTo('/');
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

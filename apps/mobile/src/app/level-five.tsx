import { useRef, useState } from 'react';
import { ScrollView, type View } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { catalogue } from '@harmonia/content/catalogue';
import { resolveLesson, type LessonContent } from '@harmonia/content';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  lessonSummary,
  nextLessonExercise,
  revealLessonHint,
  startLessonReview,
  type LessonSession,
} from '@harmonia/exercises';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { ExerciseTask } from '@/components/exercise-task';
import { LessonIntroduction } from '@/components/lesson-introduction';
import { levelFiveDraftLessons } from '@/components/level-five-entry';
import { useContentText } from '@/content/use-content-text';

/** Internal review route. Uses only the build-selected catalogue. No XP or persistence. */
export default function LevelFiveScreen() {
  const { t } = useTranslation(),
    text = useContentText();
  const lessons = levelFiveDraftLessons();
  const [content, setContent] = useState<LessonContent | null>(null);
  const [lesson, setLesson] = useState<LessonSession | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null),
    question = useRef<View>(null);
  const session = lesson ? activeLessonSession(lesson) : undefined;
  const item = session ? currentItem(session) : undefined;
  const top = () => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const summary = lesson ? lessonSummary(lesson) : undefined;
  return (
    <ScrollView
      ref={scroll}
      contentContainerStyle={{
        padding: SPACE.l,
        gap: SPACE.m,
        maxWidth: LAYOUT.maxContentWidth,
        width: '100%',
        alignSelf: 'center',
      }}
    >
      <Stack.Screen options={{ headerShown: true, title: t('exercise.levelFiveTitle') }} />
      {!lessons.length ? (
        <AppText>{t('learn.unavailable')}</AppText>
      ) : (
        <>
          <AppText variant="title1">{t('exercise.levelFiveTitle')}</AppText>
          <AppText role="note">{t('exercise.levelFiveDraft')}</AppText>
          <AppText tone="muted">{t('exercise.levelFiveInternal')}</AppText>
          {!content ? (
            lessons.map((entry) => {
              const unit = catalogue.units.find((unit) => unit.id === entry.unitId);
              return (
                <Card key={entry.id}>
                  <AppText variant="title3">{unit ? text(unit.titleKey) : ''}</AppText>
                  <AppText>{text(entry.titleKey)}</AppText>
                  <Button
                    testID={`level-five-open-${entry.id}`}
                    label={t('exercise.levelFiveLesson')}
                    onPress={() => {
                      const resolved = resolveLesson(catalogue, entry.id);
                      if (!resolved) return;
                      setContent(resolved);
                      setLesson(null);
                      setAnswer(null);
                      top();
                    }}
                  />
                </Card>
              );
            })
          ) : !lesson ? (
            <LessonIntroduction
              key={content.id}
              lesson={content}
              onCardChange={top}
              onStart={() => {
                setLesson(createLessonSession(content, Date.now()));
                top();
              }}
            />
          ) : item && session ? (
            <ExerciseTask
              item={item}
              session={session}
              answer={answer}
              question={question}
              scroll={scroll}
              reportSource={{
                kind: 'lesson',
                lessonId: content.id,
                contentVersion: content.contentVersion,
                seed: lesson.seed,
                round: lesson.phase === 'review' ? 'review' : 'initial',
                index:
                  lesson.phase === 'review'
                    ? (lesson.reviewOrigins[session.index] ?? session.index)
                    : session.index,
              }}
              progressText={`${String(session.index + 1)} / ${String(session.items.length)}`}
              progressLabel={t('exercise.levelFiveTitle')}
              hearingPausedText=""
              continueLabel={t('exercise.levelFiveNext')}
              onSelect={setAnswer}
              onCheck={(value) => {
                setLesson(answerLesson(lesson, value));
              }}
              onHint={() => {
                setLesson(revealLessonHint(lesson));
              }}
              onSkip={() => {
                /* No hearing-only tasks in this preview. */
              }}
              onNext={() => {
                setAnswer(null);
                setLesson(nextLessonExercise(lesson));
                top();
              }}
            />
          ) : lesson.phase === 'review-intro' ? (
            <Card>
              <AppText>{t('exercise.levelFiveReview')}</AppText>
              <Button
                label={t('exercise.levelFiveReviewStart')}
                onPress={() => {
                  setLesson(startLessonReview(lesson));
                  top();
                }}
              />
            </Card>
          ) : (
            <Card testID="level-five-complete">
              <AppText>
                {t('exercise.levelFiveDone', {
                  correct: summary?.correct ?? 0,
                  total: summary?.answered ?? 0,
                  remaining: summary?.unresolved ?? 0,
                })}
              </AppText>
            </Card>
          )}
          {content ? (
            <Button
              variant="secondary"
              label={t('exercise.levelFiveBack')}
              onPress={() => {
                setContent(null);
                setLesson(null);
                setAnswer(null);
                top();
              }}
            />
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

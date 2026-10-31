import { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import type { View } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { catalogue } from '@harmonia/content/catalogue';
import { resolveLesson } from '@harmonia/content';
import type { LessonContent } from '@harmonia/content';
import {
  answerSession,
  createLessonSession,
  currentItem,
  nextExercise,
  revealHint,
} from '@harmonia/exercises';
import type { ExerciseSession } from '@harmonia/exercises';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { ExerciseTask } from '@/components/exercise-task';
import { LessonIntroduction } from '@/components/lesson-introduction';
import { useContentText } from '@/content/use-content-text';

/** Preview-only catalogue entry. No progress, rewards, persistence or public authoring import. */
export default function PartWritingScreen() {
  const { t } = useTranslation(),
    text = useContentText();
  const lessons = catalogue.lessons.filter(
    (l) => /^satz\.l[45]\.writing\./.test(l.id) && l.status === 'entwurf',
  );
  const [active, setActive] = useState<{
    lesson: LessonContent;
    seed: number;
    started: boolean;
    session: ExerciseSession;
  } | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null),
    question = useRef<View>(null);
  const item = active && currentItem(active.session);
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
      <Stack.Screen options={{ headerShown: true, title: t('exercise.type_VOICE_LEADING') }} />
      {!lessons.length ? (
        <AppText>{t('learn.unavailable')}</AppText>
      ) : (
        <>
          <AppText variant="title1">{t('exercise.type_VOICE_LEADING')}</AppText>
          <AppText>{t('exercise.satbDraft')}</AppText>
          <AppText tone="muted">{t('exercise.satbInternal')}</AppText>
          {!active ? (
            lessons.map((lesson) => (
              <Card key={lesson.id}>
                <AppText variant="title3">
                  {t('exercise.satbStage', { level: lesson.id.includes('.l4.') ? 4 : 5 })} ·{' '}
                  {text(lesson.titleKey)}
                </AppText>
                <Button
                  testID={`satb-start-${lesson.id}`}
                  label={t('exercise.satbOpen')}
                  onPress={() => {
                    const resolved = resolveLesson(catalogue, lesson.id);
                    if (!resolved) return;
                    const seed = Date.now();
                    setAnswer(null);
                    setActive({
                      lesson: resolved,
                      seed,
                      started: false,
                      session: createLessonSession(resolved, seed).initial,
                    });
                    scroll.current?.scrollTo({ y: 0, animated: false });
                  }}
                />
              </Card>
            ))
          ) : !active.started ? (
            <LessonIntroduction
              key={`${active.lesson.id}:${String(active.seed)}`}
              lesson={active.lesson}
              onStart={() => {
                setActive({ ...active, started: true });
                scroll.current?.scrollTo({ y: 0, animated: false });
              }}
              onCardChange={() => {
                scroll.current?.scrollTo({ y: 0, animated: false });
              }}
            />
          ) : item ? (
            <ExerciseTask
              item={item}
              session={active.session}
              answer={answer}
              question={question}
              scroll={scroll}
              reportSource={{
                kind: 'lesson',
                lessonId: active.lesson.id,
                contentVersion: active.lesson.contentVersion,
                seed: active.seed,
                round: 'initial',
                index: active.session.index,
              }}
              progressText={`${String(active.session.index + 1)} / ${String(active.session.items.length)}`}
              progressLabel={t('exercise.type_VOICE_LEADING')}
              hearingPausedText=""
              continueLabel={t('exercise.satbNew')}
              onSelect={setAnswer}
              onCheck={(value) => {
                setActive({ ...active, session: answerSession(active.session, value) });
              }}
              onHint={() => {
                setActive({ ...active, session: revealHint(active.session) });
              }}
              onSkip={() => {
                /* These notation tasks contain no aural skip step. */
              }}
              onNext={() => {
                setAnswer(null);
                setActive({ ...active, session: nextExercise(active.session) });
                scroll.current?.scrollTo({ y: 0, animated: false });
              }}
            />
          ) : (
            <AppText>{t('exercise.satbDone')}</AppText>
          )}
          {active ? (
            <Button
              variant="secondary"
              label={t('lesson.home')}
              onPress={() => {
                setActive(null);
                setAnswer(null);
              }}
            />
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

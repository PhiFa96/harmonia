import { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import type { View } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { catalogue } from '@harmonia/content/catalogue';
import { resolveLesson } from '@harmonia/content';
import {
  answerSession,
  createLessonSession,
  currentItem,
  nextExercise,
  revealHint,
  skipVoiceExercise,
} from '@harmonia/exercises';
import type { ExerciseSession } from '@harmonia/exercises';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { ExerciseTask } from '@/components/exercise-task';
import { useContentText } from '@/content/use-content-text';

/** Preview-only catalogue entry. No progress, rewards, persistence or public authoring import. */
export default function ChoirScreen() {
  const { t } = useTranslation(),
    text = useContentText();
  const lessons = catalogue.lessons.filter(
    (l) => l.id.startsWith('aural.l4.choir.') && l.status === 'entwurf',
  );
  const [active, setActive] = useState<{
    id: string;
    version: number;
    seed: number;
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
      <Stack.Screen options={{ headerShown: true, title: t('exercise.type_CHOIR_PART') }} />
      {!lessons.length ? (
        <AppText>{t('learn.unavailable')}</AppText>
      ) : (
        <>
          <AppText variant="title1">{t('exercise.type_CHOIR_PART')}</AppText>
          <AppText>{t('exercise.choirDraft')}</AppText>
          <AppText tone="muted">{t('exercise.choirSource')}</AppText>
          {!active ? (
            lessons.map((lesson) => (
              <Card key={lesson.id}>
                <AppText variant="title3">{text(lesson.titleKey)}</AppText>
                <AppText>{text('content.choir.intro')}</AppText>
                <Button
                  testID={`choir-start-${lesson.id}`}
                  label={t('exercise.choirOpen')}
                  onPress={() => {
                    const resolved = resolveLesson(catalogue, lesson.id);
                    if (!resolved) return;
                    const seed = Date.now();
                    setAnswer(null);
                    setActive({
                      id: lesson.id,
                      version: resolved.contentVersion,
                      seed,
                      session: createLessonSession(resolved, seed).initial,
                    });
                    scroll.current?.scrollTo({ y: 0, animated: false });
                  }}
                />
              </Card>
            ))
          ) : item ? (
            <ExerciseTask
              item={item}
              session={active.session}
              answer={answer}
              question={question}
              scroll={scroll}
              reportSource={{
                kind: 'lesson',
                lessonId: active.id,
                contentVersion: active.version,
                seed: active.seed,
                round: 'initial',
                index: active.session.index,
              }}
              progressText={`${String(active.session.index + 1)} / ${String(active.session.items.length)}`}
              progressLabel={t('exercise.type_CHOIR_PART')}
              hearingPausedText=""
              continueLabel={t('exercise.satbNew')}
              onSelect={setAnswer}
              onCheck={(value) => {
                setActive({ ...active, session: answerSession(active.session, value) });
              }}
              onHint={() => {
                setActive({ ...active, session: revealHint(active.session) });
              }}
              onSkipVoice={() => {
                setAnswer(null);
                setActive({ ...active, session: skipVoiceExercise(active.session) });
              }}
              onSkip={() => {
                setAnswer(null);
                setActive({ ...active, session: skipVoiceExercise(active.session) });
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

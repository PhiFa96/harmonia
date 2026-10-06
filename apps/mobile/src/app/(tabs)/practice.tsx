import type { ExerciseSession } from '@harmonia/exercises';
import {
  answerSession,
  currentItem,
  exercisePrompt,
  nextExercise,
  revealHint,
  sessionSummary,
  skipAuralExercises,
} from '@harmonia/exercises';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ExerciseTask } from '@/components/exercise-task';
import { createPitchInputSession, createPracticeSession } from '@/exercises/practice';
import { useLocale } from '@/i18n';

export default function PracticeScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [session, setSession] = useState<ExerciseSession | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [construction, setConstruction] = useState(false);
  const run = useRef(0);
  const scroll = useRef<ScrollView>(null);
  const question = useRef<View>(null);
  const item = session ? currentItem(session) : undefined;
  const index = session?.index;
  const prompt = item ? exercisePrompt(item, locale) : '';
  const started = session !== null;
  const summary = session ? sessionSummary(session) : undefined;
  const start = (build = construction) => {
    setConstruction(build);
    setAnswer(null);
    setSession(
      (build ? createPitchInputSession : createPracticeSession)(Date.now() + run.current++),
    );
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  useFocusEffect(
    useCallback(() => {
      if (!started) return;
      scroll.current?.scrollTo({ y: 0, animated: false });
      if (Platform.OS === 'web')
        (question.current as unknown as HTMLElement | null)?.focus({ preventScroll: true });
      else if (Platform.OS === 'ios')
        AccessibilityInfo.announceForAccessibility(prompt || t('exercise.complete'));
    }, [index, item, prompt, started, t]),
  );

  return (
    <ScrollView ref={scroll} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        {!session ? (
          <>
            <AppText variant="title1">{t('exercise.title')}</AppText>
            <AppText tone="muted">{t('exercise.intro')}</AppText>
            <Card>
              <View style={styles.types}>
                {(
                  ['NOTE_NAME', 'INTERVAL_IDENTIFY_VISUAL', 'INTERVAL_IDENTIFY_AURAL'] as const
                ).map((type) => (
                  <AppText key={type} variant="title3">
                    {t(`exercise.type_${type}`)}
                  </AppText>
                ))}
              </View>
            </Card>
            <Button
              label={t('exercise.start')}
              onPress={() => {
                start(false);
              }}
            />
            <Card>
              <AppText variant="title3">{t('exercise.constructionStart')}</AppText>
              <AppText tone="muted">{t('exercise.constructionIntro')}</AppText>
            </Card>
            <Button
              variant="secondary"
              label={t('exercise.constructionStart')}
              onPress={() => {
                start(true);
              }}
            />
          </>
        ) : item ? (
          <>
            <ExerciseTask
              session={session}
              item={item}
              answer={answer}
              question={question}
              scroll={scroll}
              progressText={t('exercise.progress', {
                current: session.index + 1,
                total: session.items.length,
              })}
              progressLabel={t('exercise.progressLabel')}
              hearingPausedText={t('exercise.hearingPaused')}
              continueLabel={t(
                session.index === session.items.length - 1 ? 'exercise.finish' : 'exercise.next',
              )}
              onSelect={setAnswer}
              onCheck={(value) => {
                setSession(answerSession(session, value));
              }}
              onHint={() => {
                setSession(revealHint(session));
              }}
              onSkip={() => {
                setAnswer(null);
                setSession(skipAuralExercises(session));
              }}
              onNext={() => {
                setAnswer(null);
                setSession(nextExercise(session));
              }}
            />
          </>
        ) : summary ? (
          <>
            <View
              ref={question}
              aria-label={t('exercise.complete')}
              {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}
            >
              <AppText variant="title1">{t('exercise.complete')}</AppText>
            </View>
            <Card>
              <View style={styles.types}>
                <AppText variant="title2">
                  {summary.answered === 0
                    ? t('exercise.noAnswers')
                    : t('exercise.summary', {
                        correct: summary.correct,
                        answered: summary.answered,
                      })}
                </AppText>
                <AppText>
                  {t('exercise.independent', { count: summary.independentCorrect })}
                </AppText>
                {summary.assisted > 0 ? (
                  <AppText>{t('exercise.assistedSummary', { count: summary.assisted })}</AppText>
                ) : null}
                {summary.skipped > 0 ? (
                  <AppText>{t('exercise.skippedSummary', { count: summary.skipped })}</AppText>
                ) : null}
              </View>
            </Card>
            <Button
              label={t('exercise.restart')}
              onPress={() => {
                start();
              }}
            />
            <Button
              size="medium"
              variant="ghost"
              label={t('exercise.chooseSet')}
              onPress={() => {
                setSession(null);
                setAnswer(null);
                setConstruction(false);
              }}
            />
          </>
        ) : null}
        {!item ? (
          <Button
            size="medium"
            variant="ghost"
            label={t('exercise.noteInput')}
            onPress={() => {
              router.push('/note-input');
            }}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: LAYOUT.screenPadding, paddingBottom: SPACE.xxxl },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', gap: SPACE.m },
  types: { gap: SPACE.l },
});

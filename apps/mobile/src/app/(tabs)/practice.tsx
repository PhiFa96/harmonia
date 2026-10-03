import type { ExerciseSession } from '@harmonia/exercises';
import {
  answerSession,
  currentItem,
  exerciseDescription,
  exerciseFeedback,
  exerciseHints,
  exercisePrompt,
  hintText,
  nextExercise,
  revealHint,
  sessionSummary,
  skipAuralExercises,
} from '@harmonia/exercises';
import { engineLanguage } from '@harmonia/i18n';
import { ScoreView } from '@harmonia/notation/native';
import { LAYOUT, RADIUS, SPACE } from '@harmonia/ui';
import {
  AppText,
  Button,
  Card,
  FeedbackBanner,
  MusicText,
  ProgressBar,
  useUiTheme,
} from '@harmonia/ui/native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ExerciseChoices } from '@/components/exercise-choices';
import { useExercisePlayback } from '@/components/use-exercise-playback';
import { createPracticeSession } from '@/exercises/practice';
import { useLocale } from '@/i18n';

export default function PracticeScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { colors, reduceMotion } = useUiTheme();
  const [session, setSession] = useState<ExerciseSession | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const run = useRef(0);
  const scroll = useRef<ScrollView>(null);
  const question = useRef<View>(null);
  const feedbackRegion = useRef<View>(null);
  const item = session ? currentItem(session) : undefined;
  const index = session?.index;
  const prompt = item ? exercisePrompt(item, locale) : '';
  const started = session !== null;
  const audio = useExercisePlayback(item);
  const result = session?.result;
  const feedback = item && result ? exerciseFeedback(item, result, locale) : undefined;
  const summary = session ? sessionSummary(session) : undefined;
  const start = () => {
    audio.stop();
    setAnswer(null);
    setSession(createPracticeSession(Date.now() + run.current++));
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
  useFocusEffect(
    useCallback(() => {
      if (result && Platform.OS === 'web')
        (feedbackRegion.current as unknown as HTMLElement | null)
          ?.querySelector<HTMLElement>('[data-testid="exercise-next"]')
          ?.focus({ preventScroll: true });
    }, [result]),
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
            <Button label={t('exercise.start')} onPress={start} />
          </>
        ) : item ? (
          <>
            <AppText variant="small" tone="muted">
              {t('exercise.progress', { current: session.index + 1, total: session.items.length })}
            </AppText>
            <ProgressBar
              value={(session.records.length + session.skipped.length) / session.items.length}
              label={t('exercise.progressLabel')}
              valueText={t('exercise.progress', {
                current: session.index + 1,
                total: session.items.length,
              })}
            />
            {session.skipAural ? (
              <AppText variant="footnote" tone="muted" aria-live="polite">
                {t('exercise.hearingPaused')}
              </AppText>
            ) : null}
            <View
              ref={question}
              testID="exercise-question"
              aria-label={prompt}
              {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}
            >
              <AppText variant="overline" tone="muted">
                {t(`exercise.type_${item.type}`)}
              </AppText>
              <AppText variant="title2">{prompt}</AppText>
            </View>
            {item.type !== 'INTERVAL_IDENTIFY_AURAL' || result || session.hintLevel === 3 ? (
              <Card padding={SPACE.s}>
                <ScrollView horizontal contentContainerStyle={styles.score}>
                  <View accessible role="img" aria-label={exerciseDescription(item, locale)}>
                    <View aria-hidden importantForAccessibility="no-hide-descendants">
                      <ScoreView
                        score={item.score}
                        staffSpace={14}
                        color={colors.text}
                        describeOptions={engineLanguage(locale)}
                        layoutOptions={{ endBarline: 'final' }}
                      />
                    </View>
                  </View>
                </ScrollView>
              </Card>
            ) : (
              <Card>
                <AppText tone="muted">{t('exercise.headphones')}</AppText>
                <Button
                  icon="speaker"
                  label={
                    audio.playing
                      ? t('exercise.stop')
                      : audio.heard
                        ? t('exercise.replay')
                        : t('exercise.play')
                  }
                  onPress={
                    audio.playing
                      ? audio.stop
                      : () => {
                          void audio.play();
                        }
                  }
                  style={styles.audioButton}
                />
              </Card>
            )}
            {item.type === 'INTERVAL_IDENTIFY_AURAL' && !result ? (
              <Button
                size="medium"
                variant="ghost"
                label={t('exercise.noHearing')}
                onPress={() => {
                  audio.stop();
                  setAnswer(null);
                  setSession(skipAuralExercises(session));
                }}
              />
            ) : null}
            {audio.error ? (
              <AppText tone="danger" aria-live="polite">
                {t('exercise.audioError')}
              </AppText>
            ) : null}
            <ExerciseChoices
              item={item}
              answer={answer}
              {...(result ? { result } : {})}
              onSelect={setAnswer}
            />
            {!result ? (
              <>
                {session.hintLevel !== 0 ? (
                  <Card>
                    <AppText variant="title3">{t('exercise.hintHeading')}</AppText>
                    <MusicText aria-live="polite">
                      {hintText(item, exerciseHints(item, session.hintLevel), locale)}
                    </MusicText>
                  </Card>
                ) : null}
                <Button
                  size="medium"
                  variant="ghost"
                  label={
                    session.hintLevel >= 2
                      ? t('exercise.solution')
                      : t('exercise.hint', { level: session.hintLevel + 1 })
                  }
                  disabled={session.hintLevel === 3}
                  onPress={() => {
                    setSession(revealHint(session));
                  }}
                />
                <Button
                  label={t('practice.check')}
                  disabled={
                    answer === null ||
                    (item.type === 'INTERVAL_IDENTIFY_AURAL' &&
                      !audio.heard &&
                      session.hintLevel < 3)
                  }
                  onPress={() => {
                    if (answer === null) return;
                    audio.stop();
                    setSession(answerSession(session, answer));
                    requestAnimationFrame(() => {
                      scroll.current?.scrollToEnd({ animated: !reduceMotion });
                    });
                  }}
                />
              </>
            ) : feedback ? (
              <View ref={feedbackRegion} style={styles.feedbackActions}>
                <FeedbackBanner
                  kind={result.correct ? 'correct' : 'wrong'}
                  title={feedback.title}
                  message={feedback.message}
                  onReplay={() => {
                    void audio.play();
                  }}
                  replayLabel={t('exercise.replay')}
                  style={styles.feedback}
                >
                  {session.hintLevel > 0 ? (
                    <AppText variant="footnote">{t('exercise.assisted')}</AppText>
                  ) : null}
                </FeedbackBanner>
                <Button
                  testID="exercise-next"
                  label={
                    session.index === session.items.length - 1
                      ? t('exercise.finish')
                      : t('exercise.next')
                  }
                  onPress={() => {
                    audio.stop();
                    setAnswer(null);
                    setSession(nextExercise(session));
                  }}
                />
              </View>
            ) : null}
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
            <Button label={t('exercise.restart')} onPress={start} />
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
  score: { flexGrow: 0, justifyContent: 'center', minWidth: '100%' },
  audioButton: { marginTop: SPACE.m, marginBottom: SPACE.s },
  feedback: { borderRadius: RADIUS.card },
  feedbackActions: { gap: SPACE.s },
});

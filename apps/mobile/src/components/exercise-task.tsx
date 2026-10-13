import type { ExerciseItem, ExerciseSession } from '@harmonia/exercises';
import {
  exerciseDescription,
  exerciseFeedback,
  exerciseHints,
  exercisePrompt,
  evaluateExercise,
  hintText,
  isKeySignatureItem,
  isAuralExercise,
  isPitchInput,
  itemVariantKey,
  isKnowledgeItem,
} from '@harmonia/exercises';
import { engineLanguage } from '@harmonia/i18n';
import { layoutScore } from '@harmonia/notation';
import { ScoreView } from '@harmonia/notation/native';
import { RADIUS, SPACE } from '@harmonia/ui';
import {
  AppText,
  Button,
  Card,
  FeedbackBanner,
  MusicText,
  ProgressBar,
  useUiTheme,
} from '@harmonia/ui/native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useLocale } from '@/i18n';
import { ExerciseChoices } from './exercise-choices';
import { ChordAnswerInput } from './chord-answer-input';
import { PitchAnswerInput } from './pitch-answer-input';
import { ScaleAnswerInput } from './scale-answer-input';
import { SignatureAnswerInput } from './signature-answer-input';
import { RhythmAnswerInput } from './rhythm-answer-input';
import { PulseExample } from './pulse-example';
import { MatchAnswerInput, OrderAnswerInput } from './knowledge-answer-input';
import { useExercisePlayback } from './use-exercise-playback';

interface Props {
  readonly session: ExerciseSession;
  readonly item: ExerciseItem;
  readonly answer: string | null;
  readonly question: RefObject<View | null>;
  readonly scroll: RefObject<ScrollView | null>;
  readonly progressText: string;
  readonly progressLabel: string;
  readonly hearingPausedText: string;
  readonly continueLabel: string;
  readonly onSelect: (answer: string | null) => void;
  readonly onCheck: (answer: string) => void;
  readonly onHint: () => void;
  readonly onSkip: () => void;
  readonly onNext: () => void;
}
export function ExerciseTask({
  session,
  item,
  answer,
  question,
  scroll,
  progressText,
  progressLabel,
  hearingPausedText,
  continueLabel,
  onSelect,
  onCheck,
  onHint,
  onSkip,
  onNext,
}: Props) {
  const { t } = useTranslation();
  const locale = useLocale();
  const { colors, reduceMotion } = useUiTheme();
  const audio = useExercisePlayback(item);
  const result = session.result;
  const feedback = result ? exerciseFeedback(item, result, locale) : undefined;
  const prompt = exercisePrompt(item, locale);
  const feedbackRegion = useRef<View>(null);
  const [scoreWidth, setScoreWidth] = useState(0);
  const rhythmWidth = useMemo(
    () =>
      item.type === 'RHYTHM_TAP' ? layoutScore(item.score, { endBarline: 'final' }).width + 2 : 0,
    [item],
  );
  // Ein vollständiger Rhythmustakt muss beim Mittippen ohne seitliches Scrollen lesbar sein.
  const staffSpace =
    rhythmWidth && scoreWidth
      ? Math.min(14, Math.max(1, scoreWidth - 2 * SPACE.s - 2) / rhythmWidth)
      : 14;
  useFocusEffect(
    useCallback(() => {
      if (result && Platform.OS === 'web')
        (feedbackRegion.current as unknown as HTMLElement | null)
          ?.querySelector<HTMLElement>('[data-testid="exercise-next"]')
          ?.focus({ preventScroll: true });
    }, [result]),
  );
  return (
    <>
      <AppText variant="small" tone="muted">
        {progressText}
      </AppText>
      <ProgressBar
        value={(session.records.length + session.skipped.length) / session.items.length}
        label={progressLabel}
        valueText={progressText}
      />
      {session.skipAural ? (
        <AppText variant="footnote" tone="muted" aria-live="polite">
          {hearingPausedText}
        </AppText>
      ) : null}
      <View
        ref={question}
        testID="exercise-question"
        aria-label={prompt}
        {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}
      >
        <AppText variant="overline" tone="muted">
          {t(
            item.type === 'RHYTHM_TAP' && item.presentation === 'pulse'
              ? 'exercise.type_PULSE_TAP'
              : `exercise.type_${item.type}`,
          )}
        </AppText>
        <MusicText variant="title2">{prompt}</MusicText>
      </View>
      {item.type === 'RHYTHM_TAP' && item.presentation === 'pulse' ? (
        <Card>
          <PulseExample item={item} />
        </Card>
      ) : isKnowledgeItem(item) ||
        (item.type === 'KEY_FIND' && item.presentation === 'name') ? null : [
          'NOTE_PLACE',
          'INTERVAL_BUILD',
          'SCALE_BUILD',
          'KEYSIG_BUILD',
          'CHORD_BUILD',
        ].includes(item.type) ? null : item.type === 'RHYTHM_TAP' ||
        !isAuralExercise(item) ||
        result ||
        session.hintLevel === 3 ? (
        <Card
          padding={SPACE.s}
          onLayout={(event) => {
            if (item.type === 'RHYTHM_TAP') setScoreWidth(event.nativeEvent.layout.width);
          }}
        >
          <ScrollView horizontal contentContainerStyle={styles.score}>
            <View accessible role="img" aria-label={exerciseDescription(item, locale)}>
              <View aria-hidden importantForAccessibility="no-hide-descendants">
                <ScoreView
                  score={item.score}
                  staffSpace={staffSpace}
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
      {isAuralExercise(item) && !result ? (
        <Button
          size="medium"
          variant="ghost"
          label={t('exercise.noHearing')}
          onPress={() => {
            audio.stop();
            onSkip();
          }}
        />
      ) : null}
      {audio.error ? (
        <AppText tone="danger" aria-live="polite">
          {t('exercise.audioError')}
        </AppText>
      ) : null}
      {item.type === 'MATCH' ? (
        <MatchAnswerInput
          key={`${String(session.index)}:${itemVariantKey(item)}`}
          item={item}
          answer={answer}
          {...(result ? { result } : {})}
          onSelect={onSelect}
        />
      ) : item.type === 'ORDER' ? (
        <OrderAnswerInput
          key={`${String(session.index)}:${itemVariantKey(item)}`}
          item={item}
          answer={answer}
          {...(result ? { result } : {})}
          onSelect={onSelect}
        />
      ) : item.type === 'RHYTHM_TAP' ? (
        <RhythmAnswerInput
          key={`${String(session.index)}:${itemVariantKey(item)}`}
          item={item}
          answer={answer}
          {...(result ? { result } : {})}
          showSolution={!!result || session.hintLevel === 3}
          onSelect={onSelect}
          beforeStart={audio.stop}
          onPreview={() => {
            void audio.play();
          }}
        />
      ) : item.type === 'CHORD_BUILD' ? (
        <ChordAnswerInput
          key={`${String(session.index)}:${itemVariantKey(item)}`}
          item={item}
          answer={answer}
          {...(result ? { result } : {})}
          showSolution={!!result || session.hintLevel === 3}
          onSelect={onSelect}
        />
      ) : item.type === 'SCALE_BUILD' ? (
        <ScaleAnswerInput
          key={`${String(session.index)}:${itemVariantKey(item)}`}
          item={item}
          answer={answer}
          {...(result ? { result } : {})}
          showSolution={!!result || session.hintLevel === 3}
          onSelect={onSelect}
        />
      ) : item.type === 'KEYSIG_BUILD' ? (
        <SignatureAnswerInput
          key={`${String(session.index)}:${itemVariantKey(item)}`}
          item={item}
          answer={answer}
          {...(result ? { result } : {})}
          showSolution={!!result || session.hintLevel === 3}
          onSelect={onSelect}
        />
      ) : isPitchInput(item) ? (
        <PitchAnswerInput
          key={`${String(session.index)}:${itemVariantKey(item)}`}
          item={item}
          answer={answer}
          {...(result ? { result } : {})}
          showSolution={!!result || session.hintLevel === 3}
          onSelect={onSelect}
        />
      ) : (
        <ExerciseChoices
          item={item}
          answer={answer}
          {...(result ? { result } : {})}
          onSelect={onSelect}
        />
      )}
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
              onHint();
            }}
          />
          <Button
            label={t('practice.check')}
            disabled={
              answer === null ||
              !evaluateExercise(item, answer).validAnswer ||
              (item.type !== 'RHYTHM_TAP' &&
                isAuralExercise(item) &&
                !audio.heard &&
                session.hintLevel < 3)
            }
            onPress={() => {
              if (
                answer === null ||
                !evaluateExercise(item, answer).validAnswer ||
                (item.type !== 'RHYTHM_TAP' &&
                  isAuralExercise(item) &&
                  !audio.heard &&
                  session.hintLevel < 3)
              )
                return;
              audio.stop();
              onCheck(answer);
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
            {...(!isKnowledgeItem(item) && !isKeySignatureItem(item)
              ? {
                  onReplay: () => {
                    void audio.play();
                  },
                  replayLabel: t('exercise.replay'),
                }
              : {})}
            style={styles.feedback}
          >
            {session.hintLevel > 0 ? (
              <AppText variant="footnote">{t('exercise.assisted')}</AppText>
            ) : null}
          </FeedbackBanner>
          <Button
            testID="exercise-next"
            label={continueLabel}
            onPress={() => {
              audio.stop();
              onNext();
            }}
          />
        </View>
      ) : null}
    </>
  );
}
const styles = StyleSheet.create({
  score: { flexGrow: 0, justifyContent: 'center', minWidth: '100%' },
  audioButton: { marginTop: SPACE.m, marginBottom: SPACE.s },
  feedback: { borderRadius: RADIUS.card },
  feedbackActions: { gap: SPACE.s },
});

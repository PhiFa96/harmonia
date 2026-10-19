import type { ReportSource } from '@harmonia/content';
import { openReport } from '@/state/reports';
import { ContextQuestion } from './context-question';
import type { ExerciseItem, ExerciseSession } from '@harmonia/exercises';
import {
  feedbackMedia,
  exerciseDescription,
  exerciseFeedback,
  exerciseHints,
  exercisePrompt,
  evaluateExercise,
  hintText,
  isKeySignatureItem,
  isAuralExercise,
  isPitchInput,
  isVoiceItem,
  itemVariantKey,
  isKnowledgeItem,
  isIntervalReadingItem,
  intervalReadingKeyboardRange,
} from '@harmonia/exercises';
import { engineLanguage } from '@harmonia/i18n';
import { layoutScore, describeScore } from '@harmonia/notation';
import { ScoreView, GrandStaffView } from '@harmonia/notation/native';
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
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useMusicLocale } from '@/i18n';
import { useSettings } from '@/state/settings';
import { ExerciseChoices } from './exercise-choices';
import { ChordAnswerInput } from './chord-answer-input';
import { PitchAnswerInput } from './pitch-answer-input';
import { MicrophoneAnswerInput } from './microphone-answer-input';
import { ScaleAnswerInput } from './scale-answer-input';
import { SignatureAnswerInput } from './signature-answer-input';
import { RhythmAnswerInput } from './rhythm-answer-input';
import { PulseExample } from './pulse-example';
import { DurationQuestion } from './duration-question';
import { KeyboardExample } from './keyboard-example';
import { MatchAnswerInput, OrderAnswerInput } from './knowledge-answer-input';
import { useExercisePlayback } from './use-exercise-playback';
import { openTaskTutor } from '@/tutor/state';
import { taskTutorScore } from '@/tutor/context';

interface Props {
  readonly hintsAllowed?: boolean;
  readonly interactionDisabled?: boolean;
  readonly session: ExerciseSession;
  readonly reportSource?: ReportSource;
  readonly onReportOpen?: () => void;
  readonly item: ExerciseItem;
  readonly answer: string | null;
  readonly question: RefObject<View | null>;
  readonly scroll: RefObject<ScrollView | null>;
  readonly progressText: string;
  readonly progressLabel: string;
  readonly progressValue?: number;
  readonly hearingPausedText: string;
  readonly continueLabel: string;
  readonly onSelect: (answer: string | null) => void;
  readonly onCheck: (answer: string) => void;
  readonly onHint: () => void;
  readonly onSkip: () => void;
  readonly onSkipVoice?: () => void;
  readonly onNext: () => void;
}
export function ExerciseTask({
  hintsAllowed = true,
  interactionDisabled = false,
  session,
  reportSource,
  onReportOpen,
  item,
  answer,
  question,
  scroll,
  progressText,
  progressLabel,
  progressValue,
  hearingPausedText,
  continueLabel,
  onSelect,
  onCheck,
  onHint,
  onSkip,
  onSkipVoice,
  onNext,
}: Props) {
  const { t } = useTranslation();
  const locale = useMusicLocale();
  const music = useSettings();
  const { colors, reduceMotion } = useUiTheme();
  const media = useMemo(() => feedbackMedia(item), [item]);
  const audio = useExercisePlayback(media.audio ?? item);
  const result = session.result;
  const feedback = result ? exerciseFeedback(item, result, locale) : undefined;
  const prompt = exercisePrompt(item, locale);
  const feedbackRegion = useRef<View>(null);
  const [scoreWidth, setScoreWidth] = useState(0);
  const semitoneRange = useMemo(
    () =>
      isIntervalReadingItem(item) && item.question === 'semitones'
        ? intervalReadingKeyboardRange(item)
        : undefined,
    [item],
  );
  const pickup = item.type === 'METER_IDENTIFY' && item.presentation === 'pickup';
  const rhythmWidth = useMemo(
    () =>
      item.type === 'RHYTHM_TAP' ? layoutScore(item.score, { endBarline: 'final' }).width + 2 : 0,
    [item],
  );
  const pickupWidth = useMemo(
    () => (pickup ? (layoutScore(item.score, { endBarline: 'final' }).width + 2) * 14 : 0),
    [item, pickup],
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
        value={
          progressValue ?? (session.records.length + session.skipped.length) / session.items.length
        }
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
        {!music.sound ? (
          <View>
            <AppText>{t('profile.soundDisabled')}</AppText>
            <Button
              label={t('profile.enableSound')}
              onPress={() => {
                music.setSound(true);
              }}
            />
          </View>
        ) : null}
        <AppText variant="overline" tone="muted">
          {t(
            item.type === 'RHYTHM_TAP' && item.presentation === 'pulse'
              ? 'exercise.type_PULSE_TAP'
              : item.type === 'METER_IDENTIFY' && item.presentation === 'pickup'
                ? 'exercise.type_PICKUP_IDENTIFY'
                : isIntervalReadingItem(item)
                  ? `exercise.type_interval_${item.question}`
                  : `exercise.type_${item.type}`,
          )}
        </AppText>
        <MusicText variant="title2">{prompt}</MusicText>
      </View>
      {item.type === 'CONTEXT_CHOICE' ? (
        <Card>
          <ContextQuestion item={item} />
        </Card>
      ) : item.type === 'KNOWLEDGE_MC' && item.presentation ? (
        <Card>
          <DurationQuestion item={item} />
        </Card>
      ) : item.type === 'RHYTHM_TAP' && item.presentation === 'pulse' ? (
        <Card>
          <PulseExample item={item} />
        </Card>
      ) : isKnowledgeItem(item) ||
        (item.type === 'KEY_FIND' && item.presentation === 'name') ||
        (item.type === 'NOTE_NAME' && item.presentation === 'octave-name') ? null : [
          'NOTE_PLACE',
          'INTERVAL_BUILD',
          'SCALE_BUILD',
          'KEYSIG_BUILD',
          'CHORD_BUILD',
        ].includes(item.type) ? null : item.type !== 'LISTENING_CHOICE' &&
        (item.type === 'RHYTHM_TAP' ||
          !isAuralExercise(item) ||
          item.type === 'SING_INTERVAL' ||
          item.type === 'SIGHT_SING' ||
          result ||
          session.hintLevel === 3) ? (
        <Card
          padding={SPACE.s}
          onLayout={(event) => {
            setScoreWidth(event.nativeEvent.layout.width);
          }}
        >
          <ScrollView horizontal contentContainerStyle={styles.score}>
            <View accessible role="img" aria-label={exerciseDescription(item, locale)}>
              <View aria-hidden importantForAccessibility="no-hide-descendants">
                {item.type === 'KEY_FIND' && item.presentation === 'grand-staff' ? (
                  <GrandStaffView score={item.score} staffSpace={staffSpace} color={colors.text} />
                ) : (
                  <ScoreView
                    score={item.score}
                    staffSpace={staffSpace}
                    color={colors.text}
                    describeOptions={engineLanguage(locale)}
                    layoutOptions={{ endBarline: 'final' }}
                  />
                )}
              </View>
            </View>
          </ScrollView>
          {semitoneRange ? (
            <View testID="interval-semitone-keyboard" style={{ marginTop: SPACE.m }}>
              <KeyboardExample score={item.score} range={semitoneRange} />
            </View>
          ) : null}
        </Card>
      ) : isVoiceItem(item) ? null : (
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
      {item.type === 'LISTENING_CHOICE' && item.promptScore ? (
        <Card>
          <AppText>{t('exercise.listeningOutline')}</AppText>
          <ScrollView horizontal>
            <ScoreView
              score={item.promptScore}
              staffSpace={14}
              color={colors.text}
              describeOptions={engineLanguage(locale)}
              layoutOptions={{ endBarline: 'none' }}
            />
          </ScrollView>
        </Card>
      ) : null}
      {item.type === 'LISTENING_CHOICE' &&
      (item.candidates || result || session.hintLevel === 3) ? (
        <View style={{ gap: SPACE.s }} testID="listening-scores">
          {(item.candidates ?? item.clips).map((score, index) => (
            <Card
              key={index}
              padding={SPACE.s}
              onLayout={(event) => {
                setScoreWidth(event.nativeEvent.layout.width);
              }}
            >
              <AppText variant="small">
                {t(
                  item.candidates
                    ? item.question === 'rhythm-completion'
                      ? 'exercise.listeningCell'
                      : 'exercise.listeningOption'
                    : 'exercise.listeningClip',
                  {
                    count: index + 1,
                  },
                )}
              </AppText>
              <ScrollView horizontal>
                <View
                  accessible
                  role="img"
                  aria-label={describeScore(score, engineLanguage(locale))
                    .map((e) => e.text)
                    .join('; ')}
                >
                  <View aria-hidden importantForAccessibility="no-hide-descendants">
                    <ScoreView
                      score={score}
                      staffSpace={
                        scoreWidth
                          ? Math.min(
                              14,
                              Math.max(1, scoreWidth - 2 * SPACE.s - 2) /
                                (layoutScore(score, { endBarline: 'final' }).width + 2),
                            )
                          : 14
                      }
                      color={colors.text}
                      describeOptions={engineLanguage(locale)}
                      layoutOptions={
                        item.question === 'rhythm-completion'
                          ? { endBarline: 'none', showTimeSignature: false }
                          : { endBarline: 'final' }
                      }
                    />
                  </View>
                </View>
              </ScrollView>
            </Card>
          ))}
        </View>
      ) : null}
      {pickup && scoreWidth > 0 && pickupWidth > scoreWidth - 2 * SPACE.s - 2 ? (
        <AppText variant="footnote" tone="muted">
          {t('exercise.pickupScroll')}
        </AppText>
      ) : null}
      {isAuralExercise(item) && !isVoiceItem(item) && !result ? (
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
      {isVoiceItem(item) && !result && onSkipVoice ? (
        <Button
          variant="ghost"
          label={t('voice.skip')}
          onPress={() => {
            audio.stop();
            onSkipVoice();
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
          practiceAllowed={hintsAllowed}
          onPracticeStart={() => {
            if (session.hintLevel === 0) onHint();
          }}
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
      ) : isVoiceItem(item) ? (
        <MicrophoneAnswerInput
          key={`${String(session.index)}:${itemVariantKey(item)}`}
          item={item}
          answer={answer}
          {...(result ? { result } : {})}
          disabled={interactionDisabled}
          playing={audio.playing}
          heard={audio.heard}
          onSelect={onSelect}
          onBeforeCapture={audio.stop}
          onPreview={async () => {
            if (audio.playing) {
              audio.stop();
              return;
            }
            if (item.type === 'SIGHT_SING' && session.hintLevel === 0 && music.sound) onHint();
            await audio.play();
          }}
        />
      ) : (
        <ExerciseChoices
          item={item}
          answer={answer}
          disabled={interactionDisabled}
          {...(result ? { result } : {})}
          onSelect={onSelect}
        />
      )}
      {(result || session.hintLevel === 3) && media.score ? (
        <Card>
          <AppText variant="title3">{t('exercise.solutionImage')}</AppText>
          <ScrollView horizontal>
            <ScoreView
              score={media.score}
              staffSpace={14}
              color={colors.text}
              describeOptions={engineLanguage(locale)}
              layoutOptions={{ endBarline: 'final' }}
            />
          </ScrollView>
        </Card>
      ) : null}
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
          {hintsAllowed ? (
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
          ) : null}
          {reportSource && session.hintLevel > 0 ? (
            <Button
              variant="ghost"
              size="medium"
              icon="sparkle"
              label={
                session.hintLevel === 3
                  ? t('tutor.aiSolution')
                  : t('tutor.aiHint', { level: session.hintLevel })
              }
              onPress={() => {
                audio.stop();
                onReportOpen?.();
                openTaskTutor(
                  {
                    locale: locale.locale,
                    noteNaming: locale.noteNaming,
                    harmonySystem: music.harmonySystem,
                    mode: session.hintLevel === 3 ? 'solution' : 'hint',
                    hintLevel:
                      session.hintLevel === 1 || session.hintLevel === 2 ? session.hintLevel : null,
                    context: { source: reportSource, answer, checked: false },
                  },
                  prompt,
                  taskTutorScore(item, session.hintLevel === 3 ? 'solution' : 'hint'),
                );
                router.push('/tutor-task');
              }}
            />
          ) : null}
          <Button
            label={t('practice.check')}
            disabled={
              interactionDisabled ||
              answer === null ||
              !evaluateExercise(item, answer).validAnswer ||
              (item.type !== 'RHYTHM_TAP' &&
                isAuralExercise(item) &&
                !audio.heard &&
                session.hintLevel < 3)
            }
            onPress={() => {
              if (
                interactionDisabled ||
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
            {...(!isKnowledgeItem(item) &&
            (!isKeySignatureItem(item) || !!media.audio) &&
            (item.type !== 'CONTEXT_CHOICE' || !!media.audio)
              ? {
                  onReplay: () => {
                    void audio.play();
                  },
                  replayLabel: t(
                    media.label === 'source'
                      ? 'exercise.sourceReplay'
                      : media.label === 'key'
                        ? 'exercise.keyReplay'
                        : 'exercise.replay',
                  ),
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
          {reportSource ? (
            <Button
              variant="ghost"
              size="medium"
              icon="sparkle"
              label={t('tutor.why')}
              onPress={() => {
                audio.stop();
                onReportOpen?.();
                openTaskTutor(
                  {
                    locale: locale.locale,
                    noteNaming: locale.noteNaming,
                    harmonySystem: music.harmonySystem,
                    mode: 'explain',
                    hintLevel: null,
                    context: { source: reportSource, answer: result.answer, checked: true },
                  },
                  prompt,
                  taskTutorScore(item, 'explain'),
                );
                router.push('/tutor-task');
              }}
            />
          ) : null}
        </View>
      ) : null}
      {reportSource ? (
        <Button
          size="medium"
          variant="ghost"
          label={t('report.title')}
          onPress={() => {
            audio.stop();
            onReportOpen?.();
            openReport(
              reportSource,
              locale.locale,
              prompt,
              result?.answer ?? answer,
              session.hintLevel,
              !!result,
            );
            router.push('/report');
          }}
        />
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

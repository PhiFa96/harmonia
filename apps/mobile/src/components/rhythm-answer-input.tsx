import type { Evaluation, RhythmItem } from '@harmonia/exercises';
import {
  assessRhythm,
  rhythmAnswerTaps,
  rhythmBeatCount,
  rhythmTolerance,
} from '@harmonia/exercises';
import { RADIUS, SPACE, TOUCH } from '@harmonia/ui';
import { AppText, Button, Card, Icon, useUiTheme } from '@harmonia/ui/native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import type { RhythmMetronome } from '@/exercises/play-rhythm';
import { OptionSheet } from './option-sheet';
import { useRhythmRecording } from './use-rhythm-recording';

interface Props {
  readonly item: RhythmItem;
  readonly answer: string | null;
  readonly result?: Evaluation;
  readonly showSolution: boolean;
  readonly onSelect: (answer: string | null) => void;
  readonly beforeStart: () => void;
  readonly onPreview: () => void;
  readonly practiceAllowed: boolean;
  readonly onPracticeStart: () => void;
}
export function RhythmAnswerInput({
  item,
  answer,
  result,
  showSolution,
  onSelect,
  beforeStart,
  onPreview,
  practiceAllowed,
  onPracticeStart,
}: Props) {
  const { t } = useTranslation(),
    { colors } = useUiTheme(),
    pad = useRef<View>(null);
  const [mode, setMode] = useState<'practice' | 'test'>('test'),
    [tempo, setTempo] = useState(item.bpm),
    [loop, setLoop] = useState(true),
    [metronome, setMetronome] = useState<RhythmMetronome>('through'),
    [metronomeSheet, setMetronomeSheet] = useState(false);
  const recording = useRhythmRecording(
      item,
      !!result,
      onSelect,
      { mode, bpm: tempo, loop, metronome },
      onPracticeStart,
    ),
    current = useRef(recording);
  current.current = recording;
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const element = pad.current as unknown as HTMLElement | null;
    if (!element) return;
    const pointer = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return;
      event.preventDefault();
      current.current.tap();
    };
    const key = (event: KeyboardEvent) => {
      if (![' ', 'Enter'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey)
        return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) current.current.tap();
    };
    const click = (event: MouseEvent) => {
      if (event.detail === 0) current.current.tap();
    };
    element.addEventListener('pointerdown', pointer);
    element.addEventListener('keydown', key, true);
    element.addEventListener('click', click);
    return () => {
      element.removeEventListener('pointerdown', pointer);
      element.removeEventListener('keydown', key, true);
      element.removeEventListener('click', click);
    };
  }, []);
  const running = ['preparing', 'count-in', 'recording'].includes(recording.progress.phase),
    enabled = !result && recording.progress.phase === 'recording';
  const activeItem = mode === 'practice' ? { ...item, bpm: tempo } : item;
  const assessment = result
    ? assessRhythm(item, rhythmAnswerTaps(item, answer ?? 'taps:') ?? [])
    : undefined;
  const phaseKey = {
    idle: 'rhythmReady',
    preparing: 'rhythmPreparing',
    'count-in': 'rhythmCountIn',
    recording: 'rhythmRecording',
    complete: 'rhythmFinished',
  } as const;
  const tapHint = t(
    item.presentation === 'pulse' ? 'exercise.pulseTapHint' : 'exercise.rhythmTapHint',
  );
  return (
    <View style={styles.container}>
      {!result ? (
        <>
          {practiceAllowed ? (
            <View
              style={styles.modes}
              role="group"
              aria-label={t('exercise.rhythmMode')}
              testID="rhythm-modes"
            >
              {(['practice', 'test'] as const).map((value) => (
                <Button
                  key={value}
                  testID={`rhythm-mode-${value}`}
                  size="medium"
                  variant={mode === value ? 'primary' : 'secondary'}
                  selected={mode === value}
                  label={t(`exercise.rhythmMode_${value}`)}
                  onPress={() => {
                    if (mode === value) return;
                    recording.reset();
                    setMode(value);
                  }}
                />
              ))}
            </View>
          ) : null}
          {mode === 'practice' ? (
            <Card>
              <View style={styles.container}>
                <AppText variant="small" tone="muted">
                  {t('exercise.rhythmPracticeIntro')}
                </AppText>
                <View style={styles.modes}>
                  <Button
                    size="medium"
                    variant="secondary"
                    label={t('exercise.rhythmSlower')}
                    disabled={running || tempo <= 40}
                    onPress={() => {
                      recording.reset();
                      setTempo(Math.max(40, tempo - 5));
                    }}
                  />
                  <AppText testID="rhythm-practice-tempo" aria-live="polite">
                    {t('exercise.rhythmPracticeTempo', {
                      bpm: tempo,
                      percent: Math.round((tempo / item.bpm) * 100),
                    })}
                  </AppText>
                  <Button
                    size="medium"
                    variant="secondary"
                    label={t('exercise.rhythmFaster')}
                    disabled={running || tempo >= item.bpm}
                    onPress={() => {
                      recording.reset();
                      setTempo(Math.min(item.bpm, tempo + 5));
                    }}
                  />
                </View>
                <View style={styles.modes}>
                  <Button
                    size="medium"
                    variant={loop ? 'primary' : 'secondary'}
                    selected={loop}
                    label={t(loop ? 'exercise.rhythmLoopOn' : 'exercise.rhythmLoopOff')}
                    disabled={running}
                    onPress={() => {
                      recording.reset();
                      setLoop(!loop);
                    }}
                  />
                  <Button
                    size="medium"
                    variant="secondary"
                    label={t('exercise.rhythmMetronome', {
                      mode: t(`exercise.rhythmMetronome_${metronome}`),
                    })}
                    disabled={running}
                    onPress={() => {
                      setMetronomeSheet(true);
                    }}
                  />
                </View>
                {recording.practiceResult ? (
                  <AppText testID="rhythm-practice-feedback" aria-live="polite">
                    {t('exercise.rhythmPracticeFeedback', {
                      ...recording.practiceResult,
                      count: recording.practiceResult.extras,
                    })}
                  </AppText>
                ) : null}
              </View>
            </Card>
          ) : null}
          <AppText testID="rhythm-status" aria-live="polite">
            {t(
              `exercise.${
                mode === 'practice' && recording.progress.phase === 'complete'
                  ? 'rhythmPracticeFinished'
                  : phaseKey[recording.progress.phase]
              }`,
              {
                current: recording.progress.current,
                count: rhythmBeatCount(item),
              },
            )}
          </AppText>
          <Button
            label={t(
              mode === 'practice'
                ? 'exercise.rhythmPracticeBegin'
                : recording.progress.phase === 'complete'
                  ? 'exercise.rhythmRetry'
                  : 'exercise.rhythmBegin',
            )}
            disabled={running}
            onPress={() => {
              beforeStart();
              void recording.start();
            }}
          />
        </>
      ) : null}
      <Pressable
        ref={pad}
        role="button"
        aria-label={t('exercise.rhythmTap')}
        accessibilityHint={tapHint}
        accessibilityActions={[{ name: 'activate', label: t('exercise.rhythmTap') }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'activate') recording.tap();
        }}
        aria-disabled={!enabled}
        disabled={!enabled}
        testID="rhythm-tap-pad"
        {...(Platform.OS === 'web' ? { tabIndex: enabled ? 0 : -1 } : { onPressIn: recording.tap })}
        style={[
          styles.pad,
          {
            backgroundColor: enabled ? colors.primarySoft : colors.surface,
            borderColor: enabled ? colors.primary : colors.border,
          },
        ]}
      >
        <Icon name="metronome" size={32} color={enabled ? colors.primaryText : colors.textMuted} />
        <AppText variant="title2">{t('exercise.rhythmTap')}</AppText>
      </Pressable>
      <AppText variant="small" tone="muted">
        {tapHint}
      </AppText>
      <AppText aria-live="polite">
        {t('exercise.rhythmTapCount', { count: recording.taps.length })}
      </AppText>
      <AppText variant="small" tone="muted">
        {t(item.presentation === 'pulse' ? 'exercise.pulseWindow' : 'exercise.rhythmWindow', {
          tolerance: rhythmTolerance(activeItem),
        })}
      </AppText>
      {running ? (
        <Button
          variant="ghost"
          label={t(mode === 'practice' ? 'exercise.rhythmPracticeStop' : 'exercise.rhythmCancel')}
          onPress={recording.cancel}
        />
      ) : null}
      {recording.error ? (
        <AppText tone="danger" aria-live="polite">
          {t('exercise.audioError')}
        </AppText>
      ) : null}
      {recording.progress.phase === 'complete' && mode === 'test' ? (
        <AppText variant="footnote" tone="muted">
          {t('exercise.rhythmLatency', { latency: recording.latency })}
        </AppText>
      ) : null}
      {showSolution ? (
        <Button
          variant="secondary"
          label={t('exercise.rhythmPreview')}
          onPress={() => {
            recording.cancel();
            onPreview();
          }}
        />
      ) : null}
      {assessment ? (
        <Card>
          {assessment.targets.map((target, index) => (
            <View key={index} style={styles.target}>
              <Icon
                name={target.tapMs === undefined ? 'close' : 'check'}
                size={20}
                color={target.tapMs === undefined ? colors.danger : colors.success}
              />
              <View style={styles.targetText}>
                <AppText>
                  {t(
                    item.presentation === 'pulse'
                      ? 'exercise.pulseTarget'
                      : 'exercise.rhythmTarget',
                    { index: index + 1, time: target.expectedMs },
                  )}
                </AppText>
                <AppText variant="small">
                  {target.offsetMs === undefined
                    ? t('exercise.rhythmMiss')
                    : t('exercise.rhythmHit', { offset: target.offsetMs })}
                </AppText>
              </View>
            </View>
          ))}
          {assessment.extras.length ? (
            <AppText>{t('exercise.rhythmExtras', { times: assessment.extras.join(', ') })}</AppText>
          ) : null}
        </Card>
      ) : null}
      <OptionSheet
        visible={metronomeSheet}
        onClose={() => {
          setMetronomeSheet(false);
        }}
        title={t('exercise.rhythmMetronomeTitle')}
        selected={metronome}
        options={(['off', 'count-in', 'through'] as const).map((value) => ({
          value,
          label: t(`exercise.rhythmMetronome_${value}`),
        }))}
        onSelect={(value) => {
          recording.reset();
          setMetronome(value);
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: SPACE.m },
  modes: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.s },
  pad: {
    minHeight: TOUCH.buttonLarge * 2,
    gap: SPACE.s,
    borderRadius: RADIUS.card,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE.l,
  },
  target: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s, marginBottom: SPACE.s },
  targetText: { flexShrink: 1 },
});

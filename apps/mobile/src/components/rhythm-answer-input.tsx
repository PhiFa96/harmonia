import type { Evaluation, RhythmItem } from '@harmonia/exercises';
import {
  assessRhythm,
  rhythmAnswerTaps,
  rhythmBeatCount,
  rhythmTolerance,
} from '@harmonia/exercises';
import { RADIUS, SPACE, TOUCH } from '@harmonia/ui';
import { AppText, Button, Card, Icon, useUiTheme } from '@harmonia/ui/native';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRhythmRecording } from './use-rhythm-recording';

interface Props {
  readonly item: RhythmItem;
  readonly answer: string | null;
  readonly result?: Evaluation;
  readonly showSolution: boolean;
  readonly onSelect: (answer: string | null) => void;
  readonly beforeStart: () => void;
  readonly onPreview: () => void;
}
export function RhythmAnswerInput({
  item,
  answer,
  result,
  showSolution,
  onSelect,
  beforeStart,
  onPreview,
}: Props) {
  const { t } = useTranslation(),
    { colors } = useUiTheme(),
    pad = useRef<View>(null);
  const recording = useRhythmRecording(item, !!result, onSelect),
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
  return (
    <View style={styles.container}>
      {!result ? (
        <>
          <AppText testID="rhythm-status" aria-live="polite">
            {t(`exercise.${phaseKey[recording.progress.phase]}`, {
              current: recording.progress.current,
              count: rhythmBeatCount(item),
            })}
          </AppText>
          <Button
            label={t(
              recording.progress.phase === 'complete'
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
        accessibilityHint={t('exercise.rhythmTapHint')}
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
        {t('exercise.rhythmTapHint')}
      </AppText>
      <AppText aria-live="polite">
        {t('exercise.rhythmTapCount', { count: recording.taps.length })}
      </AppText>
      <AppText variant="small" tone="muted">
        {t('exercise.rhythmWindow', { tolerance: rhythmTolerance(item) })}
      </AppText>
      {running ? (
        <Button variant="ghost" label={t('exercise.rhythmCancel')} onPress={recording.cancel} />
      ) : null}
      {recording.error ? (
        <AppText tone="danger" aria-live="polite">
          {t('exercise.audioError')}
        </AppText>
      ) : null}
      {recording.progress.phase === 'complete' ? (
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
                  {t('exercise.rhythmTarget', { index: index + 1, time: target.expectedMs })}
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
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: SPACE.m },
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

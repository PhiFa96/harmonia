import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState, Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PitchTracker } from '@harmonia/audio/pitch-detection';
import type { PitchReading } from '@harmonia/audio/pitch-detection';
import { pitchInputMidiLabel, voiceAnswerValues, voiceTargets } from '@harmonia/exercises';
import type { Evaluation, VoiceItem } from '@harmonia/exercises';
import { SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { useMusicLocale } from '@/i18n';
import { startMicrophone } from '@/microphone/input';
import { MicrophoneError } from '@/microphone/types';
import type { MicrophoneErrorReason, MicrophoneSession } from '@/microphone/types';
import { useSettings } from '@/state/settings';

interface Props {
  readonly item: VoiceItem;
  readonly answer: string | null;
  readonly result?: Evaluation;
  readonly disabled: boolean;
  readonly playing: boolean;
  readonly heard: boolean;
  readonly onSelect: (answer: string | null) => void;
  readonly onBeforeCapture: () => void;
  readonly onPreview: () => Promise<void>;
}
type Phase = 'idle' | 'requesting' | 'listening' | 'error';

export function MicrophoneAnswerInput({
  item,
  answer,
  result,
  disabled,
  playing,
  heard,
  onSelect,
  onBeforeCapture,
  onPreview,
}: Props) {
  const { t } = useTranslation();
  const locale = useMusicLocale();
  const referenceHz = useSettings((s) => s.referenceHz);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<MicrophoneErrorReason | null>(null);
  const [reading, setReading] = useState<Extract<PitchReading, { state: 'stable' }> | null>(null);
  const [recorded, setRecorded] = useState<number[]>(() =>
    answer ? (voiceAnswerValues(answer, voiceTargets(item).length) ?? []) : [],
  );
  const session = useRef<MicrophoneSession | null>(null);
  const revision = useRef(0);
  const lifecycle = useRef<Promise<void>>(Promise.resolve());
  const stop = useCallback(() => {
    revision.current++;
    const active = session.current;
    session.current = null;
    lifecycle.current = lifecycle.current
      .catch(() => undefined)
      .then(async () => {
        if (active) await active.stop();
      })
      .catch(() => undefined);
    setPhase('idle');
    setReading(null);
    return lifecycle.current;
  }, []);
  useFocusEffect(
    useCallback(
      () => () => {
        void stop();
      },
      [stop],
    ),
  );
  useEffect(() => {
    if (result || disabled) void stop();
  }, [result, disabled, stop]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && session.current) void stop();
    });
    return () => {
      subscription.remove();
    };
  }, [stop]);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onVisibility = () => {
      if (document.hidden) void stop();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [stop]);

  const start = async () => {
    if (disabled || result || phase === 'requesting' || phase === 'listening') return;
    onBeforeCapture();
    const ticket = ++revision.current;
    const tracker = new PitchTracker(referenceHz);
    let lastAt = -Infinity;
    const fail = (reason: MicrophoneErrorReason) => {
      if (revision.current !== ticket) return;
      void stop();
      setError(reason);
      setPhase('error');
    };
    setError(null);
    setPhase('requesting');
    const open = async () => {
      if (revision.current !== ticket) return;
      try {
        const opened = await startMicrophone((samples, rate, atMs) => {
          if (revision.current !== ticket) return;
          try {
            const next = tracker.analyze(samples, rate, atMs);
            if (atMs - lastAt >= 100 || next.state !== 'stable') {
              setReading(next.state === 'stable' ? next : null);
              lastAt = atMs;
            }
          } catch {
            fail('unavailable');
          }
        }, fail);
        if (
          revision.current !== ticket ||
          (Platform.OS === 'web' ? document.hidden : AppState.currentState === 'background')
        ) {
          await opened.stop();
          if (revision.current === ticket) void stop();
          return;
        }
        session.current = opened;
        setPhase('listening');
      } catch (cause) {
        fail(cause instanceof MicrophoneError ? cause.reason : 'unavailable');
      }
    };
    lifecycle.current = lifecycle.current.catch(() => undefined).then(open);
    await lifecycle.current;
  };

  const preview = async () => {
    await stop();
    await onPreview();
  };
  const add = () => {
    if (!reading || disabled || result || recorded.length >= voiceTargets(item).length) return;
    const value = Math.round(reading.midi * 100 + reading.cents);
    const next = [...recorded, value];
    setRecorded(next);
    setReading(null);
    onSelect(
      next.length === voiceTargets(item).length ? `voice:${next.map(String).join(',')}` : null,
    );
    if (next.length === voiceTargets(item).length) void stop();
  };
  const clear = () => {
    setRecorded([]);
    setReading(null);
    onSelect(null);
  };
  const label = (value: number) => pitchInputMidiLabel(Math.round(value / 100), locale);

  return (
    <Card>
      <View style={{ gap: SPACE.m }}>
        <AppText>{t('voice.privacy')}</AppText>
        <Button
          label={
            item.type === 'SIGHT_SING'
              ? t('voice.helpTone')
              : playing
                ? t('exercise.stop')
                : heard
                  ? t('exercise.replay')
                  : t('exercise.play')
          }
          onPress={() => {
            void preview();
          }}
          disabled={disabled || !!result}
        />
        {phase === 'idle' || phase === 'error' ? (
          <Button
            label={t('tuner.start')}
            onPress={() => {
              void start();
            }}
            disabled={disabled || !!result}
          />
        ) : (
          <Button
            label={t('tuner.stop')}
            variant="secondary"
            onPress={() => {
              void stop();
            }}
          />
        )}
        {phase === 'requesting' ? <AppText>{t('tuner.requesting')}</AppText> : null}
        {phase === 'error' ? (
          <AppText role="alert">
            {t(
              error === 'permission'
                ? 'tuner.permission'
                : error === 'interrupted'
                  ? 'tuner.interrupted'
                  : 'tuner.unavailable',
            )}
          </AppText>
        ) : null}
        <AppText aria-live="polite">
          {reading
            ? t('voice.detected', { note: label(Math.round(reading.midi * 100 + reading.cents)) })
            : t('voice.waiting')}
        </AppText>
        <Button
          label={t('voice.capture')}
          onPress={add}
          disabled={
            !reading || disabled || !!result || recorded.length >= voiceTargets(item).length
          }
        />
        <AppText>
          {t('voice.progress', { count: recorded.length, total: voiceTargets(item).length })}
        </AppText>
        {recorded.length > 0 ? <AppText>{recorded.map(label).join(' → ')}</AppText> : null}
        {recorded.length > 0 && !result ? (
          <Button label={t('voice.retry')} variant="ghost" onPress={clear} />
        ) : null}
      </View>
    </Card>
  );
}

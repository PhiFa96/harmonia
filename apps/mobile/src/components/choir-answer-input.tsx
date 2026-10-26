import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, ScrollView, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { engineLanguage } from '@harmonia/i18n';
import { assessChoir, choirKeyName, choirScore, pitchInputLabel } from '@harmonia/exercises';
import type { ChoirItem, Evaluation } from '@harmonia/exercises';
import { eventBounds, layoutScore } from '@harmonia/notation';
import { ScoreView } from '@harmonia/notation/native';
import { SPACE } from '@harmonia/ui';
import { AppText, Button, Card, useUiTheme } from '@harmonia/ui/native';
import { useMusicLocale } from '@/i18n';
import { useSettings } from '@/state/settings';
import { createChoirAudio } from '@/audio/choir';
import { getAudioEngine } from '@/audio';
import { startMicrophone } from '@/microphone/input';
import { createChoirRunner } from '@/choir/runner';
import type { ChoirState } from '@/choir/runner';

interface Props {
  readonly item: ChoirItem;
  readonly answer: string | null;
  readonly result?: Evaluation;
  readonly disabled?: boolean;
  readonly onSelect: (answer: string | null) => void;
  readonly onInspect?: () => void;
}
export function ChoirAnswerInput({
  item,
  answer,
  result,
  disabled = false,
  onSelect,
  onInspect,
}: Props) {
  const { t } = useTranslation(),
    locale = useMusicLocale(),
    { colors } = useUiTheme();
  const sound = useSettings((s) => s.sound),
    referenceHz = useSettings((s) => s.referenceHz);
  const [headphones, setHeadphones] = useState(false),
    [delay, setDelay] = useState(0);
  const [state, setState] = useState<ChoirState>({ phase: 'idle', note: -1, beat: 0 });
  const [error, setError] = useState('');
  const focused = useRef(false),
    mounted = useRef(true);
  const audio = useRef<ReturnType<typeof createChoirAudio> | null>(null);
  const runner = useRef<ReturnType<typeof createChoirRunner> | null>(null);
  const latest = useRef({ onSelect, sound, disabled, result });
  latest.current = { onSelect, sound, disabled, result };
  const stop = useCallback(() => runner.current?.stop(), []);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
        void stop();
      };
    }, [stop]),
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const closing = stop();
      void Promise.resolve(closing)
        .then(() => audio.current?.close())
        .catch(() => undefined);
    };
  }, [stop]);
  useEffect(() => {
    void stop();
    runner.current = null;
    audio.current?.engine.setReferenceHz(referenceHz);
  }, [item, referenceHz, stop]);
  useEffect(() => {
    if (disabled || result || !sound) void stop();
  }, [disabled, result, sound, stop]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (status) => {
      if (status !== 'active') void stop();
    });
    const visibility = () => {
      if (document.hidden) void stop();
    };
    if (Platform.OS === 'web') document.addEventListener('visibilitychange', visibility);
    return () => {
      sub.remove();
      if (Platform.OS === 'web') document.removeEventListener('visibilitychange', visibility);
    };
  }, [stop]);
  const start = (mode: 'backing' | 'all' | 'solo') => {
    if (!sound || disabled || (mode === 'backing' && (!headphones || result))) return;
    try {
      getAudioEngine().stopAll();
      audio.current ??= createChoirAudio(referenceHz);
      runner.current ??= createChoirRunner(item, {
        engine: audio.current.engine,
        referenceHz,
        open: (frame, fail) => startMicrophone(frame, fail, { headphones: true }),
        active: () =>
          focused.current &&
          mounted.current &&
          latest.current.sound &&
          !latest.current.disabled &&
          (Platform.OS === 'web' ? !document.hidden : AppState.currentState === 'active'),
        update: (next) => {
          if (mounted.current) setState(next);
        },
        answer: (next) => {
          if (mounted.current) latest.current.onSelect(next);
        },
        error: (reason) => {
          if (mounted.current) setError(reason);
        },
        interval: (cb) => setInterval(cb, 50),
        clear: (id) => {
          clearInterval(id as number);
        },
      });
      if (mode !== 'backing' && !result) onInspect?.();
      void runner.current.start(mode, delay);
    } catch {
      setError('unavailable');
    }
  };
  const busy = ['requesting', 'checking', 'countIn', 'singing', 'preview'].includes(state.phase);
  const scoreScroll = useRef<ScrollView>(null);
  const [scoreWidth, setScoreWidth] = useState(300);
  const solo = useMemo(() => choirScore(item, item.params.voice), [item]);
  const bounds = useMemo(() => eventBounds(layoutScore(solo)), [solo]);
  useEffect(() => {
    if (state.note < 0) return;
    const current = bounds.find(
      (b) => b.measure === Math.floor(state.note / 2) && b.event === state.note % 2,
    );
    if (current)
      scoreScroll.current?.scrollTo({
        x: Math.max(0, current.x1 * 12 - scoreWidth / 3),
        animated: false,
      });
  }, [state.note, bounds, scoreWidth]);
  const report = result ? assessChoir(item, result.answer) : null;
  return (
    <View style={{ gap: SPACE.m }} testID="choir-trainer">
      <AppText>{t('exercise.choirDraft')}</AppText>
      <AppText>{t('exercise.choirPrivacy')}</AppText>
      <Card>
        <AppText variant="title3">
          {t(item.params.piece === 'home' ? 'exercise.choirHome' : 'exercise.choirArch')}
        </AppText>
        <AppText variant="title3">
          {t('exercise.choirNotation')} · {t(`exercise.satb_${item.params.voice}`)} ·{' '}
          {t('exercise.choirTempo', { bpm: item.bpm })}
        </AppText>
        <AppText testID="choir-key">
          {t('exercise.choirKey', {
            key: choirKeyName(item, locale),
          })}
        </AppText>
        <ScrollView
          ref={scoreScroll}
          onLayout={(event) => {
            setScoreWidth(event.nativeEvent.layout.width);
          }}
          horizontal
          {...(Platform.OS === 'web' ? { tabIndex: 0 } : {})}
        >
          <ScoreView
            score={solo}
            staffSpace={12}
            color={colors.text}
            describeOptions={engineLanguage(locale)}
            highlights={
              state.note >= 0
                ? [
                    {
                      ref: {
                        staff: 0,
                        measure: Math.floor(state.note / 2),
                        voice: 0,
                        event: state.note % 2,
                      },
                      kind: 'active',
                    },
                  ]
                : []
            }
          />
        </ScrollView>
        <AppText variant="title3">{t('exercise.choirScore')}</AppText>
        <ScrollView horizontal {...(Platform.OS === 'web' ? { tabIndex: 0 } : {})}>
          <ScoreView
            score={item.score}
            staffSpace={10}
            color={colors.text}
            describeOptions={engineLanguage(locale)}
          />
        </ScrollView>
        <Button
          label={t('exercise.choirSolo')}
          disabled={busy || !sound || disabled}
          onPress={() => {
            start('solo');
          }}
        />
        <Button
          label={t('exercise.choirAll')}
          disabled={busy || !sound || disabled}
          onPress={() => {
            start('all');
          }}
        />
      </Card>
      {!result ? (
        <Card>
          <AppText>{t('exercise.choirHeadphonesHelp')}</AppText>
          <Button
            label={t('exercise.choirHeadphones')}
            selected={headphones}
            disabled={busy || disabled}
            onPress={() => {
              setHeadphones(!headphones);
            }}
          />
          <AppText>{t('exercise.choirDelay', { ms: delay })}</AppText>
          <AppText variant="small" tone="muted">
            {t('exercise.choirDelayHelp')}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s }}>
            <Button
              label={t('exercise.choirDelayLess')}
              disabled={busy || delay === 0 || disabled}
              onPress={() => {
                setDelay(Math.max(0, delay - 25));
              }}
            />
            <Button
              label={t('exercise.choirDelayMore')}
              disabled={busy || delay === 300 || disabled}
              onPress={() => {
                setDelay(Math.min(300, delay + 25));
              }}
            />
          </View>
          <Button
            testID="choir-start"
            label={t(answer ? 'exercise.choirRetry' : 'exercise.choirStart')}
            disabled={busy || !headphones || !sound || disabled}
            onPress={() => {
              start('backing');
            }}
          />
        </Card>
      ) : null}
      {busy ? (
        <Button
          label={t('exercise.choirStop')}
          onPress={() => {
            void stop();
          }}
        />
      ) : null}
      <AppText aria-live="polite" testID="choir-status">
        {state.phase === 'countIn'
          ? t('exercise.choirCountIn', { beat: state.beat || 1 })
          : state.phase === 'singing'
            ? t('exercise.choirSinging', { note: state.note + 1 })
            : state.phase === 'requesting'
              ? t('exercise.choirRequesting')
              : state.phase === 'checking'
                ? t('exercise.choirChecking')
                : state.phase === 'preview'
                  ? t('exercise.choirPreview')
                  : state.phase === 'done'
                    ? t('exercise.choirDone')
                    : ''}
      </AppText>
      {error ? (
        <AppText tone="danger" aria-live="polite">
          {t(
            error === 'no-input'
              ? 'exercise.choirNoInput'
              : error === 'permission'
                ? 'tuner.permission'
                : error === 'interrupted'
                  ? 'exercise.choirInterrupted'
                  : 'tuner.unavailable',
          )}
        </AppText>
      ) : null}
      <AppText variant="small">{t('exercise.choirProfile')}</AppText>
      {report ? (
        <View style={{ gap: SPACE.s }} testID="choir-results">
          <AppText>{t('exercise.choirOctave', { shift: report.octaveShift })}</AppText>
          {report.notes.map((n) => {
            const pitch = item.parts[item.params.voice][n.index];
            return (
              <Card key={n.index}>
                <AppText variant="title3">
                  {t('exercise.choirNote', {
                    note: n.index + 1,
                    bar: Math.floor(n.index / 2) + 1,
                    pitch: pitch ? pitchInputLabel(pitch, locale) : '',
                  })}
                </AppText>
                <AppText>
                  {t(
                    n.passed
                      ? 'exercise.choirPass'
                      : n.coverage < 8 / 12
                        ? 'exercise.choirMissing'
                        : 'exercise.choirMiss',
                  )}
                </AppText>
                <AppText>
                  {n.deviation === null
                    ? t('exercise.choirNoPitch')
                    : t('exercise.choirDeviation', {
                        cents: n.deviation,
                        coverage: Math.round(n.coverage * 100),
                      })}
                </AppText>
              </Card>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

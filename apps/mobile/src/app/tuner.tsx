import { useCallback, useEffect, useRef, useState } from 'react';
import { Stack, useFocusEffect } from 'expo-router';
import { AppState, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PitchTracker } from '@harmonia/audio/pitch-detection';
import type { PitchReading } from '@harmonia/audio/pitch-detection';
import { pitchInputMidiLabel } from '@harmonia/exercises';
import { formatNumber } from '@harmonia/i18n';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card, useUiTheme } from '@harmonia/ui/native';
import { useMusicLocale } from '@/i18n';
import { useSettings } from '@/state/settings';
import { startMicrophone } from '@/microphone/input';
import { MicrophoneError } from '@/microphone/types';
import type { MicrophoneErrorReason, MicrophoneSession } from '@/microphone/types';

type Phase = 'idle' | 'requesting' | 'listening' | 'error';

export default function TunerScreen() {
  const { t } = useTranslation();
  const { colors } = useUiTheme();
  const musicLocale = useMusicLocale();
  const referenceHz = useSettings((s) => s.referenceHz);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<MicrophoneErrorReason | null>(null);
  const [reading, setReading] = useState<PitchReading | null>(null);
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
    setError(null);
    setReading(null);
  }, []);
  useFocusEffect(
    useCallback(
      () => () => {
        stop();
      },
      [stop],
    ),
  );
  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && session.current) stop();
    });
    return () => {
      listener.remove();
    };
  }, [stop]);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onVisibility = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [stop]);
  const start = async () => {
    if (phase === 'requesting' || phase === 'listening') return;
    const ticket = ++revision.current;
    const tracker = new PitchTracker(referenceHz);
    let publishedAt = -Infinity;
    let publishedState: PitchReading['state'] | null = null;
    const fail = (reason: MicrophoneErrorReason) => {
      if (revision.current !== ticket) return;
      stop();
      setError(reason);
      setPhase('error');
    };
    setError(null);
    setReading(null);
    setPhase('requesting');
    const open = async () => {
      if (revision.current !== ticket) return;
      try {
        const opened = await startMicrophone((samples, rate, atMs) => {
          if (revision.current !== ticket) return;
          try {
            const next = tracker.analyze(samples, rate, atMs);
            if (next.state !== publishedState || atMs - publishedAt >= 100) {
              setReading(next);
              publishedAt = atMs;
              publishedState = next.state;
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
          if (revision.current === ticket) stop();
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
  const stable = reading?.state === 'stable' ? reading : null;
  const cents = stable ? Math.round(stable.cents) : 0;
  const direction = Math.abs(cents) <= 5 ? 'center' : cents < 0 ? 'low' : 'high';
  const centsText = (cents > 0 ? '+' : '') + formatNumber(cents, musicLocale.locale);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('tuner.title') }} />
      <View style={styles.content}>
        <AppText variant="title1">{t('tuner.title')}</AppText>
        <AppText>{t('tuner.intro')}</AppText>
        <Card>
          <View style={styles.group}>
            <AppText variant="title2">{t('tuner.privacyTitle')}</AppText>
            <AppText>{t('tuner.privacy')}</AppText>
            <AppText>{t('tuner.reference', { hz: referenceHz })}</AppText>
            {phase === 'idle' || phase === 'error' ? (
              <Button
                label={t('tuner.start')}
                onPress={() => {
                  void start();
                }}
              />
            ) : (
              <Button label={t('tuner.stop')} variant="secondary" onPress={stop} />
            )}
            {phase === 'requesting' ? (
              <AppText aria-live="polite">{t('tuner.requesting')}</AppText>
            ) : null}
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
          </View>
        </Card>
        {phase === 'listening' ? (
          <Card>
            <View style={styles.group}>
              <AppText aria-live="polite" variant="title2">
                {stable
                  ? pitchInputMidiLabel(stable.midi, musicLocale)
                  : t(reading?.state === 'unstable' ? 'tuner.unstable' : 'tuner.silent')}
              </AppText>
              {stable ? (
                <>
                  <AppText>
                    {t('tuner.frequency', {
                      hz: formatNumber(stable.hz, musicLocale.locale, { maximumFractionDigits: 1 }),
                    })}
                  </AppText>
                  <AppText tone={direction === 'center' ? 'success' : 'default'}>
                    {t(`tuner.direction_${direction}`)}
                  </AppText>
                  <AppText>{t('tuner.cents', { cents: centsText })}</AppText>
                  <View
                    accessibilityRole="progressbar"
                    accessibilityLabel={t('tuner.cents', { cents: centsText })}
                    accessibilityValue={{
                      min: -50,
                      max: 50,
                      now: Math.max(-50, Math.min(50, cents)),
                    }}
                    style={[
                      styles.scale,
                      { borderColor: colors.borderStrong, backgroundColor: colors.surface },
                    ]}
                  >
                    <View style={[styles.center, { backgroundColor: colors.borderStrong }]} />
                    <View
                      style={[
                        styles.needle,
                        {
                          left: `${String(50 + Math.max(-50, Math.min(50, cents)))}%` as `${number}%`,
                          backgroundColor: direction === 'center' ? colors.success : colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <AppText tone="muted">{t('tuner.scale')}</AppText>
                </>
              ) : null}
            </View>
          </Card>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: LAYOUT.screenPadding, paddingBottom: SPACE.xxxl },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', gap: SPACE.m },
  group: { gap: SPACE.m },
  scale: { height: 36, borderWidth: 1, borderRadius: 18, justifyContent: 'center' },
  center: { position: 'absolute', left: '50%', width: 1, height: 34 },
  needle: { position: 'absolute', width: 4, height: 34, borderRadius: 2, marginLeft: -2 },
});

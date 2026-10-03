import type { AudioEngine, Playback, SequenceEvent } from '@harmonia/audio';
import { formatNumber } from '@harmonia/i18n';
import type { Pitch } from '@harmonia/notation';
import { Stack, useTheme } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { getAudioEngine, usePianoStatus } from '@/audio';
import { useLocale } from '@/i18n';

// Testseite für den Audio-Spike (P1.16): Ton beim Antippen, Akkord, Sequenz mit Metronom.
// Messanleitung: docs/plan/audio-latenz-messen.md

/**
 * react-native-web startet onPressIn erst nach 50 ms (bei kürzerem Klick ohne onPress gar nicht).
 * Für die Latenz zählt jede Millisekunde: im Web sofort. Auf iOS/Android ist es schon 0.
 * Die Eigenschaft fehlt in den Typen von React Native, deshalb als ungetyptes Objekt.
 */
const NO_PRESS_DELAY: object = Platform.OS === 'web' ? { delayPressIn: 0 } : {};

const pitch = (letter: Pitch['letter'], octave = 4): Pitch => ({ letter, alter: 0, octave });
const A4 = pitch('A');
const C_MAJOR = [pitch('C'), pitch('E'), pitch('G')];
const SCALE: readonly SequenceEvent[] = [
  ...(['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const).map((l) => ({ pitches: [pitch(l)], beats: 1 })),
  { pitches: [pitch('C', 5)], beats: 2 },
];

export default function AudioTestScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const locale = useLocale();
  const [info, setInfo] = useState<string | null>(null);
  const metronome = useRef<Playback | null>(null);
  const piano = usePianoStatus((state) => state.status);

  useEffect(
    () => () => {
      metronome.current?.stop();
    },
    [],
  );

  /** Engine holen (im Web erst jetzt erlaubt), starten und gemeldete Werte anzeigen. */
  const withEngine = (action: (engine: AudioEngine) => void) => {
    const engine = getAudioEngine();
    void engine.resume();
    action(engine);
    const latency = engine.latency();
    const ms = (seconds: number | undefined) =>
      seconds === undefined
        ? undefined
        : formatNumber(seconds * 1000, locale, { maximumFractionDigits: 1 });
    const rate = t('audioTest.sampleRate', { rate: formatNumber(latency.sampleRate, locale) });
    const base = ms(latency.base);
    const output = ms(latency.output);
    setInfo(
      `${rate}\n${
        base !== undefined && output !== undefined
          ? t('audioTest.reportedLatency', { base, output })
          : t('audioTest.noReportedLatency')
      }`,
    );
  };

  const button = (label: string, onPressIn: () => void) => (
    <Pressable
      role="button"
      {...NO_PRESS_DELAY}
      onPressIn={onPressIn}
      style={({ pressed }) => [
        styles.button,
        { borderColor: colors.border, backgroundColor: pressed ? colors.border : colors.card },
      ]}
    >
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('audioTest.title') }} />
      <Text style={{ color: colors.text }}>{t('audioTest.intro')}</Text>
      {button(t('audioTest.tone'), () => {
        withEngine((engine) => engine.playPitch(A4, { duration: 0.4 }));
      })}
      {button(t('audioTest.chord'), () => {
        withEngine((engine) => engine.playChord(C_MAJOR));
      })}
      {button(t('audioTest.sequence'), () => {
        withEngine((engine) => engine.playSequence(SCALE, { tempo: 90, metronome: 4, countIn: 4 }));
      })}
      {button(t('audioTest.metronome'), () => {
        withEngine((engine) => {
          metronome.current?.stop();
          metronome.current = engine.startMetronome(90, 4);
        });
      })}
      {button(t('audioTest.stop'), () => {
        withEngine((engine) => {
          engine.stopAll();
          metronome.current = null;
        });
      })}
      <Text aria-live="polite" style={{ color: colors.text }}>
        {info ?? t('audioTest.notStarted')}
      </Text>
      <Text aria-live="polite" style={{ color: colors.text }}>
        {t(`audioTest.piano_${piano}`)}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, padding: 24 },
  button: {
    minHeight: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  label: { fontSize: 18 },
});

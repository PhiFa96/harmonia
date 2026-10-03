import type { EventRef, Highlight, Pitch, Score, StaffHit } from '@harmonia/notation';
import {
  DARK_HIGHLIGHT_COLORS,
  DEFAULT_HIGHLIGHT_COLORS,
  describeEvent,
  eventAt,
  moveByStep,
  parseScore,
  pitchAt,
  removePitch,
  setAlter,
  setPitch,
} from '@harmonia/notation';
import { ScoreView } from '@harmonia/notation/native';
import { engineLanguage } from '@harmonia/i18n';
import { useTheme } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AccidentalBar } from '@/components/accidental-bar';
import { useLocale } from '@/i18n';

// Vorschau der Noteneingabe (P1.15), bis das Übungs-Framework (P1.19) Aufgaben und Bewertung übernimmt.
const START = 'treble | 4/4 | C4/1 | r/1';
/** Hier setzt man die Note: zweiter Takt. */
const SLOT: EventRef = { measure: 1, event: 0 };
const EDITABLE: readonly EventRef[] = [SLOT];
/** Vorgegebener Ton c¹; Ausgangspunkt, wenn die Note per Tastatur oder Screenreader gesetzt wird. */
const GIVEN: Pitch = { letter: 'C', alter: 0, octave: 4 };
/** Große Terz über c¹ */
const TARGET: Pitch = { letter: 'E', alter: 0, octave: 4 };

type Result = 'correct' | 'wrong';

export default function PracticeScreen() {
  const { t } = useTranslation();
  const { colors, dark } = useTheme();
  const locale = useLocale();
  const describeOptions = useMemo(() => engineLanguage(locale), [locale]);
  const [score, setScore] = useState<Score>(() => parseScore(START));
  const [result, setResult] = useState<Result | null>(null);
  const dragStart = useRef<Score | null>(null);

  const placed = pitchAt(score, SLOT);
  const change = (next: Score) => {
    setScore(next);
    setResult(null);
  };

  const onTap = (hit: StaffHit) => {
    if (hit.measure === SLOT.measure) {
      change(setPitch(score, SLOT, hit.pitch));
    }
  };

  const onDragNote = (ref: EventRef, steps: number, done: boolean) => {
    const base = dragStart.current ?? score;
    dragStart.current = done ? null : base;
    change(moveByStep(base, ref, steps));
  };

  const highlights = useMemo((): Highlight[] => {
    if (result) {
      return [{ ref: SLOT, kind: result }];
    }
    return placed ? [{ ref: SLOT, kind: 'active' }] : [];
  }, [result, placed]);

  const slotEvent = eventAt(score, SLOT);
  const highlightLabels = useMemo(
    () => ({
      correct: t('highlight.correct'),
      wrong: t('highlight.wrong'),
      active: t('highlight.active'),
    }),
    [t],
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text role="heading" style={[styles.title, { color: colors.text }]}>
        {t('practice.intervalTitle')}
      </Text>
      <Text style={[styles.task, { color: colors.text }]}>{t('practice.intervalTask')}</Text>
      <Text style={[styles.hint, { color: colors.text }]}>{t('practice.intervalHint')}</Text>
      {Platform.OS === 'web' ? (
        <Text style={[styles.hint, { color: colors.text }]}>{t('practice.keyboardHint')}</Text>
      ) : null}
      <ScoreView
        score={score}
        staffSpace={14}
        color={colors.text}
        describeOptions={describeOptions}
        highlights={highlights}
        highlightColors={dark ? DARK_HIGHLIGHT_COLORS : DEFAULT_HIGHLIGHT_COLORS}
        highlightLabels={highlightLabels}
        editable={EDITABLE}
        onTap={onTap}
        onDragNote={onDragNote}
        onAdjustNote={(ref, steps) => {
          // Noch keine Note: vom vorgegebenen Ton aus starten
          const base = placed ? score : setPitch(score, ref, GIVEN);
          change(moveByStep(base, ref, steps));
        }}
      />
      <Text aria-live="polite" style={{ color: colors.text }}>
        {placed && slotEvent
          ? t('practice.placed', { note: describeEvent(slotEvent, describeOptions) })
          : t('practice.nothingPlaced')}
      </Text>
      <AccidentalBar
        value={placed?.alter}
        onChange={(alter) => {
          change(setAlter(score, SLOT, alter));
        }}
      />
      <View style={styles.actions}>
        <Pressable
          role="button"
          disabled={!placed}
          aria-disabled={!placed}
          onPress={() => {
            change(removePitch(score, SLOT));
          }}
          style={[styles.button, { borderColor: colors.border }, !placed && styles.disabled]}
        >
          <Text style={{ color: colors.text }}>{t('practice.remove')}</Text>
        </Pressable>
        <Pressable
          role="button"
          disabled={!placed}
          aria-disabled={!placed}
          onPress={() => {
            setResult(placed && samePitch(placed, TARGET) ? 'correct' : 'wrong');
          }}
          style={[styles.button, { borderColor: colors.primary }, !placed && styles.disabled]}
        >
          <Text style={{ color: colors.text }}>{t('practice.check')}</Text>
        </Pressable>
      </View>
      {result ? (
        <Text aria-live="polite" style={[styles.result, { color: colors.text }]}>
          {result === 'correct' ? t('practice.correct') : t('practice.wrong')}
        </Text>
      ) : null}
    </ScrollView>
  );
}

function samePitch(a: Pitch, b: Pitch): boolean {
  return a.letter === b.letter && a.alter === b.alter && a.octave === b.octave;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12, padding: 24 },
  title: { fontSize: 24, fontWeight: '600' },
  task: { fontSize: 18 },
  hint: { textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
  button: {
    minHeight: 44,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  disabled: { opacity: 0.4 },
  result: { fontWeight: '600' },
});

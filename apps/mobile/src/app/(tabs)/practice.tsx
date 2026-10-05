import type { EventRef, Highlight, Pitch, Score, StaffHit } from '@harmonia/notation';
import {
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
import { LAYOUT, RADIUS, SPACE, highlightColors } from '@harmonia/ui';
import { AppText, Button, Card, FeedbackBanner, useUiTheme } from '@harmonia/ui/native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AccidentalBar } from '@/components/accidental-bar';
import { PianoKeyboard } from '@/components/piano-keyboard';
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
  const { colors, scheme } = useUiTheme();
  const locale = useLocale();
  const describeOptions = useMemo(() => engineLanguage(locale), [locale]);
  const [score, setScore] = useState<Score>(() => parseScore(START));
  const [result, setResult] = useState<Result | null>(null);
  const [inputMode, setInputMode] = useState<'staff' | 'piano'>('staff');
  const dragStart = useRef<Score | null>(null);
  const [keyboardEnabled, setKeyboardEnabled] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setKeyboardEnabled(true);
      return () => {
        setKeyboardEnabled(false);
      };
    }, []),
  );

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
    <ScrollView
      contentContainerStyle={[styles.container, inputMode === 'piano' && styles.pianoContainer]}
    >
      <View style={[styles.content, inputMode === 'piano' && styles.pianoContent]}>
        <View style={styles.header}>
          {inputMode === 'staff' ? (
            <AppText variant="overline" tone="muted">
              {t('practice.intervalTitle')}
            </AppText>
          ) : null}
          <AppText variant="title2">{t('practice.intervalTask')}</AppText>
        </View>
        <View
          role="radiogroup"
          aria-label={t('practice.input')}
          style={[styles.inputModes, { backgroundColor: colors.sunken }]}
        >
          {(['staff', 'piano'] as const).map((mode) => (
            <Pressable
              key={mode}
              role="radio"
              aria-checked={inputMode === mode}
              onPress={() => {
                setInputMode(mode);
              }}
              style={[
                styles.inputMode,
                { backgroundColor: inputMode === mode ? colors.surface : 'transparent' },
              ]}
            >
              <AppText variant="small" tone={inputMode === mode ? 'primary' : 'muted'}>
                {t(`practice.input_${mode}`)}
              </AppText>
            </Pressable>
          ))}
        </View>
        <Card padding={SPACE.s} style={styles.scoreCard}>
          <ScoreView
            score={score}
            staffSpace={14}
            color={colors.text}
            describeOptions={describeOptions}
            highlights={highlights}
            highlightColors={highlightColors(scheme)}
            highlightLabels={highlightLabels}
            {...(inputMode === 'staff'
              ? {
                  editable: EDITABLE,
                  onTap,
                  onDragNote,
                  onAdjustNote: (ref: EventRef, steps: 1 | -1) => {
                    const base = placed ? score : setPitch(score, ref, GIVEN);
                    change(moveByStep(base, ref, steps));
                  },
                }
              : {})}
          />
        </Card>
        {inputMode === 'staff' ? (
          <AppText variant="small" tone="muted" style={styles.center}>
            {t('practice.intervalHint')}
          </AppText>
        ) : null}
        {inputMode === 'staff' && Platform.OS === 'web' ? (
          <AppText variant="small" tone="muted" style={styles.center}>
            {t('practice.keyboardHint')}
          </AppText>
        ) : null}
        <AppText variant="small" aria-live="polite" style={styles.center}>
          {placed && slotEvent
            ? t('practice.placed', { note: describeEvent(slotEvent, describeOptions) })
            : t('practice.nothingPlaced')}
        </AppText>
        {inputMode === 'staff' ? (
          <AccidentalBar
            value={placed?.alter}
            onChange={(alter) => {
              change(setAlter(score, SLOT, alter));
            }}
          />
        ) : null}
        {inputMode === 'piano' ? (
          <PianoKeyboard
            enabled={keyboardEnabled}
            {...(placed ? { selected: placed } : {})}
            onPitch={(pitch) => {
              change(setPitch(score, SLOT, pitch));
            }}
            highlights={
              result && placed
                ? [
                    { pitch: placed, kind: result },
                    ...(result === 'wrong' ? [{ pitch: TARGET, kind: 'correct' as const }] : []),
                  ]
                : []
            }
          />
        ) : null}
        <View style={styles.actions}>
          <Button
            variant="secondary"
            label={t('practice.remove')}
            disabled={!placed}
            onPress={() => {
              change(removePitch(score, SLOT));
            }}
            style={styles.action}
          />
          <Button
            label={t('practice.check')}
            disabled={!placed}
            onPress={() => {
              setResult(placed && samePitch(placed, TARGET) ? 'correct' : 'wrong');
            }}
            style={styles.action}
          />
        </View>
        {result ? (
          <FeedbackBanner
            kind={result}
            title={result === 'correct' ? t('practice.correctTitle') : t('practice.wrongTitle')}
            message={result === 'correct' ? t('practice.correct') : t('practice.wrong')}
            style={styles.banner}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

function samePitch(a: Pitch, b: Pitch): boolean {
  return a.letter === b.letter && a.alter === b.alter && a.octave === b.octave;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: LAYOUT.screenPadding },
  content: {
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
    gap: SPACE.l,
  },
  pianoContainer: { paddingVertical: SPACE.m },
  pianoContent: { gap: SPACE.s },
  inputModes: {
    flexDirection: 'row',
    padding: SPACE.xs,
    borderRadius: RADIUS.control,
    gap: SPACE.xs,
  },
  inputMode: {
    minHeight: 48,
    flex: 1,
    borderRadius: RADIUS.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { gap: SPACE.s },
  scoreCard: { alignItems: 'center' },
  center: { textAlign: 'center' },
  actions: { flexDirection: 'row', gap: SPACE.m },
  action: { flex: 1 },
  banner: { borderRadius: RADIUS.card },
});

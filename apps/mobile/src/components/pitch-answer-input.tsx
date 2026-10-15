import type { Evaluation, PitchInputItem } from '@harmonia/exercises';
import {
  answerPitch,
  inputSlot,
  inputSolutionScore,
  inputTarget,
  keyAnswerId,
  pitchAnswerId,
} from '@harmonia/exercises';
import { engineLanguage } from '@harmonia/i18n';
import type { EventRef, Pitch, Score, StaffHit } from '@harmonia/notation';
import {
  PRACTICE_RANGE,
  keyboardMidi,
  describeEvent,
  eventAt,
  moveByStep,
  pitchAt,
  setAlter,
  setPitch,
} from '@harmonia/notation';
import { ScoreView } from '@harmonia/notation/native';
import { SPACE, highlightColors } from '@harmonia/ui';
import { AppText, Button, Card, useUiTheme } from '@harmonia/ui/native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useMusicLocale } from '@/i18n';
import { AccidentalBar } from './accidental-bar';
import { PianoKeyboard } from './piano-keyboard';

interface Props {
  readonly item: PitchInputItem;
  readonly answer: string | null;
  readonly result?: Evaluation;
  readonly showSolution: boolean;
  readonly onSelect: (answer: string | null) => void;
}
/** Derselbe Baustein in freiem Üben und versionierten Lektionen. Die Antwort bleibt im Aufgabenablauf. */
export function PitchAnswerInput({ item, answer, result, showSolution, onSelect }: Props) {
  const { t } = useTranslation();
  const locale = useMusicLocale();
  const { colors, scheme } = useUiTheme();
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
      };
    }, []),
  );
  const enabled = focused && !result;
  const slot = inputSlot(item);
  const placed = answer === null ? undefined : answerPitch(item, answer);
  const score =
    placed && item.type !== 'KEY_FIND' ? setPitch(item.score, slot, placed) : item.score;
  const dragStart = useRef<Score | null>(null);
  const options = engineLanguage(locale);
  const labels = {
    correct: t('highlight.correct'),
    wrong: t('highlight.wrong'),
    active: t('highlight.active'),
  };
  const change = (next: Score) => {
    if (!enabled) return;
    const pitch = pitchAt(next, slot);
    if (pitch && answerPitch(item, pitchAnswerId(pitch))) onSelect(pitchAnswerId(pitch));
  };
  const onTap = (hit: StaffHit) => {
    if (hit.measure === slot.measure) change(setPitch(score, slot, hit.pitch));
  };
  const onDragNote = (ref: EventRef, steps: number, done: boolean) => {
    const base = dragStart.current ?? score;
    dragStart.current = done ? null : base;
    change(moveByStep(base, ref, steps));
  };
  const target = inputTarget(item);
  const event = eventAt(score, slot);
  return (
    <View style={styles.container}>
      {item.type === 'KEY_FIND' ? (
        <PianoKeyboard
          enabled={enabled}
          {...(item.keyboardRange ? { fixedRange: item.keyboardRange } : {})}
          initialRange={
            keyboardMidi(target) >= PRACTICE_RANGE.first &&
            keyboardMidi(target) <= PRACTICE_RANGE.last
              ? 'practice'
              : keyboardMidi(target) >= 48 && keyboardMidi(target) <= 84
                ? 'middle'
                : 'full'
          }
          {...(placed ? { selected: placed } : {})}
          onPitch={(pitch: Pitch) => {
            if (enabled) onSelect(keyAnswerId(pitch));
          }}
          highlights={
            result && placed
              ? [
                  { pitch: placed, kind: result.correct ? 'correct' : 'wrong' },
                  ...(!result.correct ? [{ pitch: target, kind: 'correct' as const }] : []),
                ]
              : []
          }
        />
      ) : (
        <>
          <Card padding={SPACE.s}>
            <ScrollView horizontal contentContainerStyle={styles.score}>
              <ScoreView
                score={score}
                staffSpace={14}
                color={colors.text}
                describeOptions={options}
                highlights={
                  placed
                    ? [
                        {
                          ref: slot,
                          kind: result ? (result.correct ? 'correct' : 'wrong') : 'active',
                        },
                      ]
                    : []
                }
                highlightColors={highlightColors(scheme)}
                highlightLabels={labels}
                {...(enabled
                  ? {
                      editable: [slot],
                      onTap,
                      onDragNote,
                      onAdjustNote: (ref: EventRef, steps: 1 | -1) => {
                        const start =
                          item.type === 'INTERVAL_BUILD'
                            ? item.from
                            : {
                                letter: 'C' as const,
                                alter: 0,
                                octave: item.clef === 'treble' ? 4 : 3,
                              };
                        change(
                          moveByStep(placed ? score : setPitch(score, ref, start), ref, steps),
                        );
                      },
                    }
                  : {})}
              />
            </ScrollView>
          </Card>
          {!result ? (
            <>
              <AppText variant="small" tone="muted">
                {t('exercise.staffInputHint')}
              </AppText>
              {Platform.OS === 'web' ? (
                <AppText variant="small" tone="muted">
                  {t('practice.keyboardHint')}
                </AppText>
              ) : null}
            </>
          ) : null}
          <AppText variant="small" aria-live="polite">
            {placed && event
              ? t('practice.placed', { note: describeEvent(event, options) })
              : t('practice.nothingPlaced')}
          </AppText>
          <AccidentalBar
            value={placed?.alter}
            disabled={!enabled}
            onChange={(alter) => {
              change(setAlter(score, slot, alter));
            }}
          />
          <Button
            size="medium"
            variant="ghost"
            label={t('practice.remove')}
            disabled={!placed || !enabled}
            onPress={() => {
              onSelect(null);
            }}
          />
        </>
      )}
      {showSolution && item.type !== 'KEY_FIND' ? (
        <Card padding={SPACE.s}>
          <AppText variant="title3">{t('exercise.inputSolution')}</AppText>
          <ScrollView horizontal contentContainerStyle={styles.score}>
            <ScoreView
              score={inputSolutionScore(item)}
              staffSpace={14}
              color={colors.text}
              describeOptions={options}
              highlights={[{ ref: slot, kind: 'correct' }]}
              highlightColors={highlightColors(scheme)}
              highlightLabels={labels}
            />
          </ScrollView>
        </Card>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: SPACE.m },
  score: { flexGrow: 0, justifyContent: 'center', minWidth: '100%' },
});

import type { ChordItem, Evaluation } from '@harmonia/exercises';
import {
  chordAnswerId,
  chordAnswerPitches,
  chordAnswerScore,
  chordAnswerStatuses,
  chordEditScore,
  chordSolutionScore,
  pitchAnswerId,
  pitchInputLabel,
  writtenAnswerPitch,
} from '@harmonia/exercises';
import { engineLanguage } from '@harmonia/i18n';
import type { EventRef, Score, StaffHit } from '@harmonia/notation';
import { moveByStep, pitchAt, removePitch, setAlter, setPitch } from '@harmonia/notation';
import { ScoreView } from '@harmonia/notation/native';
import { RADIUS, SPACE, TOUCH } from '@harmonia/ui';
import { AppText, Button, Card, Icon, MusicText, useUiTheme } from '@harmonia/ui/native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocale } from '@/i18n';
import { AccidentalBar } from './accidental-bar';
import { useWebChoiceInput } from './use-web-choice-input';

const SLOT: EventRef = { measure: 1, event: 0 };
interface Props {
  readonly item: ChordItem;
  readonly answer: string | null;
  readonly result?: Evaluation;
  readonly showSolution: boolean;
  readonly onSelect: (answer: string | null) => void;
}
/** Einzelne Töne bearbeiten, gleichzeitig notierte Akkordansicht erhalten. */
export function ChordAnswerInput({ item, answer, result, showSolution, onSelect }: Props) {
  const { t } = useTranslation(),
    locale = useLocale(),
    { colors } = useUiTheme();
  const [selected, setSelected] = useState<1 | 2>(1),
    [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
      };
    }, []),
  );
  const enabled = focused && !result,
    group = useRef<View>(null),
    drag = useRef<Score | null>(null);
  const pitches = chordAnswerPitches(item, answer) ?? [item.bass, null, null],
    statuses = chordAnswerStatuses(item, answer);
  const score = chordEditScore(item, answer, selected),
    labels = { correct: t('highlight.correct'), wrong: t('highlight.wrong') };
  const choose = (value: string) => {
    drag.current = null;
    setSelected(value === '1' ? 1 : 2);
  };
  useWebChoiceInput(group, { choices: ['1', '2'], enabled, select: choose });
  const change = (next: Score) => {
    if (!enabled) return;
    const pitch = pitchAt(next, SLOT);
    if (pitch && !writtenAnswerPitch(item.clef, pitchAnswerId(pitch))) return;
    onSelect(
      chordAnswerId(pitches.map((old, index) => (index === selected ? (pitch ?? null) : old))),
    );
  };
  const onTap = (hit: StaffHit) => {
    if (hit.measure === SLOT.measure) change(setPitch(score, SLOT, hit.pitch));
  };
  const onDragNote = (ref: EventRef, steps: number, done: boolean) => {
    const base = drag.current ?? score;
    drag.current = done ? null : base;
    change(moveByStep(base, ref, steps));
  };
  return (
    <View style={styles.container}>
      <Card padding={SPACE.s}>
        <AppText variant="title3">{t('exercise.chordPreview')}</AppText>
        <ScrollView horizontal>
          <View testID="chord-preview">
            <ScoreView
              score={chordAnswerScore(item, answer)}
              staffSpace={14}
              color={colors.text}
              describeOptions={engineLanguage(locale)}
            />
          </View>
        </ScrollView>
      </Card>
      <View
        ref={group}
        role="radiogroup"
        aria-label={t('exercise.chordSelectTone')}
        style={styles.tones}
      >
        {([1, 2] as const).map((index) => {
          const pitch = pitches[index],
            label = t('exercise.chordTone', { index: index + 1 }),
            value = pitch ? pitchInputLabel(pitch, locale) : t('exercise.chordToneEmpty');
          const status = statuses[index] ? labels.correct : labels.wrong;
          return (
            <Pressable
              key={index}
              testID={`chord-tone-${String(index + 1)}`}
              role="radio"
              aria-checked={selected === index}
              aria-disabled={!enabled}
              aria-label={`${label}, ${value}${result ? `, ${status}` : ''}`}
              disabled={!enabled}
              {...(Platform.OS === 'web'
                ? { tabIndex: enabled && selected === index ? 0 : -1 }
                : {})}
              onPress={() => {
                choose(String(index));
              }}
              style={[
                styles.tone,
                {
                  borderColor: selected === index ? colors.primary : colors.border,
                  backgroundColor: selected === index ? colors.primarySoft : colors.surface,
                },
              ]}
            >
              <View>
                <AppText variant="small">{label}</AppText>
                <MusicText>{value}</MusicText>
              </View>
              {result ? (
                <Icon
                  name={statuses[index] ? 'check' : 'close'}
                  size={20}
                  color={statuses[index] ? colors.success : colors.danger}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {!result ? (
        <>
          <AppText variant="small" tone="muted">
            {t('exercise.chordInputHint')}
          </AppText>
          <Card padding={SPACE.s}>
            <ScrollView horizontal contentContainerStyle={styles.score}>
              <ScoreView
                score={score}
                staffSpace={14}
                color={colors.text}
                describeOptions={engineLanguage(locale)}
                {...(enabled
                  ? {
                      editable: [SLOT],
                      onTap,
                      onDragNote,
                      onAdjustNote: (ref: EventRef, steps: 1 | -1) => {
                        const base = pitchAt(score, ref) ? score : setPitch(score, ref, item.bass);
                        change(moveByStep(base, ref, steps));
                      },
                    }
                  : {})}
              />
            </ScrollView>
          </Card>
        </>
      ) : null}
      <AppText variant="small" aria-live="polite">
        {t('exercise.chordFilled', { count: pitches.slice(1).filter(Boolean).length })}
      </AppText>
      <AccidentalBar
        value={pitches[selected]?.alter}
        disabled={!enabled}
        onChange={(alter) => {
          change(setAlter(score, SLOT, alter));
        }}
      />
      <Button
        size="medium"
        variant="ghost"
        label={t('practice.remove')}
        disabled={!enabled || !pitches[selected]}
        onPress={() => {
          change(removePitch(score, SLOT));
        }}
      />
      {showSolution ? (
        <Card padding={SPACE.s}>
          <AppText variant="title3">{t('exercise.inputSolution')}</AppText>
          <ScrollView horizontal>
            <ScoreView
              score={chordSolutionScore(item)}
              staffSpace={14}
              color={colors.text}
              describeOptions={engineLanguage(locale)}
            />
          </ScrollView>
        </Card>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: SPACE.m },
  tones: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s },
  tone: {
    minHeight: TOUCH.buttonLarge,
    padding: SPACE.s,
    borderRadius: RADIUS.control,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.s,
  },
  score: { flexGrow: 0, justifyContent: 'center', minWidth: '100%' },
});

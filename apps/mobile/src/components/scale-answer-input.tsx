import type { Evaluation, ScaleItem } from '@harmonia/exercises';
import {
  pitchAnswerId,
  scaleAnswerId,
  scaleAnswerPitches,
  scaleAnswerScore,
  scalePitches,
  scaleSlot,
  scaleSlotIndex,
  scaleSolutionScore,
  writtenAnswerPitch,
} from '@harmonia/exercises';
import { engineLanguage } from '@harmonia/i18n';
import type { EventRef, Score, StaffHit } from '@harmonia/notation';
import {
  eventBounds,
  layoutScore,
  moveByStep,
  pitchAt,
  removePitch,
  setAlter,
  setPitch,
} from '@harmonia/notation';
import { ScoreView } from '@harmonia/notation/native';
import { RADIUS, SPACE, TOUCH, highlightColors } from '@harmonia/ui';
import { AppText, Button, Card, Icon, useUiTheme } from '@harmonia/ui/native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useMusicLocale } from '@/i18n';
import { AccidentalBar } from './accidental-bar';
import { useWebChoiceInput } from './use-web-choice-input';

const INDICES = [1, 2, 3, 4, 5, 6, 7] as const;
const EDITABLE = INDICES.map(scaleSlot);
interface Props {
  readonly item: ScaleItem;
  readonly answer: string | null;
  readonly result?: Evaluation;
  readonly showSolution: boolean;
  readonly onSelect: (answer: string | null) => void;
}
export function ScaleAnswerInput({ item, answer, result, showSolution, onSelect }: Props) {
  const { t } = useTranslation(),
    locale = useMusicLocale();
  const { colors, scheme } = useUiTheme();
  const [selected, setSelected] = useState(1),
    [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
      };
    }, []),
  );
  const enabled = focused && !result;
  const scroller = useRef<ScrollView>(null),
    group = useRef<View>(null),
    viewport = useRef(0),
    drag = useRef<Score | null>(null);
  const pitches = scaleAnswerPitches(item, answer) ?? scaleAnswerPitches(item, null) ?? [];
  const score = scaleAnswerScore(item, answer),
    targets = scalePitches(item),
    slot = scaleSlot(selected);
  const currentScore = useRef(score);
  currentScore.current = score;
  const labels = {
    correct: t('highlight.correct'),
    wrong: t('highlight.wrong'),
    active: t('highlight.active'),
  };
  const kindAt = (index: number) =>
    result
      ? pitches[index] &&
        targets[index] &&
        scaleAnswerId([pitches[index]]) === scaleAnswerId([targets[index]])
        ? ('correct' as const)
        : ('wrong' as const)
      : ('active' as const);
  useWebChoiceInput(group, {
    choices: INDICES.map(String),
    enabled,
    select: (value) => {
      setSelected(Number(value));
    },
  });
  useEffect(() => {
    if (viewport.current <= 0) return;
    const ref = scaleSlot(selected);
    const bounds = eventBounds(layoutScore(currentScore.current)).find(
      (bounds) => bounds.measure === ref.measure && bounds.event === ref.event,
    );
    if (bounds)
      scroller.current?.scrollTo({
        x: Math.max(0, ((bounds.x1 + bounds.x2) / 2 + 1) * 14 - viewport.current / 2),
        animated: false,
      });
    // Auswahlwechsel bringt den Bearbeitungsplatz ins Bild; Eingabe verschiebt den Ausschnitt nicht.
  }, [selected]);
  const change = (next: Score, ref: EventRef) => {
    if (!enabled) return;
    const index = scaleSlotIndex(ref);
    if (index < 1 || index > 7) return;
    const pitch = pitchAt(next, ref);
    if (pitch && !writtenAnswerPitch(item.clef, pitchAnswerId(pitch))) return;
    setSelected(index);
    onSelect(scaleAnswerId(pitches.map((old, i) => (i === index ? (pitch ?? null) : old))));
  };
  const onTap = (hit: StaffHit) => {
    if (hit.event) change(setPitch(score, hit.event, hit.pitch), hit.event);
  };
  const onDragNote = (ref: EventRef, steps: number, done: boolean) => {
    const base = drag.current ?? score;
    drag.current = done ? null : base;
    change(moveByStep(base, ref, steps), ref);
  };
  return (
    <View style={styles.container}>
      <Card padding={SPACE.s}>
        <ScrollView
          ref={scroller}
          horizontal
          onLayout={(event) => {
            viewport.current = event.nativeEvent.layout.width;
          }}
        >
          <ScoreView
            score={score}
            staffSpace={14}
            color={colors.text}
            describeOptions={engineLanguage(locale)}
            highlights={INDICES.filter(
              (index) => pitches[index] && (!!result || index === selected),
            ).map((index) => ({ ref: scaleSlot(index), kind: kindAt(index) }))}
            highlightColors={highlightColors(scheme)}
            highlightLabels={labels}
            {...(enabled
              ? {
                  editable: EDITABLE,
                  onTap,
                  onDragNote,
                  onAdjustNote: (ref: EventRef, steps: 1 | -1) => {
                    const base = pitchAt(score, ref) ? score : setPitch(score, ref, item.tonic);
                    change(moveByStep(base, ref, steps), ref);
                  },
                }
              : {})}
          />
        </ScrollView>
      </Card>
      <View
        ref={group}
        role="radiogroup"
        aria-label={t('exercise.scaleSelectDegree')}
        style={styles.degrees}
      >
        {INDICES.map((index) => (
          <Pressable
            key={index}
            testID={`scale-degree-${String(index + 1)}`}
            role="radio"
            aria-checked={selected === index}
            aria-disabled={!enabled}
            aria-label={`${t('exercise.scaleDegree', { index: index + 1 })}${result ? `, ${labels[kindAt(index)]}` : ''}`}
            disabled={!enabled}
            {...(Platform.OS === 'web' ? { tabIndex: enabled && selected === index ? 0 : -1 } : {})}
            onPress={() => {
              setSelected(index);
            }}
            style={[
              styles.degree,
              {
                borderColor: selected === index ? colors.primary : colors.border,
                backgroundColor: selected === index ? colors.primarySoft : colors.surface,
              },
            ]}
          >
            <AppText variant="small">{t('exercise.scaleDegree', { index: index + 1 })}</AppText>
            {result ? (
              <Icon
                name={kindAt(index) === 'correct' ? 'check' : 'close'}
                color={kindAt(index) === 'correct' ? colors.success : colors.danger}
                size={20}
              />
            ) : null}
          </Pressable>
        ))}
      </View>
      {!result ? (
        <AppText variant="small" tone="muted">
          {t('exercise.scaleInputHint')}
        </AppText>
      ) : null}
      <AppText variant="small" aria-live="polite">
        {t('exercise.scaleFilled', { count: pitches.slice(1).filter(Boolean).length })}
      </AppText>
      <AccidentalBar
        value={pitches[selected]?.alter}
        disabled={!enabled}
        onChange={(alter) => {
          change(setAlter(score, slot, alter), slot);
        }}
      />
      <Button
        size="medium"
        variant="ghost"
        label={t('practice.remove')}
        disabled={!enabled || !pitches[selected]}
        onPress={() => {
          change(removePitch(score, slot), slot);
        }}
      />
      {showSolution ? (
        <Card padding={SPACE.s}>
          <AppText variant="title3">{t('exercise.inputSolution')}</AppText>
          <ScrollView horizontal>
            <ScoreView
              score={scaleSolutionScore(item)}
              staffSpace={14}
              color={colors.text}
              describeOptions={engineLanguage(locale)}
              highlights={INDICES.map((index) => ({ ref: scaleSlot(index), kind: 'correct' }))}
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
  degrees: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s },
  degree: {
    minHeight: TOUCH.buttonLarge,
    padding: SPACE.s,
    borderRadius: RADIUS.control,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.s,
  },
});

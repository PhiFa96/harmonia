import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { engineLanguage } from '@harmonia/i18n';
import {
  SATB_VOICES,
  satbIssueBars,
  checkSatb,
  pitchInputLabel,
  satbAnswer,
  satbAnswerId,
  satbScore,
} from '@harmonia/exercises';
import type { Evaluation, SatbIssue, VoiceLeadingItem, Voice } from '@harmonia/exercises';
import { moveByStep, pitchAt, setPitch } from '@harmonia/notation';
import type { EventRef, Highlight, Score, Pitch } from '@harmonia/notation';
import { ScoreView } from '@harmonia/notation/native';
import { SPACE } from '@harmonia/ui';
import { AppText, Button, Card, useUiTheme } from '@harmonia/ui/native';
import { useMusicLocale } from '@/i18n';
import { AccidentalBar } from './accidental-bar';
import { useExercisePlayback } from './use-exercise-playback';

interface Props {
  readonly item: VoiceLeadingItem;
  readonly answer: string | null;
  readonly result?: Evaluation;
  readonly showSolution: boolean;
  readonly disabled?: boolean;
  readonly onInspect?: () => void;
  readonly onSelect: (answer: string | null) => void;
}
/** Grand-staff overview plus a full, editable staff for the selected SATB voice. */
export function VoiceLeadingAnswerInput({
  item,
  answer,
  result,
  showSolution,
  disabled = false,
  onInspect,
  onSelect,
}: Props) {
  const { t } = useTranslation(),
    locale = useMusicLocale(),
    { colors } = useUiTheme();
  const [voice, setVoice] = useState<Voice>(item.params.mode === 'soprano' ? 'alto' : 'soprano');
  const [bar, setBar] = useState(0),
    [checked, setChecked] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null);
  const [undo, setUndo] = useState<string[]>([]),
    [redo, setRedo] = useState<string[]>([]);
  const [focused, setFocused] = useState(true);
  const drag = useRef<Score | null>(null);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
      };
    }, []),
  );
  const slices = useMemo(() => satbAnswer(item, answer) ?? item.given, [item, answer]);
  const score = useMemo(() => satbScore(slices, item.fifths), [slices, item.fifths]);
  const editScore = useMemo(
    () => satbScore(slices, item.fifths, voice),
    [slices, item.fifths, voice],
  );
  const exampleScore = useMemo(() => satbScore(item.example, item.fifths), [item]);
  const audio = useExercisePlayback(score),
    solo = useExercisePlayback(editScore);
  const exampleAudio = useExercisePlayback(showSolution ? exampleScore : undefined);
  const stop = () => {
    audio.stop();
    solo.stop();
    exampleAudio.stop();
  };
  const report = checkSatb(item, satbAnswerId(slices));
  const showReport = !!result || checked;
  const enabled = focused && !disabled && !result;
  const fixed = item.params.mode === voice;
  const pitch = slices[bar]?.[voice];
  const resetReport = () => {
    setChecked(false);
    setSelectedIssue(null);
    stop();
  };
  const change = (at: number, next: Pitch | null) => {
    if (!enabled || fixed || at < 0 || at > 3) return;
    const value = satbAnswerId(slices.map((s, i) => (i === at ? { ...s, [voice]: next } : s)));
    if (!satbAnswer(item, value) || value === satbAnswerId(slices)) return;
    setUndo((prev) => [...prev.slice(-99), satbAnswerId(slices)]);
    setRedo([]);
    resetReport();
    setBar(at);
    onSelect(value);
  };
  const fromScore = (next: Score, ref: EventRef) => {
    change(ref.measure, pitchAt(next, ref) ?? null);
  };
  const selectVoice = (v: Voice) => {
    stop();
    drag.current = null;
    setVoice(v);
  };
  const issueText = (issue: SatbIssue) =>
    t('exercise.satbIssue', {
      bar: issue.at + 1,
      voices: issue.voices.map((v) => t(`exercise.satb_${v}`)).join(', '),
      severity: t(`exercise.satb_${issue.severity}`),
      reason: t(`exercise.satbRule_${issue.rule}`),
    });
  const visibleIssues = showReport
    ? selectedIssue === null
      ? report.issues
      : report.issues.filter((_, i) => i === selectedIssue)
    : [];
  const highlights: Highlight[] = visibleIssues.flatMap((issue) => {
    return satbIssueBars(issue).flatMap((measure) =>
      issue.voices.map((v) => ({
        kind: issue.severity === 'error' ? ('wrong' as const) : ('active' as const),
        ref: {
          measure,
          event: 0,
          staff: v === 'soprano' || v === 'alto' ? 0 : 1,
          voice: v === 'alto' || v === 'bass' ? 1 : 0,
        },
      })),
    );
  });
  return (
    <View style={{ gap: SPACE.m }} testID="satb-editor">
      <AppText tone="muted">{t('exercise.satbDraft')}</AppText>
      <AppText>
        {item.functions.map((f, i) => `${t('exercise.satbBar', { bar: i + 1 })}: ${f}`).join(' · ')}
      </AppText>
      <AppText variant="small">{t('exercise.satbProfile')}</AppText>
      <AppText variant="small">{t('exercise.satbRanges')}</AppText>
      <Card padding={SPACE.s}>
        <AppText variant="title3">{t('exercise.satbPreview')}</AppText>
        <ScrollView horizontal {...(Platform.OS === 'web' ? { tabIndex: 0 } : {})}>
          <ScoreView
            score={score}
            staffSpace={14}
            color={colors.text}
            describeOptions={engineLanguage(locale)}
            highlights={highlights}
            highlightLabels={{ wrong: t('highlight.wrong'), active: t('exercise.satb_warning') }}
          />
        </ScrollView>
      </Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s }}>
        <Button
          size="medium"
          variant="secondary"
          label={audio.playing ? t('exercise.stop') : t('exercise.satbPlayAll')}
          onPress={() => {
            if (audio.playing) stop();
            else {
              solo.stop();
              exampleAudio.stop();
              void audio.play();
            }
          }}
        />
        <Button
          size="medium"
          variant="secondary"
          label={solo.playing ? t('exercise.stop') : t('exercise.satbPlayVoice')}
          onPress={() => {
            if (solo.playing) stop();
            else {
              audio.stop();
              exampleAudio.stop();
              void solo.play();
            }
          }}
        />
      </View>
      {audio.error || solo.error || exampleAudio.error ? (
        <AppText tone="danger" aria-live="polite">
          {t('exercise.audioError')}
        </AppText>
      ) : null}
      <AppText variant="title3">{t('exercise.satbVoice')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s }}>
        {SATB_VOICES.map((v) => (
          <Button
            key={v}
            testID={`satb-voice-${v}`}
            size="medium"
            selected={voice === v}
            variant={voice === v ? 'primary' : 'secondary'}
            label={t(`exercise.satb_${v}`)}
            onPress={() => {
              selectVoice(v);
            }}
          />
        ))}
      </View>
      <AppText>{fixed ? t('exercise.satbGiven') : t('exercise.satbInputHelp')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s }}>
        {slices.map((s, i) => (
          <Button
            key={i}
            testID={`satb-bar-${String(i + 1)}`}
            size="medium"
            selected={bar === i}
            variant={bar === i ? 'primary' : 'secondary'}
            label={`${t('exercise.satbBar', { bar: i + 1 })}: ${s[voice] ? pitchInputLabel(s[voice], locale) : '—'}`}
            onPress={() => {
              setBar(i);
              drag.current = null;
            }}
          />
        ))}
      </View>
      <Card padding={SPACE.s}>
        <AppText variant="title3">
          {t('exercise.satbEdit', { voice: t(`exercise.satb_${voice}`) })}
        </AppText>
        <ScrollView horizontal {...(Platform.OS === 'web' ? { tabIndex: 0 } : {})}>
          <View testID="satb-input-staff">
            <ScoreView
              score={editScore}
              staffSpace={14}
              color={colors.text}
              describeOptions={engineLanguage(locale)}
              highlights={[{ ref: { measure: bar, event: 0 }, kind: 'active' }]}
              {...(enabled && !fixed
                ? {
                    editable: [0, 1, 2, 3].map((measure) => ({ measure, event: 0 })),
                    onTap: (hit: { measure: number; pitch: Pitch }) => {
                      change(hit.measure, hit.pitch);
                    },
                    onDragNote: (ref: EventRef, steps: number, done: boolean) => {
                      const base = drag.current ?? editScore;
                      drag.current = done ? null : base;
                      fromScore(moveByStep(base, ref, steps), ref);
                    },
                    onAdjustNote: (ref: EventRef, steps: 1 | -1) => {
                      const base = pitchAt(editScore, ref)
                        ? editScore
                        : setPitch(editScore, ref, {
                            letter: 'C',
                            alter: 0,
                            octave: voice === 'bass' || voice === 'tenor' ? 3 : 4,
                          });
                      fromScore(moveByStep(base, ref, steps), ref);
                    },
                  }
                : {})}
            />
          </View>
        </ScrollView>
      </Card>
      <AccidentalBar
        value={pitch?.alter}
        disabled={!enabled || fixed}
        onChange={(alter) => {
          if (pitch) change(bar, { ...pitch, alter });
        }}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s }}>
        <Button
          size="medium"
          variant="ghost"
          label={t('practice.remove')}
          disabled={!enabled || fixed || !pitch}
          onPress={() => {
            change(bar, null);
          }}
        />
        <Button
          size="medium"
          variant="ghost"
          label={t('exercise.satbUndo')}
          disabled={!enabled || !undo.length}
          onPress={() => {
            const value = undo.at(-1);
            if (!value) return;
            setRedo((prev) => [...prev, satbAnswerId(slices)]);
            setUndo((prev) => prev.slice(0, -1));
            resetReport();
            onSelect(value);
          }}
        />
        <Button
          size="medium"
          variant="ghost"
          label={t('exercise.satbRedo')}
          disabled={!enabled || !redo.length}
          onPress={() => {
            const value = redo.at(-1);
            if (!value) return;
            setUndo((prev) => [...prev, satbAnswerId(slices)]);
            setRedo((prev) => prev.slice(0, -1));
            resetReport();
            onSelect(value);
          }}
        />
        <Button
          size="medium"
          variant="ghost"
          label={t('exercise.satbClear')}
          disabled={!enabled || satbAnswerId(slices) === satbAnswerId(item.given)}
          onPress={() => {
            setUndo((prev) => [...prev.slice(-99), satbAnswerId(slices)]);
            setRedo([]);
            resetReport();
            onSelect(satbAnswerId(item.given));
          }}
        />
      </View>
      <AppText aria-live="polite">
        {t('exercise.satbFilled', {
          count: slices.flatMap((s) => SATB_VOICES.map((v) => s[v])).filter(Boolean).length,
        })}
      </AppText>
      {!result && onInspect ? (
        <Button
          label={t('exercise.satbCheck')}
          disabled={!enabled}
          onPress={() => {
            stop();
            onInspect();
            setChecked(true);
            setSelectedIssue(null);
          }}
        />
      ) : null}
      {showReport ? (
        <View testID="satb-findings" style={{ gap: SPACE.s }}>
          <AppText aria-live="polite">
            {t(report.passed ? 'exercise.satbPass' : 'exercise.satbFail', {
              count: report.issues.length,
            })}
          </AppText>
          {report.issues.map((issue, i) => (
            <Button
              key={i}
              size="medium"
              variant="ghost"
              label={issueText(issue)}
              onPress={() => {
                stop();
                setSelectedIssue(i);
                setBar(issue.at);
                const first = issue.voices[0];
                setVoice(first);
              }}
            />
          ))}
        </View>
      ) : null}
      {showSolution ? (
        <Card padding={SPACE.s}>
          <AppText variant="title3">{t('exercise.satbExample')}</AppText>
          <ScrollView horizontal {...(Platform.OS === 'web' ? { tabIndex: 0 } : {})}>
            <ScoreView
              score={exampleScore}
              staffSpace={14}
              color={colors.text}
              describeOptions={engineLanguage(locale)}
            />
          </ScrollView>
          <Button
            size="medium"
            variant="secondary"
            label={exampleAudio.playing ? t('exercise.stop') : t('exercise.play')}
            onPress={() => {
              if (exampleAudio.playing) stop();
              else {
                audio.stop();
                solo.stop();
                void exampleAudio.play();
              }
            }}
          />
        </Card>
      ) : null}
    </View>
  );
}

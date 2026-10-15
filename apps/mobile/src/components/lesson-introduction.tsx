import type { LessonContent } from '@harmonia/content';
import { engineLanguage } from '@harmonia/i18n';
import { parseScore } from '@harmonia/notation';
import { pulseExample } from '@harmonia/exercises';
import { ScoreView, GrandStaffView } from '@harmonia/notation/native';
import { SPACE } from '@harmonia/ui';
import { AppText, Button, Card, MusicText, useUiTheme } from '@harmonia/ui/native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useMusicLocale } from '@/i18n';
import { useContentText } from '@/content/use-content-text';
import { useExercisePlayback } from './use-exercise-playback';
import { EXAMPLE_BPM } from '@/exercises/play-example';
import { KeyboardExample } from './keyboard-example';
import { PulseExample } from './pulse-example';
export function LessonIntroduction({
  lesson,
  onStart,
  onCardChange,
  initialCard = 0,
  onCardSave,
}: {
  readonly lesson: LessonContent;
  readonly onStart: () => void;
  readonly onCardChange: () => void;
  readonly initialCard?: number;
  readonly onCardSave?: (index: number) => void;
}) {
  const { t } = useTranslation();
  const contentText = useContentText();
  const locale = useMusicLocale();
  const { colors } = useUiTheme();
  const [index, setIndex] = useState(initialCard);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [scoreWidth, setScoreWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const card = lesson.introduction[index];
  if (!card) throw new Error('Einführungskarte fehlt');
  const example = card.examples[exampleIndex];
  if (!example) throw new Error('Einführungsbeispiel fehlt');
  const score = useMemo(() => parseScore(example.score), [example.score]);
  const pulse = useMemo(
    () => (example.pulse ? pulseExample(score, example.pulse.bpm) : undefined),
    [score, example.pulse],
  );
  const audio = useExercisePlayback(pulse ?? score);
  const scrollable = viewportWidth > 0 && scoreWidth > viewportWidth + 1;
  return (
    <>
      <AppText variant="small" tone="muted">
        {t('lesson.introProgress', { current: index + 1, total: lesson.introduction.length })}
      </AppText>
      <Card>
        <View style={styles.card}>
          <AppText variant="title2" aria-live="polite">
            {contentText(card.titleKey)}
          </AppText>
          <MusicText>{contentText(card.bodyKey)}</MusicText>
          {card.examples.length > 1 ? (
            <View aria-label={t('lesson.chooseExample')} style={styles.examples}>
              {card.examples.map((choice, choiceIndex) => (
                <Button
                  key={choice.captionKey}
                  size="medium"
                  variant={choiceIndex === exampleIndex ? 'primary' : 'secondary'}
                  label={contentText(choice.captionKey)}
                  onPress={() => {
                    audio.stop();
                    setExampleIndex(choiceIndex);
                  }}
                  disabled={choiceIndex === exampleIndex}
                />
              ))}
            </View>
          ) : (
            <MusicText variant="title3">{contentText(example.captionKey)}</MusicText>
          )}
          {example.keyboard ? (
            <KeyboardExample
              key={`keyboard:${example.score}`}
              score={score}
              range={example.keyboard}
              showOctaves={example.keyboard.showOctaves ?? false}
            />
          ) : null}
          {pulse ? (
            <PulseExample item={pulse} />
          ) : (
            <ScrollView
              key={`score:${example.score}`}
              testID="lesson-example-scroll"
              horizontal
              {...(Platform.OS === 'web'
                ? { tabIndex: 0, 'aria-label': t('lesson.scrollExample') }
                : {})}
              contentContainerStyle={styles.score}
              onLayout={(event) => {
                setViewportWidth(event.nativeEvent.layout.width);
              }}
              onContentSizeChange={(width) => {
                setScoreWidth(width);
              }}
              {...(Platform.OS === 'web' && scrollable ? { tabIndex: 0 } : {})}
            >
              {score.staves.length === 2 ? (
                <View accessible role="img" aria-label={contentText(example.captionKey)}>
                  <GrandStaffView score={score} staffSpace={14} color={colors.text} />
                </View>
              ) : (
                <ScoreView
                  score={score}
                  staffSpace={14}
                  color={colors.text}
                  describeOptions={engineLanguage(locale)}
                  layoutOptions={{ endBarline: 'final' }}
                />
              )}
            </ScrollView>
          )}
          {!pulse && scrollable ? (
            <AppText variant="footnote" tone="muted">
              {t('lesson.scrollExample')}
            </AppText>
          ) : null}
          <AppText variant="footnote" tone="muted">
            {t(pulse ? 'lesson.pulseExampleTempo' : 'lesson.exampleTempo', {
              bpm: pulse?.bpm ?? EXAMPLE_BPM,
            })}
          </AppText>
          <Button
            variant="secondary"
            icon="speaker"
            label={audio.playing ? t('exercise.stop') : t('lesson.example')}
            onPress={
              audio.playing
                ? audio.stop
                : () => {
                    void audio.play();
                  }
            }
          />
          {audio.error ? (
            <AppText tone="danger" aria-live="polite">
              {t('exercise.audioError')}
            </AppText>
          ) : null}
        </View>
      </Card>
      <Button
        label={
          index === lesson.introduction.length - 1
            ? t('lesson.start', { count: lesson.exercises.length })
            : t('lesson.introNext')
        }
        onPress={() => {
          audio.stop();
          if (index === lesson.introduction.length - 1) onStart();
          else {
            setIndex(index + 1);
            onCardSave?.(index + 1);
            setExampleIndex(0);
            onCardChange();
          }
        }}
      />
    </>
  );
}
const styles = StyleSheet.create({
  card: { gap: SPACE.m },
  examples: { gap: SPACE.s },
  score: { flexGrow: 0, justifyContent: 'center', minWidth: '100%' },
});

import type { LessonContent } from '@harmonia/content';
import { engineLanguage } from '@harmonia/i18n';
import { parseScore } from '@harmonia/notation';
import { ScoreView } from '@harmonia/notation/native';
import { SPACE } from '@harmonia/ui';
import { AppText, Button, Card, MusicText, useUiTheme } from '@harmonia/ui/native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useLocale } from '@/i18n';
import { useContentText } from '@/content/use-content-text';
import { useExercisePlayback } from './use-exercise-playback';
import { EXAMPLE_BPM } from '@/exercises/play-example';
export function LessonIntroduction({
  lesson,
  onStart,
  onCardChange,
}: {
  readonly lesson: LessonContent;
  readonly onStart: () => void;
  readonly onCardChange: () => void;
}) {
  const { t } = useTranslation();
  const contentText = useContentText();
  const locale = useLocale();
  const { colors } = useUiTheme();
  const [index, setIndex] = useState(0);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [scoreWidth, setScoreWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const card = lesson.introduction[index];
  if (!card) throw new Error('Einführungskarte fehlt');
  const example = card.examples[exampleIndex];
  if (!example) throw new Error('Einführungsbeispiel fehlt');
  const score = useMemo(() => parseScore(example.score), [example.score]);
  const audio = useExercisePlayback(score);
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
          <ScrollView
            key={example.score}
            testID="lesson-example-scroll"
            horizontal
            contentContainerStyle={styles.score}
            onLayout={(event) => {
              setViewportWidth(event.nativeEvent.layout.width);
            }}
            onContentSizeChange={(width) => {
              setScoreWidth(width);
            }}
            {...(Platform.OS === 'web' && scrollable ? { tabIndex: 0 } : {})}
          >
            <ScoreView
              score={score}
              staffSpace={14}
              color={colors.text}
              describeOptions={engineLanguage(locale)}
              layoutOptions={{ endBarline: 'final' }}
            />
          </ScrollView>
          {scrollable ? (
            <AppText variant="footnote" tone="muted">
              {t('lesson.scrollExample')}
            </AppText>
          ) : null}
          <AppText variant="footnote" tone="muted">
            {t('lesson.exampleTempo', { bpm: EXAMPLE_BPM })}
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

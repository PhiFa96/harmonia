import { firstLesson } from '@harmonia/content';
import type { ExerciseItem } from '@harmonia/exercises';
import { engineLanguage } from '@harmonia/i18n';
import { parseScore } from '@harmonia/notation';
import { ScoreView } from '@harmonia/notation/native';
import { SPACE } from '@harmonia/ui';
import { AppText, Button, Card, MusicText, useUiTheme } from '@harmonia/ui/native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocale } from '@/i18n';
import { useExercisePlayback } from './use-exercise-playback';

/** Die maschinenlesbaren Referenznoten sind zugleich die Quelle für Notenbild und Klang. */
export function referenceItem(source: string): ExerciseItem {
  const score = parseScore(source);
  const notes = score.staves[0]?.measures[0]?.voices[0]?.events;
  const first = notes?.[0];
  const second = notes?.[1];
  if (first?.kind !== 'note') throw new Error('Referenznote fehlt');
  const base = { score, clef: 'treble' as const, choices: [] };
  if (!second) return { ...base, type: 'NOTE_NAME', pitch: first.pitch };
  if (second.kind !== 'note') throw new Error('Referenzintervall fehlt');
  return {
    ...base,
    type: 'INTERVAL_IDENTIFY_VISUAL',
    from: first.pitch,
    to: second.pitch,
    playback: 'melodic-up',
  };
}
export function LessonIntroduction({
  onStart,
  onCardChange,
}: {
  readonly onStart: () => void;
  readonly onCardChange: () => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const { colors } = useUiTheme();
  const [index, setIndex] = useState(0);
  const [exampleIndex, setExampleIndex] = useState(0);
  const card = firstLesson.introduction[index];
  if (!card) throw new Error('Einführungskarte fehlt');
  const example = card.examples[exampleIndex];
  if (!example) throw new Error('Einführungsbeispiel fehlt');
  const item = useMemo(() => referenceItem(example.score), [example.score]);
  const audio = useExercisePlayback(item);
  return (
    <>
      <AppText variant="small" tone="muted">
        {t('lesson.introProgress', { current: index + 1, total: firstLesson.introduction.length })}
      </AppText>
      <Card>
        <View style={styles.card}>
          <AppText variant="title2" aria-live="polite">
            {t(card.titleKey)}
          </AppText>
          <MusicText>{t(card.bodyKey)}</MusicText>
          {card.examples.length > 1 ? (
            <View aria-label={t('lesson.chooseExample')} style={styles.examples}>
              {card.examples.map((choice, choiceIndex) => (
                <Button
                  key={choice.captionKey}
                  size="medium"
                  variant={choiceIndex === exampleIndex ? 'primary' : 'secondary'}
                  label={t(choice.captionKey)}
                  onPress={() => {
                    audio.stop();
                    setExampleIndex(choiceIndex);
                  }}
                  disabled={choiceIndex === exampleIndex}
                />
              ))}
            </View>
          ) : (
            <MusicText variant="title3">{t(example.captionKey)}</MusicText>
          )}
          <ScrollView horizontal contentContainerStyle={styles.score}>
            <ScoreView
              score={item.score}
              staffSpace={14}
              color={colors.text}
              describeOptions={engineLanguage(locale)}
              layoutOptions={{ endBarline: 'final' }}
            />
          </ScrollView>
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
          index === firstLesson.introduction.length - 1 ? t('lesson.start') : t('lesson.introNext')
        }
        onPress={() => {
          audio.stop();
          if (index === firstLesson.introduction.length - 1) onStart();
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

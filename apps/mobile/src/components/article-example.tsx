import type { ResolvedKnowledgeArticle, KnowledgeLocale } from '@harmonia/content';
import { pulseExample } from '@harmonia/exercises';
import { engineLanguage } from '@harmonia/i18n';
import { parseScore } from '@harmonia/notation';
import { ScoreView, GrandStaffView } from '@harmonia/notation/native';
import { SPACE } from '@harmonia/ui';
import { AppText, Button, Card, MusicText, useUiTheme } from '@harmonia/ui/native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { EXAMPLE_BPM } from '@/exercises/play-example';
import { KeyboardExample } from './keyboard-example';
import { PulseExample } from './pulse-example';
import { useExercisePlayback } from './use-exercise-playback';

export function ArticleExample({
  example,
  locale,
}: {
  readonly example: Pick<
    ResolvedKnowledgeArticle['sections'][number]['examples'][number],
    'score' | 'caption' | 'pulse' | 'keyboard'
  >;
  readonly locale: KnowledgeLocale;
}) {
  const { t } = useTranslation(),
    { colors } = useUiTheme();
  const score = useMemo(() => parseScore(example.score), [example.score]);
  const pulse = useMemo(
    () => (example.pulse ? pulseExample(score, example.pulse.bpm) : undefined),
    [score, example.pulse],
  );
  const audio = useExercisePlayback(pulse ?? score);
  const [width, setWidth] = useState(0),
    [viewport, setViewport] = useState(0);
  const scrollable = viewport > 0 && width > viewport + 1;
  return (
    <Card>
      <View style={styles.content}>
        <MusicText variant="title3">{example.caption}</MusicText>
        {example.keyboard ? (
          <KeyboardExample
            score={score}
            range={example.keyboard}
            showOctaves={example.keyboard.showOctaves ?? false}
            locale={locale}
          />
        ) : null}
        {pulse ? (
          <PulseExample item={pulse} />
        ) : (
          <ScrollView
            horizontal
            contentContainerStyle={styles.score}
            onLayout={(event) => {
              setViewport(event.nativeEvent.layout.width);
            }}
            onContentSizeChange={(value) => {
              setWidth(value);
            }}
            {...(Platform.OS === 'web' && scrollable ? { tabIndex: 0 } : {})}
          >
            {score.staves.length === 2 ? (
              <View accessible role="img" aria-label={example.caption}>
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
  );
}
const styles = StyleSheet.create({
  content: { gap: SPACE.m },
  score: { flexGrow: 0, justifyContent: 'center', minWidth: '100%' },
});

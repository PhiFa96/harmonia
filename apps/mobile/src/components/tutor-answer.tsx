import type { TutorAnswer, TutorExample, KnowledgeLocale } from '@harmonia/content';
import { engineLanguage } from '@harmonia/i18n';
import { describeScore } from '@harmonia/notation';
import { ScoreView, GrandStaffView } from '@harmonia/notation/native';
import { SPACE } from '@harmonia/ui';
import { AppText, Button, Card, MusicText, useUiTheme } from '@harmonia/ui/native';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { checkedTutorExample } from '@/tutor/example';
import { useExercisePlayback } from './use-exercise-playback';

export function TutorAnswerCard({
  answer,
  locale,
  streaming = false,
  onReport,
}: {
  readonly answer: TutorAnswer;
  readonly locale: KnowledgeLocale;
  readonly streaming?: boolean;
  readonly onReport?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <View style={styles.content}>
        <AppText variant="overline">{t('tutor.assistant')}</AppText>
        {answer.simulation ? (
          <AppText variant="footnote" tone="accent">
            {t('tutor.simulation')}
          </AppText>
        ) : null}
        <MusicText selectable testID="tutor-answer-text">
          {answer.text}
        </MusicText>
        {streaming ? (
          <AppText variant="footnote" aria-live="polite">
            {t('tutor.sending')}
          </AppText>
        ) : answer.status !== 'complete' ? (
          <AppText variant="footnote" aria-live="polite">
            {t(`tutor.status_${answer.status}`)}
          </AppText>
        ) : null}
        {answer.examples.map((example) => (
          <TutorExampleView key={example.id} example={example} locale={locale} />
        ))}
        {answer.citations?.length ? (
          <>
            <AppText variant="title3">{t('tutor.sources')}</AppText>
            {answer.citations.map((citation, index) => (
              <View key={citation.id} style={styles.content}>
                <Button
                  variant="ghost"
                  size="medium"
                  label={t('tutor.source', {
                    number: index + 1,
                    title: citation.title,
                    heading: citation.heading,
                  })}
                  disabled={streaming}
                  onPress={() => {
                    router.push(citation.href);
                  }}
                />
                <MusicText variant="small" tone="muted" selectable>
                  {citation.quote}
                </MusicText>
                {citation.preview ? (
                  <AppText variant="footnote" tone="muted">
                    {t('tutor.previewSource')}
                  </AppText>
                ) : null}
              </View>
            ))}
          </>
        ) : !streaming && answer.text ? (
          <AppText variant="footnote" tone="muted">
            {t('tutor.noSource')}
          </AppText>
        ) : null}
        {answer.errors.includes('invalid_citation') ? (
          <AppText variant="footnote">{t('tutor.invalidSource')}</AppText>
        ) : null}
        {onReport && (answer.text || answer.examples.length) ? (
          <Button variant="ghost" size="medium" label={t('tutor.report')} onPress={onReport} />
        ) : null}
      </View>
    </Card>
  );
}
export function TutorExampleView({
  example,
  locale,
}: {
  readonly example: TutorExample;
  readonly locale: KnowledgeLocale;
}) {
  const { t } = useTranslation(),
    { colors } = useUiTheme();
  const score = useMemo(() => {
    try {
      return checkedTutorExample(example.example);
    } catch {
      return undefined;
    }
  }, [example.example]);
  const audio = useExercisePlayback(score, example.example.bpm);
  const [width, setWidth] = useState(0),
    [viewport, setViewport] = useState(0);
  if (!score) return <AppText tone="danger">{t('tutor.invalidExample')}</AppText>;
  const scrollable = viewport > 0 && width > viewport + 1;
  return (
    <View style={styles.content} testID="tutor-example">
      <AppText variant="title3">{t('tutor.example')}</AppText>
      <ScrollView
        horizontal
        onLayout={(event) => {
          setViewport(event.nativeEvent.layout.width);
        }}
        onContentSizeChange={(value) => {
          setWidth(value);
        }}
        {...(Platform.OS === 'web' && scrollable ? { tabIndex: 0 } : {})}
      >
        <View
          accessible
          role="img"
          aria-label={describeScore(score, engineLanguage(locale))
            .map((v) => v.text)
            .join('; ')}
        >
          <View aria-hidden importantForAccessibility="no-hide-descendants">
            {score.staves.length === 2 ? (
              <GrandStaffView score={score} staffSpace={14} color={colors.text} />
            ) : (
              <ScoreView
                score={score}
                staffSpace={14}
                color={colors.text}
                describeOptions={engineLanguage(locale)}
                layoutOptions={{ endBarline: 'final' }}
              />
            )}
          </View>
        </View>
      </ScrollView>
      {scrollable ? (
        <AppText variant="footnote" tone="muted">
          {t('lesson.scrollExample')}
        </AppText>
      ) : null}
      <AppText variant="footnote" tone="muted">
        {t('lesson.exampleTempo', { bpm: example.example.bpm })}
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
  );
}
const styles = StyleSheet.create({ content: { gap: SPACE.s } });

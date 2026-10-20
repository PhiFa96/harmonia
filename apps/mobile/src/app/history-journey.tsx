import {
  answerHistoryQuestion,
  knowledgeArticleHref,
  knowledgeArticleParts,
  knowledgeChunkFingerprint,
} from '@harmonia/content';
import type { HistoryChoice, HistoryStop } from '@harmonia/content';
import { historyStops } from '@harmonia/content/history-journey';
import { catalogue, knowledgeStages } from '@harmonia/content/catalogue';
import { contentTranslator } from '@harmonia/i18n';
import { contentMessages } from '@harmonia/i18n/content-messages';
import { historyJourneyMessages } from '@harmonia/i18n/history-journey';
import { parseScore } from '@harmonia/notation';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card, MusicText } from '@harmonia/ui/native';
import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ArticleExample } from '@/components/article-example';
import { useExercisePlayback } from '@/components/use-exercise-playback';
import { useLocale } from '@/i18n';

type Step = 'scene' | 'interview' | 'knowledge' | 'listening' | 'complete';
const STEPS: readonly Step[] = ['scene', 'interview', 'knowledge', 'listening', 'complete'];

export default function HistoryJourneyScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [selected, setSelected] = useState<HistoryStop | null>(null);
  const [step, setStep] = useState<Step>('scene');
  const [choice, setChoice] = useState<HistoryChoice | null>(null);
  const [checked, setChecked] = useState(false);
  const [sourceError, setSourceError] = useState(false);
  const copy = selected ? historyJourneyMessages[locale][selected.id] : null;
  const chooseStop = (stop: HistoryStop | null) => {
    setSelected(stop);
    setStep('scene');
    setChoice(null);
    setChecked(false);
    setSourceError(false);
  };
  const next = () => {
    setStep(STEPS[STEPS.indexOf(step) + 1] ?? 'complete');
    setChoice(null);
    setChecked(false);
  };
  const back = () => {
    const previous = STEPS[STEPS.indexOf(step) - 1];
    if (previous) {
      setStep(previous);
      setChoice(null);
      setChecked(false);
    } else chooseStop(null);
  };
  const openSource = async (stop: HistoryStop) => {
    setSourceError(false);
    try {
      const article = catalogue.knowledgeArticles.find(
        (entry) => entry.id === stop.source.articleId,
      );
      const stage = knowledgeStages[stop.source.articleId];
      if (!article || !stage) throw new Error('Missing source');
      const translate = contentTranslator(locale, contentMessages);
      const part = knowledgeArticleParts(article, stage, locale, translate).find(
        (entry) => entry.section === stop.source.section && entry.part === 0,
      );
      if (!part) throw new Error('Missing source section');
      const id = await digestStringAsync(
        CryptoDigestAlgorithm.SHA256,
        knowledgeChunkFingerprint(part),
      );
      router.push(knowledgeArticleHref({ ...part, id }));
    } catch {
      setSourceError(true);
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('historyJourney.title') }} />
      <View style={styles.content}>
        <MusicText variant="title1" role="heading">
          {t('historyJourney.title')}
        </MusicText>
        {historyStops.length ? (
          <>
            <AppText>{t('historyJourney.intro')}</AppText>
            <Card>
              <AppText>{t('historyJourney.draft')}</AppText>
            </Card>
          </>
        ) : null}
        {!selected ? (
          historyStops.length ? (
            historyStops.map((stop) => (
              <Button
                key={stop.id}
                variant="secondary"
                label={historyJourneyMessages[locale][stop.id].title}
                onPress={() => {
                  chooseStop(stop);
                }}
              />
            ))
          ) : (
            <AppText>{t('historyJourney.unavailable')}</AppText>
          )
        ) : copy ? (
          <>
            <MusicText variant="title2" role="heading">
              {copy.title}
            </MusicText>
            {step === 'scene' ? (
              <>
                <AppText variant="title3" role="heading">
                  {t('historyJourney.scene')}
                </AppText>
                <AppText>{copy.scene}</AppText>
                <ArticleExample
                  example={{ score: selected.sceneScore, caption: copy.modelCaption }}
                  locale={locale}
                />
              </>
            ) : null}
            {step === 'interview' ? (
              <Card>
                <View style={styles.content}>
                  <AppText variant="title3" role="heading">
                    {t('historyJourney.interview')}
                  </AppText>
                  <AppText>{t('historyJourney.fictional')}</AppText>
                  <MusicText variant="title3">{copy.personaName}</MusicText>
                  <AppText>{copy.personaPrompt}</AppText>
                  <AppText>{copy.personaReply}</AppText>
                </View>
              </Card>
            ) : null}
            {step === 'knowledge' || step === 'listening' ? (
              <Question
                key={`${selected.id}:${step}`}
                stop={selected}
                step={step}
                copy={copy}
                choice={choice}
                checked={checked}
                onChoice={(value) => {
                  setChoice(value);
                  setChecked(false);
                }}
                onCheck={() => {
                  setChecked(true);
                }}
                onSkip={next}
              />
            ) : null}
            {step === 'complete' ? (
              <Card>
                <AppText>{t('historyJourney.complete')}</AppText>
              </Card>
            ) : null}
            <Button
              variant="secondary"
              label={t('historyJourney.source')}
              onPress={() => {
                void openSource(selected);
              }}
            />
            {sourceError ? <AppText role="alert">{t('historyJourney.sourceError')}</AppText> : null}
            <View style={styles.actions}>
              <Button variant="ghost" label={t('historyJourney.back')} onPress={back} />
              <Button
                label={t(step === 'complete' ? 'historyJourney.finish' : 'historyJourney.next')}
                disabled={
                  (step === 'knowledge' || step === 'listening') &&
                  (!checked ||
                    choice === null ||
                    !answerHistoryQuestion(
                      step === 'knowledge' ? selected.knowledgeAnswer : selected.listeningAnswer,
                      choice,
                    ))
                }
                onPress={() => {
                  if (step === 'complete') chooseStop(null);
                  else next();
                }}
              />
            </View>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

type StoryCopy = (typeof historyJourneyMessages)['de']['medieval'];
function Question({
  stop,
  step,
  copy,
  choice,
  checked,
  onChoice,
  onCheck,
  onSkip,
}: {
  readonly stop: HistoryStop;
  readonly step: 'knowledge' | 'listening';
  readonly copy: StoryCopy;
  readonly choice: HistoryChoice | null;
  readonly checked: boolean;
  readonly onChoice: (value: HistoryChoice) => void;
  readonly onCheck: () => void;
  readonly onSkip: () => void;
}) {
  const { t } = useTranslation();
  const score = useMemo(
    () => (step === 'listening' ? parseScore(stop.listeningScore) : undefined),
    [step, stop.listeningScore],
  );
  const audio = useExercisePlayback(score);
  const listening = step === 'listening';
  const options = listening ? copy.listeningOptions : copy.knowledgeOptions;
  const correct = listening ? stop.listeningAnswer : stop.knowledgeAnswer;
  return (
    <Card>
      <View style={styles.content}>
        <AppText variant="title3" role="heading">
          {t(listening ? 'historyJourney.listening' : 'historyJourney.knowledge')}
        </AppText>
        {listening ? (
          <>
            <AppText>{copy.modelCaption}</AppText>
            <Button
              variant="secondary"
              icon="speaker"
              label={t(audio.playing ? 'historyJourney.stop' : 'historyJourney.play')}
              onPress={
                audio.playing
                  ? audio.stop
                  : () => {
                      void audio.play();
                    }
              }
            />
            {audio.error ? <AppText role="alert">{t('historyJourney.audioError')}</AppText> : null}
          </>
        ) : null}
        <AppText>{listening ? copy.listeningPrompt : copy.knowledgePrompt}</AppText>
        {options.map((option, index) => (
          <Button
            key={index}
            variant={choice === index ? 'primary' : 'secondary'}
            label={option}
            disabled={checked && choice === correct}
            onPress={() => {
              onChoice(index as HistoryChoice);
            }}
          />
        ))}
        <Button
          label={t('historyJourney.check')}
          disabled={choice === null || checked || (listening && !audio.heard)}
          onPress={onCheck}
        />
        {listening ? (
          <Button variant="ghost" label={t('historyJourney.skipListening')} onPress={onSkip} />
        ) : null}
        {checked && choice !== null ? (
          <AppText aria-live="polite">
            {t(
              answerHistoryQuestion(correct, choice)
                ? 'historyJourney.correct'
                : 'historyJourney.incorrect',
            )}{' '}
            {listening ? copy.listeningExplanation : copy.knowledgeExplanation}
          </AppText>
        ) : null}
      </View>
    </Card>
  );
}
const styles = StyleSheet.create({
  container: { padding: LAYOUT.screenPadding, paddingBottom: SPACE.xxxl },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', gap: SPACE.m },
  actions: { flexDirection: 'row', gap: SPACE.m, flexWrap: 'wrap' },
});

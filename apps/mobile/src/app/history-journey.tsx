import {
  createHistoryQuestion,
  chooseHistoryAnswer,
  checkHistoryQuestion,
  knowledgeArticleHref,
  knowledgeArticleParts,
  knowledgeChunkFingerprint,
} from '@harmonia/content';
import type { HistoryChoice, HistoryStop, HistoryQuestionState } from '@harmonia/content';
import { historyStops } from '@harmonia/content/history-journey';
import { catalogue, knowledgeStages } from '@harmonia/content/catalogue';
import { contentTranslator, createHistoryJourneyText } from '@harmonia/i18n';
import type { HistoryJourneyText } from '@harmonia/i18n';
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
  const historyText = useMemo(
    () => createHistoryJourneyText(locale, historyJourneyMessages),
    [locale],
  );
  const [selected, setSelected] = useState<HistoryStop | null>(null);
  const [step, setStep] = useState<Step>('scene');
  const [question, setQuestion] = useState(createHistoryQuestion);
  const [sourceError, setSourceError] = useState(false);
  const copy = selected ? historyText(selected.id) : null;
  const chooseStop = (stop: HistoryStop | null) => {
    setSelected(stop);
    setStep('scene');
    setQuestion(createHistoryQuestion());
    setSourceError(false);
  };
  const next = () => {
    setStep(STEPS[STEPS.indexOf(step) + 1] ?? 'complete');
    setQuestion(createHistoryQuestion());
  };
  const back = () => {
    const previous = STEPS[STEPS.indexOf(step) - 1];
    if (previous) {
      setStep(previous);
      setQuestion(createHistoryQuestion());
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
                label={historyText(stop.id).title}
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
                question={question}
                onChoice={(value) => {
                  setQuestion((state) => chooseHistoryAnswer(state, value));
                }}
                onCheck={(ready) => {
                  setQuestion((state) =>
                    checkHistoryQuestion(
                      state,
                      step === 'knowledge' ? selected.knowledgeAnswer : selected.listeningAnswer,
                      ready,
                    ),
                  );
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
                  (step === 'knowledge' || step === 'listening') && question.feedback !== 'correct'
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

function Question({
  stop,
  step,
  copy,
  question,
  onChoice,
  onCheck,
  onSkip,
}: {
  readonly stop: HistoryStop;
  readonly step: 'knowledge' | 'listening';
  readonly copy: HistoryJourneyText;
  readonly question: HistoryQuestionState;
  readonly onChoice: (value: HistoryChoice) => void;
  readonly onCheck: (ready: boolean) => void;
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
            variant={question.choice === index ? 'primary' : 'secondary'}
            selected={question.choice === index}
            label={option}
            disabled={question.feedback === 'correct'}
            onPress={() => {
              onChoice(index as HistoryChoice);
            }}
          />
        ))}
        <Button
          label={t('historyJourney.check')}
          disabled={
            question.choice === null ||
            question.feedback !== 'unanswered' ||
            (listening && !audio.heard)
          }
          onPress={() => {
            onCheck(!listening || audio.heard);
          }}
        />
        {listening ? (
          <Button variant="ghost" label={t('historyJourney.skipListening')} onPress={onSkip} />
        ) : null}
        {question.feedback !== 'unanswered' ? (
          <AppText key={question.attempts} aria-live="polite">
            {t(
              question.feedback === 'correct'
                ? 'historyJourney.correct'
                : 'historyJourney.incorrect',
            )}{' '}
            {question.feedback === 'correct'
              ? listening
                ? copy.listeningExplanation
                : copy.knowledgeExplanation
              : listening
                ? copy.listeningHint
                : copy.knowledgeHint}
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

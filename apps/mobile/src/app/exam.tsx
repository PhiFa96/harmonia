import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  answerExam,
  availableExamTemplates,
  createExamRun,
  examResult,
  finishExam,
  skipExamAural,
} from '@harmonia/content';
import type { ExamRun, ExamTemplateId } from '@harmonia/content';
import { catalogue, examTemplates } from '@harmonia/content/catalogue';
import { currentItem, exercisePrompt } from '@harmonia/exercises';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { ExerciseTask } from '@/components/exercise-task';
import { useContentText } from '@/content/use-content-text';
import { useLocale } from '@/i18n';
import { useLearningState } from '@/state/learning';

function timeLabel(ms: number): string {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function ExamScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const contentText = useContentText();
  const path = useLearningState((state) => state.path);
  const [run, setRun] = useState<ExamRun | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);
  const [error, setError] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const question = useRef<View>(null);
  const templates = availableExamTemplates(catalogue, examTemplates);
  const item = run ? currentItem(run.session) : undefined;
  const index = run?.session.index;
  const active = run && run.endedAt === undefined;

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      const instant = Date.now();
      setNow(instant);
      setRun((current) => (current ? finishExamIfExpired(current, instant) : current));
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [active]);

  useFocusEffect(
    useCallback(() => {
      if (!active || !item) return;
      scroll.current?.scrollTo({ y: 0, animated: false });
      const prompt = exercisePrompt(item, locale);
      if (Platform.OS === 'web')
        (question.current as unknown as HTMLElement | null)?.focus({ preventScroll: true });
      else if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(prompt);
    }, [active, index, item, locale]),
  );

  function start(id: ExamTemplateId) {
    try {
      const instant = Date.now();
      setRun(createExamRun(catalogue, examTemplates, id, instant, instant));
      setNow(instant);
      setAnswer(null);
      setError(false);
      setConfirmSubmit(false);
      scroll.current?.scrollTo({ y: 0, animated: false });
    } catch {
      setError(true);
    }
  }

  const result = run?.endedAt !== undefined ? examResult(run) : undefined;
  return (
    <ScrollView ref={scroll} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('exam.title') }} />
      <View style={styles.content}>
        {error ? <AppText role="alert">{t('exam.unavailable')}</AppText> : null}
        {!run ? (
          <>
            <AppText variant="title1">{t('exam.title')}</AppText>
            <AppText>{t('exam.intro')}</AppText>
            {templates.length === 0 ? <AppText>{t('exam.unavailable')}</AppText> : null}
            {templates.map((template) => (
              <Card key={template.id}>
                <View style={styles.card}>
                  <AppText variant="title3">{t(`exam.template_${template.id}`)}</AppText>
                  <AppText>
                    {t('exam.templateDetails', {
                      count: template.questions.length,
                      minutes: template.minutes,
                      points: template.questions.length * template.pointsPerQuestion,
                    })}
                  </AppText>
                  <Button
                    label={t('exam.start')}
                    onPress={() => {
                      start(template.id);
                    }}
                  />
                </View>
              </Card>
            ))}
          </>
        ) : result ? (
          <>
            <AppText variant="title1">{t('exam.result')}</AppText>
            <AppText>
              {t(
                run.endReason === 'timeout'
                  ? 'exam.end_timeout'
                  : run.endReason === 'completed'
                    ? 'exam.end_completed'
                    : 'exam.end_submitted',
              )}
            </AppText>
            <Card>
              <View style={styles.card}>
                <AppText variant="title2">
                  {t('exam.points', { points: result.points, maximum: result.maxPoints })}
                </AppText>
                {result.areas.map((area) => (
                  <AppText key={area.area}>
                    {t(`exam.area_${area.area}`)}:{' '}
                    {t('exam.areaPoints', {
                      points: area.points,
                      maximum: area.maxPoints,
                      correct: area.correct,
                      count: area.total,
                    })}
                  </AppText>
                ))}
              </View>
            </Card>
            <AppText variant="title3">{t('exam.recommendations')}</AppText>
            {result.recommendations.length === 0 ? (
              <AppText>{t('exam.noRecommendations')}</AppText>
            ) : (
              result.recommendations.map((id) => {
                const lesson = catalogue.lessons.find((entry) => entry.id === id);
                const status = path
                  .flatMap((unit) => unit.lessons)
                  .find((entry) => entry.id === id)?.status;
                return (
                  <Card key={id}>
                    <View style={styles.card}>
                      <AppText>{lesson ? contentText(lesson.titleKey) : id}</AppText>
                      {status && status !== 'locked' ? (
                        <Button
                          variant="secondary"
                          label={t('exam.openLesson')}
                          onPress={() => {
                            router.push({ pathname: '/lesson', params: { id } });
                          }}
                        />
                      ) : (
                        <>
                          <AppText tone="muted">{t('exam.lockedLesson')}</AppText>
                          <Button
                            variant="secondary"
                            label={t('exam.openPath')}
                            onPress={() => {
                              router.dismissTo('/');
                            }}
                          />
                        </>
                      )}
                    </View>
                  </Card>
                );
              })
            )}
            <Button
              label={t('exam.newExam')}
              onPress={() => {
                setRun(null);
                setConfirmSubmit(false);
              }}
            />
          </>
        ) : item ? (
          <>
            <AppText variant="title2">
              {t('exam.remaining', { time: timeLabel(run.deadlineAt - now) })}
            </AppText>
            <AppText tone="muted">{t('exam.noHints')}</AppText>
            <AppText variant="title3">
              {t(`exam.area_${run.template.questions[run.session.index]?.area ?? 'theory'}`)}
            </AppText>
            <ExerciseTask
              key={run.session.index}
              hintsAllowed={false}
              scrollAfterCheck={false}
              session={run.session}
              item={item}
              answer={answer}
              question={question}
              scroll={scroll}
              progressText={t('exercise.progress', {
                current: run.session.index + 1,
                total: run.session.items.length,
              })}
              progressLabel={t('exercise.progressLabel')}
              hearingPausedText={t('exercise.hearingPaused')}
              continueLabel={t('exercise.next')}
              onSelect={setAnswer}
              onCheck={(value) => {
                const instant = Date.now();
                setRun((current) => (current ? answerExam(current, value, instant) : current));
                setAnswer(null);
              }}
              onHint={() => undefined}
              onSkip={() => {
                const instant = Date.now();
                setRun((current) => (current ? skipExamAural(current, instant) : current));
                setAnswer(null);
              }}
              onNext={() => undefined}
            />
            {confirmSubmit ? (
              <Card>
                <View style={styles.card}>
                  <AppText>{t('exam.confirmSubmit')}</AppText>
                  <Button
                    label={t('exam.confirmYes')}
                    onPress={() => {
                      setRun((current) => (current ? finishExam(current, Date.now()) : current));
                      setConfirmSubmit(false);
                    }}
                  />
                  <Button
                    variant="secondary"
                    label={t('exam.continue')}
                    onPress={() => {
                      setConfirmSubmit(false);
                    }}
                  />
                </View>
              </Card>
            ) : (
              <Button
                variant="ghost"
                label={t('exam.submitEarly')}
                onPress={() => {
                  setConfirmSubmit(true);
                }}
              />
            )}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

function finishExamIfExpired(run: ExamRun, now: number): ExamRun {
  return now >= run.deadlineAt ? finishExam(run, now) : run;
}

const styles = StyleSheet.create({
  container: { padding: LAYOUT.screenPadding, paddingBottom: SPACE.xl },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', gap: SPACE.m },
  card: { gap: SPACE.s },
});

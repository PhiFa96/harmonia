import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, Stack, useFocusEffect } from 'expo-router';
import { AppState, Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createRng, createSession, generateExercise } from '@harmonia/exercises';
import { lessonDay, nextPuzzleReset } from '@harmonia/content';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { ExerciseTask } from '@/components/exercise-task';
import { useAuthState } from '@/auth';
import { deviceTimeZone } from '@/state/motivation';
import { answerDailyPuzzle, refreshDailyPuzzle, useDailyPuzzle } from '@/state/daily-puzzle';

export default function DailyPuzzleScreen() {
  const { t } = useTranslation();
  const actor = useAuthState((state) => state.session?.user.id ?? null);
  const state = useDailyPuzzle();
  const [answer, setAnswer] = useState<string | null>(null);
  const [clock, setClock] = useState(Date.now());
  const scroll = useRef<ScrollView>(null),
    question = useRef<View>(null);
  const timeZone = deviceTimeZone() || 'UTC';
  const lastZone = useRef(timeZone);
  const view =
    actor && state.owner === actor && state.view?.day === lessonDay(clock, timeZone)
      ? state.view
      : null;
  const load = useCallback(() => {
    if (actor) void refreshDailyPuzzle(deviceTimeZone() || 'UTC');
  }, [actor]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  useEffect(() => {
    setAnswer(null);
  }, [actor, view?.day]);
  useEffect(() => {
    let midnight: ReturnType<typeof setTimeout> | undefined;
    const armMidnight = () => {
      if (midnight) clearTimeout(midnight);
      const zone = deviceTimeZone() || 'UTC';
      midnight = setTimeout(
        () => {
          setClock(Date.now());
          load();
          armMidnight();
        },
        Math.max(1, nextPuzzleReset(Date.now(), zone) - Date.now() + 25),
      );
    };
    armMidnight();
    const timer = setInterval(() => {
      const now = Date.now();
      setClock(now);
      const current = useDailyPuzzle.getState().view;
      const zone = deviceTimeZone() || 'UTC';
      if (lastZone.current !== zone) armMidnight();
      if (actor && (lastZone.current !== zone || current?.day !== lessonDay(now, zone))) load();
      lastZone.current = zone;
    }, 15000);
    const listener = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        setClock(Date.now());
        load();
      }
    });
    return () => {
      if (midnight) clearTimeout(midnight);
      clearInterval(timer);
      listener.remove();
    };
  }, [actor, load]);
  const item = useMemo(
    () =>
      view?.question ? generateExercise(view.question.spec, createRng(view.question.seed)) : null,
    [view?.question],
  );
  const session = useMemo(() => (item ? createSession([item]) : null), [item]);
  const shareText = view?.completed
    ? t('puzzle.shareText', {
        day: view.day,
        symbol: view.correct ? '🟩' : '⬜',
        streak: view.streak,
      })
    : '';
  return (
    <ScrollView ref={scroll} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('puzzle.title') }} />
      <View style={styles.content}>
        <AppText variant="title1">{t('puzzle.title')}</AppText>
        {!actor ? (
          <Card>
            <View style={styles.content}>
              <AppText>{t('puzzle.guest')}</AppText>
              <Button
                label={t('rush.account')}
                onPress={() => {
                  router.push('/account');
                }}
              />
            </View>
          </Card>
        ) : (
          <>
            {state.error ? (
              <AppText role="alert">
                {t(state.error === 'day' ? 'puzzle.newDay' : 'puzzle.error')}
              </AppText>
            ) : null}
            {state.loading && !view ? <AppText>{t('puzzle.loading')}</AppText> : null}
            {view ? (
              <Card>
                <View style={styles.content}>
                  <AppText variant="title2">{t('puzzle.day', { day: view.day })}</AppText>
                  <AppText>{t('puzzle.streak', { count: view.streak })}</AppText>
                  <AppText tone="muted">{t('puzzle.reset', { zone: timeZone })}</AppText>
                  {view.difficulty ? (
                    <AppText>{t('puzzle.difficulty', { count: view.difficulty })}</AppText>
                  ) : null}
                </View>
              </Card>
            ) : null}
            {view && !view.available ? (
              <Card>
                <AppText>{t('puzzle.unavailable')}</AppText>
              </Card>
            ) : null}
            {view?.completed ? (
              <Card>
                <View style={styles.content}>
                  <AppText variant="title2">
                    {t(view.correct ? 'puzzle.correct' : 'puzzle.incorrect')}
                  </AppText>
                  <AppText>{t('puzzle.tomorrow')}</AppText>
                  <AppText selectable>{shareText}</AppText>
                  <Button
                    label={t('puzzle.share')}
                    onPress={() => {
                      const clipboard: Clipboard | undefined =
                        Platform.OS === 'web' && typeof navigator !== 'undefined'
                          ? navigator.clipboard
                          : undefined;
                      if (clipboard) void clipboard.writeText(shareText).catch(() => undefined);
                      else void Share.share({ message: shareText }).catch(() => undefined);
                    }}
                  />
                </View>
              </Card>
            ) : null}
            {view && !view.completed && session && item ? (
              <ExerciseTask
                session={session}
                item={item}
                answer={answer}
                question={question}
                scroll={scroll}
                hintsAllowed={false}
                interactionDisabled={state.loading || !!state.error}
                progressText={t('puzzle.oneAttempt')}
                progressLabel={t('puzzle.title')}
                hearingPausedText=""
                continueLabel={t('exercise.next')}
                onSelect={setAnswer}
                onCheck={(value) => {
                  void answerDailyPuzzle(view.day, timeZone, value);
                }}
                onHint={() => undefined}
                onSkip={() => undefined}
                onNext={() => undefined}
              />
            ) : null}
            <Button
              label={t('puzzle.reload')}
              variant="secondary"
              disabled={state.loading}
              onPress={load}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: SPACE.l, alignItems: 'center' },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, gap: SPACE.m },
});

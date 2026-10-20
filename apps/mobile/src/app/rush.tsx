import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { AppState, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RUSH_MODES, RUSH_SCOPES } from '@harmonia/content';
import type { RushMode, RushLeaderboard } from '@harmonia/content';
import { answerSession, createSession, createRng, generateExercise } from '@harmonia/exercises';
import type { ExerciseSession } from '@harmonia/exercises';
import { formatDate, formatNumber } from '@harmonia/i18n';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { ExerciseTask } from '@/components/exercise-task';
import { useLocale } from '@/i18n';
import { useAuthState } from '@/auth';
import {
  answerRush,
  endRush,
  refreshRush,
  refreshRushBoard,
  startRush,
  useRush,
} from '@/state/rush';
export default function RushScreen() {
  const { t } = useTranslation(),
    locale = useLocale();
  const owner = useAuthState((s) => s.session?.user.id ?? null),
    state = useRush();
  const run = owner && state.owner === owner ? state.run : null;
  const status = state.owner === owner ? state.status : null;
  const [mode, setMode] = useState<RushMode>('three'),
    [scope, setScope] = useState<RushLeaderboard['scope']>('day');
  const [answer, setAnswer] = useState<string | null>(null),
    [feedback, setFeedback] = useState<ExerciseSession | null>(null);
  const [feedbackDifficulty, setFeedbackDifficulty] = useState(1);
  const [confirm, setConfirm] = useState(false),
    [clock, setClock] = useState(0);
  const scroll = useRef<ScrollView>(null),
    question = useRef<View>(null),
    expiry = useRef<string | null>(null);
  const active = run?.state === 'active';
  const load = useCallback(async () => {
    await refreshRush();
    if (useRush.getState().error) return;
    if (useRush.getState().run?.state !== 'active') await refreshRushBoard(mode, scope);
  }, [mode, scope]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load, owner]),
  );
  useEffect(() => {
    setFeedback(null);
    setAnswer(null);
    setConfirm(false);
  }, [owner]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refreshRush();
    });
    return () => {
      listener.remove();
    };
  }, []);
  useEffect(() => {
    if (!run) return;
    const start = performance.now(),
      now = run.serverNow;
    const update = () => {
      setClock(now + performance.now() - start);
    };
    update();
    const timer = setInterval(update, 250);
    return () => {
      clearInterval(timer);
    };
  }, [run]);
  useEffect(() => {
    if (
      active &&
      !state.loading &&
      run.deadline !== null &&
      clock >= run.deadline &&
      expiry.current !== run.id
    ) {
      expiry.current = run.id;
      void endRush(run.id);
    }
  }, [clock, active, run, state.loading]);
  useEffect(() => {
    setAnswer(null);
    scroll.current?.scrollTo({ y: 0, animated: false });
    if (Platform.OS === 'web')
      (question.current as unknown as HTMLElement | null)?.focus({ preventScroll: true });
  }, [run?.id, run?.index, feedback]);
  const resumedMode = run?.mode;
  useEffect(() => {
    if (resumedMode) setMode(resumedMode);
  }, [run?.id, resumedMode]);
  const item = useMemo(
    () =>
      run?.question ? generateExercise(run.question.spec, createRng(run.question.seed)) : null,
    [run?.question],
  );
  const session = useMemo(() => (item ? createSession([item]) : null), [item]);
  const shown = feedback ?? session;
  const seconds = run?.deadline ? Math.max(0, Math.ceil((run.deadline - clock) / 1000)) : null;
  const time =
    seconds === null
      ? ''
      : String(Math.floor(seconds / 60)).padStart(2, '0') +
        ':' +
        String(seconds % 60).padStart(2, '0');
  const board =
    state.owner === owner && state.board?.mode === mode && state.board.scope === scope
      ? state.board
      : null;
  useEffect(() => {
    if (owner && !active && !state.loading && !state.error && !board)
      void refreshRushBoard(mode, scope);
  }, [owner, active, state.loading, state.error, board, mode, scope]);
  const start = async () => {
    setFeedback(null);
    setConfirm(false);
    expiry.current = null;
    await startRush(randomUUID(), mode);
    // A lost start response is recovered by the explicit reload, without charging again.
  };
  const check = async (value: string) => {
    if (!run || !session || state.loading) return;
    const id = run.id,
      index = run.index;
    await answerRush(id, index, value);
    const next = useRush.getState();
    if (
      next.owner === owner &&
      next.run?.id === id &&
      next.run.index === index + 1 &&
      next.run.last?.answer === value &&
      !next.error
    ) {
      setFeedbackDifficulty(run.question?.difficulty ?? 1);
      setFeedback(answerSession(session, value));
    }
  };
  return (
    <ScrollView ref={scroll} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <AppText variant="title1">{t('rush.title')}</AppText>
        {!owner ? (
          <Card>
            <View style={styles.content}>
              <AppText>{t('rush.guest')}</AppText>
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
            {state.loading ? <AppText aria-live="polite">{t('rush.loading')}</AppText> : null}
            {state.error ? (
              <View style={styles.content}>
                <AppText role="alert">
                  {t(
                    state.error === 'source'
                      ? 'rush.source'
                      : state.error === 'limit'
                        ? 'rush.limit'
                        : state.error === 'fast'
                          ? 'rush.fast'
                          : 'rush.error',
                  )}
                </AppText>
                <Button
                  variant="secondary"
                  label={t('rush.reload')}
                  disabled={state.loading}
                  onPress={() => {
                    expiry.current = null;
                    void load();
                  }}
                />
              </View>
            ) : null}
            {run && (active || feedback) ? (
              <>
                <Card>
                  <View style={styles.content}>
                    <AppText variant="title2">{t(`rush.mode_${run.mode}`)}</AppText>
                    {run.deadline ? (
                      <AppText testID="rush-clock">{t('rush.time', { time })}</AppText>
                    ) : (
                      <AppText>{t('rush.noTimer')}</AppText>
                    )}
                    <AppText aria-live="polite">
                      {t('rush.score', {
                        score: formatNumber(run.score, locale),
                        mistakes: run.mistakes,
                      })}
                    </AppText>
                    <AppText tone="muted">{t('rush.running')}</AppText>
                  </View>
                </Card>
                {shown?.items[0] ? (
                  <ExerciseTask
                    key={run.id + ':' + String(feedback ? run.index - 1 : run.index)}
                    session={shown}
                    item={shown.items[0]}
                    answer={answer}
                    question={question}
                    scroll={scroll}
                    hintsAllowed={false}
                    interactionDisabled={state.loading || !!state.error || !active}
                    progressText={t('rush.question', {
                      count: feedback ? run.index : run.index + 1,
                      difficulty: feedback ? feedbackDifficulty : (run.question?.difficulty ?? 1),
                    })}
                    progressLabel={t('rush.progress')}
                    progressValue={Math.min(run.mistakes / 3, 1)}
                    hearingPausedText=""
                    continueLabel={t(
                      run.state === 'finished' ? 'rush.showResult' : 'exercise.next',
                    )}
                    onSelect={(value) => {
                      if (!state.loading) setAnswer(value);
                    }}
                    onCheck={(value) => {
                      void check(value);
                    }}
                    onHint={() => undefined}
                    onSkip={() => undefined}
                    onNext={() => {
                      setFeedback(null);
                      setAnswer(null);
                    }}
                  />
                ) : null}
                {confirm ? (
                  <Card>
                    <View style={styles.content}>
                      <AppText>{t('rush.abandonConfirm')}</AppText>
                      <Button
                        variant="secondary"
                        label={t('rush.keepPlaying')}
                        onPress={() => {
                          setConfirm(false);
                        }}
                      />
                      <Button
                        variant="ghost"
                        label={t('rush.abandon')}
                        disabled={state.loading}
                        onPress={() => {
                          setFeedback(null);
                          setConfirm(false);
                          void endRush(run.id, true);
                        }}
                      />
                    </View>
                  </Card>
                ) : (
                  <Button
                    variant="ghost"
                    label={t('rush.stop')}
                    onPress={() => {
                      setConfirm(true);
                    }}
                  />
                )}
              </>
            ) : (
              <>
                {run && run.state !== 'active' ? (
                  <Card>
                    <View style={styles.content}>
                      <AppText variant="title2">
                        {t(run.state === 'finished' ? 'rush.result' : 'rush.abandoned')}
                      </AppText>
                      <AppText>{t(`rush.mode_${run.mode}`)}</AppText>
                      <AppText>
                        {t('rush.resultScore', {
                          score: formatNumber(run.score, locale),
                          correct: formatNumber(run.correct, locale),
                          mistakes: run.mistakes,
                        })}
                      </AppText>
                      <AppText>
                        {t(run.state === 'finished' ? 'rush.reward' : 'rush.noReward', {
                          xp: formatNumber(run.xp, locale),
                        })}
                      </AppText>
                    </View>
                  </Card>
                ) : null}
                <AppText>{t('rush.rules')}</AppText>
                <AppText tone="muted">{t('rush.scoring')}</AppText>
                {status ? (
                  <AppText>
                    {t('rush.allowance', {
                      remaining: status.remaining,
                      limit: status.limit,
                      date: formatDate(new Date(status.resetAt), locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }),
                    })}
                  </AppText>
                ) : null}
                <View style={styles.row}>
                  {RUSH_MODES.map((m) => (
                    <Button
                      key={m}
                      variant={mode === m ? 'primary' : 'secondary'}
                      label={t(`rush.mode_${m}`)}
                      disabled={state.loading}
                      onPress={() => {
                        setMode(m);
                      }}
                    />
                  ))}
                </View>
                <Button
                  label={t('rush.start')}
                  disabled={state.loading || !status || status.remaining === 0}
                  onPress={() => {
                    void start();
                  }}
                />
                {status?.remaining === 0 ? (
                  <Button
                    variant="secondary"
                    label={t('rush.upgrade')}
                    onPress={() => {
                      router.push('/subscription');
                    }}
                  />
                ) : null}
                <AppText variant="title2">{t('rush.leaderboard')}</AppText>
                <AppText tone="muted">{t('rush.boardRules')}</AppText>
                {scope === 'friends' ? <AppText>{t('rush.friendsIntro')}</AppText> : null}
                <View style={styles.row}>
                  {RUSH_SCOPES.map((s) => (
                    <Button
                      key={s}
                      variant={scope === s ? 'primary' : 'secondary'}
                      size="medium"
                      label={t(`rush.scope_${s}`)}
                      disabled={state.loading}
                      onPress={() => {
                        setScope(s);
                      }}
                    />
                  ))}
                </View>
                {board ? (
                  !board.available ? (
                    <AppText>{t('rush.friendsPending')}</AppText>
                  ) : board.entries.length ? (
                    <Card>
                      <View style={styles.content}>
                        {board.entries.map((entry) => (
                          <AppText
                            key={entry.rank}
                            testID={entry.isYou ? 'rush-own-rank' : undefined}
                          >
                            {t(entry.isYou ? 'rush.ownRank' : 'rush.rank', {
                              rank: formatNumber(entry.rank, locale),
                              score: formatNumber(entry.score, locale),
                            })}
                          </AppText>
                        ))}
                      </View>
                    </Card>
                  ) : (
                    <AppText>{t('rush.empty')}</AppText>
                  )
                ) : null}
                <Button
                  variant="secondary"
                  label={t('rush.reload')}
                  disabled={state.loading}
                  onPress={() => {
                    void load();
                  }}
                />
              </>
            )}
          </>
        )}
        <Button
          variant="ghost"
          label={t('rush.back')}
          onPress={() => {
            router.back();
          }}
        />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: LAYOUT.screenPadding, paddingBottom: SPACE.xxxl },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', gap: SPACE.m },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s },
});

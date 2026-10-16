import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { AppState, Platform, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { answerSession, createRng, createSession, generateExercise } from '@harmonia/exercises';
import type { ExerciseSession } from '@harmonia/exercises';
import { LAYOUT, RADIUS, SPACE } from '@harmonia/ui';
import { AppText, Button, Card, useUiTheme } from '@harmonia/ui/native';
import { ExerciseTask } from '@/components/exercise-task';
import { useAuthState } from '@/auth';
import {
  acceptDuel,
  answerDuel,
  broadcastDuel,
  cancelDuel,
  findDuel,
  inviteDuel,
  refreshDuel,
  useDuel,
  watchDuel,
} from '@/state/duel';

export default function DuelScreen() {
  const { t } = useTranslation(),
    { colors } = useUiTheme();
  const params = useLocalSearchParams<{ invite?: string }>();
  const actor = useAuthState((s) => s.session?.user.id ?? null);
  const state = useDuel();
  const view = actor && state.owner === actor ? state.view : null;
  const game = view?.phase === 'game' ? view : null;
  const [inviteInput, setInviteInput] = useState(
    typeof params.invite === 'string' ? params.invite : '',
  );
  const [answer, setAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ExerciseSession | null>(null);
  const [clock, setClock] = useState(Date.now());
  const scroll = useRef<ScrollView>(null),
    question = useRef<View>(null);
  useFocusEffect(
    useCallback(() => {
      if (actor) void refreshDuel();
    }, [actor]),
  );
  useEffect(() => {
    setAnswer(null);
    setFeedback(null);
  }, [actor]);
  useEffect(() => {
    if (!actor) return;
    const timer = setInterval(() => {
      const current = useDuel.getState().view;
      if (current?.phase === 'queue') void findDuel();
      else void refreshDuel();
    }, 4000);
    const listener = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refreshDuel();
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, [actor]);
  useEffect(() => {
    if (game?.state !== 'active') return;
    return watchDuel(game.id, () => {
      void refreshDuel();
    });
  }, [game?.id, game?.state]);
  useEffect(() => {
    if (!game) return;
    const start = performance.now(),
      baseline = game.serverNow;
    const update = () => {
      setClock(baseline + performance.now() - start);
    };
    update();
    const timer = setInterval(update, 250);
    return () => {
      clearInterval(timer);
    };
  }, [game?.id, game?.serverNow]);
  useEffect(() => {
    setAnswer(null);
    scroll.current?.scrollTo({ y: 0, animated: false });
    if (Platform.OS === 'web')
      (question.current as unknown as HTMLElement | null)?.focus({ preventScroll: true });
  }, [game?.id, game?.own.index]);
  const item = useMemo(
    () =>
      game?.question
        ? generateExercise(
            game.question.spec as Parameters<typeof generateExercise>[0],
            createRng(game.question.seed),
          )
        : null,
    [game?.question],
  );
  const session = useMemo(() => (item ? createSession([item]) : null), [item]);
  const displayed = feedback ?? session;
  const remaining = game ? Math.max(0, Math.ceil((game.deadline - clock) / 1000)) : 0;
  const startingSeconds = game ? Math.max(0, Math.ceil((game.startsAt - clock) / 1000)) : 0;
  const countdown =
    String(Math.floor(remaining / 60)).padStart(2, '0') +
    ':' +
    String(remaining % 60).padStart(2, '0');
  const canAnswer =
    !!game &&
    game.state === 'active' &&
    clock >= game.startsAt &&
    clock < game.deadline &&
    !state.loading;
  const invite =
    inviteInput
      .trim()
      .split('invite=')
      .at(-1)
      ?.split(/[&#\s]/)[0] ?? '';
  const validInvite = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    invite,
  );
  const inviteLink =
    view?.phase === 'invite'
      ? Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.origin + '/duel?invite=' + view.token
        : 'harmonia://duel?invite=' + view.token
      : '';
  const submit = async (value: string) => {
    if (!game || !session || !canAnswer) return;
    const index = game.own.index;
    await answerDuel(game.id, index, value);
    const next = useDuel.getState();
    if (
      next.owner === actor &&
      next.view?.phase === 'game' &&
      next.view.id === game.id &&
      next.view.own.index === index + 1 &&
      next.view.last?.answer === value &&
      !next.error
    ) {
      setFeedback(answerSession(session, value));
      void broadcastDuel(game.id);
    }
  };
  return (
    <ScrollView ref={scroll} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('duel.title') }} />
      <View style={styles.content}>
        <AppText variant="title1">{t('duel.title')}</AppText>
        {!actor ? (
          <Card>
            <View style={styles.content}>
              <AppText>{t('duel.guest')}</AppText>
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
                {t(
                  state.error === 'source'
                    ? 'rush.source'
                    : state.error === 'fast'
                      ? 'rush.fast'
                      : 'duel.error',
                )}
              </AppText>
            ) : null}
            {state.loading && !view ? <AppText>{t('duel.loading')}</AppText> : null}
            {game ? (
              <>
                <Card>
                  <View style={styles.content}>
                    <AppText variant="title2">
                      {t(
                        game.kind === 'live'
                          ? 'duel.kind_live'
                          : game.kind === 'friend'
                            ? 'duel.kind_friend'
                            : 'duel.kind_ghost',
                      )}
                    </AppText>
                    {game.kind === 'ghost' ? <AppText>{t('duel.ghostDisclosure')}</AppText> : null}
                    {game.kind === 'friend' ? (
                      <AppText>{t('duel.friendDisclosure')}</AppText>
                    ) : null}
                    <AppText testID="duel-clock">
                      {clock < game.startsAt && game.state === 'active'
                        ? t('duel.startIn', { seconds: startingSeconds })
                        : t('duel.time', { time: countdown })}
                    </AppText>
                    <AppText aria-live="polite">
                      {t('duel.scores', { own: game.own.score, rival: game.rival.score })}
                    </AppText>
                    {game.state === 'active' ? (
                      <AppText tone="muted">
                        {clock < game.startsAt ? t('duel.starting') : t('duel.running')}
                      </AppText>
                    ) : null}
                  </View>
                </Card>
                {game.state === 'finished' ? (
                  <Card>
                    <View style={styles.content}>
                      <AppText variant="title2">
                        {t(
                          game.outcome === 'win'
                            ? 'duel.outcome_win'
                            : game.outcome === 'loss'
                              ? 'duel.outcome_loss'
                              : 'duel.outcome_draw',
                        )}
                      </AppText>
                      <AppText>
                        {t('duel.finalScore', {
                          own: game.own.score,
                          rival: game.kind === 'ghost' ? (game.ghostScore ?? 0) : game.rival.score,
                        })}
                      </AppText>
                      {game.kind === 'live' &&
                      game.ratingAfter !== null &&
                      game.ratingBefore !== null ? (
                        <AppText>
                          {t('duel.rating', {
                            before: Math.round(game.ratingBefore),
                            after: Math.round(game.ratingAfter),
                          })}
                        </AppText>
                      ) : (
                        <AppText>{t('duel.unrated')}</AppText>
                      )}
                      {game.kind === 'live' ? <AppText>{t('duel.reward')}</AppText> : null}
                      <Button
                        label={t('duel.find')}
                        onPress={() => {
                          void findDuel();
                        }}
                        disabled={state.loading}
                      />
                      <Button
                        label={t('duel.invite')}
                        variant="secondary"
                        onPress={() => {
                          void inviteDuel(randomUUID());
                        }}
                        disabled={state.loading}
                      />
                      <TextInput
                        value={inviteInput}
                        onChangeText={setInviteInput}
                        autoCapitalize="none"
                        autoCorrect={false}
                        accessibilityLabel={t('duel.inviteCode')}
                        placeholder={t('duel.inviteCode')}
                        placeholderTextColor={colors.textMuted}
                        style={[
                          styles.input,
                          {
                            color: colors.text,
                            borderColor: colors.borderStrong,
                            backgroundColor: colors.surface,
                          },
                        ]}
                      />
                      <Button
                        label={t('duel.accept')}
                        disabled={!validInvite || state.loading}
                        onPress={() => {
                          void acceptDuel(invite);
                        }}
                      />
                    </View>
                  </Card>
                ) : displayed?.items[0] ? (
                  <ExerciseTask
                    key={game.id + ':' + String(game.own.index) + ':' + String(!!feedback)}
                    session={displayed}
                    item={displayed.items[0]}
                    answer={answer}
                    question={question}
                    scroll={scroll}
                    hintsAllowed={false}
                    interactionDisabled={!canAnswer || !!feedback || !!state.error}
                    progressText={t('duel.question', {
                      count: game.own.index + 1,
                      difficulty: game.question?.difficulty ?? 1,
                    })}
                    progressLabel={t('duel.progress')}
                    progressValue={Math.max(0, Math.min(1, 1 - remaining / 180))}
                    hearingPausedText=""
                    continueLabel={t('exercise.next')}
                    onSelect={setAnswer}
                    onCheck={(value) => {
                      void submit(value);
                    }}
                    onHint={() => undefined}
                    onSkip={() => undefined}
                    onNext={() => {
                      setFeedback(null);
                      setAnswer(null);
                    }}
                  />
                ) : null}
                <Button
                  variant="secondary"
                  label={t('duel.reload')}
                  onPress={() => {
                    void refreshDuel();
                  }}
                  disabled={state.loading}
                />
              </>
            ) : view?.phase === 'queue' ? (
              <Card>
                <View style={styles.content}>
                  <AppText variant="title2">{t('duel.searching')}</AppText>
                  <AppText>{t('duel.ghostWait')}</AppText>
                  <Button
                    label={t('duel.cancel')}
                    variant="secondary"
                    onPress={() => {
                      void cancelDuel();
                    }}
                  />
                </View>
              </Card>
            ) : view?.phase === 'invite' ? (
              <Card>
                <View style={styles.content}>
                  <AppText variant="title2">{t('duel.inviteReady')}</AppText>
                  <AppText selectable>{inviteLink}</AppText>
                  <Button
                    label={t('duel.share')}
                    onPress={() => {
                      const clipboard: Clipboard | undefined =
                        Platform.OS === 'web' && typeof navigator !== 'undefined'
                          ? navigator.clipboard
                          : undefined;
                      if (clipboard) void clipboard.writeText(inviteLink);
                      else
                        void Share.share({
                          message: t('duel.shareMessage', { link: inviteLink, code: view.token }),
                        });
                    }}
                  />
                  <Button
                    label={t('duel.cancel')}
                    variant="secondary"
                    onPress={() => {
                      void cancelDuel();
                    }}
                  />
                </View>
              </Card>
            ) : (
              <>
                <Card>
                  <View style={styles.content}>
                    <AppText>{t('duel.rules')}</AppText>
                    <Button
                      label={t('duel.find')}
                      disabled={state.loading}
                      onPress={() => {
                        void findDuel();
                      }}
                    />
                    <Button
                      label={t('duel.invite')}
                      variant="secondary"
                      disabled={state.loading}
                      onPress={() => {
                        void inviteDuel(randomUUID());
                      }}
                    />
                  </View>
                </Card>
                <Card>
                  <View style={styles.content}>
                    <AppText variant="title3">{t('duel.acceptTitle')}</AppText>
                    <TextInput
                      value={inviteInput}
                      onChangeText={setInviteInput}
                      autoCapitalize="none"
                      autoCorrect={false}
                      accessibilityLabel={t('duel.inviteCode')}
                      placeholder={t('duel.inviteCode')}
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.input,
                        {
                          color: colors.text,
                          borderColor: colors.borderStrong,
                          backgroundColor: colors.surface,
                        },
                      ]}
                    />
                    <Button
                      label={t('duel.accept')}
                      disabled={!validInvite || state.loading}
                      onPress={() => {
                        void acceptDuel(invite);
                      }}
                    />
                  </View>
                </Card>
              </>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: SPACE.l, alignItems: 'center' },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, gap: SPACE.m },
  input: { borderWidth: 1, borderRadius: RADIUS.control, padding: SPACE.m },
});

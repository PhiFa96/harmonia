import { resolveReportSource } from '@harmonia/content';
import { catalogue } from '@harmonia/content/catalogue';
import { exercisePrompt } from '@harmonia/exercises';
import { LOCALE_NAMES, engineLanguage } from '@harmonia/i18n';
import { ScoreView, GrandStaffView } from '@harmonia/notation/native';
import { describeScore } from '@harmonia/notation';
import { LAYOUT, RADIUS, SPACE, TYPOGRAPHY } from '@harmonia/ui';
import { AppText, BottomSheet, Button, Card, MusicText, useUiTheme } from '@harmonia/ui/native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthState } from '@/auth';
import { useLocale } from '@/i18n';
import { tutorActor } from '@/tutor/client';
import { taskTutorScore } from '@/tutor/context';
import {
  deleteTutorConversation,
  ensureTutorActor,
  loadTutorAccount,
  loadTutorConversations,
  newTutorConversation,
  olderTutorMessages,
  openTutorConversation,
  sendTutor,
  stopTutor,
  useTutor,
} from '@/tutor/state';
import { TutorAnswerCard } from './tutor-answer';
import { TutorReportSheet } from './tutor-report';
const errorKeys = {
  auth: 'tutor.error_auth',
  unconfigured: 'tutor.error_unconfigured',
  unavailable: 'tutor.error_unavailable',
  configuration: 'tutor.error_unavailable',
  subscription: 'tutor.error_subscription',
  quota: 'tutor.error_quota',
  rate: 'tutor.error_rate',
  budget: 'tutor.error_budget',
  busy: 'tutor.error_busy',
  context: 'tutor.error_context',
  conflict: 'tutor.error_context',
  deleted: 'tutor.error_deleted',
  content: 'tutor.error_content',
  network: 'tutor.error_network',
  interrupted: 'tutor.error_network',
  cancelled: 'tutor.error_cancelled',
  protocol: 'tutor.error_protocol',
  history: 'tutor.error_history',
  storage: 'tutor.error_storage',
  attempt_required: 'tutor.error_attempt_required',
  attempt_invalid: 'tutor.error_attempt_invalid',
  attempt_expired: 'tutor.error_attempt_expired',
} as const;
type ErrorCode = keyof typeof errorKeys;
export function TutorScreen({ task = false }: { readonly task?: boolean }) {
  const { t } = useTranslation(),
    locale = useLocale(),
    router = useRouter(),
    { colors, reduceMotion } = useUiTheme(),
    insets = useSafeAreaInsets();
  const auth = useAuthState(),
    actor = tutorActor(),
    stored = useTutor();
  const state = stored.actor === actor ? stored : null;
  const [draft, setDraft] = useState<{ owner: string | null; text: string }>({
    owner: actor,
    text: '',
  });
  const [history, setHistory] = useState(false),
    [report, setReport] = useState<{
      owner: string;
      conversationId: string;
      messageId: number;
    } | null>(null);
  const [deleting, setDeleting] = useState<{ owner: string; id: string } | null>(null),
    [deleteBusy, setDeleteBusy] = useState(false),
    [deleteError, setDeleteError] = useState(false);
  const scroll = useRef<ScrollView>(null),
    follow = useRef(true);
  const question = draft.owner === actor ? draft.text : '';
  useEffect(() => {
    setHistory(false);
    setReport(null);
    setDeleting(null);
  }, [actor]);
  useEffect(() => {
    setDraft({ owner: actor, text: '' });
  }, [actor, stored.conversationId]);
  useFocusEffect(
    useCallback(() => {
      ensureTutorActor();
      if (!useTutor.getState().scope) newTutorConversation(locale);
      void loadTutorAccount();
      const listener = AppState.addEventListener('change', (value) => {
        if (value !== 'active') stopTutor();
      });
      return () => {
        listener.remove();
        stopTutor();
      };
    }, [actor, locale]),
  );
  const scope = state?.scope;
  const taskPrompt = useMemo(() => {
    if (state?.entry) return state.entry.prompt;
    if (!scope?.context) return null;
    try {
      return exercisePrompt(
        resolveReportSource(catalogue, scope.context.source).item,
        scope.locale,
      );
    } catch {
      return t('tutor.error_content');
    }
  }, [state?.entry, scope, t]);
  const originalScore = useMemo(() => {
    if (state?.entry?.score) return state.entry.score;
    if (!scope?.context) return undefined;
    try {
      return taskTutorScore(
        resolveReportSource(catalogue, scope.context.source).item,
        scope.mode,
        scope.context.answer,
      );
    } catch {
      return undefined;
    }
  }, [state?.entry, scope]);
  const available =
    actor !== null &&
    state?.account?.availability === 'available' &&
    !state.accountLoading &&
    !state.accountError &&
    !state.loading &&
    !state.sending;
  const send = (text: string) => {
    follow.current = true;
    setDraft({ owner: actor, text: '' });
    void sendTutor(text);
  };
  const availability = state?.account?.availability;
  const notice =
    state?.error ?? (availability && availability !== 'available' ? availability : null);
  const noticeKey =
    notice && notice in errorKeys ? errorKeys[notice as ErrorCode] : 'tutor.error_network';
  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={task ? insets.top + SPACE.xxxl : 0}
    >
      {task ? <Stack.Screen options={{ headerShown: true, title: t('tutor.title') }} /> : null}
      <ScrollView
        ref={scroll}
        style={styles.fill}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={(event) => {
          const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
          follow.current =
            contentSize.height - contentOffset.y - layoutMeasurement.height < SPACE.xxxl;
        }}
        onContentSizeChange={() => {
          if (follow.current && state?.sending)
            scroll.current?.scrollToEnd({ animated: !reduceMotion });
        }}
      >
        <View style={styles.content}>
          <AppText variant="footnote" tone="muted">
            {t('tutor.disclosure')}
          </AppText>
          {scope ? (
            <AppText variant="footnote" tone="muted">
              {t('tutor.language', { language: LOCALE_NAMES[scope.locale] })}
            </AppText>
          ) : null}
          {taskPrompt ? (
            <Card>
              <View style={styles.actions}>
                <AppText variant="overline">{t('tutor.task')}</AppText>
                <MusicText>{taskPrompt}</MusicText>
                {originalScore ? (
                  <ScrollView
                    horizontal
                    testID="tutor-original-score"
                    {...(Platform.OS === 'web' ? { tabIndex: 0 } : {})}
                  >
                    <View
                      accessible
                      role="img"
                      aria-label={describeScore(
                        originalScore,
                        engineLanguage(scope?.locale ?? locale),
                      )
                        .map((d) => d.text)
                        .join('; ')}
                    >
                      <View aria-hidden importantForAccessibility="no-hide-descendants">
                        {originalScore.staves.length === 2 &&
                        originalScore.staves.every(
                          (staff) =>
                            staff.measures.length === 1 &&
                            staff.measures.every((measure) => measure.voices.length === 1),
                        ) ? (
                          <GrandStaffView
                            score={originalScore}
                            staffSpace={14}
                            color={colors.text}
                          />
                        ) : (
                          <ScoreView
                            score={originalScore}
                            staffSpace={14}
                            color={colors.text}
                            describeOptions={engineLanguage(scope?.locale ?? locale)}
                            layoutOptions={{ endBarline: 'final' }}
                          />
                        )}
                      </View>
                    </View>
                  </ScrollView>
                ) : null}
              </View>
            </Card>
          ) : null}
          {!actor ? (
            <Card>
              <View style={styles.actions}>
                <AppText>{t('tutor.guest')}</AppText>
                <>
                  <AppText tone="muted">{t('tutor.premium')}</AppText>
                  <Button
                    variant="secondary"
                    label={t('paywall.title')}
                    onPress={() => {
                      router.push({ pathname: '/paywall', params: { reason: 'tutor' } });
                    }}
                  />
                </>
                <Button
                  label={t('tutor.signIn')}
                  disabled={!auth.ready}
                  onPress={() => {
                    router.push('/account');
                  }}
                />
                <Button
                  variant="secondary"
                  label={t('tutor.practice')}
                  onPress={() => {
                    router.navigate('/practice');
                  }}
                />
              </View>
            </Card>
          ) : (
            <>
              <Card>
                <View style={styles.actions}>
                  {state?.accountLoading ? (
                    <AppText aria-live="polite">{t('tutor.accountLoading')}</AppText>
                  ) : null}
                  {state?.account ? (
                    <>
                      <AppText>
                        {t('tutor.remaining', {
                          remaining: state.account.requestsRemaining,
                          limit: state.account.requestsLimit,
                        })}
                      </AppText>
                      <AppText variant="footnote" tone="muted">
                        {t('tutor.reset', {
                          date: new Date(state.account.resetAt).toLocaleString(locale),
                        })}
                      </AppText>
                    </>
                  ) : null}
                  {state?.account?.tier === 'free' ? (
                    <>
                      <AppText tone="muted">{t('tutor.premium')}</AppText>
                      <Button
                        variant="secondary"
                        label={t('paywall.title')}
                        onPress={() => {
                          router.push({ pathname: '/paywall', params: { reason: 'tutor' } });
                        }}
                      />
                    </>
                  ) : null}
                  {state?.accountError ? (
                    <AppText role="alert" tone="danger">
                      {t('tutor.accountError')}
                    </AppText>
                  ) : null}
                  {notice ? <AppText aria-live="polite">{t(noticeKey)}</AppText> : null}
                  {notice === 'auth' ? (
                    <Button
                      variant="secondary"
                      label={t('tutor.signIn')}
                      onPress={() => {
                        router.push('/account');
                      }}
                    />
                  ) : null}
                  <Button
                    variant="ghost"
                    size="medium"
                    label={t('tutor.refresh')}
                    disabled={state?.accountLoading ?? false}
                    onPress={() => {
                      void loadTutorAccount();
                    }}
                  />
                </View>
              </Card>
              <View style={styles.actions}>
                <Button
                  variant="secondary"
                  label={t('tutor.newChat')}
                  onPress={() => {
                    newTutorConversation(locale);
                    setDraft({ owner: actor, text: '' });
                    void loadTutorAccount();
                  }}
                />
                <Button
                  variant="ghost"
                  label={t(history ? 'tutor.hideHistory' : 'tutor.history')}
                  onPress={() => {
                    setHistory(!history);
                    if (!history) void loadTutorConversations();
                  }}
                />
              </View>
              {history ? (
                <Card>
                  <View style={styles.actions}>
                    {!state?.conversations.length && !state?.loading ? (
                      <AppText>{t('tutor.emptyHistory')}</AppText>
                    ) : null}
                    {state?.conversations.map((conversation) => (
                      <View key={conversation.id} style={styles.actions}>
                        <Button
                          variant="ghost"
                          label={t('tutor.conversation', {
                            date: new Date(conversation.created_at).toLocaleString(locale),
                            language: LOCALE_NAMES[conversation.context.locale],
                          })}
                          disabled={state.sending || state.loading}
                          onPress={() => {
                            void openTutorConversation(conversation.id);
                            setHistory(false);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="medium"
                          label={t('tutor.delete')}
                          disabled={state.sending}
                          onPress={() => {
                            setDeleting({ owner: actor, id: conversation.id });
                            setDeleteError(false);
                          }}
                        />
                      </View>
                    ))}
                    {state?.listNext ? (
                      <Button
                        variant="secondary"
                        label={t('tutor.moreConversations')}
                        disabled={state.loading}
                        onPress={() => {
                          void loadTutorConversations(true);
                        }}
                      />
                    ) : null}
                  </View>
                </Card>
              ) : null}
              {state?.older && state.messages.length < 1000 ? (
                <Button
                  variant="ghost"
                  label={t('tutor.older')}
                  disabled={state.loading}
                  onPress={() => {
                    void olderTutorMessages();
                  }}
                />
              ) : null}
              {state && state.messages.length >= 1000 ? (
                <AppText>{t('tutor.historyLimit')}</AppText>
              ) : null}
              {state?.messages.map((message) =>
                message.role === 'user' ? (
                  <View
                    key={message.id}
                    style={[styles.user, { backgroundColor: colors.primarySoft }]}
                  >
                    <AppText variant="overline">{t('tutor.you')}</AppText>
                    <MusicText selectable>{message.content.text}</MusicText>
                  </View>
                ) : (
                  <TutorAnswerCard
                    key={message.id}
                    answer={message.content}
                    locale={scope?.locale ?? locale}
                    onReport={() => {
                      if (state.conversationId)
                        setReport({
                          owner: actor,
                          conversationId: state.conversationId,
                          messageId: message.id,
                        });
                    }}
                  />
                ),
              )}
              {state?.current ? (
                <>
                  <View style={[styles.user, { backgroundColor: colors.primarySoft }]}>
                    <AppText variant="overline">{t('tutor.you')}</AppText>
                    <MusicText>{state.current.request.message}</MusicText>
                  </View>
                  <TutorAnswerCard
                    answer={state.current.answer}
                    locale={state.current.request.locale}
                    streaming={state.sending}
                  />
                </>
              ) : null}
              {state?.retry && !state.sending ? (
                <>
                  <AppText variant="footnote" tone="muted">
                    {t('tutor.retryHint')}
                  </AppText>
                  <Button
                    variant="secondary"
                    label={t('tutor.retry')}
                    onPress={() => {
                      void sendTutor('', true);
                    }}
                  />
                </>
              ) : null}
              {scope && scope.mode !== 'chat' && !state.messages.length && !state.current ? (
                <Button
                  label={t(`tutor.taskSend_${scope.mode}`)}
                  disabled={!available}
                  onPress={() => {
                    send(
                      t(
                        scope.mode === 'hint'
                          ? 'tutor.requestHint'
                          : scope.mode === 'solution'
                            ? 'tutor.requestSolution'
                            : 'tutor.requestExplain',
                      ),
                    );
                  }}
                />
              ) : null}
              {scope?.mode === 'chat' && !state?.messages.length && !state?.current ? (
                <View style={styles.actions}>
                  {(['suggestionIntervals', 'suggestionRhythm', 'suggestionSources'] as const).map(
                    (key) => (
                      <Button
                        key={key}
                        size="medium"
                        variant="ghost"
                        label={t(`tutor.${key}`)}
                        disabled={!available}
                        onPress={() => {
                          setDraft({ owner: actor, text: t(`tutor.${key}`) });
                        }}
                      />
                    ),
                  )}
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
      {actor ? (
        <View
          style={[
            styles.composer,
            { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, SPACE.s) },
          ]}
        >
          <View style={styles.content}>
            {state?.sending ? (
              <Button label={t('tutor.stop')} variant="secondary" onPress={stopTutor} />
            ) : (
              <>
                <TextInput
                  testID="tutor-question"
                  accessibilityLabel={t('tutor.questionLabel')}
                  placeholder={t('tutor.placeholder')}
                  placeholderTextColor={colors.textMuted}
                  value={question}
                  onChangeText={(text) => {
                    setDraft({ owner: actor, text });
                  }}
                  multiline
                  maxLength={4000}
                  editable={!state?.retry && !state?.loading}
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
                  label={t('tutor.send')}
                  disabled={!available || !question.trim() || !!state.retry || !scope}
                  onPress={() => {
                    send(question.trim());
                  }}
                />
              </>
            )}
          </View>
        </View>
      ) : null}
      {report?.owner === actor ? (
        <TutorReportSheet
          key={`${report.conversationId}:${String(report.messageId)}`}
          conversationId={report.conversationId}
          messageId={report.messageId}
          onClose={() => {
            setReport(null);
          }}
        />
      ) : null}
      {deleting?.owner === actor ? (
        <BottomSheet
          visible
          title={t('tutor.deleteTitle')}
          closeLabel={t('tutor.cancel')}
          onClose={() => {
            if (!deleteBusy) setDeleting(null);
          }}
        >
          <View style={styles.actions}>
            <AppText>{t('tutor.deleteBody')}</AppText>
            {deleteError ? (
              <AppText role="alert" tone="danger">
                {t('tutor.error_network')}
              </AppText>
            ) : null}
            <Button
              label={t('tutor.confirmDelete')}
              disabled={deleteBusy}
              onPress={() => {
                setDeleteBusy(true);
                void deleteTutorConversation(deleting.id)
                  .then(() => {
                    setDeleting(null);
                  })
                  .catch(() => {
                    setDeleteError(true);
                  })
                  .finally(() => {
                    setDeleteBusy(false);
                  });
              }}
            />
            <Button
              label={t('tutor.cancel')}
              variant="ghost"
              disabled={deleteBusy}
              onPress={() => {
                setDeleting(null);
              }}
            />
          </View>
        </BottomSheet>
      ) : null}
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { padding: LAYOUT.screenPadding, paddingBottom: SPACE.xxl },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', gap: SPACE.m },
  actions: { gap: SPACE.s },
  user: { padding: SPACE.m, borderRadius: RADIUS.card, gap: SPACE.s },
  composer: { paddingHorizontal: LAYOUT.screenPadding, paddingTop: SPACE.s },
  input: {
    ...TYPOGRAPHY.body,
    minHeight: SPACE.xxxl,
    maxHeight: SPACE.xxxl * 3,
    padding: SPACE.m,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
});

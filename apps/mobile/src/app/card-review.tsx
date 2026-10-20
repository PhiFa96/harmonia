import { useRef, useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { reviewCardKey, scheduleReview } from '@harmonia/content';
import type { LearningEvent } from '@harmonia/content';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button } from '@harmonia/ui/native';
import { LessonIntroduction } from '@/components/lesson-introduction';
import { useContentText } from '@/content/use-content-text';
import { useDueReviews } from '@/components/review-entry';
import { useReviews } from '@/storage/use-reviews';
import { useLocale } from '@/i18n';
import { recordLearningEvent, useLearningState } from '@/state/learning';
import { useAuthState } from '@/auth';
import { deviceTimeZone, recordPractice } from '@/state/motivation';

export default function CardReviewScreen() {
  const { id } = useLocalSearchParams();
  const owner = useAuthState((s) => s.session?.user.id ?? 'guest');
  const due = useDueReviews();
  const { t } = useTranslation();
  if (!due.ready) return <AppText>{t('path.loading')}</AppText>;
  return (
    <CardPlayer
      key={`${owner}:${String(id)}`}
      id={typeof id === 'string' ? id : ''}
      owner={owner}
    />
  );
}
function CardPlayer({ id, owner }: { readonly id: string; readonly owner: string }) {
  const { t } = useTranslation();
  const text = useContentText(),
    locale = useLocale();
  const due = useDueReviews(),
    reviews = useReviews();
  const memory = useLearningState((s) => s.memory);
  const [card] = useState(() => due.cards.find((c) => c.id === id));
  const [revealed, setRevealed] = useState(false);
  const [event, setEvent] = useState<Extract<LearningEvent, { kind: 'card-review' }> | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const pending = useRef(false);
  const startedAt = useRef(Date.now());
  const snapshot = useRef(
    card ? reviews.cards[reviewCardKey(card.id, card.contentVersion)] : undefined,
  );
  const persist = async (next: Extract<LearningEvent, { kind: 'card-review' }>) => {
    if (pending.current || owner !== (useAuthState.getState().session?.user.id ?? 'guest')) return;
    pending.current = true;
    setStatus('saving');
    setEvent(next);
    try {
      await recordLearningEvent(next, memory, owner);
      if (owner !== (useAuthState.getState().session?.user.id ?? 'guest')) return;
      await recordPractice().catch(() => undefined);
      setStatus('saved');
    } catch {
      setStatus('error');
    } finally {
      pending.current = false;
    }
  };
  const nextDue = event
    ? scheduleReview(snapshot.current, event.rating, event.finishedAt).due
    : null;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Stack.Screen options={{ headerShown: true, title: t('review.title') }} />
        {!card || !due.ready ? (
          <AppText>{t(due.ready ? 'review.empty' : 'path.loading')}</AppText>
        ) : (
          <>
            <AppText variant="title1">{text(card.titleKey)}</AppText>
            {status === 'saved' ? (
              <>
                <AppText role="status" aria-live="polite">
                  {t('review.saved')}
                </AppText>
                {nextDue === null ? null : (
                  <AppText>
                    {t('review.scheduled', {
                      date: new Intl.DateTimeFormat(locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(nextDue),
                    })}
                  </AppText>
                )}
              </>
            ) : (
              <>
                <AppText>{t('review.recall')}</AppText>
                {!revealed ? (
                  <Button
                    label={t('review.reveal')}
                    onPress={() => {
                      setRevealed(true);
                    }}
                  />
                ) : (
                  <>
                    <LessonIntroduction
                      hideProgress
                      hideContinue
                      lesson={{
                        id: card.id,
                        contentVersion: card.contentVersion,
                        status: card.status,
                        titleKey: card.titleKey,
                        introduction: [card],
                        exercises: [],
                      }}
                      onStart={() => undefined}
                      onCardChange={() => undefined}
                    />
                    <AppText variant="title2">{t('review.rate')}</AppText>
                    <AppText>{t('review.ratingHelp')}</AppText>
                    {status === 'idle'
                      ? ([1, 2, 3, 4] as const).map((rating) => (
                          <Button
                            key={rating}
                            variant="secondary"
                            label={t(
                              (
                                {
                                  1: 'review.again',
                                  2: 'review.hard',
                                  3: 'review.good',
                                  4: 'review.easy',
                                } as const
                              )[rating],
                            )}
                            onPress={() => {
                              void persist({
                                kind: 'card-review',
                                id: randomUUID(),
                                cardId: card.id,
                                contentVersion: card.contentVersion,
                                rating,
                                startedAt: startedAt.current,
                                finishedAt: Math.max(startedAt.current, Date.now()),
                                timeZone: deviceTimeZone(),
                              });
                            }}
                          />
                        ))
                      : null}
                    {status === 'saving' ? (
                      <AppText aria-live="polite">{t('review.saving')}</AppText>
                    ) : null}
                    {status === 'error' && event ? (
                      <>
                        <AppText role="alert">{t('review.error')}</AppText>
                        <Button
                          label={t('review.retry')}
                          onPress={() => {
                            void persist(event);
                          }}
                        />
                      </>
                    ) : null}
                  </>
                )}
              </>
            )}
            <AppText tone="muted">{t('review.noRewards')}</AppText>
          </>
        )}
        <Button
          variant="ghost"
          disabled={status === 'saving'}
          label={t('review.back')}
          onPress={() => {
            router.dismissTo('/review');
          }}
        />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: LAYOUT.screenPadding, paddingBottom: SPACE.xxxl },
  content: { gap: SPACE.m, width: '100%', maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center' },
});

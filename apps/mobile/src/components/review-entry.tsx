import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { catalogue } from '@harmonia/content/catalogue';
import { dueReviews } from '@harmonia/content';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { SPACE } from '@harmonia/ui';
import { View, StyleSheet } from 'react-native';
import { useAuthState } from '@/auth';
import { useLearningState } from '@/state/learning';
import { useReviews } from '@/storage/use-reviews';

/** Refresh while mounted: a short learning step can become due without restarting. */
export function useDueReviews() {
  const state = useReviews();
  const learning = useLearningState();
  const owner = useAuthState((s) => s.session?.user.id ?? 'guest');
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => {
      clearInterval(timer);
    };
  }, []);
  const ready = learning.phase === 'ready' && learning.scope === owner;
  const reached = ready
    ? learning.path
        .flatMap((u) => u.lessons)
        .filter((l) => l.status !== 'locked')
        .map((l) => l.id)
    : [];
  return {
    ...dueReviews(catalogue, state, now, reached),
    ready,
    memory: learning.memory,
    learned: Object.keys(state.skills).length + Object.keys(state.cards).length > 0,
  };
}
export function ReviewEntry() {
  const { t } = useTranslation();
  const due = useDueReviews();
  const count = due.skills.length + due.cards.length;
  return (
    <Card>
      <View style={styles.content}>
        <AppText variant="title3">{t('review.title')}</AppText>
        <AppText tone="muted">
          {count
            ? t('review.due', { skills: due.skills.length, cards: due.cards.length })
            : t(due.learned ? 'review.empty' : 'review.new')}
        </AppText>
        {count >= 10 ? <AppText>{t('review.backlog')}</AppText> : null}
        <Button
          label={t('review.open')}
          disabled={!due.ready}
          onPress={() => {
            router.push('/review');
          }}
        />
      </View>
    </Card>
  );
}
const styles = StyleSheet.create({ content: { gap: SPACE.m } });

import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { REVIEW_LESSON_ID } from '@harmonia/content';
import { useContentText } from '@/content/use-content-text';
import { useDueReviews } from '@/components/review-entry';
import { useLocale } from '@/i18n';
import { useLearningState } from '@/state/learning';

export default function ReviewScreen() {
  const { t } = useTranslation();
  const text = useContentText(),
    locale = useLocale();
  const due = useDueReviews();
  const draft = useLearningState((s) => s.drafts[REVIEW_LESSON_ID]);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Stack.Screen options={{ headerShown: true, title: t('review.title') }} />
        <AppText variant="title1">{t('review.title')}</AppText>
        <AppText>{t('review.intro')}</AppText>
        {!due.ready ? (
          <AppText>{t('path.loading')}</AppText>
        ) : (
          <>
            {due.memory ? <AppText>{t('review.memory')}</AppText> : null}
            <AppText aria-live="polite">
              {t('review.due', { skills: due.skills.length, cards: due.cards.length })}
            </AppText>
            {due.skills.length || draft ? (
              <Card>
                <View style={styles.content}>
                  <AppText variant="title2">{t('review.skillsTitle')}</AppText>
                  {due.skills.slice(0, 10).map((s) => (
                    <AppText key={s.id}>{text(s.titleKey)}</AppText>
                  ))}
                  <Button
                    label={t('review.skillsStart')}
                    onPress={() => {
                      router.push({ pathname: '/lesson', params: { id: REVIEW_LESSON_ID } });
                    }}
                  />
                </View>
              </Card>
            ) : null}
            {due.cards.length ? <AppText variant="title2">{t('review.cardsTitle')}</AppText> : null}
            {due.cards.slice(0, 10).map((card) => (
              <Button
                key={card.id}
                variant="secondary"
                label={t('review.cardOpen', { title: text(card.titleKey) })}
                onPress={() => {
                  router.push({ pathname: '/card-review', params: { id: card.id } });
                }}
              />
            ))}
            {!due.skills.length && !due.cards.length ? (
              <>
                <AppText>{t(due.learned ? 'review.empty' : 'review.new')}</AppText>
                {due.nextDue === null ? null : (
                  <AppText>
                    {t('review.next', {
                      date: new Intl.DateTimeFormat(locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(due.nextDue),
                    })}
                  </AppText>
                )}
              </>
            ) : null}
          </>
        )}
        <Button
          variant="ghost"
          label={t('lesson.home')}
          onPress={() => {
            router.dismissTo('/');
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

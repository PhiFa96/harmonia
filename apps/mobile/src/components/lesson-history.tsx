import type { LessonContent } from '@harmonia/content';
import { SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useLocale } from '@/i18n';
import type { SavedLessonSummary } from '@/storage/lesson-repository';
import { getLessonRepository } from '@/storage/lessons';

export function LessonHistory({
  lesson,
}: {
  readonly lesson: Pick<LessonContent, 'id' | 'contentVersion'>;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [latest, setLatest] = useState<SavedLessonSummary | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getLessonRepository()
        .then((repository) => repository.latest(lesson.id))
        .then(
          (result) => {
            if (active) {
              setLatest(result);
              setError(false);
            }
          },
          () => {
            if (active) setError(true);
          },
        );
      return () => {
        active = false;
      };
    }, [retry, lesson.id]),
  );
  if (error)
    return (
      <>
        <AppText tone="muted">{t('lesson.loadError')}</AppText>
        <Button
          variant="ghost"
          size="medium"
          label={t('lesson.retryLoad')}
          onPress={() => {
            setRetry((value) => value + 1);
          }}
        />
      </>
    );
  if (!latest) return null;
  return (
    <Card>
      <View style={styles.content}>
        <AppText variant="title3">{t('lesson.latestTitle')}</AppText>
        <AppText>
          {t('lesson.latestSummary', { correct: latest.correct, answered: latest.answered })}
        </AppText>
        {latest.review_answered > 0 ? (
          <AppText>
            {t('lesson.latestReview', {
              correct: latest.review_correct,
              total: latest.review_answered,
            })}
          </AppText>
        ) : null}
        {latest.review_skipped > 0 ? (
          <AppText>{t('lesson.reviewSkipped', { count: latest.review_skipped })}</AppText>
        ) : null}
        {latest.skipped > 0 ? (
          <AppText>{t('exercise.skippedSummary', { count: latest.skipped })}</AppText>
        ) : null}
        <AppText variant="footnote" tone="muted">
          {t('lesson.latestDate', {
            date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
              new Date(latest.finished_at),
            ),
          })}
        </AppText>
        {latest.content_version !== lesson.contentVersion ? (
          <AppText variant="footnote" tone="muted">
            {t('lesson.olderVersion')}
          </AppText>
        ) : null}
      </View>
    </Card>
  );
}
const styles = StyleSheet.create({ content: { gap: SPACE.s } });

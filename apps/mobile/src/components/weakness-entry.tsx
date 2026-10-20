import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { catalogue } from '@harmonia/content/catalogue';
import { weaknessPlan, weakestSkills, WEAKNESS_LESSON_ID } from '@harmonia/content';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { SPACE } from '@harmonia/ui';
import { StyleSheet, View } from 'react-native';
import { useLearningState } from '@/state/learning';
import { useLearningRatings } from '@/storage/use-learning-ratings';
import { useContentText } from '@/content/use-content-text';

export function WeaknessEntry() {
  const { t } = useTranslation();
  const text = useContentText();
  const ratings = useLearningRatings();
  const path = useLearningState((s) => s.path);
  const ready = useLearningState((s) => s.phase === 'ready');
  const plan = useMemo(
    () =>
      weaknessPlan(
        catalogue,
        ratings,
        path
          .flatMap((unit) => unit.lessons)
          .filter((lesson) => lesson.status !== 'locked')
          .map((l) => l.id),
        Date.now(),
      ),
    [path, ratings],
  );
  const skills = weakestSkills(
    ratings,
    new Set(plan?.exerciseSources.flatMap((s) => s.skillIds) ?? []),
  ).flatMap((id) => {
    const skill = catalogue.skills.find((s) => s.id === id);
    return skill ? [text(skill.titleKey)] : [];
  });
  return (
    <Card>
      <View style={styles.content}>
        <AppText variant="title3">{t('adaptive.weaknessTitle')}</AppText>
        <AppText tone="muted">
          {t(plan ? 'adaptive.weaknessIntro' : 'adaptive.weaknessEmpty')}
        </AppText>
        {skills.length ? (
          <AppText>{t('adaptive.focusSkills', { skills: skills.join(', ') })}</AppText>
        ) : null}
        <Button
          label={t('adaptive.weaknessStart')}
          disabled={!ready || !plan}
          onPress={() => {
            router.push({ pathname: '/lesson', params: { id: WEAKNESS_LESSON_ID } });
          }}
        />
      </View>
    </Card>
  );
}
const styles = StyleSheet.create({ content: { gap: SPACE.m } });

import { engineLanguage } from '@harmonia/i18n';
import { parseScore } from '@harmonia/notation';
import { ScoreView } from '@harmonia/notation/native';
import { LAYOUT as PAGE_LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card, useUiTheme } from '@harmonia/ui/native';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { LessonHistory } from '@/components/lesson-history';
import { useLocale } from '@/i18n';
import { firstLesson, lessonGroups } from '@/content';
import { useContentText } from '@/content/use-content-text';
import { useDeviceState } from '@/state/device';
import { DeviceStatus } from '@/components/device-status';

/** Beispiel bis zu den echten Lektionen: zeigt, dass das Notenbild auf allen Plattformen läuft. */
const EXAMPLE = 'treble | 4/4 | C4/4 D4/4 E4/4 F4/4 | G4/4 A4/4 B4/4 C5/4';
const LAYOUT = { endBarline: 'final' } as const;

export default function LearnScreen() {
  const { t } = useTranslation();
  const contentText = useContentText();
  const locale = useLocale();
  const { colors } = useUiTheme();
  const score = useMemo(() => parseScore(EXAMPLE), []);
  const describeOptions = useMemo(() => engineLanguage(locale), [locale]);
  const profile = useDeviceState((state) => state.data);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <AppText variant="title1">{t('tabs.learn')}</AppText>
        <DeviceStatus />
        {profile?.goal ? (
          <Card>
            <AppText variant="title3">{t('onboarding.learnWelcome')}</AppText>
            <AppText>
              {t('onboarding.learnPreference', {
                goal: t(`onboarding.goal_${profile.goal}`),
                count: profile.dailyGoal,
              })}
            </AppText>
            {profile.placement === 'requested' ? (
              <AppText variant="footnote" tone="muted">
                {t('onboarding.learnPlacement')}
              </AppText>
            ) : null}
          </Card>
        ) : null}
        {lessonGroups.length ? (
          lessonGroups.map(({ unit, level, lessons }) => (
            <View key={unit.id} testID={`lesson-group-${unit.id}`} style={styles.lesson}>
              <AppText variant="overline" tone="muted">
                {contentText(level.titleKey)}
              </AppText>
              <AppText variant="title2">{contentText(unit.titleKey)}</AppText>
              {lessons.map((lesson) => (
                <View key={lesson.id} style={styles.lesson}>
                  <Card>
                    <View style={styles.lesson}>
                      <AppText variant="title3">{contentText(lesson.titleKey)}</AppText>
                      <AppText variant="small" tone="muted">
                        {t('lesson.taskCount', { count: lesson.exercises.length })}
                      </AppText>
                      <Button
                        label={
                          lesson.id === firstLesson?.id ? t('lesson.open') : t('lesson.openAnother')
                        }
                        accessibilityLabel={
                          lesson.id === firstLesson?.id
                            ? t('lesson.open')
                            : t('lesson.openNamed', { title: contentText(lesson.titleKey) })
                        }
                        onPress={() => {
                          router.push({ pathname: '/lesson', params: { id: lesson.id } });
                        }}
                      />
                    </View>
                  </Card>
                  <LessonHistory lesson={lesson} />
                </View>
              ))}
            </View>
          ))
        ) : (
          <Card>
            <AppText>{t('learn.unavailable')}</AppText>
          </Card>
        )}
        <AppText>{t('learn.exampleScale')}</AppText>
        <Card style={styles.card}>
          <ScrollView horizontal contentContainerStyle={styles.score}>
            <ScoreView
              score={score}
              staffSpace={9}
              color={colors.text}
              layoutOptions={LAYOUT}
              describeOptions={describeOptions}
            />
          </ScrollView>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: PAGE_LAYOUT.screenPadding, paddingBottom: SPACE.xxxl },
  content: {
    width: '100%',
    maxWidth: PAGE_LAYOUT.maxContentWidth,
    alignSelf: 'center',
    gap: SPACE.m,
  },
  lesson: { gap: SPACE.m },
  card: { maxWidth: '100%' },
  score: { flexGrow: 0 },
});

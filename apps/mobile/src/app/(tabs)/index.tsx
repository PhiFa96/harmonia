import { engineLanguage } from '@harmonia/i18n';
import { parseScore } from '@harmonia/notation';
import { ScoreView } from '@harmonia/notation/native';
import { LAYOUT as PAGE_LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Card, useUiTheme } from '@harmonia/ui/native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { useMotivation, currentMotivation } from '@/state/motivation';
import { MotivationCard } from '@/components/motivation-card';
import { LearningPath } from '@/components/learning-path';
import { useLocale } from '@/i18n';
import { useDeviceState } from '@/state/device';
import { DeviceStatus } from '@/components/device-status';
import { EnergyCard } from '@/components/energy-card';
import { PlacementEntry } from '@/components/placement-entry';

/** Beispiel bis zu den echten Lektionen: zeigt, dass das Notenbild auf allen Plattformen läuft. */
const EXAMPLE = 'treble | 4/4 | C4/4 D4/4 E4/4 F4/4 | G4/4 A4/4 B4/4 C5/4';
const LAYOUT = { endBarline: 'final' } as const;

export default function LearnScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { colors } = useUiTheme();
  const score = useMemo(() => parseScore(EXAMPLE), []);
  const describeOptions = useMemo(() => engineLanguage(locale), [locale]);
  useMotivation((s) => s.data);
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
                count: currentMotivation().preferences.dailyGoal,
              })}
            </AppText>
          </Card>
        ) : null}
        <MotivationCard compact />
        <EnergyCard />
        <PlacementEntry />
        <LearningPath />
        <AppText>{t('learn.exampleScale')}</AppText>
        <Card style={styles.card}>
          <ScrollView
            horizontal
            contentContainerStyle={styles.score}
            {...(Platform.OS === 'web'
              ? { tabIndex: 0, 'aria-label': t('learn.exampleScale') }
              : {})}
          >
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

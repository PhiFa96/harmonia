import { engineLanguage } from '@harmonia/i18n';
import { firstLesson } from '@harmonia/content';
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

/** Beispiel bis zu den echten Lektionen: zeigt, dass das Notenbild auf allen Plattformen läuft. */
const EXAMPLE = 'treble | 4/4 | C4/4 D4/4 E4/4 F4/4 | G4/4 A4/4 B4/4 C5/4';
const LAYOUT = { endBarline: 'final' } as const;

export default function LearnScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { colors } = useUiTheme();
  const score = useMemo(() => parseScore(EXAMPLE), []);
  const describeOptions = useMemo(() => engineLanguage(locale), [locale]);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <AppText variant="title1">{t('tabs.learn')}</AppText>
        <Card>
          <View style={styles.lesson}>
            <AppText variant="title2">{t(firstLesson.titleKey)}</AppText>
            <AppText>{t('lesson.overview')}</AppText>
            <Button
              label={t('lesson.open')}
              onPress={() => {
                router.push('/lesson');
              }}
            />
          </View>
        </Card>
        <LessonHistory />
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

import { engineLanguage } from '@harmonia/i18n';
import { parseScore } from '@harmonia/notation';
import { ScoreView } from '@harmonia/notation/native';
import { AppText, Card, useUiTheme } from '@harmonia/ui/native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { PlaceholderScreen } from '@/components/placeholder-screen';
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
    <PlaceholderScreen title={t('tabs.learn')}>
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
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  card: { maxWidth: '100%' },
  score: { flexGrow: 0 },
});

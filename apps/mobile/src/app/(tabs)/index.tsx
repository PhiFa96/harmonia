import { parseScore } from '@harmonia/notation';
import { ScoreView } from '@harmonia/notation/native';
import { useTheme } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { useLanguage, useStrings } from '@/i18n';

/** Beispiel bis zu den echten Lektionen: zeigt, dass das Notenbild auf allen Plattformen läuft. */
const EXAMPLE = 'treble | 4/4 | C4/4 D4/4 E4/4 F4/4 | G4/4 A4/4 B4/4 C5/4';
const LAYOUT = { endBarline: 'final' } as const;

export default function LearnScreen() {
  const t = useStrings();
  const language = useLanguage();
  const { colors } = useTheme();
  const score = useMemo(() => parseScore(EXAMPLE), []);
  const describeOptions = useMemo(() => ({ language }), [language]);
  return (
    <PlaceholderScreen title={t.tabs.learn}>
      <Text style={{ color: colors.text }}>{t.exampleScale}</Text>
      <ScrollView horizontal contentContainerStyle={styles.score}>
        <ScoreView
          score={score}
          staffSpace={9}
          color={colors.text}
          layoutOptions={LAYOUT}
          describeOptions={describeOptions}
        />
      </ScrollView>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  score: { flexGrow: 0 },
});

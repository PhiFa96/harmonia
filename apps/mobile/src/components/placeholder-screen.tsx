import { useTheme } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useStrings } from '@/i18n';

/** Platzhalter-Bildschirm, bis die echten Inhalte kommen. Typografie folgt mit dem Design-System (P1.06). */
export function PlaceholderScreen({ title, children }: { title: string; children?: ReactNode }) {
  const t = useStrings();
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text role="heading" style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={{ color: colors.text }}>{t.placeholder}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 24, fontWeight: '600' },
});

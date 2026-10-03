import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useStrings } from '@/i18n';

/** Platzhalter-Bildschirm, bis die echten Inhalte kommen. Farben und Typografie folgen mit dem Design-System (P1.06). */
export function PlaceholderScreen({ title, children }: { title: string; children?: ReactNode }) {
  const t = useStrings();
  return (
    <View style={styles.container}>
      <Text role="heading" style={styles.title}>
        {title}
      </Text>
      <Text>{t.placeholder}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 24, fontWeight: '600' },
});

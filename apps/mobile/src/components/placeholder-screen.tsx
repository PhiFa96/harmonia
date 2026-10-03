import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText } from '@harmonia/ui/native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/** Platzhalter-Bildschirm, bis die echten Inhalte kommen. */
export function PlaceholderScreen({ title, children }: { title: string; children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <AppText variant="title1">{title}</AppText>
      <AppText tone="muted">{t('placeholder')}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.m,
    padding: LAYOUT.screenPadding,
  },
});

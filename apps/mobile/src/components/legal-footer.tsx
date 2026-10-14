import { Platform, View, StyleSheet } from 'react-native';
import { SPACE } from '@harmonia/ui';
import { Link } from 'expo-router';
import { AppText } from '@harmonia/ui/native';
import { useTranslation } from 'react-i18next';
export function LegalFooter() {
  const { t } = useTranslation();
  return Platform.OS === 'web' ? (
    <View style={styles.footer}>
      <Link href="/legal" accessibilityRole="link">
        <AppText variant="footnote">{t('legal.title')}</AppText>
      </Link>
      <Link href="/cancel-subscription" accessibilityRole="link">
        <AppText variant="footnote">{t('cancellation.title')}</AppText>
      </Link>
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.m, padding: SPACE.s },
});

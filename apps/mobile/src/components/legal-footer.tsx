import { Platform } from 'react-native';
import { Link } from 'expo-router';
import { AppText } from '@harmonia/ui/native';
import { useTranslation } from 'react-i18next';
export function LegalFooter() {
  const { t } = useTranslation();
  return Platform.OS === 'web' ? (
    <Link href="/cancel-subscription" accessibilityRole="link">
      <AppText variant="footnote">{t('cancellation.title')}</AppText>
    </Link>
  ) : null;
}

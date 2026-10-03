import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function PracticeScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('tabs.practice')} />;
}

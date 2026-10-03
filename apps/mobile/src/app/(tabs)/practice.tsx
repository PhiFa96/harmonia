import { PlaceholderScreen } from '@/components/placeholder-screen';
import { useStrings } from '@/i18n';

export default function PracticeScreen() {
  const t = useStrings();
  return <PlaceholderScreen title={t.tabs.practice} />;
}

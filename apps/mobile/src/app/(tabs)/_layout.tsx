import { Tabs } from 'expo-router/js-tabs';

import { useStrings } from '@/i18n';

export default function TabLayout() {
  const t = useStrings();
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: t.tabs.learn }} />
      <Tabs.Screen name="practice" options={{ title: t.tabs.practice }} />
      <Tabs.Screen name="profile" options={{ title: t.tabs.profile }} />
    </Tabs>
  );
}

import { FONT_FAMILIES } from '@harmonia/ui';
import type { IconName } from '@harmonia/ui/native';
import { Icon, useUiTheme } from '@harmonia/ui/native';
import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';
import { useTranslation } from 'react-i18next';

/** Symbol eines Tabs, gefüllt wenn aktiv */
function tabIcon(name: IconName) {
  return ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Icon name={name} color={color} filled={focused} size={26} />
  );
}

export default function TabLayout() {
  const { t } = useTranslation();
  const { colors } = useUiTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primaryText,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: FONT_FAMILIES.bold, fontSize: 12 },
        headerTitleStyle: { fontFamily: FONT_FAMILIES.extrabold },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.learn'), tabBarIcon: tabIcon('path') }} />
      <Tabs.Screen
        name="practice"
        options={{ title: t('tabs.practice'), tabBarIcon: tabIcon('metronome') }}
      />
      <Tabs.Screen
        name="tutor"
        options={{ title: t('tutor.title'), tabBarIcon: tabIcon('sparkle') }}
      />
      <Tabs.Screen
        name="leagues"
        options={{ title: t('leagues.title'), tabBarIcon: tabIcon('crown') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile'), tabBarIcon: tabIcon('person') }}
      />
    </Tabs>
  );
}

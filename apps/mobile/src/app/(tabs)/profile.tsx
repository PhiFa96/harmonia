import { useTheme } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import type { Language } from '@/i18n';
import { useStrings } from '@/i18n';
import { useSettings } from '@/state/settings';

const OPTIONS: readonly (Language | 'device')[] = ['device', 'de', 'en'];

export default function ProfileScreen() {
  const t = useStrings();
  const language = useSettings((state) => state.language);
  const setLanguage = useSettings((state) => state.setLanguage);
  const { colors } = useTheme();
  return (
    <PlaceholderScreen title={t.tabs.profile}>
      <View role="radiogroup" aria-label={t.languageLabel} style={styles.options}>
        {OPTIONS.map((option) => {
          const selected = (language ?? 'device') === option;
          return (
            <Pressable
              key={option}
              role="radio"
              aria-checked={selected}
              onPress={() => {
                setLanguage(option === 'device' ? null : option);
              }}
              style={[
                styles.option,
                { borderColor: colors.border },
                selected && [styles.selected, { borderColor: colors.primary }],
              ]}
            >
              <Text style={{ color: colors.text }}>{t.languageOptions[option]}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text role="heading" style={[styles.licenses, { color: colors.text }]}>
        {t.licensesTitle}
      </Text>
      <Text style={[styles.license, { color: colors.text }]}>{t.bravuraLicense}</Text>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: 'row', gap: 8 },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selected: { borderWidth: 2 },
  licenses: { marginTop: 24, fontWeight: '600' },
  license: { textAlign: 'center' },
});

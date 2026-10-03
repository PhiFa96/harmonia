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
              style={[styles.option, selected && styles.selected]}
            >
              <Text>{t.languageOptions[option]}</Text>
            </Pressable>
          );
        })}
      </View>
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
});

import type { AppLocale } from '@harmonia/i18n';
import { APP_LOCALES, LOCALE_NAMES } from '@harmonia/i18n';
import { Link, useTheme } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { useSettings } from '@/state/settings';

const OPTIONS: readonly (AppLocale | 'device')[] = ['device', ...APP_LOCALES];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const locale = useSettings((state) => state.locale);
  const setLocale = useSettings((state) => state.setLocale);
  const { colors } = useTheme();
  return (
    <PlaceholderScreen title={t('tabs.profile')}>
      <View role="radiogroup" aria-label={t('profile.language')} style={styles.options}>
        {OPTIONS.map((option) => {
          const selected = (locale ?? 'device') === option;
          return (
            <Pressable
              key={option}
              role="radio"
              aria-checked={selected}
              onPress={() => {
                setLocale(option === 'device' ? null : option);
              }}
              style={[
                styles.option,
                { borderColor: colors.border },
                selected && [styles.selected, { borderColor: colors.primary }],
              ]}
            >
              <Text style={{ color: colors.text }}>
                {option === 'device' ? t('profile.languageDevice') : LOCALE_NAMES[option]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text role="heading" style={[styles.licenses, { color: colors.text }]}>
        {t('profile.licenses')}
      </Text>
      <Text style={[styles.license, { color: colors.text }]}>{t('profile.bravuraLicense')}</Text>
      <Link href="/audio-test" style={[styles.link, { color: colors.primary }]}>
        {t('profile.audioTest')}
      </Link>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
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
  link: { marginTop: 24, minHeight: 44, textDecorationLine: 'underline' },
});

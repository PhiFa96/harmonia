import type { AppLocale } from '@harmonia/i18n';
import { APP_LOCALES, LOCALE_NAMES } from '@harmonia/i18n';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, ListGroup, ListItem } from '@harmonia/ui/native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { Option } from '@/components/option-sheet';
import { OptionSheet } from '@/components/option-sheet';
import type { Appearance } from '@/state/settings';
import { useSettings } from '@/state/settings';
import { MotivationCard } from '@/components/motivation-card';
import { ReportStatus } from '@/components/report-status';
import { LearningProfile } from '@/components/learning-profile';

type LanguageChoice = AppLocale | 'device';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const settings = useSettings();
  const [sheet, setSheet] = useState<'language' | 'appearance' | null>(null);
  const close = () => {
    setSheet(null);
  };

  const languages: readonly Option<LanguageChoice>[] = [
    { value: 'device', label: t('profile.languageDevice') },
    ...APP_LOCALES.map((locale) => ({ value: locale, label: LOCALE_NAMES[locale] })),
  ];
  const appearances: readonly Option<Appearance>[] = [
    { value: 'system', label: t('profile.appearanceSystem') },
    { value: 'light', label: t('profile.appearanceLight') },
    { value: 'dark', label: t('profile.appearanceDark') },
  ];
  const language = settings.locale ?? 'device';
  const labelOf = <T extends string>(options: readonly Option<T>[], value: T): string =>
    options.find((option) => option.value === value)?.label ?? '';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <LearningProfile />
        <MotivationCard />
        <ReportStatus />
        <ListGroup>
          <ListItem
            icon="sparkle"
            label={t('billing.title')}
            onPress={() => {
              router.push('/subscription');
            }}
            last
          />
        </ListGroup>
        <AppText variant="overline" tone="muted">
          {t('profile.settings')}
        </AppText>
        <ListGroup>
          <ListItem
            icon="globe"
            label={t('profile.language')}
            value={labelOf(languages, language)}
            onPress={() => {
              setSheet('language');
            }}
          />
          <ListItem
            icon="moon"
            label={t('profile.appearance')}
            value={labelOf(appearances, settings.appearance)}
            onPress={() => {
              setSheet('appearance');
            }}
          />
          <ListItem
            icon="vibration"
            label={t('profile.haptics')}
            toggle={{ value: settings.haptics, onValueChange: settings.setHaptics }}
          />
          <ListItem
            icon="motion"
            label={t('profile.reduceMotion')}
            accessibilityHint={t('profile.reduceMotionHint')}
            toggle={{ value: settings.reduceMotion, onValueChange: settings.setReduceMotion }}
            last
          />
        </ListGroup>
        <AppText variant="overline" tone="muted">
          {t('profile.more')}
        </AppText>
        <ListGroup>
          <ListItem
            icon="speaker"
            label={t('profile.audioTest')}
            onPress={() => {
              router.push('/audio-test');
            }}
            last={!__DEV__}
          />
          {__DEV__ ? (
            <ListItem
              icon="sparkle"
              label={t('profile.gallery')}
              onPress={() => {
                router.push('/gallery');
              }}
              last
            />
          ) : null}
        </ListGroup>
        <ListGroup>
          <ListItem
            label={t('privacy.title')}
            onPress={() => {
              router.push('/privacy');
            }}
          />
          <ListItem
            label={t('legal.title')}
            onPress={() => {
              router.push('/legal');
            }}
            last
          />
        </ListGroup>
        <AppText variant="title3">{t('profile.licenses')}</AppText>
        <AppText variant="footnote" tone="muted">
          {t('profile.bravuraLicense')}
        </AppText>
        <AppText variant="footnote" tone="muted">
          {t('profile.figtreeLicense')}
        </AppText>
        <AppText variant="footnote" tone="muted">
          {t('profile.accidentalsLicense')}
        </AppText>
        <AppText variant="footnote" tone="muted">
          {t('profile.pianoLicense')}
        </AppText>
      </View>
      <OptionSheet
        visible={sheet === 'language'}
        onClose={close}
        title={t('profile.language')}
        options={languages}
        selected={language}
        onSelect={(value) => {
          settings.setLocale(value === 'device' ? null : value);
        }}
      />
      <OptionSheet
        visible={sheet === 'appearance'}
        onClose={close}
        title={t('profile.appearance')}
        options={appearances}
        selected={settings.appearance}
        onSelect={settings.setAppearance}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: LAYOUT.screenPadding },
  content: {
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
    gap: SPACE.m,
  },
});

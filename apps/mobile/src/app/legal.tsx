import { FSRS_LICENSE } from '@/legal/ts-fsrs-license';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { legalConfig, legalReady } from '@/legal/config';
import { useLocale } from '@/i18n';
export default function LegalScreen() {
  const { t } = useTranslation(),
    locale = useLocale(),
    router = useRouter(),
    config = legalConfig(),
    [error, setError] = useState(false);
  const links = [
    ['terms', locale === 'de' ? config.termsDe : config.termsEn],
    ['privacy', locale === 'de' ? config.privacyDe : config.privacyEn],
    ['imprint', config.imprint],
    ['withdrawal', locale === 'de' ? config.withdrawalDe : config.withdrawalEn],
  ] as const;
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('legal.title') }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <AppText variant="title1">{t('legal.title')}</AppText>
          {!legalReady() ? (
            <Card>
              <AppText>{t('legal.preparation')}</AppText>
            </Card>
          ) : null}
          {links.map(([key, url]) => (
            <Button
              key={key}
              variant="secondary"
              label={t(key === 'withdrawal' ? 'legal.withdrawal' : `paywall.${key}`)}
              disabled={!url}
              onPress={() => {
                if (url)
                  void Linking.openURL(url).catch(() => {
                    setError(true);
                  });
              }}
            />
          ))}
          <Button
            variant="secondary"
            label={t('privacy.title')}
            onPress={() => {
              router.push('/privacy');
            }}
          />
          <Button
            variant="secondary"
            label={t('cancellation.title')}
            onPress={() => {
              router.push('/cancel-subscription');
            }}
          />
          <AppText variant="title2">{t('profile.licenses')}</AppText>
          {(
            [
              'bravuraLicense',
              'figtreeLicense',
              'accidentalsLicense',
              'pianoLicense',
              'fsrsLicense',
            ] as const
          ).map((key) => (
            <AppText key={key} variant="footnote">
              {t(`profile.${key}`)}
            </AppText>
          ))}
          <AppText variant="footnote">{FSRS_LICENSE}</AppText>
          <AppText variant="title2">{t('legal.aiTitle')}</AppText>
          <AppText>{t('legal.aiBody')}</AppText>
          {error ? <AppText role="alert">{t('billing.linkError')}</AppText> : null}
        </View>
      </ScrollView>
    </>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: LAYOUT.screenPadding },
  content: { alignSelf: 'center', width: '100%', maxWidth: LAYOUT.maxContentWidth, gap: SPACE.m },
});

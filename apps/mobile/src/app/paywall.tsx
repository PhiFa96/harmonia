import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { useBilling, purchaseBilling, restoreBilling, refreshBilling } from '@/billing/state';
import { useAccess, refreshAccess } from '@/access/state';
import { legalConfig, legalReady } from '@/legal/config';
import { useLocale } from '@/i18n';
import { EnergyCard } from '@/components/energy-card';
export default function PaywallScreen() {
  const { t } = useTranslation(),
    locale = useLocale(),
    router = useRouter(),
    params = useLocalSearchParams<{ reason?: string }>(),
    billing = useBilling(),
    access = useAccess();
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly'),
    [linkError, setLinkError] = useState(false);
  const legal = legalConfig(),
    reason =
      params.reason === 'onboarding' ||
      params.reason === 'limit' ||
      params.reason === 'premium' ||
      params.reason === 'tutor'
        ? params.reason
        : 'settings';
  useEffect(() => {
    void refreshAccess();
  }, []);
  const active = access.status?.tier !== 'free' && !!access.status;
  const canBuy =
    legalReady() &&
    access.status?.policy.checkoutEnabled &&
    billing.phase === 'ready' &&
    billing.status?.configured &&
    !billing.busy &&
    !billing.customer?.active &&
    !active &&
    !['pending', 'storePending'].includes(billing.notice ?? '');
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  const open = (url: string | null) => {
    if (url)
      void Linking.openURL(url).catch(() => {
        setLinkError(true);
      });
  };
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('paywall.title') }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <AppText variant="title1">{t('paywall.title')}</AppText>
          <AppText tone="muted">{t(`paywall.reason_${reason}`)}</AppText>
          <Button
            variant="ghost"
            label={t(reason === 'onboarding' ? 'paywall.skip' : 'paywall.close')}
            onPress={close}
          />
          <EnergyCard offer={false} />
          <AppText variant="title2">{t('paywall.compare')}</AppText>
          <View style={styles.compare}>
            {(['free', 'premium', 'max'] as const).map((tier) => (
              <Card key={tier} style={styles.column}>
                <AppText variant="title3">{t(`billing.tier_${tier}`)}</AppText>
                <AppText>{t(`paywall.course_${tier}`)}</AppText>
                <AppText>
                  {t(tier === 'free' ? 'paywall.energyLimited' : 'paywall.unlimited')}
                </AppText>
                <AppText>{t(`paywall.tutor_${tier}`)}</AppText>
                {tier === 'max' ? (
                  <AppText variant="footnote" tone="muted">
                    {t('paywall.maxPreparing')}
                  </AppText>
                ) : null}
              </Card>
            ))}
          </View>
          <AppText variant="footnote" tone="muted">
            {t('paywall.learningRule')}
          </AppText>
          <View style={styles.period}>
            {(['monthly', 'annual'] as const).map((value) => (
              <Button
                key={value}
                variant={period === value ? 'primary' : 'secondary'}
                label={t(`paywall.${value}`)}
                onPress={() => {
                  setPeriod(value);
                }}
              />
            ))}
          </View>
          {billing.phase === 'guest' ? (
            <>
              <AppText>{t('billing.signInBody')}</AppText>
              <Button
                label={t('billing.signIn')}
                onPress={() => {
                  router.push('/account');
                }}
              />
            </>
          ) : null}
          {!canBuy ? (
            <AppText aria-live="polite">
              {t(
                active
                  ? 'billing.manageExisting'
                  : billing.phase === 'loading'
                    ? 'billing.loading'
                    : 'paywall.unavailable',
              )}
            </AppText>
          ) : null}
          {billing.offers
            .filter((o) => o.period === period)
            .map((offer) => (
              <Card key={offer.id}>
                <AppText variant="title3">{t(`billing.tier_${offer.tier}`)}</AppText>
                <AppText variant="title2">
                  {t(offer.period === 'monthly' ? 'billing.monthly' : 'billing.annual', {
                    price: offer.price,
                  })}
                </AppText>
                <AppText variant="footnote" tone="muted">
                  {t('billing.renewal')}
                </AppText>
                <Button
                  label={t(
                    offer.period === 'monthly' ? 'billing.buyMonthly' : 'billing.buyAnnual',
                    { tier: t(`billing.tier_${offer.tier}`) },
                  )}
                  disabled={!canBuy}
                  onPress={() => void purchaseBilling(offer.id, locale)}
                />
              </Card>
            ))}
          {!billing.offers.length ? <AppText>{t('billing.noOffers')}</AppText> : null}
          {billing.notice ? (
            <AppText aria-live="polite">{t(`billing.${billing.notice}`)}</AppText>
          ) : null}
          {billing.actor ? (
            <>
              <Button
                variant="secondary"
                label={t('billing.restore')}
                disabled={billing.busy || billing.phase === 'loading'}
                onPress={() => void restoreBilling()}
              />
              <AppText variant="footnote" tone="muted">
                {t('billing.restoreBody')}
              </AppText>
              <Button
                variant="ghost"
                label={t('billing.refresh')}
                disabled={billing.busy}
                onPress={() => {
                  void refreshBilling();
                  void refreshAccess();
                }}
              />
            </>
          ) : null}
          <Button
            variant="ghost"
            label={t('billing.title')}
            onPress={() => {
              router.push('/subscription');
            }}
          />
          <AppText variant="footnote" tone="muted">
            {t('paywall.purchaseTerms')}
          </AppText>
          <View style={styles.period}>
            <Button
              variant="ghost"
              label={t('paywall.terms')}
              disabled={!(locale === 'de' ? legal.termsDe : legal.termsEn)}
              onPress={() => {
                open(locale === 'de' ? legal.termsDe : legal.termsEn);
              }}
            />
            <Button
              variant="ghost"
              label={t('paywall.privacy')}
              disabled={!(locale === 'de' ? legal.privacyDe : legal.privacyEn)}
              onPress={() => {
                open(locale === 'de' ? legal.privacyDe : legal.privacyEn);
              }}
            />
            <Button
              variant="ghost"
              label={t('paywall.imprint')}
              disabled={!legal.imprint}
              onPress={() => {
                open(legal.imprint);
              }}
            />
          </View>
          {linkError ? <AppText role="alert">{t('billing.linkError')}</AppText> : null}
        </View>
      </ScrollView>
    </>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: LAYOUT.screenPadding },
  content: { alignSelf: 'center', width: '100%', maxWidth: LAYOUT.maxContentWidth, gap: SPACE.m },
  compare: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.m },
  column: { flexGrow: 1, flexBasis: SPACE.xxxl * 3, gap: SPACE.s },
  period: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s },
});

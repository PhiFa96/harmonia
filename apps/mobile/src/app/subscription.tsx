import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { Stack, useRouter } from 'expo-router';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { refreshBilling, restoreBilling, useBilling } from '@/billing/state';
import { useLocale } from '@/i18n';
export default function SubscriptionScreen() {
  const { t } = useTranslation(),
    locale = useLocale(),
    router = useRouter(),
    state = useBilling();
  const [linkError, setLinkError] = useState(false);
  useEffect(() => {
    setLinkError(false);
  }, [state.actor]);
  const active =
    state.status?.entitlements.filter((e) => e.active && Date.parse(e.expires_at) > Date.now()) ??
    [];
  const tier = active.some((e) => e.entitlement === 'max')
    ? 'max'
    : active.length
      ? 'premium'
      : 'free';
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('billing.title') }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <AppText variant="title1">{t('billing.title')}</AppText>
          <AppText tone="muted">{t('billing.accountBound')}</AppText>
          {state.phase === 'guest' ? (
            <Card>
              <AppText>{t('billing.signInBody')}</AppText>
              <Button
                label={t('billing.signIn')}
                onPress={() => {
                  router.push('/account');
                }}
              />
            </Card>
          ) : (
            <>
              {state.status ? (
                <Card>
                  <AppText variant="title3">
                    {t('billing.status', { tier: t(`billing.tier_${tier}`) })}
                  </AppText>
                  {active.map((e) => (
                    <View key={e.entitlement} style={styles.details}>
                      <AppText>
                        {t(
                          e.will_renew === false && !e.billing_issue
                            ? 'billing.ends'
                            : 'billing.validUntil',
                          {
                            date: new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(
                              new Date(e.expires_at),
                            ),
                          },
                        )}
                      </AppText>
                      {e.billing_issue ? <AppText>{t('billing.billingIssue')}</AppText> : null}
                    </View>
                  ))}
                  {state.status.simulation ? <AppText>{t('billing.simulation')}</AppText> : null}
                </Card>
              ) : null}
              {state.phase === 'loading' ? (
                <AppText aria-live="polite">{t('billing.loading')}</AppText>
              ) : null}
              {state.phase === 'unconfigured' || state.status?.configured === false ? (
                <AppText>{t('billing.unconfigured')}</AppText>
              ) : null}
              {state.phase === 'error' ? (
                <AppText aria-live="polite">{t('billing.error')}</AppText>
              ) : null}
              {!active.length ? (
                <Button
                  label={t('paywall.title')}
                  onPress={() => {
                    router.push({ pathname: '/paywall', params: { reason: 'settings' } });
                  }}
                />
              ) : null}
              {state.customer?.active || active.length ? (
                <AppText>{t('billing.manageExisting')}</AppText>
              ) : null}
              {state.notice ? (
                <AppText aria-live="polite">{t(`billing.${state.notice}`)}</AppText>
              ) : null}
              {state.phase !== 'unconfigured' ? (
                <>
                  <Button
                    variant="secondary"
                    label={t('billing.restore')}
                    disabled={state.busy || state.phase === 'loading'}
                    onPress={() => void restoreBilling()}
                  />
                  <AppText variant="footnote" tone="muted">
                    {t('billing.restoreBody')}
                  </AppText>
                  <Button
                    variant="ghost"
                    label={t('billing.refresh')}
                    disabled={state.busy || state.phase === 'loading'}
                    onPress={() => void refreshBilling()}
                  />
                </>
              ) : null}
              {state.customer?.managementUrl ? (
                <Button
                  variant="secondary"
                  label={t('billing.manage')}
                  disabled={state.busy}
                  onPress={() => {
                    const url = state.customer?.managementUrl;
                    if (url)
                      void Linking.openURL(url).catch(() => {
                        setLinkError(true);
                      });
                  }}
                />
              ) : null}
              {linkError ? <AppText aria-live="polite">{t('billing.linkError')}</AppText> : null}
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: LAYOUT.screenPadding },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', gap: SPACE.m },
  details: { gap: SPACE.s },
});

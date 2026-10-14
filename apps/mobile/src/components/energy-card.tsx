import { AppText, Button, Card } from '@harmonia/ui/native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAccess, refreshAccess } from '@/access/state';
import { useLocale } from '@/i18n';
export function EnergyCard({ offer = true }: { offer?: boolean }) {
  const { t } = useTranslation(),
    router = useRouter(),
    locale = useLocale(),
    { status, loading, error } = useAccess();
  return (
    <Card>
      <AppText variant="title3">{t('paywall.energy')}</AppText>
      {status ? (
        <>
          <AppText aria-live="polite">
            {status.remaining === null
              ? t('paywall.unlimited')
              : t('paywall.remaining', {
                  count: status.remaining,
                  total: status.policy.energyCapacity,
                })}
          </AppText>
          {status.remaining !== null ? (
            <>
              <AppText variant="footnote" tone="muted">
                {t('paywall.refill', { minutes: status.policy.energyRefillSeconds / 60 })}
              </AppText>
              {status.remaining < status.policy.energyCapacity ? (
                <AppText>
                  {t('paywall.nextEnergy', {
                    time: new Intl.DateTimeFormat(locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(status.resetAt)),
                  })}
                </AppText>
              ) : null}
              <AppText variant="footnote" tone="muted">
                {t('paywall.reservation')}
              </AppText>
            </>
          ) : null}
        </>
      ) : (
        <AppText>{t(loading ? 'paywall.loading' : 'paywall.accessError')}</AppText>
      )}
      {error ? (
        <Button
          variant="secondary"
          label={t('billing.refresh')}
          onPress={() => void refreshAccess()}
        />
      ) : null}
      {offer ? (
        <Button
          variant="ghost"
          label={t('paywall.title')}
          onPress={() => {
            router.push({ pathname: '/paywall', params: { reason: 'settings' } });
          }}
        />
      ) : null}
    </Card>
  );
}

import { useTranslation } from 'react-i18next';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { useAuthState } from '@/auth';
import { initializeReports, retryReports, useReports } from '@/state/reports';
export function ReportStatus() {
  const { t } = useTranslation(),
    state = useReports(),
    auth = useAuthState();
  const owner = auth.session?.user.id ?? 'guest';
  if (state.scope !== owner || state.phase === 'loading') return null;
  return (
    <Card>
      <AppText variant="title3">{t('report.queueTitle')}</AppText>
      {state.phase === 'error' ? (
        <>
          <AppText tone="danger">{t('report.loadError')}</AppText>
          <Button
            variant="ghost"
            label={t('report.retry')}
            onPress={() => {
              void initializeReports();
            }}
          />
        </>
      ) : (
        <>
          <AppText aria-live="polite">
            {t('report.queue', {
              pending: state.rows.filter((r) => r.status !== 'sent').length,
              sent: state.rows.filter((r) => r.status === 'sent').length,
            })}
          </AppText>
          <AppText tone="muted">
            {t(
              state.memory
                ? 'report.memory'
                : owner === 'guest'
                  ? 'report.guest'
                  : state.sync === 'syncing'
                    ? 'report.sending'
                    : 'report.account',
            )}
          </AppText>
          {state.sync === 'error' ? (
            <AppText tone="danger">{t('report.networkError')}</AppText>
          ) : null}
          {state.rows.some((r) => r.status === 'unavailable') ? (
            <AppText tone="danger">{t('report.unavailableSource')}</AppText>
          ) : null}
          {!state.memory && owner !== 'guest' && state.rows.some((r) => r.status !== 'sent') ? (
            <Button
              variant="ghost"
              label={t('report.retry')}
              disabled={state.sync === 'syncing'}
              onPress={() => {
                void retryReports();
              }}
            />
          ) : null}
        </>
      )}
    </Card>
  );
}

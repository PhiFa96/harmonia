import { useTranslation } from 'react-i18next';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { retryDeviceSave, useDeviceState } from '@/state/device';
export function DeviceStatus() {
  const { t } = useTranslation(),
    storage = useDeviceState((state) => state.storage);
  if (storage === 'saved') return null;
  return (
    <Card>
      <AppText
        variant="footnote"
        tone={storage === 'error' ? 'danger' : 'muted'}
        aria-live="polite"
      >
        {t(
          storage === 'error'
            ? 'onboarding.saveError'
            : storage === 'memory'
              ? 'onboarding.temporaryHint'
              : 'onboarding.saving',
        )}
      </AppText>
      {storage === 'error' ? (
        <Button
          size="medium"
          variant="ghost"
          label={t('onboarding.retry')}
          onPress={() => {
            void retryDeviceSave().catch(() => undefined);
          }}
        />
      ) : null}
    </Card>
  );
}

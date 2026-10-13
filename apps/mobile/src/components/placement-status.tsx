import { useTranslation } from 'react-i18next';
import { AppText, Button } from '@harmonia/ui/native';
import { retryPlacementSave, usePlacementState } from '@/state/placement';

export function PlacementStatus() {
  const { t } = useTranslation(),
    { storage, phase } = usePlacementState();
  if (phase !== 'ready') return null;
  if (storage === 'saved') return null;
  return (
    <>
      <AppText tone={storage === 'error' ? 'danger' : 'muted'} aria-live="polite">
        {t(
          storage === 'saving'
            ? 'placement.saving'
            : storage === 'error'
              ? 'placement.saveError'
              : 'onboarding.temporaryHint',
        )}
      </AppText>
      {storage === 'error' ? (
        <Button
          variant="secondary"
          label={t('onboarding.retry')}
          onPress={() => {
            void retryPlacementSave().catch(() => undefined);
          }}
        />
      ) : null}
    </>
  );
}

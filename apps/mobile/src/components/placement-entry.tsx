import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { bank, initializePlacement, usePlacementState } from '@/state/placement';
import { useDeviceState } from '@/state/device';
import { PlacementStatus } from './placement-status';
import { useLearningState } from '@/state/learning';
import { useAuthState } from '@/auth';
import { EMPTY_PLACEMENT } from '@/placement/model';

export function PlacementEntry() {
  const { t } = useTranslation(),
    router = useRouter(),
    store = usePlacementState();
  const learning = useLearningState(),
    owner = useAuthState((s) => s.session?.user.id ?? 'guest');
  const state =
    learning.phase === 'ready' && learning.scope === owner
      ? store
      : { ...store, data: EMPTY_PLACEMENT };
  const requested = useDeviceState((s) => s.data?.placement === 'requested');
  useEffect(() => {
    void initializePlacement();
  }, []);
  return (
    <Card>
      <AppText variant="title3">{t('placement.title')}</AppText>
      <AppText tone="muted">
        {t(
          !bank.areas.length
            ? 'placement.unavailable'
            : state.data.active
              ? 'placement.paused'
              : state.data.last
                ? 'placement.savedResult'
                : requested
                  ? 'placement.requested'
                  : 'placement.offer',
        )}
      </AppText>
      <Button
        variant="secondary"
        label={t(
          state.data.active
            ? 'placement.resume'
            : state.data.last
              ? 'placement.viewResult'
              : 'placement.open',
        )}
        onPress={() => {
          router.push('/placement');
        }}
      />
      <PlacementStatus />
    </Card>
  );
}

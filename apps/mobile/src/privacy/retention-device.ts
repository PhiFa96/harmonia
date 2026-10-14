import { getDeviceRepository } from '@/storage/device';
import { useDeviceState, updateOnboarding } from '@/state/device';
import { usePlacementState } from '@/state/placement';
export async function retainDeviceDetails(cutoff: number) {
  const repo = await getDeviceRepository(),
    data = await repo.loadPlacement();
  if (data) {
    const next = {
      ...data,
      active: data.active && data.active.startedAt < cutoff ? null : data.active,
      last: data.last && (data.last.endedAt ?? data.last.startedAt) < cutoff ? null : data.last,
    };
    if (JSON.stringify(next) !== JSON.stringify(data)) {
      await repo.savePlacement(next);
    }
  }
  const activeState = usePlacementState.getState().data;
  const active =
    activeState.active && activeState.active.startedAt < cutoff ? null : activeState.active;
  const last =
    activeState.last && (activeState.last.endedAt ?? activeState.last.startedAt) < cutoff
      ? null
      : activeState.last;
  if (active !== activeState.active || last !== activeState.last)
    usePlacementState.setState({ data: { ...activeState, active, last } });
  const profile = useDeviceState.getState().data;
  if (profile?.step === 'complete' && profile.startedAt < cutoff && profile.mini.answer !== null)
    updateOnboarding((value) => ({
      ...value,
      mini: { seed: 0, answer: null, hintLevel: 0, checked: false, detailsRemoved: true },
    }));
}

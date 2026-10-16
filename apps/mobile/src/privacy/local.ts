import { clearLeagues, useLeagues } from '@/state/leagues';
import { eraseMotivationMemory } from '@/state/motivation';
import { eraseReportsMemory } from '@/state/reports';
import { useLearningState } from '@/state/learning';
import { getLearningRepository } from '@/storage/learning';
import { getMotivationRepository } from '@/storage/motivation';
import { getReportRepository } from '@/storage/reports';
import { getLessonRepository } from '@/storage/lessons';
import { eraseAccessScope } from '@/access/storage';
import { blockErasedScope } from './guard.ts';
import { erasePrivacyScope } from './storage.ts';
import { useDeviceState, retryDeviceSave, flushDeviceWrites } from '@/state/device';
import { getDeviceRepository } from '@/storage/device';
import { newOnboarding } from '@/onboarding/model';
import { EMPTY_PLACEMENT } from '@/placement/model';
import { usePlacementState, flushPlacementWrites } from '@/state/placement';
import { erasePrivateExports } from '@/privacy/download';
import { useAuthState } from '@/auth';
import { cancelErasedReminders } from '@/reminders';
import { eraseProfileScope } from '@/state/profile';
/** Block delayed writes before draining each repository's serialized queue. */
export async function eraseLocalAccount(scope: string) {
  blockErasedScope(scope, []);
  if (useLeagues.getState().owner === scope) clearLeagues();
  await eraseProfileScope(scope);
  eraseMotivationMemory(scope);
  eraseReportsMemory(scope);
  const learning = await getLearningRepository(),
    rows = await learning.list(scope),
    drafts = await learning.drafts(scope),
    placement = await learning.placement(scope),
    activeState = useLearningState.getState();
  const ids = [
    ...rows.map((row) => row.event.id),
    ...Object.values(drafts).map((draft) => draft.id),
    ...[placement.active?.id, placement.last?.id].filter(
      (id): id is string => typeof id === 'string',
    ),
    ...(activeState.scope === scope ? activeState.rows.map((row) => row.event.id) : []),
  ];
  blockErasedScope(scope, ids);
  await flushPlacementWrites().catch(() => undefined);
  await (await getLessonRepository()).eraseIds(ids);
  await learning.eraseScope(scope);
  if (useLearningState.getState().scope === scope)
    useLearningState.setState({
      rows: [],
      drafts: {},
      reviews: null,
      ratings: null,
      phase: 'loading',
      path: [],
    });
  await (await getReportRepository()).eraseScope(scope);
  await (await getMotivationRepository()).eraseScope(scope);
  await cancelErasedReminders(scope);
  await eraseAccessScope(scope);
  await erasePrivacyScope(scope);
  erasePrivateExports(scope);
  const empty = newOnboarding(Date.now());
  await flushDeviceWrites().catch(() => undefined);
  await (await getDeviceRepository()).eraseAccount(scope, ids, empty);
  if (useAuthState.getState().session?.user.id === scope)
    usePlacementState.setState({ data: EMPTY_PLACEMENT });
  if (useDeviceState.getState().data?.accountId === scope) {
    useDeviceState.setState({ data: empty, completed: false });
    await retryDeviceSave();
  }
}

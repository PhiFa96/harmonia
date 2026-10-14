import { retentionCutoff } from '@harmonia/content';
import { catalogue } from '@harmonia/content/catalogue';
import { getLearningRepository } from '@/storage/learning';
import { getLessonRepository } from '@/storage/lessons';
import { getReportRepository } from '@/storage/reports';
import { getAccessRepository } from '@/access/storage';
import { retainDeviceDetails } from './retention-device.ts';
import { privacyOwner } from './state.ts';
import { useDeviceState } from '@/state/device';
/** Raw caches expire independently of network availability. */
export async function retainLocalData(now = Date.now()) {
  if (useDeviceState.getState().storage === 'memory') return;
  const scope = privacyOwner(),
    cutoff = retentionCutoff(now),
    repo = await getLearningRepository();
  const ids = await repo.compact(scope, catalogue, cutoff);
  await (await getLessonRepository()).eraseIds(ids);
  await (await getAccessRepository()).eraseIds(ids);
  await (await getReportRepository()).pruneBefore(cutoff);
  await retainDeviceDetails(cutoff);
}

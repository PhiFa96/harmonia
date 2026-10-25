import { catalogue } from '@harmonia/content/catalogue';
import { localReviewState } from '@harmonia/content';
import { getLearningRepository } from '@/storage/learning';
import { getMotivationRepository } from '@/storage/motivation';
import { getReportRepository } from '@/storage/reports';
import { useDeviceState } from '@/state/device';
import { useLearningState } from '@/state/learning';
import { usePlacementState } from '@/state/placement';
import { useMotivation } from '@/state/motivation';
import { useReports } from '@/state/reports';
import { useTutor } from '@/tutor/state';
import { useAccess } from '@/access/state';
import { getProfileRepository } from '@/storage/profile';
import { useProfile } from '@/state/profile';
import { readPreviewMemory } from '@/preview/memory';
export async function exportLocalData(scope: string) {
  const temporary = useDeviceState.getState().storage === 'memory',
    state = useLearningState.getState(),
    motive = useMotivation.getState(),
    reports = useReports.getState(),
    tutor = useTutor.getState(),
    access = useAccess.getState();
  const learning = temporary ? null : await getLearningRepository();
  if (learning) await learning.prunePreviews(Date.now());
  const preview = learning ? await learning.preview(scope) : readPreviewMemory(scope);
  return {
    levelFivePreview: preview ? (JSON.parse(preview) as unknown) : null,
    profile: temporary
      ? useProfile.getState().scope === scope
        ? useProfile.getState().data
        : null
      : await (await getProfileRepository()).load(scope),
    device:
      useDeviceState.getState().data?.accountId === scope ||
      (scope === 'guest' && !useDeviceState.getState().data?.accountId)
        ? useDeviceState.getState().data
        : null,
    learning: learning ? await learning.list(scope) : state.scope === scope ? state.rows : [],
    reviewSchedule: learning
      ? localReviewState(catalogue, await learning.list(scope), await learning.reviews(scope))
      : state.scope === scope
        ? localReviewState(catalogue, state.rows, state.reviews)
        : null,
    drafts: learning ? await learning.drafts(scope) : state.scope === scope ? state.drafts : {},
    placement: learning
      ? await learning.placement(scope)
      : state.scope === scope
        ? usePlacementState.getState().data
        : null,
    motivation: temporary
      ? motive.scope === scope
        ? motive.data
        : null
      : await (await getMotivationRepository()).read(scope),
    reports: temporary
      ? reports.scope === scope
        ? reports.rows
        : []
      : await (await getReportRepository()).list(scope),
    reportDraft: reports.draft?.owner === scope ? reports.draft : null,
    tutor:
      tutor.actor === scope
        ? {
            scope: tutor.scope,
            entry: tutor.entry,
            messages: tutor.messages,
            current: tutor.current,
            retry: tutor.retry,
          }
        : null,
    energy: access.owner === scope ? access.status : null,
  };
}

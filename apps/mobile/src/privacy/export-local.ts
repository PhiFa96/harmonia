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
export async function exportLocalData(scope: string) {
  const temporary = useDeviceState.getState().storage === 'memory',
    state = useLearningState.getState(),
    motive = useMotivation.getState(),
    reports = useReports.getState(),
    tutor = useTutor.getState(),
    access = useAccess.getState();
  const learning = temporary ? null : await getLearningRepository();
  return {
    device:
      useDeviceState.getState().data?.accountId === scope ||
      (scope === 'guest' && !useDeviceState.getState().data?.accountId)
        ? useDeviceState.getState().data
        : null,
    learning: learning ? await learning.list(scope) : state.scope === scope ? state.rows : [],
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

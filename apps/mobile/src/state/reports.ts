import { create } from 'zustand';
import { randomUUID } from 'expo-crypto';
import { contentReportSchema, reportSourceSchema } from '@harmonia/content';
import type { ContentReport, ReportSource } from '@harmonia/content';
import type { AppLocale } from '@harmonia/i18n';
import { getAuthClient, useAuthState } from '../auth/index.ts';
import { useDeviceState } from './device.ts';
import { getReportRepository } from '../storage/reports.ts';
import type { StoredReport } from '../storage/report-repository.ts';

interface ReportDraft {
  readonly owner: string;
  readonly report: ContentReport;
  readonly prompt: string;
}
export const reportOwner = () => useAuthState.getState().session?.user.id ?? 'guest';
export const useReports = create<{
  phase: 'loading' | 'ready' | 'error';
  scope: string;
  rows: readonly StoredReport[];
  memory: boolean;
  sync: 'idle' | 'syncing' | 'error';
  draft: ReportDraft | null;
}>()(() => ({
  phase: 'loading',
  scope: 'guest',
  rows: [],
  memory: false,
  sync: 'idle',
  draft: null,
}));
const temporaryRows = new Map<string, StoredReport[]>();
let generation = 0,
  queue: Promise<unknown> = Promise.resolve(),
  syncing: Promise<void> | undefined,
  again = false;
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const work = queue.catch(() => undefined).then(fn);
  queue = work;
  return work;
}
async function refresh(owner: string, memory: boolean, token = generation) {
  const rows = memory
    ? (temporaryRows.get(owner) ?? [])
    : await (await getReportRepository()).list(owner);
  if (owner === reportOwner() && token === generation) useReports.setState({ rows });
}
export async function initializeReports() {
  const token = ++generation,
    owner = reportOwner(),
    memory = useDeviceState.getState().storage === 'memory';
  useReports.setState({
    phase: 'loading',
    scope: owner,
    rows: [],
    memory,
    sync: 'idle',
    draft: useReports.getState().draft?.owner === owner ? useReports.getState().draft : null,
  });
  try {
    await serialize(async () => {
      if (token !== generation || owner !== reportOwner()) return;
      if (memory) {
        if (owner !== 'guest') {
          temporaryRows.set(owner, [
            ...(temporaryRows.get(owner) ?? []),
            ...(temporaryRows.get('guest') ?? []),
          ]);
          temporaryRows.delete('guest');
        }
      } else await (await getReportRepository()).claimGuest(owner);
      await refresh(owner, memory, token);
      if (token === generation && owner === reportOwner()) useReports.setState({ phase: 'ready' });
    });
    void syncReports();
  } catch {
    if (token === generation && owner === reportOwner()) useReports.setState({ phase: 'error' });
  }
}
export function openReport(
  source: ReportSource,
  locale: AppLocale,
  prompt: string,
  answer: string | null,
  hintLevel: number,
  checked: boolean,
) {
  const report = contentReportSchema.parse({
    id: randomUUID(),
    createdAt: Date.now(),
    source: reportSourceSchema.parse(source),
    locale,
    answer,
    hintLevel,
    checked,
    category: 'question',
    message: '',
  });
  useReports.setState({ draft: { owner: reportOwner(), report, prompt } });
}
export async function saveReport(input: ContentReport, owner: string): Promise<void> {
  const report = contentReportSchema.parse(input),
    state = useReports.getState(),
    token = generation;
  if (owner !== reportOwner() || state.scope !== owner || state.phase !== 'ready')
    throw new Error('Meldungsspeicher nicht bereit');
  const memory = state.memory;
  await serialize(async () => {
    if (memory) {
      const rows = temporaryRows.get(owner) ?? [],
        old = rows.find((r) => r.report.id === report.id);
      if (old && JSON.stringify(old.report) !== JSON.stringify(report))
        throw new Error('Meldung verändert');
      if (!old) temporaryRows.set(owner, [...rows, { report, status: 'pending' }]);
    } else await (await getReportRepository()).save(owner, report);
    await refresh(owner, memory, token);
  });
  void syncReports();
}
/** Nur bestätigte Konten senden; jede Meldung bleibt bis zur exakten Bestätigung lokal. */
export function syncReports(): Promise<void> {
  if (syncing) {
    again = true;
    return syncing;
  }
  const state = useReports.getState(),
    owner = reportOwner(),
    session = useAuthState.getState().session,
    token = generation;
  if (
    state.phase !== 'ready' ||
    state.scope !== owner ||
    state.memory ||
    owner === 'guest' ||
    !session
  )
    return Promise.resolve();
  const client = getAuthClient();
  if (!client) return Promise.resolve();
  again = false;
  syncing = (async () => {
    const repo = await getReportRepository();
    for (let n = 0; n < 1000; n++) {
      if (owner !== reportOwner() || token !== generation) return;
      const pending = (await repo.list(owner)).filter((r) => r.status === 'pending');
      if (!pending.length) {
        await refresh(owner, false, token);
        if (owner === reportOwner() && token === generation) useReports.setState({ sync: 'idle' });
        return;
      }
      const reports: ContentReport[] = [];
      for (const row of pending.slice(0, 10)) {
        if (JSON.stringify([...reports, row.report]).length > 120000) break;
        reports.push(row.report);
      }
      if (!reports.length) throw new Error('Meldung zu groß');
      if (owner !== reportOwner() || token !== generation) return;
      useReports.setState({ sync: 'syncing' });
      const result = await client.functions.invoke('content-reports', {
        body: { reports },
        headers: { Authorization: `Bearer ${session.access_token}` },
        timeout: 15000,
      });
      if (result.error) throw new Error('Meldung nicht gesendet');
      await repo.acknowledge(owner, result.data, reports);
      await refresh(owner, false, token);
    }
    throw new Error('Meldungs-Seitenlimit');
  })()
    .catch(() => {
      again = false;
      if (owner === reportOwner() && token === generation) useReports.setState({ sync: 'error' });
    })
    .finally(() => {
      syncing = undefined;
      if (again || owner !== reportOwner() || token !== generation) void syncReports();
    });
  return syncing;
}
export async function retryReports() {
  const state = useReports.getState(),
    owner = reportOwner();
  if (state.phase !== 'ready' || state.scope !== owner || state.memory) return;
  try {
    await (await getReportRepository()).retry(owner);
    await refresh(owner, false);
    void syncReports();
  } catch {
    if (owner === reportOwner()) useReports.setState({ sync: 'error' });
  }
}

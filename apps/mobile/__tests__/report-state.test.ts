import { DatabaseSync } from 'node:sqlite';
import type { Session } from '@supabase/supabase-js';
import type { ContentReport } from '@harmonia/content';
import { createReportRepository, initializeReportDatabase } from '@/storage/report-repository';
import type { LessonDatabase } from '@/storage/lesson-repository';
import { useAuthState } from '@/auth';
import { useDeviceState } from '@/state/device';
import type * as ReportModule from '@/state/reports';
const reports = jest.requireActual<typeof ReportModule>('@/state/reports');
let mockRepository: ReturnType<typeof createReportRepository>;
const mockInvoke = jest.fn<
  Promise<{ data: unknown; error: Error | null }>,
  [
    string,
    { body: { reports: ContentReport[] }; headers: { Authorization: string }; timeout: number },
  ]
>();
jest.mock('@/storage/reports', () => ({
  getReportRepository: () => Promise.resolve(mockRepository),
}));
jest.mock('@/auth', () => ({
  ...jest.requireActual<object>('@/auth'),
  getAuthClient: () => ({ functions: { invoke: mockInvoke } }),
}));
let db: DatabaseSync;
function login(id: string | null) {
  useAuthState.setState({
    ready: true,
    session: id ? ({ user: { id }, access_token: id } as Session) : null,
  });
}
function report(id = '00000000-0000-4000-8000-000000000001'): ContentReport {
  return {
    id,
    createdAt: 1000,
    locale: 'de',
    category: 'notation',
    message: 'Beispiel',
    source: { kind: 'practice', set: 'mini', seed: 1, index: 0, contentVersion: 1 },
    answer: null,
    hintLevel: 0,
    checked: false,
  };
}
beforeEach(async () => {
  db = new DatabaseSync(':memory:');
  const adapter: LessonDatabase = {
    execAsync: (sql) => {
      db.exec(sql);
      return Promise.resolve();
    },
    runAsync: (sql, ...params) => Promise.resolve(db.prepare(sql).run(...params)),
    getFirstAsync: <T>(sql: string, ...params: (string | number)[]) =>
      Promise.resolve((db.prepare(sql).get(...params) as T | undefined) ?? null),
  };
  await initializeReportDatabase(adapter);
  mockRepository = createReportRepository(adapter);
  mockInvoke.mockReset().mockImplementation((_name, options) =>
    Promise.resolve({
      error: null,
      data: { accepted: options.body.reports.map((r) => r.id), unavailable: [] },
    }),
  );
  login(null);
  useDeviceState.setState({ storage: 'saved' });
  await reports.initializeReports();
});
afterEach(async () => {
  await reports.syncReports();
  db.close();
});
it('sendet Gastmeldungen erst nach Anmeldung und nur in das erste Konto', async () => {
  const one = report();
  await reports.saveReport(one, 'guest');
  await reports.syncReports();
  expect(mockInvoke).not.toHaveBeenCalled();
  login('a');
  await reports.initializeReports();
  await reports.syncReports();
  expect(mockInvoke).toHaveBeenCalledWith(
    'content-reports',
    expect.objectContaining({ headers: { Authorization: 'Bearer a' } }),
  );
  expect((await mockRepository.list('a'))[0]?.status).toBe('sent');
  login('b');
  await reports.initializeReports();
  await reports.syncReports();
  expect(reports.useReports.getState().rows).toEqual([]);
  expect(await mockRepository.list('guest')).toEqual([]);
});
it('bewahrt Netzfehler, weist fremde ACKs zurück und versucht dieselbe ID erneut', async () => {
  await reports.saveReport(report(), 'guest');
  login('a');
  mockInvoke.mockResolvedValue({ error: new Error('offline'), data: null });
  await reports.initializeReports();
  await reports.syncReports();
  expect(reports.useReports.getState().sync).toBe('error');
  expect((await mockRepository.list('a'))[0]?.status).toBe('pending');
  mockInvoke.mockResolvedValue({ error: null, data: { accepted: [], unavailable: [] } });
  await reports.syncReports();
  expect(reports.useReports.getState().sync).toBe('error');
  mockInvoke.mockImplementation((_name, options) =>
    Promise.resolve({
      error: null,
      data: { accepted: options.body.reports.map((r) => r.id), unavailable: [] },
    }),
  );
  await reports.retryReports();
  await reports.syncReports();
  expect(reports.useReports.getState().rows[0]?.status).toBe('sent');
});
it('bewahrt nicht verfügbare Quellen, während andere Meldungen gesendet werden', async () => {
  const one = report(),
    two = report('00000000-0000-4000-8000-000000000002');
  await reports.saveReport(one, 'guest');
  await reports.saveReport(two, 'guest');
  login('a');
  mockInvoke.mockResolvedValue({
    error: null,
    data: { accepted: [two.id], unavailable: [one.id] },
  });
  await reports.initializeReports();
  await reports.syncReports();
  expect(reports.useReports.getState().rows.map((r) => r.status)).toEqual(['unavailable', 'sent']);
});
it('ordnet eine verspätete Bestätigung weiterhin dem ursprünglichen Konto zu', async () => {
  await reports.saveReport(report(), 'guest');
  login('a');
  let release: (value: { error: null; data: unknown }) => void = () => {
    throw new Error('Kein Aufruf');
  };
  const entered = new Promise<void>((resolve) => {
    mockInvoke.mockImplementation(() => {
      resolve();
      return new Promise((done) => {
        release = done;
      });
    });
  });
  await reports.initializeReports();
  await entered;
  login('b');
  await reports.initializeReports();
  release({ error: null, data: { accepted: [report().id], unavailable: [] } });
  await reports.syncReports();
  expect(reports.useReports.getState().scope).toBe('b');
  expect(reports.useReports.getState().rows).toEqual([]);
  expect((await mockRepository.list('a'))[0]?.status).toBe('sent');
  await expect(reports.saveReport(report(), 'a')).rejects.toThrow();
});
it('sendet vorübergehende Sitzungen nicht und macht den Speicherzustand sichtbar', async () => {
  useDeviceState.setState({ storage: 'memory' });
  await reports.initializeReports();
  await reports.saveReport(report(), 'guest');
  login('a');
  await reports.initializeReports();
  await reports.syncReports();
  expect(mockInvoke).not.toHaveBeenCalled();
  expect(reports.useReports.getState().memory).toBe(true);
  expect(reports.useReports.getState().rows.length).toBe(1);
});

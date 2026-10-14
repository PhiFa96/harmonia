import { exportLocalData } from '@/privacy/export-local';
import { useDeviceState } from '@/state/device';
import { useLearningState } from '@/state/learning';
import { useMotivation } from '@/state/motivation';
import { useReports } from '@/state/reports';
import { getLearningRepository } from '@/storage/learning';
jest.mock('@/storage/learning', () => ({
  getLearningRepository: jest.fn(() =>
    Promise.reject(new Error('SQLite deliberately unavailable')),
  ),
}));
it('exports temporary guest data without opening SQLite and excludes another account', async () => {
  useDeviceState.setState({ storage: 'memory' });
  useLearningState.setState({ scope: 'guest', rows: [], drafts: {} });
  useMotivation.setState({ scope: 'other-account' });
  useReports.setState({ scope: 'other-account', draft: null });
  const data = await exportLocalData('guest');
  expect(data.learning).toEqual([]);
  expect(data.motivation).toBeNull();
  expect(data.reports).toEqual([]);
  expect(getLearningRepository).not.toHaveBeenCalled();
});

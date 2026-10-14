import { act, render } from '@testing-library/react-native';
import { AccessLifecycle } from '@/components/access-lifecycle';
import { useDeviceState } from '@/state/device';
const mockInitialize = jest.fn();
jest.mock('@/access/state', () => ({
  initializeAccess: () => {
    mockInitialize();
  },
  refreshAccess: () => Promise.resolve(),
}));
it('waits for device storage and restarts for an explicit temporary session', async () => {
  useDeviceState.setState({ phase: 'loading', storage: 'saved' });
  const app = render(<AccessLifecycle />);
  expect(mockInitialize).not.toHaveBeenCalled();
  await act(async () => {
    useDeviceState.setState({ phase: 'ready' });
    await Promise.resolve();
  });
  expect(mockInitialize).toHaveBeenCalledTimes(1);
  await act(async () => {
    useDeviceState.setState({ storage: 'memory' });
    await Promise.resolve();
  });
  expect(mockInitialize).toHaveBeenCalledTimes(2);
  app.unmount();
});

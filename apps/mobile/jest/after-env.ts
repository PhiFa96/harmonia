import type { useDeviceState as DeviceStateHook } from '../src/state/device.ts';
import type { completedDeviceFixture as Fixture } from './device-fixture.ts';
beforeEach(() => {
  const { useDeviceState } = jest.requireActual<{ useDeviceState: typeof DeviceStateHook }>(
    '@/state/device',
  );
  const { completedDeviceFixture } = jest.requireActual<{ completedDeviceFixture: typeof Fixture }>(
    './device-fixture',
  );
  useDeviceState.setState({
    phase: 'ready',
    completed: true,
    data: completedDeviceFixture(),
    storage: 'saved',
    completing: false,
  });
});

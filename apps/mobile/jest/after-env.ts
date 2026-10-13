import type { useDeviceState as DeviceStateHook } from '../src/state/device.ts';
import type { completedDeviceFixture as Fixture } from './device-fixture.ts';
import type { usePlacementState as PlacementStateHook } from '../src/state/placement.ts';
import { catalogue } from '@harmonia/content/authoring';
import { learningPath } from '@harmonia/content';
import type { useLearningState as LearningStateHook } from '../src/state/learning.ts';
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
  const { usePlacementState } = jest.requireActual<{
    usePlacementState: typeof PlacementStateHook;
  }>('@/state/placement');
  usePlacementState.setState({
    phase: 'ready',
    data: { schemaVersion: 1, active: null, last: null },
    storage: 'saved',
  });
  const { useLearningState } = jest.requireActual<{ useLearningState: typeof LearningStateHook }>(
    '@/state/learning',
  );
  useLearningState.setState({
    phase: 'ready',
    scope: 'guest',
    memory: false,
    sync: 'guest',
    rows: [],
    drafts: {},
    outdated: 0,
    areaId: null,
    level: null,
    expanded: catalogue.units.map((u) => u.id),
    path: learningPath(
      catalogue,
      catalogue.lessons.map((l) => ({
        lessonId: l.id,
        contentVersion: l.contentVersion,
        passed: true,
        eligibleCorrect: 10,
        total: 10,
      })),
    ),
  });
});

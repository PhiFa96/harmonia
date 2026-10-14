import type { useMotivation as MotivationHook } from '../src/state/motivation.ts';
import { DEFAULT_REWARD_RULE } from '@harmonia/content';
import type { useReports as ReportsHook } from '../src/state/reports.ts';
import type { useDeviceState as DeviceStateHook } from '../src/state/device.ts';
import type { completedDeviceFixture as Fixture } from './device-fixture.ts';
import type { usePlacementState as PlacementStateHook } from '../src/state/placement.ts';
import { catalogue } from '@harmonia/content/authoring';
import { learningPath } from '@harmonia/content';
import type { useLearningState as LearningStateHook } from '../src/state/learning.ts';
beforeEach(() => {
  const { useMotivation } = jest.requireActual<{ useMotivation: typeof MotivationHook }>(
    '@/state/motivation',
  );
  useMotivation.setState({
    phase: 'ready',
    scope: 'guest',
    memory: false,
    sync: 'idle',
    device: {
      id: '00000000-0000-4000-8000-000000000001',
      key: '00000000-0000-4000-8000-000000000002',
      revision: 1,
    },
    permission: 'unknown',
    pushToken: null,
    retirePending: false,
    notificationError: false,
    writeError: false,
    data: {
      preferences: {
        dailyGoal: 20,
        reminderConsent: false,
        reminderTime: '18:00',
        locale: 'de',
        timeZone: 'UTC',
      },
      dirty: true,
      practicedAt: 0,
      rules: [DEFAULT_REWARD_RULE],
      purchases: [],
      server: null,
      serverEvidenceKey: null,
      preferencesEstablished: false,
    },
  });

  const { useReports } = jest.requireActual<{ useReports: typeof ReportsHook }>('@/state/reports');
  useReports.setState({
    phase: 'ready',
    scope: 'guest',
    rows: [],
    memory: false,
    sync: 'idle',
    draft: null,
  });
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

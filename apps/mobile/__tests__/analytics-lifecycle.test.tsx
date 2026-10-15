import { act, render } from '@testing-library/react-native';
import { AnalyticsLifecycle } from '@/components/analytics-lifecycle';
import { useDeviceState } from '@/state/device';
import { trackAnalytics } from '@/analytics/track';
jest.mock('@/analytics/track', () => ({ trackAnalytics: jest.fn() }));
it('never infers a new onboarding completion from restored device state', () => {
  useDeviceState.setState({ phase: 'loading', completed: false });
  render(<AnalyticsLifecycle />);
  act(() => {
    useDeviceState.setState({ phase: 'ready', completed: true });
  });
  expect(trackAnalytics).not.toHaveBeenCalledWith(
    expect.objectContaining({ name: 'onboarding_completed' }),
  );
});

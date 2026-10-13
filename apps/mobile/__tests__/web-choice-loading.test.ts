import { renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import type { View } from 'react-native';
import { useWebChoiceInput } from '@/components/use-web-choice-input';
it('bindet die Web-Tastatur erst nach dem Laden an eine vorhandene Auswahl und löst sie beim Sperren', () => {
  const original = Platform.OS;
  Platform.OS = 'web';
  try {
    const addEventListener = jest.fn(),
      removeEventListener = jest.fn();
    const group: { current: View | null } = { current: null };
    const { rerender, unmount } = renderHook(
      ({ enabled }: { enabled: boolean }) => {
        useWebChoiceInput(group, { enabled, choices: ['all', 'area.notation'], select: jest.fn() });
      },
      { initialProps: { enabled: false } },
    );
    group.current = { addEventListener, removeEventListener } as unknown as View;
    expect(addEventListener).not.toHaveBeenCalled();
    rerender({ enabled: true });
    expect(addEventListener).toHaveBeenCalledTimes(1);
    rerender({ enabled: false });
    expect(removeEventListener).toHaveBeenCalledTimes(1);
    unmount();
  } finally {
    Platform.OS = original;
  }
});

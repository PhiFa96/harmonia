import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { View } from 'react-native';
import { Platform } from 'react-native';

/** RN Web aktiviert role=radio nicht mit Leertaste. Eine fokussierte Gruppe folgt daher der Radio-Bedienung. */
export function useWebChoiceInput(
  group: RefObject<View | null>,
  options: {
    readonly choices: readonly string[];
    readonly enabled: boolean;
    readonly select: (value: string) => void;
  },
) {
  const current = useRef(options);
  current.current = options;
  useEffect(() => {
    if (Platform.OS !== 'web' || !options.enabled) return;
    const element = group.current as unknown as HTMLElement | null;
    if (!element) return;
    const keydown = (event: KeyboardEvent) => {
      if (!current.current.enabled || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = (event.target as HTMLElement).closest<HTMLElement>('[role="radio"]');
      if (!target || !element.contains(target)) return;
      const radios = Array.from(element.querySelectorAll<HTMLElement>('[role="radio"]'));
      const index = radios.indexOf(target);
      let next = index;
      switch (event.key) {
        case ' ':
        case 'Enter':
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          next = (index + 1) % radios.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          next = (index + radios.length - 1) % radios.length;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = radios.length - 1;
          break;
        default:
          return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (event.repeat && (event.key === ' ' || event.key === 'Enter')) return;
      const value = current.current.choices[next];
      if (value !== undefined) {
        current.current.select(value);
        radios[next]?.focus({ preventScroll: true });
      }
    };
    // Vor PressResponder abfangen, damit Enter nicht zusätzlich dessen onPress auslöst.
    element.addEventListener('keydown', keydown, true);
    return () => {
      element.removeEventListener('keydown', keydown, true);
    };
  }, [group, options.enabled]);
}

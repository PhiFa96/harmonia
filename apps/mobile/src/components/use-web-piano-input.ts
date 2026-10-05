// DOM-Pointer und physische Tastatur nur innerhalb der fokussierten Klaviatur.
import type { KeyboardLayout } from '@harmonia/notation';
import { KEYBOARD_SHORTCUTS, keyboardHit } from '@harmonia/notation';
import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { View } from 'react-native';
import { Platform } from 'react-native';

interface WebPianoInput {
  readonly changeSource: (id: string, midi: number | undefined) => void;
  readonly stop: () => void;
  readonly enabled: boolean;
  readonly scrollMode: boolean;
  readonly layout: KeyboardLayout;
}
export function useWebPianoInput(canvas: RefObject<View | null>, state: WebPianoInput) {
  const input = useRef(state);
  input.current = state;
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const element = canvas.current as unknown as HTMLElement;
    const hit = (event: PointerEvent): number | undefined => {
      const rect = element.getBoundingClientRect();
      return keyboardHit(input.current.layout, event.clientX - rect.left, event.clientY - rect.top)
        ?.midi;
    };
    const down = (event: PointerEvent) => {
      if (input.current.scrollMode || !input.current.enabled || event.button !== 0) return;
      event.preventDefault();
      element.focus({ preventScroll: true });
      element.setPointerCapture(event.pointerId);
      input.current.changeSource(`pointer:${String(event.pointerId)}`, hit(event));
    };
    const move = (event: PointerEvent) => {
      if (element.hasPointerCapture(event.pointerId)) {
        input.current.changeSource(`pointer:${String(event.pointerId)}`, hit(event));
      }
    };
    const up = (event: PointerEvent) => {
      input.current.changeSource(`pointer:${String(event.pointerId)}`, undefined);
      if (element.hasPointerCapture(event.pointerId))
        element.releasePointerCapture(event.pointerId);
    };
    const keydown = (event: KeyboardEvent) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        !input.current.enabled ||
        input.current.scrollMode
      )
        return;
      const target = event.target as HTMLElement;
      const focused = target.closest('[data-testid^="piano-key-"]');
      const number =
        event.code === 'Space' || event.code === 'Enter'
          ? Number(focused?.getAttribute('data-testid')?.replace('piano-key-', '') ?? NaN)
          : KEYBOARD_SHORTCUTS[event.code];
      if (number === undefined || !input.current.layout.keys.some((key) => key.midi === number))
        return;
      event.preventDefault();
      if (!event.repeat) input.current.changeSource(`key:${event.code}`, number);
    };
    const keyup = (event: KeyboardEvent) => {
      input.current.changeSource(`key:${event.code}`, undefined);
    };
    const click = (event: MouseEvent) => {
      // Pointer spielen beim Berühren; der nachfolgende Klick darf nicht nochmals anschlagen.
      // Screenreader-Klicks (detail = 0) bleiben als kurze Einzelanschläge erreichbar.
      if (event.detail > 0) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const focusout = (event: FocusEvent) => {
      if (!(event.relatedTarget instanceof Node) || !element.contains(event.relatedTarget))
        input.current.stop();
    };
    const blur = () => {
      input.current.stop();
    };
    const visibility = () => {
      if (document.hidden) input.current.stop();
    };
    element.addEventListener('pointerdown', down);
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', up);
    element.addEventListener('pointercancel', up);
    element.addEventListener('lostpointercapture', up);
    element.addEventListener('keydown', keydown);
    element.addEventListener('keyup', keyup);
    element.addEventListener('click', click, true);
    element.addEventListener('focusout', focusout);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      element.removeEventListener('pointerdown', down);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', up);
      element.removeEventListener('pointercancel', up);
      element.removeEventListener('lostpointercapture', up);
      element.removeEventListener('keydown', keydown);
      element.removeEventListener('keyup', keyup);
      element.removeEventListener('click', click, true);
      element.removeEventListener('focusout', focusout);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
}

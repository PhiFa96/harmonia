// Schalter: Rolle „switch“, Knopf gleitet federnd (reduziert: sofort), leichte Haptik.

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { RADIUS, TOUCH } from '../tokens.ts';
import { useHaptics } from './haptics.ts';
import { moveTo } from './motion.ts';
import { useUiTheme } from './theme.tsx';

const TRACK = { width: 52, height: 32, inset: 3 } as const;
const KNOB = TRACK.height - 2 * TRACK.inset;
const TRAVEL = TRACK.width - KNOB - 2 * TRACK.inset;

/** Nur die Darstellung (z. B. in einer Listenzeile, die selbst der Schalter ist). */
export function SwitchTrack({ value }: { readonly value: boolean }) {
  const { colors, reduceMotion } = useUiTheme();
  const on = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    on.value = moveTo(value ? 1 : 0, 'gentle', reduceMotion);
  }, [value, reduceMotion, on]);
  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.value, [0, 1], [colors.borderStrong, colors.primary]),
  }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: on.value * TRAVEL }] }));
  return (
    <Animated.View style={[styles.track, track]} aria-hidden>
      <Animated.View style={[styles.knob, knob]} />
    </Animated.View>
  );
}

export interface ToggleProps {
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
  /** Beschriftung für den Screenreader */
  readonly label: string;
  readonly disabled?: boolean;
}

interface ToggleWebEvent {
  readonly key: string;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly repeat: boolean;
  preventDefault(): void;
  stopPropagation(): void;
}
interface ToggleWebControl {
  addEventListener(
    type: 'keydown',
    listener: (event: ToggleWebEvent) => void,
    capture: boolean,
  ): void;
  removeEventListener(
    type: 'keydown',
    listener: (event: ToggleWebEvent) => void,
    capture: boolean,
  ): void;
}

export function useWebSwitchInput(
  control: RefObject<View | null>,
  options: { readonly enabled: boolean; readonly activate: () => void },
) {
  const current = useRef(options);
  current.current = options;
  useEffect(() => {
    if (Platform.OS !== 'web' || !options.enabled) return;
    const element = control.current as unknown as ToggleWebControl;
    const keydown = (event: ToggleWebEvent) => {
      if (
        !current.current.enabled ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        ![' ', 'Enter'].includes(event.key)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      if (event.repeat) return;
      current.current.activate();
    };
    element.addEventListener('keydown', keydown, true);
    return () => {
      element.removeEventListener('keydown', keydown, true);
    };
  }, [control, options.enabled]);
}

export function Toggle({ value, onValueChange, label, disabled = false }: ToggleProps) {
  const haptics = useHaptics();
  const control = useRef<View>(null);
  useWebSwitchInput(control, {
    enabled: !disabled,
    activate: () => {
      haptics.tap();
      onValueChange(!value);
    },
  });
  const slop = (TOUCH.min - TRACK.height) / 2;
  return (
    <Pressable
      ref={control}
      role="switch"
      aria-label={label}
      aria-checked={value}
      aria-disabled={disabled}
      disabled={disabled}
      hitSlop={{ top: slop, bottom: slop, left: slop, right: slop }}
      onPress={() => {
        haptics.tap();
        onValueChange(!value);
      }}
    >
      <View style={disabled ? styles.disabled : null}>
        <SwitchTrack value={value} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK.width,
    height: TRACK.height,
    borderRadius: RADIUS.full,
    padding: TRACK.inset,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: RADIUS.full,
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)',
  },
  disabled: { opacity: 0.5 },
});

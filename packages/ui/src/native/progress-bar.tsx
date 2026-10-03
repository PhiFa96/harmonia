// Fortschrittsbalken: wächst mit leichtem Überschwingen (reduziert: springt auf den neuen Wert).

import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { RADIUS } from '../tokens.ts';
import { moveTo } from './motion.ts';
import { useUiTheme } from './theme.tsx';

export interface ProgressBarProps {
  /** 0 bis 1 */
  readonly value: number;
  /** Beschriftung für den Screenreader, z. B. „Fortschritt der Lektion“ */
  readonly label: string;
  /** Wert als Text, z. B. „6 von 10“ */
  readonly valueText?: string;
  /** Standard: primary */
  readonly tone?: 'primary' | 'accent' | 'success';
  readonly style?: StyleProp<ViewStyle>;
}

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

export function ProgressBar({
  value,
  label,
  valueText,
  tone = 'primary',
  style,
}: ProgressBarProps) {
  const { colors, reduceMotion } = useUiTheme();
  const target = clamp(value);
  const progress = useSharedValue(target);
  useEffect(() => {
    progress.value = moveTo(target, 'bouncy', reduceMotion);
  }, [target, reduceMotion, progress]);
  const fill = useAnimatedStyle(() => ({
    width: `${String(Math.min(1, Math.max(0, progress.value)) * 100)}%` as `${number}%`,
  }));
  return (
    <View
      accessible
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(target * 100)}
      {...(valueText === undefined ? {} : { 'aria-valuetext': valueText })}
      style={[styles.track, { backgroundColor: colors.sunken }, style]}
    >
      <Animated.View style={[styles.fill, { backgroundColor: colors[tone] }, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 12, borderRadius: RADIUS.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: RADIUS.full },
});

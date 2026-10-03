// Knopf: fünf Varianten, zwei Größen. Antippen federt auf 96 % (reduziert: kurz abdunkeln) mit leichter Haptik.

import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import type { ColorTokens } from '../tokens.ts';
import { ELEVATION, FONT_FAMILIES, MOTION, RADIUS, SPACE, TOUCH } from '../tokens.ts';
import { useHaptics } from './haptics.ts';
import type { IconName } from './icons.tsx';
import { Icon } from './icons.tsx';
import { fadeTo, moveTo } from './motion.ts';
import { useUiTheme } from './theme.tsx';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';

export interface ButtonProps {
  readonly label: string;
  readonly onPress?: () => void;
  /** Standard: primary */
  readonly variant?: ButtonVariant;
  /** large: 56 pt (Hauptaktion), medium: 48 pt. Standard: large */
  readonly size?: 'large' | 'medium';
  readonly disabled?: boolean;
  /** Symbol vor der Beschriftung */
  readonly icon?: IconName;
  readonly accessibilityHint?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

interface Look {
  readonly background: string;
  readonly foreground: string;
  readonly border: string | undefined;
}

function look(variant: ButtonVariant, c: ColorTokens, disabled: boolean): Look {
  if (disabled) {
    return { background: c.sunken, foreground: c.textMuted, border: undefined };
  }
  switch (variant) {
    case 'primary':
      return { background: c.primary, foreground: c.onPrimary, border: undefined };
    case 'secondary':
      return { background: c.surface, foreground: c.primaryText, border: c.border };
    case 'ghost':
      return { background: 'transparent', foreground: c.primaryText, border: undefined };
    case 'success':
      return { background: c.success, foreground: c.onSuccess, border: undefined };
    case 'danger':
      return { background: c.danger, foreground: c.onDanger, border: undefined };
  }
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  icon,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const theme = useUiTheme();
  const haptics = useHaptics();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const { background, foreground, border } = look(variant, theme.colors, disabled);
  const shadow = variant === 'primary' && !disabled ? ELEVATION[theme.scheme].button : undefined;

  const pressIn = () => {
    haptics.tap();
    if (theme.reduceMotion) {
      opacity.value = fadeTo(0.8, true);
    } else {
      scale.value = moveTo(MOTION.pressScale, 'firm', false);
    }
  };
  const pressOut = () => {
    scale.value = moveTo(1, 'firm', theme.reduceMotion);
    opacity.value = fadeTo(1, true);
  };

  return (
    <AnimatedPressable
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      {...(accessibilityHint === undefined ? {} : { accessibilityHint })}
      {...(testID === undefined ? {} : { testID })}
      disabled={disabled}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={[
        styles.base,
        { minHeight: size === 'large' ? TOUCH.buttonLarge : TOUCH.buttonMedium },
        { backgroundColor: background },
        border ? { borderWidth: 2, borderColor: border } : null,
        shadow ? { boxShadow: shadow } : null,
        animated,
        style,
      ]}
    >
      {icon ? <Icon name={icon} color={foreground} size={22} /> : null}
      <Text style={[styles.label, { color: foreground }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.s,
    paddingHorizontal: SPACE.xl,
    paddingVertical: SPACE.s,
    borderRadius: RADIUS.control,
  },
  label: { fontFamily: FONT_FAMILIES.bold, fontSize: 17, lineHeight: 22, textAlign: 'center' },
});

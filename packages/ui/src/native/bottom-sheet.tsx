// Blatt von unten über einer Abdunkelung. Gleitet federnd herein und hinaus (reduziert: Überblenden).
// Schließen über den Knopf, Tippen auf die Abdunkelung oder die Zurück-Taste (Android).

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DURATION, LAYOUT, RADIUS, SPACE, SPRING, TOUCH } from '../tokens.ts';
import { Icon } from './icons.tsx';
import { AppText } from './text.tsx';
import { useUiTheme } from './theme.tsx';

export interface BottomSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly title: string;
  /** Beschriftung des Schließen-Knopfs (übersetzt) */
  readonly closeLabel: string;
  readonly children: ReactNode;
}

export function BottomSheet({ visible, onClose, title, closeLabel, children }: BottomSheetProps) {
  const { colors, scrim, reduceMotion } = useUiTheme();
  const insets = useSafeAreaInsets();
  // Das Modal bleibt nach dem Schließen kurz stehen, damit das Blatt hinausgleiten kann
  const [mounted, setMounted] = useState(visible);
  useEffect(() => {
    if (visible) {
      setMounted(true);
      return undefined;
    }
    const timer = setTimeout(
      () => {
        setMounted(false);
      },
      reduceMotion ? DURATION.reduced : DURATION.fade,
    );
    return () => {
      clearTimeout(timer);
    };
  }, [visible, reduceMotion]);

  const fade = reduceMotion ? DURATION.reduced : DURATION.fade;
  const sheetIn = reduceMotion
    ? FadeIn.duration(DURATION.reduced).reduceMotion(ReduceMotion.Never)
    : SlideInDown.springify().damping(SPRING.gentle.damping).stiffness(SPRING.gentle.stiffness);
  const sheetOut = reduceMotion
    ? FadeOut.duration(DURATION.reduced).reduceMotion(ReduceMotion.Never)
    : SlideOutDown.duration(DURATION.fade);

  return (
    <Modal
      transparent
      visible={mounted}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.fill}>
        {visible ? (
          <Animated.View
            entering={FadeIn.duration(fade).reduceMotion(ReduceMotion.Never)}
            exiting={FadeOut.duration(fade).reduceMotion(ReduceMotion.Never)}
            style={[StyleSheet.absoluteFill, { backgroundColor: scrim }]}
          >
            {/* Nur für Finger und Maus; Screenreader schließen über den Knopf */}
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} aria-hidden />
          </Animated.View>
        ) : null}
        {visible ? (
          <Animated.View
            entering={sheetIn}
            exiting={sheetOut}
            aria-modal
            accessibilityViewIsModal
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, SPACE.l) + SPACE.s,
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.header}>
              <AppText variant="title2" style={styles.title}>
                {title}
              </AppText>
              <Pressable
                role="button"
                aria-label={closeLabel}
                onPress={onClose}
                style={styles.close}
              >
                <Icon name="close" color={colors.textMuted} />
              </Pressable>
            </View>
            {children}
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth + 2 * LAYOUT.screenPadding,
    maxHeight: '90%',
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: SPACE.s,
    gap: SPACE.m,
  },
  handle: { alignSelf: 'center', width: 36, height: 5, borderRadius: RADIUS.full },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s },
  title: { flex: 1 },
  close: {
    width: TOUCH.min,
    height: TOUCH.min,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -SPACE.m,
  },
});

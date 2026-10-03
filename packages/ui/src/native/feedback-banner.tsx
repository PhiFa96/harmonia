// Rückmeldung nach dem Prüfen: Leiste von unten in Richtig- bzw. Falsch-Farbe mit Symbol, Überschrift und
// Begründung. Gleitet federnd herein, das Symbol springt auf (reduziert: Überblenden). Meldet sich beim
// Screenreader (Live-Region; iOS per Ansage) und gibt Haptik (Erfolg bzw. Warnung).

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion, SlideInDown, ZoomIn } from 'react-native-reanimated';

import { DURATION, RADIUS, SPACE, SPRING, TOUCH } from '../tokens.ts';
import { useHaptics } from './haptics.ts';
import { Icon } from './icons.tsx';
import { AppText } from './text.tsx';
import { useUiTheme } from './theme.tsx';

export type FeedbackKind = 'correct' | 'wrong';

export interface FeedbackBannerProps {
  readonly kind: FeedbackKind;
  readonly title: string;
  /** Ein Satz mit Begründung */
  readonly message: string;
  /** Noch einmal anhören (Symbolknopf); braucht replayLabel */
  readonly onReplay?: () => void;
  readonly replayLabel?: string;
  /** Aktionen, z. B. „Weiter“ */
  readonly children?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}

export function FeedbackBanner({
  kind,
  title,
  message,
  onReplay,
  replayLabel,
  children,
  style,
}: FeedbackBannerProps) {
  const { colors, reduceMotion } = useUiTheme();
  const haptics = useHaptics();
  const correct = kind === 'correct';
  const tone = correct
    ? { background: colors.successSoft, color: colors.success, on: colors.onSuccess }
    : { background: colors.dangerSoft, color: colors.danger, on: colors.onDanger };

  useEffect(() => {
    if (correct) {
      haptics.success();
    } else {
      haptics.warning();
    }
    // iOS kennt keine Live-Regionen; dort wird die Rückmeldung angesagt
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(`${title}. ${message}`);
    }
  }, [correct, title, message, haptics]);

  const entering = reduceMotion
    ? FadeIn.duration(DURATION.reduced).reduceMotion(ReduceMotion.Never)
    : SlideInDown.springify().damping(SPRING.bouncy.damping).stiffness(SPRING.bouncy.stiffness);
  const badgeEntering = reduceMotion
    ? undefined
    : ZoomIn.delay(DURATION.tap)
        .springify()
        .damping(SPRING.bouncy.damping)
        .stiffness(SPRING.bouncy.stiffness);

  return (
    <Animated.View
      entering={entering}
      aria-live="polite"
      style={[styles.banner, { backgroundColor: tone.background }, style]}
    >
      <View style={styles.row}>
        <Animated.View
          {...(badgeEntering ? { entering: badgeEntering } : {})}
          style={[styles.badge, { backgroundColor: tone.color }]}
        >
          <Icon name={correct ? 'check' : 'close'} color={tone.on} size={24} strokeWidth={3} />
        </Animated.View>
        <View style={styles.texts}>
          <AppText variant="title2" style={{ color: tone.color }}>
            {title}
          </AppText>
          <AppText>{message}</AppText>
        </View>
        {onReplay && replayLabel ? (
          <Pressable
            role="button"
            aria-label={replayLabel}
            onPress={onReplay}
            style={styles.replay}
          >
            <Icon name="speaker" color={tone.color} />
          </Pressable>
        ) : null}
      </View>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    paddingHorizontal: SPACE.l + SPACE.xs,
    paddingTop: SPACE.l + SPACE.xs,
    paddingBottom: SPACE.xl,
    gap: SPACE.l,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.m + 2 },
  badge: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: SPACE.xs },
  replay: {
    width: TOUCH.min,
    height: TOUCH.min,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -SPACE.xs,
  },
  actions: { flexDirection: 'row', gap: SPACE.m - 2 },
});

import { rhythmBeatCount } from '@harmonia/exercises';
import type { RhythmItem } from '@harmonia/exercises';
import { RADIUS, SPACE, TOUCH } from '@harmonia/ui';
import { AppText, useUiTheme } from '@harmonia/ui/native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/** Gleichmäßige Zählpositionen; statisch, damit kein UI-Timer als Audio-Uhr erscheint. */
export function PulseExample({ item }: { readonly item: RhythmItem }) {
  const { t } = useTranslation(),
    { colors } = useUiTheme(),
    count = rhythmBeatCount(item);
  return (
    <View style={styles.container}>
      <View
        accessible
        role="img"
        aria-label={t('exercise.pulseDescription', { count, bpm: item.bpm })}
        testID="pulse-example"
      >
        <View aria-hidden importantForAccessibility="no-hide-descendants" style={styles.row}>
          {Array.from({ length: count }, (_, index) => (
            <View
              key={index}
              style={[
                styles.beat,
                {
                  backgroundColor: index === 0 ? colors.primarySoft : colors.surface,
                  borderColor: index === 0 ? colors.primary : colors.border,
                  borderWidth: index === 0 ? 2 : 1,
                },
              ]}
            >
              <AppText variant="title2">{String(index + 1)}</AppText>
            </View>
          ))}
        </View>
      </View>
      <AppText variant="small" tone="muted">
        {t('exercise.pulseGroup', { count, bpm: item.bpm })}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: SPACE.s },
  row: { flexDirection: 'row', gap: SPACE.s, justifyContent: 'center', flexWrap: 'wrap' },
  beat: {
    minWidth: TOUCH.buttonLarge,
    minHeight: TOUCH.buttonLarge,
    borderRadius: RADIUS.card,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACE.s,
  },
});

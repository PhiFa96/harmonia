import { durationSymbolDescription, exerciseDescription } from '@harmonia/exercises';
import type { KnowledgeItem } from '@harmonia/exercises';
import { DurationSymbol } from '@harmonia/notation/native';
import { SPACE, TOUCH } from '@harmonia/ui';
import { AppText, useUiTheme } from '@harmonia/ui/native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useLocale } from '@/i18n';

export function DurationQuestion({ item }: { readonly item: KnowledgeItem }) {
  const { t } = useTranslation(),
    { colors } = useUiTheme(),
    locale = useLocale();
  if (item.presentation === 'symbol' && 'duration' in item.fact) {
    return (
      <View style={styles.symbol} testID="duration-symbol">
        <DurationSymbol
          duration={item.fact.duration}
          kind={item.fact.topic === 'rests' ? 'rest' : 'note'}
          color={colors.text}
          label={exerciseDescription(item, locale)}
        />
      </View>
    );
  }
  if (!item.gap) return null;
  return (
    <View style={styles.container} testID="measure-gap">
      <AppText variant="small">{t('exercise.measureGapCapacity')}</AppText>
      <View accessible role="img" aria-label={exerciseDescription(item, locale)}>
        <View aria-hidden importantForAccessibility="no-hide-descendants" style={styles.row}>
          {item.gap.events.map((event, index) => (
            <View key={index} style={styles.symbol}>
              <AppText variant="footnote" tone="muted">
                {String(index + 1)}
              </AppText>
              <DurationSymbol
                {...event}
                color={colors.text}
                label={durationSymbolDescription(event, locale)}
              />
            </View>
          ))}
          <View style={styles.symbol}>
            <AppText variant="footnote" tone="muted">
              {String(item.gap.events.length + 1)}
            </AppText>
            <AppText variant="title1">{'?'}</AppText>
            <AppText variant="footnote">{t('exercise.measureGapSlot')}</AppText>
          </View>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: SPACE.s },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s, alignItems: 'flex-end' },
  symbol: {
    minWidth: TOUCH.buttonLarge,
    minHeight: TOUCH.buttonLarge,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

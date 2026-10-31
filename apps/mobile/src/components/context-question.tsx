import type { ContextItem } from '@harmonia/exercises';
import { contextSourceText, contextNotationDescription } from '@harmonia/exercises';
import { engineLanguage } from '@harmonia/i18n';
import { ScoreView } from '@harmonia/notation/native';
import { SPACE } from '@harmonia/ui';
import { MusicText, useUiTheme } from '@harmonia/ui/native';
import { Platform, ScrollView, View } from 'react-native';
import { useLocale } from '@/i18n';
export function ContextQuestion({ item }: { readonly item: ContextItem }) {
  const locale = useLocale(),
    { colors } = useUiTheme();
  return (
    <View testID="context-question" style={{ gap: SPACE.m }}>
      <MusicText>{contextSourceText(item, locale)}</MusicText>
      {item.source.kind === 'score' ? (
        <ScrollView
          horizontal
          {...(Platform.OS === 'web' ? { tabIndex: 0 } : {})}
          testID="context-score-scroll"
        >
          <View accessible role="img" aria-label={contextNotationDescription(item, locale)}>
            <View aria-hidden importantForAccessibility="no-hide-descendants">
              <ScoreView
                score={item.source.score}
                color={colors.text}
                staffSpace={14}
                describeOptions={engineLanguage(locale)}
                layoutOptions={{ endBarline: 'final' }}
              />
            </View>
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

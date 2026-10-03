// Karte: Fläche mit Radius 20. Hell mit weichem Schatten, dunkel mit feiner Linie statt Schatten.

import type { ViewProps } from 'react-native';
import { View } from 'react-native';

import { RADIUS, SPACE } from '../tokens.ts';
import { useUiTheme } from './theme.tsx';

export interface CardProps extends ViewProps {
  /** Innenabstand. Standard: 16 */
  readonly padding?: number;
}

export function Card({ padding = SPACE.l, style, ...rest }: CardProps) {
  const { colors, cardShadow } = useUiTheme();
  return (
    <View
      {...rest}
      style={[
        { backgroundColor: colors.surface, borderRadius: RADIUS.card, padding },
        cardShadow ? { boxShadow: cardShadow } : { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    />
  );
}

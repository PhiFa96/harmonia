import { useMemo } from 'react';
import type { ColorValue } from 'react-native';
import { View } from 'react-native';
import Svg from 'react-native-svg';
import type { Duration } from '@harmonia/theory';
import { durationSymbolLayout } from '../duration-symbol.ts';
import { svgScene } from '../svg.ts';
import { draw } from './score-view.tsx';

/** Die aufrufende Oberfläche liefert eine passende, übersetzte Beschreibung. */
export function DurationSymbol({
  duration,
  kind,
  color,
  label,
}: {
  readonly duration: Duration;
  readonly kind: 'note' | 'rest';
  readonly color: ColorValue;
  readonly label: string;
}) {
  const scene = useMemo(
    () => svgScene(durationSymbolLayout(duration, kind), { scale: 12 }),
    [duration, kind],
  );
  return (
    <View accessible role="img" aria-label={label}>
      <View aria-hidden importantForAccessibility="no-hide-descendants">
        <Svg
          width={scene.width}
          height={scene.height}
          viewBox={`0 0 ${String(scene.width)} ${String(scene.height)}`}
        >
          {scene.elements.map((element, index) => draw(element, index, color, 'Bravura'))}
        </Svg>
      </View>
    </View>
  );
}

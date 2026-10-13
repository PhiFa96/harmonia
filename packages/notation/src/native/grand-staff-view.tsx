import { useMemo } from 'react';
import { View } from 'react-native';
import type { ColorValue } from 'react-native';
import Svg from 'react-native-svg';
import type { Score } from '../score.ts';
import { layoutGrandStaff } from '../grand-staff.ts';
import { svgScene } from '../svg.ts';
import { draw } from './score-view.tsx';

/** Lesendes Lernbild. Die umgebende App liefert eine lokalisierte Beschreibung ohne Lösungsverrat. */
export function GrandStaffView({
  score,
  staffSpace = 14,
  color = '#000',
}: {
  readonly score: Score;
  readonly staffSpace?: number;
  readonly color?: ColorValue;
}) {
  const scene = useMemo(
    () => svgScene(layoutGrandStaff(score), { scale: staffSpace }),
    [score, staffSpace],
  );
  return (
    <View
      testID="grand-staff-example"
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: scene.width, height: scene.height }}
    >
      <Svg
        width={scene.width}
        height={scene.height}
        viewBox={`0 0 ${String(scene.width)} ${String(scene.height)}`}
      >
        {scene.elements.map((element, index) => draw(element, index, color, 'Bravura'))}
      </Svg>
    </View>
  );
}

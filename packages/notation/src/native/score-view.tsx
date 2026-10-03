// Renderer für iOS, Android und Web (react-native-svg). Zeichnet dieselbe Elementliste wie die SVG-Textausgabe.
// Jede Note bekommt eine unsichtbare Fläche mit ihrem Screenreader-Text; das SVG selbst ist für Screenreader ausgeblendet.

import { useMemo } from 'react';
import type { ColorValue } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Line, Path, Polygon, Text as SvgText } from 'react-native-svg';

import type { DescribeOptions } from '../describe.ts';
import { describeScore } from '../describe.ts';
import type { LayoutOptions } from '../layout.ts';
import { eventBounds, layoutScore } from '../layout.ts';
import type { Score } from '../score.ts';
import type { SvgElement } from '../svg.ts';
import { svgScene } from '../svg.ts';

const PADDING = 1;

export interface ScoreViewProps {
  readonly score: Score;
  /** Pixel pro Notenlinienabstand (Zoom). Standard: 10. */
  readonly staffSpace?: number;
  /** Farbe aller Zeichen, z. B. passend zum Hell- oder Dunkelmodus. Standard: Schwarz. */
  readonly color?: ColorValue;
  /** Schriftfamilie des geladenen Notenfonts. Standard: Bravura. */
  readonly fontFamily?: string;
  readonly layoutOptions?: LayoutOptions;
  /** Sprache der Screenreader-Texte. */
  readonly describeOptions?: DescribeOptions;
}

export function ScoreView({
  score,
  staffSpace = 10,
  color = '#000',
  fontFamily = 'Bravura',
  layoutOptions,
  describeOptions,
}: ScoreViewProps) {
  const layout = useMemo(() => layoutScore(score, layoutOptions), [score, layoutOptions]);
  const scene = useMemo(
    () => svgScene(layout, { scale: staffSpace, padding: PADDING }),
    [layout, staffSpace],
  );
  const regions = useMemo(() => {
    const texts = new Map(
      describeScore(score, describeOptions).map((d) => [
        `${String(d.measure)}:${String(d.event)}`,
        d.text,
      ]),
    );
    return eventBounds(layout).map((b) => ({
      key: `${String(b.measure)}:${String(b.event)}`,
      text: texts.get(`${String(b.measure)}:${String(b.event)}`) ?? '',
      left: (b.x1 + PADDING) * staffSpace,
      width: (b.x2 - b.x1) * staffSpace,
    }));
  }, [score, layout, describeOptions, staffSpace]);

  return (
    <View style={{ width: scene.width, height: scene.height }}>
      <Svg
        width={scene.width}
        height={scene.height}
        viewBox={`0 0 ${String(scene.width)} ${String(scene.height)}`}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {scene.elements.map((element, index) => draw(element, index, color, fontFamily))}
      </Svg>
      {regions.map((region) => (
        <View
          key={region.key}
          accessible
          role="img"
          aria-label={region.text}
          style={[styles.region, { left: region.left, width: region.width }]}
        />
      ))}
    </View>
  );
}

function draw(element: SvgElement, index: number, color: ColorValue, fontFamily: string) {
  switch (element.kind) {
    case 'text':
      return (
        <SvgText
          key={index}
          // x/y sind bei <Text> die SVG-Position. react-native-svg erbt dieselben Namen zusätzlich aus den
          // veralteten Transform-Angaben; daher meldet die Typprüfung fälschlich „veraltet“.
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          x={element.x}
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          y={element.y}
          fontFamily={fontFamily}
          fontSize={element.fontSize}
          fill={color}
        >
          {element.text}
        </SvgText>
      );
    case 'line':
      return (
        <Line
          key={index}
          x1={element.x1}
          y1={element.y1}
          x2={element.x2}
          y2={element.y2}
          stroke={color}
          strokeWidth={element.strokeWidth}
        />
      );
    case 'polygon':
      return <Polygon key={index} points={element.points} fill={color} />;
    case 'path':
      return <Path key={index} d={element.d} fill={color} />;
  }
}

const styles = StyleSheet.create({
  region: { position: 'absolute', top: 0, bottom: 0 },
});

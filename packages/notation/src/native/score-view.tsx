// Renderer für iOS, Android und Web (react-native-svg). Zeichnet dieselbe Elementliste wie die SVG-Textausgabe.
// Jede Note bekommt eine unsichtbare Fläche mit ihrem Screenreader-Text; das SVG selbst ist für Screenreader ausgeblendet.
//
// Eingabe (optional): Antippen bzw. Klicken meldet einen Treffer (Position → Tonhöhe), bearbeitbare Noten
// lassen sich senkrecht ziehen (relativ zum Startpunkt, damit der Finger die Note nicht verdeckt), mit dem
// Screenreader als „anpassbares“ Element und im Web mit den Pfeiltasten höher und tiefer stellen.
// Was daraus wird, entscheidet der Aufrufer.

import { useMemo, useRef } from 'react';
import type { AccessibilityActionEvent, ColorValue, GestureResponderEvent } from 'react-native';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Line, Path, Polygon, Text as SvgText } from 'react-native-svg';

import type { DescribeOptions } from '../describe.ts';
import { describeScore } from '../describe.ts';
import type { Highlight, HighlightKind } from '../highlight.ts';
import { DEFAULT_HIGHLIGHT_COLORS, MARK_BAND, highlightFor } from '../highlight.ts';
import type { StaffHit } from '../input.ts';
import { MAX_STEP, MIN_STEP, hitTest, stepY } from '../input.ts';
import type { EventRef, LayoutOptions } from '../layout.ts';
import { eventBounds, layoutScore } from '../layout.ts';
import type { Score } from '../score.ts';
import type { SvgElement } from '../svg.ts';
import { svgScene } from '../svg.ts';

const PADDING = 1;
/** Ab dieser Bewegung (Pixel) ist es Ziehen statt Tippen. */
const DRAG_THRESHOLD = 6;
/**
 * Fester Ausschnitt bei der Eingabe: vier Hilfslinien über und unter dem System, Platz für Notenköpfe
 * und darüber für die Symbole der Hervorhebung. So springt das Bild nicht, während man eine Note zieht.
 */
export const INPUT_EXTENT = {
  top: stepY(MIN_STEP) - 1 - MARK_BAND,
  bottom: stepY(MAX_STEP) + 1,
} as const;

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

  /** Hervorhebungen; angegeben (auch leer) bleibt Platz für die Symbole über dem System. */
  readonly highlights?: readonly Highlight[];
  readonly highlightColors?: Readonly<Partial<Record<HighlightKind, ColorValue>>>;
  /** Screenreader-Zusatz je Hervorhebung, z. B. „richtig“ (übersetzt vom Aufrufer). */
  readonly highlightLabels?: Readonly<Partial<Record<HighlightKind, string>>>;

  /** Antippen oder Klicken ins System (nicht beim Ziehen). Macht das Notenbild bedienbar. */
  readonly onTap?: (hit: StaffHit) => void;
  /**
   * Noten, die gezogen oder per Screenreader/Tastatur verstellt werden dürfen. Ohne `note`: der erste Ton.
   * Auch Pausen sind möglich (Platz für eine Note): Ziehen greift sie nicht, Verstellen meldet sie an `onAdjustNote`.
   */
  readonly editable?: readonly EventRef[];
  /** Ziehen einer bearbeitbaren Note: Schritte seit Beginn (+ = höher); `done` beim Loslassen. */
  readonly onDragNote?: (ref: EventRef, steps: number, done: boolean) => void;
  /** Screenreader oder Pfeiltasten (Web): Note einen Schritt höher (+1) oder tiefer (−1). */
  readonly onAdjustNote?: (ref: EventRef, steps: 1 | -1) => void;
}

interface Gesture {
  readonly startX: number;
  readonly startY: number;
  readonly startPageY: number;
  readonly drag?: EventRef;
  moved: boolean;
  steps: number;
}

export function ScoreView({
  score,
  staffSpace = 10,
  color = '#000',
  fontFamily = 'Bravura',
  layoutOptions,
  describeOptions,
  highlights,
  highlightColors,
  highlightLabels,
  onTap,
  editable,
  onDragNote,
  onAdjustNote,
}: ScoreViewProps) {
  const interactive = onTap !== undefined || onDragNote !== undefined;
  const layout = useMemo(() => layoutScore(score, layoutOptions), [score, layoutOptions]);
  const scene = useMemo(
    () =>
      svgScene(layout, {
        scale: staffSpace,
        padding: PADDING,
        ...(highlights ? { highlights } : {}),
        ...(interactive ? { extent: INPUT_EXTENT } : {}),
      }),
    [layout, staffSpace, highlights, interactive],
  );
  const regions = useMemo(() => {
    const texts = new Map(
      describeScore(score, describeOptions).map((d) => [
        `${String(d.measure)}:${String(d.event)}`,
        d.text,
      ]),
    );
    return eventBounds(layout).map((b) => {
      const ref = { measure: b.measure, event: b.event };
      const kind = highlights ? highlightFor(highlights, ref) : undefined;
      const status = kind ? highlightLabels?.[kind] : undefined;
      const text = texts.get(`${String(b.measure)}:${String(b.event)}`) ?? '';
      return {
        key: `${String(b.measure)}:${String(b.event)}`,
        text: status ? `${text}, ${status}` : text,
        editable: findEditable(editable, ref),
        left: (b.x1 + PADDING) * staffSpace,
        width: (b.x2 - b.x1) * staffSpace,
      };
    });
  }, [score, layout, describeOptions, staffSpace, highlights, highlightLabels, editable]);

  const colors = { ...DEFAULT_HIGHLIGHT_COLORS, ...highlightColors };
  const gesture = useRef<Gesture | null>(null);

  const hitAt = (px: number, py: number): StaffHit => {
    const point = scene.toLayout(px, py);
    return hitTest(layout, score, point.x, point.y);
  };

  const onGrant = (e: GestureResponderEvent) => {
    const { locationX, locationY, pageY } = e.nativeEvent;
    const hit = hitAt(locationX, locationY);
    const drag = onDragNote ? draggableAt(hit, editable, score) : undefined;
    gesture.current = {
      startX: locationX,
      startY: locationY,
      startPageY: pageY,
      ...(drag ? { drag } : {}),
      moved: false,
      steps: 0,
    };
  };

  const onMove = (e: GestureResponderEvent) => {
    const g = gesture.current;
    if (!g) {
      return;
    }
    const dy = e.nativeEvent.pageY - g.startPageY;
    if (!g.moved && Math.abs(dy) < DRAG_THRESHOLD) {
      return;
    }
    g.moved = true;
    if (g.drag && onDragNote) {
      // Ein Schritt = halber Linienabstand; nach oben ziehen = höher
      const steps = -Math.round(dy / (staffSpace / 2));
      if (steps !== g.steps) {
        g.steps = steps;
        onDragNote(g.drag, steps, false);
      }
    }
  };

  const onRelease = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g) {
      return;
    }
    if (g.drag && g.moved && onDragNote) {
      onDragNote(g.drag, g.steps, true);
    } else if (!g.moved && onTap) {
      onTap(hitAt(g.startX, g.startY));
    }
  };

  const onTerminate = () => {
    const g = gesture.current;
    gesture.current = null;
    // Abgebrochen (z. B. vom System): Ziehen zurücknehmen
    if (g?.drag && g.moved && onDragNote) {
      onDragNote(g.drag, 0, true);
    }
  };

  return (
    <View style={{ width: scene.width, height: scene.height }}>
      <Svg
        width={scene.width}
        height={scene.height}
        viewBox={`0 0 ${String(scene.width)} ${String(scene.height)}`}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {scene.elements.map((element, index) =>
          draw(element, index, element.highlight ? colors[element.highlight] : color, fontFamily),
        )}
      </Svg>
      {regions.map((region) => {
        const adjustable = region.editable && onAdjustNote ? region.editable : undefined;
        return (
          <View
            key={region.key}
            accessible
            {...(adjustable
              ? {
                  accessibilityRole: 'adjustable' as const,
                  accessibilityActions: [{ name: 'increment' }, { name: 'decrement' }],
                  'aria-valuetext': region.text,
                  onAccessibilityAction: (event: AccessibilityActionEvent) => {
                    const name = event.nativeEvent.actionName;
                    if (name === 'increment' || name === 'decrement') {
                      onAdjustNote?.(adjustable, name === 'increment' ? 1 : -1);
                    }
                  },
                  // Web: mit Tab erreichbar, Pfeil hoch/runter wie bei einem Schieberegler (ARIA „slider“)
                  focusable: true,
                  ...webArrowKeys((steps) => {
                    onAdjustNote?.(adjustable, steps);
                  }),
                }
              : { role: 'img' as const })}
            aria-label={region.text}
            style={[styles.region, { left: region.left, width: region.width }]}
          />
        );
      })}
      {interactive ? (
        // Eigene Fläche ohne Kinder über allem: Tipp-Koordinaten beziehen sich immer auf sie.
        <View
          testID="score-input"
          // Leere Fläche nicht wegoptimieren lassen (View Flattening), sonst fehlt das Ziel der Berührung
          collapsable={false}
          style={[StyleSheet.absoluteFill, styles.input]}
          onStartShouldSetResponder={() => true}
          onResponderTerminationRequest={() => gesture.current?.drag === undefined}
          onResponderGrant={onGrant}
          onResponderMove={onMove}
          onResponderRelease={onRelease}
          onResponderTerminate={onTerminate}
        />
      ) : null}
    </View>
  );
}

/**
 * Pfeiltasten im Web. react-native-web reicht `onKeyDown` an das DOM weiter; in den Typen von
 * React Native fehlt die Eigenschaft, deshalb als ungetyptes Objekt. Auf iOS/Android leer.
 */
function webArrowKeys(adjust: (steps: 1 | -1) => void): object {
  if (Platform.OS !== 'web') {
    return {};
  }
  return {
    onKeyDown: (event: { key: string; preventDefault: () => void }) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        // Seite nicht scrollen
        event.preventDefault();
        adjust(event.key === 'ArrowUp' ? 1 : -1);
      }
    },
  };
}

function sameEvent(a: EventRef, b: EventRef): boolean {
  return a.measure === b.measure && a.event === b.event;
}

/** Bearbeitbarer Ton eines Ereignisses (ohne Tonangabe: der erste). */
function findEditable(
  editable: readonly EventRef[] | undefined,
  ref: EventRef,
): EventRef | undefined {
  const found = editable?.find((e) => sameEvent(e, ref));
  return found ? { ...found, note: found.note ?? 0 } : undefined;
}

/**
 * Welche Note ein Druck greift: der getroffene Notenkopf; sonst – fingerfreundlich – der bearbeitbare Ton
 * des getroffenen Ereignisses oder, wenn der Takt genau eine bearbeitbare Note hat, diese (eine gesetzte
 * ganze Note steht am Taktanfang, die Pause davor stand in der Mitte).
 */
function draggableAt(
  hit: StaffHit,
  editable: readonly EventRef[] | undefined,
  score: Score,
): EventRef | undefined {
  const isNote = (ref: EventRef): boolean => {
    const event = score.staves[0]?.measures[ref.measure]?.voices[0]?.events[ref.event];
    return event !== undefined && event.kind !== 'rest';
  };
  const head = hit.head;
  if (head) {
    const match = editable?.find(
      (e) => sameEvent(e, head) && (e.note === undefined || e.note === head.note),
    );
    if (match) {
      return head;
    }
  }
  const inEvent = hit.event ? findEditable(editable, hit.event) : undefined;
  if (inEvent && isNote(inEvent)) {
    return inEvent;
  }
  const inMeasure = (editable ?? []).filter((e) => e.measure === hit.measure && isNote(e));
  const [only] = inMeasure;
  return inMeasure.length === 1 && only ? { ...only, note: only.note ?? 0 } : undefined;
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
          {...(element.lineCap ? { strokeLinecap: element.lineCap } : {})}
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
  input: { cursor: 'pointer' },
});

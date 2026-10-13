// Begrenztes Lernbild: ein natürlicher ganzer Ton, ein Pausentakt, Violin- und Basssystem.
// Allgemeiner mehrstimmiger Notensatz bleibt bei layoutScore gesondert begrenzt.
import { duration, midi } from '@harmonia/theory';
import type { Pitch } from '@harmonia/theory';
import { note, rest, singleStaffScore } from './score.ts';
import type { Score } from './score.ts';
import { stepOf } from './input.ts';
import { glyphMetrics, layoutScore } from './layout.ts';
import type { LayoutItem, ScoreLayout } from './layout.ts';

export function grandStaffExample(pitch: Pitch, clef: 'treble' | 'bass'): Score {
  const score: Score = {
    staves: (['treble', 'bass'] as const).flatMap(
      (staffClef) =>
        singleStaffScore(
          [[staffClef === clef ? note(pitch, duration('whole')) : rest(duration('whole'))]],
          { clef: staffClef },
        ).staves,
    ),
  };
  grandStaffTarget(score);
  return score;
}

export function grandStaffTarget(score: Score): {
  readonly pitch: Pitch;
  readonly clef: 'treble' | 'bass';
} {
  if (score.staves.length !== 2) throw new RangeError('Das Lernbild braucht genau zwei Systeme');
  const targets: { pitch: Pitch; clef: 'treble' | 'bass' }[] = [];
  score.staves.forEach((staff, index) => {
    const clef = index === 0 ? 'treble' : 'bass';
    const measure = staff.measures[0];
    const event = measure?.voices[0]?.events[0];
    if (
      staff.clef !== clef ||
      staff.keySignature.fifths !== 0 ||
      staff.timeSignature.numerator !== 4 ||
      staff.timeSignature.denominator !== 4 ||
      staff.measures.length !== 1 ||
      !measure ||
      measure.changes !== undefined ||
      measure.voices.length !== 1 ||
      measure.voices[0]?.events.length !== 1 ||
      !event ||
      event.kind === 'chord' ||
      event.duration.value !== 'whole' ||
      event.duration.dots !== 0
    )
      throw new RangeError(
        'Großes Lernsystem: Violin/Bass, 4/4, ein ganzer Ton und eine ganze Pause',
      );
    if (event.kind === 'note') {
      if (
        event.tie ||
        event.pitch.alter !== 0 ||
        midi(event.pitch) < 21 ||
        midi(event.pitch) > 108 ||
        stepOf(event.pitch, clef) < -4 ||
        stepOf(event.pitch, clef) > 12
      )
        throw new RangeError(
          'Der Zielton muss natürlich und mit höchstens zwei Hilfslinien lesbar sein',
        );
      targets.push({ pitch: event.pitch, clef });
    }
  });
  const target = targets[0];
  if (targets.length !== 1 || !target)
    throw new RangeError('Genau ein Zielton im großen Lernsystem');
  return target;
}

/** Zwei unabhängig gesetzte Systeme mit gemeinsamer Taktbreite und ausgerichteter Taktangabe. */
export function layoutGrandStaff(score: Score): ScoreLayout {
  grandStaffTarget(score);
  const layouts = score.staves.map((staff) => layoutScore({ staves: [staff] }));
  const headerX = (layout: ScoreLayout) => {
    const item = layout.items.find((i) => i.kind === 'glyph' && i.role === 'timeSignature');
    if (item?.kind !== 'glyph') throw new RangeError('Taktangabe fehlt');
    return item.x;
  };
  const commonHeader = Math.max(...layouts.map(headerX));
  const width = Math.max(...layouts.map((layout) => layout.width + commonHeader - headerX(layout)));
  const indent = 2;
  const staffOffset = 10;
  const items: LayoutItem[] = layouts.flatMap((layout, index) => {
    const shift = commonHeader - headerX(layout);
    const offset = index * staffOffset;
    return layout.items.map((item): LayoutItem => {
      if (item.kind === 'glyph') {
        const header = item.role === 'clef' || item.role === 'keySignature';
        const metrics = glyphMetrics(item.glyph);
        const timeMetrics = glyphMetrics('timeSig4');
        const bodyStart = commonHeader + timeMetrics.bBoxNE[0] - timeMetrics.bBoxSW[0] + 1.5;
        const x =
          item.role === 'rest'
            ? (bodyStart + width) / 2 - (metrics.bBoxNE[0] + metrics.bBoxSW[0]) / 2
            : item.x + (header ? 0 : shift);
        return { ...item, x: x + indent, y: item.y + offset };
      }
      if (item.kind !== 'line') throw new RangeError('Unerwartetes Element im großen Lernsystem');
      return {
        ...item,
        x1:
          item.role === 'barline'
            ? width + indent
            : item.x1 + indent + (item.role === 'ledgerLine' ? shift : 0),
        x2:
          item.role === 'staffLine' || item.role === 'barline'
            ? width + indent
            : item.x2 + indent + shift,
        y1: item.y1 + offset,
        y2: item.y2 + offset,
      };
    });
  });
  // Gemeinsamer Anfang und Taktstrich; eckige Verbindung der beiden Lernsysteme.
  items.push(
    {
      kind: 'line',
      role: 'barline',
      x1: indent,
      x2: indent,
      y1: 0,
      y2: staffOffset + 4,
      thickness: 0.16,
    },
    {
      kind: 'line',
      role: 'barline',
      x1: width + indent,
      x2: width + indent,
      y1: 4,
      y2: staffOffset,
      thickness: 0.16,
    },
    { kind: 'line', role: 'barline', x1: 0.5, x2: 0.5, y1: 0, y2: staffOffset + 4, thickness: 0.3 },
    { kind: 'line', role: 'barline', x1: 0.5, x2: 1.3, y1: 0, y2: 0, thickness: 0.3 },
    {
      kind: 'line',
      role: 'barline',
      x1: 0.5,
      x2: 1.3,
      y1: staffOffset + 4,
      y2: staffOffset + 4,
      thickness: 0.3,
    },
  );
  return {
    width: width + indent,
    top: Math.min(...layouts.map((l, i) => l.top + i * staffOffset)),
    bottom: Math.max(...layouts.map((l, i) => l.bottom + i * staffOffset)),
    items,
  };
}

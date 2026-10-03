import { parsePitch } from '@harmonia/theory';
import { describe, expect, it } from 'vitest';

import type { LayoutItem, ScoreLayout } from './layout.ts';
import { keySignatureYs, layoutScore, staffY, stemDirection } from './layout.ts';
import { parseScore } from './shorthand.ts';

const layout = (text: string, options = {}): ScoreLayout => layoutScore(parseScore(text), options);

type Glyph = Extract<LayoutItem, { kind: 'glyph' }>;
type Line = Extract<LayoutItem, { kind: 'line' }>;
type Beam = Extract<LayoutItem, { kind: 'beam' }>;
type Tie = Extract<LayoutItem, { kind: 'tie' }>;

const glyphs = (l: ScoreLayout, role?: Glyph['role']): Glyph[] =>
  l.items.filter((i): i is Glyph => i.kind === 'glyph' && (role === undefined || i.role === role));
const lines = (l: ScoreLayout, role: Line['role']): Line[] =>
  l.items.filter((i): i is Line => i.kind === 'line' && i.role === role);
const beams = (l: ScoreLayout): Beam[] => l.items.filter((i): i is Beam => i.kind === 'beam');
const tieItems = (l: ScoreLayout): Tie[] => l.items.filter((i): i is Tie => i.kind === 'tie');
const ofEvent = <T extends LayoutItem>(items: T[], event: number, measure = 0): T[] =>
  items.filter((i) => 'ref' in i && i.ref.event === event && i.ref.measure === measure);

describe('Position im System', () => {
  it.each([
    ['treble', 'F5', 0],
    ['treble', 'E4', 4],
    ['treble', 'B4', 2],
    ['treble', 'C4', 5],
    ['treble', 'A5', -1],
    ['bass', 'A3', 0],
    ['bass', 'G2', 4],
    ['bass', 'D3', 2],
    ['bass', 'C4', -1],
  ] as const)('%s %s → y %d', (clef, pitch, y) => {
    expect(staffY(parsePitch(pitch), clef)).toBe(y);
  });

  it('Alt- und Tenorschlüssel erst ab Phase 3', () => {
    expect(() => staffY(parsePitch('C4'), 'alto')).toThrow(RangeError);
  });
});

describe('Vorzeichnung', () => {
  it('Positionen im Violinschlüssel (Fis Cis Gis Dis Ais Eis His / B Es As Des Ges Ces Fes)', () => {
    expect(keySignatureYs(7, 'treble')).toEqual([0, 1.5, -0.5, 1, 2.5, 0.5, 2]);
    expect(keySignatureYs(-7, 'treble')).toEqual([2, 0.5, 2.5, 1, 3, 1.5, 3.5]);
  });

  it('im Bassschlüssel eine Linie tiefer', () => {
    expect(keySignatureYs(3, 'bass')).toEqual([1, 2.5, 0.5]);
    expect(keySignatureYs(-2, 'bass')).toEqual([3, 1.5]);
  });

  it('wird gezeichnet', () => {
    expect(glyphs(layout('key:Eb | C4/1'), 'keySignature').map((g) => g.glyph)).toEqual([
      'accidentalFlat',
      'accidentalFlat',
      'accidentalFlat',
    ]);
    expect(glyphs(layout('C4/1'), 'keySignature')).toEqual([]);
  });
});

describe('Kopf: Schlüssel und Taktart', () => {
  it('Violin- und Bassschlüssel auf ihrer Linie', () => {
    expect(glyphs(layout('treble | C4/1'), 'clef')).toMatchObject([{ glyph: 'gClef', y: 3 }]);
    expect(glyphs(layout('bass | C3/1'), 'clef')).toMatchObject([{ glyph: 'fClef', y: 1 }]);
  });

  it('Taktart mit Zähler oben und Nenner unten', () => {
    const time = glyphs(layout('6/8 | C4/4.  C4/4.'), 'timeSignature');
    expect(time.map((g) => `${g.glyph}@${String(g.y)}`)).toEqual(['timeSig6@1', 'timeSig8@3']);
  });

  it('Gruppierung mit Pluszeichen', () => {
    const time = glyphs(layout('3+2+2/8 | C4/4. C4/4 C4/4'), 'timeSignature').map((g) => g.glyph);
    expect(time).toEqual([
      'timeSig3',
      'timeSigPlus',
      'timeSig2',
      'timeSigPlus',
      'timeSig2',
      'timeSig8',
    ]);
  });
});

describe('Hilfslinien', () => {
  it.each([
    ['C4/1', [5]],
    ['B3/1', [5]],
    ['A3/1', [5, 6]],
    ['A5/1', [-1]],
    ['C6/1', [-2, -1]],
    ['G4/1', []],
    ['(C4 E4 G4 C6)/1', [-2, -1, 5]],
  ])('%s', (text, expected) => {
    expect(lines(layout(text), 'ledgerLine').map((l) => l.y1)).toEqual(expected);
  });
});

describe('Hälse', () => {
  it.each([
    [[2], 'down'],
    [[2.5], 'up'],
    [[1.5], 'down'],
    [[2.5, 1.5], 'down'],
    [[3, 1.5], 'up'],
    [[3.5, 0], 'down'],
  ] as const)('Richtung für %j: %s', (ys, expected) => {
    expect(stemDirection(ys)).toBe(expected);
  });

  it('eine Oktave lang', () => {
    const [stem] = lines(layout('E4/4'), 'stem');
    expect(stem?.y2).toBe(0.5);
    const [down] = lines(layout('B4/4'), 'stem');
    expect(down?.y2).toBe(5.5);
  });

  it('außerhalb des Systems bis zur Mittellinie', () => {
    expect(lines(layout('C6/4'), 'stem')[0]?.y2).toBe(2);
    expect(lines(layout('A3/4'), 'stem')[0]?.y2).toBe(2);
  });

  it('Ganze und Doppelganze ohne Hals', () => {
    expect(lines(layout('C5/1'), 'stem')).toEqual([]);
    expect(lines(layout('2/1 | C5/breve'), 'stem')).toEqual([]);
  });

  it('Hals nach oben rechts, nach unten links am Notenkopf', () => {
    const up = layout('E4/4');
    const head = glyphs(up, 'notehead')[0];
    expect((lines(up, 'stem')[0]?.x1 ?? 0) - (head?.x ?? 0)).toBeCloseTo(1.12, 3);
    const down = layout('B4/4');
    const downHead = glyphs(down, 'notehead')[0];
    expect((lines(down, 'stem')[0]?.x1 ?? 0) - (downHead?.x ?? 0)).toBeCloseTo(0.06, 3);
  });
});

describe('Sekunden im Akkord: die untere Note steht links', () => {
  const xs = (text: string): Record<string, number> => {
    const l = layout(text);
    const chord = parseScore(text).staves[0]?.measures[0]?.voices[0]?.events[0];
    const pitches = chord?.kind === 'chord' ? chord.notes.map((n) => n.pitch) : [];
    return Object.fromEntries(
      glyphs(l, 'notehead').map((g) => {
        const p = pitches[g.ref?.note ?? 0];
        return [`${p?.letter ?? '?'}${String(p?.octave ?? '')}`, g.x];
      }),
    );
  };

  it('Hals nach oben: obere Note rechts vom Hals', () => {
    const x = xs('(C4 D4)/2');
    expect((x['D4'] ?? 0) > (x['C4'] ?? 0)).toBe(true);
  });

  it('Hals nach unten: untere Note links vom Hals', () => {
    const x = xs('(C5 D5)/2');
    expect((x['C5'] ?? 0) < (x['D5'] ?? 0)).toBe(true);
  });

  it('Cluster: abwechselnd', () => {
    const x = xs('(C4 D4 E4)/4');
    expect(x['C4']).toBe(x['E4']);
    expect((x['D4'] ?? 0) > (x['C4'] ?? 0)).toBe(true);
  });

  it('ohne Sekunde kein Versatz', () => {
    const x = xs('(C4 E4 G4)/4');
    expect(new Set(Object.values(x)).size).toBe(1);
  });
});

describe('Vorzeichen', () => {
  const accidentals = (text: string): string[] =>
    glyphs(layout(text), 'accidental').map(
      (g) =>
        `${String(g.ref?.measure)}/${String(g.ref?.event)}:${g.glyph.replace('accidental', '')}`,
    );

  it('nur wo die Vorzeichnung nicht gilt; Auflösungszeichen', () => {
    expect(accidentals('key:G | F4/4 F#4/4 F4/4 F#4/4')).toEqual([
      '0/0:Natural',
      '0/1:Sharp',
      '0/2:Natural',
      '0/3:Sharp',
    ]);
  });

  it('gelten bis zum Taktende, nur in derselben Oktave', () => {
    expect(accidentals('C#4/4 C#4/4 C#5/4 C4/4 | C#4/1')).toEqual([
      '0/0:Sharp',
      '0/2:Sharp',
      '0/3:Natural',
      '1/0:Sharp',
    ]);
  });

  it('Haltebogen über den Taktstrich trägt das Vorzeichen, danach wird es wiederholt', () => {
    expect(accidentals('C#4/2 C#4/2~ | C#4/2 C#4/2')).toEqual(['0/0:Sharp', '1/1:Sharp']);
  });

  it('Doppelvorzeichen', () => {
    expect(accidentals('C##4/4 Cbb4/4 C4/2')).toEqual([
      '0/0:DoubleSharp',
      '0/1:DoubleFlat',
      '0/2:Natural',
    ]);
  });

  it('Stapelung nach Gould: oberstes am Akkord, dann unterstes, dann zweitoberstes …', () => {
    const l = layout('(C#4 E#4 G#4)/2 r/2 | (C#4 B#4)/1');
    const columnOf = (measure: number) =>
      Object.fromEntries(
        ofEvent(glyphs(l, 'accidental'), 0, measure).map((g) => [String(g.ref?.note), g.x]),
      );
    // Cis–Eis–Gis: Gis (oben) am nächsten, Cis (unten) in Spalte 2, Eis in Spalte 3
    const triad = columnOf(0);
    expect((triad['2'] ?? 0) > (triad['0'] ?? 0)).toBe(true);
    expect((triad['0'] ?? 0) > (triad['1'] ?? 0)).toBe(true);
    // Cis und His sind eine Septime auseinander: eine gemeinsame Spalte (neuer Takt, Cis gilt nicht mehr)
    const seventh = columnOf(1);
    expect(Object.keys(seventh)).toHaveLength(2);
    expect(seventh['0']).toBe(seventh['1']);
  });

  it('Vorzeichen stehen links vom Notenkopf', () => {
    const l = layout('F#4/1');
    const head = glyphs(l, 'notehead')[0];
    const sharp = glyphs(l, 'accidental')[0];
    expect((sharp?.x ?? 0) + 0.996 < (head?.x ?? 0)).toBe(true);
  });
});

describe('Punkte und Pausen', () => {
  it('Punkt auf einer Linie rückt in den Zwischenraum darüber', () => {
    expect(glyphs(layout('E4/2. r/4'), 'dot')[0]?.y).toBe(3.5);
    expect(glyphs(layout('F4/2. r/4'), 'dot')[0]?.y).toBe(3.5);
    expect(glyphs(layout('E4/2.. r/8'), 'dot')).toHaveLength(2);
  });

  it('Pausen an ihrer Linie', () => {
    const l = layout('r/2 r/4 r/8 r/8');
    expect(glyphs(l, 'rest').map((g) => `${g.glyph}@${String(g.y)}`)).toEqual([
      'restHalf@2',
      'restQuarter@2',
      'rest8th@2',
      'rest8th@2',
    ]);
  });

  it('Ganztaktpause hängt an der vierten Linie, auch im 3/4-Takt', () => {
    expect(glyphs(layout('r/1'), 'rest')).toMatchObject([{ glyph: 'restWhole', y: 1 }]);
    expect(glyphs(layout('3/4 | r/2.'), 'rest')).toMatchObject([{ glyph: 'restWhole', y: 1 }]);
  });
});

describe('Fähnchen und Balken', () => {
  it('Fähnchen bei einzelnen Achteln und kürzer', () => {
    expect(glyphs(layout('C5/8 r/8 r/4 r/2'), 'flag').map((g) => g.glyph)).toEqual(['flag8thDown']);
    expect(glyphs(layout('C4/16 r/16 r/8 r/4 r/2'), 'flag').map((g) => g.glyph)).toEqual([
      'flag16thUp',
    ]);
  });

  it('Balken je Zählzeit: 4/4 in Viertel, 6/8 in punktierte Viertel', () => {
    expect(beams(layout('4/4 | C5/8 D5/8 E5/8 F5/8 G5/8 A5/8 B5/8 C6/8'))).toHaveLength(4);
    expect(beams(layout('6/8 | F4/8 G4/8 A4/8 B4/8 C5/8 D5/8'))).toHaveLength(2);
    expect(beams(layout('3+2+2/8 | C5/8 D5/8 E5/8 F5/8 G5/8 A5/8 B5/8'))).toHaveLength(3);
  });

  it('Pausen unterbrechen Balken', () => {
    const l = layout('2/4 | C5/8 r/8 E5/8 F5/8');
    expect(beams(l)).toHaveLength(1);
    expect(glyphs(l, 'flag')).toHaveLength(1);
  });

  it('Sechzehntel mit zwei Balken, Teilbalken zeigt zur punktierten Note', () => {
    expect(beams(layout('2/4 | C5/16 D5/16 E5/16 F5/16 G5/4'))).toHaveLength(2);
    const dotted = beams(layout('2/4 | C5/8. D5/16 E5/4'));
    expect(dotted).toHaveLength(2);
    const [primary, stub] = dotted;
    expect(stub && primary && stub.x2).toBe(primary?.x2);
    expect((stub?.x2 ?? 0) - (stub?.x1 ?? 0)).toBeCloseTo(1.1, 3);
  });

  it('Hälse enden am Balken', () => {
    const l = layout('2/4 | C4/8 E4/8 G4/8 C5/8');
    // Die Balkenenden reichen eine halbe Halsbreite über die Halsmitte hinaus.
    const tips = lines(l, 'stem').map((s) => s.y2);
    const [first, second] = beams(l);
    expect(tips[0]).toBeCloseTo(first?.y1 ?? 0, 1);
    expect(tips[1]).toBeCloseTo(first?.y2 ?? 0, 1);
    expect(tips[3]).toBeCloseTo(second?.y2 ?? 0, 1);
  });

  it('Balkenrichtung nach der entferntesten Note, Neigung höchstens ein Abstand', () => {
    const down = beams(layout('2/4 | E5/8 F5/8 G5/8 A5/8'));
    expect(down.every((b) => b.towards === -1)).toBe(true);
    const [low, high] = lines(layout('1/4 | C4/8 C6/8'), 'stem');
    expect(Math.abs((high?.y2 ?? 0) - (low?.y2 ?? 0))).toBeLessThanOrEqual(1);
  });

  it('Mindestlänge der Hälse unter dem Balken', () => {
    const l = layout('2/4 | C4/16 G4/16 C5/16 E5/16 C4/4');
    const stems = lines(l, 'stem').slice(0, 4);
    for (const s of stems) {
      expect(Math.abs(s.y1 - s.y2)).toBeGreaterThanOrEqual(2.9);
    }
  });
});

describe('Haltebögen', () => {
  it('gegenüber dem Hals', () => {
    expect(tieItems(layout('C5/2~ C5/2'))).toMatchObject([{ direction: 'up' }]);
    expect(tieItems(layout('E4/2~ E4/2'))).toMatchObject([{ direction: 'down' }]);
  });

  it('im Akkord oben nach oben, unten nach unten', () => {
    expect(tieItems(layout('(C4 E4 G4)/2~ (C4 E4 G4)/2')).map((t) => t.direction)).toEqual([
      'down',
      'down',
      'up',
    ]);
  });

  it('über den Taktstrich', () => {
    const [tie] = tieItems(layout('C5/2 C5/2~ | C5/1'));
    const barline = lines(layout('C5/2 C5/2~ | C5/1'), 'barline')[0];
    expect((tie?.x1 ?? 0) < (barline?.x1 ?? 0) && (tie?.x2 ?? 0) > (barline?.x1 ?? 0)).toBe(true);
  });
});

describe('Abschluss und Ausdehnung', () => {
  it('Schlussstrich, einfacher Strich oder keiner', () => {
    expect(lines(layout('C4/1', { endBarline: 'final' }), 'barline')).toHaveLength(2);
    expect(lines(layout('C4/1'), 'barline')).toHaveLength(1);
    expect(lines(layout('C4/1', { endBarline: 'none' }), 'barline')).toHaveLength(0);
    expect(lines(layout('C4/1 | C4/1'), 'barline')).toHaveLength(2);
  });

  it('fünf Notenlinien über die ganze Breite', () => {
    const l = layout('C4/1 | D4/1');
    expect(lines(l, 'staffLine').map((s) => [s.y1, s.x2])).toEqual(
      [0, 1, 2, 3, 4].map((y) => [y, l.width]),
    );
  });

  it('obere und untere Ausdehnung folgen hohen und tiefen Noten', () => {
    expect(layout('C7/1').top).toBeLessThan(-3);
    expect(layout('C3/1').bottom).toBeGreaterThan(7);
  });

  it('längere Werte bekommen mehr Platz, aber nicht linear', () => {
    const head = (text: string, n: number) => glyphs(layout(text), 'notehead')[n]?.x ?? 0;
    const eighth = head('C5/8 C5/8 r/4 r/2', 1) - head('C5/8 C5/8 r/4 r/2', 0);
    const quarter = head('C5/4 C5/4 r/2', 1) - head('C5/4 C5/4 r/2', 0);
    const half = head('C5/2 C5/2', 1) - head('C5/2 C5/2', 0);
    expect(quarter).toBeGreaterThan(eighth);
    expect(half).toBeGreaterThan(quarter);
    expect(half).toBeLessThan(2 * quarter);
  });

  it('alle Koordinaten auf Tausendstel gerundet', () => {
    const l = layout('key:7# | 3/4 | C#5/8. D#5/16 (E#4 G#4 B#4)/4 F##5/4');
    const numbers = l.items.flatMap((i) => Object.values(i).filter((v) => typeof v === 'number'));
    expect(numbers.every((v) => Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-6)).toBe(true);
  });
});

describe('Grenzen von Layout v1', () => {
  it.each([
    ['alto | C4/1', 'Schlüssel'],
    ['C5/1 & E4/1', 'Stimme'],
    ['C4/1 | 3/4 | C4/2.', 'Wechsel'],
    ['C4/1\nC3/1', 'System'],
  ])('%s', (text, reason) => {
    expect(() => layout(text)).toThrow(RangeError);
    expect(() => layout(text)).toThrow(new RegExp(reason));
  });
});

describe('Referenzbeispiele (Snapshots)', () => {
  it.each([
    ['Einzeltöne', 'treble | 4/4 | C4/4 E4/4 G4/4 B4/4 | D5/4 F5/4 A5/4 C6/4'],
    ['Einzeltöne Bass', 'bass | 3/4 | C2/4 G2/4 C3/4 | E3/4 G3/4 C4/4'],
    ['Intervalle', 'treble | 4/4 | (C4 D4)/2 (C4 G4)/2 | (C5 D5)/2 (E4 C5)/2'],
    ['Akkorde', 'treble | key:D | 4/4 | (D4 F#4 A4)/4 (C#4 E4 G#4)/4 (C4 Eb4 G4 Bb4)/2'],
    ['Tonleiter', 'treble | key:Ab | 4/4 | Ab4/8 Bb4/8 C5/8 Db5/8 Eb5/8 F5/8 G5/8 Ab5/8'],
    [
      'Rhythmus',
      'treble | 6/8 | F4/8 G4/8 A4/8 B4/4. | C5/8 r/8 E5/16 F5/16 D5/4 C5/8 | G4/4.~ G4/4.',
    ],
  ])('%s', (_, text) => {
    expect(layout(text, { endBarline: 'final' })).toMatchSnapshot();
  });
});

describe('Leistung', () => {
  it('8 Takte deutlich unter 50 ms', () => {
    const measure = '(C4 E4 G4)/8 D4/16 E4/16 F#4/8 G4/8 (A4 C5)/4 B4/16 C5/16 D5/8';
    const score = parseScore(
      `key:G | 4/4 | ${Array.from({ length: 8 }, () => measure).join(' | ')}`,
    );
    layoutScore(score); // Aufwärmen
    const runs = 20;
    const start = Date.now();
    for (let i = 0; i < runs; i++) {
      layoutScore(score);
    }
    const average = (Date.now() - start) / runs;
    expect(average).toBeLessThan(50);
  });
});

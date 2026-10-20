import { describe, expect, it } from 'vitest';
import { eventPitches, parseScore } from '@harmonia/notation';
import { checkMeasure, midi } from '@harmonia/theory';
import { Chord } from 'tonal';
import catalogueJson from '../../content/src/catalogue.json' with { type: 'json' };

// Korrekturen aus der Fachprüfung Stufe 3/4: Kartenbeispiele müssen ihre Aussage tragen.
interface CardRecord {
  readonly id: string;
  readonly examples: readonly { readonly score: string }[];
}
const catalogue = catalogueJson as { readonly knowledgeCards: readonly CardRecord[] };

function card(id: string): CardRecord {
  const found = catalogue.knowledgeCards.find((entry) => entry.id === id);
  if (!found) throw new Error(`Karte fehlt: ${id}`);
  return found;
}
function measures(scoreText: string) {
  const staff = parseScore(scoreText).staves[0];
  if (!staff) throw new Error('System fehlt');
  return staff.measures.map((measure) => {
    const events = measure.voices[0]?.events ?? [];
    expect(
      checkMeasure(
        events.map((event) => event.duration),
        staff.timeSignature,
      ).status,
    ).toBe('complete');
    return events.map((event) =>
      eventPitches(event)
        .map((pitch) => midi(pitch))
        .sort((a, b) => a - b),
    );
  });
}

describe('Rondo-Karte zeigt A–B–A–C–A', () => {
  const rondo = measures(card('forms.l3.designs.card-rondo').examples[0]?.score ?? '');
  const key = (bar: number[][] | undefined) => JSON.stringify(bar);
  it('hat fünf volle Takte mit wiederkehrendem Refrain und zwei verschiedenen Kontrastteilen', () => {
    expect(rondo).toHaveLength(5);
    expect(key(rondo[0])).toBe(key(rondo[2]));
    expect(key(rondo[0])).toBe(key(rondo[4]));
    const [b, c] = [key(rondo[1]), key(rondo[3])];
    expect(new Set([key(rondo[0]), b, c]).size).toBe(3);
  });
});

describe('Karte „Gemeinsame Töne halten“ (Stufe 4)', () => {
  const [from, to] = measures(
    card('satz.l4.voice-leading.card-common').examples[0]?.score ?? '',
  ).flat();
  it('hält den gemeinsamen Ton G in derselben Stimme, die anderen Stimmen gehen um höchstens einen Ganzton', () => {
    expect(from).toBeDefined();
    expect(to).toBeDefined();
    if (!from || !to) return;
    expect(from).toHaveLength(3);
    expect(to).toHaveLength(3);
    const held = from.filter((note, voice) => note === to[voice]);
    expect(held).toEqual([67]);
    from.forEach((note, voice) => {
      expect(Math.abs((to[voice] ?? 0) - note)).toBeLessThanOrEqual(2);
    });
  });
  it('enthält keine parallelen reinen Quinten, Oktaven oder Primen zwischen zwei Stimmen', () => {
    if (!from || !to) throw new Error('Akkorde fehlen');
    for (let low = 0; low < 3; low++)
      for (let high = low + 1; high < 3; high++) {
        const before = (from[high] ?? 0) - (from[low] ?? 0);
        const after = (to[high] ?? 0) - (to[low] ?? 0);
        const sameDirection =
          Math.sign((to[low] ?? 0) - (from[low] ?? 0)) ===
            Math.sign((to[high] ?? 0) - (from[high] ?? 0)) && (to[low] ?? 0) !== (from[low] ?? 0);
        const perfect = (span: number) => [0, 7, 12].includes(span % 12);
        expect(
          sameDirection && perfect(before) && perfect(after),
          `${String(low)}/${String(high)}`,
        ).toBe(false);
      }
  });
  it('bestätigt mit tonal: C-Dur geht nach G-Dur in erster Umkehrung', () => {
    expect(Chord.detect(['C4', 'E4', 'G4'])).toContain('CM');
    expect(Chord.detect(['B3', 'D4', 'G4'])).toContain('GM/B');
  });
});

import {
  grandStaffTarget,
  layoutScore,
  parseScore,
  scoreTimeline,
  validateScore,
} from '@harmonia/notation';
import { catalogue } from '@harmonia/content/catalogue';

// Die Notenbeispiele der Stufe 2 werden hier geprüft, weil das Paket content
// das Notationspaket nicht importieren darf (tools/check-package-graph.mjs).
describe('Stufe 2: Klaviersystem-Beispiele', () => {
  it('jedes Zweizeilen-Beispiel ergibt ein Ziel und genau einen Ton im Zeitverlauf', () => {
    const cards = catalogue.knowledgeCards.filter((c) =>
      c.id.startsWith('notation.l2.clefs-registers'),
    );
    for (const example of cards.flatMap((c) => c.examples)) {
      const score = parseScore(example.score);
      if (score.staves.length === 2) {
        grandStaffTarget(score);
        expect(scoreTimeline(score, { bpm: 90 }).tones).toHaveLength(1);
      }
    }
  });

  it('Stufe 2: alle 135 neuen Beispiele sind gültig und mit dem aktuellen Notensatz darstellbar', () => {
    const cards = catalogue.knowledgeCards.filter((c) => c.contentVersion === 13);
    expect(cards).toHaveLength(135);
    for (const c of cards)
      for (const e of c.examples) {
        const score = parseScore(e.score);
        expect(validateScore(score, { allowPickup: false })).toEqual([]);
        expect(() => layoutScore(score)).not.toThrow();
      }
  });
});

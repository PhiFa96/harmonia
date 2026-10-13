import { grandStaffTarget, parseScore, scoreTimeline } from '@harmonia/notation';
import { catalogue } from '@harmonia/content/catalogue';

// Die Notenbeispiele der ersten Stufe-2-Einheit werden hier geprüft, weil das Paket content
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
});

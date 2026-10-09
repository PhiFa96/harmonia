import {
  keyboardMidi,
  parseScore,
  scoreTimeline,
  validateScore,
} from '../packages/notation/src/index.ts';

// Dieselbe Prüfung für Inhaltsproduktion und Pipeline-Tests, ohne Datei-/Netzwerkzugriff.
export function validateContentExample(source, keyboard) {
  const score = parseScore(source);
  if (validateScore(score).length > 0)
    throw new Error('Notenbeispiel ist rhythmisch oder strukturell ungültig');
  if (
    keyboard &&
    scoreTimeline(score, { bpm: 90 }).tones.some(({ pitch }) => {
      const midi = keyboardMidi(pitch);
      return midi < keyboard.first || midi > keyboard.last;
    })
  )
    throw new Error('Notenbeispiel liegt außerhalb des Klaviatur-Ausschnitts');
}

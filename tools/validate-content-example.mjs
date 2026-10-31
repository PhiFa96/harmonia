import {
  grandStaffTarget,
  layoutScore,
  keyboardMidi,
  parseScore,
  scoreTimeline,
  validateScore,
} from '../packages/notation/src/index.ts';
import { pulseExample } from '../packages/exercises/src/index.ts';

// Dieselbe Prüfung für Inhaltsproduktion und Pipeline-Tests, ohne Datei-/Netzwerkzugriff.
export function validateContentExample(source, keyboard, pulse) {
  const score = parseScore(source);
  if (validateScore(score).length > 0)
    throw new Error('Notenbeispiel ist rhythmisch oder strukturell ungültig');
  if (score.staves.length === 2) {
    const polyphonic = score.staves.some((staff) =>
      staff.measures.some((measure) => measure.voices.length > 1),
    );
    // Keyboard learning images retain their single-target contract. Polyphonic
    // reading examples use the same general layout as the app.
    if (polyphonic && !keyboard) layoutScore(score);
    else grandStaffTarget(score);
  }
  if (pulse) pulseExample(score, pulse.bpm);
  if (
    keyboard &&
    scoreTimeline(score, { bpm: 90 }).tones.some(({ pitch }) => {
      const midi = keyboardMidi(pitch);
      return midi < keyboard.first || midi > keyboard.last;
    })
  )
    throw new Error('Notenbeispiel liegt außerhalb des Klaviatur-Ausschnitts');
}

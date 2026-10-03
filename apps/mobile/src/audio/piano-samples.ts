// Generiert von tools/prepare-samples.mjs – nicht von Hand ändern.
// Klavier: Salamander Grand Piano (Tone.js-Kopie, OGG Vorbis), Alexander Holm, Lizenz CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/).
// Bearbeitet: Auswahl in kleinen Terzen, Stille am Anfang entfernt, auf 4 s gekürzt und ausgeblendet,
// Mono, gleiche Lautheit je Probe (EBU R128, mittlere Verstärkung 4.5 dB), MP3 (LAME VBR 4).

import A0 from '../../assets/sounds/piano/A0.mp3';
import C1 from '../../assets/sounds/piano/C1.mp3';
import Ds1 from '../../assets/sounds/piano/Ds1.mp3';
import Fs1 from '../../assets/sounds/piano/Fs1.mp3';
import A1 from '../../assets/sounds/piano/A1.mp3';
import C2 from '../../assets/sounds/piano/C2.mp3';
import Ds2 from '../../assets/sounds/piano/Ds2.mp3';
import Fs2 from '../../assets/sounds/piano/Fs2.mp3';
import A2 from '../../assets/sounds/piano/A2.mp3';
import C3 from '../../assets/sounds/piano/C3.mp3';
import Ds3 from '../../assets/sounds/piano/Ds3.mp3';
import Fs3 from '../../assets/sounds/piano/Fs3.mp3';
import A3 from '../../assets/sounds/piano/A3.mp3';
import C4 from '../../assets/sounds/piano/C4.mp3';
import Ds4 from '../../assets/sounds/piano/Ds4.mp3';
import Fs4 from '../../assets/sounds/piano/Fs4.mp3';
import A4 from '../../assets/sounds/piano/A4.mp3';
import C5 from '../../assets/sounds/piano/C5.mp3';
import Ds5 from '../../assets/sounds/piano/Ds5.mp3';
import Fs5 from '../../assets/sounds/piano/Fs5.mp3';
import A5 from '../../assets/sounds/piano/A5.mp3';
import C6 from '../../assets/sounds/piano/C6.mp3';
import Ds6 from '../../assets/sounds/piano/Ds6.mp3';
import Fs6 from '../../assets/sounds/piano/Fs6.mp3';
import A6 from '../../assets/sounds/piano/A6.mp3';
import C7 from '../../assets/sounds/piano/C7.mp3';
import Ds7 from '../../assets/sounds/piano/Ds7.mp3';
import Fs7 from '../../assets/sounds/piano/Fs7.mp3';
import A7 from '../../assets/sounds/piano/A7.mp3';
import C8 from '../../assets/sounds/piano/C8.mp3';

/**
 * Stützstellen: MIDI-Nummer, Asset und gemessene Stimmung in Cent gegenüber gleichstufig (a¹ = 440 Hz).
 * Gemessen mit tools/lib/pitch.mjs (YIN unter C6, Spektrum ab C6); der Sampler gleicht sie aus.
 */
export const PIANO_SAMPLES: readonly {
  readonly midi: number;
  readonly asset: number;
  readonly cents: number;
}[] = [
  { midi: 21, asset: A0, cents: -7.9 },
  { midi: 24, asset: C1, cents: -13.4 },
  { midi: 27, asset: Ds1, cents: 5.8 },
  { midi: 30, asset: Fs1, cents: -4.9 },
  { midi: 33, asset: A1, cents: 2.2 },
  { midi: 36, asset: C2, cents: 4.3 },
  { midi: 39, asset: Ds2, cents: 0.8 },
  { midi: 42, asset: Fs2, cents: -0.4 },
  { midi: 45, asset: A2, cents: 3.2 },
  { midi: 48, asset: C3, cents: -4.4 },
  { midi: 51, asset: Ds3, cents: 1.3 },
  { midi: 54, asset: Fs3, cents: 0.9 },
  { midi: 57, asset: A3, cents: 4.6 },
  { midi: 60, asset: C4, cents: 2.1 },
  { midi: 63, asset: Ds4, cents: 6.9 },
  { midi: 66, asset: Fs4, cents: 2.5 },
  { midi: 69, asset: A4, cents: 6.4 },
  { midi: 72, asset: C5, cents: 3.1 },
  { midi: 75, asset: Ds5, cents: 5.4 },
  { midi: 78, asset: Fs5, cents: 1.7 },
  { midi: 81, asset: A5, cents: 9.7 },
  { midi: 84, asset: C6, cents: 9 },
  { midi: 87, asset: Ds6, cents: 8 },
  { midi: 90, asset: Fs6, cents: 11.5 },
  { midi: 93, asset: A6, cents: 14.5 },
  { midi: 96, asset: C7, cents: 23.5 },
  { midi: 99, asset: Ds7, cents: 18.5 },
  { midi: 102, asset: Fs7, cents: 24 },
  { midi: 105, asset: A7, cents: 39 },
  { midi: 108, asset: C8, cents: 99.5 },
];

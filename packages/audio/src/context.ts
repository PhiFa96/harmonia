// Der Teil der Web Audio API, den Harmonia nutzt. Der Browser (AudioContext) und react-native-audio-api
// (iOS/Android) erfüllen ihn beide; Tests nutzen eine Attrappe mit eigener Uhr.
// Eigene Typen statt DOM-Typen, damit das Paket ohne Browser-Bibliothek (Node, Deno) übersetzt.

export interface AudioParamLike {
  value: number;
  setValueAtTime(value: number, time: number): unknown;
  linearRampToValueAtTime(value: number, time: number): unknown;
  exponentialRampToValueAtTime(value: number, time: number): unknown;
  cancelScheduledValues(time: number): unknown;
}

export interface AudioNodeLike {
  connect(destination: AudioNodeLike): unknown;
  disconnect(): unknown;
}

export type WaveForm = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface OscillatorLike extends AudioNodeLike {
  type: WaveForm | 'custom';
  readonly frequency: AudioParamLike;
  start(when?: number): unknown;
  stop(when?: number): unknown;
}

export interface GainLike extends AudioNodeLike {
  readonly gain: AudioParamLike;
}

export interface AudioContextLike {
  /** Audio-Uhr in Sekunden; läuft hardwaregenau, unabhängig von JavaScript-Timern. */
  readonly currentTime: number;
  readonly sampleRate: number;
  readonly state: string;
  readonly destination: AudioNodeLike;
  createOscillator(): OscillatorLike;
  createGain(): GainLike;
  resume(): Promise<unknown>;
  /** Nur Browser: Verarbeitungs- und Ausgabelatenz in Sekunden, wie sie das System meldet. */
  readonly baseLatency?: number;
  readonly outputLatency?: number;
}

/** Timer für die Vorausplanung (setInterval im Browser und in React Native). */
export interface Timers {
  setInterval(callback: () => void, ms: number): unknown;
  clearInterval(handle: unknown): void;
}

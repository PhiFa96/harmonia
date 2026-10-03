// Attrappe eines AudioContext mit steuerbarer Uhr: zeichnet alle geplanten Werte und Starts auf.

import type {
  AudioBufferLike,
  AudioContextLike,
  BufferSourceLike,
  AudioNodeLike,
  AudioParamLike,
  GainLike,
  OscillatorLike,
  Timers,
  WaveForm,
} from '../context.ts';

export interface ParamEvent {
  readonly kind: 'set' | 'linear' | 'exponential' | 'cancel';
  readonly value: number;
  readonly time: number;
}

export class FakeParam implements AudioParamLike {
  value = 0;
  readonly events: ParamEvent[] = [];
  setValueAtTime(value: number, time: number) {
    this.events.push({ kind: 'set', value, time });
  }
  linearRampToValueAtTime(value: number, time: number) {
    this.events.push({ kind: 'linear', value, time });
  }
  exponentialRampToValueAtTime(value: number, time: number) {
    if (value <= 0) {
      // Wie im Browser: exponentielle Rampe auf 0 ist ein Fehler
      throw new RangeError('exponentialRampToValueAtTime: Wert muss > 0 sein');
    }
    this.events.push({ kind: 'exponential', value, time });
  }
  cancelScheduledValues(time: number) {
    this.events.push({ kind: 'cancel', value: 0, time });
  }
}

class FakeNode implements AudioNodeLike {
  readonly connections: AudioNodeLike[] = [];
  connect(destination: AudioNodeLike) {
    this.connections.push(destination);
    return destination;
  }
  disconnect() {
    this.connections.length = 0;
  }
}

export class FakeOscillator extends FakeNode implements OscillatorLike {
  type: WaveForm | 'custom' = 'sine';
  readonly frequency = new FakeParam();
  startTime: number | undefined;
  stopTimes: number[] = [];
  start(when = 0) {
    this.startTime = when;
  }
  stop(when = 0) {
    this.stopTimes.push(when);
  }
}

export class FakeGain extends FakeNode implements GainLike {
  readonly gain = new FakeParam();
}

/** Puffer mit vorgegebenen Samples (Mono). */
export class FakeBuffer implements AudioBufferLike {
  readonly numberOfChannels = 1;
  constructor(
    private readonly data: Float32Array,
    readonly sampleRate = 48000,
  ) {}
  get length() {
    return this.data.length;
  }
  get duration() {
    return this.data.length / this.sampleRate;
  }
  getChannelData() {
    return this.data;
  }
}

export class FakeBufferSource extends FakeNode implements BufferSourceLike {
  buffer: AudioBufferLike | null = null;
  readonly playbackRate = new FakeParam();
  startTime: number | undefined;
  startOffset: number | undefined;
  stopTimes: number[] = [];
  start(when = 0, offset = 0) {
    this.startTime = when;
    this.startOffset = offset;
  }
  stop(when = 0) {
    this.stopTimes.push(when);
  }
}

export class FakeContext implements AudioContextLike {
  currentTime = 0;
  readonly sampleRate = 48000;
  state = 'suspended';
  readonly destination = new FakeNode();
  readonly oscillators: FakeOscillator[] = [];
  readonly gains: FakeGain[] = [];
  readonly sources: FakeBufferSource[] = [];
  createOscillator() {
    const osc = new FakeOscillator();
    this.oscillators.push(osc);
    return osc;
  }
  createGain() {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }
  createBufferSource() {
    const source = new FakeBufferSource();
    this.sources.push(source);
    return source;
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
}

/** Timer, die nur auf Zuruf laufen: `tick()` ruft alle registrierten Rückrufe einmal auf. */
export class FakeTimers implements Timers {
  private readonly callbacks = new Map<number, () => void>();
  private nextId = 1;
  setInterval(callback: () => void) {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    return id;
  }
  clearInterval(handle: unknown) {
    this.callbacks.delete(handle as number);
  }
  tick() {
    for (const cb of [...this.callbacks.values()]) {
      cb();
    }
  }
  get running(): number {
    return this.callbacks.size;
  }
}

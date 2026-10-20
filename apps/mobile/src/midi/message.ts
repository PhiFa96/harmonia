/** MIDI 1.0 channel messages. One controller can send on several channels. */
export class MidiNotes {
  private readonly down = new Set<string>();
  private readonly sustained = new Set<string>();
  private readonly pedals = new Set<number>();
  private readonly sounding = new Set<string>();
  velocity: number | null = null;
  /** Wird nur erhöht, wenn sich gehaltene Töne oder das Pedal ändern (nicht bei Rad, Bend oder Aftertouch). */
  version = 0;

  private signature(): string {
    return `${[...this.sounding].sort().join(',')}|${String(this.pedals.size > 0)}`;
  }

  clear() {
    this.version++;
    this.down.clear();
    this.sustained.clear();
    this.pedals.clear();
    this.sounding.clear();
    this.velocity = null;
  }

  get held(): ReadonlySet<number> {
    return new Set([...this.sounding].map((key) => Number(key.split(':')[1])));
  }

  get sustain(): boolean {
    return this.pedals.size > 0;
  }

  /** Returns every fresh strike, including a retriggered note held by the pedal. */
  receive(data: ArrayLike<number>): { note: number; velocity: number } | null {
    const before = this.signature();
    const strike = this.apply(data);
    if (this.signature() !== before) this.version++;
    return strike;
  }

  private apply(data: ArrayLike<number>): { note: number; velocity: number } | null {
    if (data.length < 3) return null;
    const status = data[0] ?? 0;
    const channel = status & 15;
    const kind = status & 0xf0;
    const note = data[1] ?? -1;
    const value = data[2] ?? -1;
    if (status < 0x80 || status > 0xef || note < 0 || note > 127 || value < 0 || value > 127)
      return null;
    const key = `${String(channel)}:${String(note)}`;
    if (kind === 0x90 && value > 0) {
      this.down.add(key);
      this.sustained.delete(key);
      this.sounding.add(key);
      this.velocity = value;
      return { note, velocity: value };
    }
    if (kind === 0x80 || (kind === 0x90 && value === 0)) {
      this.down.delete(key);
      if (this.pedals.has(channel)) this.sustained.add(key);
      else this.sounding.delete(key);
    } else if (kind === 0xb0 && note === 64) {
      if (value >= 64) this.pedals.add(channel);
      else {
        this.pedals.delete(channel);
        for (const held of this.sustained) {
          if (held.startsWith(`${String(channel)}:`)) {
            this.sustained.delete(held);
            if (!this.down.has(held)) this.sounding.delete(held);
          }
        }
      }
    } else if (kind === 0xb0 && (note === 120 || note === 123)) {
      for (const held of this.sounding) {
        if (held.startsWith(`${String(channel)}:`)) {
          this.sounding.delete(held);
          this.down.delete(held);
          this.sustained.delete(held);
        }
      }
    } else if (kind === 0xb0 && note === 121) {
      this.pedals.delete(channel);
      for (const held of this.sustained) {
        if (held.startsWith(`${String(channel)}:`)) {
          this.sustained.delete(held);
          if (!this.down.has(held)) this.sounding.delete(held);
        }
      }
    }
    return null;
  }
}

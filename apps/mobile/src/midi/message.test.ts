import { MidiNotes } from './message';

describe('MIDI keyboard state', () => {
  it('handles note-on, zero-velocity note-off and retriggered strikes', () => {
    const notes = new MidiNotes();
    expect(notes.receive([0x91, 60, 83])).toEqual({ note: 60, velocity: 83 });
    expect(notes.receive([0x91, 60, 45])).toEqual({ note: 60, velocity: 45 });
    expect([...notes.held]).toEqual([60]);
    notes.receive([0x91, 60, 0]);
    expect(notes.held.size).toBe(0);
    expect(notes.velocity).toBe(45);
  });

  it('holds released notes with sustain, including separate channels', () => {
    const notes = new MidiNotes();
    notes.receive([0xb0, 64, 127]);
    notes.receive([0x90, 60, 70]);
    notes.receive([0x91, 60, 100]);
    notes.receive([0x80, 60, 0]);
    expect(notes.sustain).toBe(true);
    expect([...notes.held]).toEqual([60]);
    notes.receive([0xb0, 64, 0]);
    expect([...notes.held]).toEqual([60]);
    notes.receive([0xb1, 123, 0]);
    expect(notes.held.size).toBe(0);
  });

  it('clears held notes on all-notes-off, device changes and invalid packets', () => {
    const notes = new MidiNotes();
    expect(notes.receive([0xf8])).toBeNull();
    expect(notes.receive([0x90, 130, 12])).toBeNull();
    notes.receive([0x90, 72, 127]);
    notes.receive([0xb0, 120, 0]);
    expect(notes.held.size).toBe(0);
    notes.receive([0x90, 74, 60]);
    notes.clear();
    expect(notes.held.size).toBe(0);
    expect(notes.velocity).toBeNull();
    expect(notes.sustain).toBe(false);
  });

  it('reports a state change only for held notes and pedal, not for wheels or aftertouch', () => {
    const notes = new MidiNotes();
    const before = notes.version;
    for (const packet of [
      [0xb0, 1, 64], // modulation wheel
      [0xe0, 0, 80], // pitch bend
      [0xa0, 60, 50], // polyphonic aftertouch
      [0xb0, 7, 100], // volume
      [0x80, 60, 0], // release of a note that never sounded
      [0xb0, 64, 0], // pedal stays up
    ])
      notes.receive(packet);
    expect(notes.version).toBe(before);
    notes.receive([0x90, 60, 80]);
    const afterStrike = notes.version;
    expect(afterStrike).toBeGreaterThan(before);
    notes.receive([0xb0, 1, 90]);
    expect(notes.version).toBe(afterStrike);
    notes.receive([0xb0, 64, 127]);
    expect(notes.version).toBeGreaterThan(afterStrike);
    const pedalDown = notes.version;
    notes.receive([0xb0, 64, 127]);
    expect(notes.version).toBe(pedalDown);
    notes.receive([0x80, 60, 0]);
    notes.receive([0xb0, 64, 0]);
    expect(notes.version).toBeGreaterThan(pedalDown);
  });
});

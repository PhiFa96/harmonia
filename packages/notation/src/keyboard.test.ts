import { fromMidi, midi } from '@harmonia/theory';
import { describe, expect, it } from 'vitest';
import {
  KEYBOARD_SHORTCUTS,
  PIANO_RANGE,
  PRACTICE_RANGE,
  keyboardHit,
  keyboardLabel,
  keyboardLayout,
  keyboardPitch,
  keyboardSpokenNames,
} from './keyboard.ts';

describe('Klaviatur', () => {
  it('enthält alle 88 Tasten A0–C8, mit 52 weißen und 36 schwarzen Tasten', () => {
    const layout = keyboardLayout(PIANO_RANGE);
    expect(layout.keys).toHaveLength(88);
    expect(layout.keys.filter((key) => !key.black)).toHaveLength(52);
    expect(layout.keys.filter((key) => key.black)).toHaveLength(36);
    expect(layout.width).toBe(52 * 80);
    expect(layout.keys.map((key) => key.midi)).toEqual(
      Array.from({ length: 88 }, (_, index) => index + 21),
    );
  });

  it('trifft jede Taste korrekt: schwarz oben, weiß im unteren Bereich', () => {
    for (const width of [80, 96, 112]) {
      const layout = keyboardLayout(PIANO_RANGE, width);
      for (const key of layout.keys) {
        expect(key.width).toBeGreaterThanOrEqual(48);
        const y = key.black ? 30 : 170;
        expect(keyboardHit(layout, key.left + key.width / 2, y)?.midi).toBe(key.midi);
        expect(midi(keyboardPitch(key.midi))).toBe(key.midi);
      }
    }
  });

  it('schwarze Tasten haben Vorrang vor ihren weißen Nachbarn; keine Taste außerhalb', () => {
    const layout = keyboardLayout(PRACTICE_RANGE);
    expect(keyboardHit(layout, 70, 30)?.midi).toBe(61);
    expect(keyboardHit(layout, 70, 170)?.midi).toBe(60);
    for (const [x, y] of [
      [-1, 30],
      [layout.width, 30],
      [10, -1],
      [10, 200],
    ]) {
      expect(keyboardHit(layout, x ?? 0, y ?? 0)).toBeUndefined();
    }
  });

  it('Ausschnitte können auf schwarzen Tasten anfangen oder enden, ohne sie abzuschneiden', () => {
    for (const range of [
      { first: 61, last: 63 },
      { first: 61, last: 61 },
    ]) {
      const layout = keyboardLayout(range);
      for (const key of layout.keys) {
        expect(key.left).toBeGreaterThanOrEqual(0);
        expect(key.left + key.width).toBeLessThanOrEqual(layout.width);
        expect(keyboardHit(layout, key.left + key.width / 2, 30)?.midi).toBe(key.midi);
      }
    }
  });

  it('weist ungültige Bereiche und zu kleine Touch-Ziele zurück', () => {
    for (const range of [
      { first: 20, last: 108 },
      { first: 60, last: 109 },
      { first: 62, last: 60 },
      { first: 60.5, last: 70 },
    ]) {
      expect(() => keyboardLayout(range)).toThrow(RangeError);
    }
    expect(() => keyboardLayout(PRACTICE_RANGE, 79)).toThrow(RangeError);
  });

  it('H/B und internationale Namen stimmen, auch ohne sichtbare Beschriftung bleibt die Ansage', () => {
    expect(keyboardLabel(fromMidi(71), 'de')).toBe('h¹');
    expect(keyboardLabel(fromMidi(70, 'flat'), 'de')).toBe('b¹');
    expect(keyboardLabel(fromMidi(71), 'intl')).toBe('B4');
    expect(keyboardLabel(fromMidi(70, 'flat'), 'intl')).toBe('B♭4');
    expect(keyboardLabel(fromMidi(61), 'none')).toBe('');
    expect(keyboardSpokenNames(61, 'de')).toEqual(['eingestrichenes cis', 'eingestrichenes des']);
    expect(keyboardSpokenNames(61, 'en')).toEqual(['C sharp 4', 'D flat 4']);
  });

  it('die Übung bestimmt die Schreibweise unabhängig vom sichtbaren Benennungssystem', () => {
    const des = fromMidi(61, 'flat');
    expect(keyboardPitch(61, des)).toEqual(des);
    expect(keyboardPitch(62, des)).toEqual(fromMidi(62));
    const his = { letter: 'B', alter: 1, octave: 3 } as const;
    expect(keyboardPitch(60, his)).toEqual(his);
    expect(keyboardSpokenNames(60, 'de', his)).toEqual(['kleines his', 'eingestrichenes c']);
    expect(Object.values(KEYBOARD_SHORTCUTS)).toEqual(
      Array.from({ length: 17 }, (_, index) => index + 60),
    );
  });
});

import {
  createPcmHealth,
  MICROPHONE_START_TIMEOUT_MS,
  MICROPHONE_GAP_TIMEOUT_MS,
} from '@/microphone/health';
const frame = () => new Float32Array(2048);
it('accepts genuine silent PCM without requiring a sung pitch', () => {
  const h = createPcmHealth(0);
  expect(h.check(MICROPHONE_START_TIMEOUT_MS - 1)).toBeNull();
  expect(h.frame(frame(), 48000, 100, MICROPHONE_START_TIMEOUT_MS - 1)).toBeNull();
  expect(h.check(MICROPHONE_START_TIMEOUT_MS)).toBeNull();
});
it('stops at the startup deadline and cannot be revived by late frames', () => {
  const h = createPcmHealth(0);
  expect(h.check(MICROPHONE_START_TIMEOUT_MS)).toBe('no-input');
  expect(h.frame(frame(), 48000, 100, MICROPHONE_START_TIMEOUT_MS)).toBe('no-input');
});
it('checks missing input before accepting a new frame, even if the timer was delayed', () => {
  const h = createPcmHealth(0);
  expect(h.frame(frame(), 48000, 100, 0)).toBeNull();
  expect(h.check(MICROPHONE_GAP_TIMEOUT_MS - 1)).toBeNull();
  expect(h.frame(frame(), 48000, 200, MICROPHONE_GAP_TIMEOUT_MS)).toBe('interrupted');
  expect(h.check(MICROPHONE_GAP_TIMEOUT_MS + 1)).toBe('interrupted');
});
it('valid fresh frames extend the transport deadline, regardless of pitch confidence', () => {
  const h = createPcmHealth(0);
  for (let i = 0; i < 100; i++) expect(h.frame(frame(), 48000, i, i * 40)).toBeNull();
  expect(h.check(99 * 40 + MICROPHONE_GAP_TIMEOUT_MS - 1)).toBeNull();
  expect(h.check(99 * 40 + MICROPHONE_GAP_TIMEOUT_MS)).toBe('interrupted');
});
it.each([0, NaN, Infinity, 7999, 192001])('rejects unsupported sample rate %s', (rate) => {
  expect(createPcmHealth(0).frame(frame(), rate, 0, 0)).toBe('unavailable');
});
it.each([NaN, Infinity, -Infinity])('rejects invalid timestamp %s', (at) => {
  expect(createPcmHealth(0).frame(frame(), 48000, at, 0)).toBe('unavailable');
});
it('rejects changed routes/rates, backwards timestamps, malformed buffers and non-finite samples', () => {
  const h = createPcmHealth(0);
  h.frame(frame(), 48000, 100, 0);
  expect(h.frame(frame(), 44100, 101, 1)).toBe('unavailable');
  const stale = createPcmHealth(0);
  stale.frame(frame(), 48000, 100, 0);
  expect(stale.frame(frame(), 48000, 99, 1)).toBe('unavailable');
  expect(createPcmHealth(0).frame(new Float32Array(0), 48000, 0, 0)).toBe('unavailable');
  const corrupt = frame();
  corrupt[25] = NaN;
  expect(createPcmHealth(0).frame(corrupt, 48000, 0, 0)).toBe('unavailable');
  expect(createPcmHealth(10).check(9)).toBe('interrupted');
  expect(() => createPcmHealth(NaN)).toThrow();
});

it('accepts equal timestamps from a privacy-rounded browser clock', () => {
  const h = createPcmHealth(0);
  expect(h.frame(frame(), 48000, 100, 0)).toBeNull();
  expect(h.frame(frame(), 48000, 100, 40)).toBeNull();
});

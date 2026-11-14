import { createChoirClock } from '@/choir/clock';

it('pairs fresh snapshots without extrapolating a rounded capture clock or its origin', () => {
  const clock = createChoirClock(0.03125);
  expect(clock.position(12000, 1, true, 'snapshot')).toBe(1);
  expect(clock.position(12100, 1.04, false, 'snapshot')).toBe(1.04);
  expect(clock.position(12100, 1.08, false, 'snapshot')).toBe(1.08);
  expect(clock.position(12200, 1.12, false, 'snapshot')).toBe(1.12);
});

it('learns the least queued count-in offset and keeps delayed native batch spacing after it', () => {
  const clock = createChoirClock(0.03125);
  expect(clock.position(10000, 1.2, true, 'buffered')).toBeCloseTo(1.2);
  expect(clock.position(11000, 2, true, 'buffered')).toBe(2);
  expect(clock.position(12000, 3.1, true, 'buffered')).toBe(3);
  const mapped = [13000, 13040, 13080].map((at) => clock.position(at, 4.28, false, 'buffered'));
  for (const [index, expected] of [4, 4.04, 4.08].entries())
    expect(mapped[index]).toBeCloseTo(expected);
  expect(clock.position(14000, 5.2, false, 'buffered')).toBe(5);
});

it('allows the half-bin future boundary but stops permanently beyond it', () => {
  const clock = createChoirClock(0.03125);
  clock.position(12000, 0, true);
  expect(clock.position(13031.25, 1, false)).toBe(1.03125);
  expect(clock.position(13031.5, 1, false)).toBeNull();
  expect(clock.position(14000, 2, false)).toBeNull();
  expect(clock.check(3)).toBe(false);
});

it('permits a bounded queue but refuses a window at the exact transport-age limit', () => {
  const clock = createChoirClock(0.03125);
  clock.position(12000, 0, true);
  expect(clock.position(13000, 1.999, false)).toBe(1);
  expect(clock.position(14000, 3, false)).toBeNull();
});

it('does not permit a backwards capture clock even for a fresh analyser snapshot', () => {
  const clock = createChoirClock(0.03125);
  clock.position(12000, 0, true, 'snapshot');
  expect(clock.position(11999, 0.04, false, 'snapshot')).toBeNull();
});

it('refuses an invalid initial playback clock before any accompaniment can be scheduled', () => {
  for (const at of [-0.1, NaN, Infinity])
    expect(createChoirClock(0.03125).position(12000, at, true, 'snapshot')).toBeNull();
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STARTER_DRAFT } from './voice-leading-workbench.mjs';
import { workbenchPlaybackTimeline, createWorkbenchPlayer } from './voice-leading/playback.ts';
import { formatPitch } from '../packages/theory/src/index.ts';

const sample = () => structuredClone(STARTER_DRAFT);
test('all voices and solo use the same score and a quarter-note tempo', () => {
  const draft = sample();
  const all = workbenchPlaybackTimeline(draft, 120, 'all');
  assert.equal(all.tones.length, 15);
  assert.equal(all.durationSeconds, 4);
  const expected = {
    soprano: ['E4', 'F4', 'B3', 'A3'],
    alto: ['C4', 'F3', 'E3'],
    tenor: ['G3', 'A3', 'D3', 'E3'],
    bass: ['C3', 'D3', 'G2', 'C3'],
  };
  for (const [voice, pitches] of Object.entries(expected)) {
    const solo = workbenchPlaybackTimeline(draft, 120, voice);
    assert.deepEqual(
      solo.tones.map((tone) => formatPitch(tone.pitch)),
      pitches,
    );
    assert.equal(solo.durationSeconds, all.durationSeconds);
  }
  assert.deepEqual(
    workbenchPlaybackTimeline(draft, 60, 'soprano').tones.map((tone) => tone.onsetSeconds),
    [0, 2, 4, 6],
  );
  assert.equal(workbenchPlaybackTimeline(draft, 60, 'all').durationSeconds, 8);
});

test('ties stay one sounding tone, rests stay silent, and trailing silence keeps its length', () => {
  const draft = sample();
  draft.settings = '{"rules":{}}';
  draft.parts.soprano = 'C4/1~ | C4/2 r/2';
  const solo = workbenchPlaybackTimeline(draft, 120, 'soprano');
  assert.equal(solo.tones.length, 1);
  assert.equal(solo.tones[0].durationSeconds, 3);
  assert.equal(solo.durationSeconds, 4);
  draft.parts.soprano = 'r/1 | r/1';
  const silent = workbenchPlaybackTimeline(draft, 120, 'soprano');
  assert.equal(silent.tones.length, 0);
  assert.equal(silent.durationSeconds, 4);
});

test('compound meter, dotted notes and tuplets retain their written duration', () => {
  const draft = sample();
  draft.settings = '{"rules":{}}';
  draft.meter = '6/8';
  draft.parts = {
    soprano: 'C4/8{3:2} D4/8{3:2} E4/8{3:2} F4/2',
    alto: 'C4/2.',
    tenor: 'G3/2.',
    bass: 'C3/2.',
  };
  const solo = workbenchPlaybackTimeline(draft, 120, 'soprano');
  assert.equal(solo.durationSeconds, 1.5);
  assert.deepEqual(
    solo.tones.map((tone) => tone.onsetSeconds),
    [0, 1 / 6, 1 / 3, 0.5],
  );
  assert.equal(solo.tones[3].durationSeconds, 1);
});

test('invalid tempos, unknown voices and unequal parts cannot be played', () => {
  for (const bpm of [0, 39, 201, 100.5, NaN, Infinity])
    assert.throws(() => workbenchPlaybackTimeline(sample(), bpm, 'all'));
  assert.throws(() => workbenchPlaybackTimeline(sample(), 120, 'invented'));
  const draft = sample();
  draft.parts.soprano = 'C4/4 | C4/1';
  assert.throws(() => workbenchPlaybackTimeline(draft, 120, 'soprano'));
});

function harness() {
  const states = [],
    tones = [],
    callbacks = new Set();
  const context = { currentTime: 10, state: 'suspended' };
  let created = 0,
    stops = 0;
  const engine = {
    context,
    resume: async () => {
      context.state = 'running';
    },
    playPitch: (pitch, options) => {
      tones.push({ pitch, ...options });
    },
    stopAll: () => {
      stops += 1;
    },
  };
  const timers = {
    setInterval: (callback) => {
      callbacks.add(callback);
      return callback;
    },
    clearInterval: (callback) => {
      callbacks.delete(callback);
    },
  };
  const player = createWorkbenchPlayer(
    () => {
      created += 1;
      return engine;
    },
    timers,
    (state) => states.push(state),
  );
  return {
    player,
    engine,
    context,
    states,
    tones,
    callbacks,
    created: () => created,
    stops: () => stops,
    tick: () => {
      for (const callback of [...callbacks]) callback();
    },
  };
}

test('audio opens only on play; scheduling preserves onsets and completion follows the audio clock', async () => {
  const h = harness(),
    timeline = workbenchPlaybackTimeline(sample(), 120, 'alto');
  assert.equal(h.created(), 0);
  await h.player.start(timeline);
  assert.deepEqual(
    h.tones.map(({ when, duration }) => [when, duration]),
    [
      [10.05, 2],
      [12.05, 1],
      [13.05, 1],
    ],
  );
  assert.equal(h.callbacks.size, 1);
  h.context.currentTime = 12.05;
  h.tick();
  assert.equal(h.states.at(-1).elapsed, 2);
  h.context.currentTime = 14.08;
  h.tick();
  assert.equal(h.states.at(-1).status, 'ended');
  assert.equal(h.callbacks.size, 0);
  assert.equal(h.stops(), 1);
});

test('stop during pending audio resume prevents every delayed note and can restart', async () => {
  const h = harness(),
    timeline = workbenchPlaybackTimeline(sample(), 120, 'all');
  let finish;
  h.engine.resume = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const pending = h.player.start(timeline);
  assert.equal(h.states.at(-1).status, 'starting');
  h.player.stop();
  h.context.state = 'running';
  finish();
  await pending;
  assert.equal(h.tones.length, 0);
  assert.equal(h.callbacks.size, 0);
  assert.equal(h.states.at(-1).status, 'stopped');
  h.engine.resume = async () => {};
  await h.player.start(timeline);
  assert.equal(h.tones.length, 15);
  h.player.stop();
  assert.equal(h.callbacks.size, 0);
});

test('a newer play wins over an old resume, and audio suspension stops the current playback', async () => {
  const h = harness(),
    timeline = workbenchPlaybackTimeline(sample(), 120, 'soprano');
  let finish;
  h.engine.resume = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const old = h.player.start(timeline);
  h.engine.resume = async () => {
    h.context.state = 'running';
  };
  await h.player.start(timeline);
  finish();
  await old;
  assert.equal(h.tones.length, 4);
  assert.equal(h.callbacks.size, 1);
  h.context.state = 'suspended';
  h.tick();
  assert.equal(h.states.at(-1).status, 'stopped');
  assert.equal(h.callbacks.size, 0);
});

test('audio initialization and partial scheduling failures leave no running timers and allow retry', async () => {
  const h = harness(),
    timeline = workbenchPlaybackTimeline(sample(), 120, 'all');
  h.engine.resume = async () => {
    throw new Error('Audio unavailable');
  };
  await h.player.start(timeline);
  assert.equal(h.states.at(-1).status, 'error');
  assert.equal(h.tones.length, 0);
  assert.equal(h.callbacks.size, 0);
  h.engine.resume = async () => {
    h.context.state = 'running';
  };
  const playPitch = h.engine.playPitch;
  h.engine.playPitch = (...args) => {
    if (h.tones.length === 1) throw new Error('Disconnected output');
    playPitch(...args);
  };
  await h.player.start(timeline);
  assert.equal(h.states.at(-1).status, 'error');
  assert.equal(h.callbacks.size, 0);
  assert.ok(h.stops() >= 3);
  h.engine.playPitch = playPitch;
  await h.player.start(timeline);
  assert.equal(h.states.at(-1).status, 'playing');
  h.player.dispose();
  assert.equal(h.callbacks.size, 0);
});

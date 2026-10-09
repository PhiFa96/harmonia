import type { AudioEngine, PlayOptions } from '@harmonia/audio';
import { parseScore, singleStaffScore, note, rest, chord } from '@harmonia/notation';
import { playExample } from '@/exercises/play-example';

type Pitch = Parameters<AudioEngine['playPitch']>[0];
function parsePitch(source: string): Pitch {
  const event = parseScore(`treble | 4/4 | ${source}/1`).staves[0]?.measures[0]?.voices[0]
    ?.events[0];
  if (event?.kind !== 'note') throw new Error('Testnote fehlt');
  return event.pitch;
}
function formatPitch(pitch: Pitch) {
  return `${pitch.letter}${String(pitch.octave)}`;
}
const whole = { value: 'whole', dots: 0 } as const;
const half = { value: 'half', dots: 0 } as const;

function setup() {
  const voices: { stop: jest.Mock }[] = [];
  const playPitch = jest.fn((_pitch: unknown, options: PlayOptions = {}) => {
    const voice = {
      startTime: options.when ?? 10,
      endTime: (options.when ?? 10) + (options.duration ?? 1) + 0.1,
      stop: jest.fn(),
    };
    voices.push(voice);
    return voice;
  });
  const stopAll = jest.fn();
  return {
    engine: { context: { currentTime: 10 }, playPitch, stopAll } as unknown as AudioEngine,
    playPitch,
    voices,
    stopAll,
  };
}
describe('Vollständige Klangbeispiele', () => {
  it('plant alle acht Töne über zwei Takte auf der Audio-Uhr', () => {
    const value = setup();
    const playback = playExample(
      value.engine,
      parseScore('treble | 4/4 | C4/4 D4/4 E4/4 F4/4 | G4/4 A4/4 B4/4 C5/4'),
      120,
    );
    expect(
      value.playPitch.mock.calls.map(([pitch]) =>
        formatPitch(pitch as ReturnType<typeof parsePitch>),
      ),
    ).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']);
    value.playPitch.mock.calls.forEach(([, options], index) => {
      expect(options?.when).toBeCloseTo(10.05 + index * 0.5);
      expect(options?.duration).toBe(0.5);
    });
    expect(playback.startTime).toBe(10.05);
    expect(playback.endTime).toBeCloseTo(14.15);
  });
  it('bewahrt führende und folgende Pausen statt sie als Töne zu spielen', () => {
    const value = setup();
    const result = playExample(value.engine, parseScore('bass | 4/4 | r/4 C3/4 r/2'), 120);
    expect(value.playPitch).toHaveBeenCalledTimes(1);
    expect(value.playPitch).toHaveBeenCalledWith(parsePitch('C3'), { when: 10.55, duration: 0.5 });
    expect(result.endTime).toBeCloseTo(12.05);
  });
  it('bindet eine Note über den Taktstrich ohne erneuten Anschlag', () => {
    const value = setup();
    playExample(value.engine, parseScore('treble | 4/4 | G4/1~ | G4/1'), 120);
    expect(value.playPitch).toHaveBeenCalledTimes(1);
    expect(value.playPitch).toHaveBeenCalledWith(parsePitch('G4'), { when: 10.05, duration: 4 });
  });
  it('bindet einzelne Akkordtöne und bewahrt den gleichzeitigen Klang', () => {
    const value = setup();
    playExample(value.engine, parseScore('treble | 4/4 | (C4~ E4)/2 (C4 G4)/2'), 120);
    expect(
      value.playPitch.mock.calls.map(([pitch, options]) => [
        formatPitch(pitch as ReturnType<typeof parsePitch>),
        options?.when,
        options?.duration,
      ]),
    ).toEqual([
      ['C4', 10.05, 2],
      ['E4', 10.05, 1],
      ['G4', 11.05, 1],
    ]);
  });
  it('hält mehrere Systeme und Stimmen gleichzeitig; ein Auftakt verschiebt den Folgetakt', () => {
    const value = setup();
    const upper = parseScore('treble | 4/4 | G4/4 | C5/1');
    const lower = parseScore('bass | 4/4 | C3/4 | E3/1');
    playExample(value.engine, { staves: [...upper.staves, ...lower.staves] }, 120);
    expect(value.playPitch.mock.calls.map(([, options]) => options?.when)).toEqual([
      10.05, 10.05, 10.55, 10.55,
    ]);
    const next = setup();
    const score = singleStaffScore([[note(parsePitch('G4'), whole)]]);
    const staff = score.staves[0];
    if (!staff) throw new Error('System fehlt');
    playExample(
      next.engine,
      {
        staves: [
          {
            ...staff,
            measures: [
              {
                voices: [
                  { events: [note(parsePitch('G4'), whole)] },
                  {
                    events: [
                      rest(half),
                      chord(
                        [
                          { pitch: parsePitch('C4'), tie: false },
                          { pitch: parsePitch('E4'), tie: false },
                        ],
                        half,
                      ),
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      120,
    );
    expect(next.playPitch.mock.calls.map(([, options]) => options?.when)).toEqual([
      10.05, 11.05, 11.05,
    ]);
  });
  it('stoppt nur eigene Stimmen und bleibt beim zweiten Stoppen idempotent', () => {
    const value = setup();
    value.engine.playPitch(parsePitch('A4'));
    const playback = playExample(value.engine, parseScore('treble | 4/4 | C4/2 D4/2'), 120);
    playback.stop();
    playback.stop();
    expect(value.voices[0]?.stop).not.toHaveBeenCalled();
    for (const voice of value.voices.slice(1)) expect(voice.stop).toHaveBeenCalledTimes(1);
    expect(value.stopAll).not.toHaveBeenCalled();
  });
  it('stoppt bereits geplante Stimmen nach einem Teilfehler', () => {
    const value = setup();
    const original = value.playPitch.getMockImplementation();
    if (!original) throw new Error('Mock fehlt');
    value.playPitch.mockImplementationOnce(original).mockImplementationOnce(() => {
      throw new Error('Planung fehlgeschlagen');
    });
    expect(() => playExample(value.engine, parseScore('treble | 4/4 | C4/2 E4/2'))).toThrow(
      'Planung fehlgeschlagen',
    );
    expect(value.voices[0]?.stop).toHaveBeenCalledTimes(1);
    expect(value.stopAll).not.toHaveBeenCalled();
  });
  it('plant reine Pausen vollständig, ungültige Partituren und Tempi gar nicht', () => {
    const value = setup();
    const result = playExample(value.engine, parseScore('treble | 4/4 | r/1'), 120);
    expect(result.endTime).toBeCloseTo(12.05);
    expect(() => playExample(value.engine, parseScore('treble | 4/4 | C4/1~'))).toThrow();
    expect(() => playExample(value.engine, parseScore('treble | 4/4 | C4/1'), 0)).toThrow();
    expect(() => playExample(value.engine, parseScore('treble | 4/4 | C4/1'), NaN)).toThrow();
    expect(value.playPitch).not.toHaveBeenCalled();
  });
});

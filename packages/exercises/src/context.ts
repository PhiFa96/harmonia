// Quellenbezogene Fragen für Stufe 2. Antworten werden aus Noten, Brüchen und Quelldaten abgeleitet.
import type { Key, Pitch, Rng, Mode } from '@harmonia/theory';
import {
  addFractions,
  buildScale,
  chord,
  chordPitches,
  diatonicTriads,
  duration,
  durationValue,
  equals,
  formatInterval,
  formatNoteName,
  formatPitch,
  fraction,
  identifyChord,
  intervalBetween,
  invert,
  keyFifths,
  keyFromFifths,
  midi,
  multiplyFractions,
  parseInterval,
  parsePitch,
  relativeKey,
  simplify,
  transposeBy,
  ZERO,
} from '@harmonia/theory';
import type { Score } from '@harmonia/notation';
import {
  eventPitches,
  note,
  parseScore,
  rest,
  scoreTimeline,
  singleStaffScore,
  validateScore,
} from '@harmonia/notation';
import { options, pitchPool } from './parameters.ts';

export const CONTEXT_TOPICS = [
  'accidental-scope',
  'enharmonic-spelling',
  'dotted-duration',
  'tied-duration',
  'crossbar-duration',
  'syncopation',
  'triplet-duration',
  'interval-inversion',
  'interval-reduction',
  'scale-pattern',
  'scale-degree',
  'fifth-neighbour',
  'relative-key',
  'chord-member',
  'chord-root',
  'diatonic-triad',
  'period-context',
  'jazz-source',
  'jazz-roots',
  'popular-source',
  'source-comparison',
] as const;
export type ContextTopic = (typeof CONTEXT_TOPICS)[number];
export interface ContextParams {
  readonly topics: readonly ContextTopic[];
  readonly years?: readonly number[];
  readonly modes?: readonly Mode[];
  readonly rootPosition?: boolean;
}
export type ContextSource =
  | {
      readonly kind: 'score';
      readonly score: Score;
      readonly target?: number;
      readonly role?: 'root' | 'third' | 'fifth';
      readonly focus?: Pitch;
    }
  | {
      readonly kind: 'key';
      readonly key: Key;
      readonly direction?: 1 | -1;
      readonly degree?: number;
    }
  | {
      readonly kind: 'document';
      readonly year: number;
      readonly feature:
        'monophony' | 'imitation' | 'continuo' | 'phrases' | 'chromaticism' | 'electronics';
      readonly socialContext?: 'neighbourhood' | 'migration' | 'recording-business';
      readonly medium: 'recording' | 'programme' | 'report' | 'broadcast' | 'stream';
      readonly secondYear?: number;
      readonly relation?: 'same-event' | 'work-recording' | 'advertised-performed';
    };
export interface ContextItem {
  readonly type: 'CONTEXT_CHOICE';
  readonly topic: ContextTopic;
  readonly source: ContextSource;
  readonly choices: readonly string[];
}
const simpleIntervals = [
  'P1',
  'm2',
  'M2',
  'm3',
  'M3',
  'P4',
  'A4',
  'd5',
  'P5',
  'm6',
  'M6',
  'm7',
  'M7',
  'P8',
];
function required<T>(v: T | undefined): T {
  if (v === undefined) throw new RangeError('Kontextquelle fehlt');
  return v;
}
function sourceScore(item: ContextItem) {
  if (
    item.source.kind !== 'score' ||
    item.source.score.staves.length !== 1 ||
    validateScore(item.source.score).length
  )
    throw new RangeError('Gültige einstimmige Kontextquelle erwartet');
  if (item.source.score.staves[0]?.measures.some((m) => m.voices.length !== 1 || m.changes))
    throw new RangeError('Unzulässige Stimmen oder Wechsel');
  return item.source.score;
}
function sourceEvents(item: ContextItem) {
  return sourceScore(item).staves.flatMap((s) =>
    s.measures.flatMap((m) => required(m.voices[0]).events),
  );
}
function sourcePitches(item: ContextItem) {
  return sourceEvents(item).flatMap(eventPitches);
}
function written(p: Pitch) {
  return `pitch:${formatPitch(p)}`;
}
function quarters(d: ReturnType<typeof durationValue>) {
  const f = multiplyFractions(d, fraction(4));
  return `quarters:${String(f.num)}/${String(f.den)}`;
}
export function contextAnswer(item: ContextItem): string {
  if (!CONTEXT_TOPICS.includes(item.topic)) throw new RangeError('Unbekannte Kontextfrage');
  const source = item.source;
  switch (item.topic) {
    case 'accidental-scope': {
      if (source.kind !== 'score' || !Number.isInteger(source.target))
        throw new RangeError('Zielposition fehlt');
      const event = required(sourceEvents(item)[source.target ?? -1]);
      if (event.kind !== 'note') throw new RangeError('Einzelton erwartet');
      return written(event.pitch);
    }
    case 'enharmonic-spelling': {
      const p = required(sourcePitches(item)[0]);
      const matches = item.choices.filter(
        (id) =>
          id.startsWith('pitch:') &&
          midi(parsePitch(id.slice(6))) === midi(p) &&
          !equals(parsePitch(id.slice(6)), p),
      );
      if (matches.length !== 1)
        throw new RangeError('Genau eine enharmonische Antwort erforderlich');
      return required(matches[0]);
    }
    case 'dotted-duration':
      return quarters(durationValue(required(sourceEvents(item)[0]).duration));
    case 'triplet-duration': {
      const events = sourceEvents(item).slice(0, 3);
      if (
        events.length !== 3 ||
        events.some(
          (e) =>
            e.duration.value !== 'eighth' ||
            e.duration.dots !== 0 ||
            e.duration.tuplet?.actual !== 3 ||
            e.duration.tuplet.normal !== 2,
        )
      )
        throw new RangeError('Drei Achtel einer 3:2-Triole erwartet');
      return quarters(events.reduce((n, e) => addFractions(n, durationValue(e.duration)), ZERO));
    }
    case 'tied-duration':
    case 'crossbar-duration': {
      const events = sourceEvents(item),
        start = events.findIndex((e) => e.kind === 'note');
      let total = ZERO;
      for (let i = start; i < events.length; i++) {
        const e = required(events[i]);
        if (e.kind !== 'note') throw new RangeError('Bindungskette enthält eine Pause');
        total = addFractions(total, durationValue(e.duration));
        if (!e.tie) return quarters(total);
      }
      throw new RangeError('Unvollständige Bindungskette');
    }
    case 'syncopation': {
      const tones = scoreTimeline(sourceScore(item), { bpm: 60 }).tones;
      return tones.some(
        (t) =>
          t.onsetSeconds % 1 !== 0 &&
          t.onsetSeconds + t.durationSeconds > Math.floor(t.onsetSeconds) + 1 + 1e-9,
      )
        ? 'boolean:yes'
        : 'boolean:no';
    }
    case 'interval-inversion': {
      const p = sourcePitches(item);
      if (p.length !== 2) throw new RangeError('Zwei Intervalltöne erwartet');
      return `interval:${formatInterval(invert(intervalBetween(required(p[0]), required(p[1]))))}`;
    }
    case 'interval-reduction': {
      const p = sourcePitches(item);
      if (p.length !== 2) throw new RangeError('Zwei Intervalltöne erwartet');
      const i = intervalBetween(required(p[0]), required(p[1]));
      return `interval:${formatInterval(simplify(i))}`;
    }
    case 'scale-pattern': {
      const p = sourcePitches(item);
      if (p.length !== 8) throw new RangeError('Acht Tonleitertöne erwartet');
      return `pattern:${p
        .slice(1)
        .map((v, i) => midi(v) - midi(required(p[i])))
        .join(',')}`;
    }
    case 'scale-degree': {
      if (source.kind !== 'score' || !source.focus) throw new RangeError('Bezugston fehlt');
      const p = sourcePitches(item).slice(0, 7),
        indices = p.flatMap((v, i) => (equals(v, required(source.focus)) ? [i + 1] : []));
      if (indices.length !== 1) throw new RangeError('Tonleiterstufe nicht eindeutig');
      return `degree:${String(required(indices[0]))}`;
    }
    case 'fifth-neighbour':
    case 'relative-key': {
      if (source.kind !== 'key') throw new RangeError('Tonartquelle fehlt');
      if (item.topic === 'fifth-neighbour' && source.direction !== 1 && source.direction !== -1)
        throw new RangeError('Quintenrichtung fehlt');
      const k =
        item.topic === 'relative-key'
          ? relativeKey(source.key)
          : keyFromFifths(keyFifths(source.key) + (source.direction ?? 0), source.key.mode);
      return `key:${k.mode}:${formatNoteName(k.tonic)}`;
    }
    case 'chord-member':
    case 'chord-root': {
      const pitches = sourcePitches(item),
        matches = identifyChord(pitches).filter((m) => !m.omitted.length);
      const value = required(matches[0]).chord;
      if (matches.length !== 1 || source.kind !== 'score')
        throw new RangeError('Eindeutiger Dreiklang erwartet');
      if (item.topic === 'chord-root') return `note:${formatNoteName(value.root)}`;
      const role = source.role;
      if (!role) throw new RangeError('Akkordtonrolle fehlt');
      const factor = role === 'root' ? 0 : role === 'third' ? 1 : 2;
      const name = required(chordPitches(chord(value.root, value.type, 0))[factor]);
      return `note:${formatNoteName(name)}`;
    }
    case 'diatonic-triad': {
      if (
        source.kind !== 'key' ||
        !Number.isInteger(source.degree) ||
        (source.degree ?? 0) < 1 ||
        (source.degree ?? 0) > 7
      )
        throw new RangeError('Tonart und Stufe 1–7 erwartet');
      const c = required(diatonicTriads(source.key)[(source.degree ?? 1) - 1]);
      return `triad:${c.quality}`;
    }
    case 'period-context': {
      if (
        source.kind !== 'document' ||
        !Number.isInteger(source.year) ||
        source.year < 1000 ||
        source.year > 2026
      )
        throw new RangeError('Datiertes Lehrdossier erwartet');
      // Bewusst grobe europäische Orientierung; Aufgabenjahre liegen fern von Übergangsgrenzen.
      const period =
        source.year < 1400
          ? 'medieval'
          : source.year < 1600
            ? 'renaissance'
            : source.year < 1750
              ? 'baroque'
              : source.year < 1820
                ? 'classical'
                : source.year < 1900
                  ? 'romantic'
                  : 'since1900';
      return `period:${period}`;
    }
    case 'jazz-roots': {
      if (source.kind !== 'document' || !source.socialContext)
        throw new RangeError('Sozialer Quellenkontext fehlt');
      return `social:${source.socialContext}`;
    }
    case 'jazz-source':
    case 'popular-source': {
      if (source.kind !== 'document') throw new RangeError('Musikquelle erwartet');
      const kind =
        source.medium === 'recording'
          ? 'recorded-performance'
          : source.medium === 'programme'
            ? 'advertised-event'
            : source.medium === 'report'
              ? 'reported-view'
              : 'mediated-distribution';
      return `evidence:${kind}`;
    }
    case 'source-comparison': {
      if (source.kind !== 'document' || !Number.isInteger(source.secondYear) || !source.relation)
        throw new RangeError('Zwei datierte Quellen erwartet');
      return `comparison:${source.relation === 'work-recording' ? 'different-date-roles' : source.relation === 'advertised-performed' ? 'intention-performance' : source.year !== source.secondYear ? 'unresolved-conflict' : 'agreement-not-proof'}`;
    }
  }
}
export function contextVariantKey(item: ContextItem) {
  contextAnswer(item);
  const s = item.source;
  const shown =
    s.kind !== 'document'
      ? s
      : item.topic === 'period-context'
        ? { year: s.year, feature: s.feature }
        : item.topic === 'jazz-roots'
          ? { year: s.year, socialContext: s.socialContext }
          : item.topic === 'source-comparison'
            ? { year: s.year, secondYear: s.secondYear, relation: s.relation }
            : { year: s.year, medium: s.medium };
  return JSON.stringify([item.topic, shown]);
}
export function generateContext(params: ContextParams, rng: Rng): ContextItem {
  if (
    params.modes &&
    (!params.modes.length ||
      params.modes.some((m) => !['major', 'minor'].includes(m)) ||
      params.topics.some((t) => !['fifth-neighbour', 'relative-key', 'diatonic-triad'].includes(t)))
  )
    throw new RangeError('Modi gelten nur für Tonartkontexte');
  if (
    params.rootPosition !== undefined &&
    (typeof params.rootPosition !== 'boolean' || params.topics.some((t) => t !== 'chord-member'))
  )
    throw new RangeError('Grundstellung gilt nur für Akkordtonrollen');
  if (
    params.years &&
    (params.years.length < 2 ||
      params.topics.some((t) => t !== 'period-context') ||
      params.years.some((n) => ![1250, 1550, 1720, 1780, 1850, 1950].includes(n)))
  )
    throw new RangeError('Jahresauswahl gilt nur für die sechs Perioden-Lehrdossiers');
  if (!params.topics.length || params.topics.some((t) => !CONTEXT_TOPICS.includes(t)))
    throw new RangeError('Ungültige Kontextparameter');
  const topic = rng.pick(params.topics);
  let source: ContextSource, available: string[];
  const p = () => parsePitch(rng.pick(['C4', 'D4', 'E4', 'F4', 'G4', 'A4']));
  const fractionChoices = ['1/2', '1/1', '3/2', '2/1', '5/2', '3/1', '4/1'].map(
    (n) => `quarters:${n}`,
  );
  if (topic === 'accidental-scope') {
    const pitch = { ...p(), alter: rng.pick([-1, 1]) },
      mode = rng.pick(['same', 'reset', 'cancel', 'octave']);
    const target =
      mode === 'same' ? pitch : { ...pitch, alter: 0, ...(mode === 'octave' ? { octave: 5 } : {}) };
    const score =
      mode === 'reset'
        ? singleStaffScore([[note(pitch, duration('whole'))], [note(target, duration('whole'))]])
        : singleStaffScore([[note(pitch, duration('half')), note(target, duration('half'))]]);
    source = { kind: 'score', score, target: 1 };
    available = [-1, 0, 1].map((alter) => written({ ...target, alter }));
  } else if (topic === 'enharmonic-spelling') {
    const pitch = parsePitch(
      rng.pick(['C#4', 'D#4', 'F#4', 'G#4', 'A#4', 'Bb4', 'Db4', 'E#4', 'B#3']),
    );
    const pool = pitchPool({ minMidi: 59, maxMidi: 74 }, 1),
      equivalent = rng.pick(pool.filter((v) => midi(v) === midi(pitch) && !equals(v, pitch)));
    source = { kind: 'score', score: singleStaffScore([[note(pitch, duration('whole'))]]) };
    available = options(
      written(equivalent),
      pool.filter((v) => midi(v) !== midi(pitch)).map(written),
      rng,
    );
  } else if (topic === 'dotted-duration') {
    const choice = rng.pick(['eighth', 'quarter', 'half'] as const),
      value = duration(choice, 1),
      filler =
        choice === 'half'
          ? [rest(duration('quarter'))]
          : choice === 'quarter'
            ? [rest(duration('quarter')), rest(duration('quarter', 1))]
            : [rest(duration('sixteenth')), rest(duration('half', 1))];
    source = { kind: 'score', score: singleStaffScore([[note(p(), value), ...filler]]) };
    available = fractionChoices;
  } else if (topic === 'tied-duration' || topic === 'crossbar-duration') {
    const name = formatPitch(p());
    source = {
      kind: 'score',
      score: parseScore(
        rng.pick(
          topic === 'crossbar-duration'
            ? [
                `treble | 4/4 | r/2 r/4 ${name}/4~ | ${name}/4 r/2 r/4`,
                `treble | 4/4 | r/2 r/4 ${name}/4~ | ${name}/2 r/2`,
                `treble | 4/4 | r/2 r/4 ${name}/4~ | ${name}/2. r/4`,
              ]
            : [
                `treble | 4/4 | ${name}/4~ ${name}/4 r/2`,
                `treble | 4/4 | ${name}/8~ ${name}/4 r/4 r/4.`,
                `treble | 4/4 | r/2 r/4 ${name}/4~ | ${name}/2 r/2`,
              ],
        ),
      ),
    };
    available = fractionChoices;
  } else if (topic === 'syncopation') {
    source = {
      kind: 'score',
      score: parseScore(
        rng.pick([
          'treble | 4/4 | r/8 C4/8~ C4/4 C4/2',
          'treble | 4/4 | C4/4 C4/4 C4/2',
          'treble | 4/4 | C4/8 C4/8 C4/4 C4/2',
        ]),
      ),
    };
    available = ['boolean:yes', 'boolean:no'];
  } else if (topic === 'triplet-duration') {
    const pitch = p();
    source = {
      kind: 'score',
      score: singleStaffScore([
        [
          ...Array.from({ length: 3 }, () =>
            note(pitch, duration('eighth', 0, { actual: 3, normal: 2 })),
          ),
          note(pitch, duration('half', 1)),
        ],
      ]),
    };
    available = fractionChoices;
  } else if (topic === 'interval-inversion' || topic === 'interval-reduction') {
    const start = parsePitch('C4'),
      i = parseInterval(
        rng.pick(
          topic === 'interval-inversion'
            ? simpleIntervals
            : ['M9', 'm9', 'M10', 'm10', 'P11', 'P12', 'M13', 'm13', 'M14', 'm14', 'P15'],
        ),
      );
    source = {
      kind: 'score',
      score: singleStaffScore([
        [note(start, duration('half')), note(transposeBy(start, i), duration('half'))],
      ]),
    };
    available = simpleIntervals.map((v) => `interval:${v}`);
  } else if (topic === 'scale-pattern' || topic === 'scale-degree') {
    const key = keyFromFifths(rng.int(-3, 3)),
      pitches = buildScale({ ...key.tonic, octave: 4 }, 'major', { includeOctave: true }),
      events = pitches.map((v) => note(v, duration('quarter')));
    source = {
      kind: 'score',
      score: singleStaffScore([events.slice(0, 4), events.slice(4)]),
      ...(topic === 'scale-degree' ? { focus: rng.pick(pitches.slice(0, 7)) } : {}),
    };
    available =
      topic === 'scale-degree'
        ? Array.from({ length: 7 }, (_, i) => `degree:${String(i + 1)}`)
        : ['2,2,1,2,2,2,1', '2,1,2,2,1,2,2', '2,2,2,1,2,2,1', '1,2,2,2,1,2,2'].map(
            (s) => `pattern:${s}`,
          );
  } else if (
    topic === 'fifth-neighbour' ||
    topic === 'relative-key' ||
    topic === 'diatonic-triad'
  ) {
    const key = keyFromFifths(
      rng.int(topic === 'fifth-neighbour' ? -2 : -3, topic === 'fifth-neighbour' ? 2 : 3),
      rng.pick(params.modes ?? ['major', 'minor']),
    );
    source = {
      kind: 'key',
      key,
      ...(topic === 'fifth-neighbour' ? { direction: rng.pick([1, -1] as const) } : {}),
      ...(topic === 'diatonic-triad' ? { degree: rng.int(1, 7) } : {}),
    };
    available =
      topic === 'diatonic-triad'
        ? ['major', 'minor', 'diminished', 'augmented'].map((t) => `triad:${t}`)
        : Array.from({ length: 7 }, (_, i) =>
            keyFromFifths(
              i - 3,
              topic === 'relative-key' ? (key.mode === 'major' ? 'minor' : 'major') : key.mode,
            ),
          ).map((k) => `key:${k.mode}:${formatNoteName(k.tonic)}`);
  } else if (topic === 'chord-member' || topic === 'chord-root') {
    const value = chord(
      p(),
      rng.pick(['major', 'minor', 'diminished', 'augmented']),
      topic === 'chord-member' && params.rootPosition ? 0 : rng.pick([0, 1, 2]),
    );
    const pitches = chordPitches(value, { octave: 4 });
    source = {
      kind: 'score',
      score: parseScore(`treble | 4/4 | (${pitches.map((p) => formatPitch(p)).join(' ')})/1`),
      ...(topic === 'chord-member' ? { role: rng.pick(['root', 'third', 'fifth'] as const) } : {}),
    };
    available = pitches.map((v) => `note:${formatNoteName(v)}`);
  } else {
    const year = rng.pick(
        topic === 'period-context'
          ? (params.years ?? [1250, 1550, 1720, 1780, 1850, 1950])
          : [1917, 1923, 1936, 1965, 1980, 2018],
      ),
      features = [
        'monophony',
        'imitation',
        'continuo',
        'phrases',
        'chromaticism',
        'electronics',
      ] as const;
    source = {
      kind: 'document',
      year,
      feature: required(features[Math.max(0, [1250, 1550, 1720, 1780, 1850, 1950].indexOf(year))]),
      ...(topic === 'jazz-roots'
        ? { socialContext: rng.pick(['neighbourhood', 'migration', 'recording-business'] as const) }
        : {}),
      medium: rng.pick(
        topic === 'period-context'
          ? (['report'] as const)
          : topic === 'jazz-source' || year < 1920
            ? (['recording', 'programme', 'report'] as const)
            : year < 2000
              ? (['recording', 'programme', 'report', 'broadcast'] as const)
              : (['recording', 'programme', 'report', 'broadcast', 'stream'] as const),
      ),
      ...(topic === 'source-comparison'
        ? {
            secondYear: year + rng.pick([0, 1, Math.min(100, 2026 - year)]),
            relation: rng.pick(['same-event', 'work-recording', 'advertised-performed'] as const),
          }
        : {}),
    };
    available =
      topic === 'period-context'
        ? ['medieval', 'renaissance', 'baroque', 'classical', 'romantic', 'since1900'].map(
            (s) => `period:${s}`,
          )
        : topic === 'jazz-roots'
          ? ['neighbourhood', 'migration', 'recording-business'].map((s) => `social:${s}`)
          : topic === 'source-comparison'
            ? [
                'different-date-roles',
                'intention-performance',
                'unresolved-conflict',
                'agreement-not-proof',
              ].map((s) => `comparison:${s}`)
            : [
                'recorded-performance',
                'advertised-event',
                'reported-view',
                'mediated-distribution',
                'invented-origin',
                'universal-style',
              ].map((s) => `evidence:${s}`);
  }
  const item: ContextItem = { type: 'CONTEXT_CHOICE', topic, source, choices: available };
  const answer = contextAnswer(item);
  return { ...item, choices: options(answer, available, rng) };
}

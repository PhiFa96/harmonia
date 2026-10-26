import {
  chord as harmonyChord,
  formatFraction,
  formatPitch,
  parseNoteName,
} from '@harmonia/theory';
import { describe, expect, it } from 'vitest';
import { highlightMarks } from './highlight.ts';
import { layoutScore } from './layout.ts';
import { parseScore } from './shorthand.ts';
import {
  analyzeVoiceLeadingScore,
  voiceLeadingScoreTimeline,
  type SatbAssignment,
} from './voice-leading.ts';

const assignment: SatbAssignment = {
  soprano: { staff: 0, voice: 0 },
  alto: { staff: 0, voice: 1 },
  tenor: { staff: 1, voice: 0 },
  bass: { staff: 1, voice: 1 },
};

const parallelSource = 'treble | E4/2 F4/2 & C4/1\nbass | G3/2 A3/2 & C3/2 D3/2';

describe('P4.09 – Satzprüfung aus dem tatsächlichen Notenmodell', () => {
  it('binds augmented melodic findings to the written source and destination notes', () => {
    const score = parseScore('treble | C4/2 F#4/2 & G3/1\nbass | E3/1 & C3/1');
    const report = analyzeVoiceLeadingScore(score, assignment, {
      'augmented-melodic-interval': 'warning',
    });
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0]).toMatchObject({
      rule: 'augmented-melodic-interval',
      severity: 'warning',
      at: 1,
      voices: ['soprano'],
      position: { at: { num: 1, den: 2 }, measure: 0, offset: { num: 1, den: 2 } },
      notes: [{ voice: 'soprano', ref: { staff: 0, measure: 0, voice: 0, event: 1 } }],
      previous: {
        position: { at: { num: 0, den: 1 }, measure: 0, offset: { num: 0, den: 1 } },
        notes: [{ voice: 'soprano', ref: { staff: 0, measure: 0, voice: 0, event: 0 } }],
      },
    });
    const enharmonic = parseScore('treble | C4/2 Gb4/2 & G3/1\nbass | E3/1 & C3/1');
    expect(
      analyzeVoiceLeadingScore(enharmonic, assignment, {
        'augmented-melodic-interval': 'warning',
      }).findings,
    ).toEqual([]);
  });

  it('does not turn a tied repetition into an augmented motion or bridge a rest', () => {
    const tied = parseScore(
      'treble | C4/1~ & G3/1 | C4/2 F#4/2 & G3/1\nbass | E3/1 & C3/1 | E3/1 & C3/1',
    );
    const findings = analyzeVoiceLeadingScore(tied, assignment, {
      'augmented-melodic-interval': 'hint',
    }).findings;
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      position: { at: { num: 3, den: 2 }, measure: 1, offset: { num: 1, den: 2 } },
      notes: [{ ref: { measure: 1, event: 1 } }],
      previous: { notes: [{ ref: { measure: 1, event: 0 } }] },
    });
    const rest = parseScore('treble | C4/4 r/4 F#4/2 & G3/1\nbass | E3/1 & C3/1');
    expect(
      analyzeVoiceLeadingScore(rest, assignment, { 'augmented-melodic-interval': 'hint' }).findings,
    ).toEqual([]);
  });

  it('ordnet eine Quintparallele den richtigen Quell- und Zielnoten zu', () => {
    const score = parseScore(parallelSource);
    const before = JSON.stringify(score);
    const report = analyzeVoiceLeadingScore(score, assignment, { 'parallel-fifth': 'error' });
    expect(report.status).toBe('draft');
    expect(report.duration).toEqual({ num: 1, den: 1 });
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0]).toMatchObject({
      rule: 'parallel-fifth',
      at: 1,
      voices: ['bass', 'tenor'],
      position: { at: { num: 1, den: 2 }, measure: 0, offset: { num: 1, den: 2 } },
      notes: [
        { voice: 'bass', ref: { staff: 1, measure: 0, voice: 1, event: 1 } },
        { voice: 'tenor', ref: { staff: 1, measure: 0, voice: 0, event: 1 } },
      ],
      previous: {
        notes: [
          { voice: 'bass', ref: { staff: 1, measure: 0, voice: 1, event: 0 } },
          { voice: 'tenor', ref: { staff: 1, measure: 0, voice: 0, event: 0 } },
        ],
      },
    });
    const marks = highlightMarks(
      layoutScore(score),
      report.findings.flatMap((finding) =>
        finding.notes.map((tone) => ({ ref: tone.ref, kind: 'wrong' as const })),
      ),
    );
    expect(marks.map((mark) => [mark.ref.staff ?? 0, mark.ref.voice ?? 0, mark.ref.event])).toEqual(
      [
        [1, 0, 1],
        [1, 1, 1],
      ],
    );
    expect(JSON.stringify(score)).toBe(before);
    expect(analyzeVoiceLeadingScore(score, assignment, { 'parallel-fifth': 'error' })).toEqual(
      report,
    );
  });

  it('erhält lange Töne und erfindet aus versetzten Bewegungen keine Parallele', () => {
    const score = parseScore('treble | E4/1 & C4/1\nbass | G3/4 A3/2. & C3/2 D3/2');
    const report = analyzeVoiceLeadingScore(score, assignment, { 'parallel-fifth': 'error' });
    expect(report.frames.map((frame) => formatFraction(frame.position.at))).toEqual([
      '0',
      '1/4',
      '1/2',
    ]);
    expect(report.frames.map((frame) => frame.slice.bass && formatPitch(frame.slice.bass))).toEqual(
      ['C3', 'C3', 'D3'],
    );
    expect(report.frames[1]?.notes.bass.ref.event).toBe(0);
    expect(report.findings).toEqual([]);
  });

  it('behält Triolen und Punktierungen als exakte Brüche', () => {
    const score = parseScore(
      'treble | E4/8{3:2} F4/8{3:2} G4/8{3:2} A4/4 B4/2 & C4/4. D4/8 C4/2\nbass | G3/1 & C3/1',
    );
    const timeline = voiceLeadingScoreTimeline(score, assignment);
    expect(timeline.frames.map((frame) => formatFraction(frame.position.at))).toEqual([
      '0',
      '1/12',
      '1/6',
      '1/4',
      '3/8',
      '1/2',
    ]);
    expect(formatFraction(timeline.duration)).toBe('1');
  });

  it('verfolgt Haltebögen über Taktgrenzen und bewahrt den aktuellen Notenbezug', () => {
    const score = parseScore(
      'treble | E4/1~ & C4/1 | E4/1 & C4/1\nbass | G3/2 A3/2 & C3/1~ | G3/1 & C3/1',
    );
    const timeline = voiceLeadingScoreTimeline(score, assignment);
    expect(timeline.frames.map((frame) => formatFraction(frame.position.at))).toEqual([
      '0',
      '1/2',
      '1',
    ]);
    expect(timeline.frames[2]?.notes.soprano).toMatchObject({
      ref: { staff: 0, measure: 1, voice: 0, event: 0 },
      origin: { staff: 0, measure: 0, voice: 0, event: 0 },
    });
    expect(timeline.frames[2]?.notes.bass.origin.measure).toBe(0);
    expect(formatFraction(timeline.duration)).toBe('2');
  });

  it('meldet dieselbe gebundene Stimmkreuzung bei fremden Anschlägen nur einmal', () => {
    const score = parseScore(
      'treble | C4/1~ & E4/1~ | C4/1 & E4/1\nbass | G3/2 A3/2 & C3/1 | G3/1 & C3/1',
    );
    const report = analyzeVoiceLeadingScore(score, assignment, { 'voice-crossing': 'error' });
    expect(report.frames).toHaveLength(3);
    expect(report.findings.map((finding) => [finding.rule, finding.at])).toEqual([
      ['voice-crossing', 0],
    ]);
    expect(report.findings[0]?.previous).toBeUndefined();
  });

  it('meldet eine neu angeschlagene Kreuzung erneut', () => {
    const score = parseScore(
      'treble | C4/1 & E4/1 | C4/1 & E4/1\nbass | G3/1 & C3/1 | G3/1 & C3/1',
    );
    expect(
      analyzeVoiceLeadingScore(score, assignment, { 'voice-crossing': 'error' }).findings.map(
        (finding) => finding.at,
      ),
    ).toEqual([0, 1]);
  });

  it('ordnet eine unerfüllte Leittonauflösung einer notierten Pause zu', () => {
    const score = parseScore('treble | B3/2 r/2 & F3/2 E3/2\nbass | D3/2 E3/2 & G2/2 C3/2');
    const report = analyzeVoiceLeadingScore(
      score,
      assignment,
      { 'leading-tone-resolution': 'warning', 'seventh-resolution': 'error' },
      {
        harmonies: [
          {
            tonic: parseNoteName('C'),
            chord: harmonyChord(parseNoteName('G'), 'dominant7'),
            resolveToNext: { leadingTone: 'up', seventh: 'down' },
          },
          { tonic: null, chord: null },
        ],
      },
    );
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0]).toMatchObject({
      rule: 'leading-tone-resolution',
      at: 1,
      notes: [{ voice: 'soprano', pitch: null, ref: { staff: 0, measure: 0, voice: 0, event: 1 } }],
      previous: { notes: [{ voice: 'soprano', ref: { event: 0 } }] },
    });
  });

  it('verwendet gleich lange Auftakte und aktualisiert Taktpositionen bei Taktwechsel', () => {
    const score = parseScore(
      'treble | E4/4 & C4/4 | 3/4 | F4/2. & C4/2.\nbass | G3/4 & C3/4 | 3/4 | A3/2. & D3/2.',
    );
    const timeline = voiceLeadingScoreTimeline(score, assignment);
    expect(timeline.frames.map((frame) => frame.position)).toEqual([
      { at: { num: 0, den: 1 }, measure: 0, offset: { num: 0, den: 1 } },
      { at: { num: 1, den: 4 }, measure: 1, offset: { num: 0, den: 1 } },
    ]);
    expect(formatFraction(timeline.duration)).toBe('1');
  });

  it('weist unterschiedlich lange Auftakte, fehlende Stimmen und Akkorde in einer SATB-Stimme zurück', () => {
    for (const source of [
      'treble | E4/2 & C4/4\nbass | G3/2 & C3/2',
      'treble | E4/1\nbass | G3/1 & C3/1',
      'treble | (C4 E4)/1 & C4/1\nbass | G3/1 & C3/1',
      'treble | E4/1~ & C4/1\nbass | G3/1 & C3/1',
      'treble | E4/1 & C4/1 | F4/1 & D4/1\nbass | G3/1 & C3/1',
    ])
      expect(() => voiceLeadingScoreTimeline(parseScore(source), assignment)).toThrow(RangeError);
  });

  it('verlangt vier verschiedene existierende Notationsstimmen', () => {
    const score = parseScore(parallelSource);
    for (const invalid of [
      { ...assignment, bass: assignment.tenor },
      { ...assignment, bass: { staff: 9, voice: 0 } },
      { ...assignment, bass: { staff: 1, voice: -1 } },
      { ...assignment, bass: { staff: 1, voice: 0.5 } },
    ])
      expect(() => voiceLeadingScoreTimeline(score, invalid)).toThrow(RangeError);
    expect(() => voiceLeadingScoreTimeline({ staves: [] }, assignment)).toThrow(RangeError);
  });

  it('leitet aus geschriebenen Funktionslabels keine harmonischen Prüfgrenzen ab', () => {
    const score = parseScore(
      'treble | B3/2@fn:D C4/2@fn:T & F3/2 E3/2\nbass | D3/2 E3/2 & G2/2 C3/2',
    );
    expect(() =>
      analyzeVoiceLeadingScore(score, assignment, { 'leading-tone-resolution': 'error' }),
    ).toThrow(RangeError);
    expect(analyzeVoiceLeadingScore(score, assignment, {}, {}).findings).toEqual([]);
  });
});

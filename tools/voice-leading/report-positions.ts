import { checkMeasure, formatFraction } from '../../packages/theory/src/index.ts';
import type {
  EventPosition,
  SatbAssignment,
  Score,
  VoiceLeadingScorePosition,
} from '../../packages/notation/src/index.ts';
import type { ReportMessages } from './messages.ts';

/** Display numbering only. Engine positions and note references stay zero based. */
export function createReportPositions(score: Score, assignment: SatbAssignment, m: ReportMessages) {
  const starts = score.staves.map((staff) => {
    const first = staff.measures[0];
    if (!first) throw new RangeError('Missing first measure');
    const time = first.changes?.timeSignature ?? staff.timeSignature;
    return first.voices.map((voice) =>
      checkMeasure(
        voice.events.map((event) => event.duration),
        time,
      ).status === 'incomplete'
        ? 0
        : 1,
    );
  });
  type Reference = Pick<EventPosition, 'staff' | 'voice' | 'measure'>;
  const number = (reference: Reference) => {
    // A later, unassigned voice may not have a track in the first measure.
    const staff = starts[reference.staff];
    const first = staff?.[reference.voice] ?? staff?.[0];
    if (first === undefined) throw new RangeError('Missing report voice');
    return reference.measure + first;
  };
  const measure = (reference: Reference) => {
    const value = number(reference);
    return `${m.measure} ${String(value)}${value === 0 ? ` (${m.pickup})` : ''}`;
  };
  return {
    number,
    measure,
    at: (position: VoiceLeadingScorePosition) =>
      `${measure({ ...assignment.bass, measure: position.measure })} · ${
        position.offset.num === 0 ? m.beginning : `${m.offset} ${formatFraction(position.offset)}`
      }`,
  };
}

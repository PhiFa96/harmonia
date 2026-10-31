import type {
  LocatedVoiceLeadingFinding,
  VoiceLeadingScoreTone,
} from '../../packages/notation/src/index.ts';
import type { Voice } from '../../packages/theory/src/index.ts';

export interface ReportFindingMember {
  readonly index: number;
  readonly finding: LocatedVoiceLeadingFinding;
}

/** Display groups retain every original finding and its original index. */
export function reportFindingGroups(findings: readonly LocatedVoiceLeadingFinding[]) {
  const groups = new Map<string, ReportFindingMember[]>();
  for (const [index, finding] of findings.entries()) {
    const position = finding.position,
      previous = finding.previous?.position;
    const key =
      finding.voices.length === 2
        ? JSON.stringify([
            finding.rule,
            finding.severity,
            finding.at,
            position.at,
            position.measure,
            position.offset,
            previous ?? null,
          ])
        : `single:${String(index)}`;
    const member = { index, finding },
      group = groups.get(key);
    if (group) group.push(member);
    else groups.set(key, [member]);
  }
  return [...groups.values()];
}

/** One row/marker per voice at the common source or destination. */
export function reportGroupNotes(members: readonly ReportFindingMember[], previous = false) {
  const notes = new Map<Voice, VoiceLeadingScoreTone>();
  for (const { finding } of members)
    for (const note of previous ? (finding.previous?.notes ?? []) : finding.notes)
      notes.set(note.voice, note);
  return (['bass', 'tenor', 'alto', 'soprano'] as const).flatMap((voice) => {
    const note = notes.get(voice);
    return note ? [note] : [];
  });
}

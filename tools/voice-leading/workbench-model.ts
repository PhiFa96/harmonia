import { z } from 'zod';
import { parseScore, formatScore, type Staff } from '../../packages/notation/src/index.ts';
import { parseReportInput, reportRulesSchema } from './report.ts';
import {
  VOICE_LEADING_RULE_PHASE,
  type VoiceLeadingRule,
  type VoiceLeadingSeverity,
} from '../../packages/theory/src/index.ts';

export const PARTS = ['soprano', 'alto', 'tenor', 'bass'] as const;
// Auch maximal lange, JSON-maskierte Feldwerte müssen wieder ladbar sein.
export const MAX_DRAFT_BYTES = 512_000;
const part = z.string().max(8_000);
const draftSchema = z.strictObject({
  format: z.literal('harmonia-satb-draft-v1'),
  title: z.string().max(200),
  meter: z.string().max(20),
  key: z.string().max(20),
  parts: z.strictObject({ soprano: part, alto: part, tenor: part, bass: part }),
  settings: z.string().max(30_000),
});
export type WorkbenchDraft = z.infer<typeof draftSchema>;
export const WORKBENCH_RULES = Object.keys(VOICE_LEADING_RULE_PHASE) as VoiceLeadingRule[];
const settingsSchema = z.strictObject({
  rules: reportRulesSchema,
  options: z.unknown().optional(),
});

/** Rule controls do not need valid notation or complete musical parameters. */
export function parseWorkbenchSettings(text: string) {
  const raw: unknown = JSON.parse(z.string().max(30_000).parse(text));
  return settingsSchema.parse(raw);
}

/** Change one explicit rule atomically; preserve all other settings and reject oversized output. */
export function setWorkbenchRule(
  text: string,
  rule: VoiceLeadingRule,
  severity: VoiceLeadingSeverity | null,
): string {
  const configuration = parseWorkbenchSettings(text);
  if (!Object.hasOwn(VOICE_LEADING_RULE_PHASE, rule)) throw new RangeError('Unknown rule');
  if (configuration.rules[rule] === (severity ?? undefined)) return text;
  const rules =
    severity === null
      ? Object.fromEntries(Object.entries(configuration.rules).filter(([key]) => key !== rule))
      : { ...configuration.rules, [rule]: severity };
  const updated = JSON.stringify({ ...configuration, rules }, null, 2);
  parseWorkbenchSettings(updated);
  return updated;
}

/** Unfertige Notation/JSON-Einstellungen bleiben als Entwurf speicherbar. */
export function parseWorkbenchDraft(raw: unknown): WorkbenchDraft {
  return draftSchema.parse(raw);
}

/** Vier getrennte, einstimmige Eingaben werden zu einem Klaviersystem verbunden. */
export function workbenchReportInput(raw: unknown) {
  const draft = parseWorkbenchDraft(raw);
  if (
    !/^\d+(?:\+\d+)*\/\d+$/u.test(draft.meter) ||
    !/^(?:[A-Ga-g](?:#{1,2}|b{1,2})?|0|[1-7][#b])$/u.test(draft.key)
  )
    throw new RangeError('Use one time signature and key signature for the whole example.');
  const tracks = PARTS.map((voice, index) => {
    const text = draft.parts[voice];
    if (/[\r\n&]/u.test(text))
      throw new RangeError(`${voice}: enter one voice, with | between measures.`);
    const clef = index < 2 ? 'treble' : 'bass';
    const parsed = parseScore(`${clef} | ${draft.meter} | key:${draft.key} | ${text}`);
    const staff = parsed.staves[0];
    if (
      staff?.clef !== clef ||
      staff.measures.length < 1 ||
      staff.measures.length > 32 ||
      staff.measures.some((measure) => measure.changes !== undefined || measure.voices.length !== 1)
    )
      throw new RangeError(`${voice}: use 1–32 measures without attribute changes.`);
    // Keine versteckten Angaben am Anfang der Stimme: ausschließlich Ereignisse pro Abschnitt.
    if (
      text
        .split('|')
        .some((segment) =>
          /^\s*(?:key:|treble\b|bass\b|alto\b|tenor\b|\d+\S*\/\d+\s*$)/u.test(segment),
        )
    )
      throw new RangeError(`${voice}: place key and meter in their separate fields.`);
    return staff;
  });
  const [soprano, alto, tenor, bass] = tracks;
  if (!soprano || !alto || !tenor || !bass) throw new RangeError('Four voices required');
  const combine = (upper: Staff, lower: Staff): Staff => {
    if (upper.measures.length !== lower.measures.length)
      throw new RangeError('All four voices need the same number of measures.');
    return {
      ...upper,
      measures: upper.measures.map((measure, index) => ({
        voices: [...measure.voices, ...(lower.measures[index]?.voices ?? [])],
      })),
    };
  };
  const settings: unknown = JSON.parse(draft.settings);
  const configuration = z
    .strictObject({ rules: z.unknown(), options: z.unknown().optional() })
    .parse(settings);
  const input = {
    title: draft.title,
    score: formatScore({ staves: [combine(soprano, alto), combine(tenor, bass)] }),
    assignment: {
      soprano: { staff: 0, voice: 0 },
      alto: { staff: 0, voice: 1 },
      tenor: { staff: 1, voice: 0 },
      bass: { staff: 1, voice: 1 },
    },
    ...configuration,
  };
  parseReportInput(input);
  return input;
}

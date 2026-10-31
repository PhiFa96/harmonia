import { z } from 'zod';
import {
  ALL_CHORD_TYPES,
  chord,
  parseNoteName,
  parsePitch,
  pitchName,
  VOICE_LEADING_RULE_PHASE,
  type VoiceLeadingHarmonyContext,
  type VoiceLeadingOptions,
  type VoiceLeadingRule,
} from '../../packages/theory/src/index.ts';
import {
  analyzeVoiceLeadingScore,
  describeScore,
  layoutScore,
  layoutToSvg,
  parseScore,
  type VoiceLeadingScoreTone,
} from '../../packages/notation/src/index.ts';
import { REPORT_MESSAGES, type ReportLocale, type ReportMessages } from './messages.ts';
import { createReportPositions } from './report-positions.ts';
import { reportFindingGroups, reportGroupNotes } from './report-groups.ts';

const RULES = Object.keys(VOICE_LEADING_RULE_PHASE) as [VoiceLeadingRule, ...VoiceLeadingRule[]];
export const reportRulesSchema = z.preprocess(
  (value, context) => {
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).some((key) => !Object.hasOwn(VOICE_LEADING_RULE_PHASE, key))
    ) {
      // Validate before partialRecord, which otherwise omits the special __proto__ key.
      context.addIssue({ code: 'custom', message: 'Unknown voice-leading rule' });
      return z.NEVER;
    }
    return value;
  },
  z.partialRecord(z.enum(RULES), z.enum(['error', 'warning', 'hint'])),
);

function parsedString<T>(parse: (value: string) => T) {
  return z.string().transform((value, context) => {
    try {
      return parse(value);
    } catch (error) {
      context.addIssue({
        code: 'custom',
        message: error instanceof Error ? error.message : 'Invalid pitch',
      });
      return z.NEVER;
    }
  });
}
const noteNameSchema = parsedString(parseNoteName);
const pitchSchema = parsedString(parsePitch);
const binding = z.strictObject({
  staff: z.number().int().nonnegative(),
  voice: z.number().int().nonnegative(),
});
const range = z.strictObject({ min: pitchSchema, max: pitchSchema });
const harmonicChord = z
  .strictObject({ root: noteNameSchema, type: z.enum(ALL_CHORD_TYPES) })
  .transform((value, context) => {
    try {
      return chord(value.root, value.type);
    } catch (error) {
      context.addIssue({
        code: 'custom',
        message: error instanceof Error ? error.message : 'Invalid chord',
      });
      return z.NEVER;
    }
  });
const harmony = z.strictObject({
  tonic: noteNameSchema.nullable(),
  chord: harmonicChord.nullable(),
  resolveToNext: z
    .strictObject({
      leadingTone: z.enum(['up', 'up-or-frustrated-inner']).optional(),
      seventh: z.literal('down').optional(),
    })
    .optional(),
});
const inputSchema = z.strictObject({
  title: z.string().trim().min(1).optional(),
  score: z.string().trim().min(1),
  assignment: z.strictObject({ bass: binding, tenor: binding, alto: binding, soprano: binding }),
  rules: reportRulesSchema,
  options: z
    .strictObject({
      ranges: z.strictObject({ bass: range, tenor: range, alto: range, soprano: range }).optional(),
      contraryPerfectScope: z.enum(['outer', 'all']).optional(),
      hiddenPerfectMotion: z.enum(['soprano-leap', 'any']).optional(),
      maxMelodicInterval: z.number().int().positive().optional(),
      harmonies: z.array(harmony).optional(),
    })
    .optional(),
});

export function parseReportInput(raw: unknown) {
  const value = inputSchema.parse(raw);
  const source = value.options ?? {};
  const harmonies = source.harmonies?.map((entry): VoiceLeadingHarmonyContext => ({
    tonic: entry.tonic,
    chord: entry.chord,
    ...(entry.resolveToNext
      ? {
          resolveToNext: {
            ...(entry.resolveToNext.leadingTone !== undefined
              ? { leadingTone: entry.resolveToNext.leadingTone }
              : {}),
            ...(entry.resolveToNext.seventh !== undefined
              ? { seventh: entry.resolveToNext.seventh }
              : {}),
          },
        }
      : {}),
  }));
  const options: VoiceLeadingOptions = {
    ...(source.ranges !== undefined ? { ranges: source.ranges } : {}),
    ...(source.contraryPerfectScope !== undefined
      ? { contraryPerfectScope: source.contraryPerfectScope }
      : {}),
    ...(source.hiddenPerfectMotion !== undefined
      ? { hiddenPerfectMotion: source.hiddenPerfectMotion }
      : {}),
    ...(source.maxMelodicInterval !== undefined
      ? { maxMelodicInterval: source.maxMelodicInterval }
      : {}),
    ...(harmonies !== undefined ? { harmonies } : {}),
  };
  return { ...value, options };
}

export interface ReportAssets {
  readonly fontBase64: string;
  readonly fontLicense: string;
}

/** Eigenständiger lokaler Bericht; keine App-Importe, externen Assets oder Skripte. */
export function renderVoiceLeadingReport(raw: unknown, locale: ReportLocale, assets: ReportAssets) {
  if (!/^[A-Za-z0-9+/]+={0,2}$/u.test(assets.fontBase64))
    throw new RangeError('Invalid embedded font');
  const input = parseReportInput(raw);
  const m = REPORT_MESSAGES[locale];
  const score = parseScore(input.score);
  const analysis = analyzeVoiceLeadingScore(score, input.assignment, input.rules, input.options);
  const positions = createReportPositions(score, input.assignment, m);
  const layout = layoutScore(score);
  const svg = (notes: readonly VoiceLeadingScoreTone[] = []) =>
    layoutToSvg(layout, {
      fontFamily: 'ReviewBravura',
      scale: 12,
      highlights: notes.map((tone) => ({ ref: tone.ref, kind: 'active' })),
    }).replace('<svg ', '<svg aria-hidden="true" focusable="false" ');
  const enabled = RULES.filter((rule) => input.rules[rule] !== undefined);
  const groups = reportFindingGroups(analysis.findings);
  const findings = groups
    .map((members) => {
      const first = members[0];
      if (!first) throw new Error('Empty report group');
      const { finding, index } = first;
      const grouped = members.length > 1;
      const notes = reportGroupNotes(members);
      const rule = m.rules[finding.rule];
      return `<details class="finding" id="${grouped ? 'group' : 'finding'}-${String(index + 1)}"><summary>
      <strong>${String(index + 1)}. ${escapeHtml(rule.title)}</strong>
      <span>${escapeHtml(m.severity[finding.severity])}</span>
      <span>${escapeHtml(positions.at(finding.position))}</span>
      ${grouped ? `<span>${escapeHtml(m.pairs)}: ${String(members.length)}</span>` : ''}
      </summary><p>${escapeHtml(rule.description)}</p>
      ${grouped ? `<ul class="finding-pairs">${members.map((member) => `<li id="finding-${String(member.index + 1)}">${String(member.index + 1)}. ${escapeHtml(member.finding.voices.map((voice) => m.voices[voice]).join(' / '))}</li>`).join('')}</ul>` : ''}
      <figure><div class="notation" tabindex="0">${svg(notes)}</div><figcaption>${escapeHtml(m.marker)}</figcaption></figure>
      ${finding.previous ? evidence(m.source, positions.at(finding.previous.position), reportGroupNotes(members, true), m, locale, positions) : ''}
      ${evidence(m.destination, positions.at(finding.position), notes, m, locale, positions)}
      </details>`;
    })
    .join('\n');
  const descriptions = describeScore(score, {
    language: locale === 'de-DE' ? 'de' : 'en',
    variant: locale === 'en-GB' ? 'uk' : 'us',
  });
  const sourceDescription = descriptions
    .map((entry) => {
      const voice = (['bass', 'tenor', 'alto', 'soprano'] as const).find(
        (part) =>
          input.assignment[part].staff === entry.staff &&
          input.assignment[part].voice === entry.voice,
      );
      const part = voice
        ? m.voices[voice]
        : `${m.staff} ${String(entry.staff + 1)} · ${m.voice} ${String(entry.voice + 1)}`;
      return `<li>${escapeHtml(`${part} · ${positions.measure(entry)} · ${m.event} ${String(entry.event + 1)} · ${entry.text}`)}</li>`;
    })
    .join('');
  const html = `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none'">
<title>${escapeHtml(m.title)}</title><style>
@font-face{font-family:ReviewBravura;src:url(data:font/woff2;base64,${assets.fontBase64}) format('woff2');font-display:swap}
*{box-sizing:border-box}body{margin:0;background:#f5f5f7;color:#20202c;font:16px/1.55 system-ui,sans-serif}main{max-width:1060px;margin:auto;padding:24px}h1,h2,h3{overflow-wrap:anywhere}h1{font-size:1.8rem}h2{font-size:1.25rem;margin-top:2rem}.draft{padding:14px 18px;background:#fff1cc;border-left:5px solid #755100;font-weight:650}.scope{max-width:75ch}.notation{overflow:auto;padding:16px;background:#fff;border:1px solid #bbb}.notation svg{display:block}figure{margin:16px 0}figcaption{font-size:.9rem;margin-top:8px}.finding{background:#fff;border:1px solid #bbb;border-radius:8px;margin:12px 0;padding:14px}summary{cursor:pointer}summary span{display:block;margin-left:20px}summary:focus-visible,.notation:focus-visible{outline:3px solid #4532a4;outline-offset:3px}table{border-collapse:collapse;width:100%;margin:16px 0}caption{text-align:left;font-weight:650}th,td{text-align:left;padding:8px;border-bottom:1px solid #ccc}pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:12px;background:#fff}footer{margin-top:2rem;border-top:1px solid #bbb}li{margin:5px 0}@media print{body{background:#fff}details{break-inside:avoid}}
</style></head><body><main><h1>${escapeHtml(m.title)}</h1>
<p class="draft" role="note">${escapeHtml(m.draft)}</p><p class="scope">${escapeHtml(m.scope)}</p>
<h2>${escapeHtml(input.title ?? m.ownScore)}</h2>
<figure><div class="notation" tabindex="0">${svg()}</div><figcaption>${escapeHtml(m.score)}</figcaption></figure>
<details><summary>${escapeHtml(m.scoreDescription)}</summary><ol>${sourceDescription}</ol></details>
<h2>${escapeHtml(m.enabled)}</h2><ul>${enabled
    .map((rule) => {
      const severity = input.rules[rule];
      return severity === undefined
        ? ''
        : `<li>${escapeHtml(m.rules[rule].title)} · ${escapeHtml(m.severity[severity])}</li>`;
    })
    .join('')}</ul>
<h2>${escapeHtml(m.findings)} (${String(analysis.findings.length)})</h2>
${groups.length < analysis.findings.length ? `<p class="finding-group-count">${escapeHtml(m.groups)}: ${String(groups.length)}</p><p>${escapeHtml(m.groupHelp)}</p>` : ''}
<p>${escapeHtml(m.positionHelp)}</p>
${findings || `<p class="empty">${escapeHtml(enabled.length ? m.noFindings : m.noRules)}</p>`}
<details><summary>${escapeHtml(m.configuration)}</summary><pre>${escapeHtml(JSON.stringify(raw, null, 2))}</pre></details>
<footer><p>${escapeHtml(m.sourceHelp)}</p><details><summary>${escapeHtml(m.license)}</summary><pre>${escapeHtml(assets.fontLicense)}</pre></details></footer>
</main></body></html>`;
  return { html, analysis, groupCount: groups.length };
}

function evidence(
  title: string,
  position: string,
  notes: readonly VoiceLeadingScoreTone[],
  m: ReportMessages,
  locale: ReportLocale,
  positions: ReturnType<typeof createReportPositions>,
): string {
  return `<table><caption>${escapeHtml(`${title} · ${position}`)}</caption>
  <thead><tr><th scope="col">${escapeHtml(m.voice)}</th><th scope="col">${escapeHtml(m.pitch)}</th><th scope="col">${escapeHtml(m.measure)}</th><th scope="col">${escapeHtml(m.event)}</th></tr></thead>
  <tbody>${notes.map((tone) => `<tr><th scope="row">${escapeHtml(m.voices[tone.voice])}</th><td>${escapeHtml(tone.pitch ? pitchName(tone.pitch, { system: locale === 'de-DE' ? 'de' : 'intl', octave: 'scientific' }) : m.rest)}</td><td>${String(positions.number(tone.ref))}</td><td>${String(tone.ref.event + 1)}</td></tr>`).join('')}</tbody></table>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#39;');
}

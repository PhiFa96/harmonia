import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { VOICE_LEADING_RULE_PHASE } from '../packages/theory/src/index.ts';
import { REPORT_MESSAGES } from './voice-leading/messages.ts';
import { parseReportInput, renderVoiceLeadingReport } from './voice-leading/report.ts';
import { run, writePrivateReport } from './voice-leading-report.mjs';
import { createReportPositions } from './voice-leading/report-positions.ts';
import { analyzeVoiceLeadingScore, parseScore } from '../packages/notation/src/index.ts';
import { fraction, timeSignature } from '../packages/theory/src/index.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const privateBase = join(root, 'artifacts', 'voice-leading');
const sample = () =>
  JSON.parse(readFileSync(new URL('./voice-leading/example.json', import.meta.url), 'utf8'));
const assets = { fontBase64: 'AA==', fontLicense: 'Own fixture license' };

function crossingFixture(first = 'C4/4 & E4/4', lower = 'G3/4 & C3/4') {
  return {
    ...sample(),
    score: `treble | 4/4 | ${first} | C4/2 D4/2 & E4/2 F4/2\nbass | 4/4 | ${lower} | G3/2 A3/2 & C3/2 D3/2`,
    rules: { 'voice-crossing': 'error' },
    options: {},
  };
}

test('pickup numbering reaches finding headers, evidence rows and accessible note descriptions', () => {
  for (const locale of ['de-DE', 'en-US', 'en-GB']) {
    const input = crossingFixture();
    const { html, analysis } = renderVoiceLeadingReport(input, locale, assets);
    const m = REPORT_MESSAGES[locale];
    const pickup = `${m.measure} 0 (${m.pickup}) · ${m.beginning}`;
    assert.ok(html.includes(`<span>${pickup}</span>`));
    assert.ok(html.includes(`<caption>${m.destination} · ${pickup}</caption>`));
    assert.ok(html.includes(`<td>C4</td><td>0</td><td>1</td>`));
    assert.ok(
      html.includes(`<li>${m.voices.soprano} · ${m.measure} 0 (${m.pickup}) · ${m.event} 1 ·`),
    );
    assert.ok(html.includes(`<span>${m.measure} 1 · ${m.beginning}</span>`));
    assert.ok(html.includes(`<span>${m.measure} 1 · ${m.offset} 1/2</span>`));
    assert.deepEqual(
      analysis.findings.map((finding) => finding.position),
      [
        { at: fraction(0), measure: 0, offset: fraction(0) },
        { at: fraction(1, 4), measure: 1, offset: fraction(0) },
        { at: fraction(3, 4), measure: 1, offset: fraction(1, 2) },
      ],
    );
    assert.deepEqual(
      analysis,
      analyzeVoiceLeadingScore(parseScore(input.score), input.assignment, input.rules, {}),
    );
  }
});

test('a full first measure stays measure 1 and zero offsets are labelled as the written start', () => {
  const input = crossingFixture('C4/1 & E4/1', 'G3/1 & C3/1');
  for (const locale of ['de-DE', 'en-US', 'en-GB']) {
    const m = REPORT_MESSAGES[locale];
    const { html } = renderVoiceLeadingReport(input, locale, assets);
    assert.ok(html.includes(`<span>${m.measure} 1 · ${m.beginning}</span>`));
    assert.ok(html.includes(`<span>${m.measure} 2 · ${m.beginning}</span>`));
    assert.ok(!html.includes(`<span>${m.measure} 0`));
    assert.ok(!html.includes(`${m.offset} 0</span>`));
  }
});

test('finding positions use the assigned bass while other written parts retain their own numbering', () => {
  const input = {
    ...crossingFixture(),
    score: 'treble | 4/4 | C5/1\ntreble | 4/4 | C4/4 & E4/4\nbass | 4/4 | G3/4 & C3/4',
    assignment: {
      soprano: { staff: 1, voice: 0 },
      alto: { staff: 1, voice: 1 },
      tenor: { staff: 2, voice: 0 },
      bass: { staff: 2, voice: 1 },
    },
  };
  const { html, analysis } = renderVoiceLeadingReport(input, 'de-DE', assets);
  assert.equal(analysis.findings.length, 1);
  assert.ok(html.includes('<span>Takt 0 (Auftakt) · Notierter Taktbeginn</span>'));
  assert.ok(html.includes('<li>System 1 · Stimme 1 · Takt 1 · Ereignis 1 ·'));
  assert.ok(html.includes('<li>Sopran · Takt 0 (Auftakt) · Ereignis 1 ·'));
});

test('additional voices entering after the pickup inherit their staff numbering', () => {
  const input = crossingFixture();
  input.score += '\ntreble | 4/4 | C5/4 | C5/1 & E5/1';
  const { html, analysis } = renderVoiceLeadingReport(input, 'de-DE', assets);
  assert.equal(analysis.findings.length, 3);
  assert.ok(html.includes('<li>System 3 · Stimme 2 · Takt 1 · Ereignis 1 ·'));
});

test('pickup detection counts rests, dotted and tuplet durations against the effective first meter', () => {
  const assignment = sample().assignment;
  for (const [source, start] of [
    ['treble | 6/8 | r/8 C4/8', 0],
    ['treble | 6/8 | C4/4. D4/4.', 1],
    ['treble | 3/4 | C4/4 D4/4 E4/4', 1],
    ['treble | 4/4 | C4/8{3:2} D4/8{3:2} E4/8{3:2}', 0],
  ]) {
    const score = parseScore(source);
    const positions = createReportPositions(score, assignment, REPORT_MESSAGES['de-DE']);
    assert.equal(positions.number({ staff: 0, voice: 0, measure: 0 }), start);
    assert.equal(positions.number({ staff: 0, voice: 0, measure: 1 }), start + 1);
  }
  const changed = parseScore('treble | 4/4 | C4/2.');
  changed.staves[0].measures[0].changes = { timeSignature: timeSignature(3, 4) };
  const positions = createReportPositions(changed, assignment, REPORT_MESSAGES['de-DE']);
  assert.equal(positions.number({ staff: 0, voice: 0, measure: 0 }), 1);
});

test('own report corpus produces located findings in all three language variants', () => {
  for (const locale of ['de-DE', 'en-US', 'en-GB']) {
    const { html, analysis } = renderVoiceLeadingReport(sample(), locale, assets);
    assert.equal(analysis.status, 'draft');
    assert.deepEqual(
      analysis.findings.map((finding) => [finding.rule, finding.at]),
      [
        ['parallel-fifth', 1],
        ['parallel-fifth', 2],
        ['leading-tone-resolution', 3],
      ],
    );
    assert.ok(html.includes(`<html lang="${locale}">`));
    assert.ok(html.includes(REPORT_MESSAGES[locale].draft));
    assert.ok(html.includes(REPORT_MESSAGES[locale].rules['leading-tone-resolution'].title));
    assert.ok(html.includes('id="finding-3"'));
    assert.ok(html.includes('aria-hidden="true"'));
    assert.ok(html.includes('scope="row"'));
    assert.ok(html.includes('<td>' + (locale === 'de-DE' ? 'H3' : 'B3') + '</td>'));
  }
});

test('all rule explanations, severity labels and voice names have complete nonempty translations', () => {
  const keys = Object.keys(REPORT_MESSAGES['de-DE']).sort();
  const ruleKeys = Object.keys(VOICE_LEADING_RULE_PHASE).sort();
  function nonempty(value) {
    for (const item of Object.values(value)) {
      if (typeof item === 'object') nonempty(item);
      else assert.ok(typeof item === 'string' && item.trim().length > 0);
    }
  }
  for (const messages of Object.values(REPORT_MESSAGES)) {
    assert.deepEqual(Object.keys(messages).sort(), keys);
    assert.deepEqual(Object.keys(messages.rules).sort(), ruleKeys);
    assert.deepEqual(Object.keys(messages.voices).sort(), ['alto', 'bass', 'soprano', 'tenor']);
    assert.deepEqual(Object.keys(messages.severity).sort(), ['error', 'hint', 'warning']);
    nonempty(messages);
  }
  assert.ok(
    REPORT_MESSAGES['en-GB'].rules['leading-tone-resolution'].title.includes('Leading note'),
  );
  assert.equal(REPORT_MESSAGES['en-GB'].measure, 'Bar');
});

test('empty findings and disabled rules do not claim a subject approval', () => {
  const input = sample();
  input.rules = { 'voice-crossing': 'hint' };
  const noFindings = renderVoiceLeadingReport(input, 'en-US', assets);
  assert.equal(noFindings.analysis.findings.length, 0);
  assert.ok(noFindings.html.includes(REPORT_MESSAGES['en-US'].noFindings));
  input.rules = {};
  assert.ok(
    renderVoiceLeadingReport(input, 'de-DE', assets).html.includes(
      REPORT_MESSAGES['de-DE'].noRules,
    ),
  );
});

test('unknown rule names, invalid notation and missing rule parameters are refused', () => {
  const invalid = [
    { ...sample(), rules: { 'invented-rule': 'error' } },
    { ...sample(), options: { range: {} } },
    { ...sample(), rules: { 'voice-range': 'warning' }, options: {} },
    { ...sample(), rules: { 'melodic-leap': 'hint' }, options: { maxMelodicInterval: -1 } },
    { ...sample(), score: 'not a score' },
    { ...sample(), options: { harmonies: [{ tonic: 'H', chord: null }] } },
    {
      ...sample(),
      options: { harmonies: [{ tonic: null, chord: { root: 'G', type: 'invented-chord' } }] },
    },
  ];
  for (const input of invalid)
    assert.throws(() => renderVoiceLeadingReport(input, 'de-DE', assets));
  assert.throws(() => parseReportInput(null));
});

test('titles, score labels, raw configuration and font license cannot inject markup', () => {
  const input = sample();
  input.title = '</h2><script>alert(1)</script>';
  input.score = input.score.replace('E4/2', 'E4/2@fn:<img>');
  const { html } = renderVoiceLeadingReport(input, 'de-DE', {
    ...assets,
    fontLicense: '</pre><script>bad()</script>',
  });
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(html.includes('&lt;img&gt;'));
  assert.ok(!/<script|<img/iu.test(html));
  assert.ok(html.includes("default-src 'none'"));
  assert.throws(() =>
    renderVoiceLeadingReport(sample(), 'de-DE', { ...assets, fontBase64: ');color:red;' }),
  );
});

test('private output cannot overwrite a file, enter an app export or follow a symlink', () => {
  mkdirSync(privateBase, { recursive: true });
  const folder = mkdtempSync(join(privateBase, 'test-paths-'));
  const outside = mkdtempSync(join(tmpdir(), 'harmonia-report-test-'));
  try {
    const output = join(folder, 'report.html');
    assert.equal(writePrivateReport(output, '<p>Own report</p>'), output);
    assert.throws(() => writePrivateReport(output, 'replacement'));
    assert.equal(readFileSync(output, 'utf8'), '<p>Own report</p>');
    assert.throws(() => writePrivateReport(join(root, 'apps/mobile/dist/private.html'), 'report'));
    assert.throws(() => writePrivateReport(join(outside, 'report.html'), 'report'));
    symlinkSync(outside, join(folder, 'linked'));
    assert.throws(() => writePrivateReport(join(folder, 'linked/report.html'), 'report'));
  } finally {
    rmSync(folder, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test('CLI creates a standalone private report with the real embedded font and its license', () => {
  mkdirSync(privateBase, { recursive: true });
  const folder = mkdtempSync(join(privateBase, 'test-cli-'));
  try {
    const output = join(folder, 'report.html');
    const result = JSON.parse(
      execFileSync(
        process.execPath,
        [
          'tools/voice-leading-report.mjs',
          '--input',
          'tools/voice-leading/example.json',
          '--language',
          'en-GB',
          '--output',
          output,
        ],
        { cwd: root, encoding: 'utf8' },
      ),
    );
    assert.equal(result.status, 'draft');
    assert.equal(result.findings, 3);
    const html = readFileSync(output, 'utf8');
    assert.ok(html.includes('data:font/woff2;base64,'));
    assert.ok(html.includes('SIL OPEN FONT LICENSE'));
    assert.ok(!/<script|<link\b|<iframe/iu.test(html));
    const failed = spawnSync(
      process.execPath,
      [
        'tools/voice-leading-report.mjs',
        '--input',
        'tools/voice-leading/example.json',
        '--language',
        'fr',
        '--output',
        join(folder, 'bad.html'),
      ],
      { cwd: root, encoding: 'utf8' },
    );
    assert.equal(failed.status, 1);
    assert.throws(() => run(['--input', 'one.json', '--input', 'two.json']));
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

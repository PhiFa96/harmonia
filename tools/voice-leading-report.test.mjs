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
import { reportFindingGroups, reportGroupNotes } from './voice-leading/report-groups.ts';
import { analyzeVoiceLeadingScore, parseScore } from '../packages/notation/src/index.ts';
import { fraction, timeSignature } from '../packages/theory/src/index.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const privateBase = join(root, 'artifacts', 'voice-leading');
const sample = () =>
  JSON.parse(readFileSync(new URL('./voice-leading/example.json', import.meta.url), 'utf8'));
const assets = { fontBase64: 'AA==', fontLicense: 'Own fixture license' };

test('report rules reject special unknown keys instead of dropping them during parsing', () => {
  for (const key of ['__proto__', 'constructor', 'toString']) {
    const input = sample();
    input.rules = JSON.parse(`{"${key}":"warning"}`);
    assert.throws(() => parseReportInput(input));
  }
});

const octaveFixture = () => ({
  ...sample(),
  score: 'treble | E5/2 F5/2 & C5/2 D5/2\nbass | C4/2 D4/2 & C3/2 D3/2',
  rules: { 'parallel-octave': 'error' },
  options: {},
});

test('optional augmented intervals keep spelled source/destination evidence in every language', () => {
  const input = {
    ...sample(),
    score: 'treble | C4/2 F#4/2 & G3/1\nbass | E3/1 & C3/1',
    rules: { 'augmented-melodic-interval': 'warning' },
    options: {},
  };
  assert.deepEqual(parseReportInput(input).rules, input.rules);
  for (const locale of ['de-DE', 'en-US', 'en-GB']) {
    const { html, analysis } = renderVoiceLeadingReport(input, locale, assets);
    const m = REPORT_MESSAGES[locale];
    assert.equal(analysis.findings.length, 1);
    assert.equal(analysis.findings[0].previous.notes[0].ref.event, 0);
    assert.equal(analysis.findings[0].notes[0].ref.event, 1);
    assert.ok(html.includes(m.rules['augmented-melodic-interval'].title));
    assert.ok(html.includes(m.rules['augmented-melodic-interval'].description));
    assert.ok(html.includes(`<caption>${m.source} · ${m.measure} 1 · ${m.beginning}</caption>`));
    assert.ok(
      html.includes(`<caption>${m.destination} · ${m.measure} 1 · ${m.offset} 1/2</caption>`),
    );
    assert.equal((html.match(/<tbody>/g) ?? []).length, 2);
    assert.ok(html.includes(m.draft));
    assert.ok(!html.includes('<script'));
    assert.equal(
      renderVoiceLeadingReport(
        { ...input, score: input.score.replace('F#4', 'Gb4') },
        locale,
        assets,
      ).analysis.findings.length,
      0,
    );
  }
});

test('three parallel octave pairs share one display block while all findings, pairs and evidence remain', () => {
  for (const locale of ['de-DE', 'en-US', 'en-GB']) {
    const input = octaveFixture();
    const original = analyzeVoiceLeadingScore(
      parseScore(input.score),
      input.assignment,
      input.rules,
      {},
    );
    const { html, analysis, groupCount } = renderVoiceLeadingReport(input, locale, assets);
    const m = REPORT_MESSAGES[locale];
    assert.equal(analysis.findings.length, 3);
    assert.equal(groupCount, 1);
    assert.deepEqual(analysis, original);
    assert.equal((html.match(/class="finding"/g) ?? []).length, 1);
    assert.ok(html.includes(`${m.findings} (3)`));
    assert.ok(html.includes(`${m.groups}: 1`));
    assert.ok(html.includes(`${m.pairs}: 3`));
    assert.ok(html.includes(m.groupHelp));
    for (const [index, voices] of [
      ['bass', 'tenor'],
      ['bass', 'alto'],
      ['tenor', 'alto'],
    ].entries())
      assert.ok(
        html.includes(
          `<li id="finding-${index + 1}">${index + 1}. ${voices.map((voice) => m.voices[voice]).join(' / ')}</li>`,
        ),
      );
    const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(ids.length, new Set(ids).size);
    const tables = [...html.matchAll(/<tbody>(.*?)<\/tbody>/gs)];
    assert.equal(tables.length, 2);
    for (const table of tables) assert.equal((table[1].match(/<tr>/g) ?? []).length, 3);
    const group = reportFindingGroups(analysis.findings)[0];
    assert.deepEqual(
      reportGroupNotes(group).map((tone) => tone.voice),
      ['bass', 'tenor', 'alto'],
    );
    assert.deepEqual(
      reportGroupNotes(group, true).map((tone) => tone.voice),
      ['bass', 'tenor', 'alto'],
    );
  }
});

test('different rules, severities, frames and source/destination positions never merge', () => {
  const { analysis } = renderVoiceLeadingReport(octaveFixture(), 'de-DE', assets);
  const first = analysis.findings[0],
    second = analysis.findings[1];
  for (const changed of [
    { ...second, rule: 'parallel-fifth' },
    { ...second, severity: 'warning' },
    { ...second, at: second.at + 1 },
    { ...second, previous: undefined },
    {
      ...second,
      previous: {
        ...second.previous,
        position: { ...second.previous.position, offset: fraction(1, 4) },
      },
    },
    { ...second, position: { ...second.position, offset: fraction(1, 4) } },
  ])
    assert.equal(reportFindingGroups([first, changed]).length, 2);
});

test('single-voice and multi-voice findings keep their individual display blocks', () => {
  const { analysis } = renderVoiceLeadingReport(octaveFixture(), 'de-DE', assets);
  const first = analysis.findings[0];
  const single = { ...first, rule: 'voice-range', voices: ['bass'] };
  const multiple = { ...first, rule: 'doubled-leading-tone', voices: ['bass', 'tenor', 'alto'] };
  assert.equal(reportFindingGroups([single, { ...single }, multiple, { ...multiple }]).length, 4);
});

test('grouping interleaved findings retains original objects and every original index without mutation', () => {
  const { analysis } = renderVoiceLeadingReport(octaveFixture(), 'de-DE', assets);
  const [first, second, third] = analysis.findings;
  const single = { ...first, rule: 'voice-range', voices: ['bass'] };
  const findings = [first, single, second, third];
  const before = JSON.stringify(findings);
  const groups = reportFindingGroups(findings);
  assert.deepEqual(
    groups.map((group) => group.map((member) => member.index)),
    [[0, 2, 3], [1]],
  );
  for (const member of groups.flat()) assert.strictEqual(member.finding, findings[member.index]);
  assert.deepEqual(
    groups
      .flat()
      .map((member) => member.index)
      .sort(),
    [0, 1, 2, 3],
  );
  reportGroupNotes(groups[0]);
  reportGroupNotes(groups[0], true);
  assert.equal(JSON.stringify(findings), before);
});

test('two disjoint parallel pairs show all four voices instead of losing a pair', () => {
  const input = octaveFixture();
  input.score = 'treble | E5/2 F5/2 & E4/2 F4/2\nbass | C4/2 D4/2 & C3/2 D3/2';
  const { analysis, groupCount } = renderVoiceLeadingReport(input, 'de-DE', assets);
  assert.equal(analysis.findings.length, 2);
  assert.equal(groupCount, 1);
  assert.deepEqual(
    reportGroupNotes(reportFindingGroups(analysis.findings)[0]).map((tone) => tone.voice),
    ['bass', 'tenor', 'alto', 'soprano'],
  );
});

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

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

const root = fileURLToPath(new URL('..', import.meta.url));
const privateBase = join(root, 'artifacts', 'voice-leading');
const sample = () =>
  JSON.parse(readFileSync(new URL('./voice-leading/example.json', import.meta.url), 'utf8'));
const assets = { fontBase64: 'AA==', fontLicense: 'Own fixture license' };

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

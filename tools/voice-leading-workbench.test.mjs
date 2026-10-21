import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { STARTER_DRAFT, buildWorkbench, run } from './voice-leading-workbench.mjs';
import {
  MAX_DRAFT_BYTES,
  parseWorkbenchDraft,
  workbenchReportInput,
} from './voice-leading/workbench-model.ts';
import { renderVoiceLeadingReport } from './voice-leading/report.ts';
import { WORKBENCH_MESSAGES } from './voice-leading/workbench-messages.ts';

const sample = () => structuredClone(STARTER_DRAFT);
const assets = { fontBase64: 'AA==', fontLicense: 'Own test fixture' };
test('four editable voices reproduce the score findings, then react to a pitch correction', () => {
  const draft = sample();
  const report = () =>
    renderVoiceLeadingReport(workbenchReportInput(draft), 'de-DE', assets).analysis;
  assert.deepEqual(
    report().findings.map((f) => [f.rule, f.at]),
    [
      ['parallel-fifth', 1],
      ['parallel-fifth', 2],
      ['leading-tone-resolution', 3],
    ],
  );
  draft.parts.soprano = 'E4/2 F4/2 | B3/2 C4/2';
  assert.deepEqual(
    report().findings.map((f) => f.rule),
    ['parallel-fifth', 'parallel-fifth'],
  );
});

test('unfinished drafts round-trip without requiring valid notation or settings', () => {
  const draft = sample();
  draft.parts.soprano = '';
  draft.settings = '{ unfinished';
  assert.deepEqual(parseWorkbenchDraft(JSON.parse(JSON.stringify(draft))), draft);
  assert.throws(() => workbenchReportInput(draft));
  const largest = {
    ...sample(),
    title: '\u0000'.repeat(200),
    settings: '\u0000'.repeat(30_000),
    parts: Object.fromEntries(
      ['soprano', 'alto', 'tenor', 'bass'].map((voice) => [voice, '\u0000'.repeat(8_000)]),
    ),
  };
  assert.ok(
    Buffer.byteLength(JSON.stringify(parseWorkbenchDraft(largest), null, 2)) < MAX_DRAFT_BYTES,
  );
  for (const change of [{ format: 'approved' }, { unexpected: true }, { title: 'x'.repeat(201) }])
    assert.throws(() => parseWorkbenchDraft({ ...sample(), ...change }));
});

test('voice boundaries, meter and configuration cannot silently add tracks or replace the score', () => {
  for (const soprano of [
    'E4/1 & C4/1',
    'E4/1\nbass | C3/1',
    'key:G | E4/1',
    '3/4 | E4/2.',
    'E4/1 | 3/4 | E4/2.',
    Array(33).fill('E4/1').join(' | '),
  ]) {
    const draft = sample();
    draft.parts.soprano = soprano;
    assert.throws(() => workbenchReportInput(draft));
  }
  const draft = sample();
  draft.settings = JSON.stringify({ rules: {}, score: 'replacement' });
  assert.throws(() => workbenchReportInput(draft));
  draft.settings = '{"rules":{"invented":"error"}}';
  assert.throws(() => workbenchReportInput(draft));
  draft.settings = '{"rules":{}}';
  draft.key = 'C | 3/4';
  assert.throws(() => workbenchReportInput(draft));
});

test('unequal durations and stale harmony contexts fail rather than generating a misleading report', () => {
  for (const soprano of ['E4/4 | B3/2 A3/2', 'E4/4 F4/4 G4/2 | B3/2 A3/2']) {
    const draft = sample();
    draft.parts.soprano = soprano;
    assert.throws(() => renderVoiceLeadingReport(workbenchReportInput(draft), 'en-US', assets));
  }
});

test('workbench language variants are complete and bundle offline with a matching script CSP hash', async () => {
  const keys = Object.keys(WORKBENCH_MESSAGES['de-DE']).sort();
  for (const [locale, messages] of Object.entries(WORKBENCH_MESSAGES)) {
    assert.deepEqual(Object.keys(messages).sort(), keys);
    assert.ok(Object.values(messages).every((value) => value.trim()));
    const html = await buildWorkbench(locale);
    const script = html.match(/<script>([\s\S]*)<\/script>/u)?.[1];
    assert.ok(script);
    const hash = createHash('sha256').update(script).digest('base64');
    assert.ok(html.includes(`script-src 'sha256-${hash}'`));
    assert.ok(html.includes(`lang="${locale}"`));
    assert.ok(!/<(?:script\s+src|link|iframe)\b/iu.test(html));
    assert.equal((html.match(/<\/script>/giu) ?? []).length, 1);
    assert.ok(html.includes("default-src 'none'"));
  }
  await assert.rejects(() => buildWorkbench('fr'));
  await assert.rejects(() => run(['--language', 'de-DE', '--language', 'en-US']));
});

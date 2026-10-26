import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { buildWorkbench, STARTER_DRAFT } from '../../tools/voice-leading-workbench.mjs';
import { WORKBENCH_MESSAGES } from '../../tools/voice-leading/workbench-messages.ts';
import { REPORT_MESSAGES } from '../../tools/voice-leading/messages.ts';
import { MAX_DRAFT_BYTES } from '../../tools/voice-leading/workbench-model.ts';

let html;
const runtime = new WeakMap();
test.beforeAll(async () => {
  html = await buildWorkbench('de-DE');
});
test.beforeEach(async ({ page }) => {
  const events = { requests: [], errors: [] };
  runtime.set(page, events);
  page.on('request', (request) => {
    if (/^https?:/u.test(request.url())) events.requests.push(request.url());
  });
  page.on('pageerror', (error) => events.errors.push(error.message));
  // Beobachtet echte Web-Audio-Knoten. Keine Audio-Attrappe und kein Mikrofonzugriff.
  await page.evaluate(() => {
    const NativeAudioContext = window.AudioContext;
    window.workbenchAudio = [];
    window.AudioContext = class extends NativeAudioContext {
      constructor() {
        super();
        this.trace = { context: this, analyser: this.createAnalyser(), gains: [], tones: [] };
        window.workbenchAudio.push(this.trace);
      }
      createGain() {
        const gain = super.createGain();
        if (this.trace.gains.length === 0) gain.connect(this.trace.analyser);
        this.trace.gains.push(gain);
        return gain;
      }
      createOscillator() {
        const node = super.createOscillator();
        const tone = { node, starts: [], stops: [] };
        this.trace.tones.push(tone);
        const start = node.start.bind(node),
          stop = node.stop.bind(node);
        node.start = (when) => {
          tone.starts.push(when);
          start(when);
        };
        node.stop = (when) => {
          tone.stops.push(when);
          stop(when);
        };
        return node;
      }
    };
  });
  // Eigener generierter Inhalt; file://-Navigation ist in der Cloud gesperrt.
  await page.setContent(html);
  await expect(page.locator('#check-status')).toContainText('3.');
});

test('real Web Audio plays all voices and solo, produces a signal, stops and reaches the end', async ({
  page,
}) => {
  const m = WORKBENCH_MESSAGES['de-DE'];
  expect(await page.evaluate(() => window.workbenchAudio.length)).toBe(0);
  await page.getByLabel(m.tempo).fill('120');
  const play = page.getByRole('button', { name: m.play, exact: true });
  const stop = page.getByRole('button', { name: m.stop, exact: true });
  await play.click();
  await expect(page.locator('#playback-status')).toHaveText(m.audioPlaying);
  expect(await page.evaluate(() => window.workbenchAudio[0].tones.length)).toBe(15);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const analyser = window.workbenchAudio[0].analyser;
        const samples = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(samples);
        return Math.max(...samples.map(Math.abs));
      }),
    )
    .toBeGreaterThan(0.0001);
  await stop.click();
  await expect(page.locator('#playback-status')).toHaveText(m.audioStopped);
  expect(
    await page.evaluate(() =>
      window.workbenchAudio[0].tones.every((tone) => tone.stops.length >= 2),
    ),
  ).toBe(true);
  await page.getByLabel(m.part).selectOption('soprano');
  await page.getByLabel(m.tempo).fill('200');
  await play.click();
  await expect(page.locator('#playback-status')).toHaveText(m.audioPlaying);
  expect(await page.evaluate(() => window.workbenchAudio[0].tones.length)).toBe(19);
  await expect(page.locator('#playback-status')).toHaveText(m.audioEnded, { timeout: 10000 });
  await expect(play).toBeEnabled();
  await expect(stop).toBeDisabled();
  const progress = page.getByRole('progressbar');
  expect(await progress.evaluate((node) => node.value === node.max)).toBe(true);
});

test('notation, tempo, language and document lifecycle stop playback; returning can restart', async ({
  page,
}) => {
  const m = WORKBENCH_MESSAGES['de-DE'];
  const play = page.getByRole('button', { name: m.play, exact: true });
  await play.click();
  await expect(page.locator('#playback-status')).toHaveText(m.audioPlaying);
  await page.getByRole('textbox', { name: 'Sopran', exact: true }).fill('E4/2 F4/2 | B3/2 C4/2');
  await expect(page.locator('#playback-status')).toHaveText(m.audioStopped);
  await expect(play).toBeDisabled();
  await page.getByRole('button', { name: m.analyze }).click();
  await play.click();
  await expect(page.locator('#playback-status')).toHaveText(m.audioPlaying);
  await page.getByLabel(m.tempo).fill('100');
  await expect(page.locator('#playback-status')).toHaveText(m.audioStopped);
  await play.click();
  await expect(page.locator('#playback-status')).toHaveText(m.audioPlaying);
  await page.evaluate(async () => {
    await window.workbenchAudio[0].context.suspend();
  });
  await expect(page.locator('#playback-status')).toHaveText(m.audioStopped);
  await play.click();
  await expect(page.locator('#playback-status')).toHaveText(m.audioPlaying);
  // Synthetischer Sichtbarkeitswechsel; kein Nachweis einer realen Geräteunterbrechung.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.hidden;
  });
  await expect(page.locator('#playback-status')).toHaveText(m.audioStopped);
  await play.click();
  await expect(page.locator('#playback-status')).toHaveText(m.audioPlaying);
  await page.getByLabel(m.language).selectOption('en-GB');
  await expect(page.locator('#playback-status')).toHaveText(
    WORKBENCH_MESSAGES['en-GB'].audioStopped,
  );
  await expect(page.getByLabel(WORKBENCH_MESSAGES['en-GB'].tempo)).toHaveValue('100');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await expect
    .poll(() => page.evaluate(() => window.workbenchAudio[0].context.state))
    .toBe('closed');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('#playback-status')).toHaveText(
    WORKBENCH_MESSAGES['en-GB'].audioPlaying,
  );
  expect(await page.evaluate(() => window.workbenchAudio.length)).toBe(2);
});

test('invalid tempo opens no audio; unavailable audio is reported and retry works', async ({
  page,
}) => {
  const m = WORKBENCH_MESSAGES['de-DE'];
  const play = page.getByRole('button', { name: m.play, exact: true });
  await page.getByLabel(m.tempo).fill('201');
  await play.click();
  await expect(page.locator('#playback-status')).toHaveText(m.tempoError);
  expect(await page.evaluate(() => window.workbenchAudio.length)).toBe(0);
  await page.getByLabel(m.tempo).fill('120');
  await page.evaluate(() => {
    window.savedAudioContext = window.AudioContext;
    window.AudioContext = class {
      constructor() {
        throw new Error('Audio unavailable');
      }
    };
  });
  await play.click();
  await expect(page.locator('#playback-status')).toHaveText(m.audioError);
  await expect(play).toBeEnabled();
  await page.evaluate(() => {
    window.AudioContext = window.savedAudioContext;
  });
  await play.click();
  await expect(page.locator('#playback-status')).toHaveText(m.audioPlaying);
  await page.getByRole('button', { name: m.stop, exact: true }).click();
});
test.afterEach(async ({ page }) => {
  expect(runtime.get(page)).toEqual({ requests: [], errors: [] });
});

for (const locale of ['de-DE', 'en-US', 'en-GB']) {
  test(`${locale}: optional augmented intervals show evidence and respect an enharmonic edit`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.getByRole('combobox', { name: 'Sprache' }).selectOption(locale);
    const m = WORKBENCH_MESSAGES[locale],
      report = REPORT_MESSAGES[locale];
    const parts = { soprano: 'C4/2 F#4/2', alto: 'G3/1', tenor: 'E3/1', bass: 'C3/1' };
    for (const [voice, source] of Object.entries(parts))
      await page.getByRole('textbox', { name: report.voices[voice], exact: true }).fill(source);
    await page
      .getByRole('textbox', { name: m.settings, exact: true })
      .fill('{"rules":{"augmented-melodic-interval":"warning"}}');
    await page.getByRole('button', { name: m.analyze, exact: true }).click();
    await expect(page.locator('.finding')).toHaveCount(1);
    const finding = page.locator('#finding-1');
    await expect(finding.locator('summary')).toContainText(
      report.rules['augmented-melodic-interval'].title,
    );
    await finding.locator('summary').click();
    await expect(finding.locator('caption')).toHaveText([
      `${report.source} · ${report.measure} 1 · ${report.beginning}`,
      `${report.destination} · ${report.measure} 1 · ${report.offset} 1/2`,
    ]);
    for (const table of await finding.locator('table').all())
      await expect(table.locator('tbody tr')).toHaveCount(1);
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: m.export, exact: true }).click();
    const saved = await readFile(await (await pending).path(), 'utf8');
    expect(saved).toContain(report.rules['augmented-melodic-interval'].description);
    expect(saved).toContain(report.draft);
    expect(saved).not.toContain('<script');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page
      .getByRole('textbox', { name: report.voices.soprano, exact: true })
      .fill('C4/2 Gb4/2');
    await expect(page.locator('.finding')).toHaveCount(0);
    await expect(page.getByRole('button', { name: m.export, exact: true })).toBeDisabled();
    await page.getByRole('button', { name: m.analyze, exact: true }).click();
    await expect(page.locator('.finding')).toHaveCount(0);
    await expect(page.locator('#check-status')).toHaveText(`${m.checked} 0.`);
  });

  test(`${locale}: simultaneous octave pairs share evidence and regroup after editing`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.getByRole('combobox', { name: 'Sprache' }).selectOption(locale);
    const m = WORKBENCH_MESSAGES[locale],
      report = REPORT_MESSAGES[locale];
    const parts = {
      soprano: 'E5/2 F5/2',
      alto: 'C5/2 D5/2',
      tenor: 'C4/2 D4/2',
      bass: 'C3/2 D3/2',
    };
    for (const [voice, source] of Object.entries(parts))
      await page.getByRole('textbox', { name: report.voices[voice], exact: true }).fill(source);
    await page
      .getByRole('textbox', { name: m.settings, exact: true })
      .fill('{"rules":{"parallel-octave":"error"}}');
    await page.getByRole('button', { name: m.analyze, exact: true }).click();
    await expect(page.locator('.finding')).toHaveCount(1);
    await expect(page.locator('.finding-group-count')).toHaveText(`${report.groups}: 1`);
    await expect(page.locator('#check-status')).toContainText(
      `${m.checked} 3. ${report.groups}: 1.`,
    );
    const group = page.locator('#group-1');
    await group.locator('summary').click();
    await expect(group.locator('.finding-pairs li')).toHaveText([
      `1. ${report.voices.bass} / ${report.voices.tenor}`,
      `2. ${report.voices.bass} / ${report.voices.alto}`,
      `3. ${report.voices.tenor} / ${report.voices.alto}`,
    ]);
    await expect(group.locator('table')).toHaveCount(2);
    for (const table of await group.locator('table').all())
      await expect(table.locator('tbody tr')).toHaveCount(3);
    for (let index = 1; index <= 3; index++)
      await expect(group.locator(`#finding-${index}`)).toHaveCount(1);
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: m.export, exact: true }).click();
    const download = await pending;
    const saved = await readFile(await download.path(), 'utf8');
    expect(saved).toContain(`${report.groups}: 1`);
    expect(saved).toContain('id="finding-3"');
    expect(saved).not.toContain('<script');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole('textbox', { name: report.voices.alto, exact: true }).fill('C5/2 E5/2');
    await expect(page.locator('.finding')).toHaveCount(0);
    await expect(page.getByRole('button', { name: m.export, exact: true })).toBeDisabled();
    await page.getByRole('button', { name: m.analyze, exact: true }).click();
    await expect(page.locator('.finding')).toHaveCount(1);
    await expect(page.locator('#finding-1 > summary')).toBeVisible();
    await expect(page.locator('#finding-2')).toHaveCount(0);
    await expect(page.locator('#group-1')).toHaveCount(0);
    await expect(page.locator('.finding-group-count')).toHaveCount(0);
    await expect(page.locator('#check-status')).toHaveText(`${m.checked} 1.`);
  });

  test(`${locale}: pickup positions stay consistent in findings, evidence and downloaded reports`, async ({
    page,
  }) => {
    await page.getByRole('combobox', { name: 'Sprache' }).selectOption(locale);
    const m = WORKBENCH_MESSAGES[locale],
      report = REPORT_MESSAGES[locale];
    const parts = {
      soprano: 'C4/4 | C4/2 D4/2',
      alto: 'E4/4 | E4/2 F4/2',
      tenor: 'G3/4 | G3/2 A3/2',
      bass: 'C3/4 | C3/2 D3/2',
    };
    for (const [voice, source] of Object.entries(parts))
      await page.getByRole('textbox', { name: report.voices[voice], exact: true }).fill(source);
    await page
      .getByRole('textbox', { name: m.settings, exact: true })
      .fill('{"rules":{"voice-crossing":"error"}}');
    await page.getByRole('button', { name: m.analyze, exact: true }).click();
    await expect(page.locator('.finding')).toHaveCount(3);
    const first = page.locator('#finding-1');
    const pickup = `${report.measure} 0 (${report.pickup}) · ${report.beginning}`;
    await expect(first.locator('summary')).toContainText(pickup);
    await first.locator('summary').click();
    await expect(first.locator('caption')).toHaveText(`${report.destination} · ${pickup}`);
    await expect(first.getByRole('cell', { name: '0', exact: true })).toHaveCount(2);
    await expect(page.locator('#finding-2 > summary')).toContainText(
      `${report.measure} 1 · ${report.beginning}`,
    );
    await expect(page.locator('#finding-3 > summary')).toContainText(
      `${report.measure} 1 · ${report.offset} 1/2`,
    );
    await page.getByText(report.scoreDescription, { exact: true }).click();
    await expect(
      page.getByText(new RegExp(`${report.voices.soprano} · ${report.measure} 0`)),
    ).toBeVisible();
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: m.export, exact: true }).click();
    const download = await pending;
    const saved = await readFile(await download.path(), 'utf8');
    expect(saved).toContain(`<span>${pickup}</span>`);
    expect(saved).not.toContain('<script');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });

  test(`${locale}: keyboard, embedded font, local computation and accessibility`, async ({
    page,
  }) => {
    await page.getByRole('combobox', { name: 'Sprache' }).selectOption(locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('16px ReviewBravura'))).toBe(true);
    const first = page.locator('#finding-1 > summary');
    await first.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#finding-1')).toHaveAttribute('open', '');
    await expect(page.locator('#finding-1 table')).toHaveCount(2);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test('edits invalidate old findings; correction, invalid input and recovery use current notation', async ({
  page,
}) => {
  const m = WORKBENCH_MESSAGES['de-DE'];
  const soprano = page.getByRole('textbox', { name: 'Sopran', exact: true });
  await soprano.fill('E4/2 F4/2 | B3/2 C4/2');
  await expect(page.locator('.finding')).toHaveCount(0);
  await expect(page.getByRole('button', { name: m.export })).toBeDisabled();
  await expect(page.locator('#check-status')).toHaveText(m.pending);
  await page.getByRole('button', { name: m.analyze }).click();
  await expect(page.locator('.finding')).toHaveCount(2);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: m.export }).click();
  const downloaded = await downloadPromise;
  const report = await readFile(await downloaded.path(), 'utf8');
  expect(report).toContain('id="finding-2"');
  expect(report).not.toContain('id="finding-3"');
  expect(report).not.toMatch(/<script/iu);
  expect(report).toContain(REPORT_MESSAGES['de-DE'].draft);
  await soprano.fill('E4/4 | B3/2 C4/2');
  await page.getByRole('button', { name: m.analyze }).click();
  await expect(page.getByRole('alert')).toContainText(m.invalid);
  await expect(page.locator('.finding')).toHaveCount(0);
  await expect(page.getByRole('button', { name: m.export })).toBeDisabled();
  await soprano.fill(STARTER_DRAFT.parts.soprano);
  await page.getByRole('button', { name: m.analyze }).click();
  await expect(page.locator('.finding')).toHaveCount(3);
  await expect(page.getByRole('alert')).toBeEmpty();
});

test('unfinished input downloads and reloads; malformed or oversized imports preserve input', async ({
  page,
}) => {
  const m = WORKBENCH_MESSAGES['de-DE'];
  const soprano = page.getByRole('textbox', { name: 'Sopran', exact: true });
  await soprano.fill('');
  await page.getByRole('textbox', { name: m.settings, exact: true }).fill('{ unfinished');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: m.save }).click();
  const download = await downloadPromise;
  const bytes = await readFile(await download.path());
  const saved = JSON.parse(bytes.toString('utf8'));
  expect(saved.parts.soprano).toBe('');
  expect(saved.settings).toBe('{ unfinished');
  await soprano.fill('C4/1');
  await page
    .getByLabel(m.load)
    .setInputFiles({ name: 'draft.json', mimeType: 'application/json', buffer: bytes });
  await expect(soprano).toHaveValue('');
  await expect(page.locator('#check-status')).toHaveText(m.loaded);
  await soprano.fill('D4/1');
  for (const text of ['{"format":"other"}', 'x'.repeat(MAX_DRAFT_BYTES + 1)]) {
    await page
      .getByLabel(m.load)
      .setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(text) });
    await expect(page.getByRole('alert')).toContainText(m.loadError);
    await expect(soprano).toHaveValue('D4/1');
  }
  await page.getByLabel(m.load).setInputFiles({
    name: 'starter.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(STARTER_DRAFT)),
  });
  await expect(soprano).toHaveValue(STARTER_DRAFT.parts.soprano);
  await page.getByRole('button', { name: m.analyze }).click();
  await expect(page.locator('.finding')).toHaveCount(3);
});

test('empty rule selection is explicit, imported text stays text, and narrow layout fits', async ({
  page,
}) => {
  const m = WORKBENCH_MESSAGES['de-DE'];
  const draft = structuredClone(STARTER_DRAFT);
  draft.title = '</h2><img src="https://example.invalid/attack" onerror="alert(1)">';
  draft.settings = '{"rules":{}}';
  await page.getByLabel(m.load).setInputFiles({
    name: 'own.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(draft)),
  });
  await expect(page.locator('#check-status')).toHaveText(m.loaded);
  await page.getByRole('button', { name: m.analyze }).click();
  await expect(page.getByRole('heading', { name: draft.title, exact: true })).toBeVisible();
  await expect(page.locator('img')).toHaveCount(0);
  await expect(page.locator('.empty')).toHaveText(REPORT_MESSAGES['de-DE'].noRules);
  // Breite Schrift erzwingen: der Überlauf zeigte sich nur mit der CI-Standardschrift.
  await page.addStyleTag({ content: '*{font-family:"DejaVu Sans",sans-serif !important}' });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

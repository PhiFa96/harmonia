import { test, expect } from '@playwright/test';
import { createI18n } from '../../packages/i18n/src/index.ts';
import { onboard, audit, noOverflow, copy } from './helpers.mjs';

for (const locale of ['de-DE', 'en-US', 'en-GB']) {
  test(`${locale}: silent PCM stays unanswered through retries until the user explicitly skips`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale, viewport: { width: 390, height: 900 } });
    const page = await context.newPage(),
      errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const fixture = { opens: 0, stops: 0 };
      window.choirNoPitch = fixture;
      navigator.mediaDevices.getUserMedia = async () => {
        fixture.opens++;
        const audio = new AudioContext();
        await audio.resume();
        const oscillator = audio.createOscillator(),
          gain = audio.createGain(),
          destination = audio.createMediaStreamDestination();
        // Live transport with exact zero PCM. The production analyser and tracker remain unchanged.
        gain.gain.value = 0;
        oscillator.connect(gain).connect(destination);
        oscillator.start();
        const track = destination.stream.getAudioTracks()[0],
          stop = track.stop.bind(track);
        let closed = false;
        track.stop = () => {
          if (closed) return;
          closed = true;
          fixture.stops++;
          oscillator.stop();
          void audio.close();
          stop();
        };
        return destination.stream;
      };
    });
    try {
      const labels = createI18n(locale.startsWith('de') ? 'de' : locale);
      await onboard(page, locale);
      await page.goto('/choir');
      await page.getByTestId('choir-start-aural.l4.choir.soprano.lesson').click();
      await page
        .getByRole('button', { name: labels.t('lesson.start', { count: 2 }), exact: true })
        .click();
      const trainer = page.getByTestId('choir-trainer');
      await trainer
        .getByRole('button', { name: labels.t('exercise.choirHeadphones'), exact: true })
        .click();
      for (let attempt = 1; attempt <= 2; attempt++) {
        await page.getByTestId('choir-start').click();
        await expect(page.getByTestId('choir-status')).toContainText(
          locale.startsWith('de') ? 'Vorzähler' : 'Count-in',
        );
        await expect(trainer).toContainText(labels.t('exercise.choirNoPitchTake'), {
          timeout: 25000,
        });
        await expect(
          page.getByRole('button', { name: copy(locale).check, exact: true }),
        ).toBeDisabled();
        await expect(page.getByTestId('choir-results')).toHaveCount(0);
        await expect(page.getByText('1 / 2', { exact: true })).toBeVisible();
        await expect(page.getByTestId('choir-start')).toHaveText(labels.t('exercise.choirRetry'));
        await expect(page.getByTestId('choir-start')).toBeEnabled();
        await expect.poll(() => page.evaluate(() => window.choirNoPitch.stops)).toBe(attempt);
      }
      expect(await page.evaluate(() => window.choirNoPitch.opens)).toBe(2);
      await audit(page);
      await noOverflow(page);
      await page.getByRole('button', { name: labels.t('voice.skip'), exact: true }).click();
      await expect(page.getByText('2 / 2', { exact: true })).toBeVisible();
      await expect(page.getByTestId('choir-results')).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: copy(locale).check, exact: true }),
      ).toBeDisabled();
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

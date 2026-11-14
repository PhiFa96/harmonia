import { test, expect } from '@playwright/test';
import { createI18n } from '../../packages/i18n/src/index.ts';
import { onboard, audit, noOverflow, copy } from './helpers.mjs';

for (const [locale, ratio] of [
  ['de-DE', 0.98],
  ['en-US', 1.02],
  ['en-GB', 1.02],
])
  test(`${locale}: real browser PCM survives capture-clock drift and recovers from playback-clock rewind`, async ({
    browser,
  }, info) => {
    const context = await browser.newContext({ locale, viewport: { width: 390, height: 900 } }),
      page = await context.newPage(),
      errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(
      ({ ratio }) => {
        const fixture = {
          active: false,
          scheduled: false,
          rewind: false,
          opens: 0,
          stops: 0,
          reads: 0,
          playback: null,
          mic: null,
          oscillator: null,
        };
        window.choirClockFixture = fixture;
        const snapshots = new WeakSet();
        let prototype = AudioContext.prototype,
          descriptor;
        while (prototype && !descriptor) {
          descriptor = Object.getOwnPropertyDescriptor(prototype, 'currentTime');
          prototype = Object.getPrototypeOf(prototype);
        }
        const readTime = descriptor.get;
        Object.defineProperty(AudioContext.prototype, 'currentTime', {
          configurable: true,
          get() {
            const now = readTime.call(this);
            if (snapshots.has(this)) {
              fixture.reads++;
              return 12000 + now * ratio;
            }
            return now - (fixture.rewind && this === fixture.playback ? 1 : 0);
          },
        });
        const source = AudioContext.prototype.createMediaStreamSource;
        AudioContext.prototype.createMediaStreamSource = function (...args) {
          snapshots.add(this);
          return source.apply(this, args);
        };
        navigator.mediaDevices.getUserMedia = async () => {
          fixture.opens++;
          const mic = new AudioContext();
          await mic.resume();
          const oscillator = mic.createOscillator(),
            gain = mic.createGain(),
            destination = mic.createMediaStreamDestination();
          gain.gain.value = 0.22;
          oscillator.frequency.value = 523.251131;
          oscillator.connect(gain).connect(destination);
          oscillator.start();
          Object.assign(fixture, { active: true, scheduled: false, mic, oscillator });
          const track = destination.stream.getAudioTracks()[0],
            stop = track.stop.bind(track);
          let closed = false;
          track.stop = () => {
            if (closed) return;
            closed = true;
            fixture.active = false;
            fixture.stops++;
            oscillator.stop();
            void mic.close();
            stop();
          };
          return destination.stream;
        };
        const start = AudioBufferSourceNode.prototype.start;
        AudioBufferSourceNode.prototype.start = function (when, ...args) {
          if (fixture.active && !fixture.scheduled) {
            fixture.scheduled = true;
            fixture.playback = this.context;
            const bpm = Number(
                document
                  .querySelector('[data-testid="choir-trainer"]')
                  .textContent.match(/(60|72|80) BPM/)[1],
              ),
              at = fixture.mic.currentTime + when - this.context.currentTime;
            [72, 72, 72, 74, 74, 76, 71, 72].forEach((pitch, index) => {
              fixture.oscillator.frequency.setValueAtTime(
                440 * 2 ** ((pitch - 69) / 12),
                at + (index * 120) / bpm,
              );
            });
          }
          return start.call(this, when, ...args);
        };
      },
      { ratio },
    );
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
      await page.getByTestId('choir-start').click();
      await expect(page.getByTestId('choir-status')).toContainText(
        labels.t('exercise.choirCountIn', { beat: 1 }),
      );
      await page.evaluate(() => {
        window.choirClockFixture.rewind = true;
      });
      await expect(trainer).toContainText(labels.t('exercise.choirTimingFailed'));
      await expect(
        page.getByRole('button', { name: copy(locale).check, exact: true }),
      ).toBeDisabled();
      await expect(page.getByTestId('choir-results')).toHaveCount(0);
      await expect.poll(() => page.evaluate(() => window.choirClockFixture.stops)).toBe(1);
      await audit(page);
      await noOverflow(page);
      await page.evaluate(() => {
        window.choirClockFixture.rewind = false;
      });
      await expect(page.getByTestId('choir-start')).toHaveText(labels.t('exercise.choirRetry'));
      await page.getByTestId('choir-start').click();
      await expect(page.getByTestId('choir-status')).toHaveText(labels.t('exercise.choirDone'), {
        timeout: 25000,
      });
      await expect.poll(() => page.evaluate(() => window.choirClockFixture.stops)).toBe(2);
      expect(await page.evaluate(() => window.choirClockFixture.opens)).toBe(2);
      expect(await page.evaluate(() => window.choirClockFixture.reads)).toBeGreaterThan(100);
      await page.getByRole('button', { name: copy(locale).check, exact: true }).click();
      await expect(
        page
          .getByTestId('choir-results')
          .getByText(labels.t('exercise.choirPass'), { exact: true }),
      ).toHaveCount(8);
      await expect(page.getByTestId(/^choir-window-\d+-\d+$/)).toHaveCount(96);
      await audit(page);
      await noOverflow(page);
      expect(errors).toEqual([]);
      await page.screenshot({ path: info.outputPath(`choir-clock-${locale}.png`), fullPage: true });
    } finally {
      await context.close();
    }
  });

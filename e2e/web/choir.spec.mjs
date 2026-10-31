import { test, expect } from '@playwright/test';
import { onboard, audit, noOverflow, copy } from './helpers.mjs';
import { createI18n, createContentI18n } from '../../packages/i18n/src/index.ts';
import authored from '../../packages/i18n/src/authored-content.json' with { type: 'json' };
import catalogue from '../../packages/content/src/catalogue.json' with { type: 'json' };

for (const locale of ['de-DE', 'en-US', 'en-GB']) {
  test(`${locale}: choir path lists each voice's foundations and guards direct links`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale, viewport: { width: 390, height: 900 } });
    const page = await context.newPage();
    const language = locale.startsWith('de') ? 'de' : locale;
    const labels = createI18n(language),
      text = createContentI18n(language, authored);
    try {
      await onboard(page, locale);
      await page
        .getByRole('button', { name: labels.t('path.level', { level: 4 }), exact: true })
        .click();
      const unit = page.getByTestId('lesson-group-aural.l4.choir');
      await expect(
        unit.getByText(labels.t('path.independentLessons'), { exact: true }),
      ).toBeVisible();
      await unit
        .getByRole('button', {
          name: labels.t('path.showNamed', { title: text.t('content.choir.title') }),
          exact: true,
        })
        .click();
      for (const [voice, reading] of [
        ['soprano', 'notation.l1.staff'],
        ['alto', 'notation.l1.staff'],
        ['tenor', 'notation.l2.clefs-registers'],
        ['bass', 'notation.l2.clefs-registers'],
      ]) {
        const row = page.getByTestId(`path-lesson-aural.l4.choir.${voice}.lesson`);
        const signatureReading = catalogue.units.find(
          (unit) => unit.id === 'scales.l2.key-reading',
        );
        if (!signatureReading) throw Error('Missing key-signature reading prerequisite');
        await expect(
          row.getByRole('button', {
            name: labels.t('path.prerequisite', { title: text.t(signatureReading.titleKey) }),
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          row.getByRole('button', {
            name: labels.t('lesson.openNamed', { title: text.t(`content.choir.${voice}`) }),
            exact: true,
          }),
        ).toBeDisabled();
        const prerequisite = catalogue.units.find((unit) => unit.id === reading);
        if (!prerequisite) throw Error('Missing reading prerequisite');
        await expect(
          row.getByRole('button', {
            name: labels.t('path.prerequisite', { title: text.t(prerequisite.titleKey) }),
            exact: true,
          }),
        ).toBeVisible();
      }
      await audit(page);
      await noOverflow(page);
      const reading = catalogue.units.find((unit) => unit.id === 'notation.l2.clefs-registers');
      await page
        .getByTestId('path-lesson-aural.l4.choir.bass.lesson')
        .getByRole('button', {
          name: labels.t('path.prerequisite', { title: text.t(reading.titleKey) }),
          exact: true,
        })
        .click();
      await expect(page.getByTestId('lesson-group-notation.l2.clefs-registers')).toBeVisible();
      await page.goto('/lesson?id=aural.l4.choir.bass.lesson');
      await expect(page.getByRole('alert')).toHaveText(labels.t('path.independentLessonLocked'));
      await expect(page.getByTestId('choir-trainer')).toHaveCount(0);
      await expect(page.getByTestId('lesson-example-scroll')).toHaveCount(0);
      await page.goto('/lesson?id=aural.l4.choir.soprano.lesson');
      await expect(page.getByRole('alert')).toHaveText(labels.t('path.independentLessonLocked'));
      await expect(page.getByTestId('choir-trainer')).toHaveCount(0);
      await expect(page.getByTestId('lesson-example-scroll')).toHaveCount(0);
      await audit(page);
      await noOverflow(page);
    } finally {
      await context.close();
    }
  });
}

async function startWithIntroduction(page, voice, locale) {
  const labels = createI18n(locale.startsWith('de') ? 'de' : locale);
  await page.getByTestId(`choir-start-aural.l4.choir.${voice}.lesson`).click();
  await expect(page.getByTestId('lesson-example-scroll').getByRole('img')).toHaveCount(8);
  await expect(page.getByTestId('choir-trainer')).toHaveCount(0);
  await page
    .getByRole('button', { name: labels.t('lesson.start', { count: 2 }), exact: true })
    .click();
}

for (const locale of ['de-DE', 'en-US', 'en-GB']) {
  test(`${locale}: four choir introductions show both complete parts with local terms and audio`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale, viewport: { width: 390, height: 900 } });
    const page = await context.newPage();
    const language = locale.startsWith('de') ? 'de' : locale;
    const labels = createI18n(language),
      text = createContentI18n(language, authored);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      window.choirIntroAudio = { starts: 0, stops: 0, microphone: 0 };
      navigator.mediaDevices.getUserMedia = async () => {
        window.choirIntroAudio.microphone++;
        throw new Error('The introduction must not request a microphone');
      };
      // The shared player starts with its synthesizer while piano samples load.
      for (const prototype of [AudioBufferSourceNode.prototype, OscillatorNode.prototype]) {
        const start = prototype.start,
          stop = prototype.stop;
        prototype.start = function (...args) {
          window.choirIntroAudio.starts++;
          return start.apply(this, args);
        };
        prototype.stop = function (...args) {
          window.choirIntroAudio.stops++;
          return stop.apply(this, args);
        };
      }
    });
    try {
      await onboard(page, locale);
      await page.goto('/choir');
      for (const voice of ['soprano', 'alto', 'tenor', 'bass']) {
        await page.getByTestId(`choir-start-aural.l4.choir.${voice}.lesson`).click();
        const score = page.getByTestId('lesson-example-scroll');
        await expect(score.getByRole('img')).toHaveCount(8);
        await expect(page.getByTestId('choir-trainer')).toHaveCount(0);
        for (const piece of ['Home', 'Arch']) {
          const caption = text.t(`content.choir.${voice}${piece}Caption`);
          await expect(page.getByRole('button', { name: caption, exact: true })).toBeVisible();
          expect(caption).toContain(
            language === 'de'
              ? 'acht halbe Noten'
              : language === 'en-GB'
                ? 'eight minims'
                : 'eight half notes',
          );
          if (piece === 'Arch')
            await page.getByRole('button', { name: caption, exact: true }).click();
          await expect(score.getByRole('img')).toHaveCount(8);
        }
        await expect(page.getByText(/\$t\(|glossary:/)).toHaveCount(0);
        if (voice === 'tenor') {
          const before = await page.evaluate(() => window.choirIntroAudio.starts);
          await page.getByRole('button', { name: labels.t('lesson.example'), exact: true }).click();
          await expect
            .poll(() => page.evaluate(() => window.choirIntroAudio.starts))
            .toBeGreaterThanOrEqual(before + 8);
          await expect(
            page.getByRole('button', { name: labels.t('exercise.stop'), exact: true }),
          ).toBeVisible();
        }
        await audit(page);
        await noOverflow(page);
        await page.getByRole('button', { name: labels.t('lesson.home'), exact: true }).click();
        await expect(score).toHaveCount(0);
      }
      expect(await page.evaluate(() => window.choirIntroAudio.microphone)).toBe(0);
      expect(await page.evaluate(() => window.choirIntroAudio.stops)).toBeGreaterThanOrEqual(8);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

for (const locale of ['de-DE', 'en-US', 'en-GB']) {
  test(`${locale} choir draft: all parts, headphones gate, denied microphone and accessible skip`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      locale,
      viewport: { width: locale === 'en-US' ? 1280 : 390, height: 900 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        throw new DOMException('Denied', 'NotAllowedError');
      };
    });
    try {
      await onboard(page, locale);
      await page.goto('/choir');
      for (const voice of ['soprano', 'alto', 'tenor', 'bass'])
        await expect(page.getByTestId(`choir-start-aural.l4.choir.${voice}.lesson`)).toBeVisible();
      await startWithIntroduction(page, 'tenor', locale);
      const trainer = page.getByTestId('choir-trainer');
      await expect(trainer).toContainText(
        locale.startsWith('de') ? 'Interner Entwurf' : 'Internal draft',
      );
      await expect(page.getByTestId('choir-start')).toBeDisabled();
      await trainer
        .getByRole('button', {
          name: locale.startsWith('de')
            ? 'Ich trage Kopfhörer und höre die Begleitung darin'
            : 'I am wearing headphones and hear the accompaniment through them',
          exact: true,
        })
        .click();
      await page.getByTestId('choir-start').click();
      await expect(trainer).toContainText(locale.startsWith('de') ? 'verweigert' : 'denied');
      await expect(
        page.getByRole('button', { name: copy(locale).check, exact: true }),
      ).toBeDisabled();
      await audit(page);
      await noOverflow(page);
      await page
        .getByRole('button', {
          name: locale.startsWith('de')
            ? 'Diese Mikrofonaufgabe überspringen'
            : 'Skip this microphone exercise',
          exact: true,
        })
        .click();
      await expect(page.getByText('2 / 2', { exact: true })).toBeVisible();
      await expect(page.getByTestId('choir-key')).toHaveText(
        createI18n(locale.startsWith('de') ? 'de' : locale).t('exercise.choirKey', {
          key: locale.startsWith('de') ? 'D-Dur' : 'D major',
        }),
      );
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test('choir real browser audio pipeline: synthetic singing, per-note results, repeat, stop and navigation', async ({
  page,
}, info) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const fixture = {
      active: false,
      scheduled: false,
      starts: 0,
      stops: 0,
      oscillator: null,
      mic: null,
    };
    window.choirFixture = fixture;
    // A real MediaStream supplies PCM to the unmodified analyser and pitch detector.
    navigator.mediaDevices.getUserMedia = async () => {
      const mic = new AudioContext();
      await mic.resume();
      const oscillator = mic.createOscillator(),
        gain = mic.createGain(),
        destination = mic.createMediaStreamDestination();
      gain.gain.value = 0.22;
      oscillator.frequency.value = 329.627557;
      oscillator.connect(gain).connect(destination);
      oscillator.start();
      Object.assign(fixture, { active: true, scheduled: false, oscillator, mic });
      const track = destination.stream.getAudioTracks()[0],
        originalStop = track.stop.bind(track);
      track.stop = () => {
        fixture.stops++;
        fixture.active = false;
        oscillator.stop();
        void mic.close();
        originalStop();
      };
      return destination.stream;
    };
    const originalStart = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (when, ...args) {
      if (fixture.active) {
        fixture.starts++;
        if (!fixture.scheduled) {
          fixture.scheduled = true;
          const bpm = Number(
            document
              .querySelector('[data-testid="choir-trainer"]')
              .textContent.match(/(60|72|80) BPM/)[1],
          );
          const start = fixture.mic.currentTime + when - this.context.currentTime;
          const pitches = document
            .querySelector('[data-testid="choir-key"]')
            .textContent.includes('D-Dur')
            ? [66, 66, 67, 66, 64, 67, 66, 66]
            : [64, 67, 65, 65, 62, 62, 64, 64];
          pitches.forEach((pitch, index) =>
            fixture.oscillator.frequency.setValueAtTime(
              440 * 2 ** ((pitch - 69) / 12),
              start + (index * 120) / bpm,
            ),
          );
        }
      }
      return originalStart.call(this, when, ...args);
    };
  });
  await onboard(page, 'de-DE');
  await page.goto('/choir');
  await startWithIntroduction(page, 'soprano', 'de-DE');
  await expect(page.getByTestId('choir-key')).toHaveText('Tonart: C-Dur');
  await page
    .getByRole('button', { name: 'Ich trage Kopfhörer und höre die Begleitung darin', exact: true })
    .click();
  await page.getByTestId('choir-start').click();
  await expect(page.getByTestId('choir-status')).toContainText('Vorzähler');
  await expect(page.getByTestId('choir-status')).toContainText('Durchlauf beendet', {
    timeout: 25000,
  });
  await expect.poll(() => page.evaluate(() => window.choirFixture.stops)).toBe(1);
  await expect(page.getByTestId(/^choir-window-\d+-\d+$/)).toHaveCount(0);
  expect(await page.evaluate(() => window.choirFixture.starts)).toBe(24);
  await page.getByRole('button', { name: 'Prüfen', exact: true }).click();
  await expect(
    page.getByTestId('choir-results').getByText('Getroffen', { exact: true }),
  ).toHaveCount(8);
  await expect(page.getByTestId(/^choir-window-\d+-\d+$/)).toHaveCount(96);
  await expect(page.getByTestId(/^choir-window-counts-\d+$/)).toHaveCount(8);
  await page.setViewportSize({ width: 390, height: 900 });
  await audit(page);
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath('choir-per-note-results.png'), fullPage: true });
  await page.getByTestId('exercise-next').click();
  await expect(page.getByTestId(/^choir-window-\d+-\d+$/)).toHaveCount(0);
  await expect(page.getByTestId('choir-key')).toHaveText('Tonart: D-Dur');
  await page
    .getByRole('button', { name: 'Ich trage Kopfhörer und höre die Begleitung darin', exact: true })
    .click();
  await page.getByTestId('choir-start').click();
  await expect(page.getByTestId('choir-status')).toContainText('Vorzähler');
  await page.getByRole('button', { name: 'Abbrechen', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.choirFixture.stops)).toBe(2);
  await expect(page.getByRole('button', { name: 'Prüfen', exact: true })).toBeDisabled();
  await page.getByTestId('choir-start').click();
  await expect(page.getByTestId('choir-status')).toContainText('Vorzähler');
  await expect(page.getByTestId('choir-status')).toContainText('Durchlauf beendet', {
    timeout: 25000,
  });
  await expect.poll(() => page.evaluate(() => window.choirFixture.stops)).toBe(3);
  await page.getByRole('button', { name: 'Prüfen', exact: true }).click();
  await expect(
    page.getByTestId('choir-results').getByText('Getroffen', { exact: true }),
  ).toHaveCount(8);
  await expect(page.getByTestId(/^choir-window-\d+-\d+$/)).toHaveCount(96);
  await audit(page);
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath('choir-transposed-results.png'), fullPage: true });
  await page.getByRole('button', { name: 'Zurück zum Lernen', exact: true }).click();
  await startWithIntroduction(page, 'soprano', 'de-DE');
  await page
    .getByRole('button', { name: 'Ich trage Kopfhörer und höre die Begleitung darin', exact: true })
    .click();
  await page.getByTestId('choir-start').click();
  await expect(page.getByTestId('choir-status')).toContainText('Vorzähler');
  await page.getByRole('button', { name: 'Zurück zum Lernen', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.choirFixture.stops)).toBe(4);
  expect(errors).toEqual([]);
});

for (const locale of ['de-DE', 'en-US', 'en-GB']) {
  test(`${locale} missing input and later capture loss never create a graded answer`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale, viewport: { width: 390, height: 900 } });
    const page = await context.newPage(),
      errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const fixture = { hold: true, active: false, starts: 0, stops: 0 };
      window.choirMissingInput = fixture;
      navigator.mediaDevices.getUserMedia = async () => {
        const audio = new AudioContext();
        await audio.resume();
        const oscillator = audio.createOscillator(),
          destination = audio.createMediaStreamDestination();
        oscillator.connect(destination);
        oscillator.start();
        fixture.active = true;
        const track = destination.stream.getAudioTracks()[0],
          originalStop = track.stop.bind(track);
        Object.defineProperty(track, 'muted', { get: () => fixture.hold });
        let closed = false;
        track.stop = () => {
          if (closed) return;
          closed = true;
          fixture.stops++;
          fixture.active = false;
          oscillator.stop();
          void audio.close();
          originalStop();
        };
        return destination.stream;
      };
      const originalStart = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...args) {
        if (fixture.active) fixture.starts++;
        return originalStart.apply(this, args);
      };
    });
    try {
      await onboard(page, locale);
      await page.goto('/choir');
      await startWithIntroduction(page, 'soprano', locale);
      const trainer = page.getByTestId('choir-trainer');
      await trainer
        .getByRole('button', {
          name: locale.startsWith('de')
            ? 'Ich trage Kopfhörer und höre die Begleitung darin'
            : 'I am wearing headphones and hear the accompaniment through them',
          exact: true,
        })
        .click();
      await page.getByTestId('choir-start').click();
      await expect(page.getByTestId('choir-status')).toContainText(
        locale.startsWith('de') ? 'Mikrofoneingang wird geprüft' : 'Checking microphone input',
      );
      await expect(trainer).toContainText(
        locale.startsWith('de') ? 'keine Audiodaten' : 'No audio data',
        { timeout: 10000 },
      );
      expect(await page.evaluate(() => window.choirMissingInput.starts)).toBe(0);
      await expect.poll(() => page.evaluate(() => window.choirMissingInput.stops)).toBe(1);
      await expect(
        page.getByRole('button', { name: copy(locale).check, exact: true }),
      ).toBeDisabled();
      await audit(page);
      await page.evaluate(() => {
        window.choirMissingInput.hold = false;
      });
      await page.getByTestId('choir-start').click();
      await expect(page.getByTestId('choir-status')).toContainText(
        locale.startsWith('de') ? 'Vorzähler' : 'Count-in',
      );
      expect(await page.evaluate(() => window.choirMissingInput.starts)).toBe(24);
      await page.evaluate(() => {
        window.choirMissingInput.hold = true;
      });
      await expect(trainer).toContainText(locale.startsWith('de') ? 'unterbrochen' : 'interrupted');
      await expect.poll(() => page.evaluate(() => window.choirMissingInput.stops)).toBe(2);
      await expect(
        page.getByRole('button', { name: copy(locale).check, exact: true }),
      ).toBeDisabled();
      await expect(page.getByTestId('choir-results')).toHaveCount(0);
      await page
        .getByRole('button', {
          name: locale.startsWith('de')
            ? 'Diese Mikrofonaufgabe überspringen'
            : 'Skip this microphone exercise',
          exact: true,
        })
        .click();
      await expect(page.getByText('2 / 2', { exact: true })).toBeVisible();
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

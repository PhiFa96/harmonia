import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createCertificateServer } from '../../tools/certificates/server.mjs';
import {
  createCertificateTestServer,
  createCertificateTestService,
  startFixture,
} from '../../tools/certificates/test-fixture.mjs';
import { certificateTranslator } from '../../packages/i18n/src/certificate-draft.ts';

async function ownerOf(page, origin) {
  const cookie = (await page.context().cookies(origin)).find(
    (c) => c.name === 'harmonia_certificate_draft',
  );
  return createHash('sha256').update(cookie.value).digest('hex');
}

for (const locale of ['de', 'en-US', 'en-GB']) {
  test(`${locale}: default preview denies payment controls and keeps historical test data erasable`, async ({
    page,
  }, info) => {
    const dir = mkdtempSync(join(tmpdir(), 'harmonia-cert-payments-closed-')),
      database = join(dir, 'test.sqlite'),
      app = await createCertificateServer({ database }),
      t = certificateTranslator(locale);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(app.origin);
      await page.getByRole('combobox').selectOption(locale);
      await expect(page.getByText(t('paymentsUnavailable'), { exact: true })).toBeVisible();
      for (const action of ['start', 'payAndStart', 'startPaid', 'refund'])
        await expect(page.getByRole('button', { name: t(action), exact: true })).toHaveCount(0);
      const owner = await ownerOf(page, app.origin),
        service = createCertificateTestService(database);
      let run;
      try {
        run = startFixture(service, owner, { profile: 'certificate-draft-1', locale });
      } finally {
        service.close();
      }
      await page.goto(app.origin + '/#' + run.id);
      await expect(
        page.getByRole('heading', { name: t('paymentsUnavailableTitle') }),
      ).toBeVisible();
      await expect(page.getByRole('radio')).toHaveCount(0);
      for (const action of ['answer', 'submit', 'download', 'refund'])
        await expect(page.getByRole('button', { name: t(action), exact: true })).toHaveCount(0);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      const downloadEvent = page.waitForEvent('download');
      await page.getByRole('button', { name: t('exportData'), exact: true }).click();
      const download = await downloadEvent,
        path = info.outputPath('closed-test-data.json');
      await download.saveAs(path);
      const exported = JSON.parse(readFileSync(path, 'utf8'));
      expect(exported.paymentMode).toBe('unavailable');
      expect(exported.attempts[0].phase).toBe('unavailable');
      expect(exported.attempts[0].id).toBe(run.id);
      expect(exported.attempts[0].result).toBeNull();
      expect(JSON.stringify(exported)).not.toMatch(/"seed"|correctAnswer|"owner"/);
      page.once('dialog', (dialog) => dialog.accept());
      await page.getByRole('button', { name: t('remove'), exact: true }).click();
      await expect(page.getByRole('heading', { name: t('history') })).toBeVisible();
      await expect(page.getByRole('button', { name: t('resume'), exact: true })).toHaveCount(0);
      page.once('dialog', (dialog) => dialog.accept());
      await page.getByRole('button', { name: t('erase'), exact: true }).click();
      await expect(page.getByRole('heading', { name: t('sessionEnded') })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(errors).toEqual([]);
      await page.screenshot({ path: info.outputPath(`payments-closed-${locale}.png`) });
    } finally {
      await app.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test(`${locale}: explicit simulation isolates legacy orders and uses only simulation payment routes`, async ({
    page,
  }, info) => {
    const dir = mkdtempSync(join(tmpdir(), 'harmonia-cert-payments-enabled-')),
      database = join(dir, 'test.sqlite'),
      app = await createCertificateTestServer({ database }),
      t = certificateTranslator(locale),
      requests = [];
    page.on('request', (request) => {
      if (request.method() === 'POST') requests.push(new URL(request.url()).pathname);
    });
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(app.origin);
      await page.getByRole('combobox').selectOption(locale);
      await expect(page.getByText(t('paymentSimulationMode'), { exact: true })).toBeVisible();
      const owner = await ownerOf(page, app.origin),
        service = createCertificateTestService(database);
      let order;
      try {
        order = service.order(owner, {
          profile: 'certificate-draft-1',
          requestId: randomUUID(),
        });
      } finally {
        service.close();
      }
      const db = new DatabaseSync(database);
      try {
        db.prepare('update certificate_purchases set policy=? where id=?').run(
          'certificate-test-purchase-v1',
          order.id,
        );
      } finally {
        db.close();
      }
      await page.goto(app.origin + '/#order:' + order.id);
      await expect(page.getByText(t('paymentOrderOutdated'), { exact: true })).toBeVisible();
      for (const action of ['payAndStart', 'startPaid', 'refund', 'cancelPurchase'])
        await expect(page.getByRole('button', { name: t(action), exact: true })).toHaveCount(0);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.getByRole('button', { name: t('home'), exact: true }).click();
      await page
        .getByRole('button', { name: t('start'), exact: true })
        .first()
        .click();
      await expect(page.getByText(t('purchaseNotice'), { exact: true })).toBeVisible();
      await page.getByRole('button', { name: t('payAndStart'), exact: true }).click();
      await expect(
        page.getByRole('heading', { name: t('progress', { current: 1, total: 12 }) }),
      ).toBeVisible();
      expect(requests).toContain('/api/simulation/settle');
      expect(requests).not.toContain('/api/settle');
      expect(requests).not.toContain('/api/refund');
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({ path: info.outputPath(`payments-simulation-${locale}.png`) });
    } finally {
      await app.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

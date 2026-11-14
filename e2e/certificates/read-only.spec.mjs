import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createCertificateServer } from '../../tools/certificates/server.mjs';
import { certificateTranslator } from '../../packages/i18n/src/certificate-draft.ts';

function stored(database) {
  const db = new DatabaseSync(database, { readOnly: true });
  try {
    const data = ['certificate_drafts', 'certificate_purchases'].map((table) =>
      db.prepare(`select * from ${table} order by id`).all(),
    );
    return createHash('sha256').update(JSON.stringify(data)).digest('hex');
  } finally {
    db.close();
  }
}

for (const locale of ['de', 'en-US', 'en-GB'])
  test(`${locale}: timeout reload and data export are coherent without changing stored exam data`, async ({
    page,
  }) => {
    const directory = mkdtempSync(join(tmpdir(), 'harmonia-cert-readonly-web-'));
    const database = join(directory, 'draft.sqlite');
    let instant = Date.UTC(2026, 10, 14, 12);
    const app = await createCertificateServer({ database, now: () => instant });
    const t = certificateTranslator(locale),
      errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(app.origin);
      await page.getByRole('combobox').selectOption(locale);
      await page
        .getByRole('button', { name: t('start'), exact: true })
        .first()
        .click();
      await page.getByRole('button', { name: t('payAndStart'), exact: true }).click();
      await expect(
        page.getByRole('heading', { name: t('progress', { current: 1, total: 12 }) }),
      ).toBeVisible();
      const id = new URL(page.url()).hash.slice(1);
      const db = new DatabaseSync(database, { readOnly: true });
      const row = db.prepare('select * from certificate_drafts where id=?').get(id);
      db.close();
      const deadline = row.started + 20 * 60_000;
      instant = deadline;
      const before = stored(database);
      await page.reload();
      await expect(page.getByRole('heading', { name: t('result'), exact: true })).toBeVisible();
      await expect(page.getByText(t('timeout'), { exact: true })).toBeVisible();
      await expect(page.getByRole('radio')).toHaveCount(0);
      await expect(page.getByRole('button', { name: t('download'), exact: true })).toHaveCount(0);
      expect(stored(database)).toBe(before);
      const pending = page.waitForEvent('download');
      await page.getByRole('button', { name: t('exportData'), exact: true }).click();
      const download = await pending;
      const text = readFileSync(await download.path(), 'utf8');
      const exported = JSON.parse(text).attempts.find((attempt) => attempt.id === id);
      expect(exported.phase).toBe('finished');
      expect(exported.reason).toBe('timeout');
      expect(exported.finishedAt).toBe(deadline);
      expect(exported.result.issuedAt).toBe(deadline);
      expect(exported.result.code).toBe(null);
      expect(exported.result.points).toBe(0);
      expect(text).not.toContain(row.seed);
      expect(stored(database)).toBe(before);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.reload();
      await expect(page.getByText(t('timeout'), { exact: true })).toBeVisible();
      expect(stored(database)).toBe(before);
      expect(errors).toEqual([]);
    } finally {
      await app.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });

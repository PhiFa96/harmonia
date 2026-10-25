import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFileSync } from 'node:fs';
import { certificateTranslator } from '../../packages/i18n/src/certificate-draft.ts';
import { validLocale, DRAFT_CODE } from './service.mjs';

/** Receives only a receipt reloaded by the server for the cookie owner. */
export async function sampleCertificatePdf(receipt, locale) {
  validLocale(locale);
  if (
    receipt.status !== 'draft' ||
    !receipt.qualified ||
    !DRAFT_CODE.test(receipt.code) ||
    receipt.revoked
  )
    throw new Error('Sample receipt required');
  const t = certificateTranslator(locale);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(t('pdfTitle'));
  pdf.setSubject(t('draft'));
  pdf.setAuthor('Harmonia – internal draft');
  pdf.setCreationDate(new Date(receipt.issuedAt));
  pdf.setModificationDate(new Date(receipt.issuedAt));
  const page = pdf.addPage([595.28, 841.89]);
  // Embed the app's OFL-licensed font so exported samples do not depend on viewer fonts.
  const fontRoot = new URL(
    '../../apps/mobile/node_modules/@expo-google-fonts/figtree/',
    import.meta.url,
  );
  const font = await pdf.embedFont(
    readFileSync(new URL('400Regular/Figtree_400Regular.ttf', fontRoot)),
    { subset: true },
  );
  const bold = await pdf.embedFont(readFileSync(new URL('700Bold/Figtree_700Bold.ttf', fontRoot)), {
    subset: true,
  });
  page.drawText(t('pdfWarning'), {
    x: 65,
    y: 345,
    size: 46,
    font: bold,
    color: rgb(0.84, 0.84, 0.84),
    rotate: degrees(32),
  });
  let y = 775;
  const line = (text, size = 12, strong = false) => {
    page.drawText(text, {
      x: 42,
      y,
      size,
      font: strong ? bold : font,
      maxWidth: 510,
      lineHeight: 18,
    });
    y -= size > 15 ? 38 : 29;
  };
  line(t('pdfTitle'), 19, true);
  line(t('pdfWarning'), 16, true);
  line(t('pdfSubject'), 11);
  y -= 15;
  line(t('pdfStage', { stage: receipt.stage }), 18, true);
  line(t('points', { points: receipt.points, maximum: receipt.maxPoints }), 16);
  for (const area of receipt.areas)
    line(`${t(area.area)}: ${t('points', { points: area.points, maximum: area.maxPoints })}`);
  line(t('pdfVersion', { profile: receipt.profileVersion, content: receipt.contentVersion }), 10);
  line(t('pdfDate', { date: new Date(receipt.issuedAt).toISOString() }), 10);
  y -= 12;
  line(t('code'), 11, true);
  line(receipt.code, 12);
  line(t('pdfCheck'), 10);
  line(t('pdfRevocation'), 10);
  line(t('pdfExpiry'), 10);
  y -= 20;
  line(t('pdfNotice'), 11);
  line(t('pdfLegal'), 11);
  line(t('draft'), 10, true);
  return pdf.save({ useObjectStreams: false });
}

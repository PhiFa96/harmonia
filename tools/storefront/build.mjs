import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  COLORS,
  FONT_FAMILIES,
  SPACE,
  RADIUS,
  LAYOUT,
  TOUCH,
  TYPOGRAPHY,
  DURATION,
  ELEVATION,
} from '../../packages/ui/src/tokens.ts';
import {
  catalog,
  readiness,
  locales,
  pagePath,
  validateCatalog,
  validateConfig,
} from './model.mjs';
import { renderPage } from './render.mjs';
import { legalConfig } from '../../apps/mobile/src/legal/config.ts';
import { actualReleaseProblems } from './check.mjs';
export function buildSite(appRoot, { config = readiness, release = false } = {}) {
  validateCatalog(catalog);
  validateConfig(config);
  if (!statSync(join(appRoot, 'index.html')).isFile())
    throw Error('Build the actual Expo web app before adding the website');
  if (release) {
    const missing = actualReleaseProblems('website', null, config);
    if (missing.length) throw Error('Website release still open: ' + missing.join(', '));
  }
  const output = join(appRoot, 'about'),
    assets = join(output, 'assets');
  mkdirSync(assets, { recursive: true });
  const appRequire = createRequire(new URL('../../apps/mobile/package.json', import.meta.url));
  for (const [weight, folder] of [
    [400, '400Regular'],
    [600, '600SemiBold'],
    [800, '800ExtraBold'],
  ]) {
    copyFileSync(
      appRequire.resolve(`@expo-google-fonts/figtree/${folder}/Figtree_${folder}.ttf`),
      join(assets, `figtree-${weight}.ttf`),
    );
  }
  copyFileSync(
    appRequire.resolve('@expo-google-fonts/figtree/LICENSE_FONT'),
    join(assets, 'Figtree-OFL.txt'),
  );
  copyFileSync(
    new URL('../../docs/plan/bilder/logo-zeichen.svg', import.meta.url),
    join(assets, 'mark.svg'),
  );
  const colors = (scheme) =>
    Object.entries(COLORS[scheme])
      .map(([key, value]) => `--${key}:${value}`)
      .join(';');
  const shared = [
    ...Object.entries(SPACE).map(([key, value]) => `--space-${key}:${value}px`),
    ...Object.entries(RADIUS).map(([key, value]) => `--radius-${key}:${value}px`),
    ...Object.entries(TYPOGRAPHY).map(([key, value]) => `--${key}:${value.fontSize}px`),
    `--font:${FONT_FAMILIES.regular}`,
    `--touch:${TOUCH.min}px`,
    `--button-height:${TOUCH.buttonLarge}px`,
    `--page-padding:${LAYOUT.screenPadding}px`,
    `--content-width:${LAYOUT.maxContentWidth}px`,
    `--site-width:${LAYOUT.maxContentWidth * 2 + LAYOUT.screenPadding * 2}px`,
    `--duration:${DURATION.state}ms`,
    `--fade:${DURATION.fade}ms`,
  ].join(';');
  const fonts = [400, 600, 800]
    .map(
      (weight) =>
        `@font-face{font-family:${FONT_FAMILIES.regular};src:url('/about/assets/figtree-${weight}.ttf') format('truetype');font-weight:${weight};font-display:swap}`,
    )
    .join('\n');
  const css =
    `${fonts}\n:root{${shared};${colors('light')};--card-shadow:${ELEVATION.light.card}}\n@media(prefers-color-scheme:dark){:root{${colors('dark')};--card-shadow:none}}\n` +
    readFileSync(new URL('../../website/styles.css', import.meta.url), 'utf8');
  writeFileSync(join(output, 'styles.css'), css);
  for (const locale of locales)
    for (const support of [false, true])
      writeFileSync(
        join(appRoot, pagePath(locale, support)),
        renderPage(locale, config, { support, release, legalLinks: legalConfig() }),
      );
  if (release) {
    const urls = locales.flatMap((locale) =>
      [false, true].map((support) => new URL(pagePath(locale, support), config.publicOrigin).href),
    );
    writeFileSync(
      join(output, 'sitemap.xml'),
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>`,
    );
  }
  return output;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const at = process.argv.indexOf('--output');
  const root = resolve(
    at >= 0
      ? process.argv[at + 1]
      : fileURLToPath(new URL('../../apps/mobile/dist', import.meta.url)),
  );
  console.log(
    'Website added beside Expo app: ' +
      buildSite(root, { release: process.argv.includes('--release') }),
  );
}

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { writePrivateReport } from './voice-leading-report.mjs';
import { WORKBENCH_MESSAGES } from './voice-leading/workbench-messages.ts';
import { parseWorkbenchDraft, workbenchReportInput } from './voice-leading/workbench-model.ts';
import { renderVoiceLeadingReport } from './voice-leading/report.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const sample = JSON.parse(
  readFileSync(new URL('./voice-leading/example.json', import.meta.url), 'utf8'),
);
const { rules, options } = sample;
export const STARTER_DRAFT = parseWorkbenchDraft({
  format: 'harmonia-satb-draft-v1',
  title: sample.title,
  meter: '4/4',
  key: 'C',
  parts: {
    soprano: 'E4/2 F4/2 | B3/2 A3/2',
    alto: 'C4/1 | F3/2 E3/2',
    tenor: 'G3/2 A3/2 | D3/2 E3/2',
    bass: 'C3/2 D3/2 | G2/2 C3/2',
  },
  settings: JSON.stringify({ rules, options }, null, 2),
});

/** Einmal lokal bündeln, anschließend ohne Server oder Netz im Browser bearbeiten. */
export async function buildWorkbench(locale) {
  if (!Object.hasOwn(WORKBENCH_MESSAGES, locale)) throw new RangeError('Unsupported language');
  const fontRoot = new URL(
    '../packages/notation/node_modules/@vexflow-fonts/bravura/',
    import.meta.url,
  );
  const assets = {
    fontBase64: readFileSync(new URL('bravura.woff2', fontRoot)).toString('base64'),
    fontLicense: readFileSync(new URL('LICENSE.txt', fontRoot), 'utf8'),
  };
  renderVoiceLeadingReport(workbenchReportInput(STARTER_DRAFT), locale, assets);
  const bundled = await build({
    absWorkingDir: root,
    stdin: {
      contents: `import { startWorkbench } from './tools/voice-leading/workbench.ts';\nstartWorkbench(${JSON.stringify({ locale, draft: STARTER_DRAFT, assets })});`,
      resolveDir: root,
      loader: 'ts',
    },
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'iife',
    target: 'es2022',
    minify: true,
    legalComments: 'inline',
    charset: 'ascii',
  });
  const script = bundled.outputFiles[0].text.replace(/<\/script/giu, '<\\/script');
  const hash = createHash('sha256').update(script).digest('base64');
  const m = WORKBENCH_MESSAGES[locale];
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-${hash}'; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none'">
<title>${m.title}</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f5f7;color:#20202c;font:16px/1.55 system-ui,sans-serif}main{max-width:1060px;margin:auto;padding:24px}.draft{padding:14px 18px;background:#fff1cc;border-left:5px solid #755100;font-weight:650}h1,h2,h3{overflow-wrap:anywhere}label{display:block;margin:12px 0}label>span{display:block;font-weight:650;margin-bottom:6px}input,select,textarea,button{font:inherit;color:inherit;max-width:100%}textarea,input:not([type=file]){width:100%;border:1px solid #777;border-radius:5px;padding:10px;background:white}textarea{font:15px/1.5 ui-monospace,monospace;resize:vertical}select,button{padding:10px;border:1px solid #777;border-radius:5px;background:white}button{cursor:pointer}button[type=submit]{background:#4532a4;color:white}button:disabled{cursor:default;color:#666;background:#eee}.fields,.voices{display:grid;gap:16px;grid-template-columns:repeat(2,minmax(0,1fr))}.fields{grid-template-columns:2fr 1fr 1fr}.actions{display:flex;flex-wrap:wrap;gap:12px;margin:20px 0}input:focus-visible,select:focus-visible,textarea:focus-visible,button:focus-visible{outline:3px solid #4532a4;outline-offset:3px}[role=alert]:not(:empty){border:2px solid #9d2634;padding:12px}pre{white-space:pre-wrap;overflow-wrap:anywhere}section[aria-label]{border-top:2px solid #bbb;margin-top:24px}@media(max-width:650px){.fields,.voices{grid-template-columns:1fr}main{padding:16px}}
</style></head><body><main><noscript>${m.noScript}</noscript></main><script>${script}</script></body></html>`;
}

export async function run(args) {
  const values = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index],
      value = args[index + 1];
    if (!['--language', '--output'].includes(name) || !value || values.has(name))
      throw new Error(
        'Usage: pnpm voice-leading:workbench --language de-DE|en-US|en-GB --output artifacts/voice-leading/new.html',
      );
    values.set(name, value);
  }
  if (!values.has('--language') || !values.has('--output'))
    throw new Error('Language and output are required');
  const html = await buildWorkbench(values.get('--language'));
  return { output: writePrivateReport(values.get('--output'), html), status: 'draft' };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    console.log(JSON.stringify(await run(process.argv.slice(2))));
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Workbench failed');
    process.exitCode = 1;
  }
}

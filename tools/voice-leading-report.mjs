import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { REPORT_MESSAGES } from './voice-leading/messages.ts';
import { renderVoiceLeadingReport } from './voice-leading/report.ts';

const privateBase = fileURLToPath(new URL('../artifacts/voice-leading/', import.meta.url)).replace(
  /\/$/u,
  '',
);

/** Entwurfsberichte gehören ausschließlich in den ignorierten lokalen Prüfbereich. */
export function writePrivateReport(outputPath, html) {
  const output = resolve(outputPath);
  if (!output.startsWith(privateBase + sep) || !output.endsWith('.html') || existsSync(output)) {
    throw new Error('Use a new .html file inside artifacts/voice-leading/');
  }
  let existing = dirname(output);
  while (!existsSync(existing)) existing = dirname(existing);
  if (realpathSync(existing) !== existing) throw new Error('Report parents must not be symlinks');
  mkdirSync(dirname(output), { recursive: true, mode: 0o700 });
  writeFileSync(output, html, { flag: 'wx', mode: 0o600 });
  return output;
}

export function run(args) {
  const values = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index],
      value = args[index + 1];
    if (!['--input', '--language', '--output'].includes(name) || !value || values.has(name)) {
      throw new Error(
        'Usage: pnpm voice-leading:report --input score.json --language de-DE|en-US|en-GB --output artifacts/voice-leading/new.html',
      );
    }
    values.set(name, value);
  }
  const input = values.get('--input'),
    language = values.get('--language'),
    output = values.get('--output');
  if (!input || !output || !Object.hasOwn(REPORT_MESSAGES, language ?? ''))
    throw new Error('Input, supported language and output are required');
  const fontRoot = new URL(
    '../packages/notation/node_modules/@vexflow-fonts/bravura/',
    import.meta.url,
  );
  const { html, analysis } = renderVoiceLeadingReport(
    JSON.parse(readFileSync(input, 'utf8')),
    language,
    {
      fontBase64: readFileSync(new URL('bravura.woff2', fontRoot)).toString('base64'),
      fontLicense: readFileSync(new URL('LICENSE.txt', fontRoot), 'utf8'),
    },
  );
  return {
    output: writePrivateReport(output, html),
    findings: analysis.findings.length,
    status: analysis.status,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    console.log(JSON.stringify(run(process.argv.slice(2))));
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Report failed');
    process.exitCode = 1;
  }
}

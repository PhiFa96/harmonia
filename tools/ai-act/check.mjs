import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { ROOT, SCOPES, readInventory, inspectInventory } from './model.mjs';
import { reviewHtml } from './report.mjs';
export function checkMain(args) {
  let scope = 'general';
  const flags = new Set();
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (flags.has(a) || !['--release', '--report', '--json', '--scope'].includes(a))
      throw Error('Invalid AI review argument');
    flags.add(a);
    if (a === '--scope') {
      scope = args[++i];
      if (!SCOPES.includes(scope)) throw Error('Invalid AI review scope');
    }
  }
  const inventory = readInventory(),
    result = inspectInventory(inventory),
    missing = result.scopes[scope].missing;
  if (flags.has('--report')) {
    const dir = resolve(ROOT, 'artifacts/ai-act');
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      resolve(dir, 'snapshot.json'),
      JSON.stringify({ inventory, ...result }, null, 2) + '\n',
    );
    for (const locale of ['de', 'en-US', 'en-GB'])
      writeFileSync(resolve(dir, locale + '.html'), reviewHtml(inventory, result, locale));
  }
  if (flags.has('--json')) console.log(JSON.stringify({ ...result, scope }, null, 2));
  else
    console.log(
      `AI Act preparation: ${result.componentCount} features, ${Object.keys(result.fileDigests).length} bound files; ${scope}: ${missing.length} open evidence fields. No legal approval inferred.`,
    );
  if (flags.has('--release') && missing.length) {
    console.error('AI Act release blocked: ' + missing.join(', '));
    return 1;
  }
  return 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = checkMain(process.argv.slice(2));
  } catch {
    console.error('AI Act preparation invalid; inspect inventory and source coverage.');
    process.exitCode = 1;
  }
}

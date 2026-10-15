// Reproducible isolated guest fixture export. No remote account, provider key or .env file.
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { buildSite } from '../storefront/build.mjs';
const mode = process.argv.includes('--production') ? 'production' : 'preview';
const at = process.argv.indexOf('--output');
const output = resolve(at >= 0 ? process.argv[at + 1] : `artifacts/quality/web-${mode}`);
const env = { ...process.env, EXPO_NO_DOTENV: '1', APP_VARIANT: mode };
for (const name of [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
  'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY',
  'EXPO_PUBLIC_REVENUECAT_WEB_KEY',
])
  env[name] = '';
execFileSync(
  'pnpm',
  [
    '--filter',
    '@harmonia/mobile',
    'exec',
    'expo',
    'export',
    '--platform',
    process.argv.includes('--all') ? 'all' : 'web',
    '--output-dir',
    output,
    ...(process.argv.includes('--no-bytecode') ? ['--no-bytecode'] : []),
  ],
  { env, stdio: 'inherit' },
);

buildSite(output);
writeFileSync(
  join(output, 'harmonia-qa-fixture.json'),
  JSON.stringify({ version: 1, variant: mode, isolatedGuest: true }) + '\n',
);

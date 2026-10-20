// Explicit local integration fixture. Only the public anon key enters the app.
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { buildSite } from '../storefront/build.mjs';
const at = process.argv.indexOf('--output');
if (at < 0 || !process.argv[at + 1]) throw Error('Explicit --output required');
const output = resolve(process.argv[at + 1]);
const status = JSON.parse(
  execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
);
const api = new URL(status.API_URL);
if (api.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(api.hostname))
  throw Error('Local Supabase required');
const env = {
  ...process.env,
  EXPO_NO_DOTENV: '1',
  APP_VARIANT: 'preview',
  EXPO_PUBLIC_SUPABASE_URL: api.origin,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
};
for (const key of [
  'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
  'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY',
  'EXPO_PUBLIC_REVENUECAT_WEB_KEY',
])
  env[key] = '';
execFileSync(
  'pnpm',
  [
    '--filter',
    '@harmonia/mobile',
    'exec',
    'expo',
    'export',
    '--platform',
    'web',
    '--output-dir',
    output,
  ],
  { env, stdio: 'inherit' },
);
const scripts = join(output, '_expo/static/js/web');
if (
  !readdirSync(scripts)
    .filter((name) => name.endsWith('.js'))
    .some((name) => readFileSync(join(scripts, name), 'utf8').includes(api.origin))
)
  throw Error('Local backend configuration missing from export');
buildSite(output);
writeFileSync(
  join(output, 'harmonia-qa-fixture.json'),
  JSON.stringify({ version: 1, variant: 'preview', isolatedGuest: false, localAuth: true }) + '\n',
);

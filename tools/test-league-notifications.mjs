import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const status = JSON.parse(
  execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
);
assert.equal(new URL(status.API_URL).hostname, '127.0.0.1');
const output = execFileSync(
  'npx',
  [
    '-y',
    'deno@2.9.6',
    'run',
    '--config',
    'supabase/functions/deno.json',
    '--allow-env=HARMONIA_TEST_LOCAL_URL,HARMONIA_TEST_LOCAL_KEY,EXPO_ACCESS_TOKEN',
    '--allow-net=127.0.0.1:54321',
    'tools/league-notifications-smoke.ts',
  ],
  {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      HARMONIA_TEST_LOCAL_URL: status.API_URL,
      HARMONIA_TEST_LOCAL_KEY: status.SERVICE_ROLE_KEY,
    },
  },
);
process.stdout.write(output);

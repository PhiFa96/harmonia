#!/usr/bin/env node
// Nur der eigene Auth-Container greift direkt auf den eigenen Template-Server zu.
// Alle bestehenden Proxywerte, Docker-Einstellungen und externen Ziele bleiben erhalten.
const { spawnSync } = require('node:child_process');
const process = require('node:process');
const args = process.argv.slice(2);
const named = args.some(
  (arg, i) =>
    arg === '--name=supabase_auth_harmonia' ||
    (arg === '--name' && args[i + 1] === 'supabase_auth_harmonia'),
);
if (
  ['create', 'run'].includes(args[0]) &&
  named &&
  (process.env.HTTP_PROXY || process.env.http_proxy)
) {
  for (const key of ['NO_PROXY', 'no_proxy']) {
    let value = process.env[key] ?? '';
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--env' && args[i + 1]?.startsWith(key + '='))
        value = args[i + 1].slice(key.length + 1);
      else if (args[i].startsWith('--env=' + key + '=')) value = args[i].slice(key.length + 7);
    }
    const image = args.findIndex((arg) => /(?:^|\/)(?:auth|gotrue)(?::|@)/.test(arg));
    if (image < 0) {
      process.stderr.write('Erwartetes lokales Auth-Image fehlt.\n');
      process.exit(1);
    }
    args.splice(image, 0, '--env', key + '=' + value + ',supabase_kong_harmonia');
  }
}
const result = spawnSync(process.env.HARMONIA_DOCKER_BINARY, args, { stdio: 'inherit' });
if (result.error) {
  process.stderr.write('Lokaler Docker-Aufruf fehlgeschlagen.\n');
  process.exit(1);
}
process.exit(result.status ?? 1);

#!/usr/bin/env node
// Nur die eigenen Auth-/Edge-Container greifen direkt auf das eigene Kong zu.
// Alle bestehenden Proxywerte, Docker-Einstellungen und externen Ziele bleiben erhalten.
const { spawnSync } = require('node:child_process');
const process = require('node:process');
const { existsSync } = require('node:fs');
const args = process.argv.slice(2);
const edge = args.some(
  (arg, i) =>
    arg === '--name=supabase_edge_runtime_harmonia' ||
    (arg === '--name' && args[i + 1] === 'supabase_edge_runtime_harmonia'),
);
const named =
  edge ||
  args.some(
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
    const image = args.findIndex((arg) =>
      (edge ? /(?:^|\/)edge-runtime(?::|@)/ : /(?:^|\/)(?:auth|gotrue)(?::|@)/).test(arg),
    );
    if (image < 0) {
      process.stderr.write('Erwartetes lokales Auth-/Edge-Image fehlt.\n');
      process.exit(1);
    }
    args.splice(
      image,
      0,
      '--env',
      key + '=' + value + (edge ? ',supabase_kong_harmonia,kong' : ',supabase_kong_harmonia'),
    );
  }
  if (edge && process.env.SSL_CERT_FILE && existsSync(process.env.SSL_CERT_FILE)) {
    const image = args.findIndex((arg) => /(?:^|\/)edge-runtime(?::|@)/.test(arg));
    args.splice(
      image,
      0,
      '--volume',
      process.env.SSL_CERT_FILE + ':/tmp/harmonia-proxy-ca.pem:ro',
      '--env',
      'DENO_CERT=/tmp/harmonia-proxy-ca.pem',
      '--env',
      'SSL_CERT_FILE=/tmp/harmonia-proxy-ca.pem',
      '--env',
      'DENO_TLS_CA_STORE=system',
    );
  }
}
const result = spawnSync(process.env.HARMONIA_DOCKER_BINARY, args, { stdio: 'inherit' });
if (result.error) {
  process.stderr.write('Lokaler Docker-Aufruf fehlgeschlagen.\n');
  process.exit(1);
}
process.exit(result.status ?? 1);

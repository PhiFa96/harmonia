import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
test('Lokaler Docker-Wrapper ergänzt nur den Auth-Template-Host vor dem Image und bewahrt vorhandene Werte', () => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-docker-test-')),
    fake = join(dir, 'docker');
  try {
    writeFileSync(
      fake,
      '#!/usr/bin/env node\nprocess.stdout.write(JSON.stringify(process.argv.slice(2)));',
      { mode: 0o755 },
    );
    const invoke = (args) => {
      const result = spawnSync(process.execPath, ['tools/docker-local-wrapper.cjs', ...args], {
        env: {
          ...process.env,
          HARMONIA_DOCKER_BINARY: fake,
          HTTP_PROXY: 'http://example.invalid',
          NO_PROXY: 'localhost,old.internal',
          no_proxy: 'localhost,old.internal',
        },
        encoding: 'utf8',
      });
      assert.equal(result.status, 0);
      return JSON.parse(result.stdout);
    };
    const original = [
      'create',
      '--name',
      'supabase_auth_harmonia',
      '--env',
      'NO_PROXY=localhost,other.internal',
      '--env',
      'EXAMPLE=keep',
      'ghcr.io/supabase/cli/auth:version',
    ];
    const result = invoke(original);
    assert.equal(result.at(-1), original.at(-1));
    assert.ok(result.includes('NO_PROXY=localhost,other.internal,supabase_kong_harmonia'));
    assert.ok(result.includes('no_proxy=localhost,old.internal,supabase_kong_harmonia'));
    assert.ok(result.includes('EXAMPLE=keep'));
    const other = ['create', '--name', 'unrelated', 'supabase/other:version'];
    assert.deepEqual(invoke(other), other);
  } finally {
    rmSync(dir, { recursive: true });
  }
});
test('Eigener Edge-Container erhält internes Kong und CA-Vertrauen ohne externe Proxyziele zu umgehen', () => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-edge-test-')),
    fake = join(dir, 'docker'),
    ca = join(dir, 'ca.pem');
  try {
    writeFileSync(
      fake,
      '#!/usr/bin/env node\nprocess.stdout.write(JSON.stringify(process.argv.slice(2)));',
      { mode: 0o755 },
    );
    writeFileSync(ca, 'public-test-certificate');
    const run = (args) =>
      spawnSync(process.execPath, ['tools/docker-local-wrapper.cjs', ...args], {
        env: {
          ...process.env,
          HARMONIA_DOCKER_BINARY: fake,
          HTTP_PROXY: 'http://example.invalid',
          NO_PROXY: 'localhost,old.internal',
          no_proxy: 'localhost,old.internal',
          SSL_CERT_FILE: ca,
        },
        encoding: 'utf8',
      });
    const image = 'ghcr.io/supabase/cli/edge-runtime:version';
    const own = run(['create', '--name', 'supabase_edge_runtime_harmonia', image]);
    assert.equal(own.status, 0);
    const args = JSON.parse(own.stdout);
    assert.equal(args.at(-1), image);
    assert.ok(args.includes('NO_PROXY=localhost,old.internal,supabase_kong_harmonia,kong'));
    assert.ok(args.includes(ca + ':/tmp/harmonia-proxy-ca.pem:ro'));
    assert.ok(args.includes('SSL_CERT_FILE=/tmp/harmonia-proxy-ca.pem'));
    assert.ok(args.includes('DENO_TLS_CA_STORE=system'));
    const other = ['create', '--name', 'supabase_edge_runtime_other', image];
    assert.deepEqual(JSON.parse(run(other).stdout), other);
    assert.equal(
      run(['create', '--name', 'supabase_edge_runtime_harmonia', 'unrelated:version']).status,
      1,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test('Tutor-Live bindet den Schlüssel nur per Umgebungsnamen im eigenen Edge-Container', () => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-tutor-wrapper-test-')),
    fake = join(dir, 'docker');
  try {
    writeFileSync(
      fake,
      '#!/usr/bin/env node\nprocess.stdout.write(JSON.stringify(process.argv.slice(2)));',
      { mode: 0o755 },
    );
    const key = 'synthetic-test-value-never-a-real-key';
    const run = (args, supplied = key) =>
      spawnSync(process.execPath, ['tools/docker-local-wrapper.cjs', ...args], {
        env: {
          ...process.env,
          HARMONIA_DOCKER_BINARY: fake,
          HARMONIA_TUTOR_FORWARD_KEY: 'true',
          ANTHROPIC_API_KEY: supplied,
          HTTP_PROXY: '',
          http_proxy: '',
        },
        encoding: 'utf8',
      });
    const image = 'ghcr.io/supabase/cli/edge-runtime:version',
      own = ['create', '--name', 'supabase_edge_runtime_harmonia', image],
      response = run(own);
    assert.equal(response.status, 0);
    const args = JSON.parse(response.stdout);
    assert.equal(args.at(-1), image);
    assert.ok(args.includes('ANTHROPIC_API_KEY'));
    assert.ok(!response.stdout.includes(key));
    const other = ['create', '--name', 'supabase_edge_runtime_other', image];
    assert.deepEqual(JSON.parse(run(other).stdout), other);
    assert.equal(run(own, '').status, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

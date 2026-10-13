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

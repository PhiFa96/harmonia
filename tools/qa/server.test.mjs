import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { get } from 'node:http';
import { gunzipSync } from 'node:zlib';
test('Playwright cannot clear the repository as its output directory', () => {
  const result = spawnSync(
    process.execPath,
    [
      'node_modules/@playwright/test/cli.js',
      'test',
      '--config',
      'tools/qa/playwright.config.mjs',
      '--list',
    ],
    { env: { ...process.env, HARMONIA_QA_OUTPUT: process.cwd() }, encoding: 'utf8' },
  );
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('Quality output must be a separate child'));
});
test('fixture server negotiates gzip, preserves WASM isolation and supports HEAD', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-web-quality-'));
  const script = 'const ownFixture = true;\n'.repeat(200);
  writeFileSync(join(dir, 'entry.js'), script);
  writeFileSync(join(dir, 'index.html'), '<html lang="de"><title>Own fixture</title></html>');
  const child = spawn(process.execPath, ['tools/serve-web.mjs'], {
    env: { ...process.env, HARMONIA_PREVIEW_DIR: dir, HARMONIA_PREVIEW_PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    const base = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Fixture server readiness timeout')), 10000);
      child.once('error', reject);
      child.stdout.on('data', (chunk) => {
        const match = String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) {
          clearTimeout(timer);
          resolve(match[0]);
        }
      });
    });
    const request = (encoding, method = 'GET') =>
      new Promise((resolve, reject) => {
        const req = get(
          base + '/entry.js',
          { method, headers: { 'Accept-Encoding': encoding } },
          (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve({ headers: res.headers, body: Buffer.concat(chunks) }));
          },
        );
        req.on('error', reject);
      });
    const compressed = await request('br, gzip');
    assert.equal(compressed.headers['content-encoding'], 'gzip');
    assert.equal(gunzipSync(compressed.body).toString(), script);
    assert.ok(compressed.body.length < script.length);
    assert.equal(compressed.headers['vary'], 'Accept-Encoding');
    assert.equal(compressed.headers['cross-origin-embedder-policy'], 'require-corp');
    assert.equal(compressed.headers['cross-origin-opener-policy'], 'same-origin');
    const plain = await request('gzip;q=0');
    assert.equal(plain.headers['content-encoding'], undefined);
    assert.equal(plain.body.toString(), script);
    const head = await request('gzip', 'HEAD');
    assert.equal(head.body.length, 0);
    assert.equal(head.headers['content-encoding'], 'gzip');
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
    rmSync(dir, { recursive: true, force: true });
  }
});

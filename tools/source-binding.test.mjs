import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, symlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { sourceDigests } from './source-binding.mjs';

function fixture(t, files) {
  const root = mkdtempSync(join(tmpdir(), 'harmonia-source-graph-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (path, text) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  for (const [path, text] of Object.entries(files)) write(path, text);
  return { root, write, digests: () => sourceDigests(['entry.ts'], { root }) };
}

test('static syntax, literal lazy imports, type imports, JSON and require form one closure without executing code', (t) => {
  const f = fixture(t, {
    'entry.ts': `throw new Error('must never execute');
      export * from './barrel'; import type { Model } from './types.ts';
      const lazy = () => import('./lazy.mjs'); const data = require('./data.json');
      const description = "import('./nonexistent-string.ts')";
      // import './nonexistent-comment.ts';
      type Dynamic = import('./dynamic-type.ts').Dynamic;`,
    'barrel/index.ts': "export * from '../runtime-fixture.ts';",
    'runtime-fixture.ts': "import './entry.ts';",
    'lazy.mjs': "import 'node:fs'; import 'external-library';",
    'types.ts': 'export interface Model {}',
    'dynamic-type.ts': 'export type Dynamic = string;',
    'data.json': '{"value":1}',
  });
  const before = f.digests();
  assert.deepEqual(Object.keys(before), [
    'barrel/index.ts',
    'data.json',
    'dynamic-type.ts',
    'entry.ts',
    'lazy.mjs',
    'runtime-fixture.ts',
    'types.ts',
  ]);
  f.write('data.json', '{"value":2}');
  assert.notEqual(f.digests()['data.json'], before['data.json']);
});

test('workspace conditional exports and inherited path aliases bind manifests and both platform implementations', (t) => {
  const f = fixture(t, {
    'entry.ts': "export * from './apps/mobile/src/start';",
    'apps/mobile/package.json': '{"name":"@harmonia/mobile"}',
    'apps/mobile/tsconfig.json': '{"extends":"../../base.json"}',
    'base.json': '{"compilerOptions":{"paths":{"@/*":["./missing/*","./apps/mobile/src/*"]}}}',
    'apps/mobile/src/start.ts': "import '@/state'; import '@harmonia/ui/native';",
    'apps/mobile/src/state.ts': 'export const state = 1;',
    'packages/ui/package.json':
      '{"name":"@harmonia/ui","exports":{"./native":{"react-native":"./native.ts","default":"./web.ts"}}}',
    'packages/ui/native.ts': 'export const native = 1;',
    'packages/ui/web.ts': 'export const web = 1;',
  });
  const bound = f.digests();
  for (const path of [
    'apps/mobile/tsconfig.json',
    'base.json',
    'apps/mobile/src/state.ts',
    'packages/ui/package.json',
    'packages/ui/native.ts',
    'packages/ui/web.ts',
  ])
    assert.ok(bound[path], path);
});

test('an exact alias takes precedence over a wildcard; a new platform file and changed import edge are observed without restart', (t) => {
  const f = fixture(t, {
    'entry.ts': "import './apps/mobile/src/start';",
    'apps/mobile/package.json': '{"name":"@harmonia/mobile"}',
    'apps/mobile/tsconfig.json':
      '{"compilerOptions":{"paths":{"@/*":["./src/*"],"@/answer":["./src/special.ts"]}}}',
    'apps/mobile/src/start.ts': "import '@/answer'; import './adapter';",
    'apps/mobile/src/answer.ts': 'export const unused = 0;',
    'apps/mobile/src/special.ts': 'export const answer = 1;',
    'apps/mobile/src/adapter.ts': 'export const native = 1;',
  });
  const before = f.digests();
  assert.ok(before['apps/mobile/src/special.ts']);
  assert.ok(!before['apps/mobile/src/answer.ts']);
  f.write('apps/mobile/src/adapter.web.ts', 'export const web = 1;');
  assert.ok(f.digests()['apps/mobile/src/adapter.web.ts']);
  f.write('apps/mobile/src/special.ts', "import './new.ts';");
  f.write('apps/mobile/src/new.ts', 'export const added = 1;');
  assert.ok(f.digests()['apps/mobile/src/new.ts']);
});

test('missing modules, computed imports, malformed source and unknown internal aliases fail closed', (t) => {
  const f = fixture(t, { 'entry.ts': '' });
  for (const source of [
    "import './missing.ts';",
    'import(target);',
    'require(target);',
    'export const broken = ;',
    "import '@harmonia/unknown';",
    "import '@/unknown';",
    "import '#unknown';",
    "import 'file:///tmp/forbidden.ts';",
  ]) {
    f.write('entry.ts', source);
    assert.throws(f.digests, /bound|import|configuration/i, source);
  }
});

test('multiple configuration parents retain aliases; config and export retargeting change the actual closure', (t) => {
  const f = fixture(t, {
    'entry.ts': "import './apps/mobile/src/start';",
    'apps/mobile/package.json': '{"name":"@harmonia/mobile"}',
    'apps/mobile/tsconfig.json': '{"extends":["../../paths.json","../../strict.json"]}',
    'paths.json': '{"compilerOptions":{"paths":{"@/*":["./apps/mobile/src/*"]}}}',
    'strict.json': '{"compilerOptions":{"strict":true}}',
    'apps/mobile/src/start.ts': "import '@/value'; import '@harmonia/ui';",
    'apps/mobile/src/value.ts': 'export const value = 1;',
    'apps/mobile/alternative/value.ts': 'export const value = 2;',
    'packages/ui/package.json': '{"name":"@harmonia/ui","exports":"./first.ts"}',
    'packages/ui/first.ts': 'export const value = 1;',
    'packages/ui/second.ts': 'export const value = 2;',
  });
  const before = f.digests();
  assert.ok(before['apps/mobile/package.json']);
  assert.ok(before['apps/mobile/src/value.ts']);
  f.write('paths.json', '{"compilerOptions":{"paths":{"@/*":["./apps/mobile/alternative/*"]}}}');
  f.write('packages/ui/package.json', '{"name":"@harmonia/ui","exports":"./second.ts"}');
  const after = f.digests();
  assert.ok(after['apps/mobile/alternative/value.ts']);
  assert.ok(!after['apps/mobile/src/value.ts']);
  assert.ok(after['packages/ui/second.ts']);
  assert.ok(!after['packages/ui/first.ts']);
  assert.notEqual(after['paths.json'], before['paths.json']);
  assert.notEqual(after['packages/ui/package.json'], before['packages/ui/package.json']);
});

test('wildcard captures stay literal and invalid workspace export targets cannot escape a package', (t) => {
  const f = fixture(t, {
    'entry.ts': "import '@harmonia/ui/$&';",
    'packages/ui/package.json': '{"name":"@harmonia/ui","exports":{"./*":"./src/*.ts"}}',
    'packages/ui/src/$&.ts': 'export const value = 1;',
  });
  assert.ok(f.digests()['packages/ui/src/$&.ts']);
  f.write('entry.ts', "import '@harmonia/ui/deep/valueSuffix';");
  f.write(
    'packages/ui/package.json',
    JSON.stringify({
      name: '@harmonia/ui',
      exports: { './*Suffix': './wrong.ts', './deep/*': './src/*.ts' },
    }),
  );
  f.write('packages/ui/wrong.ts', 'export const wrong = 1;');
  f.write('packages/ui/src/valueSuffix.ts', 'export const right = 1;');
  assert.ok(f.digests()['packages/ui/src/valueSuffix.ts']);
  f.write('entry.ts', "import '@harmonia/ui/$&';");
  for (const target of ['./../../outside.ts', './node_modules/private.ts']) {
    f.write(
      'packages/ui/package.json',
      JSON.stringify({ name: '@harmonia/ui', exports: { './*': target } }),
    );
    assert.throws(f.digests, /export target/);
  }
});

test('escaped paths and symlinked files or directories cannot enter a review snapshot', (t) => {
  const f = fixture(t, { 'entry.ts': '', 'real/index.ts': 'export const value = 1;' });
  const outside = mkdtempSync(join(tmpdir(), 'harmonia-binding-outside-'));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  writeFileSync(join(outside, 'outside.ts'), 'export const secret = 1;');
  symlinkSync(join(outside, 'outside.ts'), join(f.root, 'escape.ts'));
  symlinkSync(join(f.root, 'real'), join(f.root, 'link'));
  for (const specifier of ['./escape.ts', './link/index.ts', '../outside.ts']) {
    f.write('entry.ts', `import '${specifier}';`);
    assert.throws(f.digests, /outside|symlink/i);
  }
});

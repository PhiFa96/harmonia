import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const mobile = fileURLToPath(new URL('../apps/mobile/', import.meta.url));
const root = resolve(mobile, '../..');
const source = readFileSync(join(mobile, 'metro.config.js'), 'utf8');
const require = createRequire(new URL('../apps/mobile/metro.config.js', import.meta.url));
const internal = [
  'packages/content/src/history-journey-draft.ts',
  'packages/i18n/src/history-journey-draft.ts',
  'packages/i18n/src/history-journey-draft.json',
  'packages/i18n/src/history-journey-check.ts',
  'packages/content/src/authoring.ts',
];

// Exercise the actual config and delegation. Only Expo's default server setup is stubbed.
function resolver(variant) {
  const module = { exports: {} };
  runInNewContext(source, {
    __dirname: mobile,
    module,
    process: { env: { APP_VARIANT: variant } },
    require: (name) =>
      name === 'expo/metro-config'
        ? { getDefaultConfig: () => ({ resolver: { assetExts: [] }, server: {} }) }
        : require(name),
  });
  return module.exports.resolver.resolveRequest;
}

for (const platform of ['web', 'ios', 'android']) {
  test(`production ${platform}: public history aliases select empty published modules`, () => {
    const request = resolver('production');
    for (const pkg of ['content', 'i18n']) {
      const result = request({}, `@harmonia/${pkg}/history-journey`, platform);
      assert.equal(result.filePath, join(root, `packages/${pkg}/src/history-journey-published.ts`));
    }
  });
  test(`production ${platform}: relative paths and delegated aliases cannot resolve internal history files`, () => {
    const request = resolver('production');
    for (const file of internal) {
      const target = join(root, file);
      const context = {
        originModulePath: join(dirname(target), 'consumer.ts'),
        resolveRequest: (_context, name) => ({
          type: 'sourceFile',
          filePath: require.resolve(resolve(dirname(target), name)),
        }),
      };
      assert.throws(
        () => request(context, `./${file.split('/').at(-1)}`, platform),
        /Produktions-Build/,
      );
      assert.throws(
        () =>
          request(
            { ...context, resolveRequest: () => ({ type: 'sourceFile', filePath: target }) },
            '@local/unsafe',
            platform,
          ),
        /Produktions-Build/,
      );
    }
  });
}

for (const variant of ['development', 'preview']) {
  test(`${variant}: aliases and direct history imports remain available`, () => {
    const request = resolver(variant);
    for (const pkg of ['content', 'i18n'])
      assert.equal(
        request({}, `@harmonia/${pkg}/history-journey`, 'web').filePath,
        join(root, `packages/${pkg}/src/history-journey-draft.ts`),
      );
    for (const file of internal) {
      const result = { type: 'sourceFile', filePath: join(root, file) };
      assert.equal(request({ resolveRequest: () => result }, './draft', 'web'), result);
    }
  });
}

test('production: workspace symlinks cannot hide internal history JSON', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'harmonia-metro-history-'));
  try {
    const link = join(temporary, 'copy.json');
    symlinkSync(join(root, 'packages/i18n/src/history-journey-draft.json'), link);
    const request = resolver('production');
    assert.throws(
      () =>
        request({ resolveRequest: () => ({ type: 'sourceFile', filePath: link }) }, link, 'web'),
      /Produktions-Build/,
    );
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test('production: portable history types, public resources and empty resolutions still delegate', () => {
  const request = resolver('production');
  for (const file of [
    'packages/content/src/history-journey.ts',
    'packages/i18n/src/resources.ts',
  ]) {
    const result = { type: 'sourceFile', filePath: realpathSync(join(root, file)) };
    assert.equal(request({ resolveRequest: () => result }, file, 'web'), result);
  }
  const empty = { type: 'empty' };
  assert.equal(request({ resolveRequest: () => empty }, './empty', 'web'), empty);
  const virtual = { type: 'sourceFile', filePath: '\0shim:react-native-web/BackHandler' };
  assert.equal(request({ resolveRequest: () => virtual }, './exports/BackHandler', 'web'), virtual);
});

// SQLite im Web lädt seine Engine als WASM im Worker.
const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('node:path');
const { createHash } = require('node:crypto');
const { realpathSync } = require('node:fs');
const config = getDefaultConfig(__dirname);
const variant = process.env.APP_VARIANT || 'development';
if (!['development', 'preview', 'production'].includes(variant)) {
  throw new Error(`Unbekannte APP_VARIANT: ${variant}`);
}
// Öffentliche Einstiege wählen die gefilterten Daten und Texte statisch aus.
const published = variant === 'production';
// Expo inlines public configuration. Guest QA and local Auth exports must not
// reuse transformed modules with a different backend/permission configuration.
const publicEnvironment = Object.entries(process.env)
  .filter(([name]) => name.startsWith('EXPO_PUBLIC_'))
  .sort(([a], [b]) => a.localeCompare(b));
const environmentHash = createHash('sha256')
  .update(JSON.stringify(publicEnvironment))
  .digest('hex')
  .slice(0, 16);
config.cacheVersion = `harmonia-content-${variant}-${environmentHash}`;
const resolveRequest = config.resolver.resolveRequest;
// Check resolved files as well as aliases: relative imports and workspace links
// can name the same internal file without using its public package entry.
const internalFiles = new Set(
  [
    '../../packages/content/src/authoring.ts',
    '../../packages/content/src/history-journey-draft.ts',
    '../../packages/i18n/src/history-journey-draft.ts',
    '../../packages/i18n/src/history-journey-draft.json',
    '../../packages/i18n/src/history-journey-check.ts',
  ].map((file) => realpathSync(resolve(__dirname, file))),
);
function publicResolution(result) {
  if (
    published &&
    result.type === 'sourceFile' &&
    // Expo uses NUL-prefixed identifiers for virtual shims, not filesystem paths.
    !result.filePath.startsWith('\0') &&
    internalFiles.has(realpathSync(result.filePath))
  )
    throw new Error(
      'Interne Inhaltsdaten oder Entwurfstexte dürfen nicht in einen Produktions-Build.',
    );
  return result;
}
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    published &&
    moduleName === './level-five-exercise.json' &&
    context.originModulePath.startsWith(
      resolve(__dirname, '../../packages/i18n/src/messages') + '/',
    )
  ) {
    return {
      type: 'sourceFile',
      filePath: resolve(
        __dirname,
        '../../packages/i18n/src/messages/level-five-exercise-published.json',
      ),
    };
  }
  if (moduleName === '@harmonia/content/authoring' && published) {
    throw new Error(
      'Interne Inhaltsdaten dürfen nicht in einen Produktions-Build importiert werden.',
    );
  }
  const files = {
    '@harmonia/content/catalogue': `../../packages/content/src/${published ? 'published' : 'authoring'}.ts`,
    '@harmonia/i18n/content-messages': `../../packages/i18n/src/${published ? 'published-content-messages' : 'authoring-content-messages'}.ts`,
    '@harmonia/content/history-journey': `../../packages/content/src/history-journey-${published ? 'published' : 'draft'}.ts`,
    '@harmonia/i18n/history-journey': `../../packages/i18n/src/history-journey-${published ? 'published' : 'draft'}.ts`,
  };
  const file = files[moduleName];
  if (file) return publicResolution({ type: 'sourceFile', filePath: resolve(__dirname, file) });
  return publicResolution(
    resolveRequest
      ? resolveRequest(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform),
  );
};
config.resolver.assetExts.push('wasm');
const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const enhanced = enhanceMiddleware ? enhanceMiddleware(middleware, server) : middleware;
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return enhanced(req, res, next);
  };
};
module.exports = config;

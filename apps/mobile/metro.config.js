// SQLite im Web lädt seine Engine als WASM im Worker.
const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('node:path');
const config = getDefaultConfig(__dirname);
const variant = process.env.APP_VARIANT || 'development';
if (!['development', 'preview', 'production'].includes(variant)) {
  throw new Error(`Unbekannte APP_VARIANT: ${variant}`);
}
// Beide Einstiege sind statisch gewählt: Entwurfsdaten und -texte erreichen Metro in production nie.
const published = variant === 'production';
config.cacheVersion = `harmonia-content-${variant}`;
const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@harmonia/content/authoring' && published) {
    throw new Error(
      'Interne Inhaltsdaten dürfen nicht in einen Produktions-Build importiert werden.',
    );
  }
  const files = {
    '@harmonia/content/catalogue': `../../packages/content/src/${published ? 'published' : 'authoring'}.ts`,
    '@harmonia/i18n/content-messages': `../../packages/i18n/src/${published ? 'published-content-messages' : 'authoring-content-messages'}.ts`,
  };
  const file = files[moduleName];
  if (file) return { type: 'sourceFile', filePath: resolve(__dirname, file) };
  return resolveRequest
    ? resolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
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

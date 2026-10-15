// Lokale Vorschau des Web-Exports mit den für expo-sqlite nötigen HTTP-Headern.
import { createReadStream } from 'node:fs';
import { stat, realpath } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createGzip } from 'node:zlib';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};
export function createPreviewServer(root, { authorize, allowFile, privateMode = false } = {}) {
  return createServer(async (request, response) => {
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    response.setHeader('Cache-Control', privateMode ? 'no-store' : 'no-cache');
    if (privateMode) {
      response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
      response.setHeader('Referrer-Policy', 'no-referrer');
      response.setHeader('X-Content-Type-Options', 'nosniff');
    }
    try {
      if (authorize && !(await authorize(request, response))) return;
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.setHeader('Allow', 'GET, HEAD');
        response.writeHead(405).end();
        return;
      }
      const path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
      let file = resolve(root, `.${path}`);
      if (file !== resolve(root) && !file.startsWith(resolve(root) + sep)) {
        response.writeHead(403).end();
        return;
      }
      if (!extname(path)) file = resolve(root, 'index.html');
      const actualRoot = await realpath(root),
        actualFile = await realpath(file);
      if (!actualFile.startsWith(actualRoot + sep)) {
        response.writeHead(403).end();
        return;
      }
      file = actualFile;
      if (allowFile && !allowFile(file)) {
        response.writeHead(404).end();
        return;
      }
      if (!(await stat(file)).isFile()) {
        response.writeHead(404).end();
        return;
      }
      response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
      response.setHeader('Vary', 'Accept-Encoding');
      const gzip = (request.headers['accept-encoding'] ?? '').split(',').some((entry) => {
        const [name, ...parameters] = entry.trim().toLowerCase().split(';');
        const quality = parameters.find((value) => value.trim().startsWith('q='));
        return name === 'gzip' && (quality === undefined || Number(quality.trim().slice(2)) > 0);
      });
      const compressed =
        gzip && ['.html', '.js', '.json', '.css', '.svg', '.wasm'].includes(extname(file));
      if (compressed) response.setHeader('Content-Encoding', 'gzip');
      if (request.method === 'HEAD') {
        response.end();
        return;
      }
      const source = createReadStream(file).on('error', () => response.destroy());
      if (compressed)
        source.pipe(createGzip().on('error', () => response.destroy())).pipe(response);
      else source.pipe(response);
    } catch {
      response.writeHead(404).end();
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = resolve(
    process.env.HARMONIA_PREVIEW_DIR ??
      fileURLToPath(new URL('../apps/mobile/dist/', import.meta.url)),
  );
  const server = createPreviewServer(root);
  server.listen(Number(process.env.HARMONIA_PREVIEW_PORT ?? 8084), '127.0.0.1', () =>
    console.log(`Harmonia-Vorschau: http://127.0.0.1:${server.address().port}`),
  );
}

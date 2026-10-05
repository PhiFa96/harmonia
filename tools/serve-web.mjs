// Lokale Vorschau des Web-Exports mit den für expo-sqlite nötigen HTTP-Headern.
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(
  process.env['HARMONIA_PREVIEW_DIR'] ??
    fileURLToPath(new URL('../apps/mobile/dist/', import.meta.url)),
);
const port = Number(process.env['HARMONIA_PREVIEW_PORT'] ?? 8084);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};
createServer(async (request, response) => {
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  try {
    const path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    let file = resolve(root, `.${path}`);
    if (file !== resolve(root) && !file.startsWith(resolve(root) + sep)) {
      response.writeHead(403).end();
      return;
    }
    if (!extname(path)) file = resolve(root, 'index.html');
    if (!(await stat(file)).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-cache');
    createReadStream(file)
      .on('error', () => response.destroy())
      .pipe(response);
  } catch {
    response.writeHead(404).end();
  }
}).listen(port, '127.0.0.1', () => console.log(`Harmonia-Vorschau: http://localhost:${port}`));

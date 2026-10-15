import { realpathSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createPreviewServer } from '../serve-web.mjs';
import { readPrivateJson, validateAccess, validAuthorization } from './access.mjs';
import { assertBetaReady } from './readiness.mjs';
import { verifyCandidate } from './web.mjs';
export function createBetaServer({ root, accessFile, files = [], now = () => Date.now() }) {
  root = realpathSync(root);
  accessFile = realpathSync(accessFile);
  if (accessFile === root || accessFile.startsWith(root + sep))
    throw Error('Access file must be outside the served app');
  validateAccess(readPrivateJson(accessFile));
  const allowed = new Set(files.map((item) => item.path));
  return createPreviewServer(root, {
    privateMode: true,
    allowFile: (file) => allowed.has(relative(root, file).split(sep).join('/')),
    authorize: (request, response) => {
      try {
        // Re-read on every request so expiry/revocation also protects cached Basic credentials.
        if (validAuthorization(request.headers.authorization, readPrivateJson(accessFile), now()))
          return true;
      } catch {
        /* Any missing/corrupt verifier fails closed. Do not log credentials. */
      }
      response.setHeader('WWW-Authenticate', 'Basic realm="Harmonia closed beta", charset="UTF-8"');
      response.writeHead(401).end();
      return false;
    },
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    assertBetaReady('web');
    const root = resolve(process.env.HARMONIA_BETA_DIR ?? 'artifacts/beta/candidates/web');
    const candidate = verifyCandidate(root);
    if (!process.env.HARMONIA_BETA_ACCESS_FILE) throw Error('Private access file required');
    const server = createBetaServer({
      root,
      accessFile: process.env.HARMONIA_BETA_ACCESS_FILE,
      files: candidate.files,
    });
    server.listen(Number(process.env.HARMONIA_BETA_PORT ?? 8095), '127.0.0.1', () =>
      console.log(
        'Private beta gateway listening on loopback; HTTPS proxy required for external access.',
      ),
    );
  } catch {
    console.error(
      'Web beta blocked. Run check:beta:start --platform web and verify candidate/access files.',
    );
    process.exitCode = 1;
  }
}

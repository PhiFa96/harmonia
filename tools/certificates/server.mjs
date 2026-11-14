import { createServer } from 'node:http';
import { readFileSync, mkdirSync, chmodSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { COLORS, SPACE, RADIUS } from '../../packages/ui/src/tokens.ts';
import { createCertificateService, DraftError, validLocale } from './service.mjs';
import { sampleCertificatePdf } from './pdf.mjs';
import { exact, validateCertificateOptions } from './errors.mjs';
import {
  createCertificatePaymentSimulation,
  validatePaymentSimulation,
} from './payment-simulation.mjs';

const root = new URL('../..', import.meta.url).pathname;
const fontRoot = new URL(
  '../../packages/notation/node_modules/@vexflow-fonts/bravura/',
  import.meta.url,
);
const cookieName = 'harmonia_certificate_draft';
const c = COLORS.light;
const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Harmonia</title><style>
@font-face{font-family:Bravura;src:url('/bravura.woff2') format('woff2');font-display:swap}
*{box-sizing:border-box}body{margin:0;font:16px/1.6 system-ui,sans-serif;background:${c.background};color:${c.text}}main{max-width:960px;margin:auto;padding:${SPACE.l}px}h1,h2{line-height:1.3}button,input,select{font:inherit;color:inherit;padding:${SPACE.s}px;min-height:48px;border:1px solid ${c.borderStrong};border-radius:${RADIUS.control}px;background:${c.surface};max-width:100%}button{cursor:pointer}button:disabled{opacity:.65;cursor:wait}button.primary{background:${c.primary};color:${c.onPrimary}}:focus-visible{outline:3px solid ${c.primary};outline-offset:3px}.draft{padding:${SPACE.m}px;background:${c.accent};color:${c.onAccent};font-weight:700}section{margin:${SPACE.l}px 0;padding:${SPACE.m}px;background:${c.surface};border:1px solid ${c.border};border-radius:${RADIUS.control}px}.actions{display:flex;flex-wrap:wrap;gap:${SPACE.s}px;margin:${SPACE.m}px 0}label{display:block;margin:${SPACE.s}px 0}label:has(input[type=radio]){padding:${SPACE.s}px;border:1px solid ${c.borderStrong};border-radius:${RADIUS.control}px}input[type=radio]{min-height:0;margin-right:${SPACE.s}px}fieldset{border:0;padding:0}input[type=text]{width:100%}.score{overflow:auto;max-width:100%;padding:${SPACE.s}px}.score svg{display:block}p,code{overflow-wrap:anywhere}[role=alert]:not(:empty){padding:${SPACE.s}px;border:2px solid ${c.danger}}[hidden]{display:none}a{color:${c.primaryText}}@media(max-width:500px){main{padding:${SPACE.m}px}}
</style></head><body><main></main><script src="/app.js" defer></script></body></html>`;

export async function createCertificateServer(options = {}) {
  validateCertificateOptions(options, [
    'database',
    'port',
    'now',
    'renderPdf',
    'paymentSimulation',
  ]);
  const {
    database = ':memory:',
    port = 0,
    now,
    renderPdf = sampleCertificatePdf,
    paymentSimulation = null,
  } = options;
  validatePaymentSimulation(paymentSimulation);
  if (
    !Number.isInteger(port) ||
    port < 0 ||
    port > 65535 ||
    (now !== undefined && typeof now !== 'function') ||
    typeof renderPdf !== 'function'
  )
    throw Error('Invalid certificate server configuration');
  const service = createCertificateService(database, {
    ...(now ? { now } : {}),
    paymentSimulation,
  });
  if (database !== ':memory:') chmodSync(database, 0o600);
  const bundle = await build({
    entryPoints: [new URL('./browser.ts', import.meta.url).pathname],
    absWorkingDir: root,
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'iife',
    target: 'es2022',
    minify: true,
    legalComments: 'inline',
  });
  let origin;
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; font-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    );
    const send = (status, value, type = 'application/json; charset=utf-8') => {
      res.writeHead(status, { 'Content-Type': type });
      res.end(type.startsWith('application/json') ? JSON.stringify(value) : value);
    };
    try {
      if (req.headers.host !== new URL(origin).host) throw new DraftError('invalid', 403);
      const url = new URL(req.url, origin);
      if (req.method === 'GET' && url.pathname === '/') {
        const cookie = /(?:^|;\s*)harmonia_certificate_draft=([a-f0-9]{64})(?:;|$)/.exec(
          req.headers.cookie ?? '',
        )?.[1];
        if (!service.resolveSession(cookie)) {
          const session = service.issueSession();
          if (!session) throw new DraftError('limit', 429);
          res.setHeader(
            'Set-Cookie',
            `${cookieName}=${session}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`,
          );
        }
        return send(200, html, 'text/html; charset=utf-8');
      }
      if (req.method === 'GET' && url.pathname === '/app.js')
        return send(200, bundle.outputFiles[0].text, 'text/javascript; charset=utf-8');
      if (req.method === 'GET' && url.pathname === '/bravura.woff2')
        return send(200, readFileSync(new URL('bravura.woff2', fontRoot)), 'font/woff2');
      if (req.method === 'GET' && url.pathname === '/font-license')
        return send(
          200,
          readFileSync(new URL('LICENSE.txt', fontRoot)),
          'text/plain; charset=utf-8',
        );
      const token = /(?:^|;\s*)harmonia_certificate_draft=([a-f0-9]{64})(?:;|$)/.exec(
        req.headers.cookie ?? '',
      )?.[1];
      const owner = service.resolveSession(token);
      if (!owner) throw new DraftError('sessionExpired', 401);
      if (req.method === 'GET' && url.pathname === '/api/state')
        return send(200, service.state(owner, validLocale(url.searchParams.get('locale'))));
      // Every write, verification and PDF request uses JSON POST plus same-origin validation.
      // No user names or verification codes in URLs or server access logs.
      if (req.method !== 'POST') throw new DraftError('notFound', 404);
      if (req.headers.origin !== origin || req.headers['content-type'] !== 'application/json')
        throw new DraftError('invalid', 403);
      let raw = '';
      for await (const chunk of req) {
        raw += chunk.toString('utf8');
        if (Buffer.byteLength(raw) > 16384) throw new DraftError('invalid', 413);
      }
      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        throw new DraftError('invalid');
      }
      if (service.resolveSession(token) !== owner) throw new DraftError('sessionExpired', 401);
      if (url.pathname === '/api/start') return send(200, service.start(owner, payload));
      if (url.pathname === '/api/order') return send(200, service.order(owner, payload));
      if (service.paymentMode() === 'local-simulation') {
        if (url.pathname === '/api/simulation/settle')
          return send(200, service.simulateSettlement(owner, payload));
        if (url.pathname === '/api/simulation/refund')
          return send(200, service.simulateRefund(owner, payload));
      }
      if (url.pathname === '/api/answer') return send(200, service.answer(owner, payload));
      if (url.pathname === '/api/finish') return send(200, service.finish(owner, payload));
      if (url.pathname === '/api/verify') return send(200, service.verify(payload));
      if (url.pathname === '/api/revoke') return send(200, service.revoke(owner, payload));
      if (url.pathname === '/api/remove') return send(200, service.remove(owner, payload));
      if (url.pathname === '/api/export') {
        exact(payload, []);
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="harmonia-certificate-test-data.json"',
        );
        return send(200, service.exportData(owner));
      }
      if (url.pathname === '/api/logout') {
        exact(payload, []);
        res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
        return send(200, service.logout(owner));
      }
      if (url.pathname === '/api/erase') {
        exact(payload, []);
        res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
        return send(200, service.erase(owner));
      }
      if (url.pathname === '/api/pdf') {
        if (!payload || Object.keys(payload).sort().join() !== 'id,locale')
          throw new DraftError('invalid');
        const pdf = await renderPdf(
          service.receipt(owner, payload.id),
          validLocale(payload.locale),
        );
        // Generation awaits font/PDF work. Logout, deletion, revocation or refund may have
        // completed meanwhile; recheck before sending any private document bytes.
        if (service.resolveSession(token) !== owner) throw new DraftError('sessionExpired', 401);
        service.receipt(owner, payload.id);
        res.setHeader('Content-Disposition', 'attachment; filename="harmonia-DRAFT-INVALID.pdf"');
        return send(200, Buffer.from(pdf), 'application/pdf');
      }
      throw new DraftError('notFound', 404);
    } catch (error) {
      send(error instanceof DraftError ? error.status : 500, {
        error: error instanceof DraftError ? error.code : 'error',
      });
    }
  });
  server.requestTimeout = 10_000;
  server.headersTimeout = 10_000;
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  origin = `http://127.0.0.1:${server.address().port}`;
  return {
    origin,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => {
          service.close();
          resolve();
        });
      }),
  };
}

export function certificatePreviewOptions(args) {
  if (
    !Array.isArray(args) ||
    (args.length !== 0 && (args.length !== 1 || args[0] !== '--simulate-payments'))
  )
    throw Error('Only local preview or explicit payment simulation is supported.');
  return { paymentSimulation: args.length === 1 ? createCertificatePaymentSimulation() : null };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const paymentOptions = certificatePreviewOptions(process.argv.slice(2));
  const dir = resolve('artifacts/certificates');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
  const port = Number(process.env.HARMONIA_CERTIFICATES_PORT ?? 8237);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid local port');
  const app = await createCertificateServer({
    database: resolve(dir, 'drafts.sqlite'),
    port,
    ...paymentOptions,
  });
  console.log(
    `Internal certificate draft: ${app.origin} (loopback only; payments ${paymentOptions.paymentSimulation ? 'simulated' : 'unavailable'}; no valid certificates)`,
  );
  for (const event of ['SIGINT', 'SIGTERM'])
    process.once(event, () => {
      void app.close();
    });
}

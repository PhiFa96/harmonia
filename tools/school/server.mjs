import { createLicenseService } from './license-service.mjs';
import { createQuizService } from './quiz-service.mjs';
import { createQuizStreams } from './quiz-streams.mjs';
import { readFileSync } from 'node:fs';
import { createAssignmentService } from './assignment-service.mjs';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { COLORS, SPACE, RADIUS } from '../../packages/ui/src/tokens.ts';
import { createSchoolDatabase, seedSchoolFixtures, FIXTURE_ACTORS } from './database.mjs';
import { createSchoolService, SchoolError } from './service.mjs';

const c = COLORS.light;
const bravura = new URL(
  '../../packages/notation/node_modules/@vexflow-fonts/bravura/bravura.woff2',
  import.meta.url,
);
const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Harmonia</title><style>
@font-face{font-family:Bravura;src:url('/bravura.woff2') format('woff2');font-display:swap}main[data-projector=true]{max-width:1600px;font-size:1.4rem}main[data-projector=true]>:not([data-school-content]){display:none}.quiz-panel code{font-size:2rem;letter-spacing:.12em}.score{overflow:auto;max-width:100%}.score svg{display:block}fieldset{border:0;padding:0}input[type=checkbox],input[type=radio]{width:auto;min-height:0}*{box-sizing:border-box}body{margin:0;background:${c.background};color:${c.text};font:16px/1.6 system-ui,sans-serif}main{max-width:1050px;margin:auto;padding:${SPACE.l}px}h1,h2,h3{line-height:1.3}section,article{margin:${SPACE.m}px 0;padding:${SPACE.m}px;border:1px solid ${c.border};border-radius:${RADIUS.control}px;background:${c.surface}}button,input,select{font:inherit;color:inherit;background:${c.surface};border:1px solid ${c.borderStrong};border-radius:${RADIUS.control}px;padding:${SPACE.s}px;min-height:48px;max-width:100%}input{width:100%}button{cursor:pointer}button:disabled{opacity:.65;cursor:wait}label{display:block;margin:${SPACE.s}px 0}.actions{display:flex;flex-wrap:wrap;gap:${SPACE.s}px;margin:${SPACE.s}px 0}.draft{background:${c.accent};color:${c.onAccent};padding:${SPACE.m}px;font-weight:700}.note{color:${c.textMuted}}p,code{overflow-wrap:anywhere}:focus-visible{outline:3px solid ${c.primary};outline-offset:3px}[role=alert]:not(:empty){padding:${SPACE.s}px;border:2px solid ${c.danger}}@media(max-width:500px){main{padding:${SPACE.m}px}}
</style></head><body><main></main><script src="/app.js" defer></script></body></html>`;

export async function createSchoolServer({ pool, port = 0, fixtureActors = FIXTURE_ACTORS } = {}) {
  if (!pool) throw new Error('An isolated school fixture database is required');
  const service = createSchoolService(pool),
    sessions = new Map();
  const licenses = createLicenseService(pool);
  const assignments = createAssignmentService(pool);
  const quiz = createQuizService(pool);
  const quizStreams = createQuizStreams(quiz);
  const bundle = await build({
    entryPoints: [new URL('./browser.ts', import.meta.url).pathname],
    absWorkingDir: new URL('../..', import.meta.url).pathname,
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'iife',
    target: 'es2022',
    minify: true,
  });
  let origin;
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    );
    const send = (status, value, type = 'application/json; charset=utf-8') => {
      res.writeHead(status, { 'Content-Type': type });
      res.end(type.startsWith('application/json') ? JSON.stringify(value) : value);
    };
    try {
      if (req.headers.host !== new URL(origin).host) throw new SchoolError('forbidden', 403);
      const url = new URL(req.url, origin);
      const token = /(?:^|;\s*)harmonia_school_draft=([a-f0-9]{64})(?:;|$)/.exec(
        req.headers.cookie ?? '',
      )?.[1];
      let session = sessions.get(token);
      if (req.method === 'GET' && url.pathname === '/') {
        if (!session) {
          if (sessions.size >= 128) throw new SchoolError('error', 503);
          const value = randomBytes(32).toString('hex');
          session = { actor: fixtureActors[0] };
          sessions.set(value, session);
          res.setHeader(
            'Set-Cookie',
            `harmonia_school_draft=${value}; Path=/; HttpOnly; SameSite=Strict`,
          );
        }
        return send(200, html, 'text/html; charset=utf-8');
      }
      if (req.method === 'GET' && url.pathname === '/app.js')
        return send(200, bundle.outputFiles[0].text, 'text/javascript; charset=utf-8');
      if (req.method === 'GET' && url.pathname === '/bravura.woff2')
        return send(200, readFileSync(bravura), 'font/woff2');
      if (!session) throw new SchoolError('forbidden', 401);
      // Capture this request's actor before awaiting anything or changing a demo session.
      const actor = session.actor;
      if (req.method === 'GET' && url.pathname === '/api/quiz-events') {
        if (req.headers.origin && req.headers.origin !== origin)
          throw new SchoolError('forbidden', 403);
        const opened = await quizStreams.open(req, res, session, {
          id: url.searchParams.get('id'),
          locale: url.searchParams.get('locale'),
          mode: url.searchParams.get('mode'),
        });
        if (!opened) throw new SchoolError('error', 503);
        return;
      }
      if (req.method === 'GET' && url.pathname === '/api/state')
        return send(200, { actor, actors: fixtureActors, ...(await service.state(actor.id)) });
      if (req.method === 'GET' && url.pathname === '/api/report')
        return send(200, await service.report(actor.id, url.searchParams.get('class')));
      if (req.method !== 'POST') throw new SchoolError('forbidden', 404);
      if (req.headers.origin !== origin || req.headers['content-type'] !== 'application/json')
        throw new SchoolError('forbidden', 403);
      const chunks = [];
      let bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 8192) throw new SchoolError('invalid', 413);
        chunks.push(chunk);
      }
      let body;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        throw new SchoolError('invalid');
      }
      if (url.pathname === '/api/session') {
        if (!body || Object.keys(body).join() !== 'actor') throw new SchoolError('invalid');
        const next = fixtureActors.find((a) => a.key === body.actor);
        if (!next) throw new SchoolError('invalid');
        session.actor = next;
        quizStreams.wake();
        return send(200, { ok: true });
      }
      if (url.pathname.startsWith('/api/license-'))
        return send(
          200,
          await licenses.call(actor.id, url.pathname.slice('/api/license-'.length), body),
        );
      if (url.pathname.startsWith('/api/quiz-')) {
        const result = await quiz.call(actor.id, url.pathname.slice('/api/quiz-'.length), body);
        quizStreams.wake();
        return send(200, result);
      }
      if (url.pathname.startsWith('/api/assignment-'))
        return send(
          200,
          await assignments.call(actor.id, url.pathname.slice('/api/assignment-'.length), body),
        );
      if (!url.pathname.startsWith('/api/')) throw new SchoolError('forbidden', 404);
      const result = await service.act(actor.id, url.pathname.slice(5), body);
      quizStreams.wake();
      return send(200, result);
    } catch (error) {
      send(error instanceof SchoolError ? error.status : 500, {
        error: error instanceof SchoolError ? error.code : 'error',
      });
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  origin = `http://127.0.0.1:${server.address().port}`;
  return {
    origin,
    close: () =>
      new Promise((resolve) => {
        quizStreams.close();
        server.closeAllConnections();
        server.close(() => {
          sessions.clear();
          resolve();
        });
      }),
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv.length !== 2) throw new Error('Only a local synthetic preview is supported');
  const port = Number(process.env.HARMONIA_SCHOOL_PORT ?? 8238);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid local port');
  const database = await createSchoolDatabase();
  let app;
  try {
    await seedSchoolFixtures(database.pool);
    app = await createSchoolServer({ pool: database.pool, port });
  } catch (error) {
    await database.close();
    throw error;
  }
  console.log(`Internal synthetic school preview: ${app.origin}. Stop to delete all preview data.`);
  let closing = false;
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.once(signal, () => {
      if (!closing) {
        closing = true;
        void app.close().then(() => database.close());
      }
    });
}

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const exec = promisify(execFile);
const dockerArgs = ['--host=unix:///var/run/docker.sock'];
const dockerEnv = { ...process.env };
for (const name of [
  'DOCKER_HOST',
  'DOCKER_CONTEXT',
  'DOCKER_TLS',
  'DOCKER_TLS_VERIFY',
  'DOCKER_CERT_PATH',
])
  delete dockerEnv[name];
async function docker(args, options = {}) {
  return exec('docker', [...dockerArgs, ...args], { env: dockerEnv, ...options });
}

/** Disposable, loopback-only PostgreSQL. No URL option, existing database or host volume. */
export async function createSchoolDatabase() {
  const name = `harmonia-school-${randomUUID()}`;
  const password = randomBytes(32).toString('hex');
  let pool;
  const close = async () => {
    await pool?.end();
    await docker(['rm', '-f', name]).catch(() => {});
  };
  try {
    await docker(
      [
        'run',
        '--detach',
        '--rm',
        '--name',
        name,
        '--publish',
        '127.0.0.1::5432',
        '--tmpfs',
        '/var/lib/postgresql/data:rw,nosuid,noexec,size=256m',
        '--env',
        'POSTGRES_PASSWORD',
        '--env',
        'POSTGRES_DB=school_draft',
        'postgres:17-alpine',
      ],
      { env: { ...dockerEnv, POSTGRES_PASSWORD: password } },
    );
    const { stdout } = await docker(['port', name, '5432/tcp']);
    const address = /^127\.0\.0\.1:(\d+)\s*$/.exec(stdout);
    if (!address) throw new Error('Expected a loopback PostgreSQL port');
    pool = new pg.Pool({
      host: '127.0.0.1',
      port: Number(address[1]),
      user: 'postgres',
      password,
      database: 'school_draft',
      max: 10,
      connectionTimeoutMillis: 1000,
      statement_timeout: 10000,
    });
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try {
        await pool.query('select 1');
        ready = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    if (!ready) throw new Error('Local PostgreSQL did not start');
    await pool.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
    await pool.query(await readFile(new URL('./assignments.sql', import.meta.url), 'utf8'));
    return { pool, close };
  } catch (error) {
    await close();
    // A docker command failure may carry process metadata; do not log its environment.
    // eslint-disable-next-line preserve-caught-error -- Docker error metadata may contain the private runtime password.
    throw new Error(`Local school database failed: ${error.message.split('\n')[0]}`);
  }
}

export const FIXTURE_ACTORS = [
  ['adminA', 'staff'],
  ['teacherA', 'staff'],
  ['teacherB', 'staff'],
  ['adminB', 'staff'],
  ['teacherC', 'staff'],
  ['learnerA', 'learner'],
  ['learnerB', 'learner'],
  ['learnerC', 'learner'],
].map(([key, kind], index) => ({
  key,
  kind,
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
}));

export async function seedSchoolFixtures(pool) {
  for (const a of FIXTURE_ACTORS)
    await pool.query('insert into school_draft.actors(id,key,kind) values($1,$2,$3)', [
      a.id,
      a.key,
      a.kind,
    ]);
  for (const [n, a] of FIXTURE_ACTORS.filter((a) => a.kind === 'learner').entries()) {
    for (const [i, area] of ['notation', 'intervals', 'rhythm'].entries())
      await pool.query(
        'insert into school_draft.sample_evidence(actor_id,area,correct,total,completed) values($1,$2,$3,10,$4)',
        [a.id, area, Math.max(0, 9 - i * 2 - n), i + 1],
      );
  }
}

/** SET LOCAL prevents actor claims leaking through a pooled connection. */
export async function asActor(pool, id, work) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query('set local role harmonia_school_actor');
    await client.query("select set_config('school_draft.actor',$1,true)", [id]);
    const result = await work(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

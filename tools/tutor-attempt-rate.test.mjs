// Actual PostgreSQL and concurrent connections; no remote URL or existing database.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const exec = promisify(execFile),
  name = 'harmonia-tutor-rate-' + randomUUID();
const environment = { ...process.env };
for (const key of [
  'DOCKER_HOST',
  'DOCKER_CONTEXT',
  'DOCKER_TLS',
  'DOCKER_TLS_VERIFY',
  'DOCKER_CERT_PATH',
])
  delete environment[key];
async function docker(args, env = environment) {
  try {
    return await exec('docker', ['--host=unix:///var/run/docker.sock', ...args], { env });
  } catch {
    // Do not expose subprocess metadata containing a private runtime password.
    throw new Error('Isolated tutor PostgreSQL command failed');
  }
}
let pool;
const actor = randomUUID(),
  other = randomUUID(),
  old = randomUUID();
before(async () => {
  const password = randomBytes(32).toString('hex');
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
      '/var/lib/postgresql/data:rw,nosuid,noexec,size=128m',
      '--env',
      'POSTGRES_PASSWORD',
      'postgres:17-alpine',
    ],
    { ...environment, POSTGRES_PASSWORD: password },
  );
  const { stdout } = await docker(['port', name, '5432/tcp']);
  const address = /^127\.0\.0\.1:(\d+)\s*$/.exec(stdout);
  assert.ok(address, 'Loopback-only PostgreSQL port');
  pool = new pg.Pool({
    host: '127.0.0.1',
    port: Number(address[1]),
    user: 'postgres',
    password,
    database: 'postgres',
    max: 8,
    connectionTimeoutMillis: 1000,
    statement_timeout: 10000,
  });
  let ready = false;
  for (let n = 0; n < 60; n++) {
    try {
      await pool.query('select 1');
      ready = true;
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  assert.ok(ready, 'Private PostgreSQL starts');
  await pool.query(`create schema auth; create table auth.users(id uuid primary key);
    create role anon nologin;create role authenticated nologin;create role service_role nologin;
    insert into auth.users values('${actor}'),('${other}'),('${old}');`);
  await pool.query(
    await readFile(
      new URL('../supabase/migrations/20261113090000_tutor_attempt_security.sql', import.meta.url),
      'utf8',
    ),
  );
});
after(async () => {
  await pool?.end();
  await docker(['rm', '-f', name]).catch(() => {});
});

async function asRole(role, query, values = []) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    // Role is a fixed test identifier, never request input.
    await client.query('set local role ' + role);
    const result = await client.query(query, values);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
test('parallel PostgreSQL connections cannot exceed thirty grading admissions', async () => {
  const wave = await Promise.all(
    Array.from({ length: 60 }, () =>
      asRole('service_role', 'select public.consume_tutor_attempt($1) as value', [actor]),
    ),
  );
  assert.equal(wave.filter((r) => r.rows[0].value.allowed).length, 30);
  assert.equal(wave.filter((r) => !r.rows[0].value.allowed).length, 30);
  for (const row of wave.filter((r) => !r.rows[0].value.allowed))
    assert.ok(row.rows[0].value.retryAfter >= 1 && row.rows[0].value.retryAfter <= 60);
  assert.equal(
    (await pool.query('select requests from public.tutor_attempt_limits where user_id=$1', [actor]))
      .rows[0].requests,
    30,
  );
});
test('client roles cannot inspect, forge, exhaust or purge security counters', async () => {
  for (const role of ['anon', 'authenticated'])
    for (const query of [
      'select * from public.tutor_attempt_limits',
      `update public.tutor_attempt_limits set requests=1`,
      `select public.consume_tutor_attempt('${other}')`,
      'select public.retain_tutor_attempt_limits()',
    ])
      await assert.rejects(asRole(role, query), (error) => error.code === '42501');
});
test('accounts have independent windows and a fresh window resets the counter', async () => {
  assert.equal(
    (await asRole('service_role', 'select public.consume_tutor_attempt($1) as value', [other]))
      .rows[0].value.allowed,
    true,
  );
  await pool.query(
    "update public.tutor_attempt_limits set window_started_at=clock_timestamp()-interval '61 seconds' where user_id=$1",
    [actor],
  );
  assert.equal(
    (await asRole('service_role', 'select public.consume_tutor_attempt($1) as value', [actor]))
      .rows[0].value.allowed,
    true,
  );
  assert.equal(
    (await pool.query('select requests from public.tutor_attempt_limits where user_id=$1', [actor]))
      .rows[0].requests,
    1,
  );
});
test('retention removes old metadata, keeps live limits, and Auth deletion cascades', async () => {
  await asRole('service_role', 'select public.consume_tutor_attempt($1)', [old]);
  await pool.query(
    "update public.tutor_attempt_limits set window_started_at=clock_timestamp()-interval '2 days' where user_id=$1",
    [old],
  );
  assert.equal(
    (await asRole('service_role', 'select public.retain_tutor_attempt_limits() as value')).rows[0]
      .value.changed,
    1,
  );
  assert.equal(
    (await pool.query('select count(*)::int as n from public.tutor_attempt_limits')).rows[0].n,
    2,
  );
  await pool.query('delete from auth.users where id=$1', [actor]);
  assert.equal(
    (
      await pool.query(
        'select count(*)::int as n from public.tutor_attempt_limits where user_id=$1',
        [actor],
      )
    ).rows[0].n,
    0,
  );
});

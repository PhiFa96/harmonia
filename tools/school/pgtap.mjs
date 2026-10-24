import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import pg from 'pg';
import { createSchoolDatabase, seedSchoolFixtures } from './database.mjs';

const supabase = process.argv.length === 3 && process.argv[2] === '--supabase';
if (process.argv.length > 2 && !supabase)
  throw new Error(
    'Use no arguments for disposable PostgreSQL, or --supabase for the local CI database',
  );
const database = supabase
  ? {
      pool: new pg.Pool({
        host: '127.0.0.1',
        port: 54322,
        user: 'postgres',
        password: 'postgres',
        database: 'postgres',
        max: 1,
      }),
      close: async () => {
        await database.pool.end();
      },
    }
  : await createSchoolDatabase();
let client;
try {
  client = await database.pool.connect();
  await client.query('begin');
  if (supabase) {
    await client.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
    await client.query(await readFile(new URL('./assignments.sql', import.meta.url), 'utf8'));
    await client.query(await readFile(new URL('./quiz.sql', import.meta.url), 'utf8'));
    await client.query(
      'create extension if not exists pgtap with schema extensions; grant usage on schema extensions to harmonia_school_actor; set local search_path=public,extensions',
    );
  } else {
    // PostgreSQL's official Alpine image has no pgTAP package. Use the unchanged,
    // checksum-pinned SQL-only upstream release with its two build substitutions.
    const { stdout } = await promisify(execFile)(
      'curl',
      [
        '--fail',
        '--silent',
        '--show-error',
        '--location',
        '--max-time',
        '30',
        'https://raw.githubusercontent.com/theory/pgtap/v1.3.4/sql/pgtap.sql.in',
      ],
      { maxBuffer: 2 * 1024 * 1024 },
    );
    assert.equal(
      createHash('sha256').update(stdout).digest('hex'),
      '383ecd73edfd1c7ed5f3b835134ee1fe74e201ee31599346c92ea029b65dcdce',
      'Pinned pgTAP 1.3.4 SQL source',
    );
    await client.query(
      stdout
        .replaceAll('__OS__', 'linux')
        .replaceAll('__VERSION__', '1.3')
        .replaceAll('MODULE_PATHNAME', 'pgtap'),
    );
    // Supabase's postgres is not a superuser. Reproduce its CREATEROLE boundary
    // locally so an implicit superuser SET ROLE privilege cannot hide CI errors.
    await client.query(`drop schema school_draft cascade;
      drop role harmonia_school_actor;
      drop role harmonia_school_grader;
      create role harmonia_school_setup nologin nosuperuser createrole;
      grant create on database school_draft to harmonia_school_setup;
      set local role harmonia_school_setup`);
    await client.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
    await client.query(await readFile(new URL('./assignments.sql', import.meta.url), 'utf8'));
    await client.query(await readFile(new URL('./quiz.sql', import.meta.url), 'utf8'));
  }
  // PostgreSQL 16+ grants a role creator ADMIN but not necessarily SET permission.
  // This test-only membership, schema and fixture data all roll back together.
  await client.query('grant harmonia_school_actor to current_user with inherit false, set true');
  await client.query('grant harmonia_school_grader to current_user with inherit false, set true');
  await seedSchoolFixtures(client);
  const results = await client.query(
    (await readFile(new URL('./access.test.sql', import.meta.url), 'utf8')) +
      (await readFile(new URL('./assignment-access.test.sql', import.meta.url), 'utf8')) +
      (await readFile(new URL('./quiz-access.test.sql', import.meta.url), 'utf8')) +
      '\nselect * from finish();',
  );
  const lines = results
    .flatMap((r) => r.rows.flatMap((row) => Object.values(row)))
    .filter((value) => typeof value === 'string' && /^(ok |not ok |1\.\.|#)/.test(value));
  for (const line of lines) console.log(line);
  assert.ok(
    lines.some((line) => /^1\.\.\d+$/.test(line)),
    'A complete TAP plan is required',
  );
  assert.ok(
    !lines.some((line) => /^not ok|# Looks like/.test(line)),
    'All pgTAP assertions must pass',
  );
} finally {
  if (client) {
    await client.query('rollback');
    client.release();
  }
  await database.close();
}

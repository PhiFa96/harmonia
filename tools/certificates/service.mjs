import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { isDeepStrictEqual } from 'node:util';
import { catalogue } from '../../packages/content/src/authoring.ts';
import {
  createExamRun,
  answerExam,
  finishExam,
  examResult,
} from '../../packages/content/src/exam.ts';
import {
  choiceLabel,
  exerciseDescription,
  exercisePrompt,
  currentItem,
  isAuralExercise,
} from '../../packages/exercises/src/index.ts';
import { layoutScore, layoutToSvg, scoreTimeline } from '../../packages/notation/src/index.ts';
import { CERTIFICATE_PROFILES } from './profiles.ts';
import { certificateSourceHash, SOURCE_HASH } from './binding.mjs';
import { DraftError, exact, identifier } from './errors.mjs';
import { certificatePurchases } from './purchases.mjs';
import { certificateSessions } from './sessions.mjs';
export { DraftError } from './errors.mjs';
const hash = (value) => createHash('sha256').update(value).digest('hex');
export const RETENTION_MS = 7 * 24 * 60 * 60_000;
export const DRAFT_CODE = /^DRAFT-[A-F0-9]{32}$/;

export function validLocale(locale) {
  if (!['de', 'en-US', 'en-GB'].includes(locale)) throw new DraftError('invalid');
  return locale;
}

/** An explicitly local fixture store. Server clock, seeds, grading and receipts stay here. */
export function createCertificateService(
  filename,
  { now = Date.now, sourceHash = certificateSourceHash() } = {},
) {
  if (!SOURCE_HASH.test(sourceHash)) throw Error('Invalid certificate source hash');
  const db = new DatabaseSync(filename);
  db.exec(`pragma foreign_keys=on; pragma journal_mode=DELETE; pragma secure_delete=on;
    create table if not exists certificate_drafts (
      id text primary key, owner text not null, profile text not null,
      seed text not null, fingerprint text not null, started integer not null,
      answers text not null default '[]', finished integer, reason text,
      result text, code text unique, revoked integer
    );
    create index if not exists draft_owner on certificate_drafts(owner,started);`);
  // Additive local migration: legacy attempts have no verifiable implementation binding.
  if (
    !db
      .prepare('pragma table_info(certificate_drafts)')
      .all()
      .some((c) => c.name === 'source_hash')
  )
    db.exec('alter table certificate_drafts add column source_hash text');
  for (const column of ['invalidated integer', 'purchase_id text']) {
    if (
      !db
        .prepare('pragma table_info(certificate_drafts)')
        .all()
        .some((c) => c.name === column.split(' ')[0])
    )
      db.exec('alter table certificate_drafts add column ' + column);
  }
  db.exec(
    'drop index if exists one_active_draft; create unique index one_active_draft on certificate_drafts(owner) where finished is null and invalidated is null',
  );

  const profileFor = (id) => {
    const profile = CERTIFICATE_PROFILES.find((p) => p.id === id);
    if (!profile) throw new DraftError('invalid');
    return profile;
  };
  const purchases = certificatePurchases(db, { now, profileFor });
  const sessions = certificateSessions(db, now);
  function reconstruct(row) {
    requireCurrent(row);
    const profile = CERTIFICATE_PROFILES.find((p) => p.id === row.profile);
    if (
      !profile ||
      !Number.isSafeInteger(row.started) ||
      typeof row.seed !== 'string' ||
      !row.seed.length ||
      row.seed.length > 200
    )
      throw new DraftError('outdated', 409);
    let run = createExamRun(catalogue, [profile.template], profile.id, row.seed, row.started);
    const fingerprint = hash(
      JSON.stringify({ version: catalogue.contentVersion, profile, items: run.session.items }),
    );
    if (fingerprint !== row.fingerprint) throw new DraftError('outdated', 409);
    let answers;
    try {
      answers = JSON.parse(row.answers);
    } catch {
      throw new DraftError('outdated', 409);
    }
    if (!Array.isArray(answers) || answers.length > run.template.questions.length)
      throw new DraftError('outdated', 409);
    let previousAt = row.started;
    for (const entry of answers) {
      if (
        !entry ||
        run.session.index !== entry.index ||
        typeof entry.value !== 'string' ||
        !currentItem(run.session)?.choices.includes(entry.value) ||
        !Number.isFinite(entry.at) ||
        entry.at < previousAt ||
        entry.at >= run.deadlineAt
      )
        throw new DraftError('outdated', 409);
      run = answerExam(run, entry.value, entry.at);
      previousAt = entry.at;
    }
    if (row.finished !== null) {
      if (
        !Number.isFinite(row.finished) ||
        row.finished < row.started ||
        row.finished > run.deadlineAt
      )
        throw new DraftError('outdated', 409);
      run = finishExam(run, row.finished);
      let stored;
      try {
        stored = JSON.parse(row.result);
      } catch {
        throw new DraftError('outdated', 409);
      }
      if (
        run.endedAt !== row.finished ||
        run.endReason !== row.reason ||
        !isDeepStrictEqual(stored, receiptFor(row, run, row.code))
      )
        throw new DraftError('outdated', 409);
    } else if (run.endedAt !== undefined) throw new DraftError('outdated', 409);
    return run;
  }
  function requireCurrent(row) {
    if (row.invalidated !== null || row.source_hash !== sourceHash)
      throw new DraftError('outdated', 409);
    if (purchases.refunded(row)) throw new DraftError('purchaseRefunded', 409);
    if (!purchases.authorized(row)) throw new DraftError('outdated', 409);
  }
  function receiptFor(row, run, code) {
    const result = examResult(run);
    const profile = profileFor(row.profile);
    const qualified =
      result.unanswered === 0 && result.points * 100 >= result.maxPoints * profile.thresholdPercent;
    if (qualified ? !DRAFT_CODE.test(code) : code !== null) throw new DraftError('outdated', 409);
    return {
      ...result,
      qualified,
      stage: profile.stage,
      profileVersion: profile.version,
      contentVersion: run.contentVersion,
      thresholdPercent: profile.thresholdPercent,
      status: 'draft',
      issuedAt: run.endedAt,
      code,
      sourceHash: row.source_hash,
    };
  }
  function finalize(row, run) {
    const result = examResult(run),
      profile = profileFor(row.profile);
    const qualified =
      result.unanswered === 0 && result.points * 100 >= result.maxPoints * profile.thresholdPercent;
    const code = qualified ? 'DRAFT-' + randomBytes(16).toString('hex').toUpperCase() : null;
    const receipt = receiptFor(row, run, code);
    db.prepare(
      'update certificate_drafts set finished=?,reason=?,result=?,code=? where id=? and finished is null',
    ).run(run.endedAt, run.endReason, JSON.stringify(receipt), code, row.id);
    return owned(row.owner, row.id);
  }
  function owned(owner, id, cutoff) {
    const row = db
      .prepare(
        'select * from certificate_drafts where owner=? and id=? and (? is null or started>=?)',
      )
      .get(owner, id, cutoff ?? null, cutoff ?? null);
    if (!row) throw new DraftError('notFound', 404);
    return row;
  }
  function expire(row, instant) {
    if (row.finished !== null) return row;
    const run = reconstruct(row);
    return instant >= run.deadlineAt ? finalize(row, finishExam(run, instant)) : row;
  }
  function view(row, locale, instant) {
    const base = {
      id: row.id,
      profile: row.profile,
      startedAt: row.started,
      serverNow: instant,
      deadlineAt:
        row.started +
        (CERTIFICATE_PROFILES.find((p) => p.id === row.profile)?.template.minutes ?? 0) * 60_000,
      purchaseId: row.purchase_id,
    };
    if (purchases.refunded(row)) return { ...base, phase: 'cancelled' };
    let run;
    try {
      run = reconstruct(row);
    } catch (error) {
      if (!(error instanceof DraftError) || error.code !== 'outdated') throw error;
      return { ...base, phase: 'outdated' };
    }
    if (row.finished !== null)
      return {
        ...base,
        phase: 'finished',
        reason: row.reason,
        result: { ...JSON.parse(row.result), revoked: row.revoked !== null },
      };
    if (instant >= run.deadlineAt) {
      const ended = finishExam(run, instant);
      return {
        ...base,
        phase: 'finished',
        reason: ended.endReason,
        result: { ...receiptFor(row, ended, null), revoked: row.revoked !== null },
      };
    }
    const item = currentItem(run.session);
    if (!item) throw new DraftError('outdated', 409);
    const aural = isAuralExercise(item);
    const score =
      'score' in item
        ? item.score
        : item.type === 'CONTEXT_CHOICE' && item.source.kind === 'score'
          ? item.source.score
          : null;
    const question = {
      index: run.session.index,
      total: run.template.questions.length,
      area: run.template.questions[run.session.index].area,
      prompt: exercisePrompt(item, locale),
      choices: item.choices.map((id) => ({ id, label: choiceLabel(item, id, locale) })),
      svg: score && !aural ? layoutToSvg(layoutScore(score)) : null,
      // Wie in der App: Positionen statt Tonnamen, sonst verrät die Beschreibung die Lösung.
      description: score && !aural ? [{ text: exerciseDescription(item, locale) }] : null,
      audio:
        score && aural
          ? scoreTimeline(score, { bpm: 90, beat: { value: 'quarter', dots: 0 } })
          : null,
    };
    if (!question.choices.length || (aural && !question.audio))
      throw new DraftError('outdated', 409);
    return { ...base, phase: 'active', question };
  }
  // Nur Schreibvorgänge dürfen Fristen/Invalidierung persistieren und Slots freigeben.
  function advance(row, locale, instant) {
    const projected = view(row, locale, instant);
    if (
      projected.phase === 'outdated' ||
      (projected.phase === 'cancelled' && row.finished === null)
    ) {
      db.prepare(
        'update certificate_drafts set invalidated=coalesce(invalidated,?) where id=?',
      ).run(instant, row.id);
      return owned(row.owner, row.id);
    }
    return projected.phase === 'finished' && row.finished === null ? expire(row, instant) : row;
  }
  function prune(instant) {
    const cutoff = instant - RETENTION_MS;
    const attempts = db
      .prepare('delete from certificate_drafts where started<?')
      .run(cutoff).changes;
    const purchasesRemoved = db
      .prepare(
        'delete from certificate_purchases where created<? and not exists(select 1 from certificate_drafts d where d.id=certificate_purchases.attempt_id)',
      )
      .run(cutoff).changes;
    return { attempts, purchases: purchasesRemoved };
  }
  function readTransaction(work) {
    // SQLite sperrt auch versehentlich ergänzte Schreibbefehle innerhalb einer Leseansicht.
    db.exec('pragma query_only=on');
    try {
      db.exec('begin');
      try {
        const result = work(now());
        db.exec('commit');
        return result;
      } catch (error) {
        db.exec('rollback');
        throw error;
      }
    } finally {
      db.exec('pragma query_only=off');
    }
  }
  function writeTransaction(work) {
    db.exec('begin immediate');
    try {
      const instant = now();
      const removed = prune(instant);
      const result = work(instant, removed);
      db.exec('commit');
      return result;
    } catch (error) {
      db.exec('rollback');
      throw error;
    }
  }
  const profileViews = CERTIFICATE_PROFILES.map((p) => ({
    id: p.id,
    stage: p.stage,
    version: p.version,
    thresholdPercent: p.thresholdPercent,
    minutes: p.template.minutes,
    questions: p.template.questions.length,
    maxPoints: p.template.questions.length * p.template.pointsPerQuestion,
  }));
  return {
    close: () => db.close(),
    maintain: () => writeTransaction((_instant, removed) => removed),
    issueSession: () => sessions.issue(),
    resolveSession: (token) => sessions.resolve(token),
    logout: (owner) => {
      sessions.revoke(owner);
      return { loggedOut: true };
    },
    order: (owner, payload) => writeTransaction(() => purchases.order(owner, payload)),
    settle: (owner, payload) => writeTransaction(() => purchases.settle(owner, payload)),
    refund: (owner, payload) => writeTransaction(() => purchases.refund(owner, payload)),
    state(owner, locale) {
      validLocale(locale);
      return readTransaction((instant) => {
        const rows = db
          .prepare(
            'select * from certificate_drafts where owner=? and started>=? order by started desc,id desc limit 20',
          )
          .all(owner, instant - RETENTION_MS);
        const attempts = rows.map((row) => view(row, locale, instant));
        return {
          profiles: profileViews,
          attempts,
          purchases: purchases.list(owner, instant - RETENTION_MS),
        };
      });
    },
    start(owner, payload) {
      exact(payload, ['profile', 'locale', 'purchase']);
      validLocale(payload.locale);
      return writeTransaction((instant) => {
        const profile = profileFor(payload.profile);
        const purchase = purchases.requirePaid(owner, payload.purchase, payload.profile);
        if (purchase.attempt_id) {
          const previous = db
            .prepare('select * from certificate_drafts where owner=? and id=?')
            .get(owner, purchase.attempt_id);
          if (!previous) throw new DraftError('purchaseConsumed', 409);
          return view(advance(previous, payload.locale, instant), payload.locale, instant);
        }
        let active = db
          .prepare(
            'select * from certificate_drafts where owner=? and finished is null and invalidated is null',
          )
          .get(owner);
        if (active) {
          active = advance(active, payload.locale, instant);
          const activeView = view(active, payload.locale, instant);
          if (activeView.phase === 'active') return activeView;
        }
        if (
          db.prepare('select count(*) as n from certificate_drafts where owner=?').get(owner).n >=
            20 ||
          db.prepare('select count(*) as n from certificate_drafts').get().n >= 5000
        )
          throw new DraftError('limit', 429);
        const seed = randomUUID(),
          id = randomUUID(),
          started = instant;
        const run = createExamRun(catalogue, [profile.template], profile.id, seed, started);
        const fingerprint = hash(
          JSON.stringify({ version: catalogue.contentVersion, profile, items: run.session.items }),
        );
        db.prepare(
          'insert into certificate_drafts(id,owner,profile,seed,fingerprint,started,source_hash,purchase_id) values(?,?,?,?,?,?,?,?)',
        ).run(id, owner, profile.id, seed, fingerprint, started, sourceHash, purchase.id);
        purchases.bind(owner, purchase.id, id);
        return view(owned(owner, id), payload.locale, instant);
      });
    },
    answer(owner, payload) {
      exact(payload, ['id', 'index', 'answer', 'locale']);
      validLocale(payload.locale);
      if (
        typeof payload.id !== 'string' ||
        !Number.isInteger(payload.index) ||
        payload.index < 0 ||
        typeof payload.answer !== 'string' ||
        payload.answer.length > 2000
      )
        throw new DraftError('invalid');
      return writeTransaction((instant) => {
        const stored = owned(owner, payload.id);
        requireCurrent(stored);
        let row = expire(stored, instant);
        const answers = JSON.parse(row.answers);
        const previous = answers.find((a) => a.index === payload.index);
        if (previous) {
          if (previous.value !== payload.answer) throw new DraftError('conflict', 409);
          return view(row, payload.locale, instant);
        }
        if (row.finished !== null) return view(row, payload.locale, instant);
        const run = reconstruct(row);
        if (payload.index !== run.session.index) throw new DraftError('conflict', 409);
        if (!currentItem(run.session).choices.includes(payload.answer))
          throw new DraftError('invalid');
        const next = answerExam(run, payload.answer, instant);
        if (next.session.records.length !== run.session.records.length + 1)
          throw new DraftError('invalid');
        answers.push({ index: payload.index, value: payload.answer, at: instant });
        db.prepare('update certificate_drafts set answers=? where id=?').run(
          JSON.stringify(answers),
          row.id,
        );
        row = owned(owner, row.id);
        if (next.endedAt !== undefined) row = finalize(row, next);
        return view(row, payload.locale, instant);
      });
    },
    finish(owner, payload) {
      exact(payload, ['id', 'locale']);
      validLocale(payload.locale);
      if (typeof payload.id !== 'string') throw new DraftError('invalid');
      return writeTransaction((instant) => {
        const stored = owned(owner, payload.id);
        requireCurrent(stored);
        let row = expire(stored, instant);
        if (row.finished === null) row = finalize(row, finishExam(reconstruct(row), instant));
        return view(row, payload.locale, instant);
      });
    },
    verify(payload) {
      exact(payload, ['code']);
      if (typeof payload.code !== 'string' || !DRAFT_CODE.test(payload.code))
        return { status: 'notFound' };
      return readTransaction((instant) => {
        const row = db
          .prepare('select * from certificate_drafts where code=? and started>=?')
          .get(payload.code, instant - RETENTION_MS);
        if (!row) return { status: 'notFound' };
        if (row.revoked !== null) return { status: 'revoked' };
        if (row.finished === null) return { status: 'outdatedCode' };
        try {
          reconstruct(row);
        } catch (error) {
          if (error instanceof DraftError && ['outdated', 'purchaseRefunded'].includes(error.code))
            return { status: 'outdatedCode' };
          throw error;
        }
        const result = JSON.parse(row.result);
        return {
          status: row.revoked === null ? 'draft' : 'revoked',
          stage: result.stage,
          issuedAt: result.issuedAt,
          profileVersion: result.profileVersion,
        };
      });
    },
    revoke(owner, payload) {
      exact(payload, ['id']);
      if (typeof payload.id !== 'string') throw new DraftError('invalid');
      return writeTransaction((instant) => {
        const row = owned(owner, payload.id);
        if (!row.code) throw new DraftError('notFound', 404);
        db.prepare('update certificate_drafts set revoked=coalesce(revoked,?) where id=?').run(
          instant,
          row.id,
        );
        return { status: 'revoked' };
      });
    },
    receipt(owner, id) {
      if (typeof id !== 'string') throw new DraftError('invalid');
      return readTransaction((instant) => {
        const row = owned(owner, id, instant - RETENTION_MS);
        reconstruct(row);
        if (!row.code) throw new DraftError('notFound', 404);
        if (row.revoked !== null) throw new DraftError('revoked', 410);
        return { id: row.id, ...JSON.parse(row.result) };
      });
    },
    erase(owner) {
      return writeTransaction(() => {
        db.prepare('delete from certificate_drafts where owner=?').run(owner);
        db.prepare('delete from certificate_purchases where owner=?').run(owner);
        sessions.revoke(owner);
        return { deleted: true };
      });
    },
    remove(owner, payload) {
      exact(payload, ['id']);
      identifier(payload.id);
      return writeTransaction(() => {
        owned(owner, payload.id);
        db.prepare('delete from certificate_drafts where owner=? and id=?').run(owner, payload.id);
        return { deleted: true };
      });
    },
    exportData(owner) {
      return readTransaction((instant) => ({
        version: 1,
        draft: true,
        exportedAt: instant,
        attempts: db
          .prepare(
            'select * from certificate_drafts where owner=? and started>=? order by started,id',
          )
          .all(owner, instant - RETENTION_MS)
          .map((row) => {
            const current = view(row, 'de', instant);
            let answers = null;
            try {
              answers = JSON.parse(row.answers);
            } catch {
              /* Preserve other records when one row is damaged. */
            }
            return {
              id: row.id,
              profile: row.profile,
              startedAt: row.started,
              finishedAt: current.result?.issuedAt ?? row.finished,
              phase: current.phase,
              reason: current.reason ?? row.reason,
              answers,
              result: current.result ?? null,
              revokedAt: row.revoked,
              sourceHash: row.source_hash,
              purchaseId: row.purchase_id,
            };
          }),
        purchases: purchases.list(owner, instant - RETENTION_MS),
      }));
    },
  };
}

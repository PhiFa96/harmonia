import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { catalogue } from '../../packages/content/src/authoring.ts';
import {
  createExamRun,
  answerExam,
  finishExam,
  examResult,
} from '../../packages/content/src/exam.ts';
import {
  choiceLabel,
  exercisePrompt,
  currentItem,
  isAuralExercise,
} from '../../packages/exercises/src/index.ts';
import {
  layoutScore,
  layoutToSvg,
  describeScore,
  scoreTimeline,
} from '../../packages/notation/src/index.ts';
import { CERTIFICATE_PROFILES } from './profiles.ts';

export class DraftError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}
const hash = (value) => createHash('sha256').update(value).digest('hex');
export const RETENTION_MS = 7 * 24 * 60 * 60_000;
export const DRAFT_CODE = /^DRAFT-[A-F0-9]{32}$/;

function exact(value, keys) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).sort().join() !== [...keys].sort().join()
  )
    throw new DraftError('invalid');
}
export function validLocale(locale) {
  if (!['de', 'en-US', 'en-GB'].includes(locale)) throw new DraftError('invalid');
  return locale;
}

/** An explicitly local fixture store. Server clock, seeds, grading and receipts stay here. */
export function createCertificateService(filename, { now = Date.now } = {}) {
  const db = new DatabaseSync(filename);
  db.exec(`pragma foreign_keys=on; pragma journal_mode=DELETE;
    create table if not exists certificate_drafts (
      id text primary key, owner text not null, profile text not null,
      seed text not null, fingerprint text not null, started integer not null,
      answers text not null default '[]', finished integer, reason text,
      result text, code text unique, revoked integer
    );
    create unique index if not exists one_active_draft on certificate_drafts(owner) where finished is null;
    create index if not exists draft_owner on certificate_drafts(owner,started);`);

  const profileFor = (id) => {
    const profile = CERTIFICATE_PROFILES.find((p) => p.id === id);
    if (!profile) throw new DraftError('invalid');
    return profile;
  };
  function reconstruct(row) {
    const profile = profileFor(row.profile);
    let run = createExamRun(catalogue, [profile.template], profile.id, row.seed, row.started);
    const fingerprint = hash(
      JSON.stringify({ version: catalogue.contentVersion, profile, items: run.session.items }),
    );
    if (fingerprint !== row.fingerprint) throw new DraftError('outdated', 409);
    for (const entry of JSON.parse(row.answers)) {
      if (run.session.index !== entry.index) throw new DraftError('outdated', 409);
      run = answerExam(run, entry.value, entry.at);
    }
    if (row.finished !== null) run = finishExam(run, row.finished);
    return run;
  }
  function finalize(row, run) {
    const result = examResult(run);
    const profile = profileFor(row.profile);
    const qualified =
      result.unanswered === 0 && result.points * 100 >= result.maxPoints * profile.thresholdPercent;
    const code = qualified ? 'DRAFT-' + randomBytes(16).toString('hex').toUpperCase() : null;
    const receipt = {
      ...result,
      qualified,
      stage: profile.stage,
      profileVersion: profile.version,
      contentVersion: run.contentVersion,
      thresholdPercent: profile.thresholdPercent,
      status: 'draft',
      issuedAt: run.endedAt,
      code,
    };
    db.prepare(
      'update certificate_drafts set finished=?,reason=?,result=?,code=? where id=? and finished is null',
    ).run(run.endedAt, run.endReason, JSON.stringify(receipt), code, row.id);
    return owned(row.owner, row.id);
  }
  function owned(owner, id) {
    const row = db
      .prepare('select * from certificate_drafts where owner=? and id=?')
      .get(owner, id);
    if (!row) throw new DraftError('notFound', 404);
    return row;
  }
  function expire(row) {
    if (row.finished !== null) return row;
    const run = reconstruct(row);
    return now() >= run.deadlineAt ? finalize(row, finishExam(run, now())) : row;
  }
  function view(row, locale) {
    row = expire(row);
    const base = {
      id: row.id,
      profile: row.profile,
      startedAt: row.started,
      serverNow: now(),
      deadlineAt: row.started + profileFor(row.profile).template.minutes * 60_000,
    };
    if (row.finished !== null)
      return {
        ...base,
        phase: 'finished',
        reason: row.reason,
        result: { ...JSON.parse(row.result), revoked: row.revoked !== null },
      };
    const run = reconstruct(row),
      item = currentItem(run.session);
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
      description:
        score && !aural
          ? describeScore(score, {
              language: locale === 'de' ? 'de' : 'en',
              variant: locale === 'en-GB' ? 'uk' : 'us',
            })
          : null,
      audio:
        score && aural
          ? scoreTimeline(score, { bpm: 90, beat: { value: 'quarter', dots: 0 } })
          : null,
    };
    if (!question.choices.length || (aural && !question.audio))
      throw new DraftError('outdated', 409);
    return { ...base, phase: 'active', question };
  }
  function transaction(work) {
    db.exec('begin immediate');
    try {
      db.prepare('delete from certificate_drafts where started<?').run(now() - RETENTION_MS);
      const result = work();
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
    state(owner, locale) {
      validLocale(locale);
      return transaction(() => {
        const rows = db
          .prepare(
            'select * from certificate_drafts where owner=? order by started desc,id desc limit 20',
          )
          .all(owner);
        const attempts = rows.map((row) => view(row, locale));
        return { profiles: profileViews, attempts };
      });
    },
    start(owner, payload) {
      exact(payload, ['profile', 'locale']);
      validLocale(payload.locale);
      return transaction(() => {
        const profile = profileFor(payload.profile);
        let active = db
          .prepare('select * from certificate_drafts where owner=? and finished is null')
          .get(owner);
        if (active) active = expire(active);
        if (active?.finished === null) return view(active, payload.locale);
        if (
          db.prepare('select count(*) as n from certificate_drafts where owner=?').get(owner).n >=
            20 ||
          db.prepare('select count(*) as n from certificate_drafts').get().n >= 5000
        )
          throw new DraftError('limit', 429);
        const seed = randomUUID(),
          id = randomUUID(),
          started = now();
        const run = createExamRun(catalogue, [profile.template], profile.id, seed, started);
        const fingerprint = hash(
          JSON.stringify({ version: catalogue.contentVersion, profile, items: run.session.items }),
        );
        db.prepare(
          'insert into certificate_drafts(id,owner,profile,seed,fingerprint,started) values(?,?,?,?,?,?)',
        ).run(id, owner, profile.id, seed, fingerprint, started);
        return view(owned(owner, id), payload.locale);
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
      return transaction(() => {
        let row = expire(owned(owner, payload.id));
        const answers = JSON.parse(row.answers);
        const previous = answers.find((a) => a.index === payload.index);
        if (previous) {
          if (previous.value !== payload.answer) throw new DraftError('conflict', 409);
          return view(row, payload.locale);
        }
        if (row.finished !== null) return view(row, payload.locale);
        const run = reconstruct(row);
        if (payload.index !== run.session.index) throw new DraftError('conflict', 409);
        if (!currentItem(run.session).choices.includes(payload.answer))
          throw new DraftError('invalid');
        const instant = now(),
          next = answerExam(run, payload.answer, instant);
        if (next.session.records.length !== run.session.records.length + 1)
          throw new DraftError('invalid');
        answers.push({ index: payload.index, value: payload.answer, at: instant });
        db.prepare('update certificate_drafts set answers=? where id=?').run(
          JSON.stringify(answers),
          row.id,
        );
        row = owned(owner, row.id);
        if (next.endedAt !== undefined) row = finalize(row, next);
        return view(row, payload.locale);
      });
    },
    finish(owner, payload) {
      exact(payload, ['id', 'locale']);
      validLocale(payload.locale);
      if (typeof payload.id !== 'string') throw new DraftError('invalid');
      return transaction(() => {
        let row = expire(owned(owner, payload.id));
        if (row.finished === null) row = finalize(row, finishExam(reconstruct(row), now()));
        return view(row, payload.locale);
      });
    },
    verify(payload) {
      exact(payload, ['code']);
      if (typeof payload.code !== 'string' || !DRAFT_CODE.test(payload.code))
        return { status: 'notFound' };
      return transaction(() => {
        const row = db.prepare('select * from certificate_drafts where code=?').get(payload.code);
        if (!row) return { status: 'notFound' };
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
      return transaction(() => {
        const row = owned(owner, payload.id);
        if (!row.code) throw new DraftError('notFound', 404);
        db.prepare('update certificate_drafts set revoked=coalesce(revoked,?) where id=?').run(
          now(),
          row.id,
        );
        return { status: 'revoked' };
      });
    },
    receipt(owner, id) {
      if (typeof id !== 'string') throw new DraftError('invalid');
      return transaction(() => {
        const row = owned(owner, id);
        if (!row.code) throw new DraftError('notFound', 404);
        if (row.revoked !== null) throw new DraftError('revoked', 410);
        return { id: row.id, ...JSON.parse(row.result) };
      });
    },
    erase(owner) {
      return transaction(() => {
        db.prepare('delete from certificate_drafts where owner=?').run(owner);
        return { deleted: true };
      });
    },
  };
}

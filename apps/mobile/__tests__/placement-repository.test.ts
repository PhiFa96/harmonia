import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDeviceRepository, initializeDeviceDatabase } from '@/storage/device-repository';
import { parsePlacementData, restorePlacement, resumePlacement } from '@/placement/model';
import {
  actPlacement,
  createPlacement,
  currentPlacementTask,
  expectedAnswer,
} from '@harmonia/exercises';
import { placementBank } from '@harmonia/content';
import { catalogue } from '@harmonia/content/catalogue';
import type { PlacementData } from '@/placement/model';
import type { LessonDatabase } from '@/storage/lesson-repository';
const bank = placementBank(catalogue);
function adapter(db: DatabaseSync): LessonDatabase {
  return {
    execAsync: (sql) => {
      db.exec(sql);
      return Promise.resolve();
    },
    runAsync: (sql, ...params) => Promise.resolve(db.prepare(sql).run(...params)),
    getFirstAsync: <T>(sql: string, ...params: (string | number)[]) =>
      Promise.resolve((db.prepare(sql).get(...params) as T | undefined) ?? null),
  };
}
function data(): PlacementData {
  const initial = createPlacement(bank, 'storage'),
    item = currentPlacementTask(initial)?.session.items[0];
  if (!item) throw new Error('Aufgabe fehlt');
  return {
    schemaVersion: 1,
    last: null,
    active: {
      bankKey: bank.key,
      seed: 'storage',
      startedAt: 1000,
      endedAt: null,
      actions: [{ type: 'hint' }, { type: 'answer', answer: expectedAnswer(item) }],
      answer: expectedAnswer(item),
    },
  };
}
describe('Einstufung mit echter SQLite und Replay', () => {
  it('migriert DB-Version 1 additiv, ohne bisherige Einstellungen anzufassen', async () => {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec(
        'CREATE TABLE device_preferences (id INTEGER PRIMARY KEY CHECK(id = 1), payload TEXT NOT NULL); PRAGMA user_version = 1;',
      );
      db.prepare('INSERT INTO device_preferences VALUES (1, ?)').run('original-payload');
      await initializeDeviceDatabase(adapter(db));
      expect(db.prepare('SELECT payload FROM device_preferences').get()?.['payload']).toBe(
        'original-payload',
      );
      expect(db.prepare('PRAGMA user_version').get()?.['user_version']).toBe(2);
      expect(await createDeviceRepository(adapter(db)).loadPlacement()).toBeNull();
    } finally {
      db.close();
    }
  });
  it('bewahrt Quelle, geprüfte Antwort, Hilfe und letzte Ergebnisse über einen Dateineustart', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'harmonia-placement-')),
      path = join(dir, 'device.db');
    let db = new DatabaseSync(path);
    try {
      await initializeDeviceDatabase(adapter(db));
      const snapshot = data();
      await createDeviceRepository(adapter(db)).savePlacement(snapshot);
      await createDeviceRepository(adapter(db)).savePlacement(snapshot);
      expect(db.prepare('SELECT count(*) AS n FROM placement_state').get()?.['n']).toBe(1);
      db.close();
      db = new DatabaseSync(path);
      await initializeDeviceDatabase(adapter(db));
      const loaded = await createDeviceRepository(adapter(db)).loadPlacement();
      expect(loaded).toEqual(snapshot);
      if (!loaded?.active || !snapshot.active) throw new Error('Test fehlt');
      expect(restorePlacement(bank, loaded.active)).toEqual(
        restorePlacement(bank, snapshot.active),
      );
      const state = restorePlacement(bank, loaded.active);
      expect(currentPlacementTask(state)?.session).toMatchObject({
        hintLevel: 1,
        result: { correct: true },
      });
      expect(actPlacement(bank, state, { type: 'answer', answer: 'invalid' })).toBe(state);
      const completed = {
        ...snapshot.active,
        endedAt: 2000,
        actions: [...snapshot.active.actions, { type: 'finish' as const }],
        answer: null,
      };
      await createDeviceRepository(adapter(db)).savePlacement({
        schemaVersion: 1,
        active: null,
        last: completed,
      });
      const last = (await createDeviceRepository(adapter(db)).loadPlacement())?.last;
      if (!last) throw new Error('Ergebnis fehlt');
      expect(restorePlacement(bank, last).ended).toBe('partial');
    } finally {
      db.close();
      rmSync(dir, { recursive: true });
    }
  });
  it('beschädigte gespeicherte Daten und fremde Versionen bleiben unverändert erhalten', async () => {
    const db = new DatabaseSync(':memory:');
    try {
      await initializeDeviceDatabase(adapter(db));
      const payload = JSON.stringify({ ...data(), schemaVersion: 9 });
      db.prepare('INSERT INTO placement_state VALUES (1, ?)').run(payload);
      await expect(createDeviceRepository(adapter(db)).loadPlacement()).rejects.toThrow();
      expect(db.prepare('SELECT payload FROM placement_state').get()?.['payload']).toBe(payload);
      const snapshot = data();
      if (!snapshot.active) throw new Error('Test fehlt');
      await expect(
        createDeviceRepository(adapter(db)).savePlacement({
          ...snapshot,
          active: { ...snapshot.active, endedAt: 2000 },
        }),
      ).rejects.toThrow();
      expect(db.prepare('SELECT payload FROM placement_state').get()?.['payload']).toBe(payload);
    } finally {
      db.close();
    }
  });
  it('rechnet keine fremden Katalogversionen oder widersprüchlichen Übergänge schön', () => {
    const snapshot = data().active;
    if (!snapshot) throw new Error('Test fehlt');
    expect(() => restorePlacement(bank, { ...snapshot, bankKey: 'unknown' })).toThrow();
    expect(() => restorePlacement(bank, { ...snapshot, actions: [{ type: 'next' }] })).toThrow();
    expect(() =>
      restorePlacement(bank, { ...snapshot, actions: [{ type: 'answer', answer: 'invalid' }] }),
    ).toThrow();
    expect(() =>
      restorePlacement(bank, { ...snapshot, actions: [...snapshot.actions, { type: 'finish' }] }),
    ).toThrow();
  });
  it('eine neue Versuch-ID erzeugt bei gleichem Seed eine neue laufende Quelle', () => {
    const snapshot = data().active;
    if (!snapshot) throw new Error('Test fehlt');
    const original = resumePlacement(bank, { ...snapshot, id: 'first' });
    const repeated = resumePlacement(bank, { ...snapshot, id: 'second' }, original);
    expect(currentPlacementTask(repeated.state)?.session.items[0]).not.toBe(
      currentPlacementTask(original.state)?.session.items[0],
    );
    expect(repeated.state).toEqual(original.state);
    expect(
      parsePlacementData(
        JSON.stringify({ schemaVersion: 1, active: { ...snapshot, id: 'second' }, last: null }),
      ).active?.id,
    ).toBe('second');
  });
  it('laufende Quelle behält bei Auswahl, Hilfe und Prüfung ihre Identität; Neustart reproduziert dieselben Daten', () => {
    const checked = data().active;
    if (!checked) throw new Error('Test fehlt');
    const first = { ...checked, actions: [], answer: null },
      original = resumePlacement(bank, first);
    const selected = resumePlacement(bank, { ...first, answer: checked.answer }, original);
    const hint = checked.actions[0];
    if (!hint) throw new Error('Hinweis fehlt');
    const hinted = resumePlacement(
      bank,
      { ...first, actions: [hint], answer: checked.answer },
      selected,
    );
    const answer = checked.actions[1];
    if (!answer) throw new Error('Antwort fehlt');
    const graded = resumePlacement(
      bank,
      { ...hinted.snapshot, actions: [...hinted.snapshot.actions, answer] },
      hinted,
    );
    expect(currentPlacementTask(selected.state)?.session.items[0]).toBe(
      currentPlacementTask(original.state)?.session.items[0],
    );
    expect(currentPlacementTask(hinted.state)?.session.items[0]).toBe(
      currentPlacementTask(original.state)?.session.items[0],
    );
    expect(currentPlacementTask(graded.state)?.session.items[0]).toBe(
      currentPlacementTask(original.state)?.session.items[0],
    );
    expect(resumePlacement(bank, checked).state).toEqual(graded.state);
  });
  it.each([
    { schemaVersion: 2 },
    { active: { ...data().active, startedAt: -1 } },
    { active: { ...data().active, actions: [{ type: 'rating', correct: true }] } },
    { active: { ...data().active, actions: Array(151).fill({ type: 'hint' }) } },
  ])('validiert gespeicherte Eingaben vor dem Schreiben: %j', (change) => {
    expect(() => parsePlacementData(JSON.stringify({ ...data(), ...change }))).toThrow();
  });
});

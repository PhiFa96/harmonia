import { describe, expect, it } from 'vitest';
import { catalogue, curriculumPlan, firstLesson } from './authoring.ts';
import { curriculumSkills, parseCurriculum } from './curriculum.ts';
import { publicCatalogue } from './catalogue.ts';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const fresh = () => clone(curriculumPlan);
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}
const invalid = (input: unknown, pattern: RegExp) => {
  expect(() => parseCurriculum(input, catalogue)).toThrow(pattern);
};

describe('Fähigkeitsplan mit internem Stufe-5-Satzentwurf', () => {
  it('deckt alle MVP-Bereiche ab und ordnet jede Fähigkeit genau einer Einheit und Stufe zu', () => {
    const ordered = curriculumSkills(catalogue, curriculumPlan);
    expect(ordered).toHaveLength(catalogue.skills.length);
    expect(new Set(ordered.map((entry) => entry.skill.id)).size).toBe(catalogue.skills.length);
    expect(new Set(ordered.map((entry) => entry.unit.id)).size).toBe(catalogue.units.length);
    expect(new Set(ordered.map((entry) => entry.level.number))).toEqual(new Set([1, 2, 3, 4, 5]));
    for (const area of ['notation', 'rhythm', 'intervals', 'scales', 'chords', 'aural', 'history'])
      expect(ordered.some((entry) => entry.area.id === `area.${area}`)).toBe(true);
    for (const entry of ordered) {
      expect(entry.area.id).toBe(entry.skill.areaId);
      expect(entry.level.id).toBe(entry.unit.levelId);
      for (const id of entry.skill.prerequisites) {
        const previous = required(ordered.find((value) => value.skill.id === id));
        expect(previous.order).toBeLessThan(entry.order);
        expect(previous.level.number).toBeLessThanOrEqual(entry.level.number);
      }
    }
  });

  it('bewahrt die bestehende Einführungslektion und veröffentlicht keine neuen Entwürfe', () => {
    expect(firstLesson.id).toBe('fundament.reading-and-listening.1');
    expect(firstLesson.contentVersion).toBe(1);
    expect(firstLesson.exercises).toHaveLength(10);
    const published = publicCatalogue(catalogue);
    expect(published.skills).toEqual([]);
    expect(published.units).toEqual([]);
    expect(published.lessons).toEqual([]);
  });

  it('lässt elementare Gehörbildung ohne Notationsvoraussetzungen beginnen', () => {
    for (const id of ['aural.pulse', 'aural.pitch-direction'])
      expect(required(catalogue.skills.find((skill) => skill.id === id)).prerequisites).toEqual([]);
    const firstIntervals = required(
      catalogue.skills.find((skill) => skill.id === 'aural.third-fourth-fifth'),
    );
    expect(firstIntervals.prerequisites.every((id) => id.startsWith('aural.'))).toBe(true);
  });

  it('lässt einen unabhängigen Bereich früher planen, ohne künstliche Voraussetzungen einzuführen', () => {
    const data = fresh();
    const first = required(data.units.shift());
    const history = data.units.filter((entry) => entry.unitId.startsWith('history.l1.'));
    data.units = [first, ...history, ...data.units.filter((entry) => !history.includes(entry))];
    expect(() => parseCurriculum(data, catalogue)).not.toThrow();
  });

  it('weist eine veraltete oder nicht positive Planversion zurück', () => {
    invalid({ ...fresh(), contentVersion: catalogue.contentVersion - 1 }, /Planversion/);
    invalid({ ...fresh(), contentVersion: 0 }, /contentVersion/);
  });

  it('weist Zusatzfelder und einen unbekannten Schema-Stand zurück', () => {
    invalid({ ...fresh(), extra: true }, /extra/);
    invalid({ ...fresh(), schemaVersion: 2 }, /schemaVersion/);
  });

  it('weist leeren Plan und eine Einheit ohne Fähigkeiten zurück', () => {
    invalid({ ...fresh(), units: [] }, /units/);
    const data = fresh();
    invalid(
      { ...data, units: [{ ...required(data.units[0]), skillIds: [] }, ...data.units.slice(1)] },
      /skillIds/,
    );
  });

  it('weist eine unbekannte oder doppelt geplante Einheit zurück', () => {
    const data = fresh();
    required(data.units[0]).unitId = 'missing.unit';
    invalid(data, /unbekannte Einheit/);
    const duplicate = fresh();
    duplicate.units.push(required(duplicate.units[0]));
    invalid(duplicate, /Einheit mehrfach/);
  });

  it('erkennt eine aus der Planung entfernte Einheit', () => {
    const data = fresh();
    data.units.shift();
    invalid(data, /Einheit fehlt im Plan/);
  });

  it('erkennt unbekannte und in derselben Einheit doppelte Fähigkeiten', () => {
    const data = fresh();
    required(data.units[0]).skillIds.push('missing.skill');
    invalid(data, /unbekannte Fähigkeit/);
    const duplicate = fresh();
    const unit = required(duplicate.units[0]);
    unit.skillIds.push(required(unit.skillIds[0]));
    invalid(duplicate, /Doppelte Fähigkeit/);
  });

  it('weist eine Fähigkeit zurück, die zwei Einheiten zugeordnet wird', () => {
    const data = fresh();
    required(data.units[1]).skillIds.push(required(required(data.units[0]).skillIds[0]));
    invalid(data, /Fähigkeit mehrfach/);
  });

  it('erkennt eine noch nicht zugeordnete neue Fähigkeit', () => {
    const data = clone(catalogue);
    data.skills.push({ ...required(data.skills[0]), id: 'new.unassigned.skill' });
    expect(() => parseCurriculum(fresh(), data)).toThrow(/new.unassigned.skill: Fähigkeit fehlt/);
  });

  it('erkennt eine falsche Bereichszuordnung', () => {
    const data = clone(catalogue);
    required(data.skills[0]).areaId = 'area.notation';
    expect(() => parseCurriculum(fresh(), data)).toThrow(/verschiedenen Bereichen/);
  });

  it('lässt eine Voraussetzung nicht nach ihrem Lernziel innerhalb einer Einheit stehen', () => {
    const data = fresh();
    required(data.units[0]).skillIds.reverse();
    invalid(data, /kommt erst später/);
  });

  it('lässt eine Voraussetzung nicht in einer später geplanten Einheit stehen', () => {
    const data = fresh();
    const staff = required(data.units[1]);
    data.units[1] = required(data.units[2]);
    data.units[2] = staff;
    invalid(data, /kommt erst später/);
  });

  it('weist Rücksprünge der Stufe in der Einheitenreihenfolge zurück', () => {
    const data = fresh();
    const last = required(data.units.pop());
    data.units.splice(1, 0, last);
    invalid(data, /niedrigere Stufe/);
  });

  it('weist eine Voraussetzung aus einer höheren Stufe zurück', () => {
    const data = clone(catalogue);
    required(data.skills[0]).prerequisites = ['history.compare-sources'];
    expect(() => parseCurriculum(fresh(), data)).toThrow(/höheren Stufe/);
  });

  it('erkennt eine nicht zugeordnete Voraussetzung', () => {
    const data = clone(catalogue);
    required(data.skills[0]).prerequisites = ['missing.prerequisite'];
    expect(() => parseCurriculum(fresh(), data)).toThrow(/ist nicht zugeordnet/);
  });

  it('weist nicht abgedeckte, doppelte und zu kleine Stufenumfänge zurück', () => {
    invalid({ ...fresh(), scopeLevels: [1, 2, 3, 4, 5, 6] }, /ohne Katalogeintrag/);
    invalid({ ...fresh(), scopeLevels: [1, 1, 2] }, /Doppelte Stufe/);
    invalid({ ...fresh(), scopeLevels: [1] }, /außerhalb des Planumfangs/);
    invalid({ ...fresh(), scopeLevels: [] }, /scopeLevels/);
  });

  it('erkennt eine im Katalog vorhandene Stufe ohne geplante Einheit', () => {
    const data = clone(catalogue);
    data.levels.push({ ...required(data.levels[0]), id: 'fundament.level-2', number: 2 });
    expect(() => parseCurriculum(fresh(), data)).toThrow(/Stufe ohne geplante Einheit/);
  });
});

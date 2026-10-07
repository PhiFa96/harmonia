import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { catalogue, curriculumPlan } from '../packages/content/src/authoring.ts';
import { renderCurriculum } from './curriculum-view.mjs';

test('Planungsansicht enthält jeden stabilen Skill und jede direkte Voraussetzung als Pfeil', () => {
  const output = renderCurriculum(catalogue, curriculumPlan, (key) => key);
  const ids = curriculumPlan.units.flatMap((unit) => unit.skillIds);
  for (const skill of catalogue.skills) {
    assert.ok(output.includes(`\`${skill.id}\``));
    for (const id of skill.prerequisites) {
      const source = ids.indexOf(id);
      const target = ids.indexOf(skill.id);
      assert.ok(
        output.includes(`s${source} --> s${target}`) ||
          output.includes(`s${source} -.-> s${target}`),
        `${id} → ${skill.id} fehlt im Diagramm`,
      );
    }
  }
});

test('Sonderzeichen in übersetzten Zielen brechen weder Mermaid-Blöcke noch Tabellen', () => {
  const output = renderCurriculum(catalogue, curriculumPlan, () => 'A "quoted" | <pitch>\n```');
  assert.ok(output.includes('A &quot;quoted&quot; &#124; &lt;pitch&gt; &#96;&#96;&#96;'));
  assert.equal(output.includes('<pitch>'), false);
  assert.equal(output.includes('"quoted"'), false);
});

test('Der echte CI-Prüfer akzeptiert aktuelle Diagramme und weist ein veraltetes Artefakt zurück', () => {
  const directory = mkdtempSync(join(tmpdir(), 'harmonia-curriculum-'));
  const file = join(directory, 'graph.md');
  const check = () =>
    spawnSync(process.execPath, ['tools/check-curriculum.mjs', '--check', file], {
      encoding: 'utf8',
      cwd: new URL('../', import.meta.url),
    });
  try {
    const source = readFileSync(
      new URL('../docs/plan/faehigkeitsgraph-diagramme.md', import.meta.url),
    );
    writeFileSync(file, source);
    const current = check();
    assert.equal(current.status, 0, current.stderr);
    writeFileSync(file, `${source.toString()}\nVeralteter Planungsstand.\n`);
    const stale = check();
    assert.notEqual(stale.status, 0);
    assert.match(stale.stderr, /Planungsdiagramme veraltet/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

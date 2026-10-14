// Erfolgreiche Simulation belegt Mechanik; sie muss das echte Qualitäts-/Release-Gate schließen.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const path = process.argv[2];
if (!path) throw Error('Simulationsbericht fehlt');
const result = JSON.parse(readFileSync(path, 'utf8'));
assert.equal(result.simulation, true);
assert.equal(result.total, 1470);
assert.equal(result.completed, 1470);
assert.equal(result.reviewed, 0);
assert.equal(result.releaseEligible, false);
assert.equal(result.recommendation, null);
assert.ok(result.blockedReasons.includes('simulation'));
assert.ok(result.blockedReasons.includes('catalogue-review-incomplete'));
assert.ok(result.blockedReasons.includes('answer-review-incomplete'));
assert.ok(
  result.cells.every((c) => Object.values(c.checks).every(Boolean)),
  'Werkzeuge, native Quellen, Beispiele und alle Dialoge müssen technisch bestehen',
);
console.log(
  '1470 simulierte Dialoge technisch bestanden. Echte Qualität ungeprüft; Release und Kontingentempfehlung bleiben geschlossen.',
);

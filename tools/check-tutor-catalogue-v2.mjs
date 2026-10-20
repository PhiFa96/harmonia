import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildBenchmarkCatalogueV2 } from './tutor-benchmark/catalogue-v2.ts';
import { canonical } from './tutor-benchmark/hash.ts';
const path = fileURLToPath(new URL('./tutor-benchmark/catalogue-v2.json', import.meta.url));
const catalogue = buildBenchmarkCatalogueV2();
if (process.argv.includes('--write'))
  writeFileSync(path, JSON.stringify(catalogue, null, 2) + '\n');
else if (canonical(JSON.parse(readFileSync(path, 'utf8'))) !== canonical(catalogue))
  throw Error('P3.18 catalogue is stale');
const extra = catalogue.cases.filter((row) => row.id.startsWith('p3_level'));
if (
  extra.length !== 18 ||
  new Set(extra.map((row) => row.id)).size !== 18 ||
  catalogue.cases.filter((row) => row.learnerFixture).length !== 2
)
  throw Error('Stage 3/4 or learner probes missing');
console.log(
  `${catalogue.cases.length} P3.18 catalogue cases checked, including ${extra.length} stage-3/4 task cases.`,
);

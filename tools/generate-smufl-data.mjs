// Erzeugt packages/notation/src/smufl-data.ts aus den Bravura-Metadaten und der SMuFL-Glyphenliste.
//
// Aufruf:
//   curl -o /tmp/glyphnames.json https://raw.githubusercontent.com/w3c/smufl/gh-pages/metadata/glyphnames.json
//   node tools/generate-smufl-data.mjs /tmp/glyphnames.json && pnpm format
//
// Quellen:
// - Bravura-Metadaten aus dem Paket @vexflow-fonts/bravura (Kopie von steinbergmedia/bravura, SIL OFL 1.1)
// - glyphnames.json aus w3c/smufl (Codepoints der Glyphen)

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const glyphnamesPath = process.argv[2];
if (!glyphnamesPath) {
  console.error('Pfad zu glyphnames.json fehlt (siehe Kommentar oben).');
  process.exit(1);
}

const metadata = JSON.parse(
  readFileSync(
    join(root, 'packages/notation/node_modules/@vexflow-fonts/bravura/metadata.json'),
    'utf8',
  ),
);
const glyphnames = JSON.parse(readFileSync(glyphnamesPath, 'utf8'));

/** Glyphen, die das Layout braucht. Neue Glyphen hier eintragen und neu erzeugen. */
const GLYPHS = [
  'gClef',
  'fClef',
  'cClef',
  'noteheadDoubleWhole',
  'noteheadWhole',
  'noteheadHalf',
  'noteheadBlack',
  'accidentalDoubleFlat',
  'accidentalFlat',
  'accidentalNatural',
  'accidentalSharp',
  'accidentalDoubleSharp',
  'restDoubleWhole',
  'restWhole',
  'restHalf',
  'restQuarter',
  'rest8th',
  'rest16th',
  'rest32nd',
  'rest64th',
  'flag8thUp',
  'flag8thDown',
  'flag16thUp',
  'flag16thDown',
  'flag32ndUp',
  'flag32ndDown',
  'flag64thUp',
  'flag64thDown',
  'augmentationDot',
  'timeSig0',
  'timeSig1',
  'timeSig2',
  'timeSig3',
  'timeSig4',
  'timeSig5',
  'timeSig6',
  'timeSig7',
  'timeSig8',
  'timeSig9',
  'timeSigPlus',
];

const DEFAULTS = [
  'staffLineThickness',
  'stemThickness',
  'legerLineExtension',
  'legerLineThickness',
  'beamThickness',
  'beamSpacing',
  'thinBarlineThickness',
  'thickBarlineThickness',
  'barlineSeparation',
  'tieEndpointThickness',
  'tieMidpointThickness',
];

const glyphs = Object.fromEntries(
  GLYPHS.map((name) => {
    const codepoint = glyphnames[name]?.codepoint;
    const box = metadata.glyphBBoxes[name];
    if (!codepoint || !box) {
      throw new Error(`Glyphe ${name} fehlt in den Quellen`);
    }
    const anchors = metadata.glyphsWithAnchors[name];
    return [
      name,
      {
        codepoint: Number.parseInt(codepoint.replace('U+', ''), 16),
        bBoxNE: box.bBoxNE,
        bBoxSW: box.bBoxSW,
        ...(anchors ? { anchors } : {}),
      },
    ];
  }),
);

const defaults = Object.fromEntries(DEFAULTS.map((key) => [key, metadata.engravingDefaults[key]]));

const output = `// Generiert von tools/generate-smufl-data.mjs – nicht von Hand ändern.
// Quellen: ${metadata.fontName} ${String(metadata.fontVersion)} (© Steinberg Media Technologies GmbH, SIL Open Font License 1.1)
// und die SMuFL-Glyphenliste (w3c/smufl, glyphnames.json).
// Maße in Notenlinienabständen, y nach oben (SMuFL-Konvention).

export const FONT = { name: '${metadata.fontName}', version: '${String(metadata.fontVersion)}' } as const;

export const ENGRAVING_DEFAULTS = ${JSON.stringify(defaults, null, 2)} as const;

export const GLYPHS = ${JSON.stringify(glyphs, null, 2)} as const;
`;

writeFileSync(join(root, 'packages/notation/src/smufl-data.ts'), output);
console.log(`smufl-data.ts mit ${String(GLYPHS.length)} Glyphen geschrieben.`);

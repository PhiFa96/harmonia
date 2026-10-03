// Generiert von tools/generate-smufl-data.mjs – nicht von Hand ändern.
// Quellen: Bravura 1.392 (© Steinberg Media Technologies GmbH, SIL Open Font License 1.1)
// und die SMuFL-Glyphenliste (w3c/smufl, glyphnames.json).
// Maße in Notenlinienabständen, y nach oben (SMuFL-Konvention).

export const FONT = { name: 'Bravura', version: '1.392' } as const;

export const ENGRAVING_DEFAULTS = {
  staffLineThickness: 0.13,
  stemThickness: 0.12,
  legerLineExtension: 0.4,
  legerLineThickness: 0.16,
  beamThickness: 0.5,
  beamSpacing: 0.25,
  thinBarlineThickness: 0.16,
  thickBarlineThickness: 0.5,
  barlineSeparation: 0.4,
  tieEndpointThickness: 0.1,
  tieMidpointThickness: 0.22,
} as const;

export const GLYPHS = {
  gClef: {
    codepoint: 57424,
    bBoxNE: [2.684, 4.392],
    bBoxSW: [0, -2.632],
  },
  fClef: {
    codepoint: 57442,
    bBoxNE: [2.736, 1.048],
    bBoxSW: [-0.02, -2.54],
  },
  cClef: {
    codepoint: 57436,
    bBoxNE: [2.796, 2.024],
    bBoxSW: [0, -2.024],
  },
  noteheadDoubleWhole: {
    codepoint: 57504,
    bBoxNE: [2.396, 0.62],
    bBoxSW: [0, -0.62],
    anchors: {
      noteheadOrigin: [0.36, 0],
    },
  },
  noteheadWhole: {
    codepoint: 57506,
    bBoxNE: [1.688, 0.5],
    bBoxSW: [0, -0.5],
    anchors: {
      cutOutNW: [0.172, 0.332],
      cutOutSE: [1.532, -0.364],
    },
  },
  noteheadHalf: {
    codepoint: 57507,
    bBoxNE: [1.18, 0.5],
    bBoxSW: [0, -0.5],
    anchors: {
      cutOutNW: [0.204, 0.296],
      cutOutSE: [0.98, -0.3],
      splitStemDownNE: [0.956, -0.3],
      splitStemDownNW: [0.128, -0.428],
      splitStemUpSE: [1.108, 0.372],
      splitStemUpSW: [0.328, 0.38],
      stemDownNW: [0, -0.168],
      stemUpSE: [1.18, 0.168],
    },
  },
  noteheadBlack: {
    codepoint: 57508,
    bBoxNE: [1.18, 0.5],
    bBoxSW: [0, -0.5],
    anchors: {
      cutOutNW: [0.208, 0.3],
      cutOutSE: [0.94, -0.296],
      splitStemDownNE: [0.968, -0.248],
      splitStemDownNW: [0.12, -0.416],
      splitStemUpSE: [1.092, 0.392],
      splitStemUpSW: [0.312, 0.356],
      stemDownNW: [0, -0.168],
      stemUpSE: [1.18, 0.168],
    },
  },
  accidentalDoubleFlat: {
    codepoint: 57956,
    bBoxNE: [1.644, 1.748],
    bBoxSW: [0, -0.7],
    anchors: {
      cutOutNE: [0.988, 0.644],
      cutOutSE: [1.336, -0.396],
    },
  },
  accidentalFlat: {
    codepoint: 57952,
    bBoxNE: [0.904, 1.756],
    bBoxSW: [0, -0.7],
    anchors: {
      cutOutNE: [0.252, 0.656],
      cutOutSE: [0.504, -0.476],
    },
  },
  accidentalNatural: {
    codepoint: 57953,
    bBoxNE: [0.672, 1.364],
    bBoxSW: [0, -1.34],
    anchors: {
      cutOutNE: [0.192, 0.776],
      cutOutSW: [0.476, -0.828],
    },
  },
  accidentalSharp: {
    codepoint: 57954,
    bBoxNE: [0.996, 1.4],
    bBoxSW: [0, -1.392],
    anchors: {
      cutOutNE: [0.84, 0.896],
      cutOutNW: [0.144, 0.568],
      cutOutSE: [0.84, -0.596],
      cutOutSW: [0.144, -0.896],
    },
  },
  accidentalDoubleSharp: {
    codepoint: 57955,
    bBoxNE: [0.988, 0.508],
    bBoxSW: [0, -0.5],
  },
  restDoubleWhole: {
    codepoint: 58594,
    bBoxNE: [0.5, 1],
    bBoxSW: [0, 0],
  },
  restWhole: {
    codepoint: 58595,
    bBoxNE: [1.128, 0.036],
    bBoxSW: [0, -0.54],
  },
  restHalf: {
    codepoint: 58596,
    bBoxNE: [1.128, 0.568],
    bBoxSW: [0, -0.008],
  },
  restQuarter: {
    codepoint: 58597,
    bBoxNE: [1.08, 1.492],
    bBoxSW: [0.004, -1.5],
  },
  rest8th: {
    codepoint: 58598,
    bBoxNE: [0.988, 0.696],
    bBoxSW: [0, -1.004],
  },
  rest16th: {
    codepoint: 58599,
    bBoxNE: [1.28, 0.716],
    bBoxSW: [0, -2],
  },
  rest32nd: {
    codepoint: 58600,
    bBoxNE: [1.452, 1.704],
    bBoxSW: [0, -2],
  },
  rest64th: {
    codepoint: 58601,
    bBoxNE: [1.692, 1.72],
    bBoxSW: [0, -3.012],
  },
  flag8thUp: {
    codepoint: 57920,
    bBoxNE: [1.056, 0.03521239682756091],
    bBoxSW: [0, -3.240768470618394],
    anchors: {
      graceNoteSlashNE: [1.284, -0.796],
      graceNoteSlashSW: [-0.644, -2.456],
      stemUpNW: [0, -0.04],
    },
  },
  flag8thDown: {
    codepoint: 57921,
    bBoxNE: [1.224, 3.232896633157715],
    bBoxSW: [0, -0.0575672],
    anchors: {
      graceNoteSlashNW: [-0.596, 2.168],
      graceNoteSlashSE: [1.328, 0.628],
      stemDownSW: [0, 0.132],
    },
  },
  flag16thUp: {
    codepoint: 57922,
    bBoxNE: [1.116, 0.008],
    bBoxSW: [0, -3.252],
    anchors: {
      stemUpNW: [0, -0.088],
    },
  },
  flag16thDown: {
    codepoint: 57923,
    bBoxNE: [1.1635806326044895, 3.2480256],
    bBoxSW: [-0.000019418183745617774, -0.03601094374150052],
    anchors: {
      stemDownSW: [0, 0.128],
    },
  },
  flag32ndUp: {
    codepoint: 57924,
    bBoxNE: [1.044, 0.596],
    bBoxSW: [0, -3.248],
    anchors: {
      stemUpNW: [0, 0.376],
    },
  },
  flag32ndDown: {
    codepoint: 57925,
    bBoxNE: [1.092, 3.248],
    bBoxSW: [0, -0.687477099907407],
    anchors: {
      stemDownSW: [0, -0.448],
    },
  },
  flag64thUp: {
    codepoint: 57926,
    bBoxNE: [1.044, 1.387108],
    bBoxSW: [0, -3.248],
    anchors: {
      stemUpNW: [0, 1.172],
    },
  },
  flag64thDown: {
    codepoint: 57927,
    bBoxNE: [1.092, 3.248],
    bBoxSW: [0, -1.5040263329569774],
    anchors: {
      stemDownSW: [0, -1.244],
    },
  },
  augmentationDot: {
    codepoint: 57831,
    bBoxNE: [0.4, 0.2],
    bBoxSW: [0, -0.2],
  },
  timeSig0: {
    codepoint: 57472,
    bBoxNE: [1.8, 1.004],
    bBoxSW: [0.08, -1],
  },
  timeSig1: {
    codepoint: 57473,
    bBoxNE: [1.256, 1.004],
    bBoxSW: [0.08, -1],
  },
  timeSig2: {
    codepoint: 57474,
    bBoxNE: [1.704, 1.016],
    bBoxSW: [0.08, -1.028],
  },
  timeSig3: {
    codepoint: 57475,
    bBoxNE: [1.604, 0.996],
    bBoxSW: [0.08, -1.004],
  },
  timeSig4: {
    codepoint: 57476,
    bBoxNE: [1.8, 1.004],
    bBoxSW: [0.08, -1],
  },
  timeSig5: {
    codepoint: 57477,
    bBoxNE: [1.532, 0.984],
    bBoxSW: [0.08, -1.004],
  },
  timeSig6: {
    codepoint: 57478,
    bBoxNE: [1.656, 1.004],
    bBoxSW: [0.08, -0.996],
  },
  timeSig7: {
    codepoint: 57479,
    bBoxNE: [1.684, 0.996],
    bBoxSW: [0.08, -1],
  },
  timeSig8: {
    codepoint: 57480,
    bBoxNE: [1.664, 1.036],
    bBoxSW: [0.08, -1.036],
  },
  timeSig9: {
    codepoint: 57481,
    bBoxNE: [1.656, 1.004],
    bBoxSW: [0.08, -0.996],
  },
  timeSigPlus: {
    codepoint: 57484,
    bBoxNE: [1.996, 1],
    bBoxSW: [-0.004, -1],
  },
} as const;

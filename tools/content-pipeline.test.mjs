import assert from 'node:assert/strict';
import { test } from 'node:test';
import { catalogue } from '../packages/content/src/authoring.ts';
import {
  parseCatalogue,
  publicCatalogue,
  publicMessages,
  resolveLesson,
} from '../packages/content/src/index.ts';
import { contentMessages } from '../packages/i18n/src/authoring-content-messages.ts';
import {
  keyboardMidi,
  layoutScore,
  parseScore,
  scoreTimeline,
  validateScore,
} from '../packages/notation/src/index.ts';
import { validateContentExample } from './validate-content-example.mjs';
import historyDraft from '../packages/i18n/src/history-journey-draft.json' with { type: 'json' };
import { historyStops } from '../packages/content/src/history-journey-draft.ts';
import { historyJourneyMessages } from '../packages/i18n/src/history-journey-draft.ts';
import { createHistoryJourneyText } from '../packages/i18n/src/history-journey-text.ts';
import { createRng, generateChoir } from '../packages/exercises/src/index.ts';

function checks() {
  return {
    messages: structuredClone(
      Object.fromEntries(
        Object.entries(contentMessages).map(([locale, content]) => [locale, { content }]),
      ),
    ),
    validateScore: validateContentExample,
  };
}
const fresh = () => structuredClone(catalogue);

test('P4.10: six draft introductions show four simultaneous voices in a single chord', () => {
  const cards = catalogue.knowledgeCards.filter((card) => card.id.includes('.writing.'));
  assert.equal(cards.length, 6);
  for (const card of cards) {
    assert.equal(card.contentVersion, 23);
    assert.equal(card.status, 'entwurf');
    assert.equal(card.examples.length, 1);
    const example = card.examples[0];
    validateContentExample(example.score);
    const score = parseScore(example.score);
    assert.deepEqual(
      score.staves.map((staff) => staff.clef),
      ['treble', 'bass'],
    );
    for (const staff of score.staves) {
      assert.equal(staff.measures.length, 1);
      assert.equal(staff.measures[0].voices.length, 2);
    }
    const tones = scoreTimeline(score, { bpm: 90 }).tones;
    assert.equal(tones.length, 4);
    assert.deepEqual(
      tones.map((tone) => keyboardMidi(tone.pitch)).sort((a, b) => a - b),
      card.id.includes('.l4.') ? [48, 55, 60, 64] : [43, 55, 59, 65],
    );
    assert.ok(
      tones.every(
        (tone) => tone.onsetSeconds === 0 && Math.abs(tone.durationSeconds - 8 / 3) < 1e-8,
      ),
    );
    assert.equal(
      layoutScore(score).items.filter((item) => item.kind === 'glyph' && item.role === 'notehead')
        .length,
      4,
    );
  }
});

test('P4.11: both complete solo examples match each voice in pitch, clef and timing', () => {
  const expected = {
    soprano: [
      [64, 67, 65, 65, 62, 62, 64, 64],
      [64, 64, 65, 64, 62, 65, 64, 64],
    ],
    alto: [
      [60, 60, 60, 60, 59, 59, 60, 60],
      [60, 60, 60, 60, 59, 59, 60, 60],
    ],
    tenor: [
      [55, 55, 57, 57, 55, 55, 55, 55],
      [55, 55, 57, 55, 55, 55, 55, 55],
    ],
    bass: [
      [48, 52, 53, 53, 55, 55, 48, 48],
      [48, 48, 53, 48, 43, 43, 48, 48],
    ],
  };
  for (const [voice, pieces] of Object.entries(expected)) {
    const card = catalogue.knowledgeCards.find(
      (entry) => entry.id === `aural.l4.choir.${voice}.card`,
    );
    assert.equal(card.contentVersion, 24);
    assert.equal(card.examples.length, 2);
    assert.equal(card.status, 'entwurf');
    for (const [index, pitches] of pieces.entries()) {
      const example = card.examples[index];
      assert.match(
        example.captionKey,
        new RegExp(`${voice}${index === 0 ? 'Home' : 'Arch'}Caption$`),
      );
      validateContentExample(example.score);
      const score = parseScore(example.score);
      assert.equal(score.staves.length, 1);
      assert.equal(score.staves[0].clef, voice === 'tenor' || voice === 'bass' ? 'bass' : 'treble');
      assert.equal(score.staves[0].measures.length, 4);
      const timeline = scoreTimeline(score, { bpm: 90 });
      assert.deepEqual(
        timeline.tones.map((tone) => keyboardMidi(tone.pitch)),
        pitches,
      );
      timeline.tones.forEach((tone, position) => {
        assert.ok(Math.abs(tone.onsetSeconds - (position * 4) / 3) < 1e-8);
        assert.ok(Math.abs(tone.durationSeconds - 4 / 3) < 1e-8);
      });
      assert.ok(Math.abs(timeline.durationSeconds - 32 / 3) < 1e-8);
      const exercise = generateChoir({ voice, piece: index === 0 ? 'home' : 'arch' }, createRng(1));
      assert.deepEqual(exercise.parts[voice].map(keyboardMidi), pitches);
      assert.equal(
        layoutScore(score).items.filter((item) => item.kind === 'glyph' && item.role === 'notehead')
          .length,
        8,
      );
    }
  }
});

test('Polyphonic examples require valid rhythm and renderer support; keyboard targets stay bounded', () => {
  const example = catalogue.knowledgeCards.find((card) => card.id === 'satz.l4.writing.bass.card')
    .examples[0];
  assert.throws(
    () => validateContentExample(example.score, { first: 21, last: 108 }),
    /Großes Lernsystem/,
  );
  assert.throws(
    () => validateContentExample(example.score.replace('E4/1', 'E4/1 E4/2')),
    /ungültig/,
  );
  assert.throws(
    () => validateContentExample(example.score.replace('E4/1 & C4/1', 'E4/1 & C4/1 & G4/1')),
    /voice|Stimm/i,
  );
  validateContentExample('treble | 4/4 | C4/1\nbass | 4/4 | r/1', { first: 48, last: 72 });
});

test('Pulsbeispiele entsprechen unabhängigen Zähl- und Tempotabellen; Klangdauer folgt dem BPM', () => {
  const table = {
    pulse: [
      [4, 72],
      [4, 96],
    ],
    rhythm: [[4, 72]],
    'count-in': [[3, 72]],
    tempo: [
      [4, 60],
      [4, 120],
    ],
    bpm: [[3, 90]],
    compare: [
      [3, 72],
      [3, 108],
    ],
    groups: [
      [2, 84],
      [3, 84],
      [4, 84],
    ],
    strategy: [[4, 96]],
  };
  for (const [name, expected] of Object.entries(table)) {
    const card = catalogue.knowledgeCards.find(
      (value) => value.id === `rhythm.l1.pulse.card-${name}`,
    );
    assert.equal(card.examples.length, expected.length);
    for (const [index, [count, bpm]] of expected.entries()) {
      const example = card.examples[index];
      assert.deepEqual(example.pulse, { bpm });
      validateContentExample(example.score, example.keyboard, example.pulse);
      const score = parseScore(example.score),
        timeline = scoreTimeline(score, { bpm });
      assert.equal(timeline.tones.length, count);
      assert.ok(Math.abs(timeline.durationSeconds - (count * 60) / bpm) < 1e-8);
      timeline.tones.forEach((tone, position) => {
        assert.ok(Math.abs(tone.onsetSeconds - (position * 60) / bpm) < 1e-8);
        assert.ok(Math.abs(tone.durationSeconds - 60 / bpm) < 1e-8);
      });
      assert.equal(score.staves[0].timeSignature.numerator, count);
      assert.equal(score.staves[0].timeSignature.denominator, 4);
    }
  }
});
test('Inhaltspipeline weist fachlich unpassende Pulsdarstellungen auch bei Entwürfen zurück', () => {
  for (const source of [
    'treble | 3/4 | G4/2 G4/4',
    'treble | 3/4 | r/4 G4/4 G4/4',
    'treble | 6/8 | G4/4. G4/4.',
    'treble | 4/4 | G4/4 G4/4 G4/4',
    'treble | 3/4 | G4/4~ G4/4 G4/4',
  ]) {
    const data = fresh(),
      card = data.knowledgeCards.find((value) => value.id === 'rhythm.l1.pulse.card-pulse');
    card.examples[0].score = source;
    assert.throws(() => parseCatalogue(data, checks()), /ungültiges Notenbeispiel/);
  }
});

test('Registerbeispiele stimmen mit unabhängigen Ton-, MIDI- und Hilfslinientabellen überein', () => {
  const table = {
    repetition: [
      [['E4', 'E5'], 0],
      [['G4', 'G5'], 0],
    ],
    boundary: [[['B4', 'C5'], 0]],
    names: [
      [['C4', 'C5'], 1],
      [['F4', 'F5'], 0],
    ],
    extend: [[['D4', 'G5'], 0]],
    lower: [
      [['C4', 'A3'], 3],
      [['D4', 'C4', 'B3', 'A3'], 4],
    ],
    upper: [
      [['A5', 'C6'], 3],
      [['F5', 'G5', 'A5', 'B5', 'C6'], 4],
    ],
    match: [
      [['C4', 'C5'], 1],
      [['A3', 'C6'], 4],
    ],
    strategy: [[['G4', 'G5', 'C5'], 0]],
  };
  const midi = {
    A3: 57,
    B3: 59,
    C4: 60,
    D4: 62,
    E4: 64,
    F4: 65,
    G4: 67,
    B4: 71,
    C5: 72,
    E5: 76,
    F5: 77,
    G5: 79,
    A5: 81,
    B5: 83,
    C6: 84,
  };
  for (const [name, expected] of Object.entries(table)) {
    const card = catalogue.knowledgeCards.find(
      (value) => value.id === `notation.l1.register.card-${name}`,
    );
    assert.equal(card.examples.length, expected.length);
    for (const [index, [pitches, ledgerLines]] of expected.entries()) {
      const example = card.examples[index],
        score = parseScore(example.score);
      validateContentExample(example.score, example.keyboard);
      const tones = scoreTimeline(score, { bpm: 90 }).tones;
      assert.deepEqual(
        tones.map(({ pitch }) => `${pitch.letter}${pitch.octave}`),
        pitches,
      );
      assert.deepEqual(
        tones.map(({ pitch }) => keyboardMidi(pitch)),
        pitches.map((value) => midi[value]),
      );
      assert.equal(
        layoutScore(score).items.filter((item) => item.role === 'ledgerLine').length,
        ledgerLines,
      );
      assert.equal(example.keyboard.showOctaves, true);
    }
  }
});
const released = () => {
  const data = fresh();
  for (const value of Object.values(data))
    if (Array.isArray(value)) for (const item of value) item.status = 'freigegeben';
  return data;
};
const rejects = (data, pattern) => assert.throws(() => parseCatalogue(data, checks()), pattern);

test('Die bestehende Lektion behält ID, Inhaltsversion und zehn generierte Aufgaben', () => {
  const data = parseCatalogue(catalogue, checks());
  const lesson = resolveLesson(data, data.lessons[0].id);
  assert.equal(lesson.id, 'fundament.reading-and-listening.1');
  assert.equal(lesson.contentVersion, 1);
  assert.equal(lesson.exercises.length, 10);
  assert.equal(lesson.introduction.length, 3);
});

test('Die neuen Notationsbeispiele stimmen mit unabhängigen Linien-/Zwischenraumtabellen überein', () => {
  const expected = {
    staff: ['G4'],
    anchor: ['G4'],
    lines: ['E4', 'G4', 'B4', 'D5', 'F5'],
    spaces: ['F4', 'A4', 'C5', 'E5'],
    neighbors: ['F4', 'G4', 'A4', 'B4'],
    names: ['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'],
    reading: ['G4', 'A4', 'B4', 'C5', 'D5', 'C5', 'B4', 'A4'],
  };
  for (const [name, pitches] of Object.entries(expected)) {
    const card = catalogue.knowledgeCards.find(
      (value) => value.id === `notation.l1.staff.card-${name}`,
    );
    const score = parseScore(card.examples[0].score);
    assert.deepEqual(validateScore(score), []);
    const actual = score.staves[0].measures
      .flatMap((measure) => measure.voices[0].events)
      .map((event) => {
        assert.equal(event.kind, 'note');
        assert.equal(event.pitch.alter, 0);
        return `${event.pitch.letter}${event.pitch.octave}`;
      });
    assert.deepEqual(actual, pitches);
  }
});
test('Aktuelle Entwürfe werden weder als Daten noch als Texte veröffentlicht', () => {
  const data = publicCatalogue(catalogue);
  assert.equal(data.lessons.length, 0);
  assert.equal(data.knowledgeCards.length, 0);
  assert.deepEqual(publicMessages(data, checks().messages.de), {});
  assert.equal(resolveLesson(data, catalogue.lessons[0].id), undefined);
});

test('Alle dreizehn Klaviaturbeispiele stimmen mit unabhängigen Schreibweisen und MIDI-Tabellen überein', () => {
  const expected = {
    groups: [['C4', 'F4']],
    white: [['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']],
    find: [['D4', 'A4']],
    steps: [['C4', 'C#4', 'D4']],
    neighbors: [
      ['E4', 'F4'],
      ['B4', 'C5'],
    ],
    signs: [
      ['G4', 'G#4'],
      ['A4', 'Ab4'],
      ['G#4', 'G4'],
    ],
    names: [['B4', 'Bb4']],
    same: [
      ['C#4', 'Db4'],
      ['E#4', 'F4'],
      ['Fb4', 'E4'],
    ],
  };
  const midi = {
    C4: 60,
    'C#4': 61,
    Db4: 61,
    D4: 62,
    E4: 64,
    'E#4': 65,
    Fb4: 64,
    F4: 65,
    G4: 67,
    'G#4': 68,
    A4: 69,
    Ab4: 68,
    B4: 71,
    Bb4: 70,
    C5: 72,
  };
  for (const [name, examples] of Object.entries(expected)) {
    const card = catalogue.knowledgeCards.find(
      (value) => value.id === `notation.l1.keyboard.card-${name}`,
    );
    assert.equal(card.examples.length, examples.length);
    for (const [index, pitches] of examples.entries()) {
      const example = card.examples[index];
      validateContentExample(example.score, example.keyboard);
      const actual = scoreTimeline(parseScore(example.score), { bpm: 90 }).tones.map(
        ({ pitch }) => {
          const spelling = `${pitch.letter}${pitch.alter === 1 ? '#' : pitch.alter === -1 ? 'b' : ''}${pitch.octave}`;
          return [spelling, keyboardMidi(pitch)];
        },
      );
      assert.deepEqual(
        actual,
        pitches.map((pitch) => [pitch, midi[pitch]]),
      );
      assert.deepEqual(example.keyboard, { first: 60, last: 72 });
    }
  }
});

test('Die Pipeline lehnt ausgeschnittene klingende Tasten in Karten und Artikeln ab', () => {
  for (const location of ['card', 'article']) {
    for (const keyboard of [
      { first: 62, last: 72 },
      { first: 60, last: 64 },
    ]) {
      const data = fresh();
      const example =
        location === 'card'
          ? data.knowledgeCards.find((card) => card.id === 'notation.l1.keyboard.card-groups')
              .examples[0]
          : data.knowledgeArticles.find((article) => article.id === 'notation.l1.keyboard.article')
              .sections[0].examples[0];
      example.keyboard = keyboard;
      rejects(data, /ungültiges Notenbeispiel/);
    }
  }
  assert.doesNotThrow(() =>
    validateContentExample('treble | 4/4 | B#3/1', { first: 60, last: 60 }),
  );
  assert.throws(
    () => validateContentExample('treble | 4/4 | Cb4/1', { first: 60, last: 72 }),
    /außerhalb/,
  );
});
test('Freigegebene Kette wird vollständig aufgelöst; Entwurfsartikel und dessen Text bleiben intern', () => {
  const data = released();
  data.knowledgeArticles.push({
    id: 'draft.article',
    contentVersion: 1,
    status: 'entwurf',
    titleKey: 'content.secret.title',
    skillIds: [],
    sections: [
      { headingKey: 'content.secret.title', bodyKey: 'content.secret.body', examples: [] },
    ],
  });
  const source = checks().messages.de;
  source.content.secret = { title: 'Private draft', body: 'Never distribute this draft' };
  const output = publicCatalogue(parseCatalogue(data));
  assert.equal(resolveLesson(output, catalogue.lessons[0].id).exercises.length, 10);
  assert.equal(output.knowledgeArticles.length, catalogue.knowledgeArticles.length);
  assert.equal(
    output.knowledgeArticles.some((article) => article.id === 'draft.article'),
    false,
  );
  const messages = publicMessages(output, source);
  assert.equal(messages.content.firstLesson.notesBody, source.content.firstLesson.notesBody);
  assert.equal(JSON.stringify(messages).includes('Never distribute'), false);
});
test('Gleiche ID in verschiedenen Inhaltsarten wird abgelehnt', () => {
  const data = fresh();
  data.units[0].id = data.areas[0].id;
  rejects(data, /ID mehrfach/);
});
test('Unbekannter Status und zusätzliche Felder werden abgelehnt', () => {
  rejects({ ...fresh(), extra: true }, /extra/);
  const data = fresh();
  data.lessons[0].status = 'live';
  rejects(data, /status/);
});
test('Nicht positive und über den Katalog hinausgehende Versionen werden abgelehnt', () => {
  const data = fresh();
  data.lessons[0].contentVersion = data.contentVersion + 1;
  rejects(data, /Version größer/);
  rejects({ ...fresh(), contentVersion: 0 }, /contentVersion/);
});
test('Doppelte Stufennummer innerhalb eines Bereichs wird abgelehnt', () => {
  const data = fresh();
  data.levels.push({ ...data.levels[0], id: 'another.level' });
  rejects(data, /Stufennummer/);
});
for (const [name, alter] of [
  [
    'Bereich einer Stufe',
    (data) => {
      data.levels[0].areaId = 'missing.area';
    },
  ],
  [
    'Stufe einer Einheit',
    (data) => {
      data.units[0].levelId = 'missing.level';
    },
  ],
  [
    'Bereich einer Fähigkeit',
    (data) => {
      data.skills[0].areaId = 'missing.area';
    },
  ],
  [
    'Voraussetzung',
    (data) => {
      data.skills[0].prerequisites = ['missing.skill'];
    },
  ],
  [
    'Einheit einer Lektion',
    (data) => {
      data.lessons[0].unitId = 'missing.unit';
    },
  ],
  [
    'Fähigkeit eines Übungssatzes',
    (data) => {
      data.exerciseSets[0].skillIds = ['missing.skill'];
    },
  ],
  [
    'Einführungskarte',
    (data) => {
      data.lessons[0].introductionCardIds = ['missing.card'];
    },
  ],
  [
    'Übungssatz',
    (data) => {
      data.lessons[0].exerciseSetIds = ['missing.set'];
    },
  ],
])
  test(`Fehlende Referenz wird erkannt: ${name}`, () => {
    const data = fresh();
    alter(data);
    rejects(data, /unbekannte Referenz/);
  });

test('Doppelte Referenzen und nicht zugeordnete trainierte Fähigkeiten werden abgelehnt', () => {
  const data = fresh();
  data.lessons[0].skillIds = ['notation.note-name', 'notation.note-name'];
  rejects(data, /Doppelte Referenz/);
  data.lessons[0].skillIds = ['notation.note-name'];
  rejects(data, /Fähigkeit .* des Übungssatzes fehlt/);
});
test('Selbstvoraussetzung und mehrgliedriger Zyklus werden erkannt', () => {
  const data = fresh();
  data.skills[0].prerequisites = [data.skills[0].id];
  rejects(data, /Zyklus/);
  data.skills[0].prerequisites = [data.skills[2].id];
  rejects(data, /Zyklus/);
});
test('Gemeinsame Voraussetzung in einem azyklischen Graphen ist erlaubt', () => {
  const data = fresh();
  data.skills[2].prerequisites = [data.skills[0].id, data.skills[1].id];
  assert.doesNotThrow(() => parseCatalogue(data, checks()));
});
for (const [name, alter] of [
  [
    'Bereich',
    (data) => {
      data.areas[0].status = 'entwurf';
    },
  ],
  [
    'Stufe',
    (data) => {
      data.levels[0].status = 'entwurf';
    },
  ],
  [
    'Einheit',
    (data) => {
      data.units[0].status = 'entwurf';
    },
  ],
  [
    'Fähigkeit',
    (data) => {
      data.skills[0].status = 'in_pruefung';
    },
  ],
  [
    'Karte',
    (data) => {
      data.knowledgeCards[0].status = 'entwurf';
    },
  ],
  [
    'Übungssatz',
    (data) => {
      data.exerciseSets[0].status = 'entwurf';
    },
  ],
])
  test(`Freigabe darf keine ungeprüfte Abhängigkeit enthalten: ${name}`, () => {
    const data = released();
    alter(data);
    rejects(data, /freigegebener Inhalt verweist/);
    assert.throws(() => publicCatalogue(data), /freigegebener Inhalt verweist/);
  });

for (const locale of ['de', 'en-US', 'en-GB'])
  test(`Fehlende oder leere Inhaltsübersetzung wird erkannt: ${locale}`, () => {
    const options = checks();
    delete options.messages[locale].content.firstLesson.notesBody;
    assert.throws(() => parseCatalogue(catalogue, options), /Text fehlt/);
    options.messages[locale].content.firstLesson.notesBody = '   ';
    assert.throws(() => parseCatalogue(catalogue, options), /Text fehlt/);
  });
test('Unterschiedliche Platzhalter und ungültige Inhalts-Textreferenzen werden erkannt', () => {
  const options = checks();
  options.messages['en-US'].content.firstLesson.notesTitle = 'Note {{other}}';
  assert.throws(() => parseCatalogue(catalogue, options), /Platzhalter/);
  const data = fresh();
  data.lessons[0].titleKey = 'arbitrary.missing';
  rejects(data, /titleKey/);
});
test('Syntaxfehler und überfüllte Takte in Karten sowie Artikeln werden durch Engine/Notation abgelehnt', () => {
  for (const score of ['treble | 4/4 | Q4/1', 'treble | 4/4 | C4/1 E4/1']) {
    const data = fresh();
    data.knowledgeCards[0].examples[0].score = score;
    rejects(data, /ungültiges Notenbeispiel/);
  }
  const data = fresh();
  data.knowledgeArticles.push({
    id: 'article.invalid',
    contentVersion: 1,
    status: 'entwurf',
    titleKey: data.lessons[0].titleKey,
    skillIds: [],
    sections: [
      {
        headingKey: data.lessons[0].titleKey,
        bodyKey: data.knowledgeCards[0].bodyKey,
        examples: [{ score: 'broken', captionKey: data.lessons[0].titleKey }],
      },
    ],
  });
  rejects(data, /ungültiges Notenbeispiel/);
});
test('Unmögliche Intervallparameter und gleich klingende Hörantworten werden abgelehnt', () => {
  for (const spec of [
    {
      type: 'INTERVAL_IDENTIFY_VISUAL',
      params: { intervals: ['P5'], range: { minMidi: 60, maxMidi: 61 } },
    },
    { type: 'INTERVAL_IDENTIFY_AURAL', params: { intervals: ['A4', 'd5'] } },
  ]) {
    const data = fresh();
    data.exerciseSets[0].exercises[0].spec = spec;
    rejects(data, /Ungültige Übungsparameter/);
  }
});
test('Verschiedene Übungslängen werden aufgelöst; leere und übergroße Sätze werden abgelehnt', () => {
  const data = fresh();
  data.exerciseSets[0].exercises = [{ spec: data.exerciseSets[0].exercises[0].spec, count: 25 }];
  assert.equal(resolveLesson(parseCatalogue(data), data.lessons[0].id).exercises.length, 25);
  data.exerciseSets[0].exercises[0].count = 0;
  rejects(data, /count/);
  data.exerciseSets[0].exercises[0].count = 201;
  rejects(data, /count|Zu viele Aufgaben/);
});
test('Mehrere einzeln gültige Sätze dürfen zusammen das Lektionslimit nicht umgehen', () => {
  const data = fresh();
  data.exerciseSets[0].exercises = [{ spec: data.exerciseSets[0].exercises[0].spec, count: 150 }];
  data.exerciseSets.push({ ...data.exerciseSets[0], id: 'another.set' });
  data.lessons[0].exerciseSetIds.push('another.set');
  rejects(data, /mehr als 200 Aufgaben/);
});
test('Eine reine Wiederholungslektion braucht keine Einführungskarten', () => {
  const data = fresh();
  data.lessons[0].introductionCardIds = [];
  assert.deepEqual(resolveLesson(parseCatalogue(data), data.lessons[0].id).introduction, []);
});
test('Öffentliche Texte werden deterministisch und ohne unreferenzierte Schlüssel erzeugt', () => {
  const data = publicCatalogue(released());
  const source = checks().messages.de;
  source.content.unused = { secret: 'Unapproved text' };
  assert.deepEqual(publicMessages(data, source), publicMessages(data, checks().messages.de));
  assert.equal(JSON.stringify(publicMessages(data, source)).includes('Unapproved text'), false);
});

const { default: appConfig } = await import('../apps/mobile/app.config.ts');
function withConfigEnv(variant, projectId, check) {
  const savedVariant = process.env.APP_VARIANT;
  const savedProjectId = process.env.EAS_PROJECT_ID;
  try {
    process.env.APP_VARIANT = variant;
    if (projectId === undefined) delete process.env.EAS_PROJECT_ID;
    else process.env.EAS_PROJECT_ID = projectId;
    check(() => appConfig({ config: {} }));
  } finally {
    if (savedVariant === undefined) delete process.env.APP_VARIANT;
    else process.env.APP_VARIANT = savedVariant;
    if (savedProjectId === undefined) delete process.env.EAS_PROJECT_ID;
    else process.env.EAS_PROJECT_ID = savedProjectId;
  }
}
test('Ohne EAS-Projekt sind keine OTA-Verbindungen aktiviert', () => {
  withConfigEnv('production', undefined, (make) => {
    const config = make();
    assert.equal(config.updates.enabled, false);
    assert.equal(config.updates.url, undefined);
    assert.equal(config.extra.eas, undefined);
  });
});
test('Ein explizites EAS-Projekt wird an Updates und eine App-Version gebunden', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  withConfigEnv('preview', id, (make) => {
    const config = make();
    assert.equal(config.updates.enabled, true);
    assert.equal(config.updates.url, `https://u.expo.dev/${id}`);
    assert.equal(config.extra.eas.projectId, id);
    assert.deepEqual(config.runtimeVersion, { policy: 'appVersion' });
    assert.equal(config.extra.variant, 'preview');
  });
});
test('Ungültige EAS-Projekt-ID wird nicht in eine Update-URL übernommen', () => {
  withConfigEnv('production', 'invalid/project', (make) => assert.throws(make, /EAS_PROJECT_ID/));
});
test('Unbekannte App-Variante wird zurückgewiesen', () => {
  withConfigEnv('unknown', undefined, (make) => assert.throws(make, /APP_VARIANT/));
});

test('Eine Textverschachtelung darf die Freigabe nicht umgehen', () => {
  const data = released();
  data.knowledgeArticles.push({
    id: 'draft.nested',
    contentVersion: 1,
    status: 'entwurf',
    titleKey: 'content.hidden.title',
    skillIds: [],
    sections: [
      { headingKey: 'content.hidden.title', bodyKey: 'content.hidden.body', examples: [] },
    ],
  });
  const options = checks();
  for (const value of Object.values(options.messages))
    value.content.hidden = { title: 'Hidden', body: 'Unapproved' };
  options.messages.de.content.firstLesson.notesBody = '$t(content.hidden.body)';
  assert.throws(
    () => parseCatalogue(data, options),
    /freigegebener Text verweist auf ungeprüften Inhalt/,
  );
});
test('Verschachtelte Inhaltsreferenzen müssen existieren', () => {
  const options = checks();
  options.messages.de.content.firstLesson.notesBody = '$t(translation:content.missing.body)';
  assert.throws(() => parseCatalogue(catalogue, options), /unbekannte Inhalts-Textreferenz/);
});
test('Ein Textzyklus wird vor dem Rendern in i18next abgelehnt', () => {
  const options = checks();
  options.messages.de.content.firstLesson.notesBody = '$t(content.firstLesson.notesBody)';
  assert.throws(() => parseCatalogue(catalogue, options), /Zyklus in Inhalts-Textreferenzen/);
});

const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
const { tmpdir } = await import('node:os');
const { join } = await import('node:path');
const { spawnSync } = await import('node:child_process');
function bundleFixture(source, check) {
  const directory = mkdtempSync(join(tmpdir(), 'harmonia-content-bundle-'));
  try {
    writeFileSync(join(directory, 'entry.js'), source);
    check(
      spawnSync(process.execPath, ['tools/check-public-bundle.mjs', directory], {
        encoding: 'utf8',
      }),
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
test('Bundleprüfung erkennt escapete Entwurfs-IDs trotz Regex und Template-Literalen', () => {
  bundleFixture(
    "const pattern = /[`'\"]+/; const label = `safe`; const id = '\\u0066undament.reading-and-listening.1';",
    (result) => {
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Entwurfsinhalt im öffentlichen Bundle gefunden/);
    },
  );
});
test('Bundleprüfung weist auch Entwurfstexte ohne eine enthaltene Lektions-ID zurück', () => {
  const text = JSON.stringify(contentMessages.de.firstLesson.notesBody).replace('ü', '\\u00fc');
  bundleFixture('const pattern = /[`\'"]+/; const text = ' + text + ';', (result) => {
    assert.equal(result.status, 1);
    assert.match(result.stderr, /content.firstLesson.notesBody/);
  });
});

test('P4.12: kurze Entwurfstexte und Antwortoptionen sind ohne Längen-Ausnahme gesperrt', () => {
  for (const text of [
    historyDraft.de.medieval.personaName,
    createHistoryJourneyText('de', historyJourneyMessages)('medieval').listeningOptions[0],
  ]) {
    assert.ok(text.length <= 24);
    const escaped = JSON.stringify(text).replace('i', '\\u0069');
    bundleFixture(`export const fragment = ${escaped};`, (result) => {
      assert.equal(result.status, 1);
      assert.match(result.stderr, /P4\.12/);
    });
  }
});

test('P4.12: alle acht Szenen- und Hörpartituren werden auch ohne Stationstexte erkannt', () => {
  for (const stop of historyStops)
    for (const field of ['sceneScore', 'listeningScore'])
      bundleFixture(
        `export const model = ${JSON.stringify(stop[field]).replace('treble', '\\u0074reble')};`,
        (result) => {
          assert.equal(result.status, 1);
          assert.match(result.stderr, /P4\.12/);
        },
      );
});

test('P4.12: glossary-expanded story copy is rejected without raw templates or source IDs', () => {
  for (const locale of ['de', 'en-US', 'en-GB']) {
    const copy = createHistoryJourneyText(locale, historyJourneyMessages)('medieval');
    assert.ok(!copy.scene.includes('$t('));
    bundleFixture(`export const copy = ${JSON.stringify(copy.scene)};`, (result) => {
      assert.equal(result.status, 1);
      assert.match(result.stderr, /P4\.12 rendered/);
    });
  }
});

test('Bundleprüfung erlaubt bereits öffentliche Glossarbegriffe bei gleichnamigen Entwurfszielen', () => {
  bundleFixture('export const terms = ["Dreiklänge", "triads", "rhythm"];', (result) => {
    assert.equal(result.status, 0, result.stderr);
  });
});
test('Öffentliche Septakkordnamen erlauben keine Stufe-3-Artikeltexte oder IDs', () => {
  const body = contentMessages.de.levelThree.units.chordsSevenths.minorSeventhBody;
  bundleFixture('export const labels = ["Mollseptakkord", "Dominantseptakkord"];', (result) => {
    assert.equal(result.status, 0, result.stderr);
  });
  bundleFixture(`export const body = ${JSON.stringify(body)};`, (result) => {
    assert.equal(result.status, 1);
    assert.match(result.stderr, /content.levelThree.units.chordsSevenths.minorSeventhBody/);
  });
  bundleFixture('export const id = "chords.l3.sevenths.lesson1";', (result) => {
    assert.equal(result.status, 1);
    assert.match(result.stderr, /chords.l3.sevenths.lesson1/);
  });
});
test('Ein öffentlicher Glossarbegriff erlaubt keine dazugehörige Entwurfs-Bereichs-ID', () => {
  bundleFixture('export const area = { title: "Dreiklänge", id: "area.chords" };', (result) => {
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Entwurfsinhalt im öffentlichen Bundle gefunden: area.chords/);
  });
});

test('Inhaltsreferenzen dürfen keine JavaScript-Prototypen als Textpfad verwenden', () => {
  const data = fresh();
  data.lessons[0].titleKey = 'content.constructor.leak';
  rejects(data, /Unzulässiger Textpfad/);
});

test('15 Notenwert-Beispiele: unabhängige Viertel-Tabelle prüft Klang, Stille und vollständige Takte', () => {
  const patterns = [
    [4],
    [2, 2],
    [1, 1, 1, 1],
    [2, 1, 0.5, 0.25, 0.25],
    Array(8).fill(0.5),
    Array(16).fill(0.25),
    [-4],
    [-2, 2],
    [-1, 1, -0.5, 0.5, -0.25, 0.25, 0.5],
    [1, -1, 1, -1],
    [2, -2],
    [2, -1, 1],
    [2, 2, 1, -1, 2],
    [2, -1, 0.5, 0.5],
    [2, 1, 0.5, 0.25, -0.25],
  ];
  const examples = catalogue.knowledgeCards
    .filter((c) => c.id.startsWith('rhythm.l1.values.'))
    .flatMap((c) => c.examples);
  assert.equal(examples.length, patterns.length);
  examples.forEach((example, index) => {
    const score = parseScore(example.score),
      timeline = scoreTimeline(score, { bpm: 90 });
    assert.deepEqual(validateScore(score), []);
    let beat = 0;
    const expected = [];
    for (const value of patterns[index]) {
      if (value > 0) expected.push([(beat * 2) / 3, (value * 2) / 3]);
      beat += Math.abs(value);
    }
    assert.ok(Math.abs(timeline.durationSeconds - (beat * 2) / 3) < 1e-10);
    assert.equal(timeline.tones.length, expected.length);
    timeline.tones.forEach((tone, i) => {
      assert.ok(Math.abs(tone.onsetSeconds - expected[i][0]) < 1e-10);
      assert.ok(Math.abs(tone.durationSeconds - expected[i][1]) < 1e-10);
    });
  });
});

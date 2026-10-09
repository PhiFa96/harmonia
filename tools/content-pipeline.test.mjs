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
import { parseScore, validateScore } from '../packages/notation/src/index.ts';

function checks() {
  return {
    messages: structuredClone(
      Object.fromEntries(
        Object.entries(contentMessages).map(([locale, content]) => [locale, { content }]),
      ),
    ),
    validateScore(source) {
      assert.deepEqual(validateScore(parseScore(source)), []);
    },
  };
}
const fresh = () => structuredClone(catalogue);
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

test('Bundleprüfung erlaubt bereits öffentliche Glossarbegriffe bei gleichnamigen Entwurfszielen', () => {
  bundleFixture('export const terms = ["Dreiklänge", "triads", "rhythm"];', (result) => {
    assert.equal(result.status, 0, result.stderr);
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

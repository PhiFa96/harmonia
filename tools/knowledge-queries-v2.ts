/** New P3.19 search probes: one direct and one reworded question for each upper-level article. */
export const upperLevelKnowledgeQueries: readonly {
  article: string;
  de: string;
  us: string;
  uk?: string;
  deAlternate: string;
  usAlternate: string;
  ukAlternate?: string;
}[] = [
  {
    article: 'scales.l3.modes.article',
    de: 'Wodurch unterscheiden sich dorisch und mixolydisch?',
    us: 'How do Dorian and Mixolydian modes differ?',
    deAlternate: 'Welche modalen Tonleitern haben andere Stufen als Dur und natürlich Moll?',
    usAlternate: 'Which modal scales change degrees compared with major and natural minor?',
  },
  {
    article: 'chords.l3.sevenths.article',
    de: 'Wie unterscheiden sich Dominantseptakkord und halbverminderter Septakkord?',
    us: 'How do dominant and half-diminished seventh chords differ?',
    deAlternate: 'Welche Töne gehören zu einem Mollseptakkord?',
    usAlternate: 'Which notes belong to a minor seventh chord?',
  },
  {
    article: 'harmony.l3.functions.article',
    de: 'Was bedeuten Tonika, Subdominante und Dominante?',
    us: 'What are tonic, subdominant and dominant functions?',
    deAlternate: 'Wie hängt eine Stufe von der Tonart und ihrem Kontext ab?',
    usAlternate: 'How does a scale degree depend on key and context?',
  },
  {
    article: 'harmony.l3.cadences.article',
    de: 'Was unterscheidet Halbschluss und Trugschluss?',
    us: 'How do half and deceptive cadences differ?',
    deAlternate: 'Welche Akkordfolge klingt wie eine plagale Schlusswendung?',
    usAlternate: 'What chord progression makes a plagal close?',
  },
  {
    article: 'harmony.l3.modulation.article',
    de: 'Woran erkenne ich eine neue Tonika statt bloßer Tonikalisierung?',
    us: 'How can I distinguish a new tonic from tonicization?',
    deAlternate: 'Was ist ein gemeinsamer Akkord beim Tonartwechsel?',
    usAlternate: 'What is a common chord in a key change?',
  },
  {
    article: 'aural.l3.dictation.article',
    de: 'Wie kontrolliere ich eine notierte Melodie im Diktat?',
    us: 'How do I check a notated melody in dictation?',
    deAlternate: 'Wie schreibe ich gehörten Rhythmus und Tonhöhen auf?',
    usAlternate: 'How can I write down heard rhythm and pitches?',
  },
  {
    article: 'forms.l3.phrases.article',
    de: 'Wie unterscheiden sich Motiv, Phrase, Vorder- und Nachsatz?',
    us: 'How do motif, phrase, antecedent and consequent differ?',
    deAlternate: 'Wann wirkt ein Nachsatz wie eine Antwort auf den Vordersatz?',
    usAlternate: 'When does a consequent sound like a response to an antecedent?',
  },
  {
    article: 'forms.l3.designs.article',
    de: 'Was unterscheidet zweiteilige Form, Rondo und Variation?',
    us: 'How do binary form, rondo and variation differ?',
    deAlternate: 'Welche Wiederkehr hat eine dreiteilige Form?',
    usAlternate: 'What kind of return occurs in ternary form?',
  },
  {
    article: 'instruments.l3.families.article',
    de: 'Welche Instrumente zählen zu Holz- und Blechbläsern?',
    us: 'Which instruments belong to woodwind and brass families?',
    deAlternate: 'Warum beschreibt die Instrumentenfamilie nicht einfach das Material?',
    usAlternate: 'Why is an instrument family not just its material?',
  },
  {
    article: 'instruments.l3.scores.article',
    de: 'Wie lese ich eine transponierende Stimme in der Partitur?',
    us: 'How do I read a transposing part in a score?',
    deAlternate:
      'Was ist bei einer B-Klarinette der Unterschied zwischen notierter und klingender Tonhöhe?',
    usAlternate: 'How do written and sounding pitches differ for a B-flat clarinet?',
  },
  {
    article: 'jazzpop.l3.harmony.article',
    de: 'Wie funktionieren Lead Sheet, II–V–I und Backbeat?',
    us: 'How do lead sheets, II-V-I and backbeats work?',
    deAlternate: 'Was bedeutet ein harmonischer Loop in Popmusik?',
    usAlternate: 'What does a harmonic loop mean in pop music?',
  },
  {
    article: 'history.l3.methods.article',
    de: 'Wie vergleiche ich Handschrift, Edition und historische Aufnahme?',
    us: 'How do I compare a manuscript, edition and historical recording?',
    deAlternate: 'Warum sind Aufnahmedatum und Werkdatum unterschiedliche Quellenangaben?',
    usAlternate: 'Why are a recording date and a work date different source facts?',
  },
  {
    article: 'notation.l4.multivoice.article',
    de: 'Wie lese ich Alt- und Tenorschlüssel in einer mehrstimmigen Partitur?',
    us: 'How do I read alto and tenor clefs in a multi-voice score?',
    deAlternate: 'Wie richte ich selbstständige Stimmen über mehrere Systeme vertikal aus?',
    usAlternate: 'How do I align independent voices across staves?',
  },
  {
    article: 'rhythm.l4.complex.article',
    de: 'Wie unterscheiden sich Triole, Synkope und Hemiole?',
    us: 'How do triplet, syncopation and hemiola differ?',
    deAlternate: 'Wie funktioniert die rhythmische Unterteilung bei einer Dreiergruppe?',
    usAlternate: 'How does rhythmic subdivision work in a group of three?',
  },
  {
    article: 'chords.l4.extensions.article',
    de: 'Was sind Nonakkord und alterierte Akkordtöne?',
    us: 'What are ninth chords and altered chord tones?',
    deAlternate: 'Wie erkenne ich eine Umkehrung eines Septakkords?',
    usAlternate: 'How do I recognize an inversion of a seventh chord?',
  },
  {
    article: 'harmony.l4.applied.article',
    de: 'Wie hängen Zwischendominante, gemeinsamer Akkord und neue Tonika zusammen?',
    us: 'How do applied dominants, common chords and a new tonic relate?',
    deAlternate: 'Wann bestätigt eine Kadenz tatsächlich eine neue Tonart?',
    usAlternate: 'When does a cadence establish a new key?',
  },
  {
    article: 'satz.l4.voice-leading.article',
    de: 'Warum vermeidet man parallele Quinten in vierstimmigem Satz?',
    us: 'Why are parallel fifths avoided in four-part writing?',
    deAlternate: 'Wie führe ich den Leitton und halte gemeinsame Töne?',
    usAlternate: 'How should I resolve a leading tone and retain common tones?',
  },
  {
    article: 'satz.l4.figured-bass.article',
    de: 'Was bedeuten 5/3, 6/3 und 6/4 im Generalbass?',
    us: 'What do 5/3, 6/3 and 6/4 mean in figured bass?',
    deAlternate: 'Wie erkenne ich einen Sextakkord über dem bezifferten Bass?',
    usAlternate: 'How do I recognize a six-three chord over a figured bass?',
  },
  {
    article: 'forms.l4.sonata.article',
    de: 'Was geschieht in Exposition, Durchführung und Reprise?',
    us: 'What happens in exposition, development and recapitulation?',
    deAlternate: 'Welche Rolle kann eine Coda in einer Sonatenform spielen?',
    usAlternate: 'What role can a coda play in sonata form?',
  },
  {
    article: 'analysis.l4.score.article',
    de: 'Wie belege ich eine motivische oder harmonische Analyse an der Partitur?',
    us: 'How do I support motivic or harmonic analysis with score evidence?',
    deAlternate: 'Wo kann ich Phrasengrenzen in einem Werk begründen?',
    usAlternate: 'How can I justify phrase boundaries in a work?',
  },
  {
    article: 'jazzpop.l4.voicings.article',
    de: 'Welche Rolle haben Terz, Septime und Optionstöne beim Jazz-Voicing?',
    us: 'What roles do third, seventh and extensions play in a jazz voicing?',
    deAlternate: 'Was steht in einem Lead Sheet und was muss beim II–V–I ergänzt werden?',
    usAlternate: 'What does a lead sheet leave open in a II-V-I progression?',
  },
  {
    article: 'instruments.l4.orchestration.article',
    de: 'Wie berücksichtige ich Tonumfang und transponierende Stimmen beim Instrumentieren?',
    us: 'How do range and transposing parts affect orchestration?',
    deAlternate: 'Wann ist eine Verdopplung in der Partitur sinnvoll?',
    usAlternate: 'When is doubling useful in a score?',
  },
  {
    article: 'acoustics.l4.tuning.article',
    de: 'Wie unterscheiden sich reine Quinte, gleichstufige und mitteltönige Stimmung?',
    us: 'How do a pure fifth, equal temperament and meantone tuning differ?',
    deAlternate: 'Was erklärt die Obertonreihe über die reine Quinte?',
    usAlternate: 'What does the overtone series explain about a pure fifth?',
  },
  {
    article: 'aural.l4.preparation.article',
    de: 'Wie übe ich Vierklänge, Diktat und Blattsingen für die Aufnahmeprüfung?',
    us: 'How do I practice seventh chords, dictation and sight-singing for an entrance exam?',
    deAlternate: 'Wie kontrolliere ich gehörte Intervalle im musikalischen Kontext?',
    usAlternate: 'How can I check heard intervals in musical context?',
  },
  {
    article: 'history.l4.survey.article',
    de: 'Wie vergleiche ich Editionen und Aufnahmen eines historischen Werks?',
    us: 'How do I compare editions and recordings of a historical work?',
    deAlternate: 'Wie benenne ich historische Unsicherheit bei Werk und Kontext?',
    usAlternate: 'How do I describe historical uncertainty about a work and its context?',
  },
];

import type { KnowledgeQueryPair } from './knowledge-queries-v2.ts';

/** Original search probes, not model answers or evidence of specialist approval. */
export const levelFiveKnowledgeQueries: readonly KnowledgeQueryPair[] = [
  {
    article: 'counterpoint.l5.species.article',
    de: 'Warum zählt die reine Quarte über dem tiefsten Ton hier nicht als Konsonanz?',
    us: 'Why is a perfect fourth above the lowest note not a consonance in this model?',
    deAlternate: 'Welche Grenzen hat die automatische Prüfung der ersten Gattung?',
    usAlternate: 'What are the limits of automatic first-species counterpoint assessment?',
  },
  {
    article: 'counterpoint.l5.imitation.article',
    de: 'Wie unterscheiden sich reale und tonale Antwort in einer Fugenexposition?',
    us: 'How do real and tonal answers differ in a fugue exposition?',
    deAlternate: 'Wie werden die Halbtonabstände bei einer motivischen Umkehrung gespiegelt?',
    usAlternate: 'How does motivic inversion reflect directed semitone intervals?',
  },
  {
    article: 'forms.l5.structure.article',
    de: 'Reicht die Folge A–B–A–C–A aus, um ein historisches Werk als Rondo zu bestimmen?',
    us: 'Is the pattern A–B–A–C–A enough to identify a historical work as a rondo?',
    deAlternate: 'Warum ist eine Reprise nicht bloß eine wörtliche Wiederholung?',
    usAlternate: 'Why is a recapitulation more than a literal return of the opening?',
  },
  {
    article: 'analysis.l5.methods.article',
    de: 'Wie begründe ich die Segmentgrenzen für eine prüfbare Analysefrage?',
    us: 'How do I justify segment boundaries for a testable analytical question?',
    deAlternate: 'Wie trenne ich Messung und Deutung in einer Werkanalyse?',
    usAlternate: 'How can I separate measurement from interpretation in musical analysis?',
  },
  {
    article: 'contemporary.l5.serial.article',
    de: 'Erzeugt eine Oktavversetzung neue Tonklassen in einer Zwölftonreihe?',
    us: 'Does octave displacement create new pitch classes in a twelve-tone row?',
    deAlternate: 'Ist eine Zwölftonreihe schon eine serielle Organisation der Dauern?',
    usAlternate: 'Does a twelve-tone row already organize durations serially?',
    ukAlternate: 'Does a twelve-tone row already organise durations serially?',
  },
  {
    article: 'contemporary.l5.sets.article',
    de: 'Wie zähle ich ungeordnete Tonklassenpaare für einen Intervallklassenvektor?',
    us: 'How do I count unordered pitch-class pairs for an interval-class vector?',
    deAlternate: 'Beweist ein gleicher Intervallklassenvektor immer dieselbe Mengenklasse?',
    usAlternate: 'Does an identical interval-class vector always establish the same set class?',
  },
  {
    article: 'contemporary.l5.process.article',
    de: 'Wie unterscheidet sich eine Verschiebung um ganze Pulse von kontinuierlichem Phasing?',
    us: 'How does rotation by whole pulses differ from continuous phasing?',
    deAlternate: 'Wie wächst ein wiederkehrendes Muster bei einem additiven Prozess?',
    usAlternate: 'How does a recurring pattern grow in an additive process?',
  },
  {
    article: 'world.l5.context.article',
    de: 'Warum beschreibt eine westlich notierte Tonleiter einen Maqam nicht vollständig?',
    us: 'Why does a Western notated scale not fully describe a maqam?',
    deAlternate: 'Welche Grenzen hat das gleichstufige Zwölftonraster beim Vergleich mit Raga?',
    usAlternate: 'What are the limits of a twelve-step equal-tempered grid when discussing raga?',
  },
];

// Fachglossar DE ↔ EN (US/UK): einzige Quelle für Fachbegriffe in Texten (ADR 0003).
// Texte verweisen mit $t(glossary:schlüssel) darauf, damit en-GB automatisch die britischen Begriffe zeigt.
//
// Namen musikalischer Objekte (Notenwerte, Intervalle, Tonleitern, Akkorde) erzeugt die Theorie-Engine.
// Die Notenwerte übernimmt das Glossar von dort, statt sie ein zweites Mal aufzuschreiben.
// Begriffswahl, Quellen und Alternativen: docs/plan/i18n-und-glossar.md

import type { NoteValue } from '@harmonia/theory';
import { NOTE_VALUES, duration, durationName } from '@harmonia/theory';

import type { AppLocale } from './locale.ts';

export type GlossaryCategory = 'notation' | 'pitch' | 'scales' | 'chords' | 'rhythm' | 'history';

/** Grammatisches Geschlecht (für Artikel in deutschen Texten). */
export type GermanGender = 'm' | 'f' | 'n';

export interface GlossaryTerm {
  readonly term: string;
  /** Mehrzahl; fehlt bei Begriffen, die in Texten nur in der Einzahl vorkommen. */
  readonly plural?: string;
}

export interface GlossaryEntry {
  readonly category: GlossaryCategory;
  readonly de: GlossaryTerm & { readonly gender: GermanGender };
  /** Englisch (US) – auch Grundlage für Englisch (UK). */
  readonly en: GlossaryTerm;
  /** Englisch (UK), nur wenn abweichend. */
  readonly enGB?: GlossaryTerm;
  /** Hinweis für Autoren: Abgrenzung, gängige Alternativen. */
  readonly note?: string;
}

/** Kernbegriffe, Version 1 (P1.05). Ausbau auf etwa 150 Begriffe in P0.05. */
export const GLOSSARY = {
  dynamicPianissimo: {
    category: 'notation',
    de: { term: 'pianissimo', gender: 'n' },
    en: { term: 'pianissimo' },
    note: 'Italienische Dynamikangabe; als Vortragsanweisung kleingeschrieben, in DE/US/UK unverändert.',
  },
  dynamicPiano: {
    category: 'notation',
    de: { term: 'piano', gender: 'n' },
    en: { term: 'piano' },
    note: 'Italienische Dynamikangabe; als Vortragsanweisung kleingeschrieben, in DE/US/UK unverändert.',
  },
  dynamicMezzoPiano: {
    category: 'notation',
    de: { term: 'mezzo piano', gender: 'n' },
    en: { term: 'mezzo piano' },
    note: 'Italienische Dynamikangabe; als Vortragsanweisung kleingeschrieben, in DE/US/UK unverändert.',
  },
  dynamicMezzoForte: {
    category: 'notation',
    de: { term: 'mezzo forte', gender: 'n' },
    en: { term: 'mezzo forte' },
    note: 'Italienische Dynamikangabe; als Vortragsanweisung kleingeschrieben, in DE/US/UK unverändert.',
  },
  dynamicForte: {
    category: 'notation',
    de: { term: 'forte', gender: 'n' },
    en: { term: 'forte' },
    note: 'Italienische Dynamikangabe; als Vortragsanweisung kleingeschrieben, in DE/US/UK unverändert.',
  },
  dynamicFortissimo: {
    category: 'notation',
    de: { term: 'fortissimo', gender: 'n' },
    en: { term: 'fortissimo' },
    note: 'Italienische Dynamikangabe; als Vortragsanweisung kleingeschrieben, in DE/US/UK unverändert.',
  },
  dynamicFortississimo: {
    category: 'notation',
    de: { term: 'fortississimo', gender: 'n' },
    en: { term: 'fortississimo' },
    note: 'Italienische Dynamikangabe; als Vortragsanweisung kleingeschrieben, in DE/US/UK unverändert.',
  },

  voice: {
    category: 'history',
    de: { term: 'Stimme', gender: 'f', plural: 'Stimmen' },
    en: { term: 'voice', plural: 'voices' },
  },
  instrument: {
    category: 'history',
    de: { term: 'Instrument', gender: 'n', plural: 'Instrumente' },
    en: { term: 'instrument', plural: 'instruments' },
  },
  recording: {
    category: 'history',
    de: { term: 'Aufnahme', gender: 'f', plural: 'Aufnahmen' },
    en: { term: 'recording', plural: 'recordings' },
  },
  electronicSound: {
    category: 'history',
    de: { term: 'Elektronische Klangerzeugung', gender: 'f' },
    en: { term: 'electronic sound generation' },
  },
  scoreSource: {
    category: 'history',
    de: { term: 'Notentext', gender: 'm', plural: 'Notentexte' },
    en: { term: 'score', plural: 'scores' },
  },
  report: {
    category: 'history',
    de: { term: 'Bericht', gender: 'm', plural: 'Berichte' },
    en: { term: 'report', plural: 'reports' },
  },
  programmeSource: {
    category: 'history',
    de: { term: 'Programmzettel', gender: 'm', plural: 'Programmzettel' },
    en: { term: 'program', plural: 'programs' },
    enGB: { term: 'programme', plural: 'programmes' },
  },
  place: {
    category: 'history',
    de: { term: 'Ort', gender: 'm', plural: 'Orte' },
    en: { term: 'place', plural: 'places' },
  },
  time: {
    category: 'history',
    de: { term: 'Zeit', gender: 'f', plural: 'Zeiten' },
    en: { term: 'time', plural: 'times' },
  },
  occasion: {
    category: 'history',
    de: { term: 'Anlass', gender: 'm', plural: 'Anlässe' },
    en: { term: 'occasion', plural: 'occasions' },
  },
  author: {
    category: 'history',
    de: { term: 'Urheberschaft', gender: 'f' },
    en: { term: 'authorship' },
  },
  medieval: {
    category: 'history',
    de: { term: 'Mittelalter', gender: 'n' },
    en: { term: 'Middle Ages' },
  },
  renaissance: {
    category: 'history',
    de: { term: 'Renaissance', gender: 'f' },
    en: { term: 'Renaissance' },
  },
  baroque: { category: 'history', de: { term: 'Barock', gender: 'm' }, en: { term: 'Baroque' } },
  classicalPeriod: {
    category: 'history',
    de: { term: 'Klassik', gender: 'f' },
    en: { term: 'Classical period' },
  },
  romanticPeriod: {
    category: 'history',
    de: { term: 'Romantik', gender: 'f' },
    en: { term: 'Romantic period' },
  },
  musicSince1900: {
    category: 'history',
    de: { term: 'Musik seit 1900', gender: 'f' },
    en: { term: 'music since 1900' },
  },
  genre: {
    category: 'history',
    de: { term: 'Gattung', gender: 'f', plural: 'Gattungen' },
    en: { term: 'genre', plural: 'genres' },
  },
  performingForces: {
    category: 'history',
    de: { term: 'Besetzung', gender: 'f', plural: 'Besetzungen' },
    en: { term: 'performing forces', plural: 'sets of performing forces' },
  },
  function: {
    category: 'history',
    de: { term: 'Funktion', gender: 'f', plural: 'Funktionen' },
    en: { term: 'function', plural: 'functions' },
  },
  observation: {
    category: 'history',
    de: { term: 'Hörbeobachtung', gender: 'f', plural: 'Hörbeobachtungen' },
    en: { term: 'listening observation', plural: 'listening observations' },
  },
  sourceInformation: {
    category: 'history',
    de: { term: 'Quellenangabe', gender: 'f', plural: 'Quellenangaben' },
    en: { term: 'source reference', plural: 'source references' },
  },
  inference: {
    category: 'history',
    de: { term: 'Schlussfolgerung', gender: 'f', plural: 'Schlussfolgerungen' },
    en: { term: 'inference', plural: 'inferences' },
  },
  uncertainty: {
    category: 'history',
    de: { term: 'Ungewissheit', gender: 'f' },
    en: { term: 'uncertainty' },
  },
  soundSource: {
    category: 'history',
    de: { term: 'Klangquelle', gender: 'f', plural: 'Klangquellen' },
    en: { term: 'sound source', plural: 'sound sources' },
  },
  // Notenschrift
  note: {
    category: 'notation',
    de: { term: 'Note', gender: 'f', plural: 'Noten' },
    en: { term: 'note', plural: 'notes' },
  },
  naturalNote: {
    category: 'pitch',
    de: { term: 'Stammton', gender: 'm', plural: 'Stammtöne' },
    en: { term: 'natural note', plural: 'natural notes' },
    note: 'Unalterierter Ton C, D, E, F, G, A, H/englisch B; nicht das Auflösungszeichen natural.',
  },
  keyboard: {
    category: 'notation',
    de: { term: 'Klaviatur', gender: 'f', plural: 'Klaviaturen' },
    en: { term: 'piano keyboard', plural: 'piano keyboards' },
  },
  enharmonic: {
    category: 'pitch',
    de: { term: 'Enharmonik', gender: 'f' },
    en: { term: 'enharmonic equivalence' },
    note: 'Hier: verschiedene Notenschreibweisen für dieselbe Taste auf dem gleichstufig gestimmten Klavier.',
  },
  pianoKey: {
    category: 'notation',
    de: { term: 'Klaviertaste', gender: 'f', plural: 'Klaviertasten' },
    en: { term: 'piano key', plural: 'piano keys' },
  },
  twoBlackKeys: {
    category: 'notation',
    de: {
      term: 'Zweiergruppe schwarzer Tasten',
      gender: 'f',
      plural: 'Zweiergruppen schwarzer Tasten',
    },
    en: { term: 'group of two black keys', plural: 'groups of two black keys' },
  },
  threeBlackKeys: {
    category: 'notation',
    de: {
      term: 'Dreiergruppe schwarzer Tasten',
      gender: 'f',
      plural: 'Dreiergruppen schwarzer Tasten',
    },
    en: { term: 'group of three black keys', plural: 'groups of three black keys' },
  },
  rest: {
    category: 'notation',
    de: { term: 'Pause', gender: 'f', plural: 'Pausen' },
    en: { term: 'rest', plural: 'rests' },
  },
  staff: {
    category: 'notation',
    de: { term: 'Notensystem', gender: 'n', plural: 'Notensysteme' },
    en: { term: 'staff', plural: 'staves' },
    enGB: { term: 'stave', plural: 'staves' },
    note: 'US-Mehrzahl auch „staffs“.',
  },
  ledgerLine: {
    category: 'notation',
    de: { term: 'Hilfslinie', gender: 'f', plural: 'Hilfslinien' },
    en: { term: 'ledger line', plural: 'ledger lines' },
    note: 'In britischen Lehrwerken auch „leger line“.',
  },
  clef: {
    category: 'notation',
    de: { term: 'Notenschlüssel', gender: 'm', plural: 'Notenschlüssel' },
    en: { term: 'clef', plural: 'clefs' },
  },
  trebleClef: {
    category: 'notation',
    de: { term: 'Violinschlüssel', gender: 'm', plural: 'Violinschlüssel' },
    en: { term: 'treble clef', plural: 'treble clefs' },
    note: 'Auch G-Schlüssel / G clef.',
  },
  monophony: {
    category: 'history',
    de: { term: 'Einstimmigkeit', gender: 'f' },
    en: { term: 'monophony' },
    note: 'Eine einzelne melodische Stimme; mehrere Menschen können dieselbe Stimme gemeinsam ausführen.',
  },
  polyphony: {
    category: 'history',
    de: { term: 'Mehrstimmigkeit', gender: 'f' },
    en: { term: 'polyphony' },
    note: 'Mehrere zugleich geführte Stimmen; hier insbesondere selbstständig geführte Linien.',
  },
  imitation: {
    category: 'history',
    de: { term: 'Imitation', gender: 'f' },
    en: { term: 'imitation' },
    note: 'Eine Stimme greift einen musikalischen Gedanken einer anderen Stimme auf.',
  },
  continuo: {
    category: 'history',
    de: { term: 'Generalbass', gender: 'm' },
    en: { term: 'basso continuo' },
    note: 'Bassgrundlage und akkordische Ausführung; nicht auf ein einzelnes Instrument festgelegt.',
  },
  chromaticism: {
    category: 'pitch',
    de: { term: 'Chromatik', gender: 'f' },
    en: { term: 'chromaticism' },
    note: 'Verwendung von Halbtonschritten beziehungsweise Veränderungen über die diatonische Grundlage hinaus.',
  },
  sourceCriticism: {
    category: 'history',
    de: { term: 'Quellenkritik', gender: 'f' },
    en: { term: 'source criticism' },
    note: 'Herkunft, Perspektive, Aussagebereich und Abhängigkeit von Quellen prüfen.',
  },
  migration: {
    category: 'history',
    de: { term: 'Migration', gender: 'f' },
    en: { term: 'migration' },
    note: 'Ortswechsel und Veränderung sozialer Netzwerke; in den Jazzbeispielen ein konkreter musikalischer Kontext.',
  },
  jazz: {
    category: 'history',
    de: { term: 'Jazz', gender: 'm' },
    en: { term: 'jazz' },
    note: 'Vielfältige Musiktraditionen mit besonderer Bedeutung afroamerikanischer Praxis und Geschichte.',
  },
  popularMusic: {
    category: 'history',
    de: { term: 'Popularmusik', gender: 'f' },
    en: { term: 'popular music' },
    note: 'Verschiedene Genres, Publika und Verbreitungsformen; keine einzelne Stildefinition.',
  },
  syncopation: {
    category: 'rhythm',
    de: { term: 'Synkope', gender: 'f', plural: 'Synkopen' },
    en: { term: 'syncopation', plural: 'syncopations' },
  },
  subdivision: {
    category: 'rhythm',
    de: { term: 'Unterteilung', gender: 'f', plural: 'Unterteilungen' },
    en: { term: 'subdivision', plural: 'subdivisions' },
  },
  broadcast: {
    category: 'history',
    de: { term: 'Rundfunksendung', gender: 'f', plural: 'Rundfunksendungen' },
    en: { term: 'radio broadcast', plural: 'radio broadcasts' },
  },
  stream: {
    category: 'history',
    de: { term: 'Streamingveröffentlichung', gender: 'f', plural: 'Streamingveröffentlichungen' },
    en: { term: 'streaming release', plural: 'streaming releases' },
  },
  grandStaff: {
    category: 'notation',
    de: { term: 'großes Notensystem', gender: 'n', plural: 'große Notensysteme' },
    en: { term: 'grand staff', plural: 'grand staves' },
    enGB: { term: 'grand stave', plural: 'grand staves' },
    note: 'Verbundenes Violin- und Basssystem; beide Schlüssel teilen sich das mittlere C.',
  },
  helmholtzNotation: {
    category: 'pitch',
    de: { term: 'Helmholtz-Oktavbezeichnung', gender: 'f' },
    en: { term: 'Helmholtz pitch notation' },
  },
  scientificNotation: {
    category: 'pitch',
    de: { term: 'wissenschaftliche Oktavbezeichnung', gender: 'f' },
    en: { term: 'scientific pitch notation' },
    note: 'Internationale Buchstaben C–B; Oktavnummer wechselt bei C, mittleres C = C4.',
  },
  bassClef: {
    category: 'notation',
    de: { term: 'Bassschlüssel', gender: 'm', plural: 'Bassschlüssel' },
    en: { term: 'bass clef', plural: 'bass clefs' },
    note: 'Auch F-Schlüssel / F clef.',
  },
  altoClef: {
    category: 'notation',
    de: { term: 'Altschlüssel', gender: 'm', plural: 'Altschlüssel' },
    en: { term: 'alto clef', plural: 'alto clefs' },
  },
  tenorClef: {
    category: 'notation',
    de: { term: 'Tenorschlüssel', gender: 'm', plural: 'Tenorschlüssel' },
    en: { term: 'tenor clef', plural: 'tenor clefs' },
  },
  accidental: {
    category: 'notation',
    de: { term: 'Versetzungszeichen', gender: 'n', plural: 'Versetzungszeichen' },
    en: { term: 'accidental', plural: 'accidentals' },
    note: 'Umgangssprachlich auch „Vorzeichen“; das meint aber meist die Tonartvorzeichnung.',
  },
  sharp: {
    category: 'notation',
    de: { term: 'Kreuz', gender: 'n', plural: 'Kreuze' },
    en: { term: 'sharp', plural: 'sharps' },
  },
  flat: {
    category: 'notation',
    de: { term: 'b', gender: 'n', plural: 'b' },
    en: { term: 'flat', plural: 'flats' },
    note: 'Duden: das b, Mehrzahl die b. Auch „Be“.',
  },
  natural: {
    category: 'notation',
    de: { term: 'Auflösungszeichen', gender: 'n', plural: 'Auflösungszeichen' },
    en: { term: 'natural', plural: 'naturals' },
  },
  doubleSharp: {
    category: 'notation',
    de: { term: 'Doppelkreuz', gender: 'n', plural: 'Doppelkreuze' },
    en: { term: 'double sharp', plural: 'double sharps' },
  },
  doubleFlat: {
    category: 'notation',
    de: { term: 'Doppel-b', gender: 'n', plural: 'Doppel-b' },
    en: { term: 'double flat', plural: 'double flats' },
  },
  keySignature: {
    category: 'notation',
    de: { term: 'Tonartvorzeichnung', gender: 'f', plural: 'Tonartvorzeichnungen' },
    en: { term: 'key signature', plural: 'key signatures' },
    note: 'Auch Generalvorzeichen oder Vorzeichnung.',
  },
  barline: {
    category: 'notation',
    de: { term: 'Taktstrich', gender: 'm', plural: 'Taktstriche' },
    en: { term: 'bar line', plural: 'bar lines' },
    note: 'Auch zusammengeschrieben „barline“.',
  },
  pickup: {
    category: 'rhythm',
    de: { term: 'Auftakt', gender: 'm', plural: 'Auftakte' },
    en: { term: 'pickup', plural: 'pickups' },
    enGB: { term: 'upbeat', plural: 'upbeats' },
    note: 'Ein unvollständiger erster Takt vor dem ersten Taktstrich.',
  },
  finalBarline: {
    category: 'notation',
    de: { term: 'Schlussstrich', gender: 'm', plural: 'Schlussstriche' },
    en: { term: 'final bar line', plural: 'final bar lines' },
  },
  notehead: {
    category: 'notation',
    de: { term: 'Notenkopf', gender: 'm', plural: 'Notenköpfe' },
    en: { term: 'notehead', plural: 'noteheads' },
  },
  stem: {
    category: 'notation',
    de: { term: 'Notenhals', gender: 'm', plural: 'Notenhälse' },
    en: { term: 'stem', plural: 'stems' },
  },
  flag: {
    category: 'notation',
    de: { term: 'Fähnchen', gender: 'n', plural: 'Fähnchen' },
    en: { term: 'flag', plural: 'flags' },
    note: 'In britischen Lehrwerken auch „tail“.',
  },
  beam: {
    category: 'notation',
    de: { term: 'Balken', gender: 'm', plural: 'Balken' },
    en: { term: 'beam', plural: 'beams' },
  },
  tie: {
    category: 'notation',
    de: { term: 'Haltebogen', gender: 'm' },
    en: { term: 'tie' },
    note: 'Ohne Mehrzahl, weil sie im Deutschen schwankt (Haltebogen/Haltebögen).',
  },

  // Tonhöhe
  pitch: {
    category: 'pitch',
    de: { term: 'Tonhöhe', gender: 'f', plural: 'Tonhöhen' },
    en: { term: 'pitch', plural: 'pitches' },
  },
  noteName: {
    category: 'pitch',
    de: { term: 'Tonname', gender: 'm', plural: 'Tonnamen' },
    en: { term: 'note name', plural: 'note names' },
  },
  octave: {
    category: 'pitch',
    de: { term: 'Oktave', gender: 'f', plural: 'Oktaven' },
    en: { term: 'octave', plural: 'octaves' },
  },
  octaveRegister: {
    category: 'pitch',
    de: { term: 'Oktavlage', gender: 'f', plural: 'Oktavlagen' },
    en: { term: 'octave register', plural: 'octave registers' },
    note: 'Registerangabe im vollständigen Tonnamen; die nächste Lage beginnt jeweils bei C.',
  },
  interval: {
    category: 'pitch',
    de: { term: 'Intervall', gender: 'n', plural: 'Intervalle' },
    en: { term: 'interval', plural: 'intervals' },
  },
  intervalQuality: {
    category: 'pitch',
    de: { term: 'Intervallqualität', gender: 'f', plural: 'Intervallqualitäten' },
    en: { term: 'interval quality', plural: 'interval qualities' },
  },
  tritone: {
    category: 'pitch',
    de: { term: 'Tritonus', gender: 'm', plural: 'Tritoni' },
    en: { term: 'tritone', plural: 'tritones' },
  },
  unison: {
    category: 'pitch',
    de: { term: 'Prime', gender: 'f', plural: 'Primen' },
    en: { term: 'unison', plural: 'unisons' },
  },
  second: {
    category: 'pitch',
    de: { term: 'Sekunde', gender: 'f', plural: 'Sekunden' },
    en: { term: 'second', plural: 'seconds' },
  },
  third: {
    category: 'pitch',
    de: { term: 'Terz', gender: 'f', plural: 'Terzen' },
    en: { term: 'third', plural: 'thirds' },
  },
  fourth: {
    category: 'pitch',
    de: { term: 'Quarte', gender: 'f', plural: 'Quarten' },
    en: { term: 'fourth', plural: 'fourths' },
  },
  fifth: {
    category: 'pitch',
    de: { term: 'Quinte', gender: 'f', plural: 'Quinten' },
    en: { term: 'fifth', plural: 'fifths' },
  },
  sixth: {
    category: 'pitch',
    de: { term: 'Sexte', gender: 'f', plural: 'Sexten' },
    en: { term: 'sixth', plural: 'sixths' },
  },
  seventh: {
    category: 'pitch',
    de: { term: 'Septime', gender: 'f', plural: 'Septimen' },
    en: { term: 'seventh', plural: 'sevenths' },
  },
  noteRepetition: {
    category: 'pitch',
    de: { term: 'Tonwiederholung', gender: 'f', plural: 'Tonwiederholungen' },
    en: { term: 'repeated note', plural: 'repeated notes' },
  },
  melodicStep: {
    category: 'pitch',
    de: { term: 'Tonschritt', gender: 'm', plural: 'Tonschritte' },
    en: { term: 'step', plural: 'steps' },
  },
  melodicLeap: {
    category: 'pitch',
    de: { term: 'Tonsprung', gender: 'm', plural: 'Tonsprünge' },
    en: { term: 'leap', plural: 'leaps' },
  },
  semitone: {
    category: 'pitch',
    de: { term: 'Halbton', gender: 'm', plural: 'Halbtöne' },
    en: { term: 'half step', plural: 'half steps' },
    enGB: { term: 'semitone', plural: 'semitones' },
    note: 'In den USA auch „semitone“.',
  },
  wholeTone: {
    category: 'pitch',
    de: { term: 'Ganzton', gender: 'm', plural: 'Ganztöne' },
    en: { term: 'whole step', plural: 'whole steps' },
    enGB: { term: 'tone', plural: 'tones' },
    note: 'In beiden Varianten auch „whole tone“.',
  },

  // Tonleitern und Tonarten
  scale: {
    category: 'scales',
    de: { term: 'Tonleiter', gender: 'f', plural: 'Tonleitern' },
    en: { term: 'scale', plural: 'scales' },
  },
  scaleDegree: {
    category: 'scales',
    de: { term: 'Tonleiterstufe', gender: 'f', plural: 'Tonleiterstufen' },
    en: { term: 'scale degree', plural: 'scale degrees' },
    note: 'Kurz „Stufe“.',
  },
  tonic: {
    category: 'scales',
    de: { term: 'Grundton', gender: 'm', plural: 'Grundtöne' },
    en: { term: 'tonic', plural: 'tonics' },
    note: 'Grundton einer Tonleiter oder Tonart. Die Funktion heißt Tonika.',
  },
  key: {
    category: 'scales',
    de: { term: 'Tonart', gender: 'f', plural: 'Tonarten' },
    en: { term: 'key', plural: 'keys' },
  },
  major: {
    category: 'scales',
    de: { term: 'Dur', gender: 'n' },
    en: { term: 'major' },
  },
  minor: {
    category: 'scales',
    de: { term: 'Moll', gender: 'n' },
    en: { term: 'minor' },
  },
  circleOfFifths: {
    category: 'scales',
    de: { term: 'Quintenzirkel', gender: 'm' },
    en: { term: 'circle of fifths' },
  },
  relativeKey: {
    category: 'scales',
    de: { term: 'Paralleltonart', gender: 'f', plural: 'Paralleltonarten' },
    en: { term: 'relative key', plural: 'relative keys' },
    note: 'Falscher Freund: „parallel key“ ist die Varianttonart.',
  },
  parallelKey: {
    category: 'scales',
    de: { term: 'Varianttonart', gender: 'f', plural: 'Varianttonarten' },
    en: { term: 'parallel key', plural: 'parallel keys' },
    note: 'Falscher Freund: „Paralleltonart“ ist die relative key. Britisch auch „tonic major/minor“.',
  },

  // Akkorde
  chord: {
    category: 'chords',
    de: { term: 'Akkord', gender: 'm', plural: 'Akkorde' },
    en: { term: 'chord', plural: 'chords' },
  },
  triad: {
    category: 'chords',
    de: { term: 'Dreiklang', gender: 'm', plural: 'Dreiklänge' },
    en: { term: 'triad', plural: 'triads' },
  },
  root: {
    category: 'chords',
    de: { term: 'Grundton', gender: 'm', plural: 'Grundtöne' },
    en: { term: 'root', plural: 'roots' },
    note: 'Grundton eines Akkords; nicht zu verwechseln mit dem Basston.',
  },
  bassNote: {
    category: 'chords',
    de: { term: 'Basston', gender: 'm', plural: 'Basstöne' },
    en: { term: 'bass note', plural: 'bass notes' },
  },
  inversion: {
    category: 'chords',
    de: { term: 'Umkehrung', gender: 'f', plural: 'Umkehrungen' },
    en: { term: 'inversion', plural: 'inversions' },
  },
  rootPosition: {
    category: 'chords',
    de: { term: 'Grundstellung', gender: 'f' },
    en: { term: 'root position' },
  },

  // Rhythmus und Takt
  rhythm: {
    category: 'rhythm',
    de: { term: 'Rhythmus', gender: 'm', plural: 'Rhythmen' },
    en: { term: 'rhythm', plural: 'rhythms' },
  },
  noteValue: {
    category: 'rhythm',
    de: { term: 'Notenwert', gender: 'm', plural: 'Notenwerte' },
    en: { term: 'note value', plural: 'note values' },
    note: 'Britisch auch „time value“.',
  },
  measure: {
    category: 'rhythm',
    de: { term: 'Takt', gender: 'm', plural: 'Takte' },
    en: { term: 'measure', plural: 'measures' },
    enGB: { term: 'bar', plural: 'bars' },
  },
  timeSignature: {
    category: 'rhythm',
    de: { term: 'Taktangabe', gender: 'f', plural: 'Taktangaben' },
    en: { term: 'time signature', plural: 'time signatures' },
    note: 'Das Zeichen am Anfang (z. B. 3/4). Auch Taktvorzeichnung.',
  },
  meter: {
    category: 'rhythm',
    de: { term: 'Taktart', gender: 'f', plural: 'Taktarten' },
    en: { term: 'meter', plural: 'meters' },
    enGB: { term: 'metre', plural: 'metres' },
    note: 'Die Art des Takts (z. B. Dreivierteltakt), angezeigt durch die Taktangabe.',
  },
  beat: {
    category: 'rhythm',
    de: { term: 'Schlag', gender: 'm', plural: 'Schläge' },
    en: { term: 'beat', plural: 'beats' },
    note: 'Auch Zählzeit oder Grundschlag.',
  },
  tempo: {
    category: 'rhythm',
    de: { term: 'Tempo', gender: 'n' },
    en: { term: 'tempo' },
    note: 'Ohne Mehrzahl, weil sie schwankt (Tempi/Tempos).',
  },
  triplet: {
    category: 'rhythm',
    de: { term: 'Triole', gender: 'f', plural: 'Triolen' },
    en: { term: 'triplet', plural: 'triplets' },
  },
  pulse: {
    category: 'rhythm',
    de: { term: 'Puls', gender: 'm' },
    en: { term: 'pulse' },
    note: 'Gleichmäßiger Grundschlag als zeitliches Bezugsmuster.',
  },
  metronome: {
    category: 'rhythm',
    de: { term: 'Metronom', gender: 'n', plural: 'Metronome' },
    en: { term: 'metronome', plural: 'metronomes' },
  },
  countIn: {
    category: 'rhythm',
    de: { term: 'Einzählen', gender: 'n' },
    en: { term: 'count-in' },
  },
  beatsPerMinute: {
    category: 'rhythm',
    de: { term: 'BPM-Angabe (Schläge pro Minute)', gender: 'f' },
    en: { term: 'BPM (beats per minute)' },
  },
  beatGroup: {
    category: 'rhythm',
    de: { term: 'Zählgruppe', gender: 'f', plural: 'Zählgruppen' },
    en: { term: 'beat group', plural: 'beat groups' },
  },
} as const satisfies Readonly<Record<string, GlossaryEntry>>;

export type GlossaryKey = keyof typeof GLOSSARY;

type PluralGlossaryKey = {
  [K in GlossaryKey]: (typeof GLOSSARY)[K]['de'] extends { readonly plural: string } ? K : never;
}[GlossaryKey];

type WithPlurals<Key extends string, PluralKey extends string> = Readonly<Record<Key, string>> & {
  readonly [K in PluralKey as `${K}_one` | `${K}_other`]: string;
};

/** Namen der Notenwerte aus der Engine, je mit Einzahl und Mehrzahl. */
type NoteValueNames = WithPlurals<NoteValue, NoteValue>;

/** Glossar als i18next-Namensraum `glossary`, z. B. $t(glossary:measure_other) oder $t(glossary:notes.quarter). */
export type GlossaryResource = WithPlurals<GlossaryKey, PluralGlossaryKey> & {
  readonly notes: NoteValueNames;
  readonly rests: NoteValueNames;
};

type Variant = 'de' | 'en' | 'enGB';

/** Notenwerte als Glossar-Einträge, Namen aus `durationName` (Einzahl) mit regelmäßiger Mehrzahl. */
export function noteValueEntries(
  kind: 'note' | 'rest',
): Readonly<Record<NoteValue, GlossaryEntry>> {
  const entries = NOTE_VALUES.map((value): [NoteValue, GlossaryEntry] => {
    const d = duration(value);
    const de = durationName(d, { language: 'de', kind });
    const us = durationName(d, { language: 'en', variant: 'us', kind });
    const uk = durationName(d, { language: 'en', variant: 'uk', kind });
    return [
      value,
      {
        category: 'rhythm',
        // Alle deutschen Namen enden auf „Note“ bzw. „Pause“: Mehrzahl mit -n.
        de: { term: de, gender: 'f', plural: `${de}n` },
        en: { term: us, plural: `${us}s` },
        enGB: { term: uk, plural: `${uk}s` },
      },
    ];
  });
  return Object.fromEntries(entries) as Record<NoteValue, GlossaryEntry>;
}

function termFor(entry: GlossaryEntry, variant: Variant): GlossaryTerm {
  switch (variant) {
    case 'de':
      return entry.de;
    case 'en':
      return entry.en;
    case 'enGB':
      return entry.enGB ?? entry.en;
  }
}

/** i18next-Schlüssel eines Eintrags: Grundform, bei Mehrzahl zusätzlich _one und _other. */
function keysOf(key: string, term: GlossaryTerm): [string, string][] {
  const pairs: [string, string][] = [[key, term.term]];
  if (term.plural !== undefined) {
    pairs.push([`${key}_one`, term.term], [`${key}_other`, term.plural]);
  }
  return pairs;
}

function section(
  entries: Readonly<Record<string, GlossaryEntry>>,
  variant: Variant,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(entries)
      // en-GB enthält nur Abweichungen; der Rest kommt über die Rückfallsprache en-US.
      .filter(([, entry]) => variant !== 'enGB' || entry.enGB !== undefined)
      .flatMap(([key, entry]) => keysOf(key, termFor(entry, variant))),
  );
}

/** Der Namensraum `glossary` für eine Sprache. en-GB enthält nur die britischen Abweichungen. */
export function glossaryResource(
  locale: AppLocale,
): Record<string, string | Record<string, string>> {
  const variant: Variant = locale === 'de' ? 'de' : locale === 'en-US' ? 'en' : 'enGB';
  return {
    ...section(GLOSSARY, variant),
    notes: section(noteValueEntries('note'), variant),
    rests: section(noteValueEntries('rest'), variant),
  };
}

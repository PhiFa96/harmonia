// Nur für lokale Entwurfsberichte; kein Import in den App-Nachrichtenkatalog.
import type {
  Voice,
  VoiceLeadingRule,
  VoiceLeadingSeverity,
} from '../../packages/theory/src/index.ts';

export interface ReportMessages {
  readonly title: string;
  readonly draft: string;
  readonly scope: string;
  readonly ownScore: string;
  readonly findings: string;
  readonly noFindings: string;
  readonly noRules: string;
  readonly enabled: string;
  readonly configuration: string;
  readonly score: string;
  readonly scoreDescription: string;
  readonly source: string;
  readonly destination: string;
  readonly voice: string;
  readonly staff: string;
  readonly pitch: string;
  readonly event: string;
  readonly measure: string;
  readonly offset: string;
  readonly rest: string;
  readonly marker: string;
  readonly positionHelp: string;
  readonly sourceHelp: string;
  readonly license: string;
  readonly voices: Readonly<Record<Voice, string>>;
  readonly severity: Readonly<Record<VoiceLeadingSeverity, string>>;
  readonly rules: Readonly<
    Record<VoiceLeadingRule, { readonly title: string; readonly description: string }>
  >;
}

const de: ReportMessages = {
  title: 'Stimmführung – interner Prüfbericht',
  draft: 'Entwurf – unabhängige Fachprüfung und F05 offen',
  scope:
    'Dieser Bericht zeigt Funde der ausdrücklich eingeschalteten Regeln. Er beurteilt nicht die vollständige Richtigkeit des Satzes.',
  ownScore: 'Eigener Satz',
  findings: 'Befunde',
  noFindings:
    'Unter den eingeschalteten Regeln wurden keine Befunde gefunden. Fachfreigabe und weitere Satzregeln bleiben offen.',
  noRules: 'Keine Regeln eingeschaltet. Es wurde kein Regelurteil erzeugt.',
  enabled: 'Eingeschaltete Regeln und gewählte Einstufung',
  configuration: 'Eingabe und Konfiguration',
  score: 'Notierter Satz',
  scoreDescription: 'Textbeschreibung aller Noten und Pausen',
  source: 'Ausgang',
  destination: 'Ziel',
  voice: 'Stimme',
  staff: 'System',
  pitch: 'Ton oder Pause',
  event: 'Ereignis',
  measure: 'Takt',
  offset: 'Position',
  rest: 'Pause',
  marker:
    'Die markierten Noten oder Pausen gehören zum Ziel dieses Befunds. Ausgangsnoten stehen, falls erforderlich, in der Tabelle.',
  positionHelp:
    'Takte und Ereignisse werden ab 1 gezählt. Positionen sind Brüche einer ganzen Note ab Taktbeginn.',
  sourceHelp:
    'Regelgrundlage und offene Quellenfragen: docs/quality/p4-09-quellenentwurf.md. Die Texte und Beispiele dieses Berichts bleiben Entwurf.',
  license: 'Lizenz der eingebetteten Bravura-Notenschrift',
  voices: { bass: 'Bass', tenor: 'Tenor', alto: 'Alt', soprano: 'Sopran' },
  severity: {
    error: 'als Fehler eingestellt',
    warning: 'als Warnung eingestellt',
    hint: 'als Hinweis eingestellt',
  },
  rules: {
    'parallel-fifth': {
      title: 'Quintparallele',
      description:
        'Zwei Stimmen bewegen sich gleichgerichtet zwischen geschriebenen reinen Quinten einschließlich ihrer Oktavierungen.',
    },
    'parallel-octave': {
      title: 'Oktavparallele',
      description:
        'Zwei Stimmen bewegen sich gleichgerichtet in der Oktavfamilie. Dazu zählt auch ein Wechsel zwischen Prim- und Oktavverdopplung.',
    },
    'parallel-unison': {
      title: 'Primparallele',
      description:
        'Zwei Stimmen bewegen sich gleichgerichtet von einer geschriebenen reinen Prime zur nächsten.',
    },
    'contrary-fifth': {
      title: 'Gegenquinte',
      description:
        'Das gewählte Stimmpaar bewegt sich in Gegenrichtung zwischen reinen Quinten einschließlich ihrer Oktavierungen.',
    },
    'contrary-octave': {
      title: 'Gegenoktave',
      description:
        'Das gewählte Stimmpaar bewegt sich in Gegenrichtung zwischen reinen Oktav- oder Primverdopplungen.',
    },
    'hidden-fifth': {
      title: 'Verdeckter Quintgang',
      description:
        'Die Außenstimmen erreichen eine reine Quinte in gleichgerichteter Bewegung. Der gewählte Parameter zur Sopranbewegung bestimmt, welche Fälle gemeldet werden.',
    },
    'hidden-octave': {
      title: 'Verdeckter Oktavgang',
      description:
        'Die Außenstimmen erreichen eine reine Oktave in gleichgerichteter Bewegung. Der gewählte Parameter zur Sopranbewegung bestimmt, welche Fälle gemeldet werden.',
    },
    'voice-crossing': {
      title: 'Stimmkreuzung',
      description:
        'Eine zugeordnete tiefere Stimme klingt oberhalb ihrer benachbarten höheren Stimme.',
    },
    'voice-overlap': {
      title: 'Stimmüberschreitung',
      description:
        'Eine Stimme überschreitet den vorigen Ton der Nachbarstimme, während die aktuelle Reihenfolge der Stimmen erhalten bleibt.',
    },
    'upper-voice-spacing': {
      title: 'Abstand der Oberstimmen',
      description:
        'Sopran und Alt oder Alt und Tenor liegen mehr als zwölf Halbtöne auseinander. Die SATB-Lehrkonvention dafür ist noch offen.',
    },
    'voice-range': {
      title: 'Stimmumfang',
      description:
        'Ein Ton liegt außerhalb der ausdrücklich angegebenen Grenzen dieser Stimme. Es wird kein Standardumfang angenommen.',
    },
    'leading-tone-resolution': {
      title: 'Leittonauflösung',
      description:
        'An der markierten Auflösungsgrenze erfüllt der Leitton den gewählten Auflösungsweg nicht. Eine Pause oder ein gehaltener Ton erfüllt ihn ebenfalls nicht.',
    },
    'seventh-resolution': {
      title: 'Septimauflösung',
      description:
        'An der markierten Grenze geht die benannte Akkordseptime in derselben Stimme nicht um einen Halb- oder Ganzton abwärts.',
    },
    'doubled-leading-tone': {
      title: 'Leittonverdopplung',
      description:
        'Der geschriebene Leitton zur angegebenen Tonika erklingt in mehreren Stimmen. Alle beteiligten Stimmen sind aufgeführt.',
    },
    'augmented-second': {
      title: 'Übermäßige Sekunde',
      description:
        'Eine Stimme bewegt sich um eine geschriebene Sekunde mit drei Halbtönen. Eine enharmonisch klingende kleine Terz fällt nicht unter diese Regel.',
    },
    'melodic-leap': {
      title: 'Melodischer Sprung',
      description:
        'Das geschriebene Melodieintervall überschreitet die gewählte Grenze. Diese Grenze ist eine ausdrückliche Einstellung und kein freigegebener Standard.',
    },
  },
};

const en: ReportMessages = {
  title: 'Voice leading – internal review report',
  draft: 'Draft – independent subject review and F05 remain open',
  scope:
    'This report shows findings from the explicitly enabled rules. It does not establish that the whole composition is correct.',
  ownScore: 'Own composition',
  findings: 'Findings',
  noFindings:
    'No findings under the enabled rules. Subject approval and further part-writing rules remain open.',
  noRules: 'No rules enabled. No rule assessment was produced.',
  enabled: 'Enabled rules and chosen severity',
  configuration: 'Input and configuration',
  score: 'Written score',
  scoreDescription: 'Text description of all notes and rests',
  source: 'Source',
  destination: 'Destination',
  voice: 'Voice',
  staff: 'Staff',
  pitch: 'Pitch or rest',
  event: 'Event',
  measure: 'Measure',
  offset: 'Offset',
  rest: 'Rest',
  marker:
    'Marked notes or rests belong to the destination of this finding. Source notes, where required, are listed in the table.',
  positionHelp:
    'Measures and events are numbered from 1. Offsets are fractions of a whole note from the start of the measure.',
  sourceHelp:
    'Rule references and open source questions: docs/quality/p4-09-quellenentwurf.md. The text and examples in this report remain drafts.',
  license: 'License of the embedded Bravura music font',
  voices: { bass: 'Bass', tenor: 'Tenor', alto: 'Alto', soprano: 'Soprano' },
  severity: {
    error: 'configured as error',
    warning: 'configured as warning',
    hint: 'configured as hint',
  },
  rules: {
    'parallel-fifth': {
      title: 'Parallel fifths',
      description:
        'Two voices move in the same direction between written perfect fifths, including compound fifths.',
    },
    'parallel-octave': {
      title: 'Parallel octaves',
      description:
        'Two voices move in the same direction within the octave family, including changes between unison and octave doubling.',
    },
    'parallel-unison': {
      title: 'Parallel unisons',
      description:
        'Two voices move in the same direction from one written perfect unison to the next.',
    },
    'contrary-fifth': {
      title: 'Contrary fifths',
      description:
        'The chosen pair moves in opposite directions between perfect fifths, including compound fifths.',
    },
    'contrary-octave': {
      title: 'Contrary octaves',
      description:
        'The chosen pair moves in opposite directions between perfect octave or unison doublings.',
    },
    'hidden-fifth': {
      title: 'Hidden fifth',
      description:
        'The outer voices approach a perfect fifth in similar motion. The selected soprano-motion setting determines which cases are reported.',
    },
    'hidden-octave': {
      title: 'Hidden octave',
      description:
        'The outer voices approach a perfect octave in similar motion. The selected soprano-motion setting determines which cases are reported.',
    },
    'voice-crossing': {
      title: 'Voice crossing',
      description: 'An assigned lower voice sounds above its adjacent upper voice.',
    },
    'voice-overlap': {
      title: 'Voice overlap',
      description:
        'A voice moves beyond the previous pitch of its neighbor while the current ordering of the voices is maintained.',
    },
    'upper-voice-spacing': {
      title: 'Upper voice spacing',
      description:
        'Soprano and alto, or alto and tenor, are more than twelve semitones apart. The SATB teaching convention remains open.',
    },
    'voice-range': {
      title: 'Voice range',
      description:
        'A pitch lies outside the explicitly supplied limits for this voice. No default range is assumed.',
    },
    'leading-tone-resolution': {
      title: 'Leading tone resolution',
      description:
        'At the marked boundary, the leading tone does not follow the selected resolution path. A rest or held pitch does not fulfill that path either.',
    },
    'seventh-resolution': {
      title: 'Seventh resolution',
      description:
        'At the marked boundary, the named chordal seventh does not descend by a half step or whole step in the same voice.',
    },
    'doubled-leading-tone': {
      title: 'Doubled leading tone',
      description:
        'The written leading tone of the supplied tonic sounds in several voices. All participating voices are listed.',
    },
    'augmented-second': {
      title: 'Augmented second',
      description:
        'A voice moves by a written second spanning three semitones. An enharmonically equivalent minor third is excluded from this rule.',
    },
    'melodic-leap': {
      title: 'Melodic leap',
      description:
        'The written melodic interval exceeds the selected limit. That limit is an explicit setting, not an approved default.',
    },
  },
};

const uk: ReportMessages = {
  ...en,
  measure: 'Bar',
  license: 'Licence of the embedded Bravura music font',
  positionHelp:
    'Bars and events are numbered from 1. Offsets are fractions of a semibreve from the start of the bar.',
  rules: {
    ...en.rules,
    'voice-overlap': {
      title: 'Voice overlap',
      description:
        'A voice moves beyond the previous pitch of its neighbour while the current ordering of the voices is maintained.',
    },
    'leading-tone-resolution': {
      title: 'Leading note resolution',
      description:
        'At the marked boundary, the leading note does not follow the selected resolution path. A rest or held pitch does not fulfil that path either.',
    },
    'doubled-leading-tone': {
      title: 'Doubled leading note',
      description:
        'The written leading note of the supplied tonic sounds in several voices. All participating voices are listed.',
    },
    'seventh-resolution': {
      title: 'Seventh resolution',
      description:
        'At the marked boundary, the named chordal seventh does not descend by a semitone or tone in the same voice.',
    },
  },
};

export const REPORT_MESSAGES = { 'de-DE': de, 'en-US': en, 'en-GB': uk } as const;
export type ReportLocale = keyof typeof REPORT_MESSAGES;

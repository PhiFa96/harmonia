// Kleine, feste Suchabnahme je Artikel; ersetzt nicht den 200-Fragen-Tutor-Test aus P2.18.
export const knowledgeQueries: readonly { article: string; de: string; us: string; uk?: string }[] =
  [
    {
      article: 'notation.l1.staff.article',
      de: 'Wie lese ich Noten im Violinschlüssel?',
      us: 'How do I read notes in the treble clef?',
    },
    {
      article: 'notation.l1.keyboard.article',
      de: 'Wie finde ich Halbton und Ganzton auf der Klaviatur?',
      us: 'How do I find half steps and whole steps on the piano keyboard?',
      uk: 'How do I find semitones and tones on the piano keyboard?',
    },
    {
      article: 'notation.l1.register.article',
      de: 'Wozu dienen Hilfslinien bei verschiedenen Oktavlagen?',
      us: 'How do ledger lines show octave registers?',
    },
    {
      article: 'rhythm.l1.pulse.article',
      de: 'Wie hängen Puls und Tempo zusammen?',
      us: 'How do pulse and tempo relate?',
    },
    {
      article: 'rhythm.l1.values.article',
      de: 'Welche Notenwerte und Pausen füllen einen Takt?',
      us: 'Which note values and rests fill a measure?',
      uk: 'Which note values and rests fill a bar?',
    },
    {
      article: 'rhythm.l1.simple-meter.article',
      de: 'Wie zähle ich Zweier-, Dreier- und Vierertakte ein?',
      us: 'How do I count in simple meters?',
      uk: 'How do I count in simple metres?',
    },
    {
      article: 'intervals.l1.size.article',
      de: 'Wie lese ich Intervallnummer und Richtung?',
      us: 'How do I read interval number and direction?',
    },
    {
      article: 'intervals.l1.first-qualities.article',
      de: 'Was sind reine Intervalle und Halbtonabstände?',
      us: 'What are perfect intervals and half-step distances?',
      uk: 'What are perfect intervals and semitone distances?',
    },
    {
      article: 'aural.l1.pulse-rhythm.article',
      de: 'Wie höre ich Puls und kurze Rhythmen?',
      us: 'How do I hear pulse and short rhythms?',
    },
    {
      article: 'aural.l1.pitch-intervals.article',
      de: 'Wie höre ich Tonrichtung und Tonfolgen?',
      us: 'How do I hear pitch direction and melodies?',
    },
    {
      article: 'history.l1.sources.article',
      de: 'Was verraten Klangquellen und Dokumente über musikalischen Kontext?',
      us: 'What do sound sources and documents tell us about musical context?',
    },
    {
      article: 'history.l1.overview.article',
      de: 'Wie beschreibe ich Epochen und Besetzung mit belegten Hörbeobachtungen?',
      us: 'How do I describe periods and performing forces using supported listening observations?',
    },
    {
      article: 'fundament.reading-and-listening.article',
      de: 'Wie kann ich Noten und Intervalle entdecken?',
      us: 'How can I discover notes and intervals?',
    },
    {
      article: 'notation.l2.clefs-registers.article',
      de: 'Wie lese ich Bassschlüssel und großes System?',
      us: 'How do I read bass clef and grand staff?',
      uk: 'How do I read bass clef and grand stave?',
    },
    {
      article: 'notation.l2.spelling.article',
      de: 'Was bedeutet Enharmonik beim Notenschreiben?',
      us: 'What does enharmonic spelling mean in note writing?',
    },
    {
      article: 'rhythm.l2.dotted-tied.article',
      de: 'Wie wirken Punktierung, Haltebögen und Synkopen?',
      us: 'How do dots, ties and syncopation work?',
    },
    {
      article: 'rhythm.l2.subdivision.article',
      de: 'Wie unterscheiden sich Triolen und Gliederung von 3/4 und 6/8?',
      us: 'How do triplets and grouping in 3/4 and 6/8 differ?',
    },
    {
      article: 'intervals.l2.qualities-build.article',
      de: 'Wie bestimme ich Intervallqualität und korrekte Schrift?',
      us: 'How do I determine interval quality and correct spelling?',
    },
    {
      article: 'intervals.l2.inversion.article',
      de: 'Was passiert bei Intervallumkehrung und Oktavzuordnung?',
      us: 'What happens to interval inversion and octave relationships?',
    },
    {
      article: 'scales.l2.major.article',
      de: 'Wie erkenne ich Tonika und Stufen einer Durtonleiter?',
      us: 'How do I identify the tonic and degrees of major scales?',
    },
    {
      article: 'scales.l2.minor.article',
      de: 'Was unterscheidet die drei Molltonleitermodelle?',
      us: 'What distinguishes the three minor-scale models?',
    },
    {
      article: 'scales.l2.keys.article',
      de: 'Wie helfen Vorzeichnungen und Quintenzirkel bei verwandten Tonarten?',
      us: 'How do signatures and the circle of fifths help with related keys?',
    },
    {
      article: 'chords.l2.qualities.article',
      de: 'Was unterscheidet die vier Dreiklangarten?',
      us: 'What distinguishes the four triad qualities?',
    },
    {
      article: 'chords.l2.inversions.article',
      de: 'Was sind Akkordrollen, Umkehrungen und leitereigene Dreiklänge?',
      us: 'What are chord roles, inversions and diatonic triads?',
    },
    {
      article: 'aural.l2.rhythm-detail.article',
      de: 'Wie höre und ergänze ich Rhythmusdetails?',
      us: 'How do I hear and complete rhythmic details?',
    },
    {
      article: 'aural.l2.melody.article',
      de: 'Wie trainiere ich Intervall-, Tonleiter- und Melodiegehör?',
      us: 'How do I train interval, scale and melodic listening?',
    },
    {
      article: 'aural.l2.triads.article',
      de: 'Wie höre ich Dreiklangqualität und Umkehrung?',
      us: 'How do I hear triad qualities and inversions?',
    },
    {
      article: 'history.l2.period-contexts.article',
      de: 'Wie hängen europäische Epochen und Quellenkontexte zusammen?',
      us: 'How do European periods and source contexts relate?',
    },
    {
      article: 'history.l2.jazz-pop-sources.article',
      de: 'Wie funktioniert Quellenkritik bei Jazz und populärer Musik?',
      us: 'How does source criticism work for jazz and popular music?',
    },
  ];

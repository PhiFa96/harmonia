import { contentMessages } from '@harmonia/i18n/content-messages';
import levelThreeExercise from './level-three-exercise.json' with { type: 'json' };
import levelFourExercise from './level-four-exercise.json' with { type: 'json' };
// Texte der Oberfläche auf Deutsch. Diese Datei gibt die Schlüssel vor; en-US muss dieselben haben.
// Fachbegriffe kommen aus dem Glossar: $t(glossary:…).

export const de = {
  voice: {
    privacy:
      'Das Mikrofon verarbeitet den Ton auf deinem Gerät. Die übernommenen Tonhöhen werden als Übungsantwort gespeichert; es wird keine Audioaufnahme gespeichert oder hochgeladen. Beim Verlassen oder im Hintergrund stoppt das Mikrofon.',
    helpTone: 'Hilfeton spielen (zählt als Hinweis)',
    detected: 'Erkannt: {{note}}',
    waiting: 'Warte auf einen gehaltenen Ton …',
    capture: 'Diesen Ton übernehmen',
    progress: '{{count}} von {{total}} Tönen übernommen',
    retry: 'Töne neu aufnehmen',
    skip: 'Diese Mikrofonaufgabe überspringen',
  },
  tuner: {
    title: 'Stimmgerät',
    entry: 'Prüfe die Tonhöhe beim Singen oder Spielen.',
    open: 'Stimmgerät öffnen',
    intro: 'Spiele oder singe einen einzelnen, gehaltenen Ton in einer ruhigen Umgebung.',
    privacyTitle: 'Mikrofonzugriff',
    privacy:
      'Das Mikrofon startet erst auf Knopfdruck. Audio wird nur auf deinem Gerät verarbeitet, weder gespeichert noch hochgeladen. Beim Verlassen oder im Hintergrund stoppt es.',
    reference: 'Kammerton A: {{hz}} Hz',
    start: 'Mikrofon starten',
    stop: 'Mikrofon stoppen',
    requesting: 'Mikrofonzugriff wird angefragt …',
    permission:
      'Mikrofonzugriff verweigert. Erlaube den Zugriff in den Geräteeinstellungen und versuche es erneut.',
    interrupted: 'Die Mikrofonverbindung wurde unterbrochen. Starte sie erneut.',
    unavailable: 'Das Mikrofon ist zurzeit nicht verfügbar. Prüfe Gerät und Browserberechtigungen.',
    silent: 'Warte auf einen Ton …',
    unstable: 'Halte einen einzelnen Ton etwas länger.',
    frequency: '{{hz}} Hz',
    cents: '{{cents}} Cent',
    direction_low: 'Zu tief',
    direction_center: 'Gestimmt',
    direction_high: 'Zu hoch',
    scale: 'Mitte = gestimmt; links zu tief, rechts zu hoch.',
  },
  friends: {
    title: 'Freunde und Freundes-Quests',
    entry: 'Lerne mit eingeladenen Freunden und erreicht gemeinsam ein Wochenziel.',
    open: 'Freunde öffnen',
    guest: 'Für Freundschaften brauchst du ein Konto und eine Internetverbindung.',
    rules:
      'Freunde kommen nur per Einladungslink oder Code hinzu. Keine Kontakt- oder Namenssuche. Freunde sehen deine aktuelle Lernserie und Liga-Stufe. Eine Quest zählt nur neue bestätigte XP ab ihrem Start; die Woche endet Montag um 00:00 UTC.',
    loading: 'Freunde werden geladen …',
    refresh: 'Freunde aktualisieren',
    error_auth: 'Bitte melde dich erneut an.',
    error_missing: 'Diese Einladung oder Freundschaft ist nicht mehr verfügbar.',
    error_retry: 'Gleichzeitige Änderung. Versuche es erneut.',
    error_limit: 'Eine Freundesliste ist voll (höchstens 50 Freunde).',
    error_quest_active: 'Eine Person hat bereits eine Quest für diese Woche.',
    error_unavailable: 'Der bestätigte Freundesstand konnte nicht geladen werden.',
    inviteTitle: 'Einladung',
    createInvite: 'Einladungslink erstellen',
    inviteExpiry: 'Gültig bis {{date}}',
    share: 'Link teilen oder kopieren',
    shareMessage: 'Harmonia-Freundschaft: {{link}}\nEinladungscode: {{code}}',
    code: 'Einladungscode oder Link',
    accept: 'Einladung annehmen',
    listTitle: 'Deine Freunde',
    empty: 'Noch keine bestätigten Freunde.',
    friend: 'Freund {{count}}',
    stats_one: 'Lernserie: {{count}} Tag · Liga-Stufe: {{tier}}',
    stats_other: 'Lernserie: {{count}} Tage · Liga-Stufe: {{tier}}',
    startQuest: 'Wochenquest zusammen starten',
    remove: 'Entfernen',
    block: 'Blockieren',
    confirmRemove: 'Diese Freundschaft und eine gemeinsame laufende Quest entfernen?',
    confirmBlock: 'Diese Person blockieren und eine gemeinsame laufende Quest beenden?',
    confirm: 'Bestätigen',
    cancel: 'Abbrechen',
    questTitle: 'Wochenquest',
    questEmpty: 'Wähle einen bestätigten Freund für diese Woche. Ziel: zusammen 300 neue XP.',
    questUsed:
      'Deine Wochenquest wurde bereits begonnen oder beendet. Die nächste ist ab Montag (UTC) möglich.',
    questPartner: 'Mit Freund {{number}}',
    questProgress: 'Du: {{own}} XP · Freund: {{friend}} XP · Ziel: {{target}} XP',
    questActive: 'Läuft bis Sonntagabend (UTC).',
    questCompleted: 'Geschafft! Ihr habt beide ein Quest-Abzeichen erhalten.',
    badges: 'Quest-Abzeichen: {{count}}',
    blockedTitle: 'Blockierte Personen',
    blocked: 'Blockierte Person {{count}}',
    unblock: 'Blockierung aufheben',
    removeFriend: 'Freund {{count}} entfernen',
    blockFriend: 'Freund {{count}} blockieren',
    startQuestWith: 'Wochenquest zusammen starten mit Freund {{count}}',
    unblockPerson: 'Blockierung aufheben für blockierte Person {{count}}',
    shared: 'Einladung wurde geteilt oder kopiert.',
    shareFailed: 'Teilen oder Kopieren hat nicht geklappt.',
  },
  puzzle: {
    title: 'Tägliches Rätsel',
    entry: 'Jeden Tag eine gemeinsame Aufgabe. Die Schwierigkeit steigt bis Sonntag.',
    open: 'Heutiges Rätsel öffnen',
    guest: 'Für deine Rätselserie brauchst du ein Konto und eine Internetverbindung.',
    loading: 'Rätsel wird geladen …',
    error: 'Das Rätsel konnte nicht geladen oder bestätigt werden. Versuche es erneut.',
    newDay: 'Ein neuer Rätseltag hat begonnen. Lade das heutige Rätsel.',
    reload: 'Rätsel neu laden',
    day: 'Rätsel vom {{day}}',
    streak_one: 'Rätselserie: {{count}} Tag',
    streak_other: 'Rätselserie: {{count}} Tage',
    reset: 'Neues Rätsel um Mitternacht ({{zone}}).',
    difficulty: 'Schwierigkeitsstufe {{count}}',
    unavailable: 'Für diesen Tag ist noch kein freigegebenes Rätsel verfügbar.',
    oneAttempt: 'Ein Versuch für das heutige Rätsel',
    correct: 'Richtig gelöst!',
    incorrect: 'Heute leider nicht gelöst.',
    tomorrow: 'Morgen wartet das nächste Rätsel.',
    share: 'Ergebnis teilen oder kopieren',
    shareText: 'Harmonia-Rätsel {{day}} {{symbol}} · Serie: {{streak}}',
  },
  duel: {
    title: 'Duelle',
    entry:
      'Spiele drei Minuten gegen eine andere Person oder einen echten aufgezeichneten Rush-Lauf.',
    open: 'Duelle öffnen',
    guest: 'Für Duelle brauchst du ein Konto und eine Internetverbindung.',
    loading: 'Duellstand wird geladen …',
    error: 'Der bestätigte Duellstand konnte nicht geladen werden. Versuche es erneut.',
    reload: 'Stand neu laden',
    kind_live: 'Live-Duell',
    kind_friend: 'Einladungsduell',
    kind_ghost: 'Ghost-Duell',
    ghostDisclosure:
      'Du spielst gegen die Aufzeichnung eines echten Rush-Laufs. Der Ghost ist nicht live; dieses Duell ändert dein Rating nicht.',
    friendDisclosure:
      'Dieses Duell wurde per Einladungslink gestartet und ändert das Rating nicht.',
    time: 'Verbleibende Zeit: {{time}}',
    startIn: 'Start in {{seconds}} Sekunden',
    scores: 'Du: {{own}} Punkte · Gegenüber: {{rival}} Punkte',
    starting: 'Beide Seiten starten in Kürze.',
    running: 'Die Zeit läuft auch bei Verbindungsabbruch weiter. Nur bestätigte Antworten zählen.',
    question_one: 'Aufgabe {{count}} · Schwierigkeitsstufe {{difficulty}}',
    question_other: 'Aufgabe {{count}} · Schwierigkeitsstufe {{difficulty}}',
    progress: 'Duellzeit',
    outcome_win: 'Gewonnen',
    outcome_loss: 'Verloren',
    outcome_draw: 'Unentschieden',
    finalScore: 'Du: {{own}} Punkte · Gegenüber: {{rival}} Punkte',
    rating: 'Duell-Rating: {{before}} → {{after}}',
    unrated: 'Dieses Duell zählt nicht für das Rating.',
    reward:
      'Live-Duelle geben 10 XP bei Sieg und 3 XP bei Niederlage oder Unentschieden, höchstens 50 XP pro UTC-Tag.',
    searching: 'Gegner wird gesucht …',
    ghostWait:
      'Nach etwa zehn Sekunden kann ein echter aufgezeichneter Lauf einspringen. Ohne passende Aufzeichnung läuft die Suche weiter.',
    cancel: 'Suche beenden',
    find: 'Live-Duell suchen',
    invite: 'Einladungslink erstellen',
    inviteReady: 'Einladung bereit',
    share: 'Link teilen oder kopieren',
    shareMessage: 'Harmonia-Duell: {{link}}\nEinladungscode: {{code}}',
    acceptTitle: 'Einladung annehmen',
    inviteCode: 'Einladungskennung',
    accept: 'Einladung annehmen',
    rules:
      'Drei Minuten, dieselben Aufgaben und 10–50 Punkte pro richtiger Antwort. Live-Gegner werden nach Duell-Rating gepaart. Einladungen und Ghosts sind ohne Rating und XP. Die Antwortprüfung erfolgt auf dem Server.',
  },
  exam: {
    title: 'Prüfungsmodus',
    entry: 'Simuliere eine Aufnahmeprüfung mit Musiktheorie und Gehörbildung.',
    open: 'Prüfungsvorlagen öffnen',
    intro:
      'Eigenständige Übungssimulation für die Studienvorbereitung. Die Aufgaben stammen aus Harmonia; Anforderungen und Bestehensgrenzen einzelner Hochschulen können abweichen. Während des Durchgangs gibt es keine Hinweise oder Lösungen. Übersprungene und unbeantwortete Aufgaben zählen null Punkte.',
    unavailable: 'Der Prüfungsmodus wird mit freigegebenen Lerninhalten verfügbar.',
    template_foundation: 'Grundlagen und Gehör',
    template_advanced: 'Vertiefte Studienvorbereitung',
    templateDetails: '{{count}} Aufgaben · {{minutes}} Minuten · {{points}} Punkte',
    start: 'Prüfung starten',
    remaining: 'Restzeit: {{time}}',
    noHints: 'Keine Hinweise und keine Sofortauswertung',
    submitEarly: 'Prüfung vorzeitig abgeben',
    confirmSubmit: 'Unbeantwortete Aufgaben erhalten null Punkte. Jetzt abgeben?',
    confirmYes: 'Jetzt abgeben',
    continue: 'Weiter bearbeiten',
    result: 'Prüfungsauswertung',
    end_completed: 'Alle Aufgaben wurden bearbeitet.',
    end_submitted: 'Du hast vorzeitig abgegeben.',
    end_timeout: 'Die Zeit ist abgelaufen.',
    end_skippedAural: 'Die Prüfung ist beendet. Übersprungene Hörfragen zählen null Punkte.',
    unanswered_one: '{{count}} Aufgabe blieb unbeantwortet und zählt null Punkte.',
    unanswered_other: '{{count}} Aufgaben blieben unbeantwortet und zählen null Punkte.',
    resultAnnouncement: 'Prüfung beendet. {{reason}} {{points}} von {{maximum}} Punkten.',
    timeWarning_5: 'Noch fünf Minuten.',
    timeWarning_1: 'Noch eine Minute.',
    leaveTitle: 'Prüfung abbrechen?',
    leaveHint:
      'Die Zeit läuft weiter. Ein abgebrochener Durchgang wird nicht gespeichert und kann nicht fortgesetzt werden.',
    leaveContinue: 'Hier weiter bearbeiten',
    leaveConfirm: 'Prüfung abbrechen und verlassen',
    points: '{{points}} von {{maximum}} Punkten',
    area_theory: 'Musiktheorie',
    area_aural: 'Gehörbildung',
    areaPoints: '{{points}}/{{maximum}} Punkte · {{correct}}/{{count}} richtig',
    recommendations: 'Passende Lektionen',
    noRecommendations: 'Alle Aufgaben waren richtig beantwortet.',
    openLesson: 'Lektion öffnen',
    lockedLesson: 'Im Lernpfad noch gesperrt',
    openPath: 'Lernpfad öffnen',
    newExam: 'Weitere Prüfung wählen',
  },
  rush: {
    title: 'Theorie-Rush',
    entry: 'Wie viele Aufgaben schaffst du? Spiele gegen die Zeit oder bis zum dritten Fehler.',
    open: 'Theorie-Rush öffnen',
    guest:
      'Melde dich an, um einen geprüften Lauf zu starten und in den Bestenlisten mitzuspielen. Ohne Konto kannst du die freien Übungen nutzen.',
    account: 'Zum Konto',
    mode_three: '3 Minuten',
    mode_five: '5 Minuten',
    mode_survival: 'Überleben',
    scope_day: 'Heute',
    scope_week: 'Diese Woche',
    scope_all: 'Allzeit',
    scope_friends: 'Freunde',
    rules:
      'Drei Fehler beenden jeden Lauf. Im Überlebensmodus gibt es kein Zeitlimit. Die Aufgaben werden schrittweise schwieriger und können auch Stoff aus späteren Kurseinheiten enthalten. Hinweise sind während des Laufs ausgeschaltet.',
    scoring:
      'Eine richtige Antwort gibt je nach Schwierigkeitsstufe 10 bis 50 Punkte. Ein abgeschlossener Lauf bringt 1 XP pro richtiger Antwort, höchstens 30 XP. Abgebrochene Läufe bringen keine XP. Rush schaltet keine Lektionen frei und vergibt keine Münzen oder Lerntage für die Serie.',
    running:
      'Du brauchst eine Internetverbindung. Die Zeit läuft beim Verlassen der Ansicht und bei Verbindungsabbrüchen weiter. Antworten zählen erst nach der Serverbestätigung.',
    loading: 'Laufdaten werden geladen …',
    source: 'Für Theorie-Rush sind noch keine fachlich freigegebenen Aufgaben verfügbar.',
    limit: 'Dein Tageskontingent ist aufgebraucht.',
    fast: 'Bitte warte kurz und prüfe deine Antwort erneut.',
    error:
      'Die Verbindung ist unterbrochen oder der Lauf wurde auf einem anderen Gerät fortgesetzt. Lade den bestätigten Stand neu.',
    reload: 'Bestätigten Stand laden',
    time: 'Verbleibende Zeit: {{time}}',
    noTimer: 'Ohne Zeitlimit · Ende nach drei Fehlern',
    score: '{{score}} Punkte · Fehler: {{mistakes}} von 3',
    question_one: 'Aufgabe {{count}} · Schwierigkeitsstufe {{difficulty}}',
    question_other: 'Aufgabe {{count}} · Schwierigkeitsstufe {{difficulty}}',
    progress: 'Fehler bis zum Laufende',
    showResult: 'Ergebnis ansehen',
    stop: 'Lauf beenden',
    abandon: 'Lauf abbrechen',
    abandonConfirm:
      'Diesen Lauf abbrechen? Er erscheint dann nicht in der Bestenliste, bringt keine XP und verbraucht weiterhin einen Start aus deinem Tageskontingent.',
    keepPlaying: 'Weiterspielen',
    result: 'Lauf bestätigt',
    abandoned: 'Lauf abgebrochen',
    resultScore: '{{score}} Punkte · {{correct}} richtig · {{mistakes}} Fehler',
    reward: '{{xp}} XP wurden gutgeschrieben.',
    noReward: 'Keine XP und kein Bestenlisteneintrag für diesen Abbruch.',
    allowance:
      'Starts heute: {{remaining}} von {{limit}} übrig. Neues Kontingent ab {{date}} (Tageswechsel um 00:00 UTC). Jeder gestartete Lauf zählt, auch bei Abbruch.',
    start: 'Lauf starten',
    upgrade: 'Abos ansehen',
    leaderboard: 'Bestenlisten',
    boardRules:
      'Je Spielmodus und Aufgabenbank zählt dein bester bestätigter Lauf. Tag und Woche wechseln um 00:00 UTC, die Woche beginnt montags. Bei Punktgleichheit entscheiden weniger Fehler, dann der frühere Abschluss. Andere Konten erscheinen ohne Namen oder Profilangaben.',
    friendsPending: 'Die Freundesbestenliste ist gerade nicht verfügbar.',
    friendsIntro:
      'Hier zählen dein bester Lauf und die besten Läufe beidseitig bestätigter Freundschaften. Blockierte oder entfernte Verbindungen zählen nicht.',
    empty: 'Für diese Auswahl gibt es noch keine bestätigten Läufe.',
    ownRank: 'Platz {{rank}} · Du · {{score}} Punkte',
    rank: 'Platz {{rank}} · Lernperson · {{score}} Punkte',
    back: 'Zurück zu den Übungen',
  },
  leagues: {
    globalPushTitle: 'Systemmitteilungen erlauben',
    globalPushBody:
      'Diese Erlaubnis gilt für Lern-Erinnerungen und Liga-Ergebnisse. Die Kategorien wählst du einzeln aus. Beim Ausschalten werden beide abgewählt. Änderungen im Konto brauchen eine Serverbestätigung.',
    title: 'Ligen',
    intro:
      'Lerne in deinem Tempo und sammle bestätigte XP in einer wöchentlichen Gruppe. Die Liga zeigt deine Aktivität, nicht dein musikalisches Können.',
    guestTitle: 'Gemeinsam lernen',
    guest:
      'Mit einem Konto kommst du bei deinen ersten bestätigten XP der Woche in eine Gruppe. Dein privater Profilname bleibt verborgen.',
    account: 'Anmelden oder Konto erstellen',
    loading: 'Liga wird geladen …',
    error:
      'Die Liga konnte nicht aktualisiert werden. Prüfe deine Verbindung und versuche es erneut.',
    stale:
      'Diese Rangliste stammt vom letzten Abruf. Bis zur nächsten Aktualisierung können sich die Plätze ändern.',
    refresh: 'Liga aktualisieren',
    empty:
      'Noch keine Gruppe in dieser Woche. Sobald neue Lektions-XP auf dem Server bestätigt sind, wirst du eingeteilt.',
    week: 'Woche vom {{start}} bis {{end}}',
    boundary: 'Wochenwechsel: Montag, 00:00 UTC. Bei dir endet diese Woche am {{date}}.',
    xpRule:
      'Es zählen nur XP, die der Server in dieser Woche bestätigt. Offline erspielte XP zählen in der Woche ihrer Übertragung. Frühere XP werden nicht nachgetragen.',
    group_one: '{{count}} Person in deiner Gruppe',
    group_other: '{{count}} Personen in deiner Gruppe',
    capacity: 'Bis zu {{count}} Personen pro Gruppe.',
    you: 'Du',
    alias: 'Lernperson {{number}}',
    row: 'Platz {{rank}} · {{name}} · {{xp}} XP',
    row_promoted: 'Voraussichtlicher Aufstiegsplatz',
    row_relegated: 'Voraussichtlicher Abstiegsplatz',
    row_stayed: 'Voraussichtlicher Ligaerhalt',
    forecast:
      'Die markierten Plätze sind vorläufig. Das Ergebnis steht erst nach dem Wochenwechsel fest.',
    rules:
      'Bei voller Gruppe steigen die besten {{count}} auf und die letzten {{count}} ab. In kleinen Gruppen betrifft das höchstens die Hälfte je Richtung. Bei gleicher XP-Zahl zählt die frühere Aufnahme in die Gruppe. In pp ist kein Abstieg, in fff kein Aufstieg möglich.',
    privacy:
      'Andere sehen nur deine Kennung innerhalb dieser Gruppe und deine Wochen-XP. Die Kennung gilt nur für diese Gruppe. Es werden keine Namen, E-Mail-Adressen oder Kontokennungen angezeigt.',
    resultTitle: 'Dein Wochenresultat',
    result: 'Woche ab {{date}}: Platz {{rank}} mit {{xp}} XP.',
    result_promoted: 'Aufgestiegen in die Liga {{level}}.',
    result_relegated: 'Nächste Woche lernst du in der Liga {{level}}.',
    result_stayed: 'Du bleibst in der Liga {{level}}.',
    ack: 'Als gelesen markieren',
    actionError: 'Die Änderung konnte nicht gespeichert werden. Versuche es erneut.',
    levelsTitle: 'Die sieben Ligen',
    levelsBody:
      'Die Namen stammen von musikalischen Dynamikangaben. Sie bezeichnen hier die Liga, nicht die Lautstärke beim Üben.',
    pushTitle: 'Liga-Ergebnisse als Mitteilung',
    pushBody:
      'Auf Wunsch erhältst du eine Mitteilung zum Wochenresultat. Lern-Erinnerungen lassen sich getrennt einstellen. Insgesamt höchstens ein Zustellversuch pro Tag, zur gewählten Erinnerungszeit und außerhalb der Ruhezeit von 21 bis 8 Uhr.',
    pushWeb:
      'Im Web erscheinen Ergebnisse hier in der App. Systemmitteilungen sind für die iOS- und Android-App vorgesehen.',
    pushUnavailable:
      'Systemmitteilungen benötigen einen dauerhaften Speicher und ein eingerichtetes Mobilgerät. Dein Ergebnis bleibt hier verfügbar.',
    pushPermission:
      'Mitteilungen sind in den Systemeinstellungen gesperrt. Erlaube sie dort und versuche es erneut.',
    pushPending:
      'Liga-Mitteilungen sind ausgewählt. Die Serverregistrierung ist noch nicht bestätigt; dein Ergebnis findest du jederzeit hier.',
    pushRegistered: 'Liga-Mitteilungen sind auf diesem Gerät eingerichtet.',
    level_pp: 'pp · $t(glossary:dynamicPianissimo)',
    meaning_pp: 'sehr leise',
    level_p: 'p · $t(glossary:dynamicPiano)',
    meaning_p: 'leise',
    level_mp: 'mp · $t(glossary:dynamicMezzoPiano)',
    meaning_mp: 'mäßig leise',
    level_mf: 'mf · $t(glossary:dynamicMezzoForte)',
    meaning_mf: 'mäßig laut',
    level_f: 'f · $t(glossary:dynamicForte)',
    meaning_f: 'laut',
    level_ff: 'ff · $t(glossary:dynamicFortissimo)',
    meaning_ff: 'sehr laut',
    level_fff: 'fff · $t(glossary:dynamicFortississimo)',
    meaning_fff: 'äußerst laut',
  },

  review: {
    title: 'Wiederholen',
    intro: 'Frische Gelerntes auf. Deine Antworten bestimmen, wann es wieder dran ist.',
    empty: 'Gerade ist nichts fällig. Lerne weiter oder schau später wieder vorbei.',
    new: 'Nach deinen ersten Lektionen findest du hier gelernte Fähigkeiten und Wissenskarten.',
    due: '$t(review.dueSkills, {"count": {{skills}}}) und $t(review.dueCards, {"count": {{cards}}}) sind fällig.',
    dueSkills_one: '{{count}} Fähigkeit',
    dueSkills_other: '{{count}} Fähigkeiten',
    dueCards_one: '{{count}} Wissenskarte',
    dueCards_other: '{{count}} Wissenskarten',
    open: 'Wiederholungen ansehen',
    skillsTitle: 'Fällige Fähigkeiten',
    skillsStart: 'Fähigkeiten wiederholen',
    cardsTitle: 'Fällige Wissenskarten',
    cardOpen: 'Karte öffnen: {{title}}',
    recall:
      'Was weißt du noch darüber? Erinnere dich zuerst selbst. Decke dann die Erklärung und das Beispiel auf.',
    reveal: 'Erklärung aufdecken',
    rate: 'Wie gut konntest du dich erinnern?',
    again: 'Nicht gewusst',
    hard: 'Mit Mühe gewusst',
    good: 'Gewusst',
    easy: 'Mühelos gewusst',
    ratingHelp:
      'Bewerte, wie gut du dich erinnert hast, bevor du die Erklärung gesehen hast. „Nicht gewusst“ bedeutet, dass du die Erklärung gebraucht hast.',
    scheduled: 'Nächste Wiederholung: {{date}}',
    saving: 'Wiederholung wird gespeichert …',
    saved: 'Wiederholung gespeichert.',
    error: 'Speichern hat nicht geklappt. Deine Einschätzung bleibt zum erneuten Versuch erhalten.',
    retry: 'Erneut speichern',
    back: 'Zu den Wiederholungen',
    next: 'Nächste Fälligkeit: {{date}}',
    noRewards:
      'Diese Wiederholung frischt Gelerntes auf. Sie schaltet keine Lektionen frei und vergibt keine XP oder Münzen.',
    backlog:
      'Es sind viele Wiederholungen offen. Schon eine kurze Runde hilft. Du kannst jederzeit pausieren.',
    memory:
      'Du lernst ohne dauerhaften Speicher. Deine Wiederholungen gelten nur für diese Sitzung.',
  },
  adaptive: {
    weaknessTitle: 'Schwächen trainieren',
    weaknessIntro:
      'Zehn Aufgaben aus bis zu drei Fähigkeiten, die dir im bereits erreichten Stoff noch schwerfallen. Ohne Kursfreischaltung, XP oder Münzen.',
    weaknessEmpty:
      'Beantworte zunächst einige Aufgaben selbstständig. Sobald zu einer erreichten Fähigkeit mindestens zwei Antworten vorliegen, kannst du hier gezielt üben.',
    weaknessStart: 'Gezielt üben',
    lessonHint:
      'Reihenfolge und Wiederholungen richten sich nach deinem bisherigen Lernen. Alle neuen Aufgaben bleiben enthalten; passende Fragen zielen auf etwa 70–85 % Erfolg.',
    practiceLabel: 'Gezieltes Üben',
    returnPractice: 'Zurück zum Üben',
    focusSkills: 'Dein Fokus: {{skills}}',
    practiceResult:
      'Deine selbstständig beantworteten Aufgaben helfen bei der nächsten Auswahl. Dieser Übungsdurchgang schaltet keine Lektionen frei und vergibt keine XP oder Münzen.',
  },
  privacy: {
    title: 'Datenschutz und Daten',
    body: 'Du entscheidest über optionale Verarbeitung. Dein Lernen funktioniert auch ohne Statistik und Marketing.',
    retentionTitle: 'Wie lange bleiben deine Lerndaten?',
    retention:
      'Einzelantworten und detaillierte Lernnachweise werden zwölf Monate aufbewahrt. Danach bleiben knappe, bestätigte Fortschritte und Lernstatistiken erhalten.',
    choices: 'Deine Einwilligungen',
    analytics: 'Nutzungsstatistik',
    inactive: 'Nicht aktiv',
    marketing: 'Marketing-E-Mails',
    optionalLater:
      'Marketing ist derzeit nicht aktiv. Jede optionale Verarbeitung braucht eine eigene Information und deine ausdrückliche Wahl.',
    pending:
      'Deine Änderung muss noch gesichert und gegebenenfalls mit dem Konto synchronisiert werden. Ein Widerruf stoppt die lokale Verarbeitung sofort.',
    retry: 'Änderungen erneut synchronisieren',
    exportTitle: 'Deine Daten mitnehmen',
    exportBody:
      'Lade deine Konto- und lokalen Lerndaten als JSON-Datei herunter. Zugangsschlüssel und Sitzungstoken werden nicht exportiert. Bewahre die Datei privat auf.',
    guestBody:
      'Als Gast kannst du deine auf diesem Gerät gespeicherten Lerndaten herunterladen. Es gibt kein Konto auf dem Server.',
    export: 'Daten herunterladen',
    exported: 'Die Datei wurde zum Speichern oder Teilen übergeben.',
    deleteTitle: 'Konto löschen',
    deleteBody:
      'Die Kontolöschung entfernt dein Konto und seine Lerndaten. Laufende Store- oder Web-Abos werden dadurch nicht gekündigt. Prüfe zuerst deine Abo-Verwaltung.',
    delete: 'Kontolöschung öffnen',
    confirmTitle: 'Konto dauerhaft löschen?',
    confirmBody:
      'Dieser Schritt löscht dein Konto, Antworten, Fortschritt und Tutor-Verlauf. Die Daten dieses Kontos werden auch von diesem Gerät entfernt. Ein bereits gespeicherter Export bleibt in deiner Verantwortung.',
    ackSubscriptions: 'Ich weiß, dass die Kontolöschung laufende Abos nicht kündigt.',
    confirmDelete: 'Konto endgültig löschen',
    cancel: 'Abbrechen',
    deleted: 'Konto und eigene Lerndaten gelöscht',
    externalPending:
      'Löschaufträge bei externen Anbietern sind noch in Bearbeitung. Der Beleg bestätigt die Kontolöschung, noch keine vollständige Löschung bei diesen Anbietern.',
    externalCompleted:
      'Die dokumentierten Anbieteraufträge sind abgeschlossen. Du kannst den Löschbeleg speichern.',
    saveReceipt: 'Löschbeleg speichern',
    working: 'Deine Anfrage wird bearbeitet …',
    error_consent: 'Deine Wahl konnte noch nicht gespeichert werden. Bitte versuche es erneut.',
    error_export:
      'Der Export konnte nicht vollständig erstellt werden. Prüfe deine Verbindung und versuche es erneut.',
    error_delete:
      'Die Löschung konnte nicht vollständig bestätigt werden. Versuche es erneut; dieselbe Anfrage wird weiterbearbeitet.',
    error_reauth: 'Bitte bestätige deine E-Mail-Anmeldung erneut, bevor du dein Konto löschst.',
  },
  legal: {
    title: 'Rechtliche Informationen',
    preparation:
      'Harmonia ist noch in Vorbereitung. Geprüfte Rechtstexte und Betreiberangaben müssen vor Veröffentlichung bereitstehen.',
    withdrawal: 'Widerrufsinformationen',
    aiTitle: 'Über den KI-Tutor',
    aiBody:
      'Der Tutor ist eine KI und kann Fehler machen. Eine getrennte Musiktheorie-Engine bewertet die Aufgaben. KI-Antworten ersetzen keine fachliche Prüfung.',
  },

  paywall: {
    title: 'Abos vergleichen',
    energy: 'Lernenergie',
    unlimited: 'Unbegrenzte Lernenergie',
    remaining: '{{count}} von {{total}} Energiepunkten',
    refill: 'Ein neuer Energiepunkt alle {{minutes}} Minuten, bis der Vorrat voll ist.',
    nextEnergy: 'Nächster Energiepunkt um {{time}}.',
    reservation:
      'Ein neuer Durchgang reserviert einen Punkt pro Aufgabe. Hinweise und Fehlerwiederholungen darin brauchen keine weitere Energie.',
    loading: 'Zugang wird geprüft …',
    accessError:
      'Der Zugang konnte nicht geprüft werden. Prüfe deine Verbindung und versuche den Start erneut.',
    compare: 'Gratis, Premium und Max',
    reason_settings: 'Wähle das Angebot, das zu deinem Lernen passt.',
    reason_onboarding: 'Du kannst gratis beginnen und diese Auswahl überspringen.',
    reason_limit:
      'Für diesen neuen Durchgang reicht deine Energie noch nicht. Warte auf die Auffüllung oder sieh dir Premium an.',
    reason_premium: 'Diese Kursstufe gehört zu Premium.',
    reason_tutor: 'Der KI-Tutor gehört zu Premium und Max und hat ein eigenes Kontingent.',
    skip: 'Gratis weiterlernen',
    close: 'Zurück zum Lernen',
    course_free: 'Veröffentlichte Grundlagen bis Stufe 2',
    course_premium: 'Alle veröffentlichten Kursstufen',
    course_max: 'Alle veröffentlichten Kursstufen',
    energyLimited: 'Lernenergie füllt sich wieder auf',
    tutor_free: 'Kein KI-Tutor',
    tutor_premium: 'KI-Tutor mit eigenem Kontingent',
    tutor_max: 'KI-Tutor mit erweitertem Kontingent',
    maxPreparing:
      'Max ist in Vorbereitung. Weitere Funktionen werden erst angeboten, wenn sie verfügbar sind.',
    learningRule:
      'Voraussetzungen und die Bestehensschwelle bleiben für alle gleich. Ein Abo überspringt keine Lernschritte.',
    monthly: 'Monatlich',
    annual: 'Jährlich',
    unavailable: 'Abos sind derzeit nicht zum Kauf freigegeben. Du kannst gratis weiterlernen.',
    purchaseTerms:
      'Die angezeigten Preise kommen aus dem Store. Vor dem Kauf gelten dessen Bestätigung und die verlinkten Vertragsbedingungen. Keine kostenlose Probezeit wird zugesagt.',
    terms: 'Vertragsbedingungen',
    privacy: 'Datenschutz',
    imprint: 'Impressum',
  },
  cancellation: {
    title: 'Verträge hier kündigen',
    body: 'Hier kannst du ohne Anmeldung eine Kündigung für dein Web-Abo erklären. Abos aus dem Apple App Store oder Google Play verwaltest du im jeweiligen Store.',
    name: 'Vollständiger Name',
    email: 'E-Mail-Adresse des Vertrags',
    contract: 'Vertragskennung (optional)',
    product: 'Welches Web-Abo?',
    ordinary: 'Ordentliche Kündigung',
    extraordinary: 'Außerordentliche Kündigung',
    reason: 'Kündigungsgrund',
    date: 'Gewünschter Beendigungszeitpunkt',
    dateBody: 'Wähle den frühestmöglichen Zeitpunkt oder gib ein Datum als JJJJ-MM-TT ein.',
    earliest: 'Frühestmöglich',
    continue: 'Kündigung prüfen',
    review: 'Kündigung überprüfen',
    reviewBody:
      'Mit dem nächsten Button sendest du diese Kündigungserklärung. Eine bestätigte Vertragsbeendigung wird gesondert bearbeitet.',
    submit: 'Jetzt kündigen',
    edit: 'Angaben bearbeiten',
    received: 'Kündigungserklärung eingegangen',
    receipt: 'Eingangsbeleg {{id}} · {{time}}',
    receivedBody:
      'Die Erklärung ist gespeichert. Vertragszuordnung, Beendigungsdatum und Bestätigung sind noch in Bearbeitung. Dies bestätigt den Eingang, noch keine abgeschlossene Vertragsbeendigung.',
    download: 'Eingangsbeleg speichern',
    error_schema:
      'Bitte prüfe Name, E-Mail-Adresse, Datum und bei außerordentlicher Kündigung den Grund.',
    error_send:
      'Die Erklärung konnte nicht bestätigt werden. Versuche es erneut; dieselbe Erklärung wird nicht doppelt gespeichert.',
    sending: 'Kündigungserklärung wird gesendet …',
  },

  billing: {
    tier_free: 'Gratis',
    tier_premium: 'Premium',
    tier_max: 'Max',
    title: 'Abonnement',
    accountBound: 'Dein Abo gehört zu deinem Harmonia-Konto und gilt auf deinen Geräten.',
    signInBody: 'Melde dich vor einem Kauf oder einer Wiederherstellung mit deinem Konto an.',
    signIn: 'Zum Konto',
    status: 'Dein Zugang: {{tier}}',
    ends: 'Gekündigt. Zugang bis {{date}}.',
    validUntil: 'Zugang bis {{date}}.',
    billingIssue: 'Es gibt ein Zahlungsproblem. Prüfe die Zahlung in der Abo-Verwaltung.',
    simulation: 'Lokaler Abo-Test. Es erfolgt keine Zahlung.',
    loading: 'Abonnement wird geladen …',
    unconfigured: 'Abonnements sind hier noch nicht für Käufe eingerichtet.',
    error: 'Der Abo-Status konnte nicht geladen werden. Versuche es erneut.',
    offers: 'Verfügbare Abonnements',
    noOffers: 'Zurzeit ist kein passendes Angebot verfügbar.',
    monthly: '{{price}} pro Monat',
    annual: '{{price}} pro Jahr',
    renewal:
      'Verlängert sich automatisch zum angezeigten Preis, bis du kündigst. Die Kaufbestätigung zeigt die verbindlichen Bedingungen.',
    buyMonthly: '{{tier}} monatlich abonnieren',
    buyAnnual: '{{tier}} jährlich abonnieren',
    manageExisting:
      'Verwalte dein bestehendes Abo beim Anbieter. So vermeidest du ein zweites Abo.',
    purchased: 'Dein Abo ist freigeschaltet.',
    pending:
      'Der Kauf wurde abgeschlossen. Die Freischaltung wird noch bestätigt. Aktualisiere den Status; kaufe nicht erneut.',
    restored: 'Dein Abo wurde wiederhergestellt.',
    none: 'Für dieses Konto wurde kein aktives Abo gefunden.',
    canceled: 'Kauf abgebrochen.',
    storePending: 'Die Zahlung wartet auf Bestätigung durch den Anbieter. Kaufe nicht erneut.',
    restore: 'Käufe wiederherstellen',
    restoreBody:
      'Verwende das Harmonia-Konto des ursprünglichen Kaufs. Im Web wird dein Konto erneut geprüft; auf iOS und Android zusätzlich dein Store-Konto.',
    refresh: 'Status aktualisieren',
    manage: 'Abo verwalten oder kündigen',
    linkError: 'Die Abo-Verwaltung konnte nicht geöffnet werden. Versuche es erneut.',
  },
  tutor: {
    title: 'KI-Tutor',
    disclosure:
      'Du sprichst mit einer KI. Sie kann Fehler machen. Vergleiche Erklärungen mit den Quellen und melde unpassende Antworten.',
    premium: 'Der KI-Tutor gehört zu Premium und Max. Freies Üben bleibt verfügbar.',
    guest: 'Melde dich mit deinem Konto an, um den Tutor und deinen privaten Verlauf zu verwenden.',
    signIn: 'Zum Konto',
    practice: 'Frei üben',
    newChat: 'Neue Frage beginnen',
    history: 'Gespräche ansehen',
    hideHistory: 'Gespräche schließen',
    emptyHistory: 'Noch keine gespeicherten Gespräche.',
    conversation: 'Gespräch vom {{date}} · {{language}}',
    openConversation: 'Gespräch öffnen',
    moreConversations: 'Weitere Gespräche laden',
    older: 'Ältere Nachrichten laden',
    historyLimit:
      'Bis zu 1000 Nachrichten werden hier angezeigt. Beginne für weitere Fragen ein neues Gespräch.',
    delete: 'Gespräch löschen',
    deleteTitle: 'Dieses Gespräch löschen?',
    deleteBody:
      'Alle Nachrichten, Quellen und Meldungen zu diesem Gespräch werden dauerhaft gelöscht. Dein Tageskontingent wird dadurch nicht zurückgesetzt.',
    confirmDelete: 'Dauerhaft löschen',
    cancel: 'Abbrechen',
    deleted: 'Gespräch gelöscht.',
    questionLabel: 'Deine Musikfrage',
    placeholder: 'Was möchtest du zur Musik wissen?',
    send: 'Frage senden',
    stop: 'Antwort stoppen',
    sending: 'Der KI-Tutor antwortet …',
    you: 'Du',
    assistant: 'KI-Tutor',
    simulation: 'Lokaler Test · Diese Antwort ist simuliert.',
    language: 'Antwortsprache: {{language}}',
    task: 'Deine Aufgabe',
    why: 'Warum? Mit KI erklären',
    aiHint: 'KI-Hinweis {{level}} ergänzen',
    aiSolution: 'Lösung mit KI erklären',
    requestExplain:
      'Bitte erkläre meine bewertete Antwort und zeige ein passendes, geprüftes Beispiel, wenn es der Erklärung hilft.',
    requestHint:
      'Bitte ergänze den aktuellen Hinweis mit einem Denkanstoß. Verrate die Lösung nicht.',
    requestSolution:
      'Bitte erkläre die Lösung dieser Aufgabe direkt. Verwende ein geprüftes Beispiel, wenn es hilft.',
    taskSend_explain: 'Erklärung anfordern',
    taskSend_hint: 'KI-Hinweis anfordern',
    taskSend_solution: 'Lösung erklären lassen',
    continue: 'Weitere Frage zur Erklärung',
    source: 'Quelle {{number}}: {{title}} – {{heading}}',
    sources: 'Quellen dieser Antwort',
    previewSource: 'Interne Quelle · fachliche Freigabe steht aus.',
    noSource: 'Diese Antwort hat keinen geprüften Quellenverweis aus der Harmonia-Bibliothek.',
    invalidSource: 'Ein Quellenverweis konnte nicht geprüft werden und wird nicht verlinkt.',
    example: 'Geprüftes Notenbeispiel',
    invalidExample: 'Ein Beispiel konnte nicht geprüft werden und wird nicht angezeigt.',
    report: 'KI-Antwort melden',
    reportTitle: 'Diese KI-Antwort melden',
    reportLabel: 'Was sollte verbessert werden?',
    reportBody:
      'Die Meldung wird deinem Konto und genau dieser gespeicherten Antwort zugeordnet. Bitte keine persönlichen Angaben eintragen.',
    reportSent: 'Deine Meldung wurde gespeichert. Danke.',
    reportError:
      'Die Meldung ist noch nicht bestätigt. Sende sie erneut mit denselben Angaben oder brich ab.',
    reportSubmit: 'Meldung senden',
    reportSending: 'Meldung wird gesendet …',
    report_incorrect: 'Fachlich falsch',
    report_unclear: 'Unverständlich',
    report_inappropriate: 'Unpassend',
    report_technical: 'Technischer Fehler',
    reportCategoryOther: 'Anderes',
    remaining: 'Heute noch {{remaining}} von {{limit}} Fragen',
    reset: 'Neues Tageskontingent: {{date}}',
    refresh: 'Status und Kontingent aktualisieren',
    accountLoading: 'Kontingent wird geladen …',
    accountError: 'Dein Kontingent konnte nicht geladen werden.',
    retry: 'Dieselbe Antwort erneut abrufen',
    retryHint:
      'Die ursprüngliche Anfrage bleibt erhalten. Erneutes Abrufen startet keine zweite kostenpflichtige Antwort.',
    status_complete: 'Antwort abgeschlossen.',
    status_refused: 'Der Tutor hat diese Anfrage abgelehnt.',
    status_partial: 'Diese Antwort ist unvollständig.',
    status_failed: 'Die Antwort konnte nicht erstellt werden.',
    status_cancelled: 'Die Antwort wurde gestoppt.',
    suggestionIntervals: 'Wie bestimme ich ein Intervall?',
    suggestionRhythm: 'Wie unterscheiden sich Puls und Tempo?',
    suggestionSources: 'Wie prüfe ich eine musikalische Quelle?',
    error_auth: 'Bitte melde dich erneut an.',
    error_unconfigured: 'Der Kontodienst ist noch nicht verfügbar.',
    error_unavailable: 'Der KI-Tutor ist derzeit nicht verfügbar. Du kannst weiter üben.',
    error_subscription:
      'Für neue Tutor-Antworten brauchst du Premium oder Max. Deine bisherigen Gespräche bleiben lesbar.',
    error_quota: 'Dein Tageskontingent ist aufgebraucht. Du kannst morgen wieder fragen.',
    error_rate: 'Bitte warte einen Moment, bevor du erneut fragst.',
    error_budget: 'Heute können derzeit keine weiteren Tutor-Antworten erstellt werden.',
    error_busy: 'Eine Antwort läuft noch. Warte kurz und rufe dieselbe Anfrage erneut ab.',
    error_context: 'Der Gesprächskontext passt nicht mehr. Beginne eine neue Frage.',
    error_deleted: 'Dieses Gespräch wurde gelöscht. Beginne eine neue Frage.',
    error_content:
      'Die Aufgabe ist in dieser Version nicht mehr verfügbar. Öffne sie erneut aus dem Lernpfad.',
    error_network:
      'Die Verbindung ist unterbrochen. Deine bisher empfangene Antwort bleibt sichtbar.',
    error_protocol:
      'Die Antwort konnte nicht vollständig gelesen werden. Rufe dieselbe Anfrage erneut ab.',
    error_cancelled:
      'Du hast die Antwort gestoppt. Ein bereits begonnener Aufruf kann dein Kontingent verbraucht haben.',
    error_history:
      'Die Antwort ist abgeschlossen, aber der gespeicherte Verlauf konnte nicht geladen werden. Rufe dieselbe Anfrage erneut ab.',
    error_storage: 'Der Abschluss wurde nicht bestätigt. Rufe dieselbe Anfrage erneut ab.',
  },
  article: {
    title: 'Bibliotheksquelle',
    loading: 'Quelle wird geprüft …',
    unavailable:
      'Diese Quelle ist in dieser App-Version nicht verfügbar. Der Artikel wurde geändert, zurückgezogen oder noch nicht veröffentlicht.',
    retry: 'Quelle erneut prüfen',
    back: 'Zurück',
    draft: 'Interne Vorschau · Dieser Artikel wartet noch auf die fachliche Freigabe.',
    version: 'Artikelversion {{version}}',
    sourceLanguage: 'Sprache der zitierten Quelle: {{language}}',
    citedSection: 'Zitierter Abschnitt',
    sections: 'Abschnitte dieses Artikels',
  },
  motivation: {
    writeError:
      'Die Änderung wurde nicht gespeichert. Dein bisheriger Stand bleibt erhalten; bitte versuche die Änderung erneut.',
    details: 'Serie und Streak-Schutz ansehen',
    purchaseRejected:
      'Ein Schutzkauf wurde abgelehnt und nicht abgebucht. Prüfe nach der Synchronisation Guthaben und Vorrat.',
    openSettings: 'Geräteeinstellungen öffnen',
    coinRules:
      '{{first}} Münzen für eine erstmals bestandene Lektion, {{repeat}} für eine bestandene Wiederholung.',
    dailyTitle: 'Dein Tagesziel',
    dailyProgress: '{{xp}} von {{goal}} XP',
    goalReached: 'Tagesziel erreicht. Gut geübt!',
    goalRemaining: 'Noch {{xp}} XP bis zum Tagesziel.',
    series_one: '{{count}} Lerntag in Folge',
    series_other: '{{count}} Lerntage in Folge',
    longest_one: 'Längste Serie: {{count}} Lerntag',
    longest_other: 'Längste Serie: {{count}} Lerntage',
    stock: 'Streak-Schutz: {{available}} von 2 auf Vorrat',
    nextFreeze_one: 'Noch {{count}} erfolgreicher Lerntag bis zum nächsten kostenlosen Schutz.',
    nextFreeze_other: 'Noch {{count}} erfolgreiche Lerntage bis zum nächsten kostenlosen Schutz.',
    coins_one: '{{count}} Münze',
    coins_other: '{{count}} Münzen',
    buyFreeze: 'Streak-Schutz für {{cost}} Münzen kaufen',
    buyError:
      'Der Schutz konnte nicht gekauft werden. Prüfe dein Guthaben und den verfügbaren Vorrat.',
    estimated:
      'Auf diesem Gerät berechnet. Das Konto bestätigt XP und Münzen nach der Synchronisation.',
    travel: 'Deine Serie berücksichtigt Zeitzonenwechsel auf Reisen.',
    loadError:
      'Dein Motivationsstand konnte nicht geladen werden. Gespeicherte Daten bleiben erhalten.',
    syncError: 'Noch nicht synchronisiert. Deine Lernnachweise und Käufe bleiben auf diesem Gerät.',
    retry: 'Erneut synchronisieren',
    remindersTitle: 'Lernerinnerungen',
    remindersBody:
      'Eine freundliche Erinnerung zur gewählten Ortszeit, wenn du heute noch nicht geübt hast. Höchstens eine pro Tag, mit Ruhezeit von 21 bis 8 Uhr.',
    remindersEnabled: 'Lernerinnerungen aktivieren',
    allowNotifications: 'Benachrichtigungen erlauben',
    webReminders: 'Web-Push folgt später. Du kannst hier deine gewünschte Uhrzeit speichern.',
    memoryReminders: 'In einer vorübergehenden Sitzung werden keine Erinnerungen eingerichtet.',
    permissionDenied:
      'Benachrichtigungen sind im Betriebssystem ausgeschaltet. Du kannst sie in den Geräteeinstellungen erlauben.',
    localReminder:
      'Lokale Erinnerungen sind auf diesem Gerät geplant. Sie funktionieren auch ohne Konto.',
    remoteReminder: 'Push-Erinnerungen sind für dein Konto aktiviert.',
    notificationError:
      'Die Erinnerungen konnten nicht eingerichtet werden. Du kannst weiterlernen und es später erneut versuchen.',
    retirePending: 'Die Deaktivierung alter Push-Erinnerungen wartet auf eine Verbindung.',
    notificationTitle: 'Zeit für ein bisschen Musik',
    notificationBody: 'Eine kleine Übung passt in deinen Tag. Harmonia wartet auf dich.',
    notificationChannel: 'Lernerinnerungen',
    coinsEarned_one: '+{{count}} Münze',
    coinsEarned_other: '+{{count}} Münzen',
    protectionHint:
      'Schutz bewahrt eine bestehende Serie an einem verpassten Tag. Er vergibt keine XP und zählt nicht als Lerntag.',
    coinHint:
      'Bestandene Lektionen verdienen Münzen. Ein Schutzkauf wird einmal gebucht; mehr als zwei Schutzvorräte sind nicht möglich.',
  },
  report: {
    title: 'Fehler melden',
    queueTitle: 'Inhaltsmeldungen',
    intro:
      'Was stimmt an dieser Aufgabe nicht? Wähle einen Bereich und beschreibe den Fehler, wenn du möchtest.',
    category: 'Bereich',
    'category-question': 'Frage',
    'category-answer': 'Antwort oder Bewertung',
    'category-feedback': 'Erklärung oder Hinweis',
    'category-notation': 'Notenbild',
    'category-audio': 'Hörbeispiel',
    'category-translation': 'Sprache oder Übersetzung',
    'category-other': 'Etwas anderes',
    message: 'Beschreibung (optional, bis zu 2000 Zeichen)',
    placeholder: 'Was hast du beobachtet? Was sollte stattdessen passieren?',
    privacy:
      'Die Meldung enthält die Aufgabe, ihre Variante, deine Eingabe und Hinweise. Bei Einstufungsfragen gehört der bisherige Testverlauf dazu. Bitte keine persönlichen Daten eingeben. Sie verändert deinen Lernfortschritt nicht.',
    guest:
      'Als Gast speicherst du die Meldung auf diesem Gerät. Bei deiner nächsten Anmeldung wird sie dem angemeldeten Konto zugeordnet und gesendet.',
    account:
      'Die Meldung bleibt auf diesem Gerät, bis sie gesendet wurde. Bei Netzproblemen versuchen wir es erneut.',
    memory:
      'Diese Sitzung speichert nur vorübergehend. Die Meldung geht beim Schließen verloren und wird nicht gesendet.',
    submit: 'Meldung speichern',
    saving: 'Meldung wird gespeichert …',
    saved: 'Meldung gespeichert',
    saveError:
      'Die Meldung konnte nicht gespeichert werden. Dein Text bleibt hier. Bitte versuche es erneut.',
    loadError:
      'Der Meldungsspeicher konnte nicht geladen werden. Gespeicherte Meldungen werden nicht überschrieben.',
    retry: 'Erneut versuchen',
    sending: 'Meldungen werden gesendet …',
    networkError:
      'Noch nicht gesendet. Deine Meldungen bleiben gespeichert. Bitte versuche es später erneut.',
    unavailableSource:
      'Eine Aufgabenquelle ist nicht mehr verfügbar. Die betroffene Meldung bleibt auf diesem Gerät und kann erneut gesendet werden.',
    queue: '{{pending}} ausstehend · {{sent}} gesendet',
    noDraft: 'Öffne „Fehler melden“ direkt bei einer Aufgabe, damit wir ihren Kontext kennen.',
    cancel: 'Zurück ohne Speichern',
    back: 'Zur Aufgabe zurück',
  },
  content: contentMessages.de,
  flow: {
    mix: '{{newCount}} Aufgaben zum aktuellen Stoff und {{repeatCount}} Wiederholungsaufgaben.',
    newMaterial: 'Aktueller Stoff',
    repetition: 'Bekanntes festigen',
    errorPractice: 'Fehler in neuer Variante üben',
    resumeTitle: 'Deine Lektion wartet',
    resumeHint:
      'Einführung, Antworten und Hinweise sind gespeichert. Du machst an derselben Stelle weiter.',
    resume: 'Lektion fortsetzen',
    newAttempt: 'Neuen Durchgang beginnen',
    changed: 'Die Aufgaben wurden aktualisiert',
    changedHint:
      'Der gespeicherte Durchgang passt nicht mehr zu den aktuellen Aufgaben. Beginne mit der neuen Fassung.',
    pauseTitle: 'Lektion pausieren?',
    pauseHint:
      'Du kannst diesen Durchgang später fortsetzen. Verwirfst du ihn, werden keine XP und kein Fortschritt vergeben.',
    continueHere: 'Hier weiterlernen',
    pauseLeave: 'Speichern und zurück zum Lernpfad',
    discard: 'Durchgang verwerfen',
    pause: 'Pausieren oder abbrechen',
    saveError:
      'Dein aktueller Stand konnte nicht gespeichert werden. Versuche es erneut, bevor du gehst.',
    saved: 'Dein aktueller Stand ist auf diesem Gerät gespeichert.',
    xp_one: '+{{count}} XP',
    xp_other: '+{{count}} XP',
    streak_one: '{{count}} Tag Lernserie',
    streak_other: '{{count}} Tage Lernserie',
    localReward: 'Lokal berechnet. Im Konto bestätigt der Server die XP nach der Synchronisierung.',
  },
  placement: {
    title: 'Einstufungstest',
    open: 'Einstufung ansehen',
    offer: 'Finde einen passenden Einstieg. Du kannst den Test jederzeit machen oder wiederholen.',
    requested: 'Dein Test ist bereit. Finde jetzt deinen Startpunkt.',
    unavailable:
      'Der Einstufungstest braucht fachlich freigegebene Kursaufgaben. Für diese App-Version sind noch keine verfügbar. Du kannst inzwischen frei üben.',
    intro:
      '15–25 Aufgaben prüfen die wichtigsten Fähigkeiten aus Stufe 1–2. Die Schwierigkeit passt sich in jedem Bereich an deine Antworten an.',
    rules:
      'Keine Zeitbegrenzung. Du kannst pausieren oder früher beenden. Hinweise helfen dir, zählen aber nicht als selbstständig gelöste Aufgaben. Hörfragen kannst du ohne Nachteil auslassen. Der Test vergibt keine XP.',
    start: 'Test beginnen',
    restart: 'Mit den aktuellen Aufgaben neu starten',
    retake: 'Einstufungstest wiederholen',
    resume: 'Test fortsetzen',
    paused: 'Dein begonnener Test ist gespeichert. Setze ihn an derselben Stelle fort.',
    savedResult: 'Deine letzte Einstufung ist gespeichert. Ergebnisse ansehen oder erneut testen.',
    viewResult: 'Ergebnis ansehen',
    progress: 'Aufgabe {{current}} · höchstens {{max}}',
    progressLabel: 'Fortschritt des Einstufungstests',
    hearingPaused:
      'Hörfragen sind ausgelassen. Dafür wird kein Fehler und kein nachgewiesenes Hörniveau eingetragen.',
    pause: 'Pausieren und zurück',
    pauseHint:
      'Zurückgehen pausiert den Test. Beim Fortsetzen bleibt auch eine bereits geprüfte Antwort erhalten.',
    finishEarly: 'Test jetzt beenden',
    close: 'Zurück zum Lernbereich',
    discard: 'Begonnenen Test verwerfen',
    changed:
      'Die Aufgaben oder der gespeicherte Verlauf passen nicht mehr zu dieser App-Version. Starte einen neuen Test; deine Lektionen bleiben erhalten.',
    loadError:
      'Dein Test konnte nicht geladen werden. Versuche es erneut. Gespeicherte Daten werden nicht überschrieben.',
    saving: 'Dein Test wird gespeichert …',
    saveError:
      'Dein Test ist noch nicht gespeichert. Versuche es erneut, bevor du die App schließt.',
    resultTitle: 'Dein Einstieg',
    resultBody:
      'Deine Einstufung gilt getrennt für jeden Bereich. Wähle einen empfohlenen Einstieg oder wiederhole die Grundlagen freiwillig.',
    partialTitle: 'Vorläufiges Ergebnis',
    partialBody:
      'Du hast den Test früher beendet. Diese Stichprobe reicht nicht für das Überspringen von Einheiten. Die Empfehlungen beginnen bei den Grundlagen.',
    summary:
      '{{answered}} beantwortet · {{correct}} selbstständig richtig · {{assisted}} mit Hilfe · {{skipped}} ausgelassen',
    estimateHint:
      'Eine Schätzung aus wenigen Aufgaben, kein Zeugnis und kein Nachweis aller Fähigkeiten. Stufe 2 ist die obere Grenze dieses Tests.',
    notRated: 'Niveau noch nicht einschätzbar',
    foundation: 'Grundlagen noch nicht sicher nachgewiesen',
    level: 'Geschätztes Niveau: Stufe {{level}}',
    areaEvidence:
      '{{independent}} selbstständig beantwortet · {{correct}} richtig · {{assisted}} mit Hilfe · {{skipped}} ausgelassen',
    uncertain: 'Die Stichprobe ist klein oder uneinheitlich. Prüfe hier lieber die Grundlagen.',
    startPoint: 'Startpunkt: {{title}}',
    startLearning: 'Hier weiterlernen',
    startNamed: 'Weiterlernen: {{title}}',
    testedHint:
      'Als getestet eingeschätzte Einheiten bleiben freiwillig zugänglich. Sie zählen nicht als abgeschlossene Lektionen.',
    testedUnit: 'Getestet · {{title}} · freiwillig wiederholen',
    prerequisite: 'Hilfreiche Grundlage zuerst: {{title}}',
    overallStart: 'Empfohlener erster Schritt',
  },
  onboarding: {
    brand: 'Harmonia',
    progress: 'Schritt {{current}} von {{total}}',
    progressLabel: 'Fortschritt der Einrichtung',
    continue: 'Weiter',
    back: 'Zurück',
    finish: 'Mit dem Lernen beginnen',
    finishError:
      'Dein Start konnte nicht abgeschlossen werden. Versuche es erneut oder bestätige deine Anmeldung noch einmal. Deine Angaben bleiben hier erhalten.',
    loading: 'Dein Lernbereich wird vorbereitet …',
    loadError:
      'Deine gespeicherten Angaben konnten nicht geladen werden. Versuche es erneut oder starte nur für diese Sitzung.',
    retry: 'Erneut versuchen',
    temporary: 'Nur für diese Sitzung starten',
    temporaryHint:
      'Deine Angaben bleiben in dieser Sitzung erhalten. Nach dem Schließen sind sie nicht gespeichert.',
    saveError:
      'Deine letzten Angaben sind noch nicht gespeichert. Versuche es erneut; sie bleiben hier sichtbar.',
    saving: 'Deine Angaben werden gespeichert …',
    languageTitle: 'Musik beginnt mit dir.',
    languageBody: 'Wähle deine Sprache. Gleich probierst du deine erste Aufgabe aus.',
    languageDevice: 'Wie das Gerät',
    languageDeviceBody: 'Folgt der Sprache deines Geräts.',
    languageDeBody: 'Deutsche Tonnamen und Begriffe.',
    languageUsBody: 'Englisch mit amerikanischen Fachbegriffen.',
    languageUkBody: 'Englisch mit britischen Fachbegriffen.',
    goalTitle: 'Was möchtest du erreichen?',
    goalBody: 'Wähle, was dir heute am wichtigsten ist. Du kannst deine Angaben später ändern.',
    goal_hobby: 'Musik als Hobby',
    goal_hobbyBody: 'Musik besser verstehen und selbst ausprobieren.',
    goal_school: 'Schule oder Unterricht',
    goal_schoolBody: 'Grundlagen lernen und Aufgaben sicher lösen.',
    goal_exam: 'Aufnahmeprüfung',
    goal_examBody: 'Gezielt Wissen und Gehör vertiefen.',
    goal_ensemble: 'Chor oder Ensemble',
    goal_ensembleBody: 'Noten und musikalische Zusammenhänge besser verstehen.',
    experienceTitle: 'Wo stehst du gerade?',
    experienceBody: 'Es gibt keine falsche Selbsteinschätzung. Sie ersetzt keinen Einstufungstest.',
    experience_new: 'Ich fange gerade an',
    experience_newBody: 'Noch keine Vorkenntnisse nötig.',
    experience_basics: 'Einige Grundlagen kenne ich',
    experience_basicsBody: 'Ich habe schon Noten gelesen oder Musik gemacht.',
    experience_experienced: 'Ich bringe Erfahrung mit',
    experience_experiencedBody: 'Ich möchte Lücken finden und weiterlernen.',
    placementTitle: 'Deinen Startpunkt finden',
    placementBody:
      'Ein kurzer adaptiver Test findet deinen Einstieg. Möchtest du ihn nach der Einrichtung machen oder erst die Grundlagen ausprobieren?',
    placement_later: 'Erst die Grundlagen ausprobieren',
    placement_requested: 'Nach der Einrichtung einstufen',
    placementHint:
      'Du erreichst den Test jederzeit über Lernen und Profil. Dein Niveau ändert sich erst durch den Test.',
    dailyTitle: 'Eine kleine Gewohnheit',
    dailyBody:
      'Wähle dein Tagesziel. Erfahrungspunkte (XP) werden später für gelöste Aufgaben vergeben.',
    dailyOption: '{{count}} XP am Tag',
    dailyHint: 'Das Ziel kannst du jederzeit an deinen Alltag anpassen.',
    remindersTitle: 'Lernen in deinem Rhythmus',
    remindersBody:
      'Du entscheidest, ob du später Lern-Erinnerungen möchtest. Der Wunsch allein aktiviert keine Benachrichtigungen.',
    reminderConsent: 'Lern-Erinnerungen vormerken',
    reminderHint:
      'Du kannst deine Einwilligung jederzeit im Profil widerrufen. Vor dem Aktivieren fragen wir gesondert nach der Berechtigung.',
    reminderTime: 'Bevorzugte Uhrzeit',
    timeOption: '{{time}} Uhr',
    miniTitle: 'Deine erste kleine Aufgabe',
    miniBody:
      'Lies die zwei $t(glossary:notehead_other) von links nach rechts. Höher im Bild bedeutet höherer Ton, tiefer bedeutet tieferer Ton. Du brauchst noch keine Tonnamen.',
    miniProgress: 'Eine Aufgabe zum Ausprobieren',
    miniProgressLabel: 'Fortschritt der Mini-Aufgabe',
    miniNext: 'Mein Startprofil wählen',
    audioStart: 'Klang starten',
    audioStop: 'Wiedergabe stoppen',
    audioHint: 'Tippe, um die beiden Töne zu hören. Die Aufgabe lässt sich auch ohne Ton lösen.',
    audioError:
      'Der Klang konnte nicht gestartet werden. Versuche es erneut oder löse die Aufgabe am Notenbild.',
    accountTitle: 'Dein Lernen bleibt deins.',
    accountBody:
      'Wähle einen Gaststart oder melde dich per E-Mail an. Deine bisherigen Antworten bleiben auf diesem Gerät erhalten.',
    account_guest: 'Als Gast lernen',
    account_guestBody: 'Ohne E-Mail-Adresse, mit lokal gespeichertem Fortschritt.',
    account_email: 'Mit E-Mail anmelden',
    account_emailBody: 'Ein Code bestätigt deine Adresse; ein neues Konto entsteht automatisch.',
    ageConfirmed: 'Ich bin mindestens 16 Jahre alt',
    localProgress:
      'Dein Lernfortschritt wird derzeit auf diesem Gerät gespeichert. Das Konto synchronisiert ihn noch nicht auf andere Geräte.',
    profileTitle: 'Dein Lernstart',
    profileSummary: '{{goal}} · {{experience}}',
    profileEdit: 'Lernziele anpassen',
    profileRestart: 'Einrichtung erneut ansehen',
    profileDaily: 'Tagesziel',
    profileReminder: 'Erinnerungswunsch',
    reminderOff: 'Aus',
    reminderOn: 'Vorgemerkt: {{time}} Uhr',
    profilePlacement: 'Einstufung',
    placementLater: 'Später entscheiden',
    placementRequested: 'Test gewünscht',
    profileAccount: 'Konto',
    guestLabel: 'Gast auf diesem Gerät',
    signedIn: 'Angemeldet: {{email}}',
    signedOut: 'Konto derzeit abgemeldet',
    accountOpen: 'Per E-Mail anmelden',
    learnWelcome: 'Dein Einstieg ist eingerichtet.',
    learnPreference: 'Dein Ziel: {{goal}} · {{count}} XP am Tag',
    learnPlacement:
      'Dein Einstufungswunsch ist gespeichert. Starte den Test über deinen Lernbereich.',
    editTitle: 'Deine Lernziele',
    editBody: 'Änderungen gelten sofort und werden auf diesem Gerät gespeichert.',
    done: 'Zurück zum Profil',
  },
  auth: {
    apple: 'Mit Apple anmelden',
    google: 'Mit Google anmelden',
    oauthError: 'Die Anmeldung wurde nicht abgeschlossen. Bitte starte sie erneut.',
    oauthWorking: 'Anmeldung wird sicher abgeschlossen …',

    title: 'Anmelden',
    email: 'E-Mail-Adresse',
    emailPlaceholder: 'name@beispiel.de',
    send: 'Code senden',
    sending: 'Code wird gesendet …',
    code: 'Sechsstelliger Code',
    verify: 'Adresse bestätigen',
    verifying: 'Code wird geprüft …',
    sent: 'Wenn die Adresse verwendet werden kann, findest du den Code in deinem Postfach. Prüfe auch den Spam-Ordner.',
    resend: 'Neuen Code senden',
    resendWait: 'Neuen Code in {{seconds}} Sekunden senden',
    changeEmail: 'Andere E-Mail-Adresse verwenden',
    invalidEmail: 'Gib eine vollständige E-Mail-Adresse ein.',
    invalidCode: 'Gib den sechsstelligen Code aus der E-Mail ein.',
    sendError:
      'Der Code konnte nicht gesendet werden. Prüfe deine Verbindung und versuche es erneut.',
    verifyError:
      'Der Code ist ungültig, abgelaufen oder konnte nicht geprüft werden. Prüfe ihn oder fordere einen neuen Code an.',
    unavailable:
      'Die E-Mail-Anmeldung ist hier noch nicht verfügbar. Du kannst als Gast lokal weiterlernen.',
    signedIn: 'Du bist mit {{email}} angemeldet.',
    signOut: 'Auf diesem Gerät abmelden',
    signOutError: 'Die Abmeldung konnte nicht abgeschlossen werden. Versuche es erneut.',
    sessionError: 'Deine Anmeldung konnte nicht geladen werden. Versuche es erneut.',
    privacy:
      'Mit „Code senden“ wird deine E-Mail-Adresse für die Anmeldung verwendet. Wir senden keinen Lern-Newsletter.',
    ageHint: 'Bestätige zuerst, dass du mindestens 16 Jahre alt bist.',
    back: 'Zurück zum Profil',
  },
  tabs: {
    learn: 'Lernen',
    practice: 'Üben',
    profile: 'Profil',
  },
  placeholder: 'Hier entsteht gerade etwas.',
  learn: {
    unavailable: 'Neue Lektionen werden vorbereitet. Du kannst schon frei üben.',
    exampleScale: 'Beispiel: C-Dur-Tonleiter in $t(glossary:notes.quarter_other)',
  },
  practice: {
    input: 'Eingabe',
    input_staff: 'Notenbild',
    input_piano: 'Klaviatur',
    intervalTitle: 'Intervall eingeben',
    intervalTask: 'Setze eine große Terz über c¹.',
    intervalHint:
      'Tippe ins System, um die Note zu setzen. Ziehen verschiebt sie, die Leiste darunter setzt ein Versetzungszeichen.',
    keyboardHint: 'Mit der Tastatur: Tab bis zur Note, Pfeil hoch und runter verschiebt sie.',
    placed: 'Gesetzt: {{note}}',
    nothingPlaced: 'Noch keine Note gesetzt.',
    accidentals: '$t(glossary:accidental_other)',
    remove: 'Löschen',
    check: 'Prüfen',
    correct: 'Richtig, das ist die große Terz.',
    wrong: 'Noch nicht richtig. Versuch es noch einmal.',
    correctTitle: 'Richtig!',
    wrongTitle: 'Noch nicht ganz',
  },
  exercise: {
    ...levelThreeExercise.de,
    ...levelFourExercise.de,
    type_SIGHT_SING: 'Vom Blatt singen',
    type_SING_INTERVAL: 'Intervall singen',
    type_PLAY_BACK: 'Melodie nachsingen',
    question_SIGHT_SING: 'Singe die notierte Tonhöhe.',
    question_SING_INTERVAL:
      'Höre den Ausgangston und singe von dort das Intervall {{interval}} aufwärts.',
    question_PLAY_BACK: 'Höre die kurze Melodie und singe ihre drei Töne nacheinander nach.',
    voiceExplanation:
      'Zieltöne: {{notes}}. Zulässige Abweichung je Ton: ±{{tolerance}} Cent; die Oktavlage ist frei wählbar, wenn alle Töne gleich verschoben sind.',
    voiceOctaveShift:
      'Richtig – du hast in einer anderen Oktavlage gesungen, das zählt. Zieltöne: {{notes}}. Zulässige Abweichung: ±{{tolerance}} Cent.',
    voiceDeviation: 'Gemessene Abweichung: {{deviations}} Cent.',
    voiceHint1_SIGHT_SING:
      'Bestimme zuerst den Namen der notierten Note und summe sie leise, bevor du sie aufnimmst.',
    voiceHint2_SIGHT_SING:
      'Der Hilfeton zeigt dir die richtige Tonhöhe; halte deinen Ton dann etwa eine Sekunde ruhig.',
    voiceHint1_SING_INTERVAL:
      'Höre den Ausgangston und summe ihn mit. Die Zahl im $t(glossary:interval_one)-Namen sagt, wie viele Tonnamen du nach oben zählst.',
    voiceHint2_SING_INTERVAL:
      'Zähle die $t(glossary:semitone_other) zwischen Ausgangs- und Zielton und singe den Zielton ruhig und gehalten.',
    voiceHint1_PLAY_BACK:
      'Höre die Melodie noch einmal und achte darauf, ob die Töne steigen oder fallen.',
    voiceHint2_PLAY_BACK:
      'Singe die drei Töne einzeln, übernimm jeden Ton und lasse dazwischen eine kurze Pause.',
    solutionImage: 'L\u00f6sungsbild',
    sourceReplay: 'Quellenbeispiel anh\u00f6ren',
    keyReplay:
      'Beispiel: $t(glossary:scale_one) in $t(glossary:major) oder natürlichem $t(glossary:minor)',
    listeningCell: 'Baustein {{count}}',
    'contextQuestion_crossbar-duration':
      'Wie viele Viertelnotenwerte dauert der erste Ton über den Taktstrich hinweg?',
    'contextHint1_crossbar-duration':
      'Folge dem Haltebogen in den nächsten Takt. Die Stille vor dem ersten Ton zählt nicht zur Klangdauer.',
    'contextHint2_crossbar-duration':
      'Addiere den letzten Notenwert des ersten Takts und den gebundenen Anfang des zweiten.',
    'contextExplain_crossbar-duration':
      'Die Taktgrenze unterbricht die Bindung nicht. Es gibt nur einen Einsatz; beide Notenwerte werden zu einer Klangdauer addiert.',
    'contextQuestion_jazz-roots':
      'Welchen sozialen Zusammenhang dokumentiert dieses fiktive Jazz-Lehrdossier?',
    'contextHint1_jazz-roots':
      'Suche, ob die Quelle lokales Musizieren, einen Ortswechsel oder die Herstellung einer Aufnahme beschreibt.',
    'contextHint2_jazz-roots':
      'Gemeinschaft, Migration und Aufnahmegeschäft sind verschiedene Ebenen. Keine dieser Quellen beweist allein einen ersten Ursprung.',
    'contextExplain_jazz-roots':
      'Die Zuordnung bleibt bei der ausdrücklich beschriebenen sozialen Tätigkeit. Afroamerikanische musikalische Praxis, Migration und Medienwirtschaft wirken zusammen, sind aber nicht austauschbar.',
    contextSocial_neighbourhood:
      'Fiktiver Quartiersbericht, {{year}}: Afroamerikanische Musiker organisieren lokale Auftritte und tauschen musikalische Ideen in ihrer Gemeinschaft aus.',
    contextSocial_migration:
      'Fiktiver Reisebericht, {{year}}: Musiker ziehen vom Süden der USA in eine nördliche Stadt und bauen dort neue musikalische Netzwerke auf.',
    'contextSocial_recording-business':
      'Fiktive Studioakte, {{year}}: Eine Firma engagiert Musiker, produziert eine Schallplattenaufnahme und vertreibt sie kommerziell.',
    contextSocialOption_neighbourhood: 'Lokales Gemeinschaftsleben und musikalischer Austausch',
    contextSocialOption_migration: 'Migration und neue musikalische Netzwerke',
    'contextSocialOption_recording-business': 'Kommerzielle Aufnahmeproduktion und Verbreitung',
    listeningSubdivision: 'Je Grundschlag {{count}} gleich lange Unterteilungen',
    listeningPosition: 'Ton {{count}} wurde verändert',
    listeningMajorScale: 'Durtonleiter',
    listeningMinorScale: 'Natürliches Moll',
    question_CHORD_DIATONIC:
      'Baue den leitereigenen Dreiklang auf Stufe {{degree}} in {{key}}. Moll ist natürlich; vorgegebener Grundton: {{bass}}.',
    'question_listening_rhythm-choice-dotted':
      'Welches vollständige Notenbild passt zum gehörten punktierten Rhythmus?',
    'question_listening_pulse-subdivision':
      'Wie viele gleich lange Unterteilungen bilden einen Grundschlag? Zähle den höheren Anfangston als ersten Teil mit.',
    'question_listening_rhythm-completion':
      'Höre den ganzen Takt. Welcher Baustein ergänzt die fehlende vierte Viertel-Zählzeit des Notengerüsts?',
    'question_listening_scale-mode':
      'Höre die aufsteigende Tonfolge vom Grundton bis zur Oktave. Ist sie Dur oder natürliches Moll?',
    'question_listening_melodic-memory':
      'Höre A und B. Welcher der vier Töne hat sich im zweiten Beispiel verändert?',
    'listeningExplanation_rhythm-choice-dotted':
      'Verglichen werden tatsächliche Einsätze, Pausen und Dauern einschließlich der Punktierung. Antwort: {{answer}}.',
    'listeningExplanation_pulse-subdivision':
      'Der höhere Ton markiert jeden Grundschlaganfang. Die gleich langen Unterteilungen bis zum nächsten Anfang bilden die Gruppe. Antwort: {{answer}}. Eine gehörte Gruppe allein bestimmt noch keine Taktart.',
    'listeningExplanation_rhythm-completion':
      'Die ersten drei Viertel stimmen mit dem Gerüst überein. Der letzte Baustein wird mit dem tatsächlichen Klang der vierten Zählzeit verglichen. Antwort: {{answer}}.',
    'listeningExplanation_scale-mode':
      'Die Tonabstände werden vom ersten Ton aus verglichen. Dur und natürliches Moll unterscheiden sich besonders an Stufe 3, 6 und 7. Antwort: {{answer}}.',
    'listeningExplanation_melodic-memory':
      'Beide Quellen enthalten vier gleich lange Töne; genau eine klingende Tonhöhe ist an ihrer Position anders. Antwort: {{answer}}.',
    listeningOutline:
      'Gerüst: Die vierte Zählzeit fehlt. Die Auswahl enthält jeweils einen Viertelnotenwert.',
    contextEvent: 'Takt {{measure}}, Ereignis {{index}}: {{duration}}. {{positions}}',
    contextPosition:
      'Notenkopf {{index}}, {{steps}} Stammtonschritte von der untersten Linie; sichtbares Zeichen: {{sign}}.',
    contextSign_none: 'kein Zeichen',
    contextSign_sharp: 'Kreuz',
    contextSign_flat: 'b',
    contextSign_natural: 'Auflösungszeichen',
    contextSign_doubleSharp: 'Doppelkreuz',
    contextSign_doubleFlat: 'Doppel-b',
    contextResult: ' {{explanation}} Antwort: {{answer}}.',
    contextFraction: '{{fraction}} × Viertelnotenwert',
    contextDegree: 'Stufe {{count}}',
    contextPattern: 'Halbtonschritte: {{pattern}}',
    contextYes: 'Ja',
    contextNo: 'Nein',
    contextRole_root: 'Grundton',
    contextRole_third: 'Terz',
    contextRole_fifth: 'Quinte',
    contextScore: 'Notierte Quelle',
    contextKey: 'Tonart: {{key}}',
    contextDossier:
      'Fiktives europäisches Lehrdossier: Werkjahr {{year}}. Genanntes Merkmal: {{feature}}. Das Klavierbeispiel ist ein eigenes Lehrmodell.',
    contextDocument:
      'Fiktive Quelle im Jahr {{year}}: {{medium}}. Gefragt ist nur, was dieses Medium dokumentiert.',
    'contextComparison_same-event':
      'Zwei Berichte datieren dieselbe Aufführung auf {{year}} beziehungsweise {{secondYear}}. Über ihre Abhängigkeit ist nichts bekannt.',
    'contextComparison_work-recording':
      'Quelle A nennt das Werkjahr {{year}}. Quelle B nennt das Aufnahmedatum {{secondYear}}.',
    'contextComparison_advertised-performed':
      'Ein Programm aus {{year}} kündigt eine Besetzung an. Ein Aufführungsbericht aus {{secondYear}} beschreibt die tatsächlich aufgetretene Besetzung derselben Veranstaltung.',
    contextFeature_monophony: '$t(glossary:monophony) im Gesang',
    contextFeature_imitation: '$t(glossary:imitation) in vokaler $t(glossary:polyphony)',
    contextFeature_continuo: '$t(glossary:continuo)',
    contextFeature_phrases: 'regelmäßige Periodenbildung',
    contextFeature_chromaticism: 'Erweiterte $t(glossary:chromaticism)',
    contextFeature_electronics: 'elektronische Klangerzeugung',
    contextMedium_recording: '$t(glossary:recording_one)',
    contextMedium_programme: '$t(glossary:programmeSource_one)',
    contextMedium_report: '$t(glossary:report_one)',
    contextMedium_broadcast: '$t(glossary:broadcast_one)',
    contextMedium_stream: '$t(glossary:stream_one)',
    'contextOption_recorded-performance': 'Dokumentierter Klang einer aufgenommenen Aufführung',
    'contextOption_advertised-event': 'Angekündigtes Ereignis; tatsächliche Ausführung noch offen',
    'contextOption_reported-view': 'Überlieferte Sicht des Berichtsverfassers',
    'contextOption_mediated-distribution': 'Verbreitung über einen Medienkanal',
    'contextOption_invented-origin': 'Beweis für den allerersten Ursprung des Musikstils',
    'contextOption_universal-style': 'Beweis für alle Musiker und Werke dieser Tradition',
    'contextOption_different-date-roles':
      'Werkentstehung und Aufnahme datieren unterschiedliche Ereignisse',
    'contextOption_intention-performance':
      'Ankündigung und tatsächliche Aufführung sind verschiedene Aussagen',
    'contextOption_unresolved-conflict': 'Ungelöster Widerspruch; weitere Belege nötig',
    'contextOption_agreement-not-proof': 'Übereinstimmung; Unabhängigkeit noch nicht bewiesen',
    type_CONTEXT_CHOICE: 'Musikalische Zusammenhänge',
    question_CONTEXT_CHOICE: 'Prüfe die gezeigte Quelle.',
    'contextQuestion_accidental-scope':
      'Wie heißt Ton {{target}} einschließlich Oktavlage? Beachte Taktgrenze, Auflösungszeichen und Lage.',
    'contextHint1_accidental-scope':
      'Ein Versetzungszeichen gilt im Takt für denselben Stammton in derselben Oktavlage.',
    'contextHint2_accidental-scope':
      'Am Taktstrich gilt wieder die Vorzeichnung. Ein Auflösungszeichen hebt die zuvor geltende Veränderung auf.',
    'contextExplain_accidental-scope':
      'Die tatsächliche Schreibweise des gefragten Tons berücksichtigt den Zustand in seinem Takt und seiner Oktavlage.',
    'contextQuestion_enharmonic-spelling':
      'Welche andere Schreibweise klingt auf dem gleichstufigen Klavier wie der notierte Ton?',
    'contextHint1_enharmonic-spelling': 'Vergleiche klingende Tasten, nicht nur Buchstaben.',
    'contextHint2_enharmonic-spelling':
      'Cis und Des teilen eine Taste. Eis ist die F-Taste; His erreicht die nächste C-Taste.',
    'contextExplain_enharmonic-spelling':
      'Enharmonische Schreibweisen behalten die klingende Taste, ändern aber den geschriebenen Stammton. Die Oktavzahl kann dabei wechseln.',
    'contextQuestion_dotted-duration':
      'Wie viele Viertelnotenwerte dauert die erste punktierte Note?',
    'contextHint1_dotted-duration': 'Ein Punkt ergänzt die Hälfte des ursprünglichen Werts.',
    'contextHint2_dotted-duration':
      'Punktierte Achtel = Achtel + Sechzehntel; punktierte Viertel = Viertel + Achtel.',
    'contextExplain_dotted-duration':
      'Der erste Punkt multipliziert den ursprünglichen Wert mit 3/2. Die angehängten Pausen ändern die Dauer dieser Note nicht.',
    'contextQuestion_tied-duration':
      'Wie viele Viertelnotenwerte dauert der erste Ton einschließlich aller seiner Haltebögen?',
    'contextHint1_tied-duration':
      'Ein Haltebogen verbindet gleiche Tonhöhen zu einem durchgehenden Klang.',
    'contextHint2_tied-duration':
      'Addiere nur die gebundenen Notenwerte. Pausen gehören nicht dazu; am Taktstrich endet die Bindung nicht.',
    'contextExplain_tied-duration':
      'Die geprüfte Bindungskette zählt als ein Einsatz. Ihre ununterbrochene Dauer ist die Summe der gebundenen Werte, auch über einen Taktstrich.',
    contextQuestion_syncopation:
      'Beginnt hier ein Ton zwischen Viertel-Grundschlägen und reicht über den nächsten Grundschlag?',
    contextHint1_syncopation: 'Suche einen Einsatz zwischen zwei Grundschlägen.',
    contextHint2_syncopation:
      'Eine Achtel auf der zweiten Hälfte allein reicht nicht: Ihr Klang muss die nächste Zählzeit überbrücken.',
    contextExplain_syncopation:
      'Diese Einstiegsfrage prüft genau die Überbrückung eines Viertel-Grundschlags durch einen zuvor zwischen den Schlägen begonnenen Ton.',
    'contextQuestion_triplet-duration':
      'Wie viele Viertelnotenwerte dauern die ersten drei Achtel unter der Triolenzahl 3 zusammen?',
    'contextHint1_triplet-duration':
      'Eine Achteltriole enthält drei gleich lange Achtel in der Zeit von zwei gewöhnlichen Achteln.',
    'contextHint2_triplet-duration':
      'Jede Triolenachtel ist 1/3 einer Viertel. Addiere alle drei, nicht die folgende Note.',
    'contextExplain_triplet-duration':
      'Das Verhältnis 3:2 verkürzt jede Achtel auf zwei Drittel ihres gewöhnlichen Werts. Drei davon ergeben genau einen Viertelnotenwert.',
    'contextQuestion_interval-inversion':
      'Welches Intervall entsteht, wenn du das notierte einfache Intervall durch Oktavversetzung umkehrst?',
    'contextHint1_interval-inversion': 'Die beiden Intervallnummern ergänzen sich zu 9.',
    'contextHint2_interval-inversion':
      'Rein bleibt rein; klein wird groß; übermäßig wird vermindert und umgekehrt.',
    'contextExplain_interval-inversion':
      'Die Umkehrung ergänzt die Nummer zu 9 und kehrt die Qualität um. Prime und Oktave sind der Randfall dieses Modells.',
    'contextQuestion_interval-reduction':
      'Welches einfache Intervall entspricht dem notierten Abstand nach Wegnahme ganzer Oktaven?',
    'contextHint1_interval-reduction': 'Eine zusätzliche Oktave erhöht die Intervallnummer um 7.',
    'contextHint2_interval-reduction':
      'Eine None entspricht einer Sekunde, eine Dezime einer Terz. Die Qualität bleibt erhalten.',
    'contextExplain_interval-reduction':
      'Ziehe bei zusammengesetzten Intervallen jeweils 7 von der Nummer ab. Die Qualität bleibt; reduziere nur bis zur einfachen Oktave.',
    'contextQuestion_scale-pattern':
      'Welche Halbtonfolge beschreibt die sieben Schritte der gezeigten aufsteigenden Tonleiter?',
    'contextHint1_scale-pattern': 'Zähle Übergänge auf dem Klavier: Ganzton = 2, Halbton = 1.',
    'contextHint2_scale-pattern':
      'Eine Durtonleiter hat ihre Halbtonschritte zwischen Stufe 3–4 und 7–8.',
    'contextExplain_scale-pattern':
      'Die Folge wird aus allen benachbarten klingenden Tonhöhen berechnet, nicht aus der Anzahl sichtbarer Vorzeichen.',
    'contextQuestion_scale-degree':
      'Auf welcher Stufe der gezeigten Durtonleiter liegt {{focus}}? Zähle den Anfangston als 1.',
    'contextHint1_scale-degree':
      'Die Tonika ist Stufe 1; die nächsten Stammtöne folgen als 2, 3 und so weiter.',
    'contextHint2_scale-degree':
      'Lies vom tatsächlichen Anfangston aus. C ist nicht in jeder Tonart Stufe 1.',
    'contextExplain_scale-degree':
      'Die Stufe ergibt sich aus der Position des gefragten Tons in dieser Tonleiter. Der wiederholte Oktavton entspricht erneut der Tonika.',
    'contextQuestion_fifth-neighbour':
      'Welche Tonart liegt von {{key}} aus eine Quinte {{direction}} auf dem Quintenzirkel? Der Modus bleibt gleich.',
    'contextHint1_fifth-neighbour':
      'Eine Quinte aufwärts verschiebt die Vorzeichnung um ein Kreuz in die Kreuzrichtung.',
    'contextHint2_fifth-neighbour':
      'Abwärts geht es einen Schritt in die b-Richtung. Das kann zuerst ein vorhandenes Kreuz entfernen.',
    'contextExplain_fifth-neighbour':
      'Benachbarte Positionen des Quintenzirkels unterscheiden sich um genau eine Vorzeichnungseinheit. Grundton und Modus werden gemeinsam berücksichtigt.',
    'contextQuestion_relative-key': 'Welche Paralleltonart teilt die Vorzeichnung mit {{key}}?',
    'contextHint1_relative-key':
      'Paralleltonarten haben verschiedene Grundtöne und verschiedene Modi, aber dieselbe Vorzeichnung.',
    'contextHint2_relative-key':
      'Zu Dur liegt die Molltonika eine kleine Terz tiefer. Gleichnamiges Moll wäre eine Varianttonart.',
    'contextExplain_relative-key':
      'Die Vorzeichenzahl bleibt gleich, der Modus wechselt. Deutsches Paralleltonart entspricht englischem relative key, nicht parallel key.',
    'contextQuestion_chord-member':
      'Welcher Ton ist hier {{role}} des Dreiklangs? Die Lage kann wechseln.',
    'contextHint1_chord-member':
      'Sortiere den geschriebenen Dreiklang gedanklich in Grundstellung.',
    'contextHint2_chord-member':
      'Grundton, Terz und Quinte werden vom Akkordgrundton aus benannt. Der tiefste Ton kann eine andere Rolle haben.',
    'contextExplain_chord-member':
      'Die Engine bestimmt den vollständigen geschriebenen Dreiklang und anschließend die gefragte Akkordtonrolle. Eine Umkehrung verändert diese Rollen nicht.',
    'contextQuestion_chord-root': 'Was ist der Grundton dieses geschriebenen Dreiklangs?',
    'contextHint1_chord-root': 'Grundton und tiefster klingender Ton sind verschiedene Begriffe.',
    'contextHint2_chord-root':
      'Suche die Terzschichtung in Grundstellung. Der Bass entscheidet nur über die Umkehrung.',
    'contextExplain_chord-root':
      'Die Akkordidentität ergibt sich aus allen drei geschriebenen Tönen. Ein höher notierter Grundton bleibt der Grundton.',
    'contextQuestion_diatonic-triad':
      'Welche Dreiklangart entsteht auf Stufe {{degree}} in {{key}}, wenn du nur Tonleitertöne in Terzen schichtest? Moll ist hier natürlich.',
    'contextHint1_diatonic-triad':
      'Nimm Stufe n, n+2 und n+4; setze oberhalb der siebten Stufe die Tonleiter in der nächsten Oktave fort.',
    'contextHint2_diatonic-triad':
      'Dur: groß–klein–klein–groß–groß–klein–vermindert. Natürliches Moll hat eine andere Folge.',
    'contextExplain_diatonic-triad':
      'Die drei Töne werden aus der tatsächlichen Dur- oder natürlichen Molltonleiter geschichtet und anschließend als Dreiklang bestimmt.',
    'contextQuestion_period-context':
      'Welche Epoche der groben europäischen Übersicht passt zum ausdrücklich angegebenen Werkjahr und Merkmal dieses Lehrdossiers?',
    'contextHint1_period-context':
      'Nutze das angegebene Werkjahr gemeinsam mit dem Merkmal; ein Klangmerkmal allein datiert kein Werk.',
    'contextHint2_period-context':
      'Die Beispiele liegen weit von den Übergängen. Die Übersicht ist europäisch, mit überlappenden Grenzen.',
    'contextExplain_period-context':
      'Das Lehrdossier nennt ein Werkjahr. Die Zuordnung verwendet die ausdrücklich gelehrte grobe Übersicht und behauptet keine Datierung aus dem Klaviermodell.',
    'contextQuestion_jazz-source':
      'Welche Aussage wird von dieser fiktiven Quelle zum Jazzkontext tatsächlich gestützt?',
    'contextHint1_jazz-source':
      'Unterscheide eine dokumentierte Aufführung von der Entstehung einer ganzen Musiktradition.',
    'contextHint2_jazz-source':
      'Eine Aufnahme belegt ihren aufgenommenen Klang; ein Programm eine Ankündigung; ein Bericht die Sicht seines Verfassers.',
    'contextExplain_jazz-source':
      'Das Medium begrenzt die Aussage. Die früheste erhaltene oder kommerziell veröffentlichte Quelle beweist nicht den ersten musikalischen Ursprung.',
    'contextQuestion_popular-source':
      'Welche Aussage wird von dieser fiktiven Quelle zu populärer Musik tatsächlich gestützt?',
    'contextHint1_popular-source':
      'Frage, ob die Quelle Klang, Ankündigung, Meinung oder Verbreitung dokumentiert.',
    'contextHint2_popular-source':
      'Sendung und Stream belegen Medienverbreitung, nicht automatisch die Entstehung des Werks oder die ursprüngliche Besetzung.',
    'contextExplain_popular-source':
      'Aufnahme, Medienkanal und Werkentstehung sind unterschiedliche Ebenen. Die Antwort bleibt bei der tatsächlich dokumentierten Ebene.',
    'contextQuestion_source-comparison':
      'Wie lässt sich das Verhältnis der beiden fiktiven Quellen begründet beschreiben?',
    'contextHint1_source-comparison':
      'Vergleiche zuerst, welches Ereignis oder welche Aussage jede Datumsangabe betrifft.',
    'contextHint2_source-comparison':
      'Werkdatum und Aufnahmedatum dürfen verschieden sein. Zwei abweichende Angaben zur selben Aufführung brauchen zusätzliche Belege.',
    'contextExplain_source-comparison':
      'Gleiche Angaben sind Übereinstimmung, keine automatische unabhängige Bestätigung. Unterschiedliche Rollen sind von einem ungelösten Widerspruch zu trennen.',
    question_octaveName: 'Welche {{system}} entspricht {{name}}?',
    scientificSystem: '$t(glossary:scientificNotation)',
    helmholtzSystem: '$t(glossary:helmholtzNotation)',
    question_grandStaff:
      'Welche Taste gehört zum einzigen notierten Ton? Gezeigt ist ein $t(glossary:grandStaff_one).',
    octaveNameExplanation:
      '{{source}} und {{answer}} bezeichnen dieselbe Tonhöhe. Die wissenschaftliche Oktavnummer {{octave}} beginnt bei C und gilt bis zum folgenden B (deutsch H). Groß-/Kleinschreibung und Hochzahlen geben bei Helmholtz die Lage an.',
    octaveNameHint1:
      'Lies zuerst die Lage: c = C3, c¹ = C4, c² = C5. Jeder neue Abschnitt beginnt bei C.',
    octaveNameHint2:
      'Die Zahl gilt für alle sieben Stammtöne der Lage: h = B3 und h¹ = B4. Internationales B ist deutsches H.',
    grandStaffHint1:
      'Suche das System mit der Note. Oben gilt der $t(glossary:trebleClef_one), unten der $t(glossary:bassClef_one).',
    grandStaffHint2:
      'c¹/C4 steht oben auf der ersten $t(glossary:ledgerLine_one) unter dem System und unten auf der ersten darüber. Beide Schreibweisen gehören zu derselben Taste.',
    grandStaffDescription:
      'Großes System: oben Violinschlüssel, unten Bassschlüssel. {{description}} Das System im {{silent}} enthält eine ganze Pause.',
    type_LISTENING_CHOICE: 'Hören und vergleichen',
    question_listening_pulse:
      'Höre die zwei gleichmäßigen Pulsgruppen. Wie viele Schläge gehören jeweils zu einer Gruppe? Zähle den höheren Startklang als 1; der nächste Start gehört zur nächsten Gruppe.',
    'question_listening_rhythm-compare':
      'Höre Beispiel A und nach der Pause Beispiel B. Haben beide denselben Rhythmus? Vergleiche Einsätze, Tondauern und Pausen.',
    'question_listening_rhythm-choice':
      'Welches der drei Notenbilder passt zum gehörten Rhythmus? Alle Beispiele verwenden dieselbe Tonhöhe.',
    'question_listening_pitch-direction':
      'Höre die beiden Töne nacheinander. Ist der zweite höher, tiefer oder gleich hoch?',
    'question_listening_melody-compare':
      'Höre Tonfolge A und nach der Pause Tonfolge B. Stimmen alle Tonhöhen in derselben Reihenfolge und alle Dauern überein?',
    question_listening_observation:
      'Welche Aussage beschreibt etwas, das du in diesem Lehrbeispiel direkt hören kannst?',
    listeningOption: 'Notenbild {{count}}',
    listeningClip: 'Hörbeispiel {{count}}',
    listeningPulseCount: 'Pulsgruppe mit {{count}} Schlägen',
    listeningSame: 'Gleich',
    listeningDifferent: 'Verschieden',
    listeningUp: 'Zweiter Ton höher',
    listeningDown: 'Zweiter Ton tiefer',
    listeningRepeat: 'Gleiche Tonhöhe',
    listeningSingle: 'Die Töne beginnen jeweils nacheinander',
    listeningTogether: 'Mindestens zwei Töne beginnen zugleich',
    listeningDate: 'Das Werk entstand sicher im Jahr 1750',
    listeningPlace: 'Die Musik wurde sicher in einer Kirche aufgeführt',
    listeningHint1:
      'Höre zuerst das ganze Beispiel. Du kannst es stoppen und erneut starten. Achte auf die Eigenschaft, nach der die Frage fragt.',
    listeningHint2:
      'Vergleiche Schläge und Pausen beim Rhythmus, Tonhöhen bei der Melodie. Ein Notenbild beschreibt die Töne; historische Aussagen brauchen zusätzliche Quellen.',
    listeningExplanation_pulse:
      'Der höhere Klang markiert jeweils den Gruppenanfang. Zwischen zwei Anfängen gehören die gleichmäßigen Schläge zu einer Gruppe. Antwort: {{answer}}. Der nächste Start gehört bereits zur nächsten Gruppe.',
    'listeningExplanation_rhythm-compare':
      'Die Bewertung vergleicht die tatsächlichen Einsätze, Tondauern und Pausen beider Klangquellen. Antwort: {{answer}}. Die Tonhöhe bleibt in diesen Aufgaben gleich.',
    'listeningExplanation_rhythm-choice':
      '{{answer}} hat dieselben Einsätze, Tondauern und Pausen wie das gespielte Beispiel. Die drei vollständigen Takte unterscheiden sich hörbar.',
    'listeningExplanation_pitch-direction':
      'Die zweite klingende Tonhöhe wird mit der ersten verglichen. Antwort: {{answer}}. Lautstärke und Dauer entscheiden nicht über höher oder tiefer.',
    'listeningExplanation_melody-compare':
      'Verglichen werden die klingenden Tonhöhen, ihre Reihenfolge, Einsätze und Dauern. Antwort: {{answer}}. Hier meint „gleich“ dieselben Tonhöhen, nicht nur eine ähnliche Richtung.',
    listeningExplanation_observation:
      '{{answer}} ist im Klangbeispiel überprüfbar. Jahr und Aufführungsort lassen sich daraus allein nicht sicher bestimmen. Dies ist ein eigenes Klavier-Lehrmodell und keine historische Aufnahme.',
    orderRule_periods:
      'Ordne nach der üblichen groben europäischen Epochenfolge; die Grenzen können sich überschneiden.',
    order_periods_ascending: 'Ordne die Epochen von früher nach später.',
    order_periods_descending: 'Ordne die Epochen von später nach früher.',
    knowledgeHint_soundSources:
      'Lies die beschriebene Eigenschaft genau. Trenne den Begriff von verwandten Kategorien und beachte die Grenzen der Quelle.',
    knowledgeHistory_soundSources_voice: '$t(glossary:voice_one)',
    knowledgeHistoryDefinition_soundSources_voice:
      'Der Klang entsteht durch die schwingenden Stimmlippen eines singenden Menschen.',
    knowledgeHistory_soundSources_instrument: '$t(glossary:instrument_one)',
    knowledgeHistoryDefinition_soundSources_instrument:
      'Eine spielende Person bringt etwa eine Saite oder Luftsäule zum Schwingen.',
    knowledgeHistory_soundSources_recording: '$t(glossary:recording_one)',
    knowledgeHistoryDefinition_soundSources_recording:
      'Gespeicherter Klang wird wiedergegeben; er kann Stimmen, Instrumente oder elektronische Klänge enthalten.',
    knowledgeHistory_soundSources_electronic: '$t(glossary:electronicSound)',
    knowledgeHistoryDefinition_soundSources_electronic:
      'Ein elektronisches Gerät oder Programm erzeugt das Audiosignal.',
    knowledgeHint_sourceTypes:
      'Lies die beschriebene Eigenschaft genau. Trenne den Begriff von verwandten Kategorien und beachte die Grenzen der Quelle.',
    knowledgeHistory_sourceTypes_score: '$t(glossary:scoreSource_one)',
    knowledgeHistoryDefinition_sourceTypes_score:
      'Eine schriftliche Quelle legt Tonhöhen, Dauern und weitere Spielanweisungen fest; sie ist selbst keine klingende Aufführung.',
    knowledgeHistory_sourceTypes_recording: '$t(glossary:recording_one)',
    knowledgeHistoryDefinition_sourceTypes_recording:
      'Diese Quelle dokumentiert eine bestimmte klingende Darbietung einschließlich ihrer Interpretationsentscheidungen.',
    knowledgeHistory_sourceTypes_report: '$t(glossary:report_one)',
    knowledgeHistoryDefinition_sourceTypes_report:
      'Ein Mensch beschreibt ein musikalisches Ereignis in Worten; seine Perspektive und Erinnerung sind zu prüfen.',
    knowledgeHistory_sourceTypes_programme: '$t(glossary:programmeSource_one)',
    knowledgeHistoryDefinition_sourceTypes_programme:
      'Eine Ankündigung nennt beispielsweise Werke, Mitwirkende, Ort und Termin; sie beweist allein nicht, dass alles wie angekündigt stattfand.',
    knowledgeHint_context:
      'Lies die beschriebene Eigenschaft genau. Trenne den Begriff von verwandten Kategorien und beachte die Grenzen der Quelle.',
    knowledgeHistory_context_place: '$t(glossary:place_one)',
    knowledgeHistoryDefinition_context_place:
      'Die Frage lautet: Wo fand die Aufführung statt, beispielsweise in einem Konzertsaal?',
    knowledgeHistory_context_time: '$t(glossary:time_one)',
    knowledgeHistoryDefinition_context_time:
      'Die Frage lautet: Wann fand das Ereignis statt? Kompositionsdatum und Aufnahmedatum können verschieden sein.',
    knowledgeHistory_context_occasion: '$t(glossary:occasion_one)',
    knowledgeHistoryDefinition_context_occasion:
      'Die Frage lautet: Zu welchem Ereignis gehörte die Musik, beispielsweise zu einer Hochzeit?',
    knowledgeHistory_context_author: '$t(glossary:author)',
    knowledgeHistoryDefinition_context_author:
      'Die Frage lautet: Wer verfasste die Musik oder den Bericht? Das ist nicht automatisch dieselbe Person wie die Ausführenden.',
    knowledgeHint_periods:
      'Lies die beschriebene Eigenschaft genau. Trenne den Begriff von verwandten Kategorien und beachte die Grenzen der Quelle.',
    knowledgeHistory_periods_medieval: '$t(glossary:medieval)',
    knowledgeHistoryDefinition_periods_medieval:
      'In dieser groben europäischen Kunstmusik-Übersicht etwa 500–1400; die Grenzen unterscheiden sich nach Region und Thema.',
    knowledgeHistory_periods_renaissance: '$t(glossary:renaissance)',
    knowledgeHistoryDefinition_periods_renaissance:
      'In dieser groben europäischen Kunstmusik-Übersicht etwa 1400–1600, nach dem Mittelalter und vor dem Barock.',
    knowledgeHistory_periods_baroque: '$t(glossary:baroque)',
    knowledgeHistoryDefinition_periods_baroque:
      'In dieser groben europäischen Kunstmusik-Übersicht etwa 1600–1750, nach der Renaissance und vor der Klassik.',
    knowledgeHistory_periods_classical: '$t(glossary:classicalPeriod)',
    knowledgeHistoryDefinition_periods_classical:
      'In dieser groben europäischen Kunstmusik-Übersicht etwa 1750–1820; Überschneidungen mit der Romantik sind möglich.',
    knowledgeHistory_periods_romantic: '$t(glossary:romanticPeriod)',
    knowledgeHistoryDefinition_periods_romantic:
      'In dieser groben europäischen Kunstmusik-Übersicht vor allem das 19. Jahrhundert, ungefähr 1800–1900.',
    knowledgeHistory_periods_since1900: '$t(glossary:musicSince1900)',
    knowledgeHistoryDefinition_periods_since1900:
      'In dieser Übersicht das 20. und 21. Jahrhundert mit vielen gleichzeitig bestehenden Stilen; kein einzelner Klangstil.',
    knowledgeHint_genreContext:
      'Lies die beschriebene Eigenschaft genau. Trenne den Begriff von verwandten Kategorien und beachte die Grenzen der Quelle.',
    knowledgeHistory_genreContext_genre: '$t(glossary:genre_one)',
    knowledgeHistoryDefinition_genreContext_genre:
      'Die Frage lautet: Welche Art von Werk ist es, beispielsweise eine Oper oder eine Sinfonie?',
    knowledgeHistory_genreContext_forces: '$t(glossary:performingForces_one)',
    knowledgeHistoryDefinition_genreContext_forces:
      'Die Frage lautet: Welche Stimmen oder Instrumente wirken mit, beispielsweise ein Chor oder ein Streichquartett?',
    knowledgeHistory_genreContext_occasion: '$t(glossary:occasion_one)',
    knowledgeHistoryDefinition_genreContext_occasion:
      'Die Frage lautet: Bei welchem konkreten Ereignis wurde Musik aufgeführt, beispielsweise bei einer Trauung?',
    knowledgeHistory_genreContext_function: '$t(glossary:function_one)',
    knowledgeHistoryDefinition_genreContext_function:
      'Die Frage lautet: Wozu diente die Musik, beispielsweise zum Tanzen, zur Andacht oder zum konzentrierten Zuhören?',
    knowledgeHint_evidence:
      'Lies die beschriebene Eigenschaft genau. Trenne den Begriff von verwandten Kategorien und beachte die Grenzen der Quelle.',
    knowledgeHistory_evidence_observation: '$t(glossary:observation_one)',
    knowledgeHistoryDefinition_evidence_observation:
      'Eine Aussage beschreibt direkt Gehörtes, beispielsweise zwei gleichzeitig erklingende Tonhöhen.',
    knowledgeHistory_evidence_metadata: '$t(glossary:sourceInformation_one)',
    knowledgeHistoryDefinition_evidence_metadata:
      'Eine beschriftete Quelle nennt etwa Urheberschaft, Ort oder Datum; ihre Zuverlässigkeit ist gesondert zu prüfen.',
    knowledgeHistory_evidence_inference: '$t(glossary:inference_one)',
    knowledgeHistoryDefinition_evidence_inference:
      'Aus Beobachtungen und Quellen wird eine begründete Vermutung abgeleitet; sie ist nicht identisch mit einer direkten Wahrnehmung.',
    knowledgeHistory_evidence_uncertainty: '$t(glossary:uncertainty)',
    knowledgeHistoryDefinition_evidence_uncertainty:
      'Fehlende oder widersprüchliche Belege werden ausdrücklich benannt; ein Klang allein verrät keinen sicheren Ort oder Entstehungszeitpunkt.',
    question_durationSymbol: 'Welchen Wert hat dieses Zeichen für eine {{kind}}?',
    question_measureGap: 'Welche {{kind}} ergänzt diesen Takt auf genau vier Viertelwerte?',
    measureGapDescription:
      'Vier-Viertel-Takt. Vorhanden, in Reihenfolge: {{events}}. Am Ende fehlt eine {{kind}}.',
    measureGapExplanation:
      'Die vorhandenen Werte ergeben {{used}} Viertelwerte. 4 − {{used}} = {{missing}}. Es fehlt: {{answer}}. Pausen zählen mit; Taktstriche haben keine Dauer.',
    durationSymbolHint1:
      'Betrachte Form, Füllung, Hals und Fähnchen. Bei den rechteckigen Pausen ist die Lage zur Linie entscheidend.',
    durationSymbolHint2:
      'Bei Noten halbiert jeder Schritt von ganz zu halb, Viertel, Achtel und Sechzehntel die Dauer. Pausenzeichen haben dieselben Zeitwerte.',
    measureGapHint1:
      'Rechne Noten und Pausen in Viertelwerte um. Addiere sie und ziehe die Summe von vier ab.',
    measureGapHint2:
      'Eine Halbe zählt zwei Viertel, zwei Achtel zählen ein Viertel, vier Sechzehntel zählen ein Viertel. Der fehlende Wert muss genau passen.',
    knowledgeRestDuration: 'Stille für {{value}} × die Dauer einer ganzen Note.',
    knowledge_barlines_single: '$t(glossary:barline_one)',
    knowledge_barlines_final: '$t(glossary:finalBarline_one)',
    knowledgeDefinition_barlines_single:
      'Eine dünne senkrechte Linie trennt benachbarte Takte; sie hat selbst keine Dauer.',
    knowledgeDefinition_barlines_final:
      'Eine dünne und eine dicke senkrechte Linie kennzeichnen das Ende eines Stücks oder abgeschlossenen Abschnitts.',
    knowledgeHint_rests:
      'Pausen haben feste Zeitwerte. Der gleichmäßige Puls läuft während der Stille weiter.',
    knowledgeHint_barlines:
      'Eine einzelne dünne Linie grenzt Takte ab; dünn plus dick kennzeichnet einen Abschluss.',
    durationShape_note_whole: 'Ungefüllter ovaler Notenkopf ohne Hals.',
    durationShape_note_half: 'Ungefüllter ovaler Notenkopf mit Hals, ohne Fähnchen.',
    durationShape_note_quarter: 'Gefüllter Notenkopf mit Hals, ohne Fähnchen.',
    durationShape_note_eighth: 'Gefüllter Notenkopf mit Hals und einem Fähnchen.',
    durationShape_note_sixteenth: 'Gefüllter Notenkopf mit Hals und zwei Fähnchen.',
    durationShape_rest_whole: 'Gefülltes Rechteck, das unter einer kurzen Bezugslinie hängt.',
    durationShape_rest_half: 'Gefülltes Rechteck, das auf einer kurzen Bezugslinie sitzt.',
    durationShape_rest_quarter:
      'Senkrechtes, gezacktes Pausenzeichen mit einem gebogenen unteren Ende.',
    durationShape_rest_eighth: 'Schräges Pausenzeichen mit einem Haken.',
    durationShape_rest_sixteenth: 'Schräges Pausenzeichen mit zwei Haken.',
    measureGapSlot: 'Fehlender Wert',
    measureGapCapacity: 'Ziel: insgesamt vier Viertelwerte',

    knowledgeStart: 'Wissen, Zuordnen und Reihenfolgen üben',
    knowledgeIntro:
      'Neun Aufgaben: Begriffe aus den Grundlagen erkennen, Erklärungen zuordnen und Notenwerte oder Tonhöhen ordnen.',
    type_KNOWLEDGE_MC: 'Wissensfrage',
    type_MATCH: 'Begriffe zuordnen',
    type_ORDER: 'Reihenfolge bilden',
    orderMoveUp: 'Nach oben',
    orderMoveDown: 'Nach unten',
    orderRemoveItem: 'Entfernen',
    question_KNOWLEDGE_MC: 'Welcher Begriff passt zu dieser Erklärung? {{definition}}',
    question_MATCH:
      'Ordne jedem Begriff die passende Erklärung zu. Jede Erklärung gehört genau zu einem Begriff.',
    question_ORDER: 'Bringe alle Angaben in die Reihenfolge {{direction}}. {{rule}}',
    knowledgeExplanation: '{{term}}: {{definition}}',
    knowledgeKeyboard_semitone: '$t(glossary:semitone_one)',
    knowledgeKeyboard_wholeTone: '$t(glossary:wholeTone_one)',
    knowledgeKeyboard_twoBlackKeys: '$t(glossary:twoBlackKeys_one)',
    knowledgeKeyboard_threeBlackKeys: '$t(glossary:threeBlackKeys_one)',
    knowledgeKeyboardDefinition_semitone:
      'Abstand zwischen unmittelbar benachbarten $t(glossary:pianoKey_other), einschließlich schwarzer Tasten. Keine Taste liegt dazwischen.',
    knowledgeKeyboardDefinition_wholeTone:
      'Abstand von zwei Schritten zu je einem $t(glossary:semitone_one). Auf der $t(glossary:keyboard_one) liegt genau eine Taste zwischen Start und Ziel.',
    knowledgeKeyboardDefinition_twoBlackKeys:
      'Wiederkehrende Gruppe aus zwei schwarzen Tasten. Die weiße Taste unmittelbar links davon heißt C.',
    knowledgeKeyboardDefinition_threeBlackKeys:
      'Wiederkehrende Gruppe aus drei schwarzen Tasten. Die weiße Taste unmittelbar links davon heißt F.',
    knowledgeHint_keyboard:
      'Nutze die Gruppen schwarzer Tasten als Orientierung und zähle alle Tastenschritte, auch über schwarze Tasten.',
    knowledge_pulse_pulse: '$t(glossary:pulse)',
    knowledge_pulse_rhythm: '$t(glossary:rhythm_one)',
    knowledge_pulse_metronome: '$t(glossary:metronome_one)',
    knowledge_pulse_countIn: '$t(glossary:countIn)',
    knowledge_tempo_tempo: '$t(glossary:tempo)',
    knowledge_tempo_bpm: '$t(glossary:beatsPerMinute)',
    knowledge_tempo_faster: 'Höheres $t(glossary:tempo)',
    knowledge_tempo_slower: 'Niedrigeres $t(glossary:tempo)',
    knowledge_beatGroup_first: 'Erster $t(glossary:beat_one)',
    knowledge_beatGroup_duple: '$t(glossary:beatGroup_one) aus zwei Schlägen',
    knowledge_beatGroup_triple: '$t(glossary:beatGroup_one) aus drei Schlägen',
    knowledge_beatGroup_quadruple: '$t(glossary:beatGroup_one) aus vier Schlägen',
    knowledgeDefinition_pulse_pulse:
      'Gleichmäßiger Grundschlag, der beim Musizieren als zeitliche Orientierung dient. Seine Abstände bleiben hier gleich.',
    knowledgeDefinition_pulse_rhythm:
      'Die zeitliche Folge von klingenden Ereignissen und Pausen. Sie kann lange und kurze Dauern enthalten, während der Grundschlag gleichmäßig weiterläuft.',
    knowledgeDefinition_pulse_metronome:
      'Gerät oder App, die gleichmäßige Klicks in einer gewählten Geschwindigkeit erzeugt.',
    knowledgeDefinition_pulse_countIn:
      'Gleichmäßiger Vorlauf vor dem eigenen Einsatz. Er macht Geschwindigkeit und Beginn gemeinsam hörbar.',
    knowledgeDefinition_tempo_tempo:
      'Geschwindigkeit des Grundschlags. Sie bestimmt, wie schnell die gleichmäßigen Klicks aufeinanderfolgen.',
    knowledgeDefinition_tempo_bpm:
      'Einheit für die Anzahl der Grundschläge in einer Minute. Bei 60 liegt zwischen zwei Klicks eine Sekunde.',
    knowledgeDefinition_tempo_faster:
      'Mehr Grundschläge pro Minute als zuvor: Die Abstände zwischen den Klicks werden kürzer.',
    knowledgeDefinition_tempo_slower:
      'Weniger Grundschläge pro Minute als zuvor: Die Abstände zwischen den Klicks werden länger.',
    knowledgeDefinition_beatGroup_first:
      'Hier die betonte Zählposition, bei der eine neue Gruppe beginnt. Gezählt wird wieder ab 1; der zeitliche Abstand bleibt gleich.',
    knowledgeDefinition_beatGroup_duple:
      'Wiederkehrendes Zählmuster 1–2, 1–2. Nach der zweiten Position beginnt die nächste Gruppe.',
    knowledgeDefinition_beatGroup_triple:
      'Wiederkehrendes Zählmuster 1–2–3, 1–2–3. Nach der dritten Position beginnt die nächste Gruppe.',
    knowledgeDefinition_beatGroup_quadruple:
      'Wiederkehrendes Zählmuster 1–2–3–4, 1–2–3–4. Nach der vierten Position beginnt die nächste Gruppe.',
    knowledgeHint_pulse:
      'Unterscheide gleichmäßige Orientierung, die Folge von Klängen und Pausen, das Klickgerät und den Vorlauf vor dem Einsatz.',
    knowledgeHint_tempo:
      'Vergleiche Geschwindigkeit, ihre Einheit und die Änderung der Klickabstände: mehr Schläge pro Minute bedeuten kürzere Abstände.',
    knowledgeHint_beatGroup:
      'Zähle jede Position einmal. Nach dem Gruppenende folgt wieder 1; die Betonung verändert nicht den Zeitabstand.',
    type_PULSE_TAP: '$t(glossary:pulse) mittippen',
    question_PULSE_TAP:
      'Tippe nach dem $t(glossary:countIn) auf jeden Klick: {{count}} gleichmäßige Schläge bei {{bpm}} Schlägen pro Minute. Höre zuerst eine ganze Gruppe; bei der nächsten 1 beginnt deine Aufnahme.',
    pulseDescription:
      '{{count}} gleichmäßige Zählpositionen bei {{bpm}} Schlägen pro Minute. Die erste Position ist betont; alle Zeitabstände sind gleich.',
    pulseGroup: '{{count}} Schläge · {{bpm}} BPM · 1 beginnt die Gruppe',
    pulseHint1:
      'Höre zuerst die ganze Einzählgruppe. Tippe ab der nächsten betonten 1 auf jeden Klick, auch auf die unbetonten.',
    pulseHint2:
      'Tippe genau {{count}} Mal in gleichmäßigen Abständen bei {{bpm}} Schlägen pro Minute. Gedrückthalten zählt als ein Anschlag.',
    pulseExplanation:
      '{{matched}} von {{total}} Schlägen innerhalb von ±{{tolerance}} ms; {{missing}} fehlen oder liegen außerhalb, {{extra}} sind zusätzlich. {{pattern}} Tippe jeden Klick einmal. Die betonte 1 ist nicht länger als die anderen Schläge.',
    pulsePattern: 'Schläge nach Aufnahmebeginn: {{times}} ms.',
    pulseTapHint:
      'Tippe auf jeden Klick. Mit der Tastatur: Leertaste oder Enter auf diesem Knopf. Gedrückthalten zählt einmal.',
    pulseWindow:
      'Toleranz: ±{{tolerance}} ms. Bewertet wird der Anschlagbeginn, nicht die Dauer des Gedrückthaltens.',
    pulseTarget: 'Schlag {{index}}: {{time}} ms',
    knowledgeRaises: 'Erhöht einen Stammton um {{distance}}.',
    knowledgeLowers: 'Erniedrigt einen Stammton um {{distance}}.',
    knowledgeNatural:
      'Hebt eine geltende Alteration auf und stellt die natürliche Tonhöhe des Stammtons her.',
    knowledgeDuration: 'Wert: {{value}} × $t(glossary:notes.whole_one).',
    knowledgeInterval: 'Umfasst {{positions}} (Start und Ziel mitgezählt) und {{distance}}.',
    knowledgePositions_one: '{{count}} Stammtonstufe',
    knowledgePositions_other: '{{count}} Stammtonstufen',
    knowledgeTriad:
      '$t(glossary:triad_one) in Terzschichtung: Die Töne liegen {{pattern}} $t(glossary:semitone_other) über dem $t(glossary:root_one).',
    knowledgeTriad_major: '$t(glossary:major)-$t(glossary:triad_one)',
    knowledgeTriad_minor: '$t(glossary:minor)-$t(glossary:triad_one)',
    knowledgeTriad_diminished: 'Verminderter $t(glossary:triad_one)',
    knowledgeTriad_augmented: 'Übermäßiger $t(glossary:triad_one)',
    knowledgeScale:
      '$t(glossary:scale_one) aufwärts: Die aufeinanderfolgenden Schritte über eine Oktave zählen {{pattern}} $t(glossary:semitone_other).',
    knowledgeMeter:
      '{{count}} Grundschläge pro $t(glossary:measure_one), jeweils im Wert {{beat}}. Gruppierung in Nenner-Einheiten: {{groups}}.',
    knowledgeHint_accidentals:
      'Vergleiche Erhöhen, Erniedrigen und Aufheben einer Alteration. $t(glossary:sharp_other) und $t(glossary:flat_other) verändern die natürliche Tonhöhe um einen $t(glossary:semitone_one), doppelte Zeichen um zwei.',
    knowledgeHint_noteValues:
      'Bezug für die Brüche: $t(glossary:notes.whole_one). Eine Punktierung verlängert den unpunktierten Wert um seine Hälfte.',
    knowledgeHint_intervals:
      'Zähle die Stammtöne einschließlich Start und Ziel und zusätzlich die Halbtonabstände. Gleich viele Halbtöne allein bestimmen die Schreibweise nicht.',
    knowledgeHint_triads:
      'Betrachte Grundton, Terz und Quinte in Terzschichtung. Vergleiche die Halbtonabstände vom Grundton aus.',
    knowledgeHint_scales:
      'Vergleiche die Folge der Halbtonschritte aufwärts. Klassisch melodisches Moll wird hier ausdrücklich in seiner Aufwärtsform betrachtet.',
    knowledgeHint_meters:
      'Unterscheide die Anzahl der Nenner-Einheiten von der Anzahl der Grundschläge. In Taktarten mit dreigeteilter Zählzeit (6/8, 9/8, 12/8) bilden drei Nenner-Einheiten einen Grundschlag.',
    knowledgeHint_pitches:
      'Vergleiche zuerst die Oktavlage und danach die Tonhöhe innerhalb der Oktave. Der deutsche Ton H entspricht dem englischen B.',
    knowledgeHint2_KNOWLEDGE_MC:
      'Grenze deine Auswahl auf diese beiden Begriffe ein: {{candidates}}.',
    knowledgeHint2_MATCH: 'Beginne mit diesem Paar: {{term}} – {{definition}}',
    knowledgeHint2_ORDER: 'An erster Stelle steht: {{first}}.',
    order_noteValues_ascending: 'von kurzer zu langer Dauer',
    order_noteValues_descending: 'von langer zu kurzer Dauer',
    order_pitches_ascending: 'von tief zu hoch',
    order_pitches_descending: 'von hoch zu tief',
    orderRule_noteValues: 'Verglichen wird der vollständige Notenwert einschließlich Punktierung.',
    orderRule_pitches: 'Die Oktavlage gehört zur Tonhöhe.',
    orderExplanation: 'Die richtige Reihenfolge {{direction}} lautet: {{sequence}}. {{rule}}',
    matchSelectTerm: 'Begriff zur Bearbeitung wählen',
    matchDefinitions: 'Erklärung für {{term}} wählen',
    matchUnset: 'noch nicht zugeordnet',
    matchFilled: '{{count}} von {{total}} Begriffen zugeordnet.',
    matchClear: 'Zuordnung löschen',
    matchInstruction:
      'Wähle einen Begriff und danach eine Erklärung. Wird eine bereits verwendete Erklärung neu zugeordnet, wird ihre bisherige Zuordnung gelöst.',
    orderChoices: 'Verfügbare Angaben',
    orderAnswer: 'Deine Reihenfolge',
    orderEmpty: 'Wähle die erste Angabe aus der Auswahl.',
    orderFilled: '{{count}} von {{total}} Angaben eingeordnet.',
    orderPosition: 'Position {{index}}: {{value}}',
    orderUp: '{{value}} nach oben',
    orderDown: '{{value}} nach unten',
    orderRemove: '{{value}} entfernen',
    orderInputHint:
      'Wähle die Angaben in der gewünschten Reihenfolge. Mit den Knöpfen kannst du sie verschieben oder entfernen.',
    title: 'Musik lesen und hören',
    intro:
      'Übe Notennamen und Intervalle. Wähle eine Antwort und prüfe sie. Hinweise helfen dir Schritt für Schritt.',
    start: 'Übungssatz starten',
    restart: 'Neuen Übungssatz starten',
    noteInput: 'Noten und Klaviatur ausprobieren',
    constructionStart: 'Noten und Intervalle selbst eingeben',
    chooseSet: 'Übungssatz auswählen',
    rhythmStart: 'Rhythmus und Taktgliederung üben',
    rhythmIntro:
      'Sechs Aufgaben: Notenanfänge nach einem Einzähltakt mittippen und die Gliederung von Taktangaben bestimmen. Pausen bleiben still.',
    type_RHYTHM_TAP: '$t(glossary:rhythm_one) mittippen',
    type_METER_IDENTIFY: '$t(glossary:meter_one) gliedern',
    type_PICKUP_IDENTIFY: '$t(glossary:pickup_one) erkennen',
    question_RHYTHM_TAP:
      'Tippe jeden Notenanfang dieses Takts. Ein $t(glossary:beat_one) ist eine {{beat}}; das $t(glossary:tempo) beträgt {{bpm}} Schläge pro Minute. Nach einem Einzähltakt beginnt deine Aufnahme.',
    question_METER_IDENTIFY:
      'Wie gliedert sich diese $t(glossary:meter_one)? Wähle die Zahl der Grundschläge und ihren Notenwert.',
    question_PICKUP_IDENTIFY:
      'Ist der erste notierte Takt vor dem ersten Taktstrich ein Auftakt? Vergleiche seine Dauer mit dem folgenden vollständigen Takt.',
    pickupYes: 'Ja, ein Auftakt',
    pickupNo: 'Nein, ein vollständiger Takt',
    pickupExplanation:
      '{{meter}} fasst {{capacity}} × einen Viertelwert. Vor dem ersten Taktstrich: {{first}} × ein Viertelwert. {{answer}}. Der zweite Takt zeigt die volle Taktlänge.',
    pickupDescription:
      'Taktangabe {{meter}}. Erster Takt vor dem Taktstrich: {{events}} Danach folgt ein vollständiger Takt.',
    pickupHint1: 'Addiere nur die Notenwerte vor dem ersten Taktstrich.',
    pickupHint2:
      'Vergleiche diese Summe mit dem Zähler der Taktangabe: 2/4, 3/4 oder 4/4. Zwei Achtel ergeben einen Viertelwert.',
    pickupScroll: 'Verschiebe das Notenbild seitlich, um den ganzen folgenden Takt zu sehen.',
    meterOption: '{{count}} Grundschläge mit dem Wert {{beat}}',
    meterExplanation:
      '{{meter}}: {{count}} Grundschläge pro $t(glossary:measure_one), jeweils im Wert {{beat}}. Jeder Grundschlag wird in {{division}} gleiche Teile unterteilt. Die Gruppierung in Einheiten des Nenners ist {{groups}}. Der Zähler zählt Nenner-Einheiten, nicht immer die Grundschläge.',
    rhythmExplanation:
      '{{matched}} von {{total}} Notenanfängen innerhalb von ±{{tolerance}} ms; {{missing}} fehlen oder liegen außerhalb, {{extra}} sind zusätzlich. {{pattern}} Tippe nur die Notenanfänge; während einer Pause bleibt die Hand still. Auch ein fehlender oder zusätzlicher Anschlag zählt als Fehler.',
    rhythmPattern: 'Notenanfänge nach Taktbeginn: {{times}} ms.',
    rhythmDescription: 'Taktangabe {{meter}}. {{events}}',
    rhythmEvent: '{{index}}: {{kind}}, {{duration}}.',
    rhythmNote: 'Note',
    rhythmRest: 'Pause',
    rhythmHint1:
      'Zähle den Grundschlag weiter. Tippe nur beim Beginn einer Note, nicht für ihre gesamte Dauer. Pausen haben eine Dauer, aber keinen Anschlag.',
    rhythmHint2:
      'Dieser Takt enthält {{total}} Notenanfänge. Halte {{count}} gleichmäßige Grundschläge im Wert {{beat}} bei {{bpm}} Schlägen pro Minute.',
    meterHint1:
      'Der Zähler gibt die Zahl der Einheiten an; der Nenner ihren Notenwert. Bei 6/8, 9/8 und 12/8 gehören jeweils drei Achtel zu einem Grundschlag.',
    meterHint2: 'Gruppiere die Einheiten so: {{groups}}. Jede Gruppe bildet einen Grundschlag.',
    rhythmReady: 'Bereit zum Einzählen.',
    rhythmMode: 'Rhythmusmodus',
    rhythmMode_practice: 'Üben',
    rhythmMode_test: 'Prüfungsdurchlauf',
    rhythmPracticeIntro:
      'Übe denselben $t(glossary:measure_one) ohne Wertung. Danach beginnt die Prüfung im Originaltempo. Üben zählt als Hilfe für diese Aufgabe. Bei langsamerem Tempo kann das Zeitfenster größer sein als in der Prüfung.',
    rhythmPracticeTempo: '{{bpm}} BPM ({{percent}} %)',
    rhythmSlower: 'Langsamer −5',
    rhythmFaster: 'Schneller +5',
    rhythmLoopOn: 'Schleife an',
    rhythmLoopOff: 'Schleife aus',
    rhythmMetronomeTitle: 'Metronom beim Üben',
    rhythmMetronome: 'Metronom: {{mode}}',
    rhythmMetronome_off: 'Aus',
    'rhythmMetronome_count-in': 'Nur Einzählen',
    rhythmMetronome_through: 'Durchgehend',
    rhythmPracticeBegin: 'Übung starten',
    rhythmPracticeStop: 'Übung stoppen',
    rhythmPracticeFinished: 'Übungsrunde beendet. Du kannst erneut üben oder zur Prüfung wechseln.',
    rhythmPracticeFeedback_one:
      'Runde {{round}}: {{matched}} von {{total}} Einsätzen getroffen, {{extras}} zusätzlicher Anschlag. Ohne Wertung.',
    rhythmPracticeFeedback_other:
      'Runde {{round}}: {{matched}} von {{total}} Einsätzen getroffen, {{extras}} zusätzliche Anschläge. Ohne Wertung.',
    rhythmPreparing: 'Klang wird vorbereitet …',
    rhythmCountIn: 'Einzählen: {{current}} von {{count}}',
    rhythmRecording: 'Aufnahme: {{current}} von {{count}} Grundschlägen',
    rhythmFinished: 'Aufnahme vollständig. Du kannst sie prüfen oder neu aufnehmen.',
    rhythmBegin: 'Einzählen und aufnehmen',
    rhythmRetry: 'Neu aufnehmen',
    rhythmCancel: 'Aufnahme abbrechen',
    rhythmTap: 'Jetzt tippen',
    rhythmTapHint:
      'Tippe beim Notenanfang. Mit der Tastatur: Leertaste oder Enter auf diesem Knopf. Gedrückthalten zählt einmal.',
    rhythmTapCount_one: '{{count}} Anschlag aufgenommen.',
    rhythmTapCount_other: '{{count}} Anschläge aufgenommen.',
    rhythmWindow:
      'Toleranz: ±{{tolerance}} ms. Gemessen werden Notenanfänge, nicht die Dauer des Gedrückthaltens.',
    rhythmPreview: 'Rhythmus als Beispiel anhören',
    rhythmTarget: 'Notenanfang {{index}}: {{time}} ms',
    rhythmHit: 'getroffen, Abweichung {{offset}} ms',
    rhythmMiss: 'fehlt oder außerhalb der Toleranz',
    rhythmExtras: 'Zusätzliche Anschläge: {{times}} ms.',
    rhythmLatency:
      'Gemeldete Audio-Verzögerung: {{latency}} ms; beim Messen deiner Anschläge berücksichtigt.',
    chordStart: 'Akkorde erkennen und schreiben',
    harmonyStart: 'Harmonik und Diktat üben',
    harmonyIntro:
      'Kadenzen hören, Stufen bestimmen und kurze Melodien und Rhythmen nach Gehör eingeben.',
    type_CADENCE_IDENTIFY: 'Kadenz erkennen',
    type_FUNCTION_ANALYSIS: 'Stufe bestimmen',
    type_MELODY_DICTATION: 'Melodiediktat',
    type_RHYTHM_DICTATION: 'Rhythmusdiktat',
    question_CADENCE_IDENTIFY: 'Höre die Akkordfolge in {{key}}. Wie endet sie?',
    question_FUNCTION_ANALYSIS: 'Welche Stufe hat dieser Akkord in {{key}}?',
    question_MELODY_DICTATION:
      'Höre die Melodie und gib {{count}} Töne in der gehörten Reihenfolge ein. Der erste Ton ist C.',
    question_RHYTHM_DICTATION:
      'Höre den Rhythmus und gib die {{count}} Notenwerte in der gehörten Reihenfolge ein.',
    cadence_authentic: 'Ganzschluss (V–I)',
    cadence_plagal: 'Plagalschluss (IV–I)',
    cadence_half: 'Halbschluss (I–V)',
    cadence_deceptive: 'Trugschluss (V–vi)',
    cadenceExplanation: 'In {{key}} endet die Folge mit {{answer}}.',
    functionExplanation: 'Der Akkord gehört in {{key}} zu {{answer}}.',
    dictationExplanation: 'Gehörte Folge: {{answer}}.',
    harmonyHint1_CADENCE_IDENTIFY:
      'Zuerst erklingt der Grundakkord der Tonart als Bezug. Achte danach auf den letzten Akkord der Folge: Klingt er abgeschlossen oder offen?',
    harmonyHint2_CADENCE_IDENTIFY:
      'Ein $t(glossary:cadenceAuthentic) geht von V nach I, ein $t(glossary:cadencePlagal) von IV nach I, ein $t(glossary:cadenceHalf) endet auf V und ein $t(glossary:cadenceDeceptive) führt von V nach vi.',
    harmonyHint1_FUNCTION_ANALYSIS:
      'Bestimme zuerst den $t(glossary:root_one) des Akkords im Notenbild und nenne seinen Namen.',
    harmonyHint2_FUNCTION_ANALYSIS:
      'Zähle von der Tonika der genannten Tonart die Stufen der Tonleiter bis zum Grundton des Akkords; die Tonika ist Stufe I.',
    harmonyHint1_MELODY_DICTATION:
      'Höre die Melodie in kleinen Stücken und achte bei jedem Ton, ob er steigt, fällt oder gleich bleibt.',
    harmonyHint2_MELODY_DICTATION:
      'Bestimme jeden Ton als Schritt oder Sprung vom vorigen Ton. Der erste Ton ist C.',
    harmonyHint1_RHYTHM_DICTATION:
      'Zähle beim Hören einen gleichmäßigen Grundschlag mit und achte darauf, wie viele Anschläge zwischen den Schlägen liegen.',
    harmonyHint2_RHYTHM_DICTATION:
      'Die Notenwerte füllen zusammen genau einen $t(glossary:measure_one); vergleiche lange und kurze Töne.',
    dictationProgress: '{{count}} von {{total}} Eingaben gesetzt',
    dictationUndo: 'Letzte Eingabe entfernen',
    chordIntro:
      'Neun Aufgaben: Dur-, Moll-, verminderte und übermäßige Dreiklänge mit Umkehrungen schreiben, im Notenbild erkennen und nach Gehör bestimmen.',
    type_CHORD_BUILD: '$t(glossary:chord_other) schreiben',
    type_CHORD_IDENTIFY: '$t(glossary:chord_other) erkennen',
    question_CHORD_BUILD:
      'Schreibe diesen $t(glossary:chord_one) in enger Lage: {{name}}. Der $t(glossary:bassNote_one) {{bass}} ist vorgegeben; ergänze die zwei weiteren Töne.',
    question_CHORD_BUILD_SEVENTH:
      'Schreibe diesen Septakkord in enger Lage: {{name}}. Der Basston {{bass}} ist vorgegeben; ergänze die drei weiteren Töne.',
    question_CHORD_IDENTIFY:
      'Welchen $t(glossary:chord_one) siehst du? Bestimme den $t(glossary:root_one), die Art und die $t(glossary:inversion_one).',
    question_CHORD_AURAL:
      'Du hörst zuerst den $t(glossary:root_one) {{root}}, dann den $t(glossary:triad_one). Welche Art und $t(glossary:inversion_one) hörst du?',
    question_CHORD_AURAL_SEVENTH:
      'Du hörst zuerst den Grundton {{root}}, dann den Septakkord. Welche Art und Umkehrung hörst du?',
    chordExplanation:
      '{{name}}: {{notes}}. Vom $t(glossary:root_one) {{root}} aus liegen {{third}} und {{fifth}}. Der $t(glossary:bassNote_one) ist {{bass}}; daraus folgt {{inversion}}. Beim Schreiben zählen die vollständigen Töne einschließlich Vorzeichen und Oktave. Enge Lage bedeutet: Über dem Basston stehen die übrigen Akkordtöne in ihren nächsthöheren Lagen.',
    chordSeventhExplanation:
      '{{name}}: {{notes}}. Vom Grundton {{root}} aus liegen {{third}}, {{fifth}}{{extension}}. Der Basston ist {{bass}}; daraus folgt {{inversion}}. Beim Schreiben zählen vollständige Töne mit Vorzeichen und Oktave.',
    chordHint1:
      'Ordne die drei Stammtöne gedanklich in Terzschichtung. Der unterste Ton dieser Schichtung ist der $t(glossary:root_one). Vergleiche ihn mit dem tatsächlich tiefsten Ton: Grundton, Terz oder Quinte im Bass bestimmen die $t(glossary:rootPosition) oder $t(glossary:inversion_one).',
    chordSeventhHint1:
      'Ordne vier Akkordtöne in Terzschichtung. Grundton, Terz, Quinte oder Septime im Bass bestimmen die Umkehrung.',
    chordHint2:
      'Der $t(glossary:root_one) ist {{root}}. Von dort brauchst du {{third}} und {{fifth}}. Der vorgegebene oder gehörte $t(glossary:bassNote_one) {{bass}} zeigt dir die Lage; die übrigen Akkordtöne stehen möglichst nah darüber.',
    chordSeventhHint2:
      'Der Grundton ist {{root}}. Bestimme {{third}}, {{fifth}}{{extension}}. Der Basston {{bass}} zeigt die Umkehrung; setze die restlichen Töne möglichst nah darüber.',
    chordAuralHint1:
      'Merke dir den ersten einzelnen Ton als $t(glossary:root_one). Höre danach auf den tiefsten Ton des $t(glossary:chord_one): Vergleiche ihn mit dem Bezugston, auch über Oktaven hinweg. Grundton, Terz oder Quinte im Bass bestimmen die Lage. Die Abstände zwischen den Tönen bestimmen die Dreiklangart.',
    chordSeventhAuralHint1:
      'Merke dir den ersten Ton als Grundton. Höre dann auf den Basston und die Septime des Akkords. Vergleiche Grundton, Terz, Quinte und Septime, um die Umkehrung zu bestimmen.',
    chordPreview: 'Dein $t(glossary:chord_one)',
    chordSelectTone: 'Akkordton zur Bearbeitung wählen',
    chordTone: 'Ton {{index}}',
    chordToneEmpty: 'noch nicht gesetzt',
    chordFilled: '{{count}} von 2 Antworttönen gesetzt.',
    chordFilledSeventh: '{{count}} von 3 Antworttönen gesetzt.',
    chordInputHint:
      'Wähle Ton 2 oder 3 und setze ihn im rechten $t(glossary:measure_one). Links bleibt der $t(glossary:bassNote_one) fest. Das gemeinsame Notenbild zeigt deinen $t(glossary:chord_one). Die oberen Töne kannst du in beliebiger Reihenfolge eingeben.',
    chordInputHintSeventh:
      'Wähle Ton 2, 3 oder 4 und setze ihn im rechten $t(glossary:measure_one). Der $t(glossary:bassNote_one) bleibt fest. Die übrigen Töne kannst du in beliebiger Reihenfolge eingeben.',
    tonalityStart: 'Tonleitern und Tonarten üben',
    tonalityIntro:
      'Zwölf Aufgaben: Dur- und Molltonleitern erkennen und schreiben, Tonartvorzeichnungen bestimmen und selbst aufbauen.',
    type_SCALE_BUILD: '$t(glossary:scale_other) schreiben',
    type_SCALE_IDENTIFY: '$t(glossary:scale_other) erkennen',
    type_KEYSIG_BUILD: '$t(glossary:keySignature_other) aufbauen',
    type_KEYSIG_IDENTIFY: '$t(glossary:keySignature_other) erkennen',
    question_SCALE_BUILD:
      'Schreibe {{type}} {{direction}} ab {{tonic}}, über eine Oktave mit acht Tönen. Der erste Ton ist vorgegeben.',
    question_SCALE_IDENTIFY:
      'Welche Tonleiterart siehst du? Die Folge beginnt auf {{tonic}} und geht {{direction}}.',
    question_KEYSIG_BUILD:
      'Baue die $t(glossary:keySignature_one) für {{key}}. Wähle die Vorzeichentöne in der üblichen Notationsreihenfolge.',
    question_KEYSIG_IDENTIFY:
      'Welche Tonart in {{mode}} gehört zu dieser $t(glossary:keySignature_one)? Das Tongeschlecht ist vorgegeben.',
    scaleAscending: 'aufwärts',
    scaleDescending: 'abwärts',
    scaleExplanation:
      '{{type}} {{direction}} ab {{tonic}}: {{notes}}. Die Abstände, gezählt als $t(glossary:semitone_other), sind {{pattern}}. Reihenfolge, Schreibweise und Oktavlage gehören zur Antwort.',
    melodicDescending:
      'In der klassischen Lehre wird melodisches Moll abwärts wie natürliches Moll geschrieben. Die sechste und siebte Stufe sind dabei nicht erhöht.',
    scaleHint1:
      'Gehe die sieben Stammtöne in der gefragten Richtung durch. Ton 8 ist der Anfangston in der nächsten Oktave. Bestimme danach die Vorzeichen.',
    scaleHint2:
      'Vergleiche die Tonabstände: {{pattern}}. Jede Zahl zählt $t(glossary:semitone_other). Achte darauf, jeden Stammton in der passenden Oktave genau einmal zu schreiben, bevor du den Oktavton ergänzt.',
    signatureEmpty: 'keine Vorzeichen',
    signatureCount: '{{count}} {{sign}}',
    signatureExplanation:
      '{{key}} hat {{signature}}. Die Reihenfolge lautet: {{notes}}. Dur und die zugehörige natürliche Molltonart teilen dieselbe Vorzeichnung; das vorgegebene Tongeschlecht bestimmt hier die Antwort.',
    signatureDescription:
      '$t(glossary:keySignature_one): {{signature}}. Vorzeichentöne in Reihenfolge: {{notes}}.',
    signatureHint1:
      'Kreuz-Reihenfolge: {{sharps}}. b-Reihenfolge: {{flats}}. Beginne immer am Anfang der jeweiligen Reihe.',
    signatureHint2:
      'Die gesuchte Vorzeichnung hat {{signature}}. Lies beziehungsweise schreibe diese Töne am Anfang der passenden Vorzeichenreihe.',
    scaleDegree: 'Ton {{index}}',
    scaleSelectDegree: 'Ton zum Bearbeiten auswählen',
    scaleInputHint:
      'Wähle Ton 2 bis 8. Tippen und Ziehen im Notensystem oder die Pfeiltasten setzen die Tonhöhe. Die Vorzeichenleiste ändert den ausgewählten Ton.',
    scaleFilled: '{{count}} von 7 Antworttönen gesetzt.',
    signatureInput: 'Vorzeichen wählen',
    signatureSharp: '$t(glossary:sharp_one)',
    signatureFlat: '$t(glossary:flat_one)',
    signatureAppend: '{{note}} hinzufügen',
    signatureNoAccidentals: 'Keine Vorzeichen',
    signatureRemoveLast: 'Letztes Vorzeichen entfernen',
    signatureEntered: 'Deine Vorzeichenfolge: {{notes}}',
    signatureNothingEntered: 'Noch keine Vorzeichenfolge eingegeben.',
    constructionIntro:
      'Setze Noten, finde Tasten und baue Intervalle. Neun Aufgaben mit Hinweisen und erklärten Lösungen.',
    type_NOTE_PLACE: 'Noten setzen',
    type_KEY_FIND: 'Tasten finden',
    type_INTERVAL_BUILD: 'Intervalle aufbauen',
    question_NOTE_PLACE:
      'Schreibe {{note}} in das leere Notensystem. Achte auf Vorzeichen und Oktavlage.',
    question_KEY_FIND: 'Finde die Taste für {{note}}. Achte auf die Oktavlage.',
    question_KEY_FIND_name: 'Finde die Taste für {{note}}.',
    question_KEY_FIND_score:
      'Spiele die notierte Note auf der $t(glossary:keyboard_one). Achte auf den Tonnamen und die $t(glossary:octave_one).',
    question_INTERVAL_BUILD:
      'Schreibe den zweiten Ton: {{interval}} von {{from}} aus. Setze ihn in den leeren zweiten Takt.',
    writtenPitch:
      'Die vollständige Antwort ist {{note}}. Stammton, Vorzeichen und Oktavlage müssen stimmen; ein gleich klingender Ton mit anderer Schreibweise zählt hier nicht.',
    keyExplanation:
      'Die gesuchte Taste klingt als {{note}}. Gehe vom Stammton {{natural}} in derselben Oktave aus. {{alteration}} Gleich klingende Schreibweisen gehören zur selben Taste; eine andere Oktave zählt nicht.',
    keyNameExplanation:
      'Die gesuchte Taste klingt als {{note}}. Im gezeigten Ausschnitt gibt es den $t(glossary:naturalNote_one) {{natural}} nur einmal. Gehe von dort aus. {{alteration}} Gleich klingende Schreibweisen gehören zur selben Taste.',
    keyHint1:
      'Suche die Zweiergruppen der schwarzen Tasten: C liegt direkt links davon, D zwischen den beiden schwarzen Tasten. Zähle von dort bis zum gesuchten Stammton in der angegebenen Oktave.',
    keyNameHint1:
      'Suche die $t(glossary:twoBlackKeys_other): C liegt direkt links davon, D zwischen den beiden schwarzen Tasten. Zähle von dort bis zum gesuchten $t(glossary:naturalNote_one) im gezeigten Ausschnitt.',
    keyScoreHint1:
      'Lies zuerst den $t(glossary:clef_one) und die Position der Note, einschließlich der $t(glossary:ledgerLine_other). Bestimme dann den vollständigen Tonnamen. Suche auf der $t(glossary:keyboard_one) das C in derselben $t(glossary:octave_one) und gehe von dort zur passenden Taste.',
    keyHint2:
      'Suche zuerst {{natural}}. {{alteration}} Jeder Schritt zur unmittelbar benachbarten Taste ist ein Halbtonschritt, auch zwischen E und F sowie H und C.',
    buildHint2:
      'Der Klangabstand ist {{distance}}. Zähle zuerst die Stammtöne in der gefragten Richtung, einschließlich des Anfangstons. Passe dann das Vorzeichen des Zieltons an.',
    inputSolution: 'So sieht die Lösung aus',
    staffInputHint:
      'Tippe in den leeren Takt oder verstelle die Pause mit dem Screenreader. Ziehen verschiebt deine Note. Wähle das Vorzeichen mit der Leiste darunter.',
    back: 'Zurück zu den Übungen',
    question_NOTE_NAME: 'Wie heißt diese Note? Wähle den Namen ohne Oktavlage.',
    question_NOTE_NAME_octave:
      'Wie heißt die notierte Note einschließlich ihrer $t(glossary:octave_one)?',
    question_INTERVAL_IDENTIFY_VISUAL:
      'Welches $t(glossary:interval_one) siehst du zwischen den beiden Tönen?',
    question_INTERVAL_IDENTIFY_AURAL:
      'Welches $t(glossary:interval_one) hörst du zwischen den beiden Tönen?',
    type_NOTE_NAME: 'Notennamen',
    type_INTERVAL_IDENTIFY_VISUAL: 'Intervalle lesen',
    type_interval_number: 'Intervallnummer zählen',
    type_interval_direction: 'Richtung lesen',
    type_interval_motion: 'Wiederholung, Schritt oder Sprung',
    type_interval_semitones: 'Halbtöne zählen',
    type_interval_quality: 'Intervallqualität bestimmen',
    type_interval_perfect: 'Reine Intervalle prüfen',
    question_interval_semitones:
      'Wie viele Halbtöne liegen zwischen den beiden notierten Tonhöhen? Zähle auf der Klaviatur die Übergänge zwischen benachbarten Tasten. Die Starttaste zählt als 0.',
    question_interval_quality:
      'Wie heißt das notierte Intervall vollständig? Prüfe die Intervallnummer und den Abstand in Halbtönen.',
    question_interval_perfect:
      'Ist das notierte Intervall eine reine Quarte, reine Quinte oder reine Oktave? Prüfe Nummer und Halbtonabstand.',
    intervalPerfectYes: 'Ja, ein reines Intervall',
    intervalPerfectNo: 'Nein, hier kein reines Intervall',
    intervalReadingExplanation_semitones:
      '{{from}} → {{to}}: Abstand {{distance}}. Gezählt werden Übergänge zwischen unmittelbar benachbarten Tasten, auch über schwarze Tasten. Die Starttaste zählt als 0; zwei gleiche Tonhöhen haben Abstand 0.',
    intervalReadingExplanation_quality:
      '{{from}} → {{to}}: Stammtonfolge {{path}}, Intervallnummer {{count}}, Klangabstand {{distance}}. Nummer und Abstand zusammen ergeben {{answer}}.',
    intervalReadingExplanation_perfect:
      '{{from}} → {{to}}: Intervallnummer {{count}}, Klangabstand {{distance}}. Eine reine Quarte hat 5, eine reine Quinte 7 und eine reine Oktave 12 Halbtöne. Nummer und Abstand müssen zusammen passen. Antwort: {{answer}}.',
    intervalReadingHint_semitones_1:
      'Beginne bei der ersten markierten Taste mit 0. Jeder Übergang zur nächsten Taste zählt 1, unabhängig von der Tastenfarbe.',
    intervalReadingHint_semitones_2:
      'Zwischen E und F sowie H und C liegt keine schwarze Taste: ein Halbton. Bei den anderen benachbarten weißen Tasten liegt eine schwarze dazwischen: zwei Halbtöne.',
    intervalReadingHint_quality_1:
      'Zähle zuerst die Stammtonpositionen einschließlich Start und Ziel. Ermittle dann den Halbtonabstand beider Tonhöhen.',
    intervalReadingHint_quality_2:
      'Eine kleine Terz hat 3 Halbtöne, eine große Terz 4. Reine Quarte, Quinte und Oktave verbinden die Nummern 4, 5 und 8 mit 5, 7 und 12 Halbtönen.',
    intervalReadingHint_perfect_1:
      'Eine vierte oder fünfte Stammtonposition allein reicht nicht. Prüfe zusätzlich die Anzahl der Halbtöne.',
    intervalReadingHint_perfect_2:
      'Vergleiche Nummer und Abstand: Quarte 4 mit 5 Halbtönen, Quinte 5 mit 7, Oktave 8 mit 12. Ein Abstand von 6 Halbtönen erfüllt keine dieser Bedingungen.',
    question_interval_number:
      'Welche Intervallnummer haben die beiden notierten Töne? Zähle die Stammtöne einschließlich beider Endtöne.',
    question_interval_direction:
      'Wie bewegt sich die Tonhöhe vom ersten zum zweiten notierten Ton?',
    question_interval_motion:
      'Ist die Folge eine Tonwiederholung, ein Tonschritt oder ein Tonsprung?',
    intervalNumberOption: '{{number}} · {{name}}',
    intervalNumber1: '$t(glossary:unison_one)',
    intervalNumber2: '$t(glossary:second_one)',
    intervalNumber3: '$t(glossary:third_one)',
    intervalNumber4: '$t(glossary:fourth_one)',
    intervalNumber5: '$t(glossary:fifth_one)',
    intervalNumber6: '$t(glossary:sixth_one)',
    intervalNumber7: '$t(glossary:seventh_one)',
    intervalNumber8: '$t(glossary:octave_one)',
    intervalDirectionUp: 'Aufwärts',
    intervalDirectionDown: 'Abwärts',
    intervalDirectionSame: 'Gleiche Tonhöhe',
    intervalMotionRepeat: '$t(glossary:noteRepetition_one)',
    intervalMotionStep: '$t(glossary:melodicStep_one)',
    intervalMotionLeap: '$t(glossary:melodicLeap_one)',
    intervalReadingExplanation_number:
      '{{from}} → {{to}}: {{path}}. Beide Endpositionen gehören zur Zählung. Anzahl der Stammtonpositionen: {{count}}. Antwort: {{answer}}.',
    intervalReadingExplanation_direction:
      '{{from}} → {{to}}: Vergleiche die senkrechten Positionen der beiden Notenköpfe von links nach rechts. Antwort: {{answer}}.',
    intervalReadingExplanation_motion:
      '{{from}} → {{to}}: {{path}}. Intervallnummer {{count}}. Eine Prime ist eine Tonwiederholung, eine Sekunde ein Tonschritt; ab der Terz ist es ein Tonsprung. Antwort: {{answer}}.',
    intervalReadingHint_number_1:
      'Beginne beim ersten Ton mit 1. Jede nächste Linie oder jeder nächste Zwischenraum führt zur nächsten Zahl.',
    intervalReadingHint_number_2:
      'Zähle auch den Zielton mit. Zwei gleiche natürliche Tonhöhen bilden eine Prime mit der Nummer 1.',
    intervalReadingHint_direction_1:
      'Lies zuerst den linken, dann den rechten Notenkopf. Vergleiche ihre Höhe im System.',
    intervalReadingHint_direction_2:
      'Ein höherer zweiter Notenkopf bedeutet aufwärts, ein tieferer abwärts. Dieselbe Position bedeutet hier dieselbe Tonhöhe.',
    intervalReadingHint_motion_1:
      'Prüfe zuerst, ob beide Notenköpfe auf derselben Position liegen. Sonst zähle die Stammtonpositionen dazwischen mit.',
    intervalReadingHint_motion_2:
      'Dieselbe Tonhöhe ist eine Wiederholung; die unmittelbar nächste Stammtonposition ist ein Schritt. Werden Positionen übersprungen, ist es ein Sprung.',
    type_INTERVAL_IDENTIFY_AURAL: 'Intervalle hören',
    progress: 'Aufgabe {{current}} von {{total}}',
    progressLabel: 'Fortschritt des Übungssatzes',
    answers: 'Antwort auswählen',
    next: 'Weiter',
    finish: 'Ergebnis ansehen',
    play: 'Töne anhören',
    replay: 'Noch einmal hören',
    stop: 'Wiedergabe stoppen',
    audioError:
      'Der Klang konnte nicht gestartet werden. Versuche es noch einmal oder überspringe die Hörfragen.',
    noHearing: 'Gerade nicht hören',
    hearingPaused:
      'Hörfragen werden in diesem Übungssatz übersprungen. Mit Kopfhörern kannst du sie beim nächsten Übungssatz wieder üben.',
    headphones: 'Höre die Töne vor deiner Antwort an. Kopfhörer helfen in einer lauten Umgebung.',
    hint: 'Hinweis {{level}}',
    solution: 'Lösung erklären',
    assisted: 'Mit Hinweis beantwortet',
    hintHeading: 'Dein Hinweis',
    complete: 'Übungssatz beendet',
    summary: '{{correct}} von {{answered}} Antworten richtig.',
    independent_one: '{{count}} Antwort ohne Hinweis richtig.',
    independent_other: '{{count}} Antworten ohne Hinweis richtig.',
    assistedSummary_one: '{{count}} Aufgabe mit Hinweis beantwortet.',
    assistedSummary_other: '{{count}} Aufgaben mit Hinweis beantwortet.',
    skippedSummary_one: '{{count}} Hörfrage übersprungen; sie zählt nicht als Fehler.',
    skippedSummary_other: '{{count}} Hörfragen übersprungen; sie zählen nicht als Fehler.',
    noAnswers:
      'Du hast die Hörfragen übersprungen. Starte einen neuen Übungssatz, wenn du wieder hören kannst.',
    unknownAnswer: 'Unbekannte Antwort',
    up: 'nach oben',
    down: 'nach unten',
    atReference: 'Die Note liegt genau auf dieser Linie.',
    noteSteps_one: 'Von dort gehst du {{count}} Stammtonschritt {{direction}}.',
    noteSteps_other: 'Von dort gehst du {{count}} Stammtonschritte {{direction}}.',
    noteExplanation:
      'Im {{clef}} liegt {{reference}} auf Linie {{line}} von unten. {{steps}} {{alteration}} Die Note heißt {{answer}}.',
    alter_0: 'Ohne $t(glossary:accidental_one) bleibt der Stammton unverändert.',
    alter_1: 'Das $t(glossary:sharp_one) erhöht den Stammton um einen $t(glossary:semitone_one).',
    alter_2:
      'Das $t(glossary:doubleSharp_one) erhöht den Stammton um zwei $t(glossary:semitone_other).',
    'alter_-1':
      'Das $t(glossary:flat_one) erniedrigt den Stammton um einen $t(glossary:semitone_one).',
    'alter_-2':
      'Das $t(glossary:doubleFlat_one) erniedrigt den Stammton um zwei $t(glossary:semitone_other).',
    diatonicCount_one: '{{count}} Stammton',
    diatonicCount_other: '{{count}} Stammtöne',
    halfSteps_one: '{{count}} $t(glossary:semitone_one)',
    halfSteps_other: '{{count}} $t(glossary:semitone_other)',
    intervalExplanation:
      '{{from}} → {{to}}: {{diatonic}} einschließlich beider Töne gezählt; Klangabstand: {{distance}}. Das Intervall heißt {{answer}}.',
    noteHint1:
      'Beginne beim $t(glossary:clef_one). Zähle Linien und Zwischenräume, bevor du das $t(glossary:accidental_one) liest.',
    noteHint2:
      '{{reference}} liegt auf Linie {{line}} von unten. Jede nächste Linie oder jeder nächste Zwischenraum führt zum nächsten Stammton.',
    visualHint1:
      'Zähle zuerst die Stammtöne einschließlich beider Endtöne. Bestimme danach den Klangabstand; die Schreibweise gehört zur Lösung.',
    auralHint1:
      'Höre die beiden Töne noch einmal. Vergleiche den Klangabstand mit den Intervallen, die du schon kennst.',
    intervalHint2:
      'Der Klangabstand beträgt {{distance}}. Vergleiche ihn mit den angebotenen Antworten.',
    notationDescription: '{{clef}}. {{notes}}',
    positionBottom: 'Ton {{index}} liegt auf der untersten Linie. {{alteration}}',
    positionSteps: 'Ton {{index}}: Beginne auf der untersten Linie. {{steps}} {{alteration}}',
  },
  lesson: {
    overview:
      'Deine erste Lektion: zehn Aufgaben zum Lesen und Hören. Lerne die Grundlagen, übe mit Hinweisen und wiederhole deine Fehler mit neuen Notenbeispielen.',
    open: 'Lektion ansehen',
    openNamed: '{{title}} öffnen',
    openAnother: 'Lektion öffnen',
    taskCount_one: '{{count}} Aufgabe',
    taskCount_other: '{{count}} Aufgaben',
    exampleTempo: 'Klangbeispiel: {{bpm}} $t(glossary:notes.quarter_other) pro Minute.',
    scrollExample: 'Verschiebe das Notenbild seitlich, um alle Töne zu sehen.',
    keyboardExample: 'Klaviaturbeispiel; markierte Tasten: {{notes}}.',
    pulseExampleTempo: 'Klangbeispiel: {{bpm}} Schläge pro Minute, zwei Zählgruppen.',
    keyboardMarkers: 'Punkte markieren die Tasten des Notenbeispiels.',
    scrollKeyboardExample:
      'Verschiebe die Klaviatur seitlich, um alle beschrifteten Oktavlagen zu sehen.',
    start_one: 'Mit {{count}} Aufgabe starten',
    start_other: 'Mit {{count}} Aufgaben starten',
    restart: 'Lektion erneut üben',
    home: 'Zurück zum Lernen',
    introProgress: 'Einführung {{current}} von {{total}}',
    introNext: 'Nächste Einführungskarte',
    example: 'Klangbeispiel',
    chooseExample: 'Beispiel auswählen',
    progressLabel: 'Fortschritt der Lektion',
    hearingPaused:
      'Hörfragen werden in dieser Lektion einschließlich der Wiederholung übersprungen. Beim nächsten Durchgang kannst du mit Kopfhörern wieder hören.',
    reviewTitle: 'Übe deine Fehler noch einmal',
    reviewIntro_one:
      'Eine Aufgabe war noch nicht richtig. Du bekommst ein neues Notenbeispiel zum selben Thema. Dein Erstversuch bleibt getrennt gezählt.',
    reviewIntro_other:
      '{{count}} Aufgaben waren noch nicht richtig. Du bekommst neue Notenbeispiele zu denselben Themen. Dein Erstversuch bleibt getrennt gezählt.',
    reviewStart: 'Wiederholung starten',
    reviewProgress: 'Wiederholung {{current}} von {{total}}',
    reviewProgressLabel: 'Fortschritt der Wiederholung',
    roundEnd: 'Runde abschließen',
    complete: 'Lektion beendet',
    initialResult: 'Im Erstversuch: {{correct}} von {{answered}} richtig.',
    accuracy: 'Genauigkeit im Erstversuch: {{value}} %.',
    reviewResult_one: 'In der Wiederholung: {{correct}} von {{count}} Aufgabe richtig.',
    reviewResult_other: 'In der Wiederholung: {{correct}} von {{count}} Aufgaben richtig.',
    reviewAssisted_one: 'Eine Wiederholung mit Hinweis beantwortet.',
    reviewAssisted_other: '{{count}} Wiederholungen mit Hinweis beantwortet.',
    reviewSkipped_one: 'Eine Hörfrage in der Wiederholung ausgelassen.',
    reviewSkipped_other: '{{count}} Hörfragen in der Wiederholung ausgelassen.',
    unresolved_one:
      'Eine Aufgabe braucht noch Übung. Starte einen neuen Durchgang, wenn du bereit bist.',
    unresolved_other:
      '{{count}} Aufgaben brauchen noch Übung. Starte einen neuen Durchgang, wenn du bereit bist.',
    allResolved: 'Alle beantworteten Themen wurden richtig gelöst, teilweise in der Wiederholung.',
    duration: 'Übungszeit: {{minutes}} Min. {{seconds}} Sek.',
    saving: 'Ergebnis wird auf diesem Gerät gespeichert …',
    saved: 'Ergebnis auf diesem Gerät gespeichert.',
    saveError:
      'Dein Ergebnis wurde noch nicht gespeichert. Lass diese Seite geöffnet und versuche es erneut. Dein Erstversuch und deine Wiederholung bleiben hier sichtbar.',
    retrySave: 'Speichern erneut versuchen',
    latestTitle: 'Dein letzter Durchgang',
    latestSummary: '{{correct}} von {{answered}} im Erstversuch richtig.',
    latestReview: '{{correct}} von {{total}} Wiederholungen richtig.',
    latestDate: 'Geübt am {{date}}',
    olderVersion: 'Dieser Durchgang gehört zu einer früheren Version der Lektion.',
    loadError: 'Gespeicherte Ergebnisse konnten nicht geladen werden. Du kannst trotzdem üben.',
    retryLoad: 'Ergebnisse erneut laden',
  },
  piano: {
    settings: 'Anpassen',
    title: 'Klaviatur',
    midiDevice: 'MIDI-Keyboard',
    midiConnect: 'MIDI verbinden',
    midiIntro:
      'USB- oder bereits gekoppeltes Bluetooth-MIDI-Keyboard verbinden. Die Töne werden nur auf diesem Gerät verarbeitet.',
    midiNoDevice:
      'Noch kein MIDI-Eingabegerät gefunden. Verbinde ein Keyboard und prüfe die Kopplung.',
    midiUnavailable:
      'MIDI ist hier nicht verfügbar oder der Zugriff wurde abgelehnt. Prüfe Browser, Gerät und Berechtigungen.',
    midiConnected: 'MIDI: {{device}}',
    midiOutOfRange:
      'Diese Taste liegt außerhalb des angezeigten Ausschnitts und wurde nicht übernommen.',
    midiDisconnected: 'MIDI-Keyboard getrennt. Verbinde es erneut oder wähle ein anderes Gerät.',
    midiVelocity: 'Anschlag {{velocity}}/127',
    midiSustain: 'Sustain an',
    labels: 'Tonnamen',
    labels_none: 'Keine Beschriftung',
    labels_de: 'Deutsch (H/B)',
    labels_intl: 'International (B/B♭)',
    range: 'Tonumfang',
    range_practice: 'c¹–e²',
    range_middle: 'c–c³',
    range_full: 'Ganzes Klavier (A₂–c⁵)',
    range_fixed: 'Ausschnitt: {{from}}–{{to}}',
    eitherName: '{{sharp}} oder {{flat}}',
    smaller: '−',
    larger: '+',
    smallerHint: 'Tasten verkleinern',
    largerHint: 'Tasten vergrößern',
    lower: 'Tiefer',
    higher: 'Höher',
    moveMode: 'Verschieben',
    playMode: 'Spielen',
    playHint:
      'Berühre eine oder mehrere Tasten. Verschieben bewegt den Ausschnitt, ohne zu spielen.',
    moveHint: 'Wische nach links oder rechts. Mit Spielen schaltest du den Klang wieder ein.',
    shortcutHint:
      'Bei Fokus auf der Klaviatur: Die physischen Tasten ab A spielen c¹–e² (QWERTZ: A W S E D F T G Z H U J K O L P Ö). Tab und Leertaste oder Enter spielen einzelne Tasten.',
    shortcutFixedHint:
      'Mit fokussierter Klaviatur spielen die Buchstabentasten nur Töne im gezeigten Ausschnitt. Tab und Leertaste oder Enter spielen einzelne Tasten.',
  },
  audioTest: {
    title: 'Audio-Test',
    intro: 'Für Latenzmessungen (P1.16). Der Ton startet beim Berühren, nicht erst beim Loslassen.',
    tone: 'Ton a¹',
    chord: 'C-Dur-Dreiklang',
    sequence: 'Tonleiter mit Metronom',
    metronome: 'Metronom 90 BPM',
    stop: 'Alles stoppen',
    notStarted: 'Der Klang startet beim ersten Tippen.',
    sampleRate: 'Abtastrate: {{rate}} Hz',
    reportedLatency: 'Vom System gemeldete Latenz: {{base}} ms Verarbeitung, {{output}} ms Ausgabe',
    noReportedLatency: 'Das System meldet keine Latenz; bitte messen (siehe Anleitung).',
    piano_idle: 'Klavier: lädt beim ersten Ton.',
    piano_loading: 'Klavier wird geladen … bis dahin einfacher Klang.',
    piano_ready: 'Klavier bereit.',
    piano_error: 'Klavier konnte nicht geladen werden; einfacher Klang.',
  },
  highlight: {
    correct: 'richtig',
    wrong: 'falsch',
    active: 'ausgewählt',
  },
  common: {
    close: 'Schließen',
  },
  profile: {
    musicSettings: 'Musik und Profil',
    noteNaming: 'Tonnamen',
    names_auto: 'Wie die App-Sprache',
    names_de: 'Deutsch (H und B)',
    names_intl: 'International (B und B♭)',
    harmonySystem: 'Harmonik-System',
    harmony_functions: 'Funktionen',
    harmony_roman: 'Stufen',
    harmony_both: 'Funktionen und Stufen',
    sound: 'Klang',
    referencePitch: 'Kammerton a¹',
    hz: '{{value}} Hz',
    musicSettingsHint:
      'Tonnamen und Kammerton wirken auf neue Beispiele und Eingaben. Der Tutor berücksichtigt dein Harmonik-System, soweit die Quellen es unterstützen. Englisch (US/UK) wählst du über die App-Sprache.',
    displayName: 'Anzeigename (optional)',
    saveName: 'Anzeigenamen speichern',
    syncLoading: 'Profileinstellungen werden geladen …',
    syncError:
      'Die Profileinstellungen konnten nicht vollständig gespeichert oder synchronisiert werden. Bitte versuche es erneut.',
    syncLocal: 'Diese Einstellungen sind auf diesem Gerät gespeichert.',
    syncSaving: 'Profileinstellungen werden auf diesem Gerät gespeichert …',
    syncPending: 'Änderungen warten auf die Kontosynchronisation.',
    syncSaved: 'Profileinstellungen mit deinem Konto synchronisiert.',
    soundDisabled: 'Der Klang ist in deinen Einstellungen ausgeschaltet.',
    enableSound: 'Klang einschalten',

    settings: 'Einstellungen',
    language: 'Sprache',
    languageDevice: 'Wie das Gerät',
    appearance: 'Erscheinungsbild',
    appearanceSystem: 'Wie das Gerät',
    appearanceLight: 'Hell',
    appearanceDark: 'Dunkel',
    haptics: 'Vibration',
    reduceMotion: 'Bewegung reduzieren',
    reduceMotionHint: 'Gilt zusätzlich zur Einstellung des Geräts.',
    more: 'Mehr',
    gallery: 'Bausteine (nur Entwicklung)',
    licenses: 'Lizenzen',
    audioTest: 'Audio-Test (Messungen)',
    fsrsLicense:
      'Wiederholungsplanung: ts-fsrs 5.4.2 © 2026 Open Spaced Repetition, MIT-Lizenz. Vollständiger Lizenztext unter Recht & Informationen.',
    bravuraLicense:
      'Notenfont Bravura © Steinberg Media Technologies GmbH, SIL Open Font License 1.1',
    figtreeLicense: 'Schrift Figtree © 2022 The Figtree Project Authors, SIL Open Font License 1.1',
    accidentalsLicense:
      'Vorzeichen im Text: Teilmenge von Bravura Text © Steinberg Media Technologies GmbH, SIL Open Font License 1.1, umbenannt in Harmonia Accidentals',
    pianoLicense:
      'Klavierklang: Salamander Grand Piano von Alexander Holm, CC BY 3.0 (creativecommons.org/licenses/by/3.0). Bearbeitet: Auswahl, gekürzt, Mono, Stimmung ausgeglichen.',
  },
  path: {
    title: 'Dein Lernpfad',
    overview:
      '{{completed}} von {{total}} Einheiten bestanden · {{tested}} durch Einstufung getestet',
    rule: 'Bestehen: mindestens {{percent}} % richtige Erstversuchsantworten. Hinweise 1–2 sind erlaubt; Lösungen und ausgelassene Aufgaben zählen nicht als richtig.',
    loading: 'Lernpfad wird geladen …',
    loadError:
      'Der Lernpfad konnte nicht geladen werden. Versuche es erneut oder lerne vorübergehend ohne Speicherung.',
    guest:
      'Fortschritt auf diesem Gerät gespeichert. Mit einem Konto kannst du ihn synchronisieren.',
    syncing: 'Fortschritt wird synchronisiert …',
    syncError:
      'Synchronisation fehlgeschlagen. Deine Ergebnisse bleiben auf diesem Gerät. Bei Verbindung wird erneut synchronisiert.',
    synced: 'Fortschritt mit deinem Konto synchronisiert.',
    syncNow: 'Jetzt synchronisieren',
    outdated:
      'Einige gespeicherte Versuche stammen aus einer anderen Inhaltsversion. Sie bleiben erhalten, schalten diese Version aber nicht frei.',
    areas: 'Lernbereich',
    allAreas: 'Alle Bereiche',
    areaHint:
      'Du kannst den Bereich jederzeit wechseln. Voraussetzungen können auch aus anderen Bereichen stammen.',
    allLevels: 'Alle Stufen',
    level: 'Stufe {{level}}',
    unitPosition: 'Einheit {{count}} · Stufe {{level}}',
    status_locked: 'Gesperrt',
    status_open: 'Offen',
    status_completed: 'Bestanden',
    status_tested: 'Durch Einstufung getestet',
    unitProgress: 'Bestandene Lektionen',
    lessonProgress: '{{completed}} von {{total}} Lektionen bestanden',
    testedHint:
      'Durch deine Einstufung zugänglich. Die Lektionen kannst du jederzeit üben; sie zählen erst nach einem bestandenen Versuch als bestanden.',
    prerequisite: 'Voraussetzung: {{title}}',
    showLessons: 'Lektionen anzeigen',
    hideLessons: 'Lektionen ausblenden',
    showNamed: 'Lektionen in {{title}} anzeigen',
    hideNamed: 'Lektionen in {{title}} ausblenden',
    lessonLocked:
      'Diese Lektion ist noch gesperrt. Bestehe zuerst die vorherigen Lektionen und die Voraussetzungen im Lernpfad.',
    passed: 'Bestanden: {{correct}} von {{total}} Aufgaben zählen für die Freischaltung.',
    failed:
      'Noch nicht bestanden: {{correct}} von {{total}} Aufgaben zählen. Für die Freischaltung brauchst du mindestens {{percent}} %.',
    resultHint:
      'Die Fehlerwiederholung verändert die Erstversuchsquote nicht. Ein früherer bestandener Versuch bleibt gültig.',
  },
  gallery: {
    contextQuestion: 'Quellenbezogene Aufgabe',
    grandStaff: '$t(glossary:grandStaff_one): Lernbild',
    durationSymbols: 'Notenwerte und Pausen',
    keyboardExample: '$t(glossary:keyboard_one): Lernbeispiel',
    pulseExample: '$t(glossary:pulse): Zählgruppen',
    title: 'Bausteine',
    intro: 'Alle Grundbausteine des Design-Systems. Nur in Entwicklungsbuilds.',
    preview: 'Vorschau',
    text: 'Schrift',
    sampleDisplay: 'Lektion geschafft!',
    sampleTitle: 'Welches Intervall hörst du?',
    sampleBody: 'Setze eine Note eine große Terz über c¹.',
    sampleMuted: 'Runde 3 von 4 · etwa 4 Minuten',
    sampleAccidentals: 'Fis und Ges klingen gleich, werden aber verschieden notiert: F♯ und G♭.',
    buttons: 'Knöpfe',
    primary: 'Prüfen',
    secondary: 'Noch mal hören',
    ghost: 'Überspringen',
    success: 'Weiter',
    danger: 'Verstanden',
    disabled: 'Gesperrt',
    progress: 'Fortschritt',
    progressValue: '{{done}} von {{total}}',
    more: 'Eine Runde weiter',
    feedback: 'Rückmeldung',
    correctMessage: 'c¹–e¹ ist eine große Terz: drei Stammtöne, vier $t(glossary:semitone_other).',
    wrongMessage:
      'c¹–es¹ ist eine kleine Terz. Für die große Terz fehlt ein $t(glossary:semitone_one).',
    replay: 'Noch mal anhören',
    card: 'Karte',
    cardText: 'Karten tragen Inhalte wie Notenbilder oder Statistiken.',
    list: 'Listen und Schalter',
    sheet: 'Blatt von unten',
    openSheet: 'Blatt öffnen',
    sheetTitle: 'Erscheinungsbild',
    sheetText: 'Hier stehen Auswahl oder Details. Schließen per Knopf, Tippen daneben oder Zurück.',
  },
  analytics: {
    choiceTitle: 'Freiwillige Nutzungsstatistik',
    choiceBody:
      'Mit deiner Zustimmung wertet Harmonia im eigenen Supabase-System App-Nutzungstage, Onboarding, Lektionsstarts und bestätigte Abschlüsse, Paywall-Aufrufe, bestätigte Käufe sowie Tutor-Anfragen und deren Kosten aus. Dazu gehören Konto-Zuordnung, Sprache, Plattform und Ereigniszeit. Antworten, Tutor-Texte, E-Mail-Adressen und Werbe-IDs gehören nicht zu diesen Statistiken. Nur für angemeldete Konten; keine rückwirkende Erfassung. Die Beobachtung endet spätestens nach zwölf Monaten. Widerruf stoppt die Erfassung sofort auf diesem Gerät; nach Synchronisation werden die bisherigen Analytics-Daten deines Kontos gelöscht. Du kannst ohne Zustimmung genauso lernen.',
    allow: 'Nutzungsstatistik erlauben',
    unavailable: 'Die Erfassung ist bis zur rechtlichen Freigabe ausgeschaltet.',
    accountOnly:
      'Gäste werden nicht erfasst. Die freiwillige Wahl ist nach der Anmeldung und rechtlichen Freigabe verfügbar.',
  },
  quality: {
    failureTitle: 'Hier ist etwas schiefgelaufen.',
    failureBody:
      'Versuche, die Ansicht erneut zu öffnen. Deine gespeicherten Lernstände werden dabei nicht gelöscht.',
    retryFailed: 'Die Ansicht konnte noch nicht geöffnet werden. Bitte versuche es später erneut.',
    notFound: 'Diese Seite gibt es nicht.',
    notFoundBody: 'Du kannst zu deinem Lernbereich zurückkehren.',
    home: 'Zum Lernbereich',
  },
} as const;

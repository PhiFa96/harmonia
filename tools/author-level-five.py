"""Materialise the internal P4.19 draft without changing earlier content records."""
from __future__ import annotations

import json
from pathlib import Path
from level_five_data import CONCEPTS, DEFINITIONS, UNITS

ROOT = Path(__file__).resolve().parents[1]
VERSION = 21
AREAS = {
    "counterpoint": ("Kontrapunkt", "Counterpoint"),
    "contemporary": ("Musik des 20. und 21. Jahrhunderts", "Music of the twentieth and twenty-first centuries"),
    "world": ("Musik anderer Kulturen", "Music of other cultures"),
}

# question, hint 1, hint 2, explanation. Definitions never contain a stored answer.
QUESTIONS = {
    "counterpoint-consonance": (
        ["Ist dieses Intervall im zweistimmigen Modell der ersten Gattung konsonant?", "Lies beide Töne samt Vorzeichen und bestimme das geschriebene Intervall.", "Reine Primen, Quinten und Oktaven sowie kleine/große Terzen und Sexten zählen; Quarten und übermäßige/verminderte Intervalle nicht.", "Die Prüfung berücksichtigt Stammtonabstand und Vorzeichen. Enharmonisch gleicher Klang ersetzt die Intervallschreibweise nicht."],
        ["Is this interval consonant in the two-part first-species model?", "Read both notes and accidentals, then identify the spelled interval.", "Perfect unisons, fifths and octaves and minor/major thirds and sixths count; fourths and augmented/diminished intervals do not.", "The check uses both letter distance and accidentals. Enharmonic sound equivalence does not replace interval spelling."]),
    "counterpoint-motion": (
        ["Wie bewegen sich Unter- und Oberstimme von Takt 1 zu Takt 2?", "Verfolge zunächst nur die jeweils tiefere Note.", "Vergleiche dann die obere Note: beide gleichgerichtet, entgegengesetzt, eine liegend oder beide unverändert?", "Die Bewegungsart folgt aus den Richtungen beider Stimmen. Gleichgerichtet schließt in dieser Aufgabe parallele Bewegung ein."],
        ["How do the lower and upper parts move from bar 1 to bar 2?", "First follow only the lower note in each bar.", "Then compare the upper note: same direction, opposite directions, one held, or both unchanged?", "Motion follows from the direction of each part. Similar motion in this task includes parallel motion."]),
    "counterpoint-check": (
        ["Besteht dieses 1:1-Kurzmodell die neun Regeln des Übungsprofils? Cantus unten; keine vollständige Stilbewertung.", "Prüfe erst die vertikalen Intervalle sowie Anfang und Schluss.", "Prüfe Konsonanz, Kreuzung, innere Prime, Abstand, perfekte Folgen, direkte Perfektionen, Überlappung, Randintervalle und Schlussbewegung.", "{{findings}} Ein Ergebnis ohne Befund gilt nur für diese neun Regeln; Modus, Melodieführung und vollständige Singbarkeit bleiben gesondert zu prüfen."],
        ["Does this short 1:1 model pass the exercise profile's nine rules? Cantus below; not a complete stylistic assessment.", "First check the vertical intervals, opening and ending.", "Check consonance, crossing, interior unisons, spacing, consecutive perfect classes, direct perfect consonances, overlap, boundary intervals and closing motion.", "{{findings}} No finding applies only to these nine rules; mode, melodic shape and complete singability still need separate assessment."]),
    "motif-transform": (
        ["Welche Operation bildet Takt 1 auf Takt 2 ab? Vergleiche gerichtete Halbtonabstände; zusätzliche Transposition ist erlaubt.", "Notiere die aufeinanderfolgenden Halbtonabstände des ersten Motivs mit Richtung.", "T erhält die Abstände, I spiegelt sie; R liest die Tonfolge rückwärts, RI verbindet beides. Alle Dauern sind gleich.", "Die eindeutige Operation wird aus beiden notierten Motiven berechnet. Dies ist ein chromatisches Modell, keine automatische tonale Deutung."],
        ["Which operation maps bar 1 to bar 2? Compare directed semitone intervals; an additional transposition is allowed.", "List the successive semitone intervals of the first motive with their directions.", "T preserves intervals, I reflects them; R reverses the pitch sequence, and RI combines both. All durations are equal.", "The unique operation is calculated from both written motives. This is a chromatic model, not an automatic tonal interpretation."]),
    "form-sections": (
        ["Welches Buchstabenschema ergibt sich, wenn jeder Takt ein Abschnitt ist und nur exakte Tonhöhen- und Rhythmusgleichheit zählt?", "Nenne den ersten Takt A und vergleiche jeden späteren Takt vollständig mit ihm.", "Ein neuer Takt erhält den nächsten Buchstaben; eine exakte Wiederkehr erhält den bereits vergebenen. Transposition zählt hier als Änderung.", "Das Schema beschreibt die vorgegebenen Abschnitte. Es bestimmt allein weder eine historische Form noch die Funktion der Abschnitte."],
        ["Which letter scheme results if each bar is a section and only exact pitch and rhythm identity counts?", "Call the first bar A and compare each later bar fully with it.", "A new bar receives the next letter; an exact return receives its earlier letter. Transposition counts as a change here.", "The scheme describes the supplied sections. By itself it identifies neither a historical form nor the sections' functions."]),
    "row-validity": (
        ["Enthält die notierte Zwölftonfolge jede der zwölf Tonklassen genau einmal? C = 0; Oktavlage und enharmonische Schreibweise zählen nicht extra.", "Zähle erst die zwölf Noten, dann die verschiedenen Tonklassen.", "Suche nach einer wiederholten Tonklasse; dann fehlt mindestens eine andere.", "Geprüft werden zwölf Positionen und zwölf verschiedene Tonklassen. Das ist eine Reihenprüfung, keine Stilzuordnung eines Werks."],
        ["Does the written twelve-note sequence contain each of the twelve pitch classes exactly once? C = 0; register and enharmonic spelling do not count separately.", "Count the twelve notes, then the distinct pitch classes.", "Look for a repeated pitch class; at least one other class is then missing.", "The check requires twelve positions and twelve distinct pitch classes. It validates a row, not a work's style."]),
    "row-transform": (
        ["Welche Operation bildet die Reihe in Takt 1–3 auf Takt 4–6 ab? Rechne modulo zwölf; zusätzliche Transposition ist erlaubt.", "Schreibe beide Reihen als geordnete Tonklassenzahlen mit C = 0.", "Vergleiche T, I, R und RI. Bei I werden die gerichteten Tonklassenabstände gespiegelt; R kehrt die Reihenfolge um.", "Die Operation folgt aus allen zwölf Positionen beider Reihen. Oktavlage und enharmonische Schreibweise werden für diese Rechnung ausgeblendet."],
        ["Which operation maps the row in bars 1–3 to bars 4–6? Work modulo twelve; an additional transposition is allowed.", "Write both rows as ordered pitch-class numbers with C = 0.", "Compare T, I, R and RI. I reflects directed pitch-class intervals; R reverses the order.", "The operation follows from all twelve positions of both rows. Register and enharmonic spelling are disregarded in this calculation."]),
    "set-cardinality": (
        ["Wie viele verschiedene Tonklassen enthält dieses Material unter Oktav- und enharmonischer Äquivalenz?", "Ordne jeder Note eine Tonklasse zwischen 0 und 11 zu.", "Entferne Wiederholungen und Oktavverdopplungen, bevor du zählst.", "Die Mächtigkeit zählt verschiedene Tonklassen, nicht Notenereignisse oder Stimmen."],
        ["How many distinct pitch classes does this material contain under octave and enharmonic equivalence?", "Assign each note a pitch class from 0 to 11.", "Remove repetitions and octave doublings before counting.", "Cardinality counts distinct pitch classes, not note events or parts."]),
    "set-vector": (
        ["Welcher Intervallklassenvektor gehört zur Tonklassenmenge? Lies die sechs Einträge als Klassen 1 bis 6.", "Entferne zuerst doppelte Tonklassen.", "Zähle jedes ungeordnete Paar einmal. Verwende den kürzeren Abstand auf dem Zwölferkreis und sammle die Anzahlen für 1 bis 6.", "Die sechs Werte zählen die ungeordneten Paare verschiedener Tonklassen. Notenwiederholungen werden nicht mitgezählt."],
        ["Which interval-class vector belongs to the pitch-class set? Read the six entries as classes 1 through 6.", "First remove repeated pitch classes.", "Count each unordered pair once. Use the shorter distance around the twelve-position circle and collect the counts for 1 through 6.", "The six values count unordered pairs of distinct pitch classes. Repeated notes are not counted again."]),
    "minimal-phase": (
        ["Um wie viele Pulse wurde die Viererfolge aus Takt 1 für Takt 2 zyklisch nach links verschoben?", "Suche den ersten Ton des zweiten Taktes im ersten Takt.", "Lies von dort weiter und setze am Ende vorn fort. Es kommen keine neuen Tonhöhen hinzu.", "Die Verschiebung wird aus den beiden vollständigen Folgen berechnet. Dies modelliert ganze Pulsschritte, kein kontinuierliches Phasing."],
        ["By how many pulses was the four-element sequence in bar 1 rotated cyclically left to form bar 2?", "Find the first note of the second bar in the first bar.", "Continue from there, wrapping to the beginning at the end. No new pitches are added.", "The rotation is calculated from both complete sequences. This models whole-pulse shifts, not continuous phasing."]),
}

LABELS = {
    "levelFiveTitle": ("Stufe 5: Kontrapunkt und Analyse", "Stage 5: counterpoint and analysis"),
    "levelFiveDraft": ("Interner Entwurf – unabhängige Fachprüfung und formale Phase-4-Freigabe stehen aus.", "Internal draft – independent specialist review and formal Phase 4 approval remain outstanding."),
    "levelFiveInternal": ("Diese Vorschau speichert keinen Lernfortschritt und vergibt keine XP. Beim Verlassen endet der Durchgang.", "This preview saves no learning progress and awards no XP. Leaving ends the session."),
    "levelFiveOpen": ("Stufe-5-Entwurf öffnen", "Open the Stage 5 draft"),
    "levelFiveLesson": ("Entwurfslektion öffnen", "Open draft lesson"),
    "levelFiveNext": ("Weiter", "Continue"),
    "levelFiveReview": ("Wiederhole die noch offenen Aufgaben mit verändertem Material.", "Review the unresolved questions with changed material."),
    "levelFiveReviewStart": ("Wiederholung starten", "Start review"),
    "levelFiveDone": ("Durchgang beendet: {{correct}} von {{total}} im ersten Durchgang richtig; nach Wiederholung noch {{remaining}} offen. Kein Lernfortschritt gespeichert.", "Session complete: {{correct}} of {{total}} correct in the first round; {{remaining}} unresolved after review. No learning progress saved."),
    "levelFiveBack": ("Zur Entwurfsübersicht", "Back to draft overview"),
    "analysisTransform_T": ("T – Transposition", "T – transposition"),
    "analysisTransform_I": ("I – Umkehrung", "I – inversion"),
    "analysisTransform_R": ("R – Krebs", "R – retrograde"),
    "analysisTransform_RI": ("RI – Krebsumkehrung", "RI – retrograde inversion"),
    "analysisMotion_contrary": ("Gegenbewegung", "Contrary motion"),
    "analysisMotion_similar": ("Gleichgerichtete Bewegung (einschließlich parallel)", "Similar motion (including parallel)"),
    "analysisMotion_oblique": ("Seitenbewegung", "Oblique motion"),
    "analysisMotion_static": ("Beide Stimmen unverändert", "Both parts unchanged"),
    "analysisCardinality": ("{{count}} verschiedene Tonklassen", "{{count}} distinct pitch classes"),
    "analysisVector": ("Vektor ⟨{{vector}}⟩", "Vector ⟨{{vector}}⟩"),
    "analysisSections": ("Abschnittsfolge {{sections}}", "Section pattern {{sections}}"),
    "analysisRotation": ("{{count}} Pulse nach links", "{{count}} pulses to the left"),
    "counterpointFinding": ("Takt {{measure}}: {{rule}}.", "Bar {{measure}}: {{rule}}."),
    "counterpointNoFinding": ("Kein Befund in den neun geprüften Regeln.", "No finding in the nine checked rules."),
    "counterpointRule_consonance": ("nicht zugelassene Konsonanz", "not an allowed consonance"),
    "counterpointRule_crossing": ("Stimmkreuzung", "voice crossing"),
    "counterpointRule_interior-unison": ("Prime im Inneren", "interior unison"),
    "counterpointRule_spacing": ("Abstand größer als reine Duodezime", "spacing exceeds a perfect twelfth"),
    "counterpointRule_consecutive-perfect": ("aufeinanderfolgende gleiche perfekte Intervallklasse", "consecutive identical perfect interval class"),
    "counterpointRule_direct-perfect": ("perfekte Konsonanz in gleichgerichteter Bewegung erreicht", "perfect consonance approached in similar motion"),
    "counterpointRule_overlap": ("Stimmüberlappung", "voice overlap"),
    "counterpointRule_boundary": ("unzulässiges Anfangs- oder Schlussintervall", "invalid opening or closing interval"),
    "counterpointRule_closing-motion": ("Schluss ohne die geforderte schrittweise Gegenbewegung aus kleiner Terz oder großer Sexte", "ending lacks the required contrary steps from a minor third or major sixth"),
}

def meta(id_, title):
    return {"id": id_, "contentVersion": VERSION, "status": "entwurf", "titleKey": title}

def main():
    catalogue_path = ROOT / "packages/content/src/catalogue.json"
    plan_path = ROOT / "packages/content/src/curriculum-plan.json"
    texts_path = ROOT / "packages/i18n/src/authored-content.json"
    catalogue, plan, texts = [json.loads(path.read_text()) for path in (catalogue_path, plan_path, texts_path)]
    if catalogue["contentVersion"] not in (20, VERSION):
        raise ValueError("P4.19 expects catalogue version 20 or 21")
    catalogue["contentVersion"] = plan["contentVersion"] = VERSION
    plan["scopeLevels"] = [1, 2, 3, 4, 5]
    unit_ids = {u[0] for u in UNITS}
    level_ids = {f"{u[2]}.level-5" for u in UNITS}
    def introduced(id_):
        return id_ in level_ids or id_ in {f"area.{a}" for a in AREAS} or id_ in unit_ids or any(id_.startswith(f"{unit}.") for unit in unit_ids)
    for collection in ("areas", "levels", "units", "skills", "exerciseSets", "knowledgeCards", "knowledgeArticles", "lessons"):
        catalogue[collection] = [r for r in catalogue[collection] if not introduced(r["id"])]
    plan["units"] = [u for u in plan["units"] if u["unitId"] not in unit_ids]
    for area in AREAS:
        catalogue["areas"].append(meta(f"area.{area}", f"content.levelFive.areas.{area}"))
    for area in dict.fromkeys(u[2] for u in UNITS):
        catalogue["levels"].append({**meta(f"{area}.level-5", "content.levelFive.levelTitle"), "areaId": f"area.{area}", "number": 5})
    exercise_texts = {}
    for locale in texts:
        index = 0 if locale == "de" else 1
        texts[locale]["levelFive"] = {"levelTitle": "Hochschule – Grundlagen" if index == 0 else "University studies – foundations", "areas": {area: titles[index] for area, titles in AREAS.items()}, "units": {}}
        exercise_texts[locale] = {key: values[index] for key, values in LABELS.items()}
        for topic, languages in QUESTIONS.items():
            for key, value in zip(("Question", "Hint1", "Hint2", "Explain"), languages[index]):
                exercise_texts[locale][f"context{key}_{topic}"] = value
    for unit_id, slug, area, title_de, title_en, prerequisites, topics in UNITS:
        base = f"content.levelFive.units.{slug}"
        skills = [f"{unit_id}.s{i}" for i in (1, 2, 3)]
        catalogue["units"].append({**meta(unit_id, f"{base}.unitTitle"), "levelId": f"{area}.level-5"})
        plan["units"].append({"unitId": unit_id, "skillIds": skills})
        for index, skill in enumerate(skills):
            catalogue["skills"].append({**meta(skill, f"{base}.skill{index+1}"), "areaId": f"area.{area}", "prerequisites": prerequisites if index == 0 else [skills[index-1]]})
        cards, sections = [], []
        for index, (kind, de, en, body_de, body_en, score, caption_de, caption_en) in enumerate(CONCEPTS[slug]):
            example = {"score": score, "captionKey": f"{base}.{kind}Caption"}
            card_id = f"{unit_id}.card-{kind.lower()}"
            catalogue["knowledgeCards"].append({**meta(card_id, f"{base}.{kind}Title"), "skillIds": [skills[min(index, 2)]], "bodyKey": f"{base}.{kind}Body", "examples": [example]})
            cards.append(card_id)
            sections.append({"headingKey": f"{base}.{kind}Title", "bodyKey": f"{base}.{kind}Body", "examples": [example]})
        catalogue["knowledgeArticles"].append({**meta(f"{unit_id}.article", f"{base}.unitTitle"), "skillIds": skills, "sections": sections})
        for locale in texts:
            de = locale == "de"
            target = texts[locale]["levelFive"]["units"][slug] = {"unitTitle": title_de if de else title_en}
            titles = ["Begriffe und Modell", "Beispiele untersuchen", "Anwenden und Grenzen begründen"] if de else ["Terms and model", "Investigate examples", "Apply and justify limits"]
            for i, title in enumerate(titles, 1):
                target[f"skill{i}"] = f"{title_de if de else title_en}: {title}"
                target[f"lesson{i}"] = title
            for kind, title_de_, title_en_, body_de, body_en, _, caption_de, caption_en in CONCEPTS[slug]:
                target[f"{kind}Title"] = title_de_ if de else title_en_
                target[f"{kind}Body"] = body_de if de else body_en
                target[f"{kind}Caption"] = caption_de if de else caption_en
                exercise_texts[locale][f"knowledgeHistory_{slug}_{kind}"] = target[f"{kind}Title"]
                exercise_texts[locale][f"knowledgeHistoryDefinition_{slug}_{kind}"] = DEFINITIONS[kind][0 if de else 1]
            exercise_texts[locale][f"knowledgeHint_{slug}"] = "Vergleiche den Begriff mit seiner genauen Aussage und den Modellgrenzen." if de else "Compare the term with its precise claim and the model's limits."
        for index, topic in enumerate(topics):
            lesson_id = f"{unit_id}.lesson{index+1}"
            set_id = f"{lesson_id}.exercises"
            knowledge = {"type": "KNOWLEDGE_MC" if index != 1 else "MATCH", "params": {"topics": [slug], **({"count": 3} if index == 1 else {})}}
            count = [8, 10, 12][index]
            entries = [{"spec": knowledge, "count": 4 if topic else count}]
            if topic:
                entries.append({"spec": {"type": "CONTEXT_CHOICE", "params": {"topics": [topic]}}, "count": count - 4})
            catalogue["exerciseSets"].append({**meta(set_id, f"{base}.lesson{index+1}"), "skillIds": skills, "exercises": entries})
            catalogue["lessons"].append({**meta(lesson_id, f"{base}.lesson{index+1}"), "unitId": unit_id, "skillIds": skills, "introductionCardIds": cards, "exerciseSetIds": [set_id]})
    for path, value in [(catalogue_path, catalogue), (plan_path, plan), (texts_path, texts), (ROOT / "packages/i18n/src/messages/level-five-exercise.json", exercise_texts)]:
        path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
    # Production keeps only navigation copy; new exercise instructions/definitions stay private.
    (ROOT / "packages/i18n/src/messages/level-five-exercise-published.json").write_text(json.dumps({locale: {key: value for key, value in messages.items() if key.startswith("levelFive")} for locale, messages in exercise_texts.items()}, ensure_ascii=False, indent=2) + "\n")
    print(f"P4.19 internal draft: {len(UNITS)} units, {len(UNITS)*3} lessons, {len(UNITS)*30} tasks")

if __name__ == "__main__":
    main()

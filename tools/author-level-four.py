"""Materialise the unpublished P3.16 study-preparation curriculum.

Reruns replace only P3.16 records. Earlier versions, IDs and copy remain intact.
"""

from __future__ import annotations

import json
from pathlib import Path

from level_four_data import CONCEPTS, UNITS

ROOT = Path(__file__).resolve().parents[1]
CATALOGUE = ROOT / "packages/content/src/catalogue.json"
PLAN = ROOT / "packages/content/src/curriculum-plan.json"
TEXTS = ROOT / "packages/i18n/src/authored-content.json"
EXERCISE_TEXTS = ROOT / "packages/i18n/src/messages/level-four-exercise.json"
VERSION = 16

AREAS = {
    "satz": ("Tonsatz und Stimmführung", "Composition and voice leading"),
    "analysis": ("Werkanalyse", "Score analysis"),
    "acoustics": ("Akustik und Stimmungen", "Acoustics and tuning"),
}

SOURCE_TEXTS = {
    "de": {
        "contextQuestion_clef-reading": "Welcher Ton steht im Alt- oder Tenorschlüssel an der gezeigten Position?",
        "contextHint1_clef-reading": "Suche die Linie des eingeklammerten c¹ im jeweiligen C-Schlüssel.",
        "contextHint2_clef-reading": "Im Altschlüssel liegt c¹ auf der dritten, im Tenorschlüssel auf der vierten Linie.",
        "contextExplain_clef-reading": "Die C-Schlüssel markieren die Linie für c¹; der gesuchte Ton wird aus der notierten Position und dem tatsächlichen Schlüssel bestimmt.",
        "contextQuestion_parallel-fifths": "Bewegen sich die beiden Stimmen in parallelen reinen Quinten?",
        "contextHint1_parallel-fifths": "Bestimme das Intervall zwischen den Stimmen an beiden Stellen.",
        "contextHint2_parallel-fifths": "Prüfe, ob beide Stimmen in dieselbe Richtung weitergehen und beide Intervalle reine Quinten sind.",
        "contextExplain_parallel-fifths": "Nur zwei reine Quinten bei gleichgerichteter Bewegung bilden hier eine Quintparallele. Das kurze Beispiel beschreibt eine klassische Satzregel.",
        "contextQuestion_figured-bass": "Welche Grundbezifferung beschreiben die beiden Intervalle über dem tiefsten notierten Ton?",
        "contextHint1_figured-bass": "Lies den tiefsten Ton als Bass und zähle die Stammtonabstände nach oben.",
        "contextHint2_figured-bass": "Die Grundformen sind 5/3, 6/3 und 6/4; beachte beide Oberstimmen.",
        "contextExplain_figured-bass": "Die Bezifferung nennt die diatonischen Intervalle über dem tatsächlich notierten Bass. Weitere Vorzeichen und Aussetzungsregeln bleiben gesondert zu prüfen.",
        "contextOption_figure-5-3": "5/3: Terz und Quinte",
        "contextOption_figure-6-3": "6/3: Terz und Sexte",
        "contextOption_figure-6-4": "6/4: Quarte und Sexte",
    },
    "en-US": {
        "contextQuestion_clef-reading": "Which pitch is written at this position in alto or tenor clef?",
        "contextHint1_clef-reading": "Find the line marked as middle C by the C clef.",
        "contextHint2_clef-reading": "Middle C is on the third line in alto clef and the fourth line in tenor clef.",
        "contextExplain_clef-reading": "A C clef marks the line for middle C; the answer follows from the displayed staff position and the actual clef.",
        "contextQuestion_parallel-fifths": "Do the two voices move in parallel perfect fifths?",
        "contextHint1_parallel-fifths": "Identify the interval between the voices at each position.",
        "contextHint2_parallel-fifths": "Check whether both voices move in the same direction and both intervals are perfect fifths.",
        "contextExplain_parallel-fifths": "Only two perfect fifths in similar motion form parallel fifths here. This short example concerns a classical writing convention.",
        "contextQuestion_figured-bass": "Which basic figures describe the two intervals above the lowest written note?",
        "contextHint1_figured-bass": "Read the lowest note as the bass and count diatonic steps upward.",
        "contextHint2_figured-bass": "The basic forms are 5/3, 6/3 and 6/4; consider both upper notes.",
        "contextExplain_figured-bass": "The figures name diatonic intervals above the actual written bass. Accidentals and realisation conventions need separate attention.",
        "contextOption_figure-5-3": "5/3: third and fifth",
        "contextOption_figure-6-3": "6/3: third and sixth",
        "contextOption_figure-6-4": "6/4: fourth and sixth",
    },
}
SOURCE_TEXTS["en-GB"] = SOURCE_TEXTS["en-US"]


def meta(id_: str, title: str) -> dict:
    return {"id": id_, "contentVersion": VERSION, "status": "entwurf", "titleKey": title}


def spec(type_: str, params: dict, count: int) -> dict:
    return {"spec": {"type": type_, "params": params}, "count": count}


def exercise_steps(unit: str, topic: str) -> list[list[dict]]:
    knowledge = {"topics": [topic]}
    seventh = {"types": ["major7", "dominant7", "minor7", "halfDiminished7"], "roots": ["C", "D", "G", "A"]}
    if unit == "notation.l4.multivoice":
        return [
            [spec("KNOWLEDGE_MC", knowledge, 4), spec("CONTEXT_CHOICE", {"topics": ["clef-reading"]}, 4)],
            [spec("MATCH", {**knowledge, "count": 3}, 4), spec("CONTEXT_CHOICE", {"topics": ["clef-reading"]}, 6)],
            [spec("KNOWLEDGE_MC", knowledge, 4), spec("CONTEXT_CHOICE", {"topics": ["clef-reading"]}, 8)],
        ]
    if unit == "rhythm.l4.complex":
        return [
            [spec("KNOWLEDGE_MC", knowledge, 4), spec("RHYTHM_TAP", {"meters": ["2/4", "3/4", "4/4"], "level": "triplets", "tempos": [72, 84]}, 4)],
            [spec("MATCH", {**knowledge, "count": 3}, 4), spec("RHYTHM_TAP", {"meters": ["2/4", "3/4", "4/4"], "level": "triplets", "tempos": [84, 96]}, 6)],
            [spec("RHYTHM_TAP", {"meters": ["2/4", "3/4", "4/4"], "level": "triplets", "tempos": [84, 96]}, 6), spec("KNOWLEDGE_MC", knowledge, 6)],
        ]
    if unit == "chords.l4.extensions":
        return [
            [spec("KNOWLEDGE_MC", knowledge, 4), spec("CHORD_IDENTIFY", {**seventh, "presentation": "visual"}, 4)],
            [spec("CHORD_BUILD", {**seventh, "inversions": [0, 1, 2, 3]}, 6), spec("MATCH", {**knowledge, "count": 3}, 4)],
            [spec("CHORD_IDENTIFY", {**seventh, "presentation": "aural"}, 6), spec("KNOWLEDGE_MC", knowledge, 6)],
        ]
    if unit == "harmony.l4.applied":
        return [
            [spec("KNOWLEDGE_MC", knowledge, 4), spec("FUNCTION_ANALYSIS", {"notation": "roman"}, 4)],
            [spec("MATCH", {**knowledge, "count": 3}, 4), spec("CADENCE_IDENTIFY", {}, 6)],
            [spec("KNOWLEDGE_MC", knowledge, 4), spec("FUNCTION_ANALYSIS", {"notation": "function"}, 4), spec("CADENCE_IDENTIFY", {}, 4)],
        ]
    if unit == "satz.l4.voice-leading":
        return [
            [spec("KNOWLEDGE_MC", knowledge, 4), spec("CONTEXT_CHOICE", {"topics": ["parallel-fifths"]}, 4)],
            [spec("MATCH", {**knowledge, "count": 3}, 4), spec("CONTEXT_CHOICE", {"topics": ["parallel-fifths"]}, 6)],
            [spec("KNOWLEDGE_MC", knowledge, 4), spec("CONTEXT_CHOICE", {"topics": ["parallel-fifths"]}, 8)],
        ]
    if unit == "satz.l4.figured-bass":
        return [
            [spec("KNOWLEDGE_MC", knowledge, 4), spec("CONTEXT_CHOICE", {"topics": ["figured-bass"]}, 4)],
            [spec("MATCH", {**knowledge, "count": 3}, 4), spec("CONTEXT_CHOICE", {"topics": ["figured-bass"]}, 6)],
            [spec("KNOWLEDGE_MC", knowledge, 4), spec("CONTEXT_CHOICE", {"topics": ["figured-bass"]}, 8)],
        ]
    if unit == "jazzpop.l4.voicings":
        return [
            [spec("KNOWLEDGE_MC", knowledge, 4), spec("CHORD_IDENTIFY", {**seventh, "presentation": "visual"}, 4)],
            [spec("MATCH", {**knowledge, "count": 3}, 4), spec("CHORD_BUILD", seventh, 6)],
            [spec("KNOWLEDGE_MC", knowledge, 4), spec("CHORD_IDENTIFY", {**seventh, "presentation": "aural"}, 8)],
        ]
    if unit == "instruments.l4.orchestration":
        return [
            [spec("KNOWLEDGE_MC", knowledge, 8)],
            [spec("MATCH", {**knowledge, "count": 3}, 5), spec("CONTEXT_CHOICE", {"topics": ["clarinet-transposition"]}, 5)],
            [spec("KNOWLEDGE_MC", knowledge, 4), spec("MATCH", {**knowledge, "count": 3}, 4), spec("CONTEXT_CHOICE", {"topics": ["clarinet-transposition"]}, 4)],
        ]
    if unit == "aural.l4.preparation":
        return [
            [spec("INTERVAL_IDENTIFY_AURAL", {"intervals": ["m3", "M3", "P4", "P5", "m6", "M6"]}, 4), spec("CHORD_IDENTIFY", {**seventh, "presentation": "aural"}, 4)],
            [spec("MELODY_DICTATION", {"level": 2}, 5), spec("RHYTHM_DICTATION", {"level": 2}, 5)],
            [spec("SIGHT_SING", {"level": 3}, 4), spec("PLAY_BACK", {"level": 3, "intervals": ["M2", "m3", "P4"]}, 4), spec("KNOWLEDGE_MC", knowledge, 4)],
        ]
    if unit == "history.l4.survey":
        return [
            [spec("KNOWLEDGE_MC", knowledge, 8)],
            [spec("MATCH", {**knowledge, "count": 3}, 5), spec("CONTEXT_CHOICE", {"topics": ["source-comparison"]}, 5)],
            [spec("KNOWLEDGE_MC", knowledge, 4), spec("MATCH", {**knowledge, "count": 3}, 4), spec("CONTEXT_CHOICE", {"topics": ["source-comparison"]}, 4)],
        ]
    return [
        [spec("KNOWLEDGE_MC", knowledge, 8)],
        [spec("MATCH", {**knowledge, "count": 3}, 10)],
        [spec("KNOWLEDGE_MC", knowledge, 6), spec("MATCH", {**knowledge, "count": 3}, 6)],
    ]


def main() -> None:
    catalogue = json.loads(CATALOGUE.read_text())
    plan = json.loads(PLAN.read_text())
    texts = json.loads(TEXTS.read_text())
    if catalogue["contentVersion"] not in (15, VERSION):
        raise ValueError("P3.16 expects the P3.15 or P3.16 catalogue")
    catalogue["contentVersion"] = VERSION
    plan["contentVersion"] = VERSION
    plan["scopeLevels"] = [1, 2, 3, 4]
    unit_ids = {entry[0] for entry in UNITS}
    level_ids = {f"{entry[2]}.level-4" for entry in UNITS}
    area_ids = {f"area.{area}" for area in AREAS}

    def introduced(id_: str) -> bool:
        return id_ in unit_ids or id_ in level_ids or id_ in area_ids or any(id_.startswith(f"{unit}.") for unit in unit_ids)

    for collection in ("areas", "levels", "units", "skills", "exerciseSets", "knowledgeCards", "knowledgeArticles", "lessons"):
        catalogue[collection] = [record for record in catalogue[collection] if not introduced(record["id"])]
    plan["units"] = [entry for entry in plan["units"] if entry["unitId"] not in unit_ids]

    for locale in texts:
        texts[locale]["levelFour"] = {
            "levelTitle": "Studienvorbereitung" if locale == "de" else "Study preparation",
            "areas": {area: de if locale == "de" else en for area, (de, en) in AREAS.items()},
            "units": {},
        }
    for area in AREAS:
        catalogue["areas"].append(meta(f"area.{area}", f"content.levelFour.areas.{area}"))
    for area in dict.fromkeys(entry[2] for entry in UNITS):
        catalogue["levels"].append({**meta(f"{area}.level-4", "content.levelFour.levelTitle"), "areaId": f"area.{area}", "number": 4})

    exercise_texts = {locale: dict(SOURCE_TEXTS[locale]) for locale in texts}
    for unit_id, slug, area, de_title, en_title, topic, prerequisites, goals_de, goals_en in UNITS:
        concepts = CONCEPTS[topic]
        assert len(concepts) == 4 and len(goals_de) == len(goals_en) == 3
        catalogue["units"].append({**meta(unit_id, f"content.levelFour.units.{slug}.unitTitle"), "levelId": f"{area}.level-4"})
        skill_ids = [f"{unit_id}.s{i}" for i in range(1, 4)]
        plan["units"].append({"unitId": unit_id, "skillIds": skill_ids})
        for index, skill_id in enumerate(skill_ids):
            catalogue["skills"].append({**meta(skill_id, f"content.levelFour.units.{slug}.skill{index+1}"), "areaId": f"area.{area}", "prerequisites": prerequisites if index == 0 else [skill_ids[index-1]]})
        for locale in texts:
            localized = texts[locale]["levelFour"]["units"][slug] = {
                "unitTitle": de_title if locale == "de" else en_title,
                "articleTitle": de_title if locale == "de" else en_title,
                **{f"skill{i+1}": goal for i, goal in enumerate(goals_de if locale == "de" else goals_en)},
                "lesson1": "Begriffe verstehen" if locale == "de" else "Understand the terms",
                "lesson2": "Beispiele prüfen" if locale == "de" else "Check examples",
                "lesson3": "Im Zusammenhang anwenden" if locale == "de" else "Apply in context",
            }
            for kind, title_de, title_en, body_de, body_en, _ in concepts:
                localized[f"{kind}Title"] = title_de if locale == "de" else title_en
                localized[f"{kind}Body"] = body_de if locale == "de" else body_en
                localized[f"{kind}Caption"] = (
                    "Gegenbeispiel: hier entstehen parallele Quinten"
                    if locale == "de" and topic == "voiceLeading" and kind == "parallels"
                    else "Counterexample: parallel fifths occur here"
                    if topic == "voiceLeading" and kind == "parallels"
                    else "Eigenes schematisches Notenbeispiel; Text und Ton getrennt prüfen"
                    if locale == "de"
                    else "Original schematic score; check text and sound separately"
                )
                exercise_texts[locale][f"knowledgeHistory_{topic}_{kind}"] = localized[f"{kind}Title"]
                exercise_texts[locale][f"knowledgeHistoryDefinition_{topic}_{kind}"] = localized[f"{kind}Body"].split(". ", 1)[0].rstrip(".") + "."
            exercise_texts[locale][f"knowledgeHint_{topic}"] = "Prüfe den konkreten Begriff und die Grenzen des Modells." if locale == "de" else "Check the exact term and the limits of the model."
        cards = []
        sections = []
        for index, (kind, _, _, _, _, score) in enumerate(concepts):
            base = f"content.levelFour.units.{slug}.{kind}"
            example = {"score": score, "captionKey": f"{base}Caption"}
            card_id = f"{unit_id}.card-{kind.lower()}"
            catalogue["knowledgeCards"].append({**meta(card_id, f"{base}Title"), "skillIds": [skill_ids[min(index, 2)]], "bodyKey": f"{base}Body", "examples": [example]})
            cards.append(card_id)
            sections.append({"headingKey": f"{base}Title", "bodyKey": f"{base}Body", "examples": [example]})
        catalogue["knowledgeArticles"].append({**meta(f"{unit_id}.article", f"content.levelFour.units.{slug}.articleTitle"), "skillIds": skill_ids, "sections": sections})
        for index, entries in enumerate(exercise_steps(unit_id, topic)):
            lesson_id = f"{unit_id}.lesson{index+1}"
            title_key = f"content.levelFour.units.{slug}.lesson{index+1}"
            set_id = f"{lesson_id}.exercises"
            catalogue["exerciseSets"].append({**meta(set_id, title_key), "skillIds": skill_ids, "exercises": entries})
            catalogue["lessons"].append({**meta(lesson_id, title_key), "unitId": unit_id, "skillIds": skill_ids, "introductionCardIds": cards, "exerciseSetIds": [set_id]})

    CATALOGUE.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n")
    PLAN.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n")
    TEXTS.write_text(json.dumps(texts, ensure_ascii=False, indent=2) + "\n")
    EXERCISE_TEXTS.write_text(json.dumps(exercise_texts, ensure_ascii=False, indent=2) + "\n")
    print(f"P3.16 draft: {len(UNITS)} units, {len(UNITS)*3} lessons, {len(UNITS)*30} tasks")


if __name__ == "__main__":
    main()

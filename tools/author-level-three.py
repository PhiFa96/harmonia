"""Materialize the original P3.15 draft in the internal authoring catalogue.

Run from the repository root. Re-running replaces only records introduced here;
all earlier IDs, versions and content remain untouched. Human review still governs
promotion from ``entwurf`` to ``freigegeben``.
"""

from __future__ import annotations

import json
from pathlib import Path

from level_three_data import CONCEPTS, UNITS

ROOT = Path(__file__).resolve().parents[1]
CATALOGUE = ROOT / "packages/content/src/catalogue.json"
PLAN = ROOT / "packages/content/src/curriculum-plan.json"
TEXTS = ROOT / "packages/i18n/src/authored-content.json"
EXERCISE_TEXTS = ROOT / "packages/i18n/src/messages/level-three-exercise.json"
VERSION = 15
STATUS = "entwurf"
AREAS = {
    "harmony": ("Harmonielehre", "Harmony"),
    "forms": ("Formenlehre", "Musical form"),
    "instruments": ("Instrumentenkunde", "Instruments and orchestration"),
    "jazzpop": ("Jazz und Pop", "Jazz and pop"),
}
CAPTIONS = {
    "de": {
        "instrumentFamilies": "Eigener schematischer Notensatz; keine Instrumentenklangprobe",
        "instrumentScores": "Eigener schematischer Notensatz; Instrumentenstimmen sind beschriftet im Text",
        "historyMethods": "Eigenes Klangmodell; keine historische Quelle oder Aufnahme",
        "jazzHarmony": "Eigenes Akkordmodell; keine Transkription eines Songs",
    },
    "en-US": {
        "instrumentFamilies": "Original schematic score; not an instrument sound sample",
        "instrumentScores": "Original schematic score; instrument parts are explained in the text",
        "historyMethods": "Original sound model; not a historical source or recording",
        "jazzHarmony": "Original chord model; not a song transcription",
    },
}
CAPTIONS["en-GB"] = CAPTIONS["en-US"]


def meta(id_: str, title: str) -> dict:
    return {"id": id_, "contentVersion": VERSION, "status": STATUS, "titleKey": title}


def spec(type_: str, params: dict, count: int) -> dict:
    return {"spec": {"type": type_, "params": params}, "count": count}


def exercise_steps(unit: str, topic: str) -> list[list[dict]]:
    k = {"topics": [topic]}
    seventh = {"types": ["major7", "dominant7", "minor7", "halfDiminished7"], "roots": ["C", "D", "G", "A"]}
    if unit == "chords.l3.sevenths":
        return [
            [spec("CHORD_IDENTIFY", {**seventh, "presentation": "visual"}, 8)],
            [spec("CHORD_BUILD", seventh, 10)],
            [spec("CHORD_IDENTIFY", {**seventh, "presentation": "aural"}, 6), spec("CHORD_BUILD", seventh, 6)],
        ]
    if unit == "harmony.l3.functions":
        return [
            [spec("FUNCTION_ANALYSIS", {"notation": "roman", "degrees": [1, 4, 5]}, 8)],
            [spec("FUNCTION_ANALYSIS", {"notation": "function", "degrees": [1, 2, 4, 5, 6]}, 10)],
            [spec("FUNCTION_ANALYSIS", {"notation": "roman"}, 6), spec("FUNCTION_ANALYSIS", {"notation": "function"}, 6)],
        ]
    if unit == "harmony.l3.cadences":
        return [
            [spec("CADENCE_IDENTIFY", {"types": ["authentic", "plagal"]}, 8)],
            [spec("CADENCE_IDENTIFY", {"types": ["half", "deceptive"]}, 10)],
            [spec("CADENCE_IDENTIFY", {}, 12)],
        ]
    if unit == "aural.l3.dictation":
        return [
            [spec("MELODY_DICTATION", {"level": 2}, 8)],
            [spec("RHYTHM_DICTATION", {"level": 2}, 10)],
            [spec("MELODY_DICTATION", {"level": 2}, 4), spec("RHYTHM_DICTATION", {"level": 2}, 4), spec("SIGHT_SING", {"level": 3}, 2), spec("PLAY_BACK", {"level": 3, "intervals": ["M2", "m3", "P4"]}, 2)],
        ]
    if unit == "jazzpop.l3.harmony":
        return [
            [spec("KNOWLEDGE_MC", k, 8)],
            [spec("MATCH", {**k, "count": 3}, 5), spec("CHORD_IDENTIFY", {**seventh, "presentation": "visual"}, 5)],
            [spec("KNOWLEDGE_MC", k, 4), spec("MATCH", {**k, "count": 3}, 4), spec("CHORD_IDENTIFY", {**seventh, "presentation": "aural"}, 4)],
        ]
    if unit == "forms.l3.designs":
        return [
            [spec("KNOWLEDGE_MC", k, 8)],
            [spec("MATCH", {**k, "count": 3}, 5), spec("CONTEXT_CHOICE", {"topics": ["form-return"]}, 5)],
            [spec("KNOWLEDGE_MC", k, 4), spec("MATCH", {**k, "count": 3}, 4), spec("CONTEXT_CHOICE", {"topics": ["form-return"]}, 4)],
        ]
    if unit == "instruments.l3.scores":
        return [
            [spec("KNOWLEDGE_MC", k, 8)],
            [spec("MATCH", {**k, "count": 3}, 5), spec("CONTEXT_CHOICE", {"topics": ["clarinet-transposition"]}, 5)],
            [spec("KNOWLEDGE_MC", k, 4), spec("MATCH", {**k, "count": 3}, 4), spec("CONTEXT_CHOICE", {"topics": ["clarinet-transposition"]}, 4)],
        ]
    if unit == "history.l3.methods":
        return [
            [spec("KNOWLEDGE_MC", k, 8)],
            [spec("MATCH", {**k, "count": 3}, 6), spec("CONTEXT_CHOICE", {"topics": ["source-comparison"]}, 4)],
            [spec("KNOWLEDGE_MC", k, 4), spec("MATCH", {**k, "count": 3}, 4), spec("CONTEXT_CHOICE", {"topics": ["source-comparison"]}, 4)],
        ]
    return [
        [spec("KNOWLEDGE_MC", k, 8)],
        [spec("MATCH", {**k, "count": 3}, 10)],
        [spec("KNOWLEDGE_MC", k, 6), spec("MATCH", {**k, "count": 3}, 6)],
    ]


def main() -> None:
    catalogue = json.loads(CATALOGUE.read_text())
    plan = json.loads(PLAN.read_text())
    texts = json.loads(TEXTS.read_text())
    if catalogue["contentVersion"] not in (14, VERSION):
        raise ValueError("P3.15 authoring expects the P3.14 or P3.15 catalogue")
    catalogue["contentVersion"] = VERSION
    plan["contentVersion"] = VERSION
    plan["scopeLevels"] = [1, 2, 3]
    unit_ids = {unit[0] for unit in UNITS}
    area_ids = {f"area.{area}" for area in AREAS}
    level_ids = {f"{area}.level-3" for area in (unit[2] for unit in UNITS)}

    def introduced(id_: str) -> bool:
        return id_ in area_ids or id_ in level_ids or id_ in unit_ids or any(
            id_.startswith(f"{unit_id}.") for unit_id in unit_ids
        )

    for collection in ("areas", "levels", "units", "skills", "exerciseSets", "knowledgeCards", "knowledgeArticles", "lessons"):
        catalogue[collection] = [record for record in catalogue[collection] if not introduced(record["id"])]
    plan["units"] = [entry for entry in plan["units"] if entry["unitId"] not in unit_ids]
    level_text = {
        "de": "Fortgeschritten",
        "en-US": "Advanced",
        "en-GB": "Advanced",
    }
    for locale in texts:
        texts[locale]["levelThree"] = {"levelTitle": level_text[locale], "areas": {}, "units": {}}
    for area, (de, en) in AREAS.items():
        catalogue["areas"].append(meta(f"area.{area}", f"content.levelThree.areas.{area}"))
        for locale in texts:
            texts[locale]["levelThree"]["areas"][area] = de if locale == "de" else en
    used_areas = list(dict.fromkeys(unit[2] for unit in UNITS))
    for area in used_areas:
        catalogue["levels"].append({**meta(f"{area}.level-3", "content.levelThree.levelTitle"), "areaId": f"area.{area}", "number": 3})

    exercise_texts = {locale: {} for locale in texts}
    source_questions = {
        "de": {
            "contextQuestion_form-return": "Vergleiche die drei kurzen Modellabschnitte: Kehrt das erste Motiv am Ende wieder?",
            "contextHint1_form-return": "Lies die Tonfolgen der ersten und dritten Gruppe; gleiche Taktlänge allein genügt nicht.",
            "contextHint2_form-return": "Vergleiche die vier notierten Tonhöhen an Position eins und drei nacheinander.",
            "contextExplain_form-return": "A–B–A zeigt die Wiederkehr des Anfangsmotivs, A–B–C drei verschiedene Motive. Das kurze Modell behauptet keine vollständige Werkform.",
            "contextOption_form-aba": "A–B–A: Anfangsmotiv kehrt wieder",
            "contextOption_form-abc": "A–B–C: neues Motiv am Ende",
            "contextQuestion_clarinet-transposition": "Welcher klingende Ton entsteht auf einer B-Klarinette aus dem notierten Ton?",
            "contextHint1_clarinet-transposition": "Die B-Klarinette klingt tiefer als notiert.",
            "contextHint2_clarinet-transposition": "Gehe vom geschriebenen Ton eine große Sekunde, also zwei Halbtöne, nach unten.",
            "contextExplain_clarinet-transposition": "Die B-Klarinette klingt eine große Sekunde tiefer; die Antwort wird aus dem notierten Ton berechnet.",
        },
        "en-US": {
            "contextQuestion_form-return": "Compare the three short model sections: does the opening motive return at the end?",
            "contextHint1_form-return": "Read the pitches in the first and third groups; equal bar length alone is insufficient.",
            "contextHint2_form-return": "Compare the four written pitches in sections one and three in order.",
            "contextExplain_form-return": "A–B–A repeats the opening motive; A–B–C uses three different motives. This short model does not claim to show a whole work's form.",
            "contextOption_form-aba": "A–B–A: opening motive returns",
            "contextOption_form-abc": "A–B–C: new motive at the end",
            "contextQuestion_clarinet-transposition": "What concert pitch sounds on B-flat clarinet for the written note?",
            "contextHint1_clarinet-transposition": "B-flat clarinet sounds lower than written.",
            "contextHint2_clarinet-transposition": "Move down a major second, or two semitones, from the written pitch.",
            "contextExplain_clarinet-transposition": "B-flat clarinet sounds a major second lower; the answer is computed from the written note.",
        },
    }
    source_questions["en-GB"] = source_questions["en-US"]
    for locale in exercise_texts:
        exercise_texts[locale].update(source_questions[locale])
    for unit_id, slug, area, de_title, en_title, topic, entry_prerequisites, goals_de, goals_en in UNITS:
        concepts = CONCEPTS[topic]
        assert len(concepts) == 4 and len(goals_de) == len(goals_en) == 3
        catalogue["units"].append({**meta(unit_id, f"content.levelThree.units.{slug}.unitTitle"), "levelId": f"{area}.level-3"})
        skill_ids = [f"{unit_id}.s{i}" for i in range(1, 4)]
        plan["units"].append({"unitId": unit_id, "skillIds": skill_ids})
        for i, skill_id in enumerate(skill_ids):
            catalogue["skills"].append({**meta(skill_id, f"content.levelThree.units.{slug}.skill{i+1}"), "areaId": f"area.{area}", "prerequisites": entry_prerequisites if i == 0 else [skill_ids[i-1]]})
        for locale in texts:
            t = texts[locale]["levelThree"]["units"][slug] = {
                "unitTitle": de_title if locale == "de" else en_title,
                "articleTitle": de_title if locale == "de" else en_title,
                **{f"skill{i+1}": value for i, value in enumerate(goals_de if locale == "de" else goals_en)},
                "lesson1": "Begriffe und Beispiele" if locale == "de" else "Terms and examples",
                "lesson2": "Zusammenhänge üben" if locale == "de" else "Practice relationships",
                "lesson3": "Wissen anwenden" if locale == "de" else "Apply the ideas",
            }
            for kind, concept_de, concept_en, body_de, body_en, _ in concepts:
                t[f"{kind}Title"] = concept_de if locale == "de" else concept_en
                t[f"{kind}Body"] = body_de if locale == "de" else body_en
                t[f"{kind}Caption"] = CAPTIONS.get(locale, {}).get(topic, "Eigenes schematisches Notenbeispiel" if locale == "de" else "Original schematic score example")
                if topic in ("modes", "modulation", "phrases", "forms", "instrumentFamilies", "instrumentScores", "jazzHarmony", "historyMethods"):
                    exercise_texts[locale][f"knowledgeHistory_{topic}_{kind}"] = t[f"{kind}Title"]
                    # Concise task wording: the unpublished card/article copy stays in
                    # the authoring-only content resource, outside production bundles.
                    exercise_texts[locale][f"knowledgeHistoryDefinition_{topic}_{kind}"] = t[f"{kind}Body"].split(". ", 1)[0].rstrip(".") + "."
            if topic in ("modes", "modulation", "phrases", "forms", "instrumentFamilies", "instrumentScores", "jazzHarmony", "historyMethods"):
                exercise_texts[locale][f"knowledgeHint_{topic}"] = "Vergleiche die Definition mit allen Begriffen dieser Einheit und prüfe das konkrete Merkmal." if locale == "de" else "Compare the definition with all terms in this unit and check the specific feature."
        cards = []
        sections = []
        for i, (kind, _, _, _, _, score) in enumerate(concepts):
            base_key = f"content.levelThree.units.{slug}.{kind}"
            example = {"score": score, "captionKey": f"{base_key}Caption"}
            card_id = f"{unit_id}.card-{kind.lower()}"
            catalogue["knowledgeCards"].append({**meta(card_id, f"{base_key}Title"), "skillIds": [skill_ids[min(i, 2)]], "bodyKey": f"{base_key}Body", "examples": [example]})
            cards.append(card_id)
            sections.append({"headingKey": f"{base_key}Title", "bodyKey": f"{base_key}Body", "examples": [example]})
        catalogue["knowledgeArticles"].append({**meta(f"{unit_id}.article", f"content.levelThree.units.{slug}.articleTitle"), "skillIds": skill_ids, "sections": sections})
        for i, entries in enumerate(exercise_steps(unit_id, topic)):
            lesson_id = f"{unit_id}.lesson{i+1}"
            title_key = f"content.levelThree.units.{slug}.lesson{i+1}"
            set_id = f"{lesson_id}.exercises"
            catalogue["exerciseSets"].append({**meta(set_id, title_key), "skillIds": skill_ids, "exercises": entries})
            catalogue["lessons"].append({**meta(lesson_id, title_key), "unitId": unit_id, "skillIds": skill_ids, "introductionCardIds": cards, "exerciseSetIds": [set_id]})
    CATALOGUE.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n")
    PLAN.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n")
    TEXTS.write_text(json.dumps(texts, ensure_ascii=False, indent=2) + "\n")
    EXERCISE_TEXTS.write_text(json.dumps(exercise_texts, ensure_ascii=False, indent=2) + "\n")
    print(f"P3.15 draft: {len(UNITS)} units, {len(UNITS)*3} skills and lessons, {len(UNITS)*4} cards and examples")


if __name__ == "__main__":
    main()

"""Apply the P4.19 completion to the integrated draft; preserve all other content."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = 31  # Parallel choir/history drafts use 29/30; retain the highest on integration.
UNIT = re.compile(r"^(counterpoint|forms|analysis|contemporary|world)\.l5\.")
TARGETS = {
    "speciesBasics": [
        ("Konsonanzen der ersten Gattung unterscheiden", "Distinguish first-species consonances"),
        ("Bewegungsarten zweier Stimmen bestimmen", "Identify motion between two parts"),
        ("Neun begrenzte Satzregeln anwenden", "Apply nine bounded counterpoint rules"),
    ],
    "imitationStudy": [
        ("Imitation und motivische Operationen unterscheiden", "Distinguish imitation and motivic operations"),
        ("Motivtransformationen am Notentext vergleichen", "Compare written motivic transformations"),
        ("Mehrdeutigkeit und tonale Grenzen begründen", "Explain ambiguity and tonal limits"),
    ],
    "advancedForms": [
        ("Abschnitte nach angegebenem Kriterium vergleichen", "Compare sections using a stated criterion"),
        ("Formhypothesen mit konkreten Belegen untersuchen", "Examine formal hypotheses using evidence"),
        ("Wiederkehr und funktionale Deutung trennen", "Separate return from functional interpretation"),
    ],
    "workAnalysis": [
        ("Analysefrage und Motivbeleg formulieren", "Frame an analytical question and motivic evidence"),
        ("Tonklassenreduktion und Messbefund prüfen", "Examine pitch-class reduction and measurement"),
        ("Formargumente mit Grenzen begründen", "Support formal arguments and their limits"),
    ],
    "serialStudy": [
        ("Tonklassenfolge auf Vollständigkeit prüfen", "Check pitch-class sequence completeness"),
        ("Reihenoperationen modulo zwölf bestimmen", "Identify row operations modulo twelve"),
        ("Reihenoperationen und Stilbehauptungen trennen", "Separate row operations from stylistic claims"),
    ],
    "setStudy": [
        ("Tonklassen und Mächtigkeit bestimmen", "Identify pitch classes and cardinality"),
        ("Ungeordnete Intervallklassen zählen", "Count unordered interval classes"),
        ("Intervallklassenvektoren vergleichen und begrenzen", "Compare interval-class vectors and their limits"),
    ],
    "processStudy": [
        ("Diskrete zyklische Verschiebung erkennen", "Recognise discrete cyclic rotation"),
        ("Prozessregel am Notenmodell verfolgen", "Trace a process rule in a score model"),
        ("Modell und Klangpraxis unterscheiden", "Distinguish a model from musical practice"),
    ],
    "worldStudy": [
        ("Praxisbegriffe und Modellgrenzen unterscheiden", "Distinguish practice concepts and model limits"),
        ("Quellen mit Kontextangaben untersuchen", "Examine sources and contextual information"),
        ("Aussagen durch passende Belege begrenzen", "Limit claims to the available evidence"),
    ],
}


def separate_species(score: str) -> str:
    if "\n" in score:
        return score
    _, meter, *bars = score.split(" | ")
    pairs = []
    for bar in bars:
        match = re.fullmatch(r"\(([^ ]+) ([^ ]+)\)/1", bar)
        if not match:
            raise ValueError("Unexpected species teaching example")
        pairs.append(match.groups())
    return "\n".join(
        "treble | " + meter + " | " + " | ".join(pair[index] + "/1" for pair in pairs)
        for index in (1, 0)
    )


def main() -> None:
    paths = [ROOT / name for name in (
        "packages/content/src/catalogue.json", "packages/content/src/curriculum-plan.json",
        "packages/i18n/src/authored-content.json", "packages/i18n/src/messages/level-five-exercise.json",
    )]
    catalogue, plan, content, messages = [json.loads(p.read_text()) for p in paths]
    if catalogue["contentVersion"] not in (27, VERSION):
        raise ValueError("Review the content version before applying the P4.19 completion")
    for collection in ("units", "skills", "lessons", "exerciseSets", "knowledgeCards", "knowledgeArticles"):
        if any(UNIT.match(record["id"]) and record["status"] != "entwurf" for record in catalogue[collection]):
            raise ValueError("Completion may only change unpublished P4.19 drafts")
    catalogue["contentVersion"] = plan["contentVersion"] = VERSION
    for collection in ("units", "skills", "lessons", "exerciseSets", "knowledgeCards", "knowledgeArticles"):
        for record in catalogue[collection]:
            if UNIT.match(record["id"]):
                record["contentVersion"] = VERSION
    for lesson in catalogue["lessons"]:
        if not UNIT.match(lesson["id"]):
            continue
        index = int(lesson["id"][-1])
        lesson["skillIds"] = [lesson["unitId"] + ".s" + str(index)]
        for set_id in lesson["exerciseSetIds"]:
            exercise_set = next(s for s in catalogue["exerciseSets"] if s["id"] == set_id)
            exercise_set["skillIds"] = lesson["skillIds"].copy()
        if lesson["id"] == "world.l5.context.lesson2":
            exercise_set["exercises"] = [{"spec": {"type": "MATCH", "params": {"topics": ["worldStudy", "context"], "count": 3}}, "count": 10}]
        if lesson["id"] == "world.l5.context.lesson3":
            exercise_set["exercises"] = [
                {"spec": {"type": "KNOWLEDGE_MC", "params": {"topics": ["worldStudy"]}}, "count": 4},
                {"spec": {"type": "MATCH", "params": {"topics": ["context"], "count": 3}}, "count": 3},
                {"spec": {"type": "KNOWLEDGE_MC", "params": {"topics": ["evidence"]}}, "count": 3},
                {"spec": {"type": "MATCH", "params": {"topics": ["worldStudy"], "count": 3}}, "count": 2},
            ]
    for card in catalogue["knowledgeCards"]:
        if not UNIT.match(card["id"]):
            continue
        slug = card["bodyKey"].split(".")[-2]
        kind = card["bodyKey"].split(".")[-1].removesuffix("Body")
        index = {
            "speciesBasics": {"oneAgainstOne": 1, "speciesConsonance": 1, "speciesMotion": 2, "speciesClosure": 3},
            "setStudy": {"setIdentity": 1, "intervalClass": 2, "intervalVector": 2, "setLimits": 3},
        }.get(slug, {}).get(kind)
        if index:
            card["skillIds"] = [card["id"].split(".card-")[0] + ".s" + str(index)]
    for collection in (catalogue["knowledgeCards"], catalogue["knowledgeArticles"]):
        for record in collection:
            groups = [record] if "examples" in record else record.get("sections", [])
            for group in groups:
                for example in group.get("examples", []):
                    if record["id"].startswith("counterpoint.l5.species."):
                        example["score"] = separate_species(example["score"])
                    if example["captionKey"].endswith("spectralModelCaption"):
                        example["score"] = "treble | 4/4 | (C4 G4 C5)/1\nbass | 4/4 | C3/1"
                    if UNIT.match(record["id"]) and "\n" in example["score"]:
                        example["staffPresentation"] = "parts"
    for locale in content:
        de = locale == "de"
        units = content[locale]["levelFive"]["units"]
        for slug, targets in TARGETS.items():
            for index, titles in enumerate(targets, 1):
                title = titles[0 if de else 1]
                if locale == "en-US":
                    title = title.replace("Recognise", "Recognize")
                units[slug]["skill" + str(index)] = title
                units[slug]["lesson" + str(index)] = title
        species = units["speciesBasics"]
        species["speciesMotionBody"] = (
            "Gegenbewegung führt die Stimmen in entgegengesetzte Richtungen; bei Seitenbewegung bleibt eine Stimme liegen. Gleichgerichtete Bewegung umfasst hier auch Parallelbewegung. Das strenge Übungsprofil beanstandet zwei reine Quinten bzw. zwei reine Primen/Oktaven in Folge, jeweils auch oktavversetzt, sowie in gleichgerichteter Bewegung erreichte reine Quinten, Primen und Oktaven und Überlappungen."
            if de else "Contrary motion sends the parts in opposite directions; in oblique motion one part stays still. Similar motion here includes parallel motion. The strict exercise profile flags consecutive perfect fifths or consecutive perfect unisons/octaves, including compound intervals, as well as perfect fifths, unisons or octaves reached in similar motion and voice overlap."
        )
        prefix = "Oben: Gegenstimme; unten: Cantus firmus. " if de else "Upper staff: counterpoint; lower staff: cantus firmus. "
        for key in list(species):
            if key.endswith("Caption") and not species[key].startswith(prefix):
                species[key] = prefix + species[key]
        imitation = units["imitationStudy"]
        imitation["canonEntryBody"] = (
            "Eine nachfolgende Stimme übernimmt eine vorausgehende Linie nach einer festgelegten Regel und mit zeitlichem Abstand. Beim Prüfen zuerst Einsatzabstand, Intervall und Rhythmus benennen. Das Beispiel zeigt nur zwei Motive nacheinander; es ist noch kein gleichzeitig klingender Kanon."
            if de else "A following voice takes up a preceding line according to a specified rule and after a time delay. First identify the entry delay, interval and rhythm. Below, two motives appear in succession; the example does not show a simultaneously sounding canon."
        )
        imitation["motifInversionBody"] = (
            "Bei der chromatischen Umkehrung werden gerichtete Halbtonabstände gespiegelt: aufwärts zwei wird abwärts zwei. Diatonische oder tonale Umkehrungen können andere Abstände verwenden; benenne daher die gewählte Betrachtungsweise."
            if de else "Chromatic inversion reflects the direction of pitch intervals measured in $t(glossary:semitone_other): up two becomes down two. Diatonic or tonal inversions may use different distances, so state the chosen interpretation."
        )
        units["worldStudy"]["modelBoundaryBody"] = (
            "Zwölf gleich große Oktavteilungen und westliche Notenschrift bilden traditionsspezifische Intonation und melodische Praxis nicht vollständig ab. Beschreibe deshalb die Grenze einer solchen Darstellung und ziehe für weitergehende Aussagen passende Aufführungen, Kontextangaben und Erläuterungen von Mitwirkenden heran."
            if de else "Twelve equal octave divisions and Western notation do not fully represent tradition-specific intonation and melodic practice. State that limitation and use appropriate performances, contextual information and participants' explanations for broader claims."
        )
        copy = messages[locale]
        copy["counterpointParts"] = (
            "Oben: Gegenstimme. Unten: Cantus firmus. Jedes System behält seine Stimmzuordnung, auch bei einer Stimmkreuzung."
            if de else "Upper staff: counterpoint. Lower staff: Cantus firmus. Each staff keeps its part identity, including when the parts cross."
        )
        copy["contextStaffDescription"] = "System {{index}}: {{description}}" if de else "Staff {{index}}: {{description}}"
        copy["contextHint1_counterpoint-motion"] = "Verfolge zuerst den Cantus im unteren System." if de else "First follow the cantus in the lower staff."
        copy["contextHint2_counterpoint-motion"] = "Vergleiche dann die Gegenstimme im oberen System: beide gleichgerichtet, entgegengesetzt, eine liegend oder beide unverändert?" if de else "Then compare the counterpoint in the upper staff: same direction, opposite directions, one held, or both unchanged?"
        copy["counterpointRule_consecutive-perfect"] = "zwei reine Quinten bzw. Primen/Oktaven in Folge (auch oktavversetzt)" if de else "consecutive perfect fifths or unisons/octaves (including compound intervals)"
        copy["knowledgeHistoryDefinition_imitationStudy_subjectAnswer"] = "Eine prägnante Gestalt wird in einer imitatorischen Exposition nacheinander von verschiedenen Stimmen vorgestellt; einzelne Intervalle können an den tonalen Zusammenhang angepasst sein." if de else "In an imitative exposition, different voices introduce a distinctive melodic idea in succession; individual intervals may be adjusted to the tonal context."
        if not de:
            imitation["subjectAnswerCaption"] = "An original motive pair preserving the size and direction of each interval, measured in $t(glossary:semitone_other)."
            units["workAnalysis"]["analyticalQuestionBody"] = "An analysis starts with a testable question and justified segment boundaries. In our original model the question is: which sequence of interval sizes and directions returns? Intervals are measured in $t(glossary:semitone_other). The four equal-duration notes form the agreed segment; other works need other boundary criteria."
            units["setStudy"]["intervalClassBody"] = units["setStudy"]["intervalClassBody"].replace("A directed distance of seven", "An upward distance of seven")
            units["setStudy"]["intervalClassCaption"] = "C up to G spans seven $t(glossary:semitone_other), but interval class five."
            copy["contextQuestion_motif-transform"] = "Which operation maps $t(glossary:measure_one) 1 to $t(glossary:measure_one) 2? Compare the size and direction of pitch intervals measured in $t(glossary:semitone_other); an additional transposition is allowed."
            for key in ("contextHint1_motif-transform", "contextHint2_row-transform"):
                copy[key] = copy[key].replace("directed $t(glossary:semitone_one) intervals", "pitch intervals measured in $t(glossary:semitone_other), keeping their directions")
            species["speciesClosureBody"] = species["speciesClosureBody"].replace("consecutive perfect classes", "consecutive perfect fifths or unisons/octaves")
    for path, data in zip(paths, (catalogue, plan, content, messages)):
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print("P4.19 completion: 8 units, 24 distinct lesson targets, content version 31; draft only")


if __name__ == "__main__":
    main()

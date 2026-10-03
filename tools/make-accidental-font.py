# Erzeugt die Schrift für Vorzeichen im Fließtext (♭ ♮ ♯ und Doppelkreuz) als Teilmenge von Bravura Text.
#
# Bravura Text (Steinberg, SIL Open Font License 1.1) setzt diese Zeichen passend zu Textschriften,
# ist aber 3 MB groß. Die OFL erlaubt veränderte Fassungen nur ohne den reservierten Namen „Bravura“,
# daher heißt die Teilmenge „Harmonia Accidentals“. Copyright- und Lizenzangaben bleiben in der Datei;
# die Lizenz liegt daneben (OFL.txt).
#
# Aufruf: pip install fonttools
#         python3 tools/make-accidental-font.py <Pfad zu BravuraText.otf>
# Quelle: https://github.com/steinbergmedia/bravura (redist/otf/BravuraText.otf)

import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'apps/mobile/assets/fonts/HarmoniaAccidentals.otf'
FAMILY = 'Harmonia Accidentals'
POSTSCRIPT = 'HarmoniaAccidentals-Regular'

# ♭ ♮ ♯ (für Text gestaltet) und das SMuFL-Doppelkreuz. Die Unicode-Doppelzeichen 𝄪 𝄫 stehen in
# Bravura Text tiefgestellt; die App ersetzt 𝄪 durch U+E263 und 𝄫 durch zwei ♭.
CODEPOINTS = [0x266D, 0x266E, 0x266F, 0xE263]

source = sys.argv[1] if len(sys.argv) > 1 else None
if not source:
    sys.exit('Pfad zu BravuraText.otf fehlt')

font = TTFont(source)
options = subset.Options()
options.layout_features = []
options.name_IDs = ['*']
options.name_languages = ['*']
options.notdef_outline = True
subsetter = subset.Subsetter(options)
subsetter.populate(unicodes=CODEPOINTS)
subsetter.subset(font)

# Neuer Name (reservierter Name „Bravura“ darf nicht verwendet werden)
names = font['name']
for record in list(names.names):
    if record.nameID in (1, 16):
        record.string = FAMILY
    elif record.nameID in (2, 17):
        record.string = 'Regular'
    elif record.nameID == 3:
        record.string = f'{POSTSCRIPT};derived from Bravura Text'
    elif record.nameID == 4:
        record.string = f'{FAMILY} Regular'
    elif record.nameID == 6:
        record.string = POSTSCRIPT
cff = font['CFF '].cff
cff.fontNames = [POSTSCRIPT]
top = cff.topDictIndex[0]
top.FullName = f'{FAMILY} Regular'
top.FamilyName = FAMILY

OUT.parent.mkdir(parents=True, exist_ok=True)
font.save(OUT)
print(f'{OUT.relative_to(ROOT)}: {OUT.stat().st_size} Bytes, {len(font.getBestCmap())} Zeichen')

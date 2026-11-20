# Readable Bengali numerals

`site/assets/fonts/bengali-numerals.woff2` is a 3,812-byte digits-only subset of **Noto Sans Bengali**, sourced from Google Fonts:

- https://github.com/google/fonts/tree/main/ofl/notosansbengali
- Original font: `NotoSansBengali[wdth,wght].ttf`.
- Copyright 2022 The Noto Project Authors (https://github.com/notofonts/bengali).
- License: SIL Open Font License 1.1; the full, unmodified license is distributed at `site/assets/fonts/OFL-noto-sans-bengali.txt` and included in the app's offline manifest.
- Retrieved on 19 November 2026.
- Subset SHA-256: `2c46f905155af5bd40a91270d113344978ded8d3f0cfe11209827c10284c4ce8`.

The original Hind Siliguri Bengali digit one appeared closed/looped at small sizes. The replacement has an open, familiar **১**, distinct from **৯**. `numerals.css` applies the face only to Unicode U+09E6–U+09EF (০–৯), keeping Bengali letters and Latin text unchanged. Numbers in headings, dates, countdowns and the tracker inherit the same digits. Nothing rewrites DOM text, accessible names, dates, chapter IDs, local-storage keys or stored progress.

The font was subset with fontTools 4.68.0 and Brotli. The width axis was fixed at its original default (`wdth=100`); the weight axis (`wght=100–900`) was retained. Its glyph outlines were not redrawn. Equivalent generation code:

```python
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

font = TTFont('NotoSansBengali[wdth,wght].ttf')
instantiateVariableFont(font, {'wdth': 100}, inplace=True)
options = subset.Options()
options.flavor = 'woff2'
options.layout_features = '*'
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=range(0x09E6, 0x09F0))
subsetter.subset(font)
font.flavor = 'woff2'
font.save('bengali-numerals.woff2')
```

The stylesheet is progressive and needs no JavaScript or remote font request. Without the font, the existing Hind Siliguri/system fallback still displays the same real Bengali characters.

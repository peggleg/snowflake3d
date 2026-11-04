# Modification record

## Existing conversion pipeline

The datasets are derived from the regular upstream TTF fonts listed in SOURCES.md, using scripts/build-fonts.mjs. The converter selects supported characters, flattens curves, simplifies polygons, extracts kerning and records hints to connect disconnected glyph components for printable lettering. It produces reusable JSON data rather than distributing the original font files.

These derivatives remain under SIL Open Font License 1.1. Original copyright statements and reserved-name declarations are unchanged in the accompanying notices. Their authors did not create or endorse these modifications.

## 4 November 2026 — derivative naming

Assigned Snowflake-specific primary names in catalog.json, generated dataset metadata, UI selectors and hints. Added original-source attribution and the modification notice to each dataset and a credits link to the existing complete third-party notices. Updated the converter to carry this metadata into future builds.

No glyph coordinates, kerning, glyph bridges, legacy recipe keys or shape-generation code changed in this naming update. Existing filenames remain compatibility identifiers. This record does not claim a new licence over the original material or impose the site's private-use terms on the font software.

# Snowflake3D derived outline fonts

These are modified, reusable outline datasets under SIL Open Font License 1.1. Their primary names differ from their upstream sources. Original source families are identified below only for attribution and reproducible conversion.

| Primary derivative name | Upstream source family | Stable recipe key |
| --- | --- | --- |
| Snowflake Clear Sans | Lato | `lato` |
| Snowflake Rounded Serif | Bree Serif | `breeserif` |
| Snowflake Flowing Script | Courgette | `courgette` |
| Snowflake Ornamental Serif | Berkshire Swash | `berkshireswash` |
| Snowflake Elegant Script | Niconne | `niconne` |
| Snowflake Fine Calligraphy | MonteCarlo | `montecarlo` |

`catalog.json` records the primary names, source attribution, original copyright headers and modification notice. Generated JSON datasets carry the same metadata. Legacy filenames and recipe keys are compatibility identifiers, not primary font-family names. Keep them stable so shared designs continue to work. The UI uses the derivative names; the complete original notices remain in each `*-OFL.txt` and in the published third-party notices. The source authors do not endorse the derivatives.

See [MODIFICATIONS.md](MODIFICATIONS.md) for changes. On 4 November 2026 only names and attribution metadata changed; glyph coordinates, kerning and bridge data stayed unchanged.

## Upstream sources and regeneration

MonteCarlo: https://github.com/google/fonts/tree/main/ofl/montecarlo

Niconne: https://github.com/google/fonts/tree/main/ofl/niconne

Both use the SIL Open Font License 1.1; original license notices are retained alongside the generated data and in the production third-party notices. The JSON files contain flattened, simplified polygon outlines derived from the official regular TTF files, not browser or operating-system fonts. No network requests or user-installed fonts are needed at runtime.

To regenerate, download MonteCarlo-Regular.ttf as montecarlo.ttf and Niconne-Regular.ttf as niconne.ttf to a local directory, then run `node scripts/build-fonts.mjs <directory> montecarlo niconne`. opentype.js is a development dependency used only for this conversion. Keep committed version-1 outline snapshots stable so saved design links reproduce their geometry.

Additional readable fonts: https://github.com/google/fonts/tree/main/ofl/lato and https://github.com/google/fonts/tree/main/ofl/breeserif (SIL OFL 1.1). Their license files are included here and in the production notices. Regenerate only chosen fonts with `node scripts/build-fonts.mjs <directory> lato breeserif`.

Recommended ornamental fonts: https://github.com/google/fonts/tree/main/ofl/courgette and https://github.com/google/fonts/tree/main/ofl/berkshireswash (SIL OFL 1.1). Regenerate with `node scripts/build-fonts.mjs <directory> courgette berkshireswash`.

# Bundled script-font outlines

MonteCarlo: https://github.com/google/fonts/tree/main/ofl/montecarlo

Niconne: https://github.com/google/fonts/tree/main/ofl/niconne

Both use the SIL Open Font License 1.1; original license notices are retained alongside the generated data and in the production third-party notices. The JSON files contain flattened, simplified polygon outlines derived from the official regular TTF files, not browser or operating-system fonts. No network requests or user-installed fonts are needed at runtime.

To regenerate, download MonteCarlo-Regular.ttf as montecarlo.ttf and Niconne-Regular.ttf as niconne.ttf to a local directory, then run `node scripts/build-fonts.mjs <directory> montecarlo niconne`. opentype.js is a development dependency used only for this conversion. Keep committed version-1 outline snapshots stable so saved design links reproduce their geometry.

Additional readable fonts: https://github.com/google/fonts/tree/main/ofl/lato and https://github.com/google/fonts/tree/main/ofl/breeserif (SIL OFL 1.1). Their license files are included here and in the production notices. Regenerate only chosen fonts with `node scripts/build-fonts.mjs <directory> lato breeserif`.

Recommended ornamental fonts: https://github.com/google/fonts/tree/main/ofl/courgette and https://github.com/google/fonts/tree/main/ofl/berkshireswash (SIL OFL 1.1). Regenerate with `node scripts/build-fonts.mjs <directory> courgette berkshireswash`.

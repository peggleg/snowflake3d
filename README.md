# Snowflake 3D

A standalone browser-based six-fold snowflake ornament generator. The app runs at `/snowflake`; `/` redirects there. No homepage, main-site links, uploads, accounts, database or sitemap.

## Development

Use Node 24 LTS and npm:

```sh
npm ci
npm run dev
```

## Checks and production build

```sh
npm test
npm run build
npm run check
```

Deploy only `dist-snowflake/`. See [Cloudflare deployment](CLOUDFLARE.md).

## Features

- Three design modes: Random, readable text repeated in six arms, and a text-inspired abstract pattern.
- New text designs default to Lato, a single readable word per arm, and 10% extra letter spacing. Lato and Bree Serif support clear capitals; single or mirrored layouts and letter spacing are adjustable. Existing links retain their saved font and mirrored layout.
- Readable text also offers MonteCarlo and Niconne mirrored script fonts with mixed case, letter-height and radial-position controls. The original block-letter font remains available and old links retain it. Up to 12 letters, digits, spaces, hyphens and apostrophes are accepted; common accented letters are normalized. Longer words need a larger body. Exports are blocked when the letter openings would be too small.
- Abstract descriptions support up to 120 characters and deterministically influence the pattern. Keywords such as full, dense, fern, lace, delicate and airy adjust the local procedural rules; no AI service is used.
- Both text modes remain entirely in-browser and are preserved by batch generation and design links. Text is part of the copied URL, so recipients can reproduce it.

- Generate 1–24 different snowflakes at a time; select a thumbnail to edit/download an individual ornament.
- Seeded, reproducible geometry with complexity, branch width, opening and fullness controls. Fullness adds broader boughs toward the tips; zero preserves the original design. Previous/Next history and Copy design link. The link restores one selected ornament, not an entire batch.
- One connected, closed mesh, flat on Z=0. Body diameter defaults to 100 mm; thickness defaults to 3 mm.
- Fixed hanging ring: 8 mm outside diameter, 4 mm bore, independent of body size.
- Binary STL and complete unsliced Bambu Studio project 3MF exports, one colour.
- A1 mini (180 mm) default and A1 (256 mm) option. Actual bounds including the ring must fit with 2 mm edge margins. Exports are blocked when the selected plate is too small.
- PLA, 0.20 mm layers, 8% gyroid, 2 walls, 3 top and 3 bottom layers. Shell thickness overrides are zero so inherited minimums cannot force extra layers.

All geometry is generated locally. The URL stores the active design recipe. Tab history is temporary. No designs are stored on a server; the hosting provider may retain ordinary access logs.

## Source and validation

Migrated from the standalone snowflake work in `peggleg/lithophane-site`. The reused STL and ZIP utilities are included locally; this repository has no dependency on the lithophane application.

Tests check seeds, ring dimensions, closed edges, connectedness, normals, volume, printer fit, batch counts, exports and project settings. The isolated build check excludes main-site navigation/assets/sitemap. Browser checks were also performed for desktop/mobile interactions and downloads. Native Bambu Studio slicing and physical printing remain manual acceptance checks.

Resolved Bambu machine, process and filament profiles, their upstream provenance and license are in `snowflake/src/profiles/`. Third-party notices are included in the production output. Keep generator version 1 geometry unchanged to preserve existing design links; use a new version and retain old-version dispatch for future geometry changes.

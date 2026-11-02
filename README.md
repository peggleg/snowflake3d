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

- **Branch growth → Airy growth** uses longer, wider-spreading boughs with spacing checks. Offshoots shrink or are omitted if they cannot fit without closing the reserved gaps. Fullness controls spread, and complexity adds detail within the available space. **Load airy rendered example** restores the exact 100 mm, complexity-18, 1.2 mm branch example. This also works on snowflake arms in alternating layouts. Existing links retain Original branching. New compact links use recipe version 5; versions 1–4 remain readable.

- Copy design link uses a compact, versioned `?d=…` recipe with a checksum. Generated seeds are packed as bytes and default settings are omitted. Exact non-default numeric settings and text are retained; no database or third-party shortener is used. Previous long `?v=1&seed=…` links still load and are rewritten to the compact form. The immutable recipe baseline and enum ordering in `share-codec.js` must remain compatible for old codes.

- **Centre shape** defaults to **Random** for new sessions. The seed chooses a solid/open star, solid/framed hexagon, solid circle/ring, petal rosette or hexagonal web. Choose a specific style to fix it, and adjust centre size from 10–30% of body diameter. Centre changes retain the surrounding seeded branch character and connect all arms. Older v1 links without centre parameters explicitly restore Original centre; choose Random in that design to opt in. The original geometry regression is retained.

- Complexity now ranges from 1–18. Levels 1–9 retain the original branch geometry; 10–15 add fixed-position secondary offshoots and outer tip boughs, and 16–18 add a third branching tier. Detail strokes use a minimum width of 0.8 mm; at small sizes or large branch widths, close details can merge. This applies to random/abstract designs and the snowflake arms of alternating text layouts.

- Rotate the on-screen preview by dragging, using the angle slider or 30° buttons. Keyboard left/right rotate 15°; Home or Reset view returns the hanging loop to the top. The preview fits every orientation and retains its angle while adjusting the design. Rotation is a view setting only: design links and STL/3MF geometry are unchanged.

- In Text mode, choose **Arm arrangement → 3 text + 3 snowflake branches** for alternating text/branch arms. Its initial branch settings match the concept render: complexity 6, fullness 80%, 1.2 mm branches and open openings. These controls remain adjustable. The six arms alternate at 60° intervals, giving the mixed pattern 120° rotational repetition. Both fonts, saved links, history, batches and exports retain the selected arrangement. Existing designs default to all six text arms.

- Three design modes: Random, readable text repeated in six arms, and a text-inspired abstract pattern.
- New text designs use the literal sample “text test” and default to the Flowing snowflake layout with Courgette. Courgette and Berkshire Swash are the recommended font choices. This layout uses mirrored script, name case for all-capital input, lighter configurable letter weight, a smaller centre connection and separated baselines. Existing saved layouts are preserved. Lato with a single readable word per arm remains optional. Lato and Bree Serif support clear capitals; single or mirrored layouts and letter spacing are adjustable. Existing links retain their saved font and mirrored layout.
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


Airy growth includes an **Outline shape** selector. The original four families are Pointed star, Feathery star, Broad crystal and Rounded snowflake. Random chooses a family from the seed; each family changes the main bough envelope before applying spacing checks. Complexity adds detail inside that envelope. New Airy centre connectors and fragment bridges use the selected main branch thickness. Frame walls retain their separate finer detail.

Compact recipe version 3 stores the outline choice. Versions 1 and 2 retain the previous outline and centre joins; the Original airy outline option preserves that geometry. Loading an old design preserves it, while generating a fresh design upgrades to random outlines unless the outline selector was explicitly set.

The expanded Random option includes nine structures: the four original Airy outlines plus Simple six-arm crystal, Broad plate arms, Hexagonal tips, Leaf branches and Fine needles. Select a family under **Outline shape** or choose **Random · all crystal families** to sample all nine. The default **Random · detailed snowflakes** retains the fuller four-family mix; sparse crystal structures are opt-in. Framed crystals use open polygon walls rather than solid plates. Recipe version 4 preserves this expanded random selection; versions 1–3 keep their previous geometry and random choices. Generating a new design from an older link uses the default detailed mix, unless a family was explicitly selected.


All new crystal families use printable detail widths, reserved gaps and complexity-driven secondary branches. Framed leaves and plates require a real opening; internal veins are omitted when they would close it. The preview uses a crisp vector outline without a blur-producing drop shadow. Recipe version 5 records the refined crystal generator; version 4 links retain their original meshes. Fresh designs use the refined generator. The browser tab uses a local SVG snowflake icon.

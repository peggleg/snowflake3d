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

- **Airy growth** is the default for new designs, including text mode. Switching a text design to Airy applies lighter letter weight and increased spacing; these values remain editable and are stored in the design link. Both six text arms and alternating text/branch arms expose the growth selector.

- **Natural crystal growth** is an optional engine. It adapts the supplied workshop HTML’s branch proportions and varied angles, with Random, Stellar dendrite, Fern and Plate families. The dark stage adds warm/cool material lighting and six initial designs; colour and rotation are preview-only. The prototype’s placeholder downloads are replaced by real watertight STL and Bambu Studio 3MF exports.

- **Branch growth → Airy growth** uses longer, wider-spreading boughs with spacing checks. Offshoots shrink or are omitted if they cannot fit without closing the reserved gaps. Fullness controls spread, and complexity adds detail within the available space. **Load airy rendered example** restores the exact 100 mm, complexity-18, 1.2 mm branch example. This also works on snowflake arms in alternating layouts. Older links retain their saved growth engine. New compact links use recipe version 10; versions 1–9 remain readable.

- Copy design link uses a compact, versioned `?d=…` recipe with a checksum. Generated seeds are packed as bytes and default settings are omitted. Exact non-default numeric settings and text are retained; no database or third-party shortener is used. Previous long `?v=1&seed=…` links still load and are rewritten to the compact form. The immutable recipe baseline and enum ordering in `share-codec.js` must remain compatible for old codes.

- **Centre shape** defaults to **Random** for new sessions. The seed chooses a solid/open star, solid/framed hexagon, solid circle/ring, petal rosette or hexagonal web. Choose a specific style to fix it, and adjust centre size from 10–30% of body diameter. Centre changes retain the surrounding seeded branch character and connect all arms. Older v1 links without centre parameters explicitly restore Original centre; choose Random in that design to opt in. The original geometry regression is retained.

- Complexity now ranges from 1–18. In Original branching, levels 1–9 retain the original branch geometry; 10–15 add fixed-position secondary offshoots and outer tip boughs, and 16–18 add a third branching tier. Detail strokes use a minimum width of 0.8 mm; at small sizes or large branch widths, close details can merge. This applies to random/abstract designs and the snowflake arms of alternating text layouts.

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
- Binary STL and complete unsliced Bambu Studio project 3MF exports. Single filament by default; optional AMS colour for centre letters only.
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


The Natural crystal engine adapts the branch proportions and varied angles in the user-supplied `snowflake-workshop.html`. Natural crystal growth offers Random, Stellar dendrite, Fern and Plate families. Fullness builds open crystal panels that are part of the exported geometry; the source prototype's translucent fills are not used as printable faces. A dark stage, warm/cool material lighting, layered vector shading and six initial seed variants follow that reference. Material colour and preview rotation do not alter the mesh or printer settings. Real STL/3MF, fixed hanging ring, printer bounds, text layouts and legacy generators remain available. Older growth engines are under More growth options.

Recipe version 6 records natural family selection and pins the new defaults. Versions 1–5 retain their previous settings and geometry. Empty or degenerate contours produced by polygon cleanup are excluded before triangulation.


## ZIP downloads and centre text

**Download ZIP** saves all designs in the current gallery batch, the current ornament, or individually checked thumbnails. Choose STL, Bambu Studio 3MF, or both. Batches from 1 to 24 are supported; each ornament remains a separate file/project. Numbered filenames avoid seed-name collisions. `designs.json` records each recipe and share URL. Invalid designs block the chosen archive before any files are produced.

Choose **Centre shape → Text** to make a readable word part of the central structure. It supports up to 12 letters, digits, spaces, apostrophes or hyphens, with Lato, Bree Serif, Courgette, Berkshire Swash, Niconne or MonteCarlo. New designs default to **Letter-to-letter · no support bar**: neighbouring letters join directly with short curved strokes where needed, and six branch connections attach to the letters at the selected branch thickness. **Support bar · original** remains available. Courgette, Niconne and MonteCarlo use tighter spacing; choosing these scripts in letter-to-letter mode converts all-capital input to mixed case for more natural joins. Older recipes preserve the original support bar. Centre size increases to 24% on selection when necessary; it remains adjustable. Text that is too small blocks exports with guidance to enlarge the centre/body or shorten the word. The recipe includes the centre text and font. Version 7 adds these fields while preserving previous recipes; text centres are opt-in and are not included in random centre selection.

Centre-font choices are grouped into clear lettering and script/ornamental styles. Recipe version 8 adds the four script/ornamental centre fonts while retaining the version-7 font ordering for saved designs.

Only Airy is offered in the Growth style menu. Natural and Original generators and their recipe fields remain implemented for saved-design compatibility; their menu options and the Natural family controls are hidden. Loading an older recipe preserves its geometry; selecting Airy opts into the visible engine.


## AMS colour for the centre word

With **Centre shape → Text**, choose **Centre-text colour → Different filament · AMS** and set the main and centre-text filament colours. The centre glyph outlines and their short letter-to-letter joining strokes are assigned to Filament 2. Branches, lettering on the arms, the centre baseline and connection bars remain on Filament 1. The preview shows that same separation. The option is off by default and is inactive for other centre shapes.

Download **Bambu Studio 3MF**, open it as a project, map the two logical filaments to your AMS slots, check the prime tower and slice. The export contains one assembled ornament with two aligned material parts, two PLA filament profiles and per-part filament assignments. Colour parts occupy the full ornament thickness, with no overlapping interiors. STL retains the original single merged geometry and cannot carry filament assignments. ZIP exports preserve the two-colour 3MF projects and settings.

The component/part ID layout follows Bambu Studio's `bbs_3mf.cpp` exporter. Filament-array keys are derived from the upstream BBL PLA profiles; one physical nozzle is retained. Tests cover watertight parts, disjoint material regions, matching total volume, centre-only colour coverage, arm text, both printers, all centre fonts, downloaded project XML, ZIPs and saved links. Native Bambu Studio slicing and a physical AMS print remain manual acceptance checks. Recipe version 9 adds the AMS mode and colours; older recipes retain their single-filament behaviour. Version 10 adds the letter-connection choice while preserving the original geometry of older links.

Refined crystal frames use continuous mitered outlines rather than separate butt-ended edge strips. This removes the small steps at polygon corners. Spines terminate inside framed hexagonal tips; the top hanging-loop neck remains connected. The correction applies to printable geometry, including STL, 3MF and AMS material parts, as well as the preview. Seed choices and motif placement are retained.

Arm-text design choices and their editing controls are hidden. Design type and Growth style controls are also hidden: new designs use Random snowflake and Airy growth. Description-driven abstract patterns and the older growth engines remain supported in saved designs; descriptions do not become lettering on the branches. Centre text, its six font choices and optional AMS colour stay available. The arm-text generators, recipe fields and existing shared arm-text designs are preserved for compatibility.

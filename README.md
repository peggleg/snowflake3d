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

- **Natural crystal growth** is an optional engine. It adapts the supplied workshop HTML’s branch proportions and varied angles, with Random, Stellar dendrite, Fern and Plate families. The dark stage adds warm/cool material lighting and six initial designs; colour and rotation are preview-only. The prototype’s placeholder downloads are replaced by real watertight STL and profile-free 3MF exports.

- **Branch growth → Airy growth** uses longer, wider-spreading boughs with spacing checks. Offshoots shrink or are omitted if they cannot fit without closing the reserved gaps. Fullness controls spread, and complexity adds detail within the available space. **Load airy rendered example** restores the exact 100 mm, complexity-18, 1.2 mm branch example. This also works on snowflake arms in alternating layouts. Older links retain their saved growth engine. New compact links use recipe version 12; versions 1–11 remain readable.

- Copy design link uses a compact, versioned `?d=…` recipe with a checksum. Generated seeds are packed as bytes and default settings are omitted. Exact non-default numeric settings and text are retained; no database or third-party shortener is used. Previous long `?v=1&seed=…` links still load and are rewritten to the compact form. The immutable recipe baseline and enum ordering in `share-codec.js` must remain compatible for old codes.

- **Centre shape** defaults to **Random** for new sessions. The seed chooses a solid/open star, solid/framed hexagon, solid circle/ring, petal rosette or hexagonal web. Choose a specific style to fix it, and adjust centre size from 10–30% of body diameter. Centre changes retain the surrounding seeded branch character and connect all arms. Older v1 links without centre parameters explicitly restore Original centre; choose Random in that design to opt in. The original geometry regression is retained.

- Complexity now ranges from 1–18. In Original branching, levels 1–9 retain the original branch geometry; 10–15 add fixed-position secondary offshoots and outer tip boughs, and 16–18 add a third branching tier. Detail strokes use a minimum width of 0.8 mm; at small sizes or large branch widths, close details can merge. This applies to random/abstract designs and the snowflake arms of alternating text layouts.

- Rotate the on-screen preview by dragging, using the angle slider or 30° buttons. Keyboard left/right rotate 15°; Home or Reset view returns the hanging loop to the top. The preview fits every orientation and retains its angle while adjusting the design. Rotation is a view setting only: design links and STL/3MF geometry are unchanged.

- In Text mode, choose **Arm arrangement → 3 text + 3 snowflake branches** for alternating text/branch arms. Its initial branch settings match the concept render: complexity 6, fullness 80%, 1.2 mm branches and open openings. These controls remain adjustable. The six arms alternate at 60° intervals, giving the mixed pattern 120° rotational repetition. Both fonts, saved links, history, batches and exports retain the selected arrangement. Existing designs default to all six text arms.

- Three design modes: Random, readable text repeated in six arms, and a text-inspired abstract pattern.
- New text designs use the literal sample “text test” and default to the Flowing snowflake layout with Snowflake Flowing Script. Snowflake Flowing Script and Snowflake Ornamental Serif are the recommended font choices. This layout uses mirrored script, name case for all-capital input, lighter configurable letter weight, a smaller centre connection and separated baselines. Existing saved layouts are preserved. Snowflake Clear Sans with a single readable word per arm remains optional. Snowflake Clear Sans and Snowflake Rounded Serif support clear capitals; single or mirrored layouts and letter spacing are adjustable. Existing links retain their saved font and mirrored layout.
- Readable text also offers Snowflake Fine Calligraphy and Snowflake Elegant Script mirrored script fonts with mixed case, letter-height and radial-position controls. The original block-letter font remains available and old links retain it. Up to 12 letters, digits, spaces, hyphens and apostrophes are accepted; common accented letters are normalized. Longer words need a larger body. Exports are blocked when the letter openings would be too small.
- Abstract descriptions support up to 120 characters and deterministically influence the pattern. Keywords such as full, dense, fern, lace, delicate and airy adjust the local procedural rules; no AI service is used.
- Both text modes remain entirely in-browser and are preserved by batch generation and design links. Text is part of the copied URL, so recipients can reproduce it.

- Generate 1–24 different snowflakes at a time; select a thumbnail to edit/download an individual ornament.
- Seeded, reproducible geometry with complexity, branch width, opening and fullness controls. Fullness adds broader boughs toward the tips; zero preserves the original design. Previous/Next history and Copy design link. The link restores one selected ornament, not an entire batch.
- One connected, closed mesh, flat on Z=0. Body diameter defaults to 100 mm; thickness defaults to 3 mm.
- Fixed hanging ring: 8 mm outside diameter, 4 mm bore, independent of body size.
- Binary STL and profile-free 3MF exports with named material parts. Single filament by default; optional AMS colour for centre letters only.
- A1 mini (180 mm) default and A1 (256 mm) option. Actual bounds including the ring must fit with 2 mm edge margins. Exports are blocked when the selected plate is too small.
- PLA, 0.20 mm layers, 8% gyroid, 2 walls, 3 top and 3 bottom layers. Shell thickness overrides are zero so inherited minimums cannot force extra layers.

All geometry is generated locally. The URL stores the active design recipe. Tab history is temporary. No designs are stored on a server; the hosting provider may retain ordinary access logs.

## Source and validation

Migrated from the standalone snowflake work in `peggleg/lithophane-site`. The reused STL and ZIP utilities are included locally; this repository has no dependency on the lithophane application.

Tests check seeds, ring dimensions, closed edges, connectedness, normals, volume, printer fit, batch counts, exports and the absence of embedded printer profiles. The isolated build check excludes main-site navigation/assets/sitemap. Browser checks were also performed for desktop/mobile interactions and downloads. Native Bambu Studio slicing and physical printing remain manual acceptance checks.

Legacy resolved Bambu profiles and their provenance/licence remain in `snowflake/src/profiles/` for historical reference. The current exporter does not import them, bundle them in browser JavaScript or embed them in downloads. Third-party notices are included in the production output. Keep generator version 1 geometry unchanged to preserve existing design links; use a new version and retain old-version dispatch for future geometry changes.


Airy growth includes an **Outline shape** selector. The original four families are Pointed star, Feathery star, Broad crystal and Rounded snowflake. Random chooses a family from the seed; each family changes the main bough envelope before applying spacing checks. Complexity adds detail inside that envelope. New Airy centre connectors and fragment bridges use the selected main branch thickness. Frame walls retain their separate finer detail.

Compact recipe version 3 stores the outline choice. Versions 1 and 2 retain the previous outline and centre joins; the Original airy outline option preserves that geometry. Loading an old design preserves it, while generating a fresh design upgrades to random outlines unless the outline selector was explicitly set.

The expanded Random option includes nine structures: the four original Airy outlines plus Simple six-arm crystal, Broad plate arms, Hexagonal tips, Leaf branches and Fine needles. Select a family under **Outline shape** or choose **Random · all crystal families** to sample all nine. The default **Random · detailed snowflakes** retains the fuller four-family mix; sparse crystal structures are opt-in. Framed crystals use open polygon walls rather than solid plates. Recipe version 4 preserves this expanded random selection; versions 1–3 keep their previous geometry and random choices. Generating a new design from an older link uses the default detailed mix, unless a family was explicitly selected.


All new crystal families use printable detail widths, reserved gaps and complexity-driven secondary branches. Framed leaves and plates require a real opening; internal veins are omitted when they would close it. The preview uses a crisp vector outline without a blur-producing drop shadow. Recipe version 5 records the refined crystal generator; version 4 links retain their original meshes. Fresh designs use the refined generator. The browser tab uses a local SVG snowflake icon.


The Natural crystal engine adapts the branch proportions and varied angles in the user-supplied `snowflake-workshop.html`. Natural crystal growth offers Random, Stellar dendrite, Fern and Plate families. Fullness builds open crystal panels that are part of the exported geometry; the source prototype's translucent fills are not used as printable faces. A dark stage, warm/cool material lighting, layered vector shading and six initial seed variants follow that reference. Material colour and preview rotation do not alter the mesh or printer settings. Real STL/3MF, fixed hanging ring, printer bounds, text layouts and legacy generators remain available. Older growth engines are under More growth options.

Recipe version 6 records natural family selection and pins the new defaults. Versions 1–5 retain their previous settings and geometry. Empty or degenerate contours produced by polygon cleanup are excluded before triangulation.


## ZIP downloads and centre text

**Download ZIP** saves all designs in the current gallery batch, the current ornament, or individually checked thumbnails. Choose STL, 3MF, or both. Batches from 1 to 24 are supported; each ornament remains a separate file. Numbered filenames avoid seed-name collisions. `designs.json` records each recipe and share URL. Invalid designs block the chosen archive before any files are produced.

Choose **Centre shape → Text** to make a readable word part of the central structure. It supports up to 12 letters, digits, spaces, apostrophes or hyphens, with Snowflake Clear Sans, Snowflake Rounded Serif, Snowflake Flowing Script, Snowflake Ornamental Serif, Snowflake Elegant Script or Snowflake Fine Calligraphy. New centre-text designs default to an open frame, with connected letters and short joins at each end. Solid flush AMS and raised-text layouts also support the letters without bending the snowflake arms. Snowflake Flowing Script, Snowflake Elegant Script and Snowflake Fine Calligraphy support flowing mixed-case words. Centre size increases to 26% on selection when necessary; it remains adjustable. Text that is too small blocks exports with guidance to enlarge the centre/body or shorten the word. The recipe includes the centre text and font. Version 7 adds these fields while preserving previous recipes; text centres are opt-in and are not included in random centre selection.

Centre-font choices are grouped into clear lettering and script/ornamental styles. Recipe version 8 adds the four script/ornamental centre fonts while retaining the version-7 font ordering for saved designs.

Only Airy is offered in the Growth style menu. Natural and Original generators and their recipe fields remain implemented for saved-design compatibility; their menu options and the Natural family controls are hidden. Loading an older recipe preserves its geometry; selecting Airy opts into the visible engine.


## AMS colour for the centre word

With **Centre shape → Text**, choose **Centre-text colour → Different filament · AMS** and set the main and centre-text filament colours. The centre glyph outlines and their short letter-to-letter joining strokes are assigned to Filament 2. Branches, lettering on the arms, the centre baseline and connection bars remain on Filament 1. The preview shows that same separation. The option is off by default and is inactive for other centre shapes.

Download **3MF** and import it into your slicer. A geometry-only message is expected: select your printer/nozzle, filament and process (for example, 0.20 mm Standard). For AMS text, add two filaments and assign the body to filament 1 and centre letters to filament 2; verify the sliced preview. Each file contains one assembled ornament with aligned, named material parts, standard material colour metadata and part assignments, without printer/process/filament profiles or machine G-code. Colour selection may need manual assignment in the slicer. Flush and open-frame colour parts occupy the ornament thickness. Raised letters occupy only the extra 0.6 mm above the solid backing. STL remains a single merged mesh. ZIP exports use the same profile-free exporter and include setup instructions.

The geometry/part layout was tested manually by the user in Bambu Studio: geometry imports, separate text can be assigned a colour, and raised, flush and open examples slice. Raised text produced one filament change; full-thickness text required changes throughout the body layers. No new physical print is claimed. Build-plate labels are dimensions only; legacy `mini`/`a1` recipe values remain internal for shared-link compatibility. Automated checks cover geometry, two-colour parts, plate positioning, archives and exclusion of legacy profiles from browser bundles.

Refined crystal frames use continuous mitered outlines rather than separate butt-ended edge strips. This removes the small steps at polygon corners. Spines terminate inside framed hexagonal tips; the top hanging-loop neck remains connected. The correction applies to printable geometry, including STL, 3MF and AMS material parts, as well as the preview. Seed choices and motif placement are retained.

Arm-text design choices and their editing controls are hidden. Design type and Growth style controls are also hidden: new designs use Random snowflake and Airy growth. Description-driven abstract patterns and the older growth engines remain supported in saved designs; descriptions do not become lettering on the branches. Centre text, its six font choices and optional AMS colour stay available. The arm-text generators, recipe fields and existing shared arm-text designs are preserved for compatibility.


## Text on solid centres and inside open frames

With **Centre shape → Text**, use **Text layout** to choose **Solid centre + AMS text** or **Open frame + joined text**. Each offers a seed-based random choice, a hexagon or a circle. Solid centres use flush full-thickness AMS lettering automatically; only the centre word uses filament 2. Open frames connect the joined word to the inner frame at its first and last letters, with no support bar below it. The six snowflake arms attach to the frame on their normal axes. Open frames work in one filament or with optional AMS text.

Choosing either style raises centre size to 26% when needed. Open styles select Snowflake Flowing Script and convert all-capital input to mixed case for flowing joins; the font and word remain editable. Text that is too small still blocks exports. Recipe version 11 introduced these layouts. Version 12 makes a centre shape mandatory for centre-text designs: old direct-to-letter and support-bar recipes now load as an open random frame, retaining the word and font and increasing centre size to at least 26%. Those unframed menu choices are hidden. Non-text designs retain their existing geometry. ZIP exports retain the selected layout and AMS assignments.


**Raised text** offers a solid random centre, hexagon or circle, with letters 0.6 mm above the body (three layers at 0.2 mm). It works in one filament or with optional AMS. The back stays flat; the combined STL is one closed stepped solid. AMS projects contain the complete body below and only the raised letters above, with their surfaces aligned and no overlapping volume. Previews indicate the raised word with a small shadow. New centre-text designs default to an open random frame; every visible text layout includes a centre shape.


Derived outline fonts use Snowflake-specific primary names. Original source families, copyright notices, OFL licences and conversion details are retained in `snowflake/src/fonts/SOURCES.md`, `catalog.json` and `MODIFICATIONS.md`, and the public third-party notices. Legacy recipe identifiers remain unchanged. The naming update does not change glyphs, kerning or generated geometry.


## Privacy enquiry form

`/contact` is a separate form backed by `/api/contact` in Cloudflare Pages Functions. Submissions are emailed to one private verified destination, with server-side Turnstile validation and no website database. Runtime settings are required before the form becomes available. See [CONTACT_SETUP.md](CONTACT_SETUP.md). The generator and static assets remain outside the Function route.


## Consent-first Analytics

Google Analytics uses an explicit consent dialog and persistent Cookie settings. `/analytics` explains the cookies and events; the enquiry and information pages do not load the tag. App events exclude design recipes, entered text, filenames and copied links. Search Console Domain verification was confirmed by the operator; preview remains excluded from indexing. See [ANALYTICS_SETUP.md](ANALYTICS_SETUP.md) for settings, tests and remaining production steps.

## Public information pages

The workshop footer links to `/privacy`, `/usage`, `/help`, `/independence` and the existing full third-party notices. The privacy form and cookie information page also link to the notice. All information pages offer Cookie settings but explicitly disable Google tag loading, even when analytics consent is already saved. Preview remains excluded from indexing.

Usage is private and non-commercial for generated files and printed objects, with separate third-party licence rights preserved. Help describes profile-free 3MF imports and manual AMS assignment. Independence wording excludes affiliation, sponsorship, approval and endorsement by Bambu Lab, MakerWorld or MakerLab. Public privacy contact is the enquiry form; no personal operator name or receiving inbox address is published. Applicable operator-disclosure requirements and provider/account settings remain private launch-review items; these pages are not a claim that every legal requirement has been verified.

## Search and sharing metadata

The Pages main branch generates production SEO for snowflake3d.com: per-page titles/descriptions, clean canonical URLs, Open Graph/Twitter cards, a 1200 × 630 social image, sitemap and robots rules. Preview/unknown branches remain noindex with robots exclusion; production contact/analytics pages and Pages-hostname responses also remain noindex. No design recipe or entered text is inserted into metadata. See CLOUDFLARE.md for verification, domain setup, Search Console submission and recovery.

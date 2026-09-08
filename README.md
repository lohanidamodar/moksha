# Moksha

Store assets for a mobile app: screenshot mockups, feature graphics, promo
banners, app-icon showcases and social cards, for the App Store and Google Play.

A listing is a set of assets that share a look and a voice, so Moksha keeps it
in a file — `moksha/moksha.json`, in the app's own repo. That file is diffable,
versioned with the app it advertises, and re-runnable, so next release's
screenshots are one command rather than an afternoon. The studio is a visual
editor for the same file.

Every asset is checked against the rules of the store it targets before you
find out from a rejection.

## Quick start

From the app's repo:

```sh
npm i -g @popupbits/moksha   # or prefix each command with `npx @popupbits/moksha`

moksha init "My App"         # writes moksha/moksha.json
moksha studio                # design it in the browser
moksha render                # every asset, every locale, verified
```

`render` writes to `moksha/out/`, grouped the way an upload expects, so a folder
goes straight into App Store Connect or the Play Console:

```
moksha/out/
├── en/
│   ├── ios/screenshots/phone/home.png
│   ├── android/screenshots/phone/home.png
│   └── android/feature-graphic/feature.png
└── ne/
    └── ...
```

Add `moksha/out/` to the app's `.gitignore`; commit `moksha/moksha.json` and the
captures it references.

## Commands

| Command | Does |
|---|---|
| `moksha init [name]` | Write `moksha/moksha.json` for this app |
| `moksha doctor` | Check the project, the toolchain and the font cache |
| `moksha validate` | Check the project against the store rules, without rendering |
| `moksha capture` | Drive the app with Patrol and photograph its screens |
| `moksha render` | Render every asset, for every locale, and verify it |
| `moksha preview` | Record the app preview video and check it against the store |
| `moksha studio` | Open the editor on this project (`--port`, `--no-open`) |
| `moksha schema` | Every legal option, as JSON |

Options: `--project <path>` (default: `moksha/moksha.json`, searched upwards from
the working directory, so the commands work anywhere inside the repo),
`--locale <code>`, `--asset <id>` (repeatable), `--out <dir>`.

`render` exits non-zero when anything breaks a store rule, so a release pipeline
fails there rather than at upload.

## Capture

`moksha capture` drives the app on a device and photographs the screens the
listing needs — the half that was otherwise manual.

```sh
moksha capture --scaffold           # the two Dart files the app repo needs
moksha capture --platform android   # run it
```

A [Patrol](https://pub.dev/packages/patrol) test walks the app and calls
`captureScene($, 'home')` at each screen; that call blocks until the host has
taken and written the shot, so the test cannot navigate away mid-capture. The
host does the photographing — `adb exec-out screencap` and `xcrun simctl io
screenshot` — at native resolution.

Patrol rather than plain `integration_test` because it drives the native layer:
a permission sheet sitting on top of the screen you are photographing can be
dismissed first. Note its own in-test `takeNativeScreenshot` is *not* what
Moksha uses — it is documented Android-only and "never throws if the capture
fails", which is how you end up with a green run and no images.

Before each run the status bar is pinned to 9:41, full battery, no
notifications, and restored afterwards; `"capture": { "statusBar": false }`
turns that off. iOS captures need a macOS host with a booted simulator;
Android works on Windows, WSL, Linux and macOS. Moksha finds `adb` in the SDK
even when it is not on the PATH, including the Windows-side SDK from WSL
(`MOKSHA_ADB` overrides).

Captures land in `moksha/captures/<platform>/<scene>.png`. That directory is
plain PNGs and nothing depends on Moksha having produced them, so an app that
gets its screenshots another way loses nothing.

A raw capture is not an uploadable asset: a 1080x2340 phone screen is 2.17:1
with an alpha channel, and Play refuses both. Framing it with `moksha render`
is what makes it one.

## The preview video

```sh
moksha preview --platform ios
```

Records the device while a Patrol test drives one short journey — see the main
screen, start a core action, finish it — then transcodes to the size the store
wants and checks it. Deliberately unframed and uncaptioned: Apple requires an
app preview to be a plain screen recording.

Apple uploads the file and enforces 15 to 30 seconds, so the test's pacing is
the thing to adjust when it fails. Play takes a YouTube link rather than an
upload, so the Android video is rendered for you to post yourself and no
duration applies. Needs `ffmpeg` on the PATH.

## Use it from a coding agent

Moksha ships an agent skill, so the whole pipeline is one prompt from the app's
repo:

```sh
npx skills add lohanidamodar/moksha              # Cursor, Codex, any agent

/plugin marketplace add lohanidamodar/moksha     # Claude Code
/plugin install moksha@moksha
```

Then, from the app repo: *"make store screenshots with moksha"*. The agent
picks the screens, writes the Patrol test and the copy, renders, and opens the
studio. Follow-ups like *"use a darker background"* or *"add Nepali"* edit the
same file.

## The project file

```jsonc
{
  "version": 1,
  "app": { "name": "My App" },
  "locales": ["en", "ne"],
  "out": "out",

  // Defaults every asset inherits.
  "design": {
    "background": { "type": "mesh", "id": "aurora" },
    "pattern": { "id": "dots" },
    // The rhythm across each asset type's strip: a built-in, or your own
    // array of layout ids. See Templates below.
    "template": "panoramic",
    // One family per locale: Montserrat has no Devanagari at all, so a Nepali
    // listing needs a different typeface, not different words in the same one.
    "font": { "en": "Montserrat", "ne": "Noto Sans Devanagari" },
    // Per asset type, when the type's own default is not what you want.
    "frames": { "android-phone-screenshot": "pixel-black" }
  },

  "assets": [
    {
      "id": "home",                       // names the output file
      "assetType": "iphone-screenshot",
      // One composition sliced across two tiles: home-1.png and home-2.png.
      "layout": "panorama",
      "span": 2,
      "images": { "screenshot": "captures/ios/home.png" },
      "text": [
        {
          "text": { "en": "Everything in one place", "ne": "..." },
          "anchor": "top-left",
          "fontSize": 0.07,
          "weight": 800
        }
      ]
    },
    {
      "id": "feature",
      "assetType": "feature-graphic",
      "layout": "logo-center",
      "images": { "logo": "captures/logo.png" },
      "pattern": null,                    // null means none, not "inherit"
      "background": { "type": "solid", "id": "custom", "color": "#0f172a" },
      "text": [{ "text": "My App", "anchor": "bottom-center", "fontSize": 0.1 }]
    }
  ],

  // How `moksha capture` drives the app. Leave it out if captures come from
  // somewhere else.
  "capture": {
    "test": "integration_test/store_screenshots.dart",
    "scenes": ["home", "search", "settings"]
  },

  // Read only by the studio's store preview.
  "store": {
    "subtitle": { "en": "Everything, in one place" },
    "developer": "PopupBits",
    "category": "Productivity",
    "rating": 4.8,
    "ratingCount": "1.2K Ratings",
    "ageRating": "4+",
    "price": "Free",
    "description": { "en": "Two or three short paragraphs, store voice." }
  }
}
```

Every path is relative to the project file, so a project moves with the repo.
Any text field takes either one string or a record of one string per locale; a
record missing a locale is an error, not a blank headline.

Precedence for every visual choice: the asset's own value, then `design`, then
the asset type's default. `moksha schema` prints every legal value, and a
complete example, without needing the studio running.

## Asset Types

Screenshot mockups are split by device family — each has its own frame defaults
and size variants:

| Asset Type | Sizes | Default Frame |
|---|---|---|
| `iphone-screenshot` | iPhone 6.9", 6.7", 6.5", 6.1", 5.5" | iPhone Dynamic Island |
| `ipad-screenshot` | iPad 13", iPad Pro 12.9", iPad 10.5" | iPad |
| `android-phone-screenshot` | Android Phone 1080x1920 | Android Punch Hole |
| `android-tablet-screenshot` | Android 7" (1200x1920), 10" (1600x2560) | Android Clean |
| `feature-graphic` | Play Store 1024x500 | n/a |
| `promo-banner` | 1024x500, 1024x1024 | optional phone frame |
| `app-icon-showcase` | 1024x1024, 512x512 | n/a |
| `social-card` | OG (1200x630), Twitter (1200x675), Instagram (1080x1080) | optional phone frame |

## Store rules are checked, not assumed

Every rendered asset is validated against the store it targets, and `render`
exits non-zero if any fails. These are the failures that produce a perfectly
valid image file a store then refuses — or one nobody notices is broken:

- **No alpha channel.** Play wants "JPEG or 24-bit PNG (no alpha)" and Apple
  rejects transparency. Neither canvas can encode without one, so output is
  re-encoded losslessly as 24-bit PNG — in the browser as well as on the server.
- **Play aspect ratio.** The long side may be at most twice the short side, so a
  raw 1080x2400 phone capture is refused at its own native resolution. Framing
  it is what makes it uploadable.
- **Apple dimensions.** Must match a size App Store Connect accepts.
- **Feature graphics and icons** are measured as what they are: a 1024x500
  feature graphic is 2.05:1 and correct, and is not held to the screenshot
  aspect limit.
- **Fonts that render as boxes.** A family that fails to register does not
  throw, and a family that registers may still have no glyphs for the script —
  Montserrat draws Nepali as a row of identical boxes. Both are reported
  against the asset they affect.

Five families ship with the package — Inter, Montserrat, Lato, Bebas Neue and
Noto Sans Devanagari — so a fresh clone renders its own defaults, and Nepali,
with no network at all. Any other Google Font is fetched once and cached under
the user's cache directory (`MOKSHA_FONT_CACHE` to move it), so renders stay
offline and reproducible after that.

### Templates

Five tiles in the same layout read as a spreadsheet. A template is the rhythm
of a whole strip — a sequence of layouts applied to an asset type's assets in
order, repeating if it is shorter than the set:

| Template | Rhythm |
|---|---|
| `uniform` | Every tile in the project's one layout |
| `editorial` | A hero opener, a tilt, a left-titled tile, a breather, a counter-tilt |
| `showcase` | Hero first, then alternating tilts around a right-titled tile |
| `magazine` | Titled tiles alternating with big devices |
| `dynamic` | Tilts and perspective, resolving on a hero |
| `panoramic` | Opens on a two-tile panorama, then settles into single tiles |

Or give your own: `"template": ["hero-center", "tilt-left", "float-up"]`.

It applies per asset type, so the iPhone strip and the Android strip each start
the rhythm from the beginning — they are separate listings. An asset's own
`layout` always wins, and a template naming a layout an asset type does not
have falls through to that type's default.

### Layouts

All four screenshot asset types share the same 12 layouts: `tilt-right`,
`left-title`, `float-up`, `tilt-left`, `right-title`, `bottom-emerge`,
`perspective`, `hero-center`, `split-left`, `split-right`, and the two spanning
layouts `panorama` and `panorama-center`.

**Spanning layouts** draw one composition across several store tiles and slice
it, so a device photographed across two tiles reads as one image when they sit
next to each other in the listing. One asset entry, `span` files:

```jsonc
{ "id": "hero", "assetType": "iphone-screenshot", "layout": "panorama", "span": 2 }
// -> hero-1.png, hero-2.png
```

`span` goes up to 5 and defaults to the layout's own (2 for both panoramas).
Drawing once and cropping is what guarantees the seam — a gradient generated
per-canvas would not match across separately-drawn tiles.

`split-left` + `split-right` are the older hand-built version of the same idea:
two separate assets you keep in sync yourself.

### Phone Frames

21 frame styles across iOS, Android, and universal:

**iPhone (6):** `iphone-dynamic-island`, `iphone-dynamic-island-white`, `iphone-dynamic-island-natural`, `iphone-dynamic-island-gold`, `iphone-notch`, `iphone-notch-white`

**iPad (3):** `ipad` (Space Gray), `ipad-silver`, `ipad-gold`

**Android (10):**
- Pixel: `pixel` (Cream), `pixel-black` (Obsidian), `pixel-white` (Porcelain) — with horizontal camera bar
- Galaxy: `galaxy` (Titanium), `galaxy-black` (Phantom Black), `galaxy-white` (Phantom White) — centered punch hole
- Other: `oneplus` (corner punch hole), `android-waterdrop` (teardrop notch), `android-punch-hole`, `android-clean`

**Universal (2):** `frameless` (no body, soft shadow only), `frameless-bordered` (no body + thin auto-contrast outline)

#### Allowed Per Asset Type

| Asset Type | Allowed Frames |
|---|---|
| iphone-screenshot | All iPhone variants + frameless / frameless-bordered |
| ipad-screenshot | All iPad variants + frameless / frameless-bordered |
| android-phone-screenshot | Pixel/Galaxy color variants, OnePlus, Waterdrop, Punch Hole, Clean + frameless / frameless-bordered |
| android-tablet-screenshot | Galaxy color variants, Punch Hole, Clean + frameless / frameless-bordered |
| promo-banner, social-card | any (only used when a screenshot is provided) |

The API accepts any `phoneFrame` value, but for best results pick from the asset type's `allowedPhoneFrames` returned by `GET /api/render`.

### Image Fields

| Field | Used by |
|---|---|
| `screenshot` | the four screenshot types, promo-banner, social-card |
| `logo` | feature-graphic, promo-banner, social-card |
| `icon` | app-icon-showcase |

### Backgrounds and Patterns

Background and pattern are independent layers — pick any pattern over any background.

#### Gradients (19) — `{ "type": "gradient", "id": "..." }`

**Vibrant:** `sunset-pink`, `blue-violet`, `emerald`, `hot-magenta`, `ocean`, `indigo-dream`, `amber`, `red-orange`

**Sophisticated dark:** `dark-teal`, `midnight-blue`, `space-gray`, `deep-ocean`, `midnight-purple`, `forest-night`

**Soft pastels (light):** `peachy`, `soft-pink`, `mint-cream`, `lavender-mist`, `morning-sun`

#### Mesh Gradients (9) — `{ "type": "mesh", "id": "..." }`

Multi-color radial blob gradients for a modern designer feel.

**Dark:** `aurora`, `sunset-mesh`, `ocean-mesh`, `forest-mesh`, `rose-mesh`, `royal-mesh`

**Light:** `pastel-mesh`, `cloud-mesh`, `sage-mesh`

#### Solids (18 + custom) — `{ "type": "solid", "id": "..." }`

**Dark:** `pure-black`, `dark-charcoal`, `navy`, `forest-green`, `deep-purple`, `crimson`, `slate`, `graphite`, `midnight-indigo`, `brand-blue`, `brand-purple`, `brand-orange`

**Light:** `pure-white`, `cream`, `ivory`, `soft-gray`, `beige`, `warm-sand`

**Custom:** `{ "type": "solid", "id": "custom", "color": "#7c3aed" }` — any hex color. Tone (light/dark) is auto-detected from luminance.

#### Patterns (20) — `{ "id": "..." }` overlay on top of background

**Tone-aware** (auto-pick light/dark overlay color based on background):
`dots`, `soft-grid`, `grid`, `topography`, `diagonal-lines`, `vertical-lines` (pinstripes), `hex-grid`, `triangles`, `plus` (Apple-style plus marks), `stars`, `halftone`, `noise`, `circles`, `waves`, `crosshatch`, `geometric`

**Decorative** (fixed colors, ignore background tone): `bokeh`, `aurora-streaks`, `confetti`, `memphis`

You can override pattern color and opacity: `{ "id": "dots", "color": "#fff", "opacity": 0.12 }`.

### Text Overlays

Add arbitrary text on top of any asset. Each overlay is fully independent — its own font, size, color, position, alignment, and rotation. Two ways to position:

- **Named anchor (convenience):** `top-left`, `top-center`, `top-right`, `center-left`, `center`, `center-right`, `bottom-left`, `bottom-center`, `bottom-right`. Each anchor sets a sensible default text alignment.
- **Numeric coordinates:** `x` and `y` as fractions of the canvas (`0` = left/top, `1` = right/bottom).

| Field | Type | Default | Notes |
|---|---|---|---|
| `text` | string | — | Text to render. Use `\n` for line breaks. |
| `anchor` | string | — | One of the named anchors above. Use this OR `x`/`y`. |
| `offsetX`, `offsetY` | number | 0 | Optional nudge from the anchor, as fraction of canvas. |
| `x`, `y` | number (0..1) | 0.5 | Position when no `anchor` is set. |
| `fontSize` | number (0..1) | 0.06 | Font size as fraction of canvas width. |
| `font` | string | Inter | Any Google Font family name. |
| `weight` | number | 700 | 100–900. |
| `color` | string | auto | CSS color. Omit for auto-contrast against the background. |
| `align` | string | inherits | `left` \| `center` \| `right`. |
| `rotation` | number | 0 | Degrees. |
| `shadow` | boolean | true | Soft drop shadow for legibility. |

```sh
curl -X POST http://localhost:5173/api/render \
  -H "Content-Type: application/json" \
  -d '{
    "assetType": "iphone-screenshot",
    "layout": "tilt-right",
    "background": { "type": "gradient", "id": "sunset-pink" },
    "phoneFrame": "iphone-dynamic-island",
    "textOverlays": [
      { "text": "NEW", "anchor": "top-right", "font": "Bebas Neue", "fontSize": 0.08, "color": "#ffd60a", "rotation": -8 },
      { "text": "Tap to start", "anchor": "bottom-center", "fontSize": 0.04 },
      { "text": "Custom\nplacement", "x": 0.18, "y": 0.4, "align": "left", "font": "Montserrat", "weight": 800, "fontSize": 0.07 }
    ]
  }' \
  --output mockup.png
```

### Fonts

Any Google Font family name works. Common picks: `Inter`, `Montserrat`,
`Open Sans`, `Bebas Neue`, `Lato`, `Poppins`, `Playfair Display`. For Devanagari
use a family that covers it, such as `Noto Sans Devanagari`. Set it per project
(`design.font`) or per overlay (`text[].font`), either as one name or one per
locale.

## HTTP API

The studio also exposes a rendering API, for a caller that would rather not
write a project file. `GET /api/render` returns the full schema.

`POST /api/render` renders one asset and returns a PNG; `POST /api/render/batch`
renders many and returns a ZIP with a `manifest.json`. Both take the same config
shape as a project asset, with images either uploaded as multipart fields
(`screenshot`, `logo`, `icon`) or mapped per config with `imageRefs`.

```sh
curl -X POST http://localhost:4321/api/render \
  -H "Content-Type: application/json" \
  -d '{
    "assetType": "iphone-screenshot",
    "layout": "tilt-right",
    "background": { "type": "gradient", "id": "sunset-pink" },
    "phoneFrame": "iphone-dynamic-island",
    "textOverlays": [{ "text": "My App", "anchor": "top-left", "fontSize": 0.07, "weight": 800 }]
  }' \
  --output mockup.png
```

The studio's `/preview` page renders the project as the product page a shopper
meets — App Store and Google Play, with Play's feature graphic in its real
place at the head of the listing — so a strip can be judged as a strip.

The studio serves `/api/project` too: `GET` for the open project and every legal
option, `PUT` to save it, and `POST /api/project/image` to add a capture.

## Development

Built with SvelteKit + Svelte 5. The renderer, asset types, store rules and PNG
encoder are plain modules under `src/core/` with no SvelteKit and no bundler —
the CLI imports them directly, and the studio reaches them through a `$core`
alias, so the browser preview and the exported PNG cannot drift apart.

```sh
npm install
npm run dev      # the studio, with MOKSHA_PROJECT pointing at a project
npm test         # node's own test runner, no framework
npm run e2e      # drives the CLI in a throwaway app repo and checks what lands
npm run test:offline   # proves the bundled fonts need no network, by removing it
npm run build    # the studio, which `moksha studio` serves
npm run vendor:fonts   # re-download assets/fonts (committed; only when the set changes)
```

Unverified here, for want of the hardware: a full `patrol` run (needs
patrol_cli and a test in a real app repo) and the `preview` pipeline end to
end (needs ffmpeg). The host-side capture path is verified against a real
Android device, and every rule and command those two build on is unit-tested.
```

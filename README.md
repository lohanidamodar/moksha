# Moksha

App store asset generator. Create screenshot mockups, feature graphics, promo banners, app icon showcases, and social cards for iOS and Android.

Built with SvelteKit + Svelte 5.

## Setup

```sh
npm install
npm run dev
```

The editor works out of the box with no backend — you can design and queue up assets and export a ZIP locally. To save **projects**, **uploaded screenshots/logos**, and **queued designs** across sessions, point Moksha at an Appwrite backend (see below).

## Appwrite (auth + project storage)

Moksha uses [Appwrite](https://appwrite.io) for accounts, project storage, image uploads, and saved designs. The project id defaults to `moksha`; everything else is overridable via env vars.

### Environment variables

Copy `.env.example` to `.env` and override what you need:

```sh
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=moksha

VITE_APPWRITE_DATABASE_ID=moksha
VITE_APPWRITE_PROJECTS_COLLECTION=projects
VITE_APPWRITE_ASSETS_COLLECTION=assets
VITE_APPWRITE_DESIGNS_COLLECTION=designs

VITE_APPWRITE_BUCKET_ID=moksha-assets
```

These vars must be `VITE_`-prefixed so they're exposed to the browser. When deploying via **Appwrite Sites**, set them in the site's environment configuration.

### Required Appwrite resources

In your Appwrite project (id: `moksha` by default), provision:

**Auth** — Enable the **Email/Password** provider. Add your site's URL (e.g. `https://your-site.appwrite.network`) to the project's allowed Web platforms.

**Database** `moksha` with three collections:

`projects`
- `name` — string, required
- `description` — string, optional
- `ownerId` — string, required (indexed)

`assets`
- `projectId` — string, required (indexed)
- `ownerId` — string, required (indexed)
- `category` — string, required (`screenshot` | `logo` | `icon`)
- `fileId` — string, required
- `name` — string
- `mimeType` — string

`designs`
- `projectId` — string, required (indexed)
- `ownerId` — string, required (indexed)
- `assetType` — string, required
- `sizeId` — string, optional
- `layout` — string, required
- `config` — string (JSON blob, up to ~1 MB depending on overlay/transform count)
- `thumbnail` — string (base64 data URL, optional)

Set the document security on each collection to **document-level permissions**. Moksha attaches read/update/delete permissions for `Role.user(<ownerId>)` to every doc it creates.

**Storage** — Bucket `moksha-assets`. Allow image MIME types (PNG, JPEG, WebP, SVG). Document-level permissions (Moksha attaches per-user permissions on each upload).

### Deploying to Appwrite Sites

Moksha is a SvelteKit app using `@sveltejs/adapter-node`, which runs as a Node service on Appwrite Sites:

1. Push this repo to a git host connected to Appwrite Sites.
2. Create a new Site in your Appwrite project.
3. Build command: `npm run build`. Output / install: defaults are fine.
4. Set the `VITE_APPWRITE_*` env vars listed above on the site.
5. Deploy. The site exposes both the editor at `/` and the rendering API at `/api/render*`.

## Asset Types

Moksha splits screenshot mockups by device family — each has its own frame defaults and size variants:

| Asset Type | Sizes | Default Frame |
|---|---|---|
| `iphone-screenshot` | iPhone 6.7", 6.5", 6.1", 5.5" | iPhone Dynamic Island |
| `ipad-screenshot` | iPad Pro 12.9", iPad 10.5" | iPad |
| `android-phone-screenshot` | Android Phone 1080x1920 | Android Punch Hole |
| `android-tablet-screenshot` | Android 7" (1200x1920), 10" (1600x2560) | Android Clean |
| `feature-graphic` | Play Store 1024x500 | n/a |
| `promo-banner` | 1024x500, 1024x1024 | optional phone frame |
| `app-icon-showcase` | 1024x1024, 512x512 | n/a |
| `social-card` | OG (1200x630), Twitter (1200x675), Instagram (1080x1080) | optional phone frame |

If you want screenshots for both iPhone and Android, create one mockup of each asset type — they don't share state.

## API

Moksha exposes a server-side rendering API for programmatic asset generation.

### `GET /api/render`

Returns the full API schema — all asset types, sizes, layouts, backgrounds, phone frames, fonts, and examples.

```sh
curl http://localhost:5173/api/render | jq .
```

### `POST /api/render`

Render a single asset. Returns a PNG image.

**JSON body (no images):**

```sh
curl -X POST http://localhost:5173/api/render \
  -H "Content-Type: application/json" \
  -d '{
    "assetType": "iphone-screenshot",
    "layout": "tilt-right",
    "background": { "type": "gradient", "id": "sunset-pink" },
    "phoneFrame": "iphone-dynamic-island",
    "textOverlays": [
      { "text": "My App", "anchor": "top-left", "fontSize": 0.07, "weight": 800 },
      { "text": "Best app ever", "anchor": "top-left", "offsetY": 0.08, "fontSize": 0.04 }
    ]
  }' \
  --output mockup.png
```

**Multipart form (with images):**

```sh
curl -X POST http://localhost:5173/api/render \
  -F 'config={
    "assetType": "android-phone-screenshot",
    "sizeId": "android-phone",
    "layout": "hero-center",
    "background": { "type": "pattern", "id": "dots" },
    "phoneFrame": "android-punch-hole",
    "textOverlays": [
      { "text": "Amazing App", "anchor": "top-center", "font": "Bebas Neue", "fontSize": 0.08 },
      { "text": "Download now", "anchor": "bottom-center", "font": "Lato", "fontSize": 0.04 }
    ]
  }' \
  -F screenshot=@screenshot.png \
  --output mockup.png
```

### `POST /api/render/batch`

Render multiple assets. Returns a ZIP file with all images and a `manifest.json`.

```sh
curl -X POST http://localhost:5173/api/render/batch \
  -F 'configs=[
    {
      "assetType": "iphone-screenshot",
      "layout": "tilt-right",
      "background": { "type": "gradient", "id": "sunset-pink" },
      "textOverlays": [{ "text": "Screen 1", "anchor": "top-left", "fontSize": 0.07, "weight": 800 }],
      "imageRefs": { "screenshot": "iphone-shot" }
    },
    {
      "assetType": "android-phone-screenshot",
      "layout": "tilt-right",
      "phoneFrame": "android-punch-hole",
      "background": { "type": "gradient", "id": "sunset-pink" },
      "textOverlays": [{ "text": "Screen 1", "anchor": "top-left", "fontSize": 0.07, "weight": 800 }],
      "imageRefs": { "screenshot": "android-shot" }
    },
    {
      "assetType": "feature-graphic",
      "layout": "logo-center",
      "background": { "type": "gradient", "id": "emerald" },
      "textOverlays": [{ "text": "My App", "anchor": "bottom-center", "fontSize": 0.1, "weight": 800 }],
      "imageRefs": { "logo": "applogo" }
    }
  ]' \
  -F iphone-shot=@iphone-screenshot.png \
  -F android-shot=@android-screenshot.png \
  -F applogo=@logo.png \
  --output assets.zip
```

Use `imageRefs` to map config image inputs (e.g. `screenshot`, `logo`, `icon`) to uploaded form field names. This lets each config in the batch use a different uploaded image. If `imageRefs` is omitted, defaults to field names `screenshot`, `logo`, `icon`.

### Config Reference

| Field | Type | Description |
|---|---|---|
| `assetType` | string (required) | One of: `iphone-screenshot`, `ipad-screenshot`, `android-phone-screenshot`, `android-tablet-screenshot`, `feature-graphic`, `promo-banner`, `app-icon-showcase`, `social-card` |
| `sizeId` | string | Size variant. Defaults to first size of the asset type. |
| `layout` | string | Layout id. Defaults to first layout. |
| `background` | object | `{ type: "gradient" \| "mesh" \| "solid", id: "preset-id" }`. For a custom color, use `{ type: "solid", id: "custom", color: "#hex" }`. |
| `pattern` | object \| null | Optional texture overlay drawn on top of the background: `{ id: "dots" }`. Pass `null` for no pattern. Optional `color` and `opacity` overrides. |
| `phoneFrame` | string | See **Phone Frames** below. Each screenshot asset type has its own default and allowed frames. |
| `transforms` | object | `{ phone: { x, y, scale, rotation }, logo: { x, y, scale, rotation } }` — position/size/rotation tweaks |
| `textOverlays` | array | Free-form text drawn on top of any asset. See **Text Overlays** below. |
| `imageRefs` | object | Batch only. Maps input ids to uploaded form field names: `{ "screenshot": "myfield" }` |

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

### Image Fields (multipart)

| Field | Used by |
|---|---|
| `screenshot` | iphone-screenshot, ipad-screenshot, android-phone-screenshot, android-tablet-screenshot, promo-banner, social-card |
| `logo` | feature-graphic, promo-banner, social-card |
| `icon` | app-icon-showcase |

### Layouts

All four screenshot asset types share the same 10 layouts: `tilt-right`, `left-title`, `float-up`, `tilt-left`, `right-title`, `bottom-emerge`, `perspective`, `hero-center`, `split-left`, `split-right`.

`split-left` + `split-right` are designed as a side-by-side pair — when placed next to each other in your store listing they form one continuous phone visual.

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

### Fonts

The renderer accepts any Google Font. Common picks: `Inter`, `Montserrat`, `Open Sans`, `Bebas Neue`, `Lato`, `Poppins`, `Playfair Display`. Set via `textOverlays[].font`.

## Building

```sh
npm run build
node build
```

Runs on `http://localhost:3000` by default.

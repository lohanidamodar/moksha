# Moksha

App store asset generator. Create screenshot mockups, feature graphics, promo banners, app icon showcases, and social cards for iOS and Android.

Built with SvelteKit + Svelte 5.

## Setup

```sh
npm install
npm run dev
```

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
    "texts": { "title": "My App", "subtitle": "Best app ever" },
    "phoneFrame": "iphone-dynamic-island"
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
    "texts": { "title": "Amazing App", "subtitle": "Download now" },
    "fonts": { "title": "Bebas Neue", "subtitle": "Lato" },
    "phoneFrame": "android-punch-hole"
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
      "texts": { "title": "Screen 1" },
      "imageRefs": { "screenshot": "iphone-shot" }
    },
    {
      "assetType": "android-phone-screenshot",
      "layout": "tilt-right",
      "phoneFrame": "android-punch-hole",
      "background": { "type": "gradient", "id": "sunset-pink" },
      "texts": { "title": "Screen 1" },
      "imageRefs": { "screenshot": "android-shot" }
    },
    {
      "assetType": "feature-graphic",
      "layout": "logo-center",
      "background": { "type": "gradient", "id": "emerald" },
      "texts": { "tagline": "My App", "subtitle": "A great app" },
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
| `background` | object | `{ type: "gradient" \| "solid" \| "pattern", id: "preset-id" }` |
| `texts` | object | Key/value pairs matching the asset type's text inputs (e.g. `title`, `subtitle`, `tagline`, `headline`) |
| `fonts` | object | `{ title: "Font Family", subtitle: "Font Family" }` — any Google Font. Defaults: Montserrat / Open Sans |
| `phoneFrame` | string | `iphone-dynamic-island`, `iphone-notch`, `ipad`, `android-punch-hole`, `android-clean`, `frameless`. Each screenshot asset type has its own default. |
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

### Allowed Phone Frames Per Asset Type

| Asset Type | Allowed Frames |
|---|---|
| iphone-screenshot | iphone-dynamic-island, iphone-notch, frameless |
| ipad-screenshot | ipad, frameless |
| android-phone-screenshot | android-punch-hole, android-clean, frameless |
| android-tablet-screenshot | android-clean, android-punch-hole, frameless |
| promo-banner, social-card | any (only used when a screenshot is provided) |

The API will accept any `phoneFrame` value, but for best results pick one from the asset type's `allowedPhoneFrames` (returned by `GET /api/render`).

### Image Fields (multipart)

| Field | Used by |
|---|---|
| `screenshot` | iphone-screenshot, ipad-screenshot, android-phone-screenshot, android-tablet-screenshot, promo-banner, social-card |
| `logo` | feature-graphic, promo-banner, social-card |
| `icon` | app-icon-showcase |

### Layouts

All four screenshot asset types share the same 10 layouts: `tilt-right`, `left-title`, `float-up`, `tilt-left`, `right-title`, `bottom-emerge`, `perspective`, `hero-center`, `split-left`, `split-right`.

`split-left` + `split-right` are designed as a side-by-side pair — when placed next to each other in your store listing they form one continuous phone visual.

### Background Presets

**Gradients:** `sunset-pink`, `blue-violet`, `emerald`, `hot-magenta`, `ocean`, `indigo-dream`, `amber`, `dark-teal`, `red-orange`, `midnight-blue`

**Solids:** `pure-black`, `dark-charcoal`, `navy`, `forest-green`, `deep-purple`, `crimson`, `slate`, `white`

**Patterns:** `dots`, `waves`, `mesh`, `geometric`, `noise`, `circles`

## Building

```sh
npm run build
node build
```

Runs on `http://localhost:3000` by default.

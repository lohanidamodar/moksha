# Moksha

App store asset generator. Create screenshot mockups, feature graphics, promo banners, app icon showcases, and social cards for iOS and Android.

Built with SvelteKit + Svelte 5.

## Setup

```sh
npm install
npm run dev
```

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
    "assetType": "screenshot-mockup",
    "layout": "tilt-right",
    "background": { "type": "gradient", "id": "sunset-pink" },
    "texts": { "title": "My App", "subtitle": "Best app ever" }
  }' \
  --output mockup.png
```

**Multipart form (with images):**

```sh
curl -X POST http://localhost:5173/api/render \
  -F 'config={
    "assetType": "screenshot-mockup",
    "sizeId": "android-phone",
    "layout": "hero-center",
    "background": { "type": "gradient", "id": "blue-violet" },
    "texts": { "title": "Amazing App", "subtitle": "Download now" },
    "fonts": { "title": "Bebas Neue", "subtitle": "Lato" },
    "phoneFrame": "iphone-dynamic-island"
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
      "assetType": "screenshot-mockup",
      "layout": "tilt-right",
      "background": { "type": "gradient", "id": "sunset-pink" },
      "texts": { "title": "Screen 1" },
      "imageRefs": { "screenshot": "screen1" }
    },
    {
      "assetType": "feature-graphic",
      "layout": "logo-center",
      "background": { "type": "gradient", "id": "emerald" },
      "texts": { "tagline": "My App", "subtitle": "A great app" },
      "imageRefs": { "logo": "applogo" }
    }
  ]' \
  -F screen1=@screenshot.png \
  -F applogo=@logo.png \
  --output assets.zip
```

Use `imageRefs` to map config image inputs to uploaded file field names. If omitted, defaults to `screenshot`, `logo`, `icon`.

### Config Reference

| Field | Type | Description |
|---|---|---|
| `assetType` | string (required) | `screenshot-mockup`, `feature-graphic`, `promo-banner`, `app-icon-showcase`, `social-card` |
| `sizeId` | string | Size variant. Defaults to first size. See `GET /api/render` for options per type. |
| `layout` | string | Layout id. Defaults to first layout. See `GET /api/render` for options per type. |
| `background` | object | `{ type: "gradient" | "solid" | "pattern", id: "preset-id" }` |
| `texts` | object | Key/value pairs matching the asset type's text inputs (e.g. `title`, `subtitle`, `tagline`, `headline`) |
| `fonts` | object | `{ title: "Font Family", subtitle: "Font Family" }` — any Google Font. Defaults: Montserrat / Open Sans |
| `phoneFrame` | string | `iphone-dynamic-island`, `iphone-notch`, `ipad`, `android-punch-hole`, `android-clean`, `frameless` |
| `transforms` | object | `{ phone: { x, y, scale, rotation }, logo: { x, y, scale, rotation } }` — position/size/rotation offsets |
| `imageRefs` | object | Batch only. Maps input ids to uploaded field names: `{ "screenshot": "myfield" }` |

### Image Fields (multipart)

| Field | Used by |
|---|---|
| `screenshot` | screenshot-mockup, promo-banner, social-card |
| `logo` | feature-graphic, promo-banner, social-card |
| `icon` | app-icon-showcase |

### Available Sizes

**Screenshot Mockup:** `android-phone` (1080x1920), `android-7inch` (1200x1920), `android-10inch` (1600x2560), `ios-6.7` (1290x2796), `ios-6.5` (1242x2688), `ios-6.1` (1284x2778), `ios-5.5` (1242x2208), `ipad-12.9` (2048x2732), `ipad-10.5` (1668x2224)

**Feature Graphic:** `play-store` (1024x500)

**Promo Banner:** `play-1024x500` (1024x500), `general-1024x1024` (1024x1024)

**App Icon Showcase:** `1024` (1024x1024), `512` (512x512)

**Social Card:** `og` (1200x630), `twitter` (1200x675), `instagram` (1080x1080)

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

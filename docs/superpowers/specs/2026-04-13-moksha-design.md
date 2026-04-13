# Moksha — App Store Asset Generator

**Date:** 2026-04-13
**Status:** Approved

## Overview

Moksha is a browser-based tool for generating app store assets — screenshot mockups, feature graphics, promo banners, app icon showcases, app store previews, and social media cards. Users configure one asset at a time in a focused editor, add it to a queue, and export everything as an organized ZIP with a manifest.

The app name "Moksha" is stored in a single config file for easy rebranding.

## Tech Stack

- **Svelte 5 + SvelteKit** — latest Svelte with runes (`$state`, `$derived`, `$effect`) for reactivity. No legacy `$:` reactive statements or stores API — use runes throughout.
- **Vite** — dev server and build tooling (bundled with SvelteKit)
- **Canvas API** — all rendering is programmatic, no image dependencies
- **JSZip** — ZIP generation for batch export
- **FileSaver.js** — triggering browser downloads

V2 will add Appwrite for user auth and persisting saved designs/projects.

## UI Layout: Two-Panel + Tab Header

```
┌─────────────────────────────────────────────────────────┐
│ Moksha   [Mockup][Feature][Social][Icon][Promo][Preview] │  Queue(3) ▾  [Export]
├─────────────────────────────────────┬───────────────────┤
│                                     │ Layout            │
│                                     │ [■][■][■]         │
│                                     │ [■][■][■]         │
│          Canvas Preview             │                   │
│        (live-rendered asset)        │ Background        │
│                                     │ Gradient|Solid|Pat│
│                                     │ [■][■][■][■]     │
│                                     │                   │
│                                     │ Title  [________] │
│                                     │ Subtitle[_______] │
│                                     │ Screenshot [Drop] │
│                                     │                   │
│                                     │ [Add to Queue]    │
├─────────────────────────────────────┴───────────────────┘
```

- **Header:** App name, asset type tabs, queue badge + dropdown, export button
- **Left panel:** Live canvas preview rendered at display size
- **Right panel:** Scrollable options — layout picker, background picker, text inputs, image uploads. Built dynamically from the active asset module's `inputs[]` declaration
- **Queue:** Dropdown/drawer from the header showing thumbnails with edit/duplicate/delete actions

## Asset Type Modules

Each asset type is a self-contained module exporting a common interface:

```js
{
  id: string,
  label: string,
  icon: string,
  sizes: [{ id, label, w, h, platform }],
  inputs: [{ id, type, label, placeholder? }],
  layouts: [{ id, label, icon }],
  render: (canvas, config) => void
}
```

### Screenshot Mockup
- **Sizes:** Android 1080x1920, iOS 1290x2796
- **Inputs:** screenshot image, title, subtitle
- **Layouts (8):** tilt-right, left-title, float-up, tilt-left, right-title, bottom-emerge, perspective, hero-center
- **Renderer:** Gradient/solid/pattern background + phone frame + screenshot + text overlay. Phone frame rendering ported from mockup.html.

### App Store Preview
- **Sizes:** iOS 6.7" (1290x2796), iOS 6.5" (1242x2688), iOS 6.1" (1284x2778)
- **Inputs:** screenshot image, title, subtitle
- **Layouts:** Same 8 as Screenshot Mockup
- **Renderer:** Shares base renderer with Screenshot Mockup, different output sizes

### Feature Graphic
- **Sizes:** 1024x500 (Play Store)
- **Inputs:** logo image, tagline, subtitle
- **Layouts (4):** logo-left, logo-center, logo-right, split-half

### Promo Banner
- **Sizes:** 1024x500 (Play Store), 1024x1024 (general)
- **Inputs:** logo image, headline, subtitle, optional screenshot
- **Layouts (3):** hero, side-by-side, minimal

### App Icon Showcase
- **Sizes:** 1024x1024, 512x512
- **Inputs:** app icon image
- **Layouts (3):** centered-glow, perspective-floor, floating-shadow

### Social Card
- **Sizes:** 1200x630 (Open Graph), 1200x675 (Twitter Card), 1080x1080 (Instagram)
- **Inputs:** logo image, headline, subtitle, optional screenshot
- **Layouts (3):** banner, card-with-phone, minimal

## Background System

Three categories, each with presets. Every background is a render function: `(ctx, width, height) => void`.

### Gradients (~10 presets)
Two-color linear gradient with subtle radial overlay and floating circles for depth:
- Orange-Pink, Blue-Purple, Green-Emerald, Pink-Maroon, Cyan-Navy, Indigo-Lavender, Gold-Yellow, Dark-Teal (from mockup.html)
- Red-Orange, Midnight-Blue

### Solids (~8 presets)
Flat color with subtle radial overlay:
- Pure Black, Dark Charcoal, Navy, Forest Green, Deep Purple, Crimson, Slate, White

### Patterns (~6 presets)
Gradient base + canvas-drawn pattern overlay at low opacity:
- Dots (regular dot grid), Waves (horizontal sine lines), Mesh (blended radial gradients), Geometric (triangular tessellation), Noise (perlin-like grain), Circles (overlapping large circles)

All patterns are rendered programmatically on canvas. No image assets required.

The background picker shows swatches under three tabs: Gradient | Solid | Pattern.

## Queue System

### Adding Items
- User configures asset in editor, clicks "Add to Queue"
- Snapshot of config saved: `{ id, assetType, layout, background, texts, images, thumbnail, createdAt }`
- Thumbnail is a low-res base64 preview
- Editor resets for next item

### Queue Panel
- Dropdown/drawer from header
- Vertical list: thumbnail + label (e.g., "Screenshot Mockup — tilt-right")
- Per-item actions: edit (loads config into editor), duplicate, delete
- Bottom: export buttons

### Editing Queued Items
- Edit loads config back into editor
- Editor shows "Editing Queue Item" state
- "Update in Queue" replaces "Add to Queue" button

## Export System

### ZIP Export (primary)
Organized folder structure:
```
android/
  screenshots/
    mockup-1.png
    mockup-2.png
  feature-graphic.png
  promo-banner.png
ios/
  screenshots/
    preview-1.png
    preview-2.png
  app-store-preview/
    6.7-inch.png
    6.5-inch.png
    6.1-inch.png
social/
  og-card.png
  twitter-card.png
  instagram.png
icon/
  icon-1024.png
  icon-512.png
manifest.json
```

### manifest.json
```json
{
  "generated": "2026-04-13T...",
  "tool": "Moksha",
  "version": "1.0.0",
  "assets": [
    {
      "file": "android/screenshots/mockup-1.png",
      "type": "screenshot-mockup",
      "platform": "android",
      "dimensions": { "w": 1080, "h": 1920 },
      "layout": "tilt-right",
      "background": "gradient-orange-pink"
    }
  ]
}
```

### Individual Downloads
Sequential download of each image as separate files (fallback option).

### Rendering Pipeline
Export renders each queue item at full resolution to an offscreen canvas. Preview rendering uses display-size canvases for speed; full-resolution rendering only happens at export time.

## Data Flow

```
User Action → Editor Store → Canvas Preview (reactive re-render)
                   ↓
            "Add to Queue"
                   ↓
            Queue Store → Queue Panel (reactive)
                   ↓
            "Export ZIP"
                   ↓
            Export Pipeline → Full-res render → JSZip → Download
```

### Editor State (Svelte 5 runes)
```js
// lib/stores/editor.svelte.js
class EditorState {
  assetType = $state('screenshot-mockup');
  layout = $state('tilt-right');
  background = $state({ type: 'gradient', id: 'orange-pink' });
  texts = $state({ title: '', subtitle: '' });
  images = $state({ screenshot: null });
  editingQueueId = $state(null); // null = new, string = editing existing
}
export const editor = new EditorState();
```

### Queue State (Svelte 5 runes)
```js
// lib/stores/queue.svelte.js
class QueueState {
  items = $state([]);
  count = $derived(this.items.length);

  add(item) { this.items.push(item); }
  remove(id) { this.items = this.items.filter(i => i.id !== id); }
  update(id, config) { /* ... */ }
}
export const queue = new QueueState();
```

Queue item shape:
```js
{
  id: 'q_1',
  assetType: 'screenshot-mockup',
  layout: 'tilt-right',
  background: { type: 'gradient', id: 'orange-pink' },
  texts: { title: 'Find Rentals', subtitle: 'Near You' },
  images: { screenshot: Blob },
  thumbnail: 'data:image/png;base64,...',
  createdAt: 1713000000
}
```

Svelte 5 runes drive all reactivity. Components use `$effect` to re-render the canvas when editor state changes. No legacy `$:` statements or writable stores. State files use `.svelte.js` extension for rune support.

### V2 Appwrite Bridge
Store interfaces are designed for drop-in persistence. Queue items map to Appwrite documents. Images map to Appwrite Storage. The store API stays the same — only the persistence layer changes.

## Project Structure

```
moksha/
├── src/
│   ├── lib/
│   │   ├── config.js
│   │   ├── stores/
│   │   │   ├── editor.svelte.js
│   │   │   └── queue.svelte.js
│   │   ├── assets/
│   │   │   ├── index.js
│   │   │   ├── screenshot-mockup.js
│   │   │   ├── feature-graphic.js
│   │   │   ├── promo-banner.js
│   │   │   ├── app-store-preview.js
│   │   │   ├── app-icon-showcase.js
│   │   │   └── social-card.js
│   │   ├── renderer/
│   │   │   ├── canvas.js
│   │   │   ├── phone-frame.js
│   │   │   ├── backgrounds.js
│   │   │   └── export.js
│   │   └── components/
│   │       ├── Header.svelte
│   │       ├── EditorShell.svelte
│   │       ├── OptionsPanel.svelte
│   │       ├── CanvasPreview.svelte
│   │       ├── BackgroundPicker.svelte
│   │       ├── LayoutPicker.svelte
│   │       ├── QueuePanel.svelte
│   │       ├── QueueItem.svelte
│   │       └── ImageUpload.svelte
│   ├── routes/
│   │   └── +page.svelte
│   └── app.html
├── static/
│   └── favicon.png
├── package.json
├── svelte.config.js
├── vite.config.js
└── mockup.html
```

## Dependencies (V1)

- `@sveltejs/kit` — framework
- `@sveltejs/adapter-static` — static site output (no server needed for V1)
- `jszip` — ZIP generation
- `file-saver` — download triggers

## Out of Scope (V1)

- User accounts / auth (V2 — Appwrite)
- Saving/loading projects (V2 — Appwrite)
- Custom background upload
- Undo/redo
- Drag-to-reorder queue
- Custom font selection
- Dark/light theme toggle

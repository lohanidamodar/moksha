---
name: moksha
description: >-
  Create App Store and Google Play assets for the app in this repo —
  screenshots, feature graphics, promo banners, app-icon showcases and social
  cards — and the app preview video. Moksha captures the app's screens on a
  device with Patrol, frames them, and checks every asset against the rules of
  the store it targets. Use this skill when the user asks for store
  screenshots, store assets, a feature graphic, a listing, an app preview
  video, or mentions moksha. Also use it to change assets moksha already made:
  new copy, a different background, another locale, a new order. Run it from
  the mobile app's repo.
---

# moksha: store assets for the app in this repo

Moksha keeps a listing in the app's own repo as `moksha/moksha.json` — the
assets, the copy, the shared design — and renders it into upload-ready files.
Your job is the part it cannot do alone: pick the screens worth marketing,
write the flows that reach them, write the copy, and drive the pipeline.

The end state: a `moksha/moksha.json` the user can re-prompt against, framed
assets under `moksha/out/`, and every one of them passing its store's rules.

## Before anything: is there already a project?

Moksha keeps the whole outcome in one file, so a follow-up is an edit to that
file, not a fresh start.

```bash
ls moksha/moksha.json 2>/dev/null && npx @popupbits/moksha validate
```

Every command below is written `npx @popupbits/moksha <cmd>`, which needs no
install. If the user has it installed globally, plain `moksha <cmd>` is the
same thing.

If it exists, read it in full and skip to **Iterating** below. Together with
the captures it names, it is the source of truth for every visible choice.
Nothing lives only in your head or only in the studio.

## Step 0: which stores

Look before asking. An `ios/` directory means the App Store is in play; an
`android/` directory means Google Play. A Flutter repo usually has both.

- **One platform possible** — say which you picked and why, do not ask.
- **Both possible** — ask, even if the user named one: "Play screenshots"
  often means "and the App Store too", and the answer decides work that is
  expensive to redo. Use an interactive question tool if one is available,
  with multiple selection.

The answer decides which asset types go in the project. On a follow-up, the
project's existing assets already answer it; do not ask again.

## Step 1: set the project up

```bash
npx @popupbits/moksha init "App Name"     # writes moksha/moksha.json
npx @popupbits/moksha doctor              # says what is missing, and how to fix it
```

Then read `npx @popupbits/moksha schema` — every legal asset type, size, layout,
background, pattern, frame, template and font, plus a complete worked example.
Do not guess these values; the schema is the list.

Add `moksha/out/` to the app's `.gitignore`. Commit `moksha/moksha.json` and
the captures.

## Step 2: get the screenshots

Two routes. Prefer capture when the app runs on a device here.

**Captured (preferred).** `npx @popupbits/moksha capture --scaffold` prints the two Dart
files the app repo needs: a helper that talks the capture handshake, and a
Patrol test that walks the app. Write the test yourself — you choose the
screens. Then:

```bash
npx @popupbits/moksha capture --platform android
```

Each scene lands in `moksha/captures/<platform>/<scene>.png`.

**Supplied.** If the user has screenshots already, put them under
`moksha/captures/` and reference them. `captures/` is a plain PNG folder;
nothing depends on Moksha having produced them.

Explore the app before choosing scenes — 4 or 5 screens that each sell a
feature: the main list, a detail view, search, the one screen nothing else
has. Prefer screens with real-looking content.

## Step 3: write the project

Assets, in store order, in `moksha/moksha.json`. Set `design` once and let
every asset inherit it; override per asset only where it earns it.

Write the headlines yourself, in the app's voice: benefit-led, short, and
different from each other. A strip whose five headlines all say the same thing
in different words is the most common way a listing wastes its space.

Set `design.template` to give the strip a rhythm rather than five identical
tiles. `panoramic` opens on a two-tile panorama, which is the single most
striking thing Moksha can do and costs one asset entry.

For a Play listing, include a `feature-graphic`: Play requires one, and it is
the first thing a shopper sees.

**Localisation.** If the app ships more than one language, put every locale in
`locales` and write copy as `{ "en": "...", "ne": "..." }`. Set
`design.font` per locale too — Montserrat has no Devanagari at all, and a
Nepali listing set in it renders as a row of boxes. Moksha catches that and
fails the render, but picking the right family up front is better.

## Step 4: render and check

```bash
npx @popupbits/moksha render
```

It writes every asset for every locale and exits non-zero if any breaks a
store rule. Fix what it names; the messages say what is wrong and what is
allowed. Then show the user the result:

```bash
npx @popupbits/moksha studio        # the editor, and /preview for the store page
```

The studio's `/preview` renders the listing as the product page a shopper
meets, for both stores. That is the right thing to show for "does this look
good", not a folder of PNGs.

## Step 5: the preview video, if asked

```bash
npx @popupbits/moksha preview --platform ios
```

One short journey — see the main screen, start a core action, finish it — in
a separate Patrol test. Apple enforces 15 to 30 seconds and rejects anything
outside it at upload, so pace the test accordingly. Play takes a YouTube link
rather than a file, so the Android video is rendered for the user to post.
Needs ffmpeg.

## Iterating

A follow-up maps onto a small edit and the cheapest command that reflects it.
Do not re-capture or rewrite assets the user did not mention. Say which field
you changed, so the next prompt can build on it.

| The user asks for | Edit | Then run |
|---|---|---|
| Different headlines or store copy | `assets[].text`, `store.*` | `render` |
| A new look: background, pattern, font | `design.*`, or the asset for one tile | `render` |
| A different device frame | `design.frames`, or `assets[].phoneFrame` | `render` |
| A strip with more shape to it | `design.template` | `render` |
| A layout for one tile | `assets[].layout` | `render` |
| One image across two or three tiles | `layout: "panorama"`, `span` | `render` |
| Another language | `locales`, plus that key in every copy record and in `design.font` | `render` |
| Reorder, drop or add an asset | `assets[]` | `render` |
| A different screen, or a new one | the Patrol test | `capture`, `render` |
| Fresh screenshots after a UI change | — | `capture`, `render` |

`render` takes seconds; run it freely. `capture` needs a device and a build,
so re-run it only when the screens themselves changed.

## What Moksha refuses, and why it is right

`render` exits non-zero rather than handing over an asset a store will bounce.
These are all failures that produce a perfectly valid image file:

- **An alpha channel.** Both stores reject it, and neither canvas can encode
  without one, so every asset is re-encoded as 24-bit PNG.
- **Play's aspect limit.** The long side may be at most twice the short. A raw
  1080x2340 capture is 2.17:1 and is refused at its own native resolution —
  framing it is what makes it uploadable.
- **An Apple dimension it does not list.**
- **A font with no glyphs for the script**, which renders as boxes and passes
  every other check.

Do not work around these. They are the reason the tool exists.

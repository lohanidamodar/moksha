#!/usr/bin/env vite-node
/**
 * Headless batch renderer.
 *
 * The HTTP API needs a running server; this is the same renderer for anything
 * that would rather run a command — a CI job building a store listing, or a
 * coding agent generating assets for an app repo.
 *
 * Run through vite-node, because the renderer imports `$lib` aliases:
 *
 *   npm run render -- --job job.json --images ./captures --out ./out
 *
 * job.json:
 *   {
 *     "assets": [
 *       {
 *         "assetType": "android-phone-screenshot",
 *         "sizeId": "android-phone",
 *         "layout": "hero-center",
 *         "background": { "type": "gradient", "id": "sunset-pink" },
 *         "phoneFrame": "android-punch-hole",
 *         "textOverlays": [ { "text": "...", "anchor": "top-center" } ],
 *         "screenshot": "01_home.png",
 *         "filename": "01_home.png"
 *       }
 *     ]
 *   }
 *
 * Exits non-zero if any asset breaks a store rule, so a pipeline fails here
 * rather than at upload.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { renderAsset } from '../src/core/node/canvas.js';
import { getAssetType, assetTypes } from '../src/core/assets/index.js';
import { validateStoreAsset, readPngHeader } from '../src/core/validate.js';
import { GRADIENTS, MESH, SOLIDS, PATTERNS } from '../src/core/renderer/backgrounds.js';
import { PHONE_FRAMES } from '../src/core/renderer/phone-frame.js';
import { ANCHOR_IDS } from '../src/core/renderer/text-overlays.js';

function option(name, fallback) {
	const i = process.argv.indexOf(name);
	return i === -1 || i + 1 >= process.argv.length ? fallback : process.argv[i + 1];
}

// Everything a caller may legally put in a job, as JSON. The same
// information as GET /api/render, without needing the server up — which is
// what lets an agent or a CI job discover the options with one command.
if (process.argv.includes('--schema')) {
	console.log(
		JSON.stringify(
			{
				assetTypes: assetTypes.map((a) => ({
					id: a.id,
					label: a.label,
					platform: a.platform,
					sizes: a.sizes,
					layouts: a.layouts.map((l) => l.id),
					defaultPhoneFrame: a.defaultPhoneFrame,
					allowedPhoneFrames: a.allowedPhoneFrames
				})),
				backgrounds: {
					gradient: GRADIENTS.map((g) => g.id),
					mesh: MESH.map((m) => m.id),
					solid: SOLIDS.map((s) => s.id)
				},
				patterns: PATTERNS.map((p) => p.id),
				phoneFrames: PHONE_FRAMES.map((f) => f.id ?? f),
				textAnchors: ANCHOR_IDS
			},
			null,
			2
		)
	);
	process.exit(0);
}

const jobPath = option('--job');
const imagesDir = option('--images', '.');
const outDir = option('--out', 'out');

if (!jobPath) {
	console.error('usage: --job <job.json> [--images <dir>] [--out <dir>]');
	process.exit(64);
}

const job = JSON.parse(readFileSync(jobPath, 'utf8'));
const assets = Array.isArray(job.assets) ? job.assets : [];
if (assets.length === 0) {
	console.error(`${jobPath} lists no assets`);
	process.exit(1);
}

mkdirSync(outDir, { recursive: true });

let failed = 0;

for (const [index, spec] of assets.entries()) {
	const module = getAssetType(spec.assetType);
	if (!module) {
		console.error(`unknown assetType "${spec.assetType}"`);
		failed++;
		continue;
	}

	const images = {};
	if (spec.screenshot) {
		const path = resolve(imagesDir, spec.screenshot);
		if (!existsSync(path)) {
			console.error(`missing screenshot ${path}`);
			failed++;
			continue;
		}
		images.screenshot = readFileSync(path);
	}
	for (const key of ['logo', 'icon']) {
		if (spec[key]) images[key] = readFileSync(resolve(imagesDir, spec[key]));
	}

	const buffer = await renderAsset(spec, images);
	const header = readPngHeader(buffer);
	const problems = header
		? validateStoreAsset({
				width: header.width,
				height: header.height,
				platform: module.platform,
				hasAlpha: header.hasAlpha
			})
		: [{ level: 'error', message: 'Rendered output is not a readable PNG.' }];

	const filename = spec.filename ?? `${spec.assetType}-${index + 1}.png`;
	writeFileSync(join(outDir, filename), buffer);

	const size = header ? `${header.width}x${header.height}` : 'unreadable';
	if (problems.length) {
		failed++;
		console.error(`✗ ${filename}  ${size}`);
		for (const problem of problems) console.error(`    ${problem.message}`);
	} else {
		console.log(`✓ ${filename}  ${size}`);
	}
}

console.log(`${assets.length - failed}/${assets.length} asset(s) -> ${outDir}`);
process.exit(failed === 0 ? 0 : 1);

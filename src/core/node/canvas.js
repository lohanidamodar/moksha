/**
 * Server-side canvas adapter using @napi-rs/canvas.
 * Provides createCanvas and loadImage that work with our render functions.
 */
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { getAssetType } from '../assets/index.js';
import { canvasToStorePng } from './png.js';
import { validateStoreAsset } from '../validate.js';
import { readPngHeader } from '../png.js';

// Track registered fonts
const registeredFonts = new Set();

/**
 * Register a Google Font for server-side rendering.
 * Downloads the font file and registers it with GlobalFonts.
 */
export async function registerFont(family) {
	if (registeredFonts.has(family)) return;
	registeredFonts.add(family);

	try {
		const encoded = family.replace(/ /g, '+');
		const cssUrl = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700;800;900&display=swap`;

		const cssRes = await fetch(cssUrl, {
			headers: { 'User-Agent': 'Mozilla/5.0' } // Google Fonts requires a browser UA
		});
		const css = await cssRes.text();

		// Google serves woff2 to browsers it recognises and ttf otherwise, and
		// which one you get depends on the User-Agent above. Matching only
		// woff2 meant scripts like Devanagari registered nothing at all and
		// rendered as boxes.
		const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+\.(?:woff2|ttf|otf))\)/g)].map(
			(m) => m[1]
		);

		// Every face, not just the first. A family is split across unicode-range
		// subsets, and the first is usually Latin — so registering one face
		// gives a font that renders English and nothing else.
		for (const url of urls) {
			const fontRes = await fetch(url);
			const buffer = Buffer.from(await fontRes.arrayBuffer());
			GlobalFonts.register(buffer, family);
		}

		// Verify rather than assume. A family that failed to register does not
		// throw — it silently falls back, and the only symptom is boxes in the
		// finished asset, which no exit code would catch.
		if (!GlobalFonts.has(family)) {
			console.warn(
				`Font "${family}" did not register (${urls.length} face(s) tried); ` +
					'text in this family will fall back and may render as boxes.'
			);
		}
	} catch (e) {
		console.warn(`Failed to register font "${family}":`, e.message);
	}
}

/**
 * The size a config renders at: the one it names, else the asset type's first,
 * which is the one the stores care most about (6.9" for iPhone, 13" for iPad).
 *
 * @param {object} module — an asset type from the registry
 * @param {string} [sizeId]
 */
export function resolveSize(module, sizeId) {
	return (sizeId && module.sizes.find((s) => s.id === sizeId)) || module.sizes[0];
}

/**
 * Render a single asset server-side.
 *
 * @param {object} config — same shape as editor config
 * @param {{ screenshot?: Buffer, logo?: Buffer, icon?: Buffer }} imageBuffers — raw image data
 * @returns {Promise<Buffer>} — PNG buffer
 */
export async function renderAsset(config, imageBuffers = {}) {
	const module = getAssetType(config.assetType);
	if (!module) throw new Error(`Unknown asset type: ${config.assetType}`);

	const size = resolveSize(module, config.sizeId);

	// Register any fonts used by text overlays
	const overlayFonts = new Set(
		(config.textOverlays ?? [])
			.map((o) => o?.font)
			.filter((f) => typeof f === 'string' && f.length > 0)
	);
	await Promise.all([...overlayFonts].map((f) => registerFont(f)));

	// Load images from buffers
	const images = {};
	for (const [key, buffer] of Object.entries(imageBuffers)) {
		if (buffer) {
			images[key] = await loadImage(buffer);
		}
	}

	// Create canvas and render
	const canvas = createCanvas(size.w, size.h);
	const ctx = canvas.getContext('2d');

	module.render(ctx, {
		layout: config.layout || module.layouts[0].id,
		background: config.background || { type: 'gradient', id: 'sunset-pink' },
		pattern: config.pattern || null,
		phoneFrame: config.phoneFrame || 'iphone-dynamic-island',
		transforms: config.transforms || undefined,
		textOverlays: Array.isArray(config.textOverlays) ? config.textOverlays : [],
		images
	}, size.w, size.h);

	// Not canvas.toBuffer('image/png'): that is always RGBA, and both stores
	// refuse an alpha channel. This re-encodes losslessly as 24-bit.
	return canvasToStorePng(canvas);
}

/**
 * Render one asset and check it against the rules of the store it targets.
 *
 * Checked against what was actually produced, not against what the config
 * asked for, so an encoder change cannot quietly break it.
 *
 * @returns {Promise<{buffer: Buffer, size: object, module: object,
 *                    problems: {level: string, message: string}[]}>}
 */
export async function renderStoreAsset(config, imageBuffers = {}) {
	const module = getAssetType(config.assetType);
	if (!module) throw new Error(`Unknown asset type: ${config.assetType}`);

	const size = resolveSize(module, config.sizeId);
	const buffer = await renderAsset(config, imageBuffers);
	const header = readPngHeader(buffer);

	const problems = header
		? validateStoreAsset({
				width: header.width,
				height: header.height,
				platform: size.platform ?? null,
				storeKind: size.storeKind,
				hasAlpha: header.hasAlpha
			})
		: [{ level: 'error', message: 'Rendered output is not a readable PNG.' }];

	return { buffer, size, module, problems };
}

/**
 * Render multiple assets and return as an array of { filename, buffer } objects.
 */
export async function renderBatch(configs, imageBuffers = {}) {
	const results = [];
	for (let i = 0; i < configs.length; i++) {
		const config = configs[i];
		// Each config can reference images by key
		const images = {};
		for (const key of ['screenshot', 'logo', 'icon']) {
			const ref = config.imageRefs?.[key] ?? key;
			if (imageBuffers[ref]) {
				images[key] = imageBuffers[ref];
			}
		}

		const { buffer, size, problems } = await renderStoreAsset(config, images);
		results.push({
			filename: `${config.assetType}-${config.layout || 'default'}-${size.id}-${i + 1}.png`,
			buffer,
			problems
		});
	}
	return results;
}

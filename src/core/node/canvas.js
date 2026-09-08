/**
 * Server-side canvas adapter using @napi-rs/canvas.
 * Provides createCanvas and loadImage that work with our render functions.
 */
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { getAssetType } from '../assets/index.js';
import { canvasToStorePng } from './png.js';
import { validateStoreAsset } from '../validate.js';
import { readPngHeader } from '../png.js';
import { registerFonts } from './fonts.js';

/** The families a config's text overlays ask for. */
function overlayFonts(config) {
	return (config.textOverlays ?? [])
		.map((o) => o?.font)
		.filter((f) => typeof f === 'string' && f.length > 0);
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

	// Any font a text overlay names has to be registered before the draw, or it
	// renders as boxes.
	await registerFonts(overlayFonts(config));

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
	// Registration is memoised per family, so doing it here and again inside
	// renderAsset costs nothing and keeps the failures on this call stack.
	const fontFailures = await registerFonts(overlayFonts(config));
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

	// A font that did not register produces a perfectly valid PNG full of
	// boxes, which is exactly the class of failure this check exists for.
	for (const failure of fontFailures) {
		problems.push({
			level: 'error',
			message:
				`Font "${failure.family}" did not register, so text in it rendered ` +
				`as boxes${failure.reason ? ` (${failure.reason})` : ''}.`
		});
	}

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

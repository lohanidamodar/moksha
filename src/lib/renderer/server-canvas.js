/**
 * Server-side canvas adapter using @napi-rs/canvas.
 * Provides createCanvas and loadImage that work with our render functions.
 */
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { getAssetType } from '$lib/assets/index.js';

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

		// Fetch the CSS to get the font file URL
		const cssRes = await fetch(cssUrl, {
			headers: { 'User-Agent': 'Mozilla/5.0' } // Google Fonts requires a browser UA
		});
		const css = await cssRes.text();

		// Extract woff2 URLs from the CSS
		const urlMatches = css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+\.woff2)\)/g);
		for (const match of urlMatches) {
			const fontRes = await fetch(match[1]);
			const buffer = Buffer.from(await fontRes.arrayBuffer());
			GlobalFonts.register(buffer, family);
			break; // Register the first variant (usually latin regular/bold range)
		}
	} catch (e) {
		console.warn(`Failed to register font "${family}":`, e.message);
	}
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

	// Resolve size
	let size = module.sizes[0];
	if (config.sizeId) {
		const found = module.sizes.find((s) => s.id === config.sizeId);
		if (found) size = found;
	}

	// Register fonts
	const titleFont = config.fonts?.title || 'Montserrat';
	const subtitleFont = config.fonts?.subtitle || 'Open Sans';
	await Promise.all([registerFont(titleFont), registerFont(subtitleFont)]);

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
		texts: config.texts || {},
		fonts: config.fonts || { title: 'Montserrat', subtitle: 'Open Sans' },
		phoneFrame: config.phoneFrame || 'iphone-dynamic-island',
		transforms: config.transforms || undefined,
		images
	}, size.w, size.h);

	return canvas.toBuffer('image/png');
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
		const buffer = await renderAsset(config, images);
		const module = getAssetType(config.assetType);
		const sizeId = config.sizeId || module?.sizes[0]?.id || 'default';
		results.push({
			filename: `${config.assetType}-${config.layout || 'default'}-${sizeId}-${i + 1}.png`,
			buffer
		});
	}
	return results;
}

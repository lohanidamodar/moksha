/**
 * Export system for Moksha.
 * Renders queue items to full-resolution canvases and exports as
 * individual PNGs or an organized ZIP archive.
 *
 * Everything leaves here through canvasToStorePngBytes, never canvas.toBlob:
 * toBlob only writes RGBA, and both stores reject an alpha channel. Each
 * asset is then checked against the store rules by reading back the header we
 * actually produced, so a rejectable asset is named here rather than at upload.
 */
import JSZip from 'jszip';
import pkg from 'file-saver';
const { saveAs } = pkg;
import { getAssetType } from '$core/assets/index.js';
import { canvasToStorePngBytes } from '$core/web/png.js';
import { readPngHeader } from '$core/png.js';
import { validateStoreAsset } from '$core/validate.js';
import { APP_NAME, APP_VERSION } from '$lib/config.js';
import { transformKey } from '$lib/stores/editor.svelte.js';
import { resolveLayout } from '$lib/layoutResolver.js';

const DEFAULT_TRANSFORM = { phone: { x: 0, y: 0, scale: 1, rotation: null }, logo: { x: 0, y: 0, scale: 1, rotation: null } };

/**
 * Render a single queue item at a specific size, encode it store-safe, and
 * check it against the rules of the store it targets.
 *
 * @param {object} queueItem - { id, assetType, layout, background, texts, images, thumbnail, createdAt }
 * @param {object} size - { id, label, w, h, platform }
 * @returns {Promise<{blob: Blob, problems: {level: string, message: string}[]}>}
 */
export async function renderStoreAsset(queueItem, size) {
	const module = getAssetType(queueItem.assetType);
	if (!module) {
		throw new Error(`Unknown asset type: ${queueItem.assetType}`);
	}

	const canvas = document.createElement('canvas');
	canvas.width = size.w;
	canvas.height = size.h;
	const ctx = canvas.getContext('2d');

	// Pick transforms for this specific size, falling back to layout-only or default
	const sizeTransforms =
		queueItem.layoutTransforms?.[transformKey(queueItem.layout, size.id)] ??
		queueItem.transforms ??
		DEFAULT_TRANSFORM;

	const resolved = resolveLayout(queueItem.layout, sizeTransforms);

	module.render(
		ctx,
		{
			layout: resolved.baseLayout,
			background: queueItem.background,
			pattern: queueItem.pattern,
			phoneFrame: queueItem.phoneFrame,
			transforms: resolved.transforms,
			images: queueItem.images,
			textOverlays: queueItem.textOverlays
		},
		size.w,
		size.h
	);

	const bytes = await canvasToStorePngBytes(canvas);
	const header = readPngHeader(bytes);
	const problems = header
		? validateStoreAsset({
				width: header.width,
				height: header.height,
				platform: size.platform ?? null,
				storeKind: size.storeKind,
				hasAlpha: header.hasAlpha
			})
		: [{ level: 'error', message: 'Rendered output is not a readable PNG.' }];

	return { blob: new Blob([bytes], { type: 'image/png' }), problems };
}

/**
 * Determine the folder path for an asset inside the ZIP.
 *
 * Platform-specific sizes go under their platform folder, grouped by asset type.
 * Platform-agnostic assets are sorted into social/, icon/, or general/.
 *
 * @param {string} assetTypeId - e.g. 'screenshot-mockup', 'social-card'
 * @param {object} size - { id, label, w, h, platform }
 * @returns {string} folder path (no trailing slash)
 */
function getFolderPath(assetTypeId, size) {
	const platform = size.platform;

	// Platform-specific: android or ios
	if (platform === 'android' || platform === 'ios') {
		const subfolder = getSubfolder(assetTypeId);
		return `${platform}/${subfolder}`;
	}

	// Platform-agnostic grouping
	if (assetTypeId === 'social-card') {
		return 'social';
	}
	if (assetTypeId === 'app-icon-showcase') {
		return 'icon';
	}

	return 'general';
}

/**
 * Map asset type ids to subfolder names within a platform directory.
 * @param {string} assetTypeId
 * @returns {string}
 */
function getSubfolder(assetTypeId) {
	switch (assetTypeId) {
		case 'iphone-screenshot':
		case 'android-phone-screenshot':
			return 'screenshots/phone';
		case 'ipad-screenshot':
		case 'android-tablet-screenshot':
			return 'screenshots/tablet';
		case 'feature-graphic':
			return 'feature-graphic';
		case 'promo-banner':
			return 'promo-banner';
		default:
			return assetTypeId;
	}
}

/**
 * Build a human-readable filename from asset type and size info.
 * @param {string} assetTypeId
 * @param {object} size
 * @returns {string} base filename without numbering or extension
 */
function getBaseFilename(assetTypeId, size) {
	// Use the asset type id as the base, which is already kebab-case
	// Append the size id for disambiguation
	return `${assetTypeId}-${size.id}`;
}

/**
 * Generate a ZIP with organized folder structure from an array of queue items,
 * then trigger a download via file-saver.
 *
 * Returns a report of everything that breaks a store rule, so the caller can
 * say so instead of handing over a zip that will bounce at upload.
 *
 * @param {object[]} queueItems - array of queue items
 * @param {function} [onProgress] - callback: (current, total, label) => void
 * @returns {Promise<{total: number, rejected: {file: string, messages: string[]}[]}>}
 */
export async function exportZip(queueItems, onProgress) {
	const zip = new JSZip();
	const manifest = {
		generated: new Date().toISOString(),
		tool: APP_NAME,
		version: APP_VERSION,
		assets: []
	};

	// Collect all render jobs: one per (queueItem, size) pair
	const jobs = [];
	for (const item of queueItems) {
		const module = getAssetType(item.assetType);
		if (!module) continue;
		for (const size of module.sizes) {
			jobs.push({ item, size, module });
		}
	}

	const total = jobs.length;

	// Track filename counts per folder to number duplicates
	const filenameCounts = {};

	/** @type {{file: string, messages: string[]}[]} */
	const rejected = [];

	for (let i = 0; i < jobs.length; i++) {
		const { item, size } = jobs[i];
		const folder = getFolderPath(item.assetType, size);
		const baseName = getBaseFilename(item.assetType, size);

		// Build a unique numbered filename within the folder
		const counterKey = `${folder}/${baseName}`;
		const count = (filenameCounts[counterKey] || 0) + 1;
		filenameCounts[counterKey] = count;
		const filename = `${baseName}-${count}.png`;
		const filePath = `${folder}/${filename}`;

		if (onProgress) {
			onProgress(i + 1, total, `Rendering ${filePath}`);
		}

		const { blob, problems } = await renderStoreAsset(item, size);
		zip.file(filePath, blob);

		if (problems.length) {
			rejected.push({ file: filePath, messages: problems.map((p) => p.message) });
		}

		manifest.assets.push({
			file: filePath,
			type: item.assetType,
			platform: size.platform || null,
			dimensions: { w: size.w, h: size.h },
			layout: item.layout,
			background: item.background,
			storeRules: problems.length ? problems.map((p) => p.message) : 'pass'
		});
	}

	// Add manifest
	zip.file('manifest.json', JSON.stringify(manifest, null, 2));

	if (onProgress) {
		onProgress(total, total, 'Compressing ZIP...');
	}

	const content = await zip.generateAsync({ type: 'blob' });
	saveAs(content, `${APP_NAME.toLowerCase()}-assets.zip`);

	return { total, rejected };
}

/**
 * Download all size variants for a single queue item as individual PNG files.
 *
 * @param {object} queueItem - a single queue item
 * @returns {Promise<{total: number, rejected: {file: string, messages: string[]}[]}>}
 */
export async function downloadIndividual(queueItem) {
	const module = getAssetType(queueItem.assetType);
	if (!module) {
		throw new Error(`Unknown asset type: ${queueItem.assetType}`);
	}

	/** @type {{file: string, messages: string[]}[]} */
	const rejected = [];

	for (const size of module.sizes) {
		const { blob, problems } = await renderStoreAsset(queueItem, size);
		const filename = `${queueItem.assetType}-${size.id}-${size.w}x${size.h}.png`;
		if (problems.length) {
			rejected.push({ file: filename, messages: problems.map((p) => p.message) });
		}
		saveAs(blob, filename);
	}

	return { total: module.sizes.length, rejected };
}

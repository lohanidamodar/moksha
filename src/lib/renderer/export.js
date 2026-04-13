/**
 * Export system for Moksha.
 * Renders queue items to full-resolution canvases and exports as
 * individual PNGs or an organized ZIP archive.
 */
import JSZip from 'jszip';
import pkg from 'file-saver';
const { saveAs } = pkg;
import { getAssetType } from '$lib/assets/index.js';
import { APP_NAME, APP_VERSION } from '$lib/config.js';

/**
 * Convert a canvas to a PNG Blob via a promise wrapper around toBlob.
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob>}
 */
function canvasToBlob(canvas) {
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) {
				resolve(blob);
			} else {
				reject(new Error('Canvas toBlob returned null'));
			}
		}, 'image/png');
	});
}

/**
 * Render a single queue item at a specific size and return the result as a Blob.
 *
 * @param {object} queueItem - { id, assetType, layout, background, texts, images, thumbnail, createdAt }
 * @param {object} size - { id, label, w, h, platform }
 * @returns {Promise<Blob>}
 */
export async function renderToBlob(queueItem, size) {
	const module = getAssetType(queueItem.assetType);
	if (!module) {
		throw new Error(`Unknown asset type: ${queueItem.assetType}`);
	}

	const canvas = document.createElement('canvas');
	canvas.width = size.w;
	canvas.height = size.h;
	const ctx = canvas.getContext('2d');

	module.render(
		ctx,
		{
			layout: queueItem.layout,
			background: queueItem.background,
			texts: queueItem.texts,
			fonts: queueItem.fonts,
			phoneFrame: queueItem.phoneFrame,
			transforms: queueItem.transforms,
			images: queueItem.images
		},
		size.w,
		size.h
	);

	return canvasToBlob(canvas);
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
		case 'screenshot-mockup':
		case 'app-store-preview':
			return 'screenshots';
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
 * @param {object[]} queueItems - array of queue items
 * @param {function} [onProgress] - callback: (current, total, label) => void
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

		const blob = await renderToBlob(item, size);
		zip.file(filePath, blob);

		manifest.assets.push({
			file: filePath,
			type: item.assetType,
			platform: size.platform || null,
			dimensions: { w: size.w, h: size.h },
			layout: item.layout,
			background: item.background
		});
	}

	// Add manifest
	zip.file('manifest.json', JSON.stringify(manifest, null, 2));

	if (onProgress) {
		onProgress(total, total, 'Compressing ZIP...');
	}

	const content = await zip.generateAsync({ type: 'blob' });
	saveAs(content, `${APP_NAME.toLowerCase()}-assets.zip`);
}

/**
 * Download all size variants for a single queue item as individual PNG files.
 *
 * @param {object} queueItem - a single queue item
 */
export async function downloadIndividual(queueItem) {
	const module = getAssetType(queueItem.assetType);
	if (!module) {
		throw new Error(`Unknown asset type: ${queueItem.assetType}`);
	}

	for (const size of module.sizes) {
		const blob = await renderToBlob(queueItem, size);
		const filename = `${queueItem.assetType}-${size.id}-${size.w}x${size.h}.png`;
		saveAs(blob, filename);
	}
}

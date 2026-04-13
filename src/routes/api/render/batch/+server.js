import { json } from '@sveltejs/kit';
import { renderBatch } from '$lib/renderer/server-canvas.js';
import JSZip from 'jszip';

/**
 * POST /api/render/batch
 *
 * Renders multiple assets and returns a ZIP file.
 *
 * Accepts multipart/form-data with:
 * - configs: JSON string — array of config objects
 * - Any number of image files (referenced by field name in config.imageRefs)
 *
 * Each config can have an "imageRefs" field to map input ids to form field names:
 *   { "assetType": "screenshot-mockup", "imageRefs": { "screenshot": "screen1" }, ... }
 * Then upload the image as field name "screen1".
 *
 * If imageRefs is not specified, defaults to field names "screenshot", "logo", "icon".
 */
export async function POST({ request }) {
	try {
		const formData = await request.formData();
		const configsStr = formData.get('configs');
		if (!configsStr) {
			return json({ error: 'Missing "configs" field' }, { status: 400 });
		}

		const configs = JSON.parse(configsStr);
		if (!Array.isArray(configs) || configs.length === 0) {
			return json({ error: '"configs" must be a non-empty array' }, { status: 400 });
		}

		// Collect all uploaded images by field name
		const imageBuffers = {};
		for (const [key, value] of formData.entries()) {
			if (key !== 'configs' && value instanceof File) {
				imageBuffers[key] = Buffer.from(await value.arrayBuffer());
			}
		}

		const results = await renderBatch(configs, imageBuffers);

		// Build ZIP
		const zip = new JSZip();
		for (const { filename, buffer } of results) {
			zip.file(filename, buffer);
		}

		// Add manifest
		zip.file('manifest.json', JSON.stringify({
			generated: new Date().toISOString(),
			tool: 'Moksha',
			assets: results.map((r, i) => ({
				file: r.filename,
				type: configs[i].assetType,
				layout: configs[i].layout,
				sizeId: configs[i].sizeId
			}))
		}, null, 2));

		const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

		return new Response(zipBuffer, {
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': 'attachment; filename="moksha-assets.zip"'
			}
		});
	} catch (err) {
		console.error('Batch render error:', err);
		return json({ error: err.message }, { status: 500 });
	}
}

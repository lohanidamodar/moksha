import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { assetTypes } from '../assets/index.js';
import { readPngHeader } from '../png.js';
import { renderStoreAsset, resolveSize } from './canvas.js';

/** A stand-in capture. No text overlays anywhere here, so nothing needs the network. */
function stubImage(width, height) {
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = '#334155';
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = '#f8fafc';
	ctx.fillRect(width * 0.1, height * 0.1, width * 0.8, height * 0.2);
	return canvas.toBuffer('image/png');
}

const capture = stubImage(1080, 2400);
const square = stubImage(512, 512);

function imagesFor(type) {
	const images = {};
	for (const input of type.inputs ?? []) {
		images[input.id] = input.id === 'screenshot' ? capture : square;
	}
	return images;
}

test('resolveSize falls back to the first size, which is the one the stores want', () => {
	const iphone = assetTypes.find((a) => a.id === 'iphone-screenshot');
	assert.equal(resolveSize(iphone, undefined).id, 'ios-6.9');
	assert.equal(resolveSize(iphone, 'ios-5.5').id, 'ios-5.5');
	// An unknown id is not an error; it means "whatever the default is".
	assert.equal(resolveSize(iphone, 'ios-99').id, 'ios-6.9');
});

for (const type of assetTypes) {
	for (const size of type.sizes) {
		test(`${type.id} at ${size.id} renders alpha-free and passes its store rules`, async () => {
			const { buffer, problems } = await renderStoreAsset(
				{
					assetType: type.id,
					sizeId: size.id,
					layout: type.layouts[0].id,
					background: { type: 'gradient', id: 'sunset-pink' },
					pattern: { id: 'dots' },
					phoneFrame: type.defaultPhoneFrame,
					textOverlays: []
				},
				imagesFor(type)
			);

			const header = readPngHeader(buffer);
			assert.equal(header.width, size.w);
			assert.equal(header.height, size.h);
			assert.equal(header.hasAlpha, false, 'rendered output carries an alpha channel');
			assert.deepEqual(problems, [], problems.map((p) => p.message).join(' '));
		});
	}
}

test('an unknown asset type is refused rather than rendered blank', async () => {
	await assert.rejects(() => renderStoreAsset({ assetType: 'not-a-thing' }), /Unknown asset type/);
});

test('a panorama slices into tiles that are each store-legal', async () => {
	const { renderPanorama } = await import('./canvas.js');
	const span = 3;
	const buffers = await renderPanorama(
		{
			assetType: 'iphone-screenshot',
			sizeId: 'ios-6.9',
			layout: 'panorama',
			background: { type: 'gradient', id: 'emerald' },
			pattern: { id: 'dots' },
			phoneFrame: 'iphone-dynamic-island',
			textOverlays: []
		},
		{ screenshot: capture },
		span
	);

	assert.equal(buffers.length, span);
	for (const [index, buffer] of buffers.entries()) {
		const header = readPngHeader(buffer);
		assert.equal(header.width, 1320, `tile ${index} width`);
		assert.equal(header.height, 2868, `tile ${index} height`);
		assert.equal(header.hasAlpha, false, `tile ${index} carries alpha`);
	}
});

test('neighbouring tiles differ, so the composition really was sliced', async () => {
	const { renderPanorama } = await import('./canvas.js');
	const [left, right] = await renderPanorama(
		{
			assetType: 'android-phone-screenshot',
			layout: 'panorama',
			background: { type: 'gradient', id: 'ocean' },
			phoneFrame: 'pixel-black',
			textOverlays: []
		},
		{ screenshot: capture },
		2
	);
	// Two crops of one composition: same size, different pixels. Identical
	// tiles would mean the composition was drawn per-tile instead of sliced.
	assert.notEqual(left.toString('base64'), right.toString('base64'));
});

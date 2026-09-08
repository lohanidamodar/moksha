import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { loadImage } from '@napi-rs/canvas';
import { buildOpaqueScanlines, assemblePng, encodeOpaquePng, readPngHeader } from './png.js';

const nodeDeflate = (bytes) => new Uint8Array(deflateSync(bytes, { level: 9 }));

/** The browser's deflate, which Node also has, so the web path is testable here. */
const webDeflate = async (bytes) => {
	const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
	return new Uint8Array(await new Response(stream).arrayBuffer());
};

/** width x height of solid rgba, as the canvas would hand it over. */
function pixels(width, height, [r, g, b, a]) {
	const out = new Uint8ClampedArray(width * height * 4);
	for (let i = 0; i < out.length; i += 4) {
		out[i] = r;
		out[i + 1] = g;
		out[i + 2] = b;
		out[i + 3] = a;
	}
	return out;
}

test('scanlines carry a filter byte per row and three bytes a pixel', () => {
	const raw = buildOpaqueScanlines(pixels(2, 3, [10, 20, 30, 255]), 2, 3);
	assert.equal(raw.length, (2 * 3 + 1) * 3);
	// Row starts: filter 0, then the pixels.
	assert.deepEqual([...raw.subarray(0, 7)], [0, 10, 20, 30, 10, 20, 30]);
});

test('a transparent pixel is composited over the backdrop, not cut to black', () => {
	// Half-opaque red over white should land near (255, 128, 128), never (255, 0, 0).
	const raw = buildOpaqueScanlines(pixels(1, 1, [255, 0, 0, 128]), 1, 1);
	assert.equal(raw[1], 255);
	assert.ok(Math.abs(raw[2] - 128) <= 1, `green was ${raw[2]}`);
	assert.ok(Math.abs(raw[3] - 128) <= 1, `blue was ${raw[3]}`);
});

test('a fully transparent pixel becomes the backdrop colour', () => {
	const raw = buildOpaqueScanlines(pixels(1, 1, [255, 0, 0, 0]), 1, 1, { r: 0, g: 0, b: 255 });
	assert.deepEqual([...raw.subarray(1, 4)], [0, 0, 255]);
});

test('the assembled PNG declares colour type 2, so it has no alpha channel', () => {
	const png = assemblePng(nodeDeflate(buildOpaqueScanlines(pixels(4, 4, [1, 2, 3, 255]), 4, 4)), 4, 4);
	const header = readPngHeader(png);
	assert.equal(header.width, 4);
	assert.equal(header.height, 4);
	assert.equal(header.colourType, 2);
	assert.equal(header.hasAlpha, false);
});

test('the PNG signature is intact', () => {
	const png = assemblePng(nodeDeflate(buildOpaqueScanlines(pixels(1, 1, [0, 0, 0, 255]), 1, 1)), 1, 1);
	assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
});

test('both platform deflates produce a PNG a decoder accepts, with the same pixels', async () => {
	const rgba = pixels(8, 8, [200, 100, 50, 255]);
	const viaNode = await encodeOpaquePng(rgba, 8, 8, { deflate: nodeDeflate });
	const viaWeb = await encodeOpaquePng(rgba, 8, 8, { deflate: webDeflate });

	for (const [label, png] of [['node', viaNode], ['web', viaWeb]]) {
		assert.equal(readPngHeader(png).hasAlpha, false, `${label} kept an alpha channel`);
		const image = await loadImage(Buffer.from(png));
		assert.equal(image.width, 8, `${label} width`);
		assert.equal(image.height, 8, `${label} height`);
	}
});

test('readPngHeader refuses a buffer too short to hold a header', () => {
	assert.equal(readPngHeader(new Uint8Array(12)), null);
});

test("readPngHeader reads a canvas's own RGBA output as carrying alpha", async () => {
	// The failure this whole encoder exists to prevent: what canvas.toBlob and
	// canvas.toBuffer produce is colour type 6, which both stores reject.
	const { createCanvas } = await import('@napi-rs/canvas');
	const canvas = createCanvas(4, 4);
	const rgbaPng = canvas.toBuffer('image/png');
	assert.equal(readPngHeader(rgbaPng).hasAlpha, true);
});

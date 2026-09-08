/**
 * Browser side of the 24-bit PNG encoder.
 *
 * CompressionStream('deflate') emits a zlib stream (RFC 1950) — header, deflate
 * blocks, adler32 — which is exactly what a PNG IDAT chunk holds. ('deflate-raw'
 * would not be.) So the browser can produce the same store-safe PNG the node
 * renderer does, instead of canvas.toBlob's unavoidable RGBA.
 */
import { encodeOpaquePng } from '../png.js';

async function deflate(bytes) {
	const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
	return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * Encode a canvas as store-safe, alpha-free PNG bytes.
 *
 * Bytes rather than a Blob, because the caller has to read the header back to
 * check the result against the store rules.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Uint8Array>}
 */
export async function canvasToStorePngBytes(canvas) {
	const ctx = canvas.getContext('2d');
	const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
	return encodeOpaquePng(data, canvas.width, canvas.height, { deflate });
}

/**
 * Encode a canvas as a store-safe, alpha-free PNG blob.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob>}
 */
export async function canvasToStoreBlob(canvas) {
	return new Blob([await canvasToStorePngBytes(canvas)], { type: 'image/png' });
}

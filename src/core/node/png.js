/**
 * Node side of the 24-bit PNG encoder: zlib at level 9, which compresses these
 * large flat-colour assets noticeably better than CompressionStream's fixed
 * level.
 */
import { deflateSync } from 'node:zlib';
import { encodeOpaquePng } from '../png.js';

const deflate = (bytes) => new Uint8Array(deflateSync(bytes, { level: 9 }));

/**
 * Encode a canvas as a store-safe, alpha-free PNG.
 *
 * @param {import('@napi-rs/canvas').Canvas} canvas
 * @returns {Promise<Buffer>}
 */
export async function canvasToStorePng(canvas) {
	const ctx = canvas.getContext('2d');
	const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const png = await encodeOpaquePng(data, canvas.width, canvas.height, { deflate });
	return Buffer.from(png.buffer, png.byteOffset, png.byteLength);
}

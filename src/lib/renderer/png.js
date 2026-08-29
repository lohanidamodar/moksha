/**
 * Minimal 24-bit PNG encoder.
 *
 * Both stores refuse an alpha channel — Google Play wants "JPEG or 24-bit PNG
 * (no alpha)" and App Store Connect says screenshots "cannot include alpha
 * channels or transparencies". @napi-rs/canvas only encodes RGBA (PNG colour
 * type 6), and exposes no option to drop the channel, so assets rendered
 * straight from the canvas are rejectable.
 *
 * JPEG would sidestep it, but these assets are mostly flat colour and large
 * type, which is exactly what JPEG rings around. So this re-encodes losslessly
 * as colour type 2 instead.
 */
import { deflateSync } from 'node:zlib';

const CRC_TABLE = (() => {
	const table = new Int32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		table[n] = c;
	}
	return table;
})();

function crc32(buf) {
	let c = -1;
	for (let i = 0; i < buf.length; i++) {
		c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
	}
	return (c ^ -1) >>> 0;
}

function chunk(type, data) {
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length, 0);
	const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(typeAndData), 0);
	return Buffer.concat([length, typeAndData, crc]);
}

/**
 * Encode RGBA pixel data as a 24-bit (colour type 2) PNG, dropping alpha.
 *
 * Any partially transparent pixel is composited over [background] first, so a
 * translucent edge becomes a real colour rather than being cut to black.
 *
 * @param {Uint8ClampedArray|Uint8Array} rgba — 4 bytes per pixel
 * @param {number} width
 * @param {number} height
 * @param {{r: number, g: number, b: number}} background
 * @returns {Buffer}
 */
export function encodeOpaquePng(rgba, width, height, background = { r: 255, g: 255, b: 255 }) {
	// One filter byte per scanline (filter 0, "None") plus three bytes a pixel.
	const stride = width * 3;
	const raw = Buffer.alloc((stride + 1) * height);

	let out = 0;
	for (let y = 0; y < height; y++) {
		raw[out++] = 0;
		let inp = y * width * 4;
		for (let x = 0; x < width; x++) {
			const a = rgba[inp + 3];
			if (a === 255) {
				raw[out++] = rgba[inp];
				raw[out++] = rgba[inp + 1];
				raw[out++] = rgba[inp + 2];
			} else {
				// Straight alpha over the backdrop.
				const alpha = a / 255;
				raw[out++] = Math.round(rgba[inp] * alpha + background.r * (1 - alpha));
				raw[out++] = Math.round(rgba[inp + 1] * alpha + background.g * (1 - alpha));
				raw[out++] = Math.round(rgba[inp + 2] * alpha + background.b * (1 - alpha));
			}
			inp += 4;
		}
	}

	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 2; // colour type 2 = truecolour, no alpha
	ihdr[10] = 0; // deflate
	ihdr[11] = 0; // adaptive filtering
	ihdr[12] = 0; // no interlace

	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', ihdr),
		chunk('IDAT', deflateSync(raw, { level: 9 })),
		chunk('IEND', Buffer.alloc(0))
	]);
}

/**
 * Encode a canvas as a store-safe, alpha-free PNG.
 *
 * @param {import('@napi-rs/canvas').Canvas} canvas
 * @returns {Buffer}
 */
export function canvasToStorePng(canvas) {
	const ctx = canvas.getContext('2d');
	const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
	return encodeOpaquePng(data, canvas.width, canvas.height);
}

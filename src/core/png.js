/**
 * Minimal 24-bit PNG encoder.
 *
 * Both stores refuse an alpha channel — Google Play wants "JPEG or 24-bit PNG
 * (no alpha)" and App Store Connect says screenshots "cannot include alpha
 * channels or transparencies". Neither canvas implementation can encode
 * without one: @napi-rs/canvas only writes RGBA (PNG colour type 6), and the
 * browser's toBlob('image/png') is RGBA too. So assets taken straight from
 * either canvas are rejectable.
 *
 * JPEG would sidestep it, but these assets are mostly flat colour and large
 * type, which is exactly what JPEG rings around. So this re-encodes losslessly
 * as colour type 2 instead.
 *
 * Deflate is injected rather than imported, because the two platforms spell it
 * differently — node:zlib here, CompressionStream in a browser — and this file
 * has to stay loadable in both.
 */

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

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

function crc32(bytes) {
	let c = -1;
	for (let i = 0; i < bytes.length; i++) {
		c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
	}
	return (c ^ -1) >>> 0;
}

function concat(chunks) {
	let total = 0;
	for (const c of chunks) total += c.length;
	const out = new Uint8Array(total);
	let at = 0;
	for (const c of chunks) {
		out.set(c, at);
		at += c.length;
	}
	return out;
}

function chunk(type, data) {
	const out = new Uint8Array(12 + data.length);
	const view = new DataView(out.buffer);
	view.setUint32(0, data.length);
	for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
	out.set(data, 8);
	// The CRC covers the type and the data, not the length.
	view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
	return out;
}

/**
 * Flatten RGBA pixels to the filtered scanlines a colour-type-2 PNG stores:
 * one filter byte per row (filter 0, "None") followed by three bytes a pixel.
 *
 * Any partially transparent pixel is composited over [background] first, so a
 * translucent edge becomes a real colour rather than being cut to black.
 *
 * @param {Uint8ClampedArray|Uint8Array} rgba — 4 bytes per pixel
 * @param {number} width
 * @param {number} height
 * @param {{r: number, g: number, b: number}} background
 * @returns {Uint8Array}
 */
export function buildOpaqueScanlines(rgba, width, height, background = { r: 255, g: 255, b: 255 }) {
	const stride = width * 3;
	const raw = new Uint8Array((stride + 1) * height);

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

	return raw;
}

/**
 * Wrap already-deflated scanlines in PNG framing as a 24-bit image.
 *
 * @param {Uint8Array} deflated — zlib stream of buildOpaqueScanlines output
 * @param {number} width
 * @param {number} height
 * @returns {Uint8Array}
 */
export function assemblePng(deflated, width, height) {
	const ihdr = new Uint8Array(13);
	const view = new DataView(ihdr.buffer);
	view.setUint32(0, width);
	view.setUint32(4, height);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 2; // colour type 2 = truecolour, no alpha
	ihdr[10] = 0; // deflate
	ihdr[11] = 0; // adaptive filtering
	ihdr[12] = 0; // no interlace

	return concat([
		new Uint8Array(PNG_SIGNATURE),
		chunk('IHDR', ihdr),
		chunk('IDAT', deflated),
		chunk('IEND', new Uint8Array(0))
	]);
}

/**
 * Encode RGBA pixel data as a 24-bit (colour type 2) PNG, dropping alpha.
 *
 * @param {Uint8ClampedArray|Uint8Array} rgba — 4 bytes per pixel
 * @param {number} width
 * @param {number} height
 * @param {{deflate: (bytes: Uint8Array) => Uint8Array | Promise<Uint8Array>,
 *          background?: {r: number, g: number, b: number}}} options
 * @returns {Promise<Uint8Array>}
 */
export async function encodeOpaquePng(rgba, width, height, { deflate, background }) {
	const raw = buildOpaqueScanlines(rgba, width, height, background);
	return assemblePng(await deflate(raw), width, height);
}

/** Reads width, height and colour type straight out of a PNG header. */
export function readPngHeader(bytes) {
	if (bytes.length < 26) return null;
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const colourType = bytes[25];
	return {
		width: view.getUint32(16),
		height: view.getUint32(20),
		colourType,
		// Colour types 4 and 6 carry an alpha channel.
		hasAlpha: colourType === 4 || colourType === 6
	};
}

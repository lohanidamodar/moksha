/**
 * Shared canvas utilities for Moksha asset generator.
 */

/**
 * Draws a rounded rectangle path on the given context.
 * Does not fill or stroke — caller decides.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} r - corner radius
 */
export function roundRect(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.arcTo(x + w, y, x + w, y + r, r);
	ctx.lineTo(x + w, y + h - r);
	ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
	ctx.lineTo(x + r, y + h);
	ctx.arcTo(x, y + h, x, y + h - r, r);
	ctx.lineTo(x, y + r);
	ctx.arcTo(x, y, x + r, y, r);
	ctx.closePath();
}

/**
 * Draws text with optional shadow, alignment, font, color, and multiline support.
 * Lines are split on '\n'.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {object} [options]
 * @param {string} [options.font='800 72px Inter, sans-serif']
 * @param {string} [options.color='#ffffff']
 * @param {string} [options.align='left']
 * @param {{ color?: string, blur?: number, offsetX?: number, offsetY?: number } | false} [options.shadow]
 * @param {number} [options.lineHeight] — pixel distance between baselines; defaults to font size * 1.2
 */
export function drawText(ctx, text, x, y, options = {}) {
	const {
		font = '800 72px Inter, sans-serif',
		color = '#ffffff',
		align = 'left',
		shadow = { color: 'rgba(0,0,0,0.4)', blur: 20, offsetX: 0, offsetY: 4 },
		lineHeight
	} = options;

	ctx.save();
	ctx.font = font;
	ctx.fillStyle = color;
	ctx.textAlign = align;

	if (shadow) {
		ctx.shadowColor = shadow.color ?? 'rgba(0,0,0,0.4)';
		ctx.shadowBlur = shadow.blur ?? 20;
		ctx.shadowOffsetX = shadow.offsetX ?? 0;
		ctx.shadowOffsetY = shadow.offsetY ?? 4;
	}

	// Derive a default lineHeight from the font size if not provided
	const computedLineHeight = lineHeight ?? _extractLineHeight(font);

	const lines = text.split('\n');
	let curY = y;
	for (const line of lines) {
		ctx.fillText(line, x, curY);
		curY += computedLineHeight;
	}

	ctx.restore();
}

/**
 * Creates an offscreen canvas element of the given dimensions.
 * Works in browser environments.
 * @param {number} w
 * @param {number} h
 * @returns {HTMLCanvasElement}
 */
export function createOffscreenCanvas(w, h) {
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	return canvas;
}

/**
 * Extracts an approximate line height from a CSS font string.
 * Falls back to 84 (matches the mockup's 72px * ~1.17).
 * @param {string} font
 * @returns {number}
 */
function _extractLineHeight(font) {
	const match = font.match(/(\d+)px/);
	if (match) {
		return Math.round(parseInt(match[1], 10) * 1.17);
	}
	return 84;
}

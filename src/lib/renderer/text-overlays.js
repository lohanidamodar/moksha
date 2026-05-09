/**
 * Free-form text overlays — drawn on top of any asset.
 *
 * Overlay shape:
 *   {
 *     id, text,
 *     x, y,           // 0..1 fractions of canvas (top-left origin), OR omit and pass `anchor`
 *     anchor,         // optional named position: see ANCHORS
 *     offsetX, offsetY, // optional, fraction of canvas; only used with `anchor`
 *     fontSize,       // fraction of canvas width (e.g. 0.06 = 6%)
 *     font,           // family name (Google Font)
 *     weight,         // 100..900
 *     color,          // CSS color; null/undefined = auto-contrast
 *     align,          // 'left' | 'center' | 'right'
 *     rotation,       // degrees
 *     shadow          // bool — soft drop shadow for legibility
 *   }
 */
import { drawText } from './canvas.js';
import { getBackgroundTone } from './backgrounds.js';

/** Named anchor presets — fraction of canvas + suggested text alignment. */
export const ANCHORS = {
	'top-left':      { x: 0.07, y: 0.08, align: 'left' },
	'top-center':    { x: 0.5,  y: 0.08, align: 'center' },
	'top-right':     { x: 0.93, y: 0.08, align: 'right' },
	'center-left':   { x: 0.07, y: 0.5,  align: 'left' },
	'center':        { x: 0.5,  y: 0.5,  align: 'center' },
	'center-right':  { x: 0.93, y: 0.5,  align: 'right' },
	'bottom-left':   { x: 0.07, y: 0.92, align: 'left' },
	'bottom-center': { x: 0.5,  y: 0.92, align: 'center' },
	'bottom-right':  { x: 0.93, y: 0.92, align: 'right' }
};

export const ANCHOR_IDS = Object.keys(ANCHORS);

/**
 * Resolves an overlay's effective {x, y, align} in canvas pixels.
 * Honors named `anchor` first; falls back to numeric x/y fractions.
 */
export function resolveOverlayPosition(overlay, w, h) {
	let fx = overlay.x;
	let fy = overlay.y;
	let align = overlay.align;

	if (overlay.anchor && ANCHORS[overlay.anchor]) {
		const a = ANCHORS[overlay.anchor];
		fx = a.x + (overlay.offsetX ?? 0);
		fy = a.y + (overlay.offsetY ?? 0);
		if (!align) align = a.align;
	}

	if (typeof fx !== 'number') fx = 0.5;
	if (typeof fy !== 'number') fy = 0.5;
	if (!align) align = 'center';

	return { x: fx * w, y: fy * h, align };
}

/**
 * Computes an axis-aligned bounding box for an overlay, in canvas pixels.
 * Used for hit-testing and selection handles.
 *
 * Note: this is the *unrotated* box. The caller can rotate around the anchor
 * if it needs an oriented box.
 */
export function measureOverlay(ctx, overlay, w, h) {
	const { x, y, align } = resolveOverlayPosition(overlay, w, h);
	const fontPx = Math.max(8, (overlay.fontSize ?? 0.06) * w);
	const lineHeight = fontPx * 1.17;
	const lines = String(overlay.text ?? '').split('\n');

	ctx.save();
	ctx.font = `${overlay.weight ?? 700} ${fontPx}px "${overlay.font ?? 'Inter'}", sans-serif`;
	let maxW = 0;
	for (const line of lines) {
		const m = ctx.measureText(line);
		if (m.width > maxW) maxW = m.width;
	}
	ctx.restore();

	const totalH = lines.length * lineHeight;
	let bx = x;
	if (align === 'center') bx = x - maxW / 2;
	else if (align === 'right') bx = x - maxW;
	// Canvas text baseline is alphabetic — top of glyphs sits ~0.8 * fontPx above the baseline.
	const by = y - fontPx * 0.85;
	return { x: bx, y: by, w: maxW, h: totalH, anchorX: x, anchorY: y, align, fontPx, lineHeight };
}

/**
 * Hit-tests a point (in canvas pixels) against an overlay. Accounts for rotation.
 * Returns true if the point is inside the overlay's bounding box.
 */
export function hitTestOverlay(ctx, overlay, w, h, px, py) {
	const box = measureOverlay(ctx, overlay, w, h);
	const rot = ((overlay.rotation ?? 0) * Math.PI) / 180;
	// Transform point into overlay-local space (rotate around anchor)
	const dx = px - box.anchorX;
	const dy = py - box.anchorY;
	const cos = Math.cos(-rot);
	const sin = Math.sin(-rot);
	const lx = box.anchorX + dx * cos - dy * sin;
	const ly = box.anchorY + dx * sin + dy * cos;
	// Add a small touch-friendly margin
	const m = Math.max(6, box.fontPx * 0.15);
	return lx >= box.x - m && lx <= box.x + box.w + m && ly >= box.y - m && ly <= box.y + box.h + m;
}

/**
 * Renders all overlays on top of the canvas.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} overlays
 * @param {number} w
 * @param {number} h
 * @param {object} [config] — full config (used for tone/auto-color)
 */
export function renderTextOverlays(ctx, overlays, w, h, config = {}) {
	if (!overlays || overlays.length === 0) return;
	const tone = getBackgroundTone(config.background);
	const autoColor = tone === 'light' ? '#1a1a1f' : '#ffffff';
	const shadowColor = tone === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';

	for (const overlay of overlays) {
		const text = String(overlay.text ?? '');
		if (!text) continue;
		const { x, y, align } = resolveOverlayPosition(overlay, w, h);
		const fontPx = Math.max(8, (overlay.fontSize ?? 0.06) * w);
		const weight = overlay.weight ?? 700;
		const family = overlay.font ?? 'Inter';
		const color = overlay.color || autoColor;
		const rotation = overlay.rotation ?? 0;
		const useShadow = overlay.shadow !== false;

		ctx.save();
		if (rotation) {
			ctx.translate(x, y);
			ctx.rotate((rotation * Math.PI) / 180);
			ctx.translate(-x, -y);
		}
		drawText(ctx, text, x, y, {
			font: `${weight} ${fontPx}px "${family}", sans-serif`,
			color,
			align,
			shadow: useShadow ? { color: shadowColor, blur: 16, offsetY: 3 } : false
		});
		ctx.restore();
	}
}

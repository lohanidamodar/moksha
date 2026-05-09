/**
 * Shared rendering and layouts for all screenshot mockup variants
 * (iPhone, iPad, Android Phone, Android Tablet).
 *
 * Layout positions use proportional coordinates so they work for any
 * canvas dimensions.
 */
import { renderBackgroundAndPattern, getBackgroundTone } from '$lib/renderer/backgrounds.js';
import { drawPhoneFrame } from '$lib/renderer/phone-frame.js';
import { drawText } from '$lib/renderer/canvas.js';
import { renderTextOverlays } from '$lib/renderer/text-overlays.js';

/**
 * Returns phone and title positioning for a given layout id.
 *
 * Phone frame aspect ratio is derived from the canvas (= device) aspect,
 * so iPhone frames look like iPhones, iPads look like iPads, etc.
 */
export function getLayout(layout, w, h) {
	// Frame aspect = canvas aspect (canvas is the actual device resolution)
	const ar = h / w;

	// Layout-specific phone widths (proportions of canvas width)
	const pw = w * 0.56;
	const pwSmall = w * 0.52;
	const pwHero = w * 0.72;
	const pwSplit = w * 0.85;
	const pwBottom = w * 0.6;
	const pwPersp = w * 0.62;

	switch (layout) {
		case 'tilt-right':
			return {
				phone: { x: w * 0.52, y: h * 0.52, w: pw, h: pw * ar, angle: 12 },
				title: { x: w * 0.07, y: h * 0.18, align: 'left' }
			};
		case 'left-title':
			return {
				phone: { x: w * 0.66, y: h * 0.54, w: pwSmall, h: pwSmall * ar, angle: 0 },
				title: { x: w * 0.07, y: h * 0.22, align: 'left' }
			};
		case 'float-up':
			return {
				phone: { x: w * 0.5, y: h * 0.62, w: pw, h: pw * ar, angle: 0 },
				title: { x: w * 0.5, y: h * 0.13, align: 'center' }
			};
		case 'tilt-left':
			return {
				phone: { x: w * 0.48, y: h * 0.52, w: pw, h: pw * ar, angle: -12 },
				title: { x: w * 0.93, y: h * 0.18, align: 'right' }
			};
		case 'right-title':
			return {
				phone: { x: w * 0.34, y: h * 0.54, w: pwSmall, h: pwSmall * ar, angle: 0 },
				title: { x: w * 0.93, y: h * 0.22, align: 'right' }
			};
		case 'bottom-emerge':
			return {
				phone: { x: w * 0.5, y: h * 0.72, w: pwBottom, h: pwBottom * ar, angle: 0 },
				title: { x: w * 0.5, y: h * 0.11, align: 'center' }
			};
		case 'perspective':
			return {
				phone: { x: w * 0.5, y: h * 0.54, w: pwPersp, h: pwPersp * ar, angle: 5, perspective: true },
				title: { x: w * 0.07, y: h * 0.11, align: 'left' }
			};
		case 'hero-center':
			return {
				phone: { x: w * 0.5, y: h * 0.56, w: pwHero, h: pwHero * ar, angle: 0 },
				title: { x: w * 0.5, y: h * 0.09, align: 'center' }
			};
		case 'split-left':
			return {
				phone: { x: w, y: h * 0.52, w: pwSplit, h: pwSplit * ar, angle: 0 },
				title: { x: w * 0.08, y: h * 0.12, align: 'left' }
			};
		case 'split-right':
			return {
				phone: { x: 0, y: h * 0.52, w: pwSplit, h: pwSplit * ar, angle: 0 },
				title: { x: w * 0.92, y: h * 0.12, align: 'right' }
			};
		default:
			return {
				phone: { x: w * 0.5, y: h * 0.52, w: pw, h: pw * ar, angle: 0 },
				title: { x: w * 0.5, y: h * 0.16, align: 'center' }
			};
	}
}

/** Shared layout list — all device families use the same layouts */
export const SCREENSHOT_LAYOUTS = [
	{ id: 'tilt-right', label: 'Tilt Right' },
	{ id: 'left-title', label: 'Left Title' },
	{ id: 'float-up', label: 'Float Up' },
	{ id: 'tilt-left', label: 'Tilt Left' },
	{ id: 'right-title', label: 'Right Title' },
	{ id: 'bottom-emerge', label: 'Bottom Emerge' },
	{ id: 'perspective', label: 'Perspective' },
	{ id: 'hero-center', label: 'Hero Center' },
	{ id: 'split-left', label: 'Split Left' },
	{ id: 'split-right', label: 'Split Right' }
];

/** Shared inputs */
export const SCREENSHOT_INPUTS = [
	{ id: 'screenshot', type: 'image', label: 'Screenshot', placeholder: 'Upload a screenshot' },
	{ id: 'title', type: 'text', label: 'Title', placeholder: 'Find Rentals\nNear You' },
	{ id: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Subtitle text' }
];

/** Shared render function */
export function renderScreenshot(ctx, config, baseW, baseH) {
	const w = baseW;
	const h = baseH;

	renderBackgroundAndPattern(ctx, w, h, config.background, config.pattern);

	const layoutData = getLayout(config.layout, w, h);
	const p = layoutData.phone;
	const t = layoutData.title;

	const pt = config.transforms?.phone ?? { x: 0, y: 0, scale: 1, rotation: null };
	const phoneX = p.x + (pt.x / 100) * w;
	const phoneY = p.y + (pt.y / 100) * h;
	const phoneW = p.w * pt.scale;
	const phoneH = p.h * pt.scale;
	const phoneAngle = pt.rotation != null ? pt.rotation : (p.angle || 0);

	drawPhoneFrame(ctx, phoneX, phoneY, phoneW, phoneH, phoneAngle, p.perspective || false, config.images?.screenshot ?? null, config.phoneFrame);

	const titleFont = config.fonts?.title || 'Inter';
	const subtitleFont = config.fonts?.subtitle || 'Inter';

	// Auto contrast based on background tone
	const tone = getBackgroundTone(config.background);
	const titleColor = tone === 'light' ? '#1a1a1f' : '#ffffff';
	const subtitleColor = tone === 'light' ? 'rgba(26,26,31,0.75)' : 'rgba(255,255,255,0.8)';
	const shadowColor = tone === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';

	const titleText = config.texts?.title || '';
	if (titleText) {
		const fontSize = Math.round(w * 0.065);
		drawText(ctx, titleText, t.x, t.y, {
			font: `800 ${fontSize}px "${titleFont}", sans-serif`,
			color: titleColor,
			align: t.align,
			shadow: { color: shadowColor, blur: 20, offsetY: 4 }
		});
	}
	const subtitleText = config.texts?.subtitle || '';
	if (subtitleText) {
		const titleFontSize = Math.round(w * 0.065);
		const titleLineHeight = Math.round(titleFontSize * 1.17);
		const titleLines = titleText.split('\n').length;
		const subtitleY = t.y + titleLines * titleLineHeight + Math.round(w * 0.015);
		const subFontSize = Math.round(w * 0.04);
		drawText(ctx, subtitleText, t.x, subtitleY, {
			font: `600 ${subFontSize}px "${subtitleFont}", sans-serif`,
			color: subtitleColor,
			align: t.align,
			shadow: { color: shadowColor, blur: 20, offsetY: 4 }
		});
	}

	renderTextOverlays(ctx, config.textOverlays, w, h, config);
}

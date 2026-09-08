/**
 * Shared rendering and layouts for all screenshot mockup variants
 * (iPhone, iPad, Android Phone, Android Tablet).
 *
 * Layout positions use proportional coordinates so they work for any
 * canvas dimensions.
 */
import { renderBackgroundAndPattern, getBackgroundTone } from '../renderer/backgrounds.js';
import { drawPhoneFrame } from '../renderer/phone-frame.js';
import { renderTextOverlays } from '../renderer/text-overlays.js';

/**
 * Returns phone positioning for a given layout id.
 *
 * Phone frame aspect ratio is derived from the canvas (= device) aspect,
 * so iPhone frames look like iPhones, iPads look like iPads, etc.
 */
export function getLayout(layout, w, h) {
	const ar = h / w;

	const pw = w * 0.56;
	const pwSmall = w * 0.52;
	const pwHero = w * 0.72;
	const pwSplit = w * 0.85;
	const pwBottom = w * 0.6;
	const pwPersp = w * 0.62;

	switch (layout) {
		case 'tilt-right':
			return { phone: { x: w * 0.52, y: h * 0.52, w: pw, h: pw * ar, angle: 12 } };
		case 'left-title':
			return { phone: { x: w * 0.66, y: h * 0.54, w: pwSmall, h: pwSmall * ar, angle: 0 } };
		case 'float-up':
			return { phone: { x: w * 0.5, y: h * 0.62, w: pw, h: pw * ar, angle: 0 } };
		case 'tilt-left':
			return { phone: { x: w * 0.48, y: h * 0.52, w: pw, h: pw * ar, angle: -12 } };
		case 'right-title':
			return { phone: { x: w * 0.34, y: h * 0.54, w: pwSmall, h: pwSmall * ar, angle: 0 } };
		case 'bottom-emerge':
			return { phone: { x: w * 0.5, y: h * 0.72, w: pwBottom, h: pwBottom * ar, angle: 0 } };
		case 'perspective':
			return { phone: { x: w * 0.5, y: h * 0.54, w: pwPersp, h: pwPersp * ar, angle: 5, perspective: true } };
		case 'hero-center':
			return { phone: { x: w * 0.5, y: h * 0.56, w: pwHero, h: pwHero * ar, angle: 0 } };
		case 'split-left':
			return { phone: { x: w, y: h * 0.52, w: pwSplit, h: pwSplit * ar, angle: 0 } };
		case 'split-right':
			return { phone: { x: 0, y: h * 0.52, w: pwSplit, h: pwSplit * ar, angle: 0 } };
		default:
			return { phone: { x: w * 0.5, y: h * 0.52, w: pw, h: pw * ar, angle: 0 } };
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
	{ id: 'screenshot', type: 'image', label: 'Screenshot', placeholder: 'Upload a screenshot' }
];

/** Shared render function */
export function renderScreenshot(ctx, config, baseW, baseH) {
	const w = baseW;
	const h = baseH;

	renderBackgroundAndPattern(ctx, w, h, config.background, config.pattern);

	const tone = getBackgroundTone(config.background);
	const { phone: p } = getLayout(config.layout, w, h);

	const pt = config.transforms?.phone ?? { x: 0, y: 0, scale: 1, rotation: null };
	const phoneX = p.x + (pt.x / 100) * w;
	const phoneY = p.y + (pt.y / 100) * h;
	const phoneW = p.w * pt.scale;
	const phoneH = p.h * pt.scale;
	const phoneAngle = pt.rotation != null ? pt.rotation : (p.angle || 0);

	drawPhoneFrame(ctx, phoneX, phoneY, phoneW, phoneH, phoneAngle, p.perspective || false, config.images?.screenshot ?? null, config.phoneFrame, tone);

	renderTextOverlays(ctx, config.textOverlays, w, h, config);
}

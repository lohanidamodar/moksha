/**
 * Screenshot Mockup — phone frame with screenshot, title, and subtitle.
 * Layout positions use proportional coordinates based on canvas dimensions.
 */
import { renderBackground } from '$lib/renderer/backgrounds.js';
import { drawPhoneFrame } from '$lib/renderer/phone-frame.js';
import { drawText } from '$lib/renderer/canvas.js';

/**
 * Returns phone and title positioning for a given layout id.
 * All coordinates are proportional to the given w/h.
 */
export function getLayout(layout, w, h) {
	// Phone sizes as proportions of canvas
	const pw = w * 0.56;   // phone width
	const ph = pw * 2;     // phone height (2:1 aspect)
	const pwSmall = w * 0.52;
	const phSmall = pwSmall * 2;

	switch (layout) {
		case 'tilt-right':
			return {
				phone: { x: w * 0.52, y: h * 0.52, w: pw, h: ph, angle: 12 },
				title: { x: w * 0.07, y: h * 0.18, align: 'left' }
			};
		case 'left-title':
			return {
				phone: { x: w * 0.66, y: h * 0.54, w: pwSmall, h: phSmall, angle: 0 },
				title: { x: w * 0.07, y: h * 0.22, align: 'left' }
			};
		case 'float-up':
			return {
				phone: { x: w * 0.5, y: h * 0.62, w: pw, h: ph, angle: 0 },
				title: { x: w * 0.5, y: h * 0.13, align: 'center' }
			};
		case 'tilt-left':
			return {
				phone: { x: w * 0.48, y: h * 0.52, w: pw, h: ph, angle: -12 },
				title: { x: w * 0.93, y: h * 0.18, align: 'right' }
			};
		case 'right-title':
			return {
				phone: { x: w * 0.34, y: h * 0.54, w: pwSmall, h: phSmall, angle: 0 },
				title: { x: w * 0.93, y: h * 0.22, align: 'right' }
			};
		case 'bottom-emerge':
			return {
				phone: { x: w * 0.5, y: h * 0.7, w: w * 0.6, h: w * 0.6 * 2, angle: 0 },
				title: { x: w * 0.5, y: h * 0.11, align: 'center' }
			};
		case 'perspective':
			return {
				phone: { x: w * 0.5, y: h * 0.54, w: w * 0.62, h: w * 0.62 * 2, angle: 5, perspective: true },
				title: { x: w * 0.07, y: h * 0.11, align: 'left' }
			};
		case 'hero-center':
			return {
				phone: { x: w * 0.5, y: h * 0.56, w: w * 0.72, h: w * 0.72 * 2, angle: 0 },
				title: { x: w * 0.5, y: h * 0.09, align: 'center' }
			};
		default:
			return {
				phone: { x: w * 0.5, y: h * 0.52, w: pw, h: ph, angle: 0 },
				title: { x: w * 0.5, y: h * 0.16, align: 'center' }
			};
	}
}

/**
 * Core render function for screenshot mockups.
 * Exported so app-store-preview can reuse it.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} config - { layout, background, texts: { title, subtitle }, images: { screenshot } }
 * @param {number} baseW
 * @param {number} baseH
 */
export function renderScreenshotMockup(ctx, config, baseW, baseH) {
	const w = baseW;
	const h = baseH;

	// 1. Background
	renderBackground(ctx, w, h, config.background);

	// 2. Layout positioning — fully proportional, no scaling needed
	const layoutData = getLayout(config.layout, w, h);
	const p = layoutData.phone;
	const t = layoutData.title;

	// 3. Apply phone transforms (offset as % of canvas, scale multiplier)
	const pt = config.transforms?.phone ?? { x: 0, y: 0, scale: 1 };
	const phoneX = p.x + (pt.x / 100) * w;
	const phoneY = p.y + (pt.y / 100) * h;
	const phoneW = p.w * pt.scale;
	const phoneH = p.h * pt.scale;

	drawPhoneFrame(
		ctx,
		phoneX,
		phoneY,
		phoneW,
		phoneH,
		p.angle || 0,
		p.perspective || false,
		config.images?.screenshot ?? null
	);

	// 4. Title text — font size proportional to canvas
	const titleFont = config.fonts?.title || 'Inter';
	const subtitleFont = config.fonts?.subtitle || 'Inter';
	const titleText = config.texts?.title || '';
	if (titleText) {
		const fontSize = Math.round(w * 0.065);
		drawText(ctx, titleText, t.x, t.y, {
			font: `800 ${fontSize}px "${titleFont}", sans-serif`,
			color: '#ffffff',
			align: t.align,
			shadow: { color: 'rgba(0,0,0,0.4)', blur: 20, offsetY: 4 }
		});
	}

	// 5. Subtitle text — rendered below title
	const subtitleText = config.texts?.subtitle || '';
	if (subtitleText) {
		const titleFontSize = Math.round(w * 0.065);
		const titleLineHeight = Math.round(titleFontSize * 1.17);
		const titleLines = titleText.split('\n').length;
		const subtitleY = t.y + titleLines * titleLineHeight + Math.round(w * 0.015);
		const subFontSize = Math.round(w * 0.04);
		drawText(ctx, subtitleText, t.x, subtitleY, {
			font: `600 ${subFontSize}px "${subtitleFont}", sans-serif`,
			color: 'rgba(255,255,255,0.8)',
			align: t.align,
			shadow: { color: 'rgba(0,0,0,0.4)', blur: 20, offsetY: 4 }
		});
	}
}

export default {
	id: 'screenshot-mockup',
	label: 'Screenshot Mockup',
	icon: '\ud83d\udcf1',
	sizes: [
		{ id: 'android-phone', label: 'Android Phone (1080x1920)', w: 1080, h: 1920, platform: 'android' },
		{ id: 'android-7inch', label: 'Android 7" Tablet (1200x1920)', w: 1200, h: 1920, platform: 'android' },
		{ id: 'android-10inch', label: 'Android 10" Tablet (1600x2560)', w: 1600, h: 2560, platform: 'android' },
		{ id: 'ios-6.7', label: 'iPhone 6.7" (1290x2796)', w: 1290, h: 2796, platform: 'ios' },
		{ id: 'ios-6.5', label: 'iPhone 6.5" (1242x2688)', w: 1242, h: 2688, platform: 'ios' },
		{ id: 'ios-6.1', label: 'iPhone 6.1" (1284x2778)', w: 1284, h: 2778, platform: 'ios' },
		{ id: 'ios-5.5', label: 'iPhone 5.5" (1242x2208)', w: 1242, h: 2208, platform: 'ios' },
		{ id: 'ipad-12.9', label: 'iPad Pro 12.9" (2048x2732)', w: 2048, h: 2732, platform: 'ios' },
		{ id: 'ipad-10.5', label: 'iPad 10.5" (1668x2224)', w: 1668, h: 2224, platform: 'ios' }
	],
	inputs: [
		{ id: 'screenshot', type: 'image', label: 'Screenshot', placeholder: 'Upload a screenshot' },
		{ id: 'title', type: 'text', label: 'Title', placeholder: 'Find Rentals\nNear You' },
		{ id: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Subtitle text' }
	],
	layouts: [
		{ id: 'tilt-right', label: 'Tilt Right' },
		{ id: 'left-title', label: 'Left Title' },
		{ id: 'float-up', label: 'Float Up' },
		{ id: 'tilt-left', label: 'Tilt Left' },
		{ id: 'right-title', label: 'Right Title' },
		{ id: 'bottom-emerge', label: 'Bottom Emerge' },
		{ id: 'perspective', label: 'Perspective' },
		{ id: 'hero-center', label: 'Hero Center' }
	],
	render: renderScreenshotMockup
};

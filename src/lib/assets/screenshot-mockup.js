/**
 * Screenshot Mockup — phone frame with screenshot, title, and subtitle.
 * Layout positions ported from mockup.html's getLayout function.
 */
import { renderBackground } from '$lib/renderer/backgrounds.js';
import { drawPhoneFrame } from '$lib/renderer/phone-frame.js';
import { drawText } from '$lib/renderer/canvas.js';

// Design-space dimensions (layouts defined at this base; render scales to target)
const BASE_W = 1080;
const BASE_H = 1920;

/**
 * Returns phone and title positioning for a given layout id.
 * Coordinates are in BASE_W x BASE_H design space.
 */
export function getLayout(layout) {
	switch (layout) {
		case 'tilt-right':
			return {
				phone: { x: 540, y: 960, w: 620, h: 1240, angle: 12 },
				title: { x: 80, y: 320, align: 'left' }
			};
		case 'left-title':
			return {
				phone: { x: 720, y: 1020, w: 580, h: 1160, angle: 0 },
				title: { x: 80, y: 400, align: 'left' }
			};
		case 'float-up':
			return {
				phone: { x: 540, y: 1200, w: 640, h: 1280, angle: 0 },
				title: { x: 540, y: 240, align: 'center' }
			};
		case 'tilt-left':
			return {
				phone: { x: 500, y: 960, w: 620, h: 1240, angle: -12 },
				title: { x: 1000, y: 320, align: 'right' }
			};
		case 'right-title':
			return {
				phone: { x: 340, y: 1020, w: 580, h: 1160, angle: 0 },
				title: { x: 1000, y: 400, align: 'right' }
			};
		case 'bottom-emerge':
			return {
				phone: { x: 540, y: 1360, w: 660, h: 1320, angle: 0 },
				title: { x: 540, y: 200, align: 'center' }
			};
		case 'perspective':
			return {
				phone: { x: 540, y: 1000, w: 700, h: 1400, angle: 5, perspective: true },
				title: { x: 80, y: 200, align: 'left' }
			};
		case 'hero-center':
			return {
				phone: { x: 540, y: 1040, w: 820, h: 1640, angle: 0 },
				title: { x: 540, y: 160, align: 'center' }
			};
		default:
			return {
				phone: { x: 540, y: 960, w: 600, h: 1200, angle: 0 },
				title: { x: 540, y: 300, align: 'center' }
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

	// 2. Layout positioning — scale from design space to actual canvas
	const sx = w / BASE_W;
	const sy = h / BASE_H;
	const layoutData = getLayout(config.layout);
	const p = layoutData.phone;
	const t = layoutData.title;

	// 3. Phone frame with screenshot
	ctx.save();
	ctx.scale(sx, sy);
	drawPhoneFrame(
		ctx,
		p.x,
		p.y,
		p.w,
		p.h,
		p.angle || 0,
		p.perspective || false,
		config.images?.screenshot ?? null
	);

	// 4. Title text
	const titleText = config.texts?.title || '';
	if (titleText) {
		drawText(ctx, titleText, t.x, t.y, {
			font: '800 72px Inter, sans-serif',
			color: '#ffffff',
			align: t.align,
			shadow: { color: 'rgba(0,0,0,0.4)', blur: 20, offsetY: 4 }
		});
	}

	// 5. Subtitle text — rendered below title
	const subtitleText = config.texts?.subtitle || '';
	if (subtitleText) {
		const titleLines = titleText.split('\n').length;
		const subtitleY = t.y + titleLines * 84 + 16;
		drawText(ctx, subtitleText, t.x, subtitleY, {
			font: '600 44px Inter, sans-serif',
			color: 'rgba(255,255,255,0.8)',
			align: t.align,
			shadow: { color: 'rgba(0,0,0,0.4)', blur: 20, offsetY: 4 }
		});
	}

	ctx.restore();
}

export default {
	id: 'screenshot-mockup',
	label: 'Screenshot Mockup',
	icon: '\ud83d\udcf1',
	sizes: [
		{ id: 'android', label: 'Android (1080x1920)', w: 1080, h: 1920, platform: 'android' },
		{ id: 'ios-6.7', label: 'iOS 6.7" (1290x2796)', w: 1290, h: 2796, platform: 'ios' }
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

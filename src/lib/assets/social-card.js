/**
 * Social Card — OG, Twitter, and Instagram cards with logo, text, and optional phone.
 */
import { renderBackgroundAndPattern } from '$lib/renderer/backgrounds.js';
import { drawPhoneFrame } from '$lib/renderer/phone-frame.js';
import { renderTextOverlays } from '$lib/renderer/text-overlays.js';

/**
 * Returns layout positioning relative to canvas dimensions.
 */
function getLayoutData(layout, w, h) {
	switch (layout) {
		case 'banner':
			return { logo: { x: w * 0.08, y: h * 0.15, size: h * 0.22 }, phone: null };
		case 'card-with-phone':
			return {
				logo: { x: w * 0.08, y: h * 0.15, size: h * 0.18 },
				phone: { x: w * 0.78, y: h * 0.55, pw: w * 0.22, ph: h * 0.7 }
			};
		case 'minimal':
			return { logo: { x: w * 0.5, y: h * 0.25, size: h * 0.2 }, phone: null };
		default:
			return { logo: { x: w * 0.5, y: h * 0.25, size: h * 0.2 }, phone: null };
	}
}

/**
 * Draw logo centered at (cx, cy).
 */
function drawLogo(ctx, img, cx, cy, size, rotation = 0) {
	if (!img) return;
	const aspect = img.width / img.height;
	let dw, dh;
	if (aspect >= 1) {
		dw = size;
		dh = size / aspect;
	} else {
		dh = size;
		dw = size * aspect;
	}
	ctx.save();
	if (rotation) {
		ctx.translate(cx, cy);
		ctx.rotate((rotation * Math.PI) / 180);
		ctx.translate(-cx, -cy);
	}
	ctx.shadowColor = 'rgba(0,0,0,0.3)';
	ctx.shadowBlur = 16;
	ctx.shadowOffsetY = 4;
	ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
	ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} config
 * @param {number} baseW
 * @param {number} baseH
 */
function render(ctx, config, baseW, baseH) {
	const w = baseW;
	const h = baseH;

	renderBackgroundAndPattern(ctx, w, h, config.background, config.pattern);

	const ld = getLayoutData(config.layout, w, h);

	const lt = config.transforms?.logo ?? { x: 0, y: 0, scale: 1, rotation: 0 };
	drawLogo(ctx, config.images?.logo ?? null,
		ld.logo.x + (lt.x / 100) * w, ld.logo.y + (lt.y / 100) * h, ld.logo.size * lt.scale, lt.rotation || 0);

	if (ld.phone && config.images?.screenshot) {
		const pt = config.transforms?.phone ?? { x: 0, y: 0, scale: 1 };
		drawPhoneFrame(
			ctx,
			ld.phone.x + (pt.x / 100) * w,
			ld.phone.y + (pt.y / 100) * h,
			ld.phone.pw * pt.scale,
			ld.phone.ph * pt.scale,
			0,
			false,
			config.images.screenshot,
			config.phoneFrame
		);
	}

	renderTextOverlays(ctx, config.textOverlays, w, h, config);
}

export default {
	id: 'social-card',
	label: 'Social Card',
	icon: '\ud83d\udce3',
	sizes: [
		{ id: 'og', label: 'Open Graph (1200x630)', w: 1200, h: 630, platform: 'web' },
		{ id: 'twitter', label: 'Twitter (1200x675)', w: 1200, h: 675, platform: 'web' },
		{ id: 'instagram', label: 'Instagram (1080x1080)', w: 1080, h: 1080, platform: 'web' }
	],
	inputs: [
		{ id: 'logo', type: 'image', label: 'Logo', placeholder: 'Upload your app logo' },
		{ id: 'screenshot', type: 'image', label: 'Screenshot (optional)', placeholder: 'Upload a screenshot' }
	],
	layouts: [
		{ id: 'banner', label: 'Banner' },
		{ id: 'card-with-phone', label: 'Card with Phone' },
		{ id: 'minimal', label: 'Minimal' }
	],
	render
};

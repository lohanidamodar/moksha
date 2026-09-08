/**
 * Promo Banner — promotional banner with logo, text, and optional phone frame.
 */
import { renderBackgroundAndPattern, getBackgroundTone } from '../renderer/backgrounds.js';
import { drawPhoneFrame } from '../renderer/phone-frame.js';
import { renderTextOverlays } from '../renderer/text-overlays.js';

/**
 * Returns layout positioning.
 */
function getLayoutData(layout, w, h) {
	switch (layout) {
		case 'hero':
			return {
				logo: { x: w * 0.5, y: h * 0.2, size: h * 0.2 },
				phone: { x: w * 0.5, y: h * 0.88, pw: w * 0.28, ph: h * 0.4 }
			};
		case 'side-by-side':
			return {
				logo: { x: w * 0.08, y: h * 0.18, size: h * 0.16 },
				phone: { x: w * 0.75, y: h * 0.55, pw: w * 0.3, ph: h * 0.7 }
			};
		case 'minimal':
			return { logo: { x: w * 0.5, y: h * 0.28, size: h * 0.22 }, phone: null };
		default:
			return {
				logo: { x: w * 0.5, y: h * 0.2, size: h * 0.2 },
				phone: { x: w * 0.5, y: h * 0.88, pw: w * 0.28, ph: h * 0.4 }
			};
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
	ctx.shadowBlur = 20;
	ctx.shadowOffsetY = 6;
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
			config.phoneFrame,
			getBackgroundTone(config.background)
		);
	}

	renderTextOverlays(ctx, config.textOverlays, w, h, config);
}

export default {
	id: 'promo-banner',
	label: 'Promo Banner',
	icon: '\ud83d\udcf0',
	sizes: [
		{ id: 'play-1024x500', label: 'Play Store (1024x500)', w: 1024, h: 500, platform: 'android' },
		{ id: 'general-1024x1024', label: 'General (1024x1024)', w: 1024, h: 1024, platform: 'general' }
	],
	inputs: [
		{ id: 'logo', type: 'image', label: 'Logo', placeholder: 'Upload your app logo' },
		{ id: 'screenshot', type: 'image', label: 'Screenshot (optional)', placeholder: 'Upload a screenshot' }
	],
	layouts: [
		{ id: 'hero', label: 'Hero' },
		{ id: 'side-by-side', label: 'Side by Side' },
		{ id: 'minimal', label: 'Minimal' }
	],
	render
};

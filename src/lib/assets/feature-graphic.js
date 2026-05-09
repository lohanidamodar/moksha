/**
 * Feature Graphic — Play Store 1024x500 banner with logo, tagline, and subtitle.
 */
import { renderBackgroundAndPattern } from '$lib/renderer/backgrounds.js';
import { drawPhoneFrame } from '$lib/renderer/phone-frame.js';
import { renderTextOverlays } from '$lib/renderer/text-overlays.js';

/**
 * Returns positioning data for each layout.
 * Coordinates are in fractions of baseW/baseH for scaling.
 */
function getLayoutData(layout, w, h) {
	switch (layout) {
		case 'logo-left':
			return { logo: { x: w * 0.18, y: h * 0.5, size: h * 0.45 }, phone: null };
		case 'logo-center':
			return { logo: { x: w * 0.5, y: h * 0.35, size: h * 0.35 }, phone: null };
		case 'logo-right':
			return { logo: { x: w * 0.82, y: h * 0.5, size: h * 0.45 }, phone: null };
		case 'split-half':
			return { logo: { x: w * 0.25, y: h * 0.5, size: h * 0.5 }, phone: null };
		case 'logo-phone':
			return {
				logo: { x: w * 0.08, y: h * 0.18, size: h * 0.16 },
				phone: { x: w * 0.78, y: h * 0.55, pw: w * 0.22, ph: h * 0.75 }
			};
		case 'phone-center':
			return {
				logo: { x: w * 0.12, y: h * 0.22, size: h * 0.2 },
				phone: { x: w * 0.65, y: h * 0.5, pw: w * 0.2, ph: h * 0.8 }
			};
		default:
			return { logo: { x: w * 0.5, y: h * 0.35, size: h * 0.35 }, phone: null };
	}
}

/**
 * Draws a logo image centered at (cx, cy) with the given size.
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
	const logoX = ld.logo.x + (lt.x / 100) * w;
	const logoY = ld.logo.y + (lt.y / 100) * h;
	const logoSize = ld.logo.size * lt.scale;
	drawLogo(ctx, config.images?.logo ?? null, logoX, logoY, logoSize, lt.rotation || 0);

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
	id: 'feature-graphic',
	label: 'Feature Graphic',
	icon: '\ud83c\udfa8',
	sizes: [
		{ id: 'play-store', label: 'Play Store (1024x500)', w: 1024, h: 500, platform: 'android' }
	],
	inputs: [
		{ id: 'logo', type: 'image', label: 'Logo', placeholder: 'Upload your app logo' },
		{ id: 'screenshot', type: 'image', label: 'Screenshot (optional)', placeholder: 'Upload a screenshot' }
	],
	layouts: [
		{ id: 'logo-left', label: 'Logo Left' },
		{ id: 'logo-center', label: 'Logo Center' },
		{ id: 'logo-right', label: 'Logo Right' },
		{ id: 'split-half', label: 'Split Half' },
		{ id: 'logo-phone', label: 'Logo + Phone' },
		{ id: 'phone-center', label: 'Phone Center' }
	],
	render
};

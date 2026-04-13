/**
 * Feature Graphic — Play Store 1024x500 banner with logo, tagline, and subtitle.
 */
import { renderBackground } from '$lib/renderer/backgrounds.js';
import { drawPhoneFrame } from '$lib/renderer/phone-frame.js';
import { drawText } from '$lib/renderer/canvas.js';

/**
 * Returns positioning data for each layout.
 * Coordinates are in fractions of baseW/baseH for scaling.
 */
function getLayoutData(layout, w, h) {
	switch (layout) {
		case 'logo-left':
			return {
				logo: { x: w * 0.18, y: h * 0.5, size: h * 0.45 },
				tagline: { x: w * 0.42, y: h * 0.38, align: 'left' },
				subtitle: { x: w * 0.42, y: h * 0.62, align: 'left' },
				phone: null
			};
		case 'logo-center':
			return {
				logo: { x: w * 0.5, y: h * 0.35, size: h * 0.35 },
				tagline: { x: w * 0.5, y: h * 0.7, align: 'center' },
				subtitle: { x: w * 0.5, y: h * 0.86, align: 'center' },
				phone: null
			};
		case 'logo-right':
			return {
				logo: { x: w * 0.82, y: h * 0.5, size: h * 0.45 },
				tagline: { x: w * 0.58, y: h * 0.38, align: 'right' },
				subtitle: { x: w * 0.58, y: h * 0.62, align: 'right' },
				phone: null
			};
		case 'split-half':
			return {
				logo: { x: w * 0.25, y: h * 0.5, size: h * 0.5 },
				tagline: { x: w * 0.65, y: h * 0.4, align: 'center' },
				subtitle: { x: w * 0.65, y: h * 0.62, align: 'center' },
				phone: null
			};
		case 'logo-phone':
			return {
				logo: { x: w * 0.08, y: h * 0.18, size: h * 0.16 },
				tagline: { x: w * 0.08, y: h * 0.48, align: 'left' },
				subtitle: { x: w * 0.08, y: h * 0.68, align: 'left' },
				phone: { x: w * 0.78, y: h * 0.55, pw: w * 0.22, ph: h * 0.75 }
			};
		case 'phone-center':
			return {
				logo: { x: w * 0.12, y: h * 0.22, size: h * 0.2 },
				tagline: { x: w * 0.12, y: h * 0.55, align: 'left' },
				subtitle: { x: w * 0.12, y: h * 0.75, align: 'left' },
				phone: { x: w * 0.65, y: h * 0.5, pw: w * 0.2, ph: h * 0.8 }
			};
		default:
			return {
				logo: { x: w * 0.5, y: h * 0.35, size: h * 0.35 },
				tagline: { x: w * 0.5, y: h * 0.7, align: 'center' },
				subtitle: { x: w * 0.5, y: h * 0.86, align: 'center' },
				phone: null
			};
	}
}

/**
 * Draws a logo image centered at (cx, cy) with the given size.
 */
function drawLogo(ctx, img, cx, cy, size) {
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
	const titleFont = config.fonts?.title || 'Inter';
	const subtitleFont = config.fonts?.subtitle || 'Inter';

	// 1. Background
	renderBackground(ctx, w, h, config.background);

	// 2. Layout data
	const ld = getLayoutData(config.layout, w, h);

	// 3. Logo (with transform offsets)
	const lt = config.transforms?.logo ?? { x: 0, y: 0, scale: 1 };
	const logoX = ld.logo.x + (lt.x / 100) * w;
	const logoY = ld.logo.y + (lt.y / 100) * h;
	const logoSize = ld.logo.size * lt.scale;
	drawLogo(ctx, config.images?.logo ?? null, logoX, logoY, logoSize);

	// 4. Tagline
	const tagline = config.texts?.tagline || '';
	if (tagline) {
		const fontSize = Math.round(h * 0.1);
		drawText(ctx, tagline, ld.tagline.x, ld.tagline.y, {
			font: `800 ${fontSize}px "${titleFont}", sans-serif`,
			color: '#ffffff',
			align: ld.tagline.align,
			shadow: { color: 'rgba(0,0,0,0.4)', blur: 16, offsetY: 3 }
		});
	}

	// 5. Subtitle
	const subtitle = config.texts?.subtitle || '';
	if (subtitle) {
		const fontSize = Math.round(h * 0.06);
		drawText(ctx, subtitle, ld.subtitle.x, ld.subtitle.y, {
			font: `600 ${fontSize}px "${subtitleFont}", sans-serif`,
			color: 'rgba(255,255,255,0.8)',
			align: ld.subtitle.align,
			shadow: { color: 'rgba(0,0,0,0.3)', blur: 12, offsetY: 2 }
		});
	}

	// 6. Phone frame with optional screenshot (with transform)
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
			config.images.screenshot
		);
	}
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
		{ id: 'screenshot', type: 'image', label: 'Screenshot (optional)', placeholder: 'Upload a screenshot' },
		{ id: 'tagline', type: 'text', label: 'Tagline', placeholder: 'Your catchy tagline' },
		{ id: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'A short description' }
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

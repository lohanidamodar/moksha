/**
 * Promo Banner — promotional banner with logo, text, and optional phone frame.
 */
import { renderBackground } from '$lib/renderer/backgrounds.js';
import { drawPhoneFrame } from '$lib/renderer/phone-frame.js';
import { drawText } from '$lib/renderer/canvas.js';

/**
 * Returns layout positioning.
 */
function getLayoutData(layout, w, h) {
	switch (layout) {
		case 'hero':
			return {
				logo: { x: w * 0.5, y: h * 0.2, size: h * 0.2 },
				headline: { x: w * 0.5, y: h * 0.48, align: 'center' },
				subtitle: { x: w * 0.5, y: h * 0.64, align: 'center' },
				phone: { x: w * 0.5, y: h * 0.88, pw: w * 0.28, ph: h * 0.4 }
			};
		case 'side-by-side':
			return {
				logo: { x: w * 0.08, y: h * 0.18, size: h * 0.16 },
				headline: { x: w * 0.08, y: h * 0.45, align: 'left' },
				subtitle: { x: w * 0.08, y: h * 0.62, align: 'left' },
				phone: { x: w * 0.75, y: h * 0.55, pw: w * 0.3, ph: h * 0.7 }
			};
		case 'minimal':
			return {
				logo: { x: w * 0.5, y: h * 0.28, size: h * 0.22 },
				headline: { x: w * 0.5, y: h * 0.58, align: 'center' },
				subtitle: { x: w * 0.5, y: h * 0.74, align: 'center' },
				phone: null
			};
		default:
			return {
				logo: { x: w * 0.5, y: h * 0.2, size: h * 0.2 },
				headline: { x: w * 0.5, y: h * 0.48, align: 'center' },
				subtitle: { x: w * 0.5, y: h * 0.64, align: 'center' },
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
	const titleFont = config.fonts?.title || 'Inter';
	const subtitleFont = config.fonts?.subtitle || 'Inter';

	// 1. Background
	renderBackground(ctx, w, h, config.background);

	// 2. Layout data
	const ld = getLayoutData(config.layout, w, h);

	// 3. Logo (with transform)
	const lt = config.transforms?.logo ?? { x: 0, y: 0, scale: 1, rotation: 0 };
	drawLogo(ctx, config.images?.logo ?? null,
		ld.logo.x + (lt.x / 100) * w, ld.logo.y + (lt.y / 100) * h, ld.logo.size * lt.scale, lt.rotation || 0);

	// 4. Headline
	const headline = config.texts?.headline || '';
	if (headline) {
		const fontSize = Math.round(Math.min(w, h) * 0.08);
		drawText(ctx, headline, ld.headline.x, ld.headline.y, {
			font: `800 ${fontSize}px "${titleFont}", sans-serif`,
			color: '#ffffff',
			align: ld.headline.align,
			shadow: { color: 'rgba(0,0,0,0.4)', blur: 16, offsetY: 3 }
		});
	}

	// 5. Subtitle
	const subtitle = config.texts?.subtitle || '';
	if (subtitle) {
		const fontSize = Math.round(Math.min(w, h) * 0.05);
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
			config.images.screenshot,
			config.phoneFrame
		);
	}
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
		{ id: 'headline', type: 'text', label: 'Headline', placeholder: 'Your headline here' },
		{ id: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Supporting text' },
		{ id: 'screenshot', type: 'image', label: 'Screenshot (optional)', placeholder: 'Upload a screenshot' }
	],
	layouts: [
		{ id: 'hero', label: 'Hero' },
		{ id: 'side-by-side', label: 'Side by Side' },
		{ id: 'minimal', label: 'Minimal' }
	],
	render
};

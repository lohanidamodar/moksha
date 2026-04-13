/**
 * Social Card — OG, Twitter, and Instagram cards with logo, text, and optional phone.
 */
import { renderBackground } from '$lib/renderer/backgrounds.js';
import { drawPhoneFrame } from '$lib/renderer/phone-frame.js';
import { drawText } from '$lib/renderer/canvas.js';

/**
 * Returns layout positioning relative to canvas dimensions.
 */
function getLayoutData(layout, w, h) {
	switch (layout) {
		case 'banner':
			return {
				logo: { x: w * 0.08, y: h * 0.15, size: h * 0.22 },
				headline: { x: w * 0.08, y: h * 0.52, align: 'left' },
				subtitle: { x: w * 0.08, y: h * 0.72, align: 'left' },
				phone: null
			};
		case 'card-with-phone':
			return {
				logo: { x: w * 0.08, y: h * 0.15, size: h * 0.18 },
				headline: { x: w * 0.08, y: h * 0.48, align: 'left' },
				subtitle: { x: w * 0.08, y: h * 0.66, align: 'left' },
				phone: { x: w * 0.78, y: h * 0.55, pw: w * 0.22, ph: h * 0.7 }
			};
		case 'minimal':
			return {
				logo: { x: w * 0.5, y: h * 0.25, size: h * 0.2 },
				headline: { x: w * 0.5, y: h * 0.56, align: 'center' },
				subtitle: { x: w * 0.5, y: h * 0.74, align: 'center' },
				phone: null
			};
		default:
			return {
				logo: { x: w * 0.5, y: h * 0.25, size: h * 0.2 },
				headline: { x: w * 0.5, y: h * 0.56, align: 'center' },
				subtitle: { x: w * 0.5, y: h * 0.74, align: 'center' },
				phone: null
			};
	}
}

/**
 * Draw logo centered at (cx, cy).
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
	const titleFont = config.fonts?.title || 'Inter';
	const subtitleFont = config.fonts?.subtitle || 'Inter';

	// 1. Background
	renderBackground(ctx, w, h, config.background);

	// 2. Layout data
	const ld = getLayoutData(config.layout, w, h);

	// 3. Logo
	drawLogo(ctx, config.images?.logo ?? null, ld.logo.x, ld.logo.y, ld.logo.size);

	// 4. Headline
	const headline = config.texts?.headline || '';
	if (headline) {
		const fontSize = Math.round(Math.min(w, h) * 0.09);
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
		const fontSize = Math.round(Math.min(w, h) * 0.055);
		drawText(ctx, subtitle, ld.subtitle.x, ld.subtitle.y, {
			font: `600 ${fontSize}px "${subtitleFont}", sans-serif`,
			color: 'rgba(255,255,255,0.8)',
			align: ld.subtitle.align,
			shadow: { color: 'rgba(0,0,0,0.3)', blur: 12, offsetY: 2 }
		});
	}

	// 6. Phone frame with optional screenshot
	if (ld.phone && config.images?.screenshot) {
		drawPhoneFrame(
			ctx,
			ld.phone.x,
			ld.phone.y,
			ld.phone.pw,
			ld.phone.ph,
			0,
			false,
			config.images.screenshot
		);
	}
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
		{ id: 'headline', type: 'text', label: 'Headline', placeholder: 'Your headline here' },
		{ id: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Supporting text' },
		{ id: 'screenshot', type: 'image', label: 'Screenshot (optional)', placeholder: 'Upload a screenshot' }
	],
	layouts: [
		{ id: 'banner', label: 'Banner' },
		{ id: 'card-with-phone', label: 'Card with Phone' },
		{ id: 'minimal', label: 'Minimal' }
	],
	render
};

/**
 * App Icon Showcase — displays an app icon with glow, shadow, or perspective effects.
 */
import { renderBackground } from '$lib/renderer/backgrounds.js';
import { roundRect } from '$lib/renderer/canvas.js';

/**
 * Draws the app icon centered with layout-specific effects.
 */
function drawIcon(ctx, img, cx, cy, size, layout) {
	if (!img) {
		// Placeholder
		ctx.save();
		ctx.fillStyle = 'rgba(255,255,255,0.08)';
		roundRect(ctx, cx - size / 2, cy - size / 2, size, size, size * 0.2);
		ctx.fill();
		ctx.fillStyle = 'rgba(255,255,255,0.25)';
		ctx.font = `600 ${Math.round(size * 0.08)}px Inter, sans-serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('Upload Icon', cx, cy);
		ctx.restore();
		return;
	}

	const radius = size * 0.2; // rounded corners for the icon

	ctx.save();

	switch (layout) {
		case 'centered-glow': {
			// Glow behind icon
			ctx.shadowColor = 'rgba(255,255,255,0.35)';
			ctx.shadowBlur = size * 0.3;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
			break;
		}
		case 'perspective-floor': {
			// Drop shadow to simulate floor reflection
			ctx.shadowColor = 'rgba(0,0,0,0.6)';
			ctx.shadowBlur = size * 0.15;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = size * 0.12;
			break;
		}
		case 'floating-shadow': {
			// Soft floating shadow beneath
			ctx.shadowColor = 'rgba(0,0,0,0.5)';
			ctx.shadowBlur = size * 0.25;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = size * 0.08;
			break;
		}
	}

	// Clip to rounded rect and draw icon
	roundRect(ctx, cx - size / 2, cy - size / 2, size, size, radius);
	ctx.clip();
	ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
	ctx.restore();

	// Extra effects per layout
	if (layout === 'perspective-floor') {
		// Draw a faint reflection below the icon
		ctx.save();
		ctx.globalAlpha = 0.12;
		ctx.translate(cx, cy + size / 2);
		ctx.scale(1, -0.3);
		roundRect(ctx, -size / 2, 0, size, size, radius);
		ctx.clip();
		ctx.drawImage(img, -size / 2, 0, size, size);
		ctx.restore();
	}

	if (layout === 'centered-glow') {
		// Subtle highlight ring
		ctx.save();
		ctx.strokeStyle = 'rgba(255,255,255,0.15)';
		ctx.lineWidth = 3;
		roundRect(ctx, cx - size / 2, cy - size / 2, size, size, radius);
		ctx.stroke();
		ctx.restore();
	}
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

	// 1. Background
	renderBackground(ctx, w, h, config.background);

	// 2. Icon size — 50% of the smaller dimension
	const iconSize = Math.min(w, h) * 0.5;
	const cx = w / 2;
	const cy = h / 2;

	// For perspective-floor, shift icon up slightly
	const yOffset = config.layout === 'perspective-floor' ? -iconSize * 0.1 : 0;

	// 3. Draw icon with effects
	drawIcon(ctx, config.images?.icon ?? null, cx, cy + yOffset, iconSize, config.layout);
}

export default {
	id: 'app-icon-showcase',
	label: 'App Icon Showcase',
	icon: '\u2b50',
	sizes: [
		{ id: '1024', label: '1024x1024', w: 1024, h: 1024, platform: 'general' },
		{ id: '512', label: '512x512', w: 512, h: 512, platform: 'general' }
	],
	inputs: [
		{ id: 'icon', type: 'image', label: 'App Icon', placeholder: 'Upload your app icon' }
	],
	layouts: [
		{ id: 'centered-glow', label: 'Centered Glow' },
		{ id: 'perspective-floor', label: 'Perspective Floor' },
		{ id: 'floating-shadow', label: 'Floating Shadow' }
	],
	render
};

/**
 * Phone frame drawing with multiple device styles.
 */
import { roundRect } from './canvas.js';

// ============================================================
// Frame style registry
// ============================================================

export const PHONE_FRAMES = [
	{ id: 'iphone-dynamic-island', label: 'iPhone (Dynamic Island)', platform: 'ios' },
	{ id: 'iphone-notch', label: 'iPhone (Notch)', platform: 'ios' },
	{ id: 'ipad', label: 'iPad', platform: 'ios' },
	{ id: 'android-punch-hole', label: 'Android (Punch Hole)', platform: 'android' },
	{ id: 'android-clean', label: 'Android (Clean)', platform: 'android' },
	{ id: 'frameless', label: 'Frameless', platform: 'any' },
];

// ============================================================
// Shared helpers
// ============================================================

function drawScreenContent(ctx, sx, sy, sw, sh, sr, screenshotImg) {
	ctx.save();
	roundRect(ctx, sx, sy, sw, sh, sr);
	ctx.clip();

	if (screenshotImg) {
		const ia = screenshotImg.width / screenshotImg.height;
		const sa = sw / sh;
		let dw, dh, dx, dy;
		if (ia > sa) {
			dh = sh; dw = sh * ia; dx = sx + (sw - dw) / 2; dy = sy;
		} else {
			dw = sw; dh = sw / ia; dx = sx; dy = sy + (sh - dh) / 2;
		}
		ctx.drawImage(screenshotImg, dx, dy, dw, dh);
	} else {
		const pg = ctx.createLinearGradient(sx, sy, sx, sy + sh);
		pg.addColorStop(0, '#1e1e2e');
		pg.addColorStop(1, '#0e0e1e');
		ctx.fillStyle = pg;
		ctx.fillRect(sx, sy, sw, sh);
		ctx.fillStyle = 'rgba(255,255,255,0.15)';
		ctx.font = '600 26px Inter, sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText('Upload Screenshot', sx + sw / 2, sy + sh / 2 + 8);
	}
	ctx.restore();
}

function drawShadow(ctx, l, t, w, h, cr) {
	ctx.save();
	ctx.shadowColor = 'rgba(0,0,0,0.5)';
	ctx.shadowBlur = 60;
	ctx.shadowOffsetY = 20;
	roundRect(ctx, l, t, w, h, cr);
	ctx.fillStyle = '#111';
	ctx.fill();
	ctx.restore();
}

function drawBody(ctx, l, t, w, h, cr, colors) {
	const bg = ctx.createLinearGradient(l, t, l + w, t + h);
	bg.addColorStop(0, colors[0]);
	bg.addColorStop(0.5, colors[1]);
	bg.addColorStop(1, colors[2]);
	roundRect(ctx, l, t, w, h, cr);
	ctx.fillStyle = bg;
	ctx.fill();
	roundRect(ctx, l, t, w, h, cr);
	ctx.strokeStyle = 'rgba(255,255,255,0.12)';
	ctx.lineWidth = 2;
	ctx.stroke();
}

// ============================================================
// Frame renderers
// ============================================================

function drawIPhoneDynamicIsland(ctx, l, t, w, h, cr) {
	const bs = 10, bt = 20, bb = 20;
	const sx = l + bs, sy = t + bt, sw = w - bs * 2, sh = h - bt - bb;
	const sr = cr - 6;

	// Dynamic Island pill
	const pillW = w * 0.28, pillH = h * 0.018;
	const pillX = -pillW / 2, pillY = t + bt + h * 0.012;
	roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
	ctx.fillStyle = '#000000';
	ctx.fill();

	// Home bar
	const barW = w * 0.35, barH = 5;
	roundRect(ctx, -barW / 2, t + h - bb / 2 - 2, barW, barH, barH / 2);
	ctx.fillStyle = 'rgba(255,255,255,0.3)';
	ctx.fill();

	return { sx, sy, sw, sh, sr };
}

function drawIPhoneNotch(ctx, l, t, w, h, cr) {
	const bs = 14, bt = 50, bb = 50;
	const sx = l + bs, sy = t + bt, sw = w - bs * 2, sh = h - bt - bb;
	const sr = cr - 8;
	const nw = w * 0.33, nh = h * 0.016;

	// Notch
	const nx = -nw / 2, ny = t + bt - nh / 2 - 2;
	roundRect(ctx, nx, ny, nw, nh, nh / 2);
	ctx.fillStyle = '#111114';
	ctx.fill();

	// Camera in notch
	ctx.beginPath();
	ctx.arc(nx + nw - nw * 0.2, ny + nh / 2, nh * 0.35, 0, Math.PI * 2);
	ctx.fillStyle = '#0d2137';
	ctx.fill();

	// Home bar
	roundRect(ctx, -70, t + h - bb / 2 - 2, 140, 5, 2.5);
	ctx.fillStyle = 'rgba(255,255,255,0.25)';
	ctx.fill();

	return { sx, sy, sw, sh, sr };
}

function drawIPad(ctx, l, t, w, h, cr) {
	const bs = 18, bt = 30, bb = 30;
	const sx = l + bs, sy = t + bt, sw = w - bs * 2, sh = h - bt - bb;
	const sr = cr - 8;

	// Front camera (small dot at top center)
	ctx.beginPath();
	ctx.arc(0, t + bt / 2, h * 0.005, 0, Math.PI * 2);
	ctx.fillStyle = '#1a1a22';
	ctx.fill();

	return { sx, sy, sw, sh, sr };
}

function drawAndroidPunchHole(ctx, l, t, w, h, cr) {
	const bs = 10, bt = 22, bb = 22;
	const sx = l + bs, sy = t + bt, sw = w - bs * 2, sh = h - bt - bb;
	const sr = cr - 6;

	// Punch-hole camera (top center)
	ctx.beginPath();
	ctx.arc(0, t + bt + h * 0.015, h * 0.008, 0, Math.PI * 2);
	ctx.fillStyle = '#000000';
	ctx.fill();

	// Thin chin indicator
	const barW = w * 0.2, barH = 4;
	roundRect(ctx, -barW / 2, t + h - bb / 2 - 2, barW, barH, barH / 2);
	ctx.fillStyle = 'rgba(255,255,255,0.15)';
	ctx.fill();

	return { sx, sy, sw, sh, sr };
}

function drawAndroidClean(ctx, l, t, w, h, cr) {
	const bs = 10, bt = 16, bb = 16;
	const sx = l + bs, sy = t + bt, sw = w - bs * 2, sh = h - bt - bb;
	const sr = cr - 6;

	return { sx, sy, sw, sh, sr };
}

function drawFrameless(ctx, l, t, w, h, cr) {
	// No bezel at all — screen fills the entire frame
	const sx = l, sy = t, sw = w, sh = h;
	const sr = cr;

	return { sx, sy, sw, sh, sr };
}

// ============================================================
// Main entry point
// ============================================================

/**
 * Draws a phone frame with the specified style.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x — center x
 * @param {number} y — center y
 * @param {number} w — frame width
 * @param {number} h — frame height
 * @param {number} angle — rotation in degrees
 * @param {boolean} hasPerspective
 * @param {HTMLImageElement | null} screenshotImg
 * @param {string} [frameStyle='iphone-notch'] — frame style id
 */
export function drawPhoneFrame(ctx, x, y, w, h, angle, hasPerspective, screenshotImg, frameStyle = 'iphone-notch') {
	const isFrameless = frameStyle === 'frameless';
	const cr = isFrameless ? 24 : 40;

	ctx.save();
	ctx.translate(x, y);
	if (angle) ctx.rotate((angle * Math.PI) / 180);
	if (hasPerspective) ctx.transform(1, 0.04, -0.02, 1, 0, 0);

	const l = -w / 2;
	const t = -h / 2;

	// Shadow
	drawShadow(ctx, l, t, w, h, cr);

	// Body (skip for frameless)
	if (!isFrameless) {
		const bodyColors = frameStyle.startsWith('iphone') || frameStyle === 'ipad'
			? ['#3a3a3e', '#2a2a2e', '#1a1a1e']  // lighter silver-ish for iOS
			: ['#2a2a2e', '#1a1a1e', '#111114'];  // darker for Android
		drawBody(ctx, l, t, w, h, cr, bodyColors);
	}

	// Frame-specific details + get screen area
	let screen;
	switch (frameStyle) {
		case 'iphone-dynamic-island':
			screen = drawIPhoneDynamicIsland(ctx, l, t, w, h, cr);
			break;
		case 'ipad':
			screen = drawIPad(ctx, l, t, w, h, cr);
			break;
		case 'android-punch-hole':
			screen = drawAndroidPunchHole(ctx, l, t, w, h, cr);
			break;
		case 'android-clean':
			screen = drawAndroidClean(ctx, l, t, w, h, cr);
			break;
		case 'frameless':
			screen = drawFrameless(ctx, l, t, w, h, cr);
			break;
		case 'iphone-notch':
		default:
			screen = drawIPhoneNotch(ctx, l, t, w, h, cr);
			break;
	}

	// Screen content
	drawScreenContent(ctx, screen.sx, screen.sy, screen.sw, screen.sh, screen.sr, screenshotImg);

	ctx.restore();
}

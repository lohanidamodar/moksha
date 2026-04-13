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
// Frame configs — return { screen, overlay }
// screen: { sx, sy, sw, sh, sr } for the screenshot area
// overlay: function(ctx) that draws on TOP of the screenshot
// ============================================================

function getIPhoneDynamicIsland(l, t, w, h, cr) {
	const bs = 10, bt = 20, bb = 20;
	const screen = {
		sx: l + bs, sy: t + bt, sw: w - bs * 2, sh: h - bt - bb, sr: cr - 6
	};
	function overlay(ctx) {
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
	}
	return { screen, overlay };
}

function getIPhoneNotch(l, t, w, h, cr) {
	const bs = 14, bt = 50, bb = 50;
	const screen = {
		sx: l + bs, sy: t + bt, sw: w - bs * 2, sh: h - bt - bb, sr: cr - 8
	};
	function overlay(ctx) {
		const nw = w * 0.33, nh = h * 0.016;
		const nx = -nw / 2, ny = t + bt - nh / 2 - 2;
		// Notch
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
	}
	return { screen, overlay };
}

function getIPad(l, t, w, h, cr) {
	const bs = 18, bt = 30, bb = 30;
	const screen = {
		sx: l + bs, sy: t + bt, sw: w - bs * 2, sh: h - bt - bb, sr: cr - 8
	};
	function overlay(ctx) {
		ctx.beginPath();
		ctx.arc(0, t + bt / 2, h * 0.005, 0, Math.PI * 2);
		ctx.fillStyle = '#1a1a22';
		ctx.fill();
	}
	return { screen, overlay };
}

function getAndroidPunchHole(l, t, w, h, cr) {
	const bs = 10, bt = 22, bb = 22;
	const screen = {
		sx: l + bs, sy: t + bt, sw: w - bs * 2, sh: h - bt - bb, sr: cr - 6
	};
	function overlay(ctx) {
		// Punch-hole camera
		ctx.beginPath();
		ctx.arc(0, t + bt + h * 0.015, h * 0.008, 0, Math.PI * 2);
		ctx.fillStyle = '#000000';
		ctx.fill();
		// Thin chin bar
		const barW = w * 0.2, barH = 4;
		roundRect(ctx, -barW / 2, t + h - bb / 2 - 2, barW, barH, barH / 2);
		ctx.fillStyle = 'rgba(255,255,255,0.15)';
		ctx.fill();
	}
	return { screen, overlay };
}

function getAndroidClean(l, t, w, h, cr) {
	const bs = 10, bt = 16, bb = 16;
	const screen = {
		sx: l + bs, sy: t + bt, sw: w - bs * 2, sh: h - bt - bb, sr: cr - 6
	};
	return { screen, overlay: null };
}

function getFrameless(l, t, w, h, cr) {
	const screen = { sx: l, sy: t, sw: w, sh: h, sr: cr };
	return { screen, overlay: null };
}

// ============================================================
// Main entry point
// ============================================================

/**
 * Draws a phone frame with the specified style.
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

	// 1. Shadow
	drawShadow(ctx, l, t, w, h, cr);

	// 2. Body (skip for frameless)
	if (!isFrameless) {
		const bodyColors = frameStyle.startsWith('iphone') || frameStyle === 'ipad'
			? ['#3a3a3e', '#2a2a2e', '#1a1a1e']
			: ['#2a2a2e', '#1a1a1e', '#111114'];
		drawBody(ctx, l, t, w, h, cr, bodyColors);
	}

	// 3. Get frame config (screen area + overlay)
	let frame;
	switch (frameStyle) {
		case 'iphone-dynamic-island': frame = getIPhoneDynamicIsland(l, t, w, h, cr); break;
		case 'ipad': frame = getIPad(l, t, w, h, cr); break;
		case 'android-punch-hole': frame = getAndroidPunchHole(l, t, w, h, cr); break;
		case 'android-clean': frame = getAndroidClean(l, t, w, h, cr); break;
		case 'frameless': frame = getFrameless(l, t, w, h, cr); break;
		case 'iphone-notch':
		default: frame = getIPhoneNotch(l, t, w, h, cr); break;
	}

	// 4. Screen content (screenshot or placeholder)
	const s = frame.screen;
	drawScreenContent(ctx, s.sx, s.sy, s.sw, s.sh, s.sr, screenshotImg);

	// 5. Overlay (notch, dynamic island, etc.) drawn ON TOP of screenshot
	if (frame.overlay) {
		frame.overlay(ctx);
	}

	ctx.restore();
}

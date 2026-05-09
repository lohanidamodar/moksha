/**
 * Phone frame drawing with multiple device styles.
 */
import { roundRect } from './canvas.js';

// ============================================================
// Frame style registry
// ============================================================

// Body color presets — gradient stops for the phone body
const BODY_COLORS = {
	black: ['#3a3a3e', '#2a2a2e', '#1a1a1e'],
	titanium: ['#5a5a5e', '#3e3e42', '#2a2a2e'],
	white: ['#f8f8f8', '#e8e8e8', '#d8d8d8'],
	natural: ['#a89685', '#806f5e', '#5a4d40'],  // titanium natural / warm gold
	gold: ['#e8d5a8', '#c9a878', '#8a6f4e'],
	silver: ['#e8e8ec', '#c8c8cc', '#a0a0a4'],
	'dark-android': ['#2a2a2e', '#1a1a1e', '#111114'],
	'pixel-cream': ['#f0e8de', '#d6cfc4', '#a8a39a'],
	'graphite': ['#2c2c2e', '#1c1c1e', '#0e0e10'],
};

export const PHONE_FRAMES = [
	// iPhone Dynamic Island variants
	{ id: 'iphone-dynamic-island', label: 'iPhone Black', platform: 'ios' },
	{ id: 'iphone-dynamic-island-white', label: 'iPhone White', platform: 'ios' },
	{ id: 'iphone-dynamic-island-natural', label: 'iPhone Natural Titanium', platform: 'ios' },
	{ id: 'iphone-dynamic-island-gold', label: 'iPhone Gold', platform: 'ios' },
	// iPhone Notch variants
	{ id: 'iphone-notch', label: 'iPhone Notch (Black)', platform: 'ios' },
	{ id: 'iphone-notch-white', label: 'iPhone Notch (White)', platform: 'ios' },
	// iPad variants
	{ id: 'ipad', label: 'iPad Space Gray', platform: 'ios' },
	{ id: 'ipad-silver', label: 'iPad Silver', platform: 'ios' },
	{ id: 'ipad-gold', label: 'iPad Gold', platform: 'ios' },
	// Android — Pixel
	{ id: 'pixel', label: 'Pixel Cream', platform: 'android' },
	{ id: 'pixel-black', label: 'Pixel Obsidian', platform: 'android' },
	{ id: 'pixel-white', label: 'Pixel Porcelain', platform: 'android' },
	// Android — Galaxy
	{ id: 'galaxy', label: 'Galaxy Titanium', platform: 'android' },
	{ id: 'galaxy-black', label: 'Galaxy Phantom Black', platform: 'android' },
	{ id: 'galaxy-white', label: 'Galaxy Phantom White', platform: 'android' },
	// Android — Other styles
	{ id: 'oneplus', label: 'OnePlus / Nothing (Corner Cam)', platform: 'android' },
	{ id: 'android-waterdrop', label: 'Android Waterdrop Notch', platform: 'android' },
	{ id: 'android-punch-hole', label: 'Android Punch Hole', platform: 'android' },
	{ id: 'android-clean', label: 'Android Clean', platform: 'android' },
	// Universal
	{ id: 'frameless', label: 'Frameless', platform: 'any' },
	{ id: 'frameless-bordered', label: 'Frameless (Bordered)', platform: 'any' },
];

/** Look up body colors for a frame style. */
function getBodyColors(frameStyle) {
	if (frameStyle === 'iphone-dynamic-island' || frameStyle === 'iphone-notch') return BODY_COLORS.black;
	if (frameStyle === 'iphone-dynamic-island-white' || frameStyle === 'iphone-notch-white') return BODY_COLORS.white;
	if (frameStyle === 'iphone-dynamic-island-natural') return BODY_COLORS.natural;
	if (frameStyle === 'iphone-dynamic-island-gold') return BODY_COLORS.gold;
	if (frameStyle === 'ipad') return BODY_COLORS.titanium;
	if (frameStyle === 'ipad-silver') return BODY_COLORS.silver;
	if (frameStyle === 'ipad-gold') return BODY_COLORS.gold;
	if (frameStyle === 'pixel') return BODY_COLORS['pixel-cream'];
	if (frameStyle === 'pixel-black') return BODY_COLORS.graphite;
	if (frameStyle === 'pixel-white') return BODY_COLORS.white;
	if (frameStyle === 'galaxy') return BODY_COLORS.titanium;
	if (frameStyle === 'galaxy-black') return BODY_COLORS.graphite;
	if (frameStyle === 'galaxy-white') return BODY_COLORS.white;
	if (frameStyle === 'oneplus') return BODY_COLORS['dark-android'];
	if (frameStyle === 'android-waterdrop') return BODY_COLORS['dark-android'];
	return BODY_COLORS['dark-android'];
}

/** Map a frame style to its layout-style group (for picking screen/overlay) */
function frameGroup(frameStyle) {
	if (frameStyle.startsWith('iphone-dynamic-island')) return 'iphone-dynamic-island';
	if (frameStyle.startsWith('iphone-notch')) return 'iphone-notch';
	if (frameStyle.startsWith('ipad')) return 'ipad';
	if (frameStyle.startsWith('pixel')) return 'pixel';
	if (frameStyle.startsWith('galaxy')) return 'galaxy';
	return frameStyle;
}

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
	// Bezels as fractions of the smaller dimension for visual consistency
	const bs = w * 0.012;
	const bt = w * 0.024;
	const bb = w * 0.024;
	const screen = {
		sx: l + bs, sy: t + bt, sw: w - bs * 2, sh: h - bt - bb, sr: cr * 0.85
	};
	function overlay(ctx) {
		// Dynamic Island pill — sized as a fraction of phone width
		const pillW = w * 0.27, pillH = w * 0.05;
		const pillX = -pillW / 2, pillY = t + bt + w * 0.018;
		roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
		ctx.fillStyle = '#000000';
		ctx.fill();
		// Home bar
		const barW = w * 0.35, barH = w * 0.008;
		roundRect(ctx, -barW / 2, t + h - bb / 2 - barH / 2, barW, barH, barH / 2);
		ctx.fillStyle = 'rgba(255,255,255,0.3)';
		ctx.fill();
	}
	return { screen, overlay };
}

function getIPhoneNotch(l, t, w, h, cr) {
	const bs = w * 0.018;
	const bt = w * 0.062;
	const bb = w * 0.062;
	const screen = {
		sx: l + bs, sy: t + bt, sw: w - bs * 2, sh: h - bt - bb, sr: cr * 0.8
	};
	function overlay(ctx) {
		const nw = w * 0.32, nh = w * 0.04;
		const nx = -nw / 2, ny = t + bt - nh / 2 - w * 0.003;
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
		const barW = w * 0.32, barH = w * 0.007;
		roundRect(ctx, -barW / 2, t + h - bb / 2 - barH / 2, barW, barH, barH / 2);
		ctx.fillStyle = 'rgba(255,255,255,0.25)';
		ctx.fill();
	}
	return { screen, overlay };
}

function getIPad(l, t, w, h, cr) {
	const bs = w * 0.018;
	const bt = w * 0.025;
	const bb = w * 0.025;
	const screen = {
		sx: l + bs, sy: t + bt, sw: w - bs * 2, sh: h - bt - bb, sr: cr * 0.8
	};
	function overlay(ctx) {
		// Front camera dot at top center
		ctx.beginPath();
		ctx.arc(0, t + bt / 2, w * 0.005, 0, Math.PI * 2);
		ctx.fillStyle = '#1a1a22';
		ctx.fill();
	}
	return { screen, overlay };
}

function getAndroidPunchHole(l, t, w, h, cr) {
	const bs = w * 0.012;
	const bt = w * 0.026;
	const bb = w * 0.026;
	const screen = {
		sx: l + bs, sy: t + bt, sw: w - bs * 2, sh: h - bt - bb, sr: cr * 0.85
	};
	function overlay(ctx) {
		// Punch-hole camera near top center
		ctx.beginPath();
		ctx.arc(0, t + bt + w * 0.018, w * 0.012, 0, Math.PI * 2);
		ctx.fillStyle = '#000000';
		ctx.fill();
		// Thin chin bar
		const barW = w * 0.2, barH = w * 0.006;
		roundRect(ctx, -barW / 2, t + h - bb / 2 - barH / 2, barW, barH, barH / 2);
		ctx.fillStyle = 'rgba(255,255,255,0.15)';
		ctx.fill();
	}
	return { screen, overlay };
}

function getAndroidClean(l, t, w, h, cr) {
	const bs = w * 0.012;
	const bt = w * 0.018;
	const bb = w * 0.018;
	const screen = {
		sx: l + bs, sy: t + bt, sw: w - bs * 2, sh: h - bt - bb, sr: cr * 0.85
	};
	return { screen, overlay: null };
}

function getFrameless(l, t, w, h, cr) {
	const screen = { sx: l, sy: t, sw: w, sh: h, sr: cr };
	return { screen, overlay: null };
}

/** Pixel-style — visible camera bar at top */
function getPixel(l, t, w, h, cr) {
	const bs = w * 0.012;
	const bt = w * 0.07; // larger top bezel for camera bar
	const bb = w * 0.026;
	const screen = {
		sx: l + bs, sy: t + bt, sw: w - bs * 2, sh: h - bt - bb, sr: cr * 0.85
	};
	function overlay(ctx) {
		// Horizontal camera bar (rounded pill near top)
		const barW = w * 0.85, barH = w * 0.045;
		const barX = -barW / 2, barY = t + bt - barH - w * 0.005;
		roundRect(ctx, barX, barY, barW, barH, barH / 2);
		ctx.fillStyle = 'rgba(0,0,0,0.7)';
		ctx.fill();
		// Two camera lenses on the bar
		const lensY = barY + barH / 2;
		ctx.fillStyle = '#0a0a0a';
		ctx.beginPath();
		ctx.arc(barX + barW * 0.18, lensY, barH * 0.32, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(barX + barW * 0.32, lensY, barH * 0.28, 0, Math.PI * 2);
		ctx.fill();
		// Front camera dot at top center
		ctx.beginPath();
		ctx.arc(0, t + bt / 2, w * 0.008, 0, Math.PI * 2);
		ctx.fillStyle = '#0a0a0a';
		ctx.fill();
	}
	return { screen, overlay };
}

/** Galaxy-style — vertical camera array on top-right corner */
function getGalaxy(l, t, w, h, cr) {
	const bs = w * 0.012;
	const bt = w * 0.026;
	const bb = w * 0.026;
	const screen = {
		sx: l + bs, sy: t + bt, sw: w - bs * 2, sh: h - bt - bb, sr: cr * 0.85
	};
	function overlay(ctx) {
		// Centered top camera punch-hole
		ctx.beginPath();
		ctx.arc(0, t + bt + w * 0.018, w * 0.012, 0, Math.PI * 2);
		ctx.fillStyle = '#000000';
		ctx.fill();
	}
	return { screen, overlay };
}

/** Frameless Bordered — screen with a thin border outline drawn over its edge */
function getFramelessBordered(l, t, w, h, cr) {
	const screen = { sx: l, sy: t, sw: w, sh: h, sr: cr };
	function overlay(ctx) {
		roundRect(ctx, l, t, w, h, cr);
		ctx.strokeStyle = 'rgba(255,255,255,0.55)';
		ctx.lineWidth = Math.max(2, w * 0.004);
		ctx.stroke();
	}
	return { screen, overlay };
}

/** OnePlus / Nothing-style — punch-hole camera in the top-left corner */
function getOnePlus(l, t, w, h, cr) {
	const bs = w * 0.012;
	const bt = w * 0.026;
	const bb = w * 0.026;
	const screen = {
		sx: l + bs, sy: t + bt, sw: w - bs * 2, sh: h - bt - bb, sr: cr * 0.85
	};
	function overlay(ctx) {
		// Punch-hole near top-left
		const camX = -w * 0.32;
		const camY = t + bt + w * 0.02;
		ctx.beginPath();
		ctx.arc(camX, camY, w * 0.012, 0, Math.PI * 2);
		ctx.fillStyle = '#000000';
		ctx.fill();
	}
	return { screen, overlay };
}

/** Android Waterdrop Notch — small teardrop notch at top center */
function getAndroidWaterdrop(l, t, w, h, cr) {
	const bs = w * 0.014;
	const bt = w * 0.034;
	const bb = w * 0.028;
	const screen = {
		sx: l + bs, sy: t + bt, sw: w - bs * 2, sh: h - bt - bb, sr: cr * 0.85
	};
	function overlay(ctx) {
		// Teardrop notch at top center — small downward arc cutout shape
		const notchW = w * 0.085;
		const notchH = w * 0.04;
		const nx = 0;
		const ny = t + bt - notchH * 0.4;
		ctx.beginPath();
		ctx.moveTo(nx - notchW / 2, ny);
		ctx.quadraticCurveTo(nx - notchW / 4, ny + notchH, nx, ny + notchH);
		ctx.quadraticCurveTo(nx + notchW / 4, ny + notchH, nx + notchW / 2, ny);
		ctx.closePath();
		ctx.fillStyle = '#0a0a0a';
		ctx.fill();
		// Tiny camera lens inside the notch
		ctx.beginPath();
		ctx.arc(nx, ny + notchH * 0.45, notchH * 0.18, 0, Math.PI * 2);
		ctx.fillStyle = '#1a1a22';
		ctx.fill();
	}
	return { screen, overlay };
}

// ============================================================
// Main entry point
// ============================================================

/**
 * Draws a phone frame with the specified style.
 */
export function drawPhoneFrame(ctx, x, y, w, h, angle, hasPerspective, screenshotImg, frameStyle = 'iphone-notch') {
	const isBodyless = frameStyle === 'frameless' || frameStyle === 'frameless-bordered';

	const cr = isBodyless ? w * 0.03 : w * 0.05;

	ctx.save();
	ctx.translate(x, y);
	if (angle) ctx.rotate((angle * Math.PI) / 180);
	if (hasPerspective) ctx.transform(1, 0.04, -0.02, 1, 0, 0);

	const l = -w / 2;
	const t = -h / 2;

	// 1. Shadow — bodyless variants use a softer, larger shadow
	if (isBodyless) {
		ctx.save();
		ctx.shadowColor = 'rgba(0,0,0,0.4)';
		ctx.shadowBlur = w * 0.08;
		ctx.shadowOffsetY = w * 0.025;
		roundRect(ctx, l, t, w, h, cr);
		ctx.fillStyle = '#000';
		ctx.fill();
		ctx.restore();
	} else {
		drawShadow(ctx, l, t, w, h, cr);
	}

	// 2. Body (skip for frameless / floating)
	if (!isBodyless) {
		drawBody(ctx, l, t, w, h, cr, getBodyColors(frameStyle));
	}

	// 3. Get frame config (screen area + overlay)
	let frame;
	switch (frameGroup(frameStyle)) {
		case 'iphone-dynamic-island': frame = getIPhoneDynamicIsland(l, t, w, h, cr); break;
		case 'ipad': frame = getIPad(l, t, w, h, cr); break;
		case 'android-punch-hole': frame = getAndroidPunchHole(l, t, w, h, cr); break;
		case 'android-clean': frame = getAndroidClean(l, t, w, h, cr); break;
		case 'pixel': frame = getPixel(l, t, w, h, cr); break;
		case 'galaxy': frame = getGalaxy(l, t, w, h, cr); break;
		case 'oneplus': frame = getOnePlus(l, t, w, h, cr); break;
		case 'android-waterdrop': frame = getAndroidWaterdrop(l, t, w, h, cr); break;
		case 'frameless': frame = getFrameless(l, t, w, h, cr); break;
		case 'frameless-bordered': frame = getFramelessBordered(l, t, w, h, cr); break;
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

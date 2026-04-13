/**
 * Phone frame drawing — ported from mockup.html's drawPhoneFrame.
 */

import { roundRect } from './canvas.js';

/**
 * Draws a phone frame with shadow, body, screen, notch, and home bar.
 *
 * The frame is centered on (x, y) so callers pass the center point.
 * If screenshotImg is provided it is drawn cover-fit inside the screen area;
 * otherwise a dark placeholder with an "Upload Screenshot" label is rendered.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x — center x
 * @param {number} y — center y
 * @param {number} w — frame width
 * @param {number} h — frame height
 * @param {number} angle — rotation in degrees (0 = upright)
 * @param {boolean} hasPerspective — apply a subtle perspective skew
 * @param {HTMLImageElement | null} screenshotImg — optional screenshot to render in the screen
 */
export function drawPhoneFrame(ctx, x, y, w, h, angle, hasPerspective, screenshotImg) {
	const cr = 40;   // corner radius
	const bt = 50;   // bezel top
	const bb = 50;   // bezel bottom
	const bs = 14;   // bezel side
	const nw = 180;  // notch width
	const nh = 30;   // notch height

	ctx.save();
	ctx.translate(x, y);
	if (angle) ctx.rotate((angle * Math.PI) / 180);
	if (hasPerspective) ctx.transform(1, 0.04, -0.02, 1, 0, 0);

	const l = -w / 2;
	const t = -h / 2;

	// --- Shadow ---
	ctx.save();
	ctx.shadowColor = 'rgba(0,0,0,0.5)';
	ctx.shadowBlur = 60;
	ctx.shadowOffsetY = 20;
	roundRect(ctx, l, t, w, h, cr);
	ctx.fillStyle = '#111';
	ctx.fill();
	ctx.restore();

	// --- Body gradient ---
	const bg = ctx.createLinearGradient(l, t, l + w, t + h);
	bg.addColorStop(0, '#2a2a2e');
	bg.addColorStop(0.5, '#1a1a1e');
	bg.addColorStop(1, '#111114');
	roundRect(ctx, l, t, w, h, cr);
	ctx.fillStyle = bg;
	ctx.fill();

	// --- Body border ---
	roundRect(ctx, l, t, w, h, cr);
	ctx.strokeStyle = 'rgba(255,255,255,0.12)';
	ctx.lineWidth = 2;
	ctx.stroke();

	// --- Screen ---
	const sx = l + bs;
	const sy = t + bt;
	const sw = w - bs * 2;
	const sh = h - bt - bb;
	const sr = cr - 8;

	ctx.save();
	roundRect(ctx, sx, sy, sw, sh, sr);
	ctx.clip();

	if (screenshotImg) {
		// Cover-fit the screenshot into the screen area
		const ia = screenshotImg.width / screenshotImg.height;
		const sa = sw / sh;
		let dw, dh, dx, dy;
		if (ia > sa) {
			dh = sh;
			dw = sh * ia;
			dx = sx + (sw - dw) / 2;
			dy = sy;
		} else {
			dw = sw;
			dh = sw / ia;
			dx = sx;
			dy = sy + (sh - dh) / 2;
		}
		ctx.drawImage(screenshotImg, dx, dy, dw, dh);
	} else {
		// Placeholder gradient
		const pg = ctx.createLinearGradient(sx, sy, sx, sy + sh);
		pg.addColorStop(0, '#1e1e2e');
		pg.addColorStop(1, '#0e0e1e');
		ctx.fillStyle = pg;
		ctx.fillRect(sx, sy, sw, sh);

		// Placeholder icon (mountain/image icon)
		ctx.fillStyle = 'rgba(255,255,255,0.12)';
		const ix = sx + sw / 2;
		const iy = sy + sh / 2 - 20;
		ctx.beginPath();
		ctx.moveTo(ix - 30, iy + 10);
		ctx.lineTo(ix + 30, iy + 10);
		ctx.lineTo(ix + 30, iy + 30);
		ctx.lineTo(ix - 30, iy + 30);
		ctx.closePath();
		ctx.fill();
		ctx.beginPath();
		ctx.moveTo(ix, iy - 25);
		ctx.lineTo(ix - 20, iy);
		ctx.lineTo(ix + 20, iy);
		ctx.closePath();
		ctx.fill();

		// "Upload Screenshot" text
		ctx.fillStyle = 'rgba(255,255,255,0.25)';
		ctx.font = '600 26px Inter, sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText('Upload Screenshot', ix, iy + 70);
	}
	ctx.restore();

	// --- Notch ---
	const nx = -nw / 2;
	const ny = t + bt - nh / 2 - 2;
	roundRect(ctx, nx, ny, nw, nh, nh / 2);
	ctx.fillStyle = '#111114';
	ctx.fill();

	// Camera lens (outer)
	ctx.beginPath();
	ctx.arc(nx + nw - 35, ny + nh / 2, 7, 0, Math.PI * 2);
	ctx.fillStyle = '#1a1a22';
	ctx.fill();

	// Camera lens (inner)
	ctx.beginPath();
	ctx.arc(nx + nw - 35, ny + nh / 2, 4, 0, Math.PI * 2);
	ctx.fillStyle = '#0d2137';
	ctx.fill();

	// --- Home bar ---
	roundRect(ctx, -70, t + h - bb / 2 - 2, 140, 5, 2.5);
	ctx.fillStyle = 'rgba(255,255,255,0.25)';
	ctx.fill();

	ctx.restore();
}

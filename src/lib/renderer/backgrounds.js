/**
 * Background and pattern preset system for Moksha.
 *
 * Two independent layers:
 *   - Background: gradient | mesh | solid (the color/fill)
 *   - Pattern: optional texture overlay drawn on top
 *
 * Backgrounds declare a `tone`: 'dark' (use white text) or 'light' (use dark text).
 */

// ============================================================
// Gradient presets — simple linear two-color gradients
// ============================================================

export const GRADIENTS = [
	// Vibrant
	{ id: 'sunset-pink', label: 'Sunset Pink', colors: ['#ff6a00', '#ee0979'], tone: 'dark' },
	{ id: 'blue-violet', label: 'Blue Violet', colors: ['#4facfe', '#6a11cb'], tone: 'dark' },
	{ id: 'emerald', label: 'Emerald', colors: ['#11998e', '#38ef7d'], tone: 'dark' },
	{ id: 'hot-magenta', label: 'Hot Magenta', colors: ['#f953c6', '#b91d73'], tone: 'dark' },
	{ id: 'ocean', label: 'Ocean', colors: ['#00b4db', '#0083b0'], tone: 'dark' },
	{ id: 'indigo-dream', label: 'Indigo Dream', colors: ['#4e54c8', '#8f94fb'], tone: 'dark' },
	{ id: 'amber', label: 'Amber', colors: ['#f7971e', '#ffd200'], tone: 'dark' },
	{ id: 'red-orange', label: 'Red Orange', colors: ['#ff4e50', '#f9d423'], tone: 'dark' },
	// Sophisticated dark
	{ id: 'dark-teal', label: 'Dark Teal', colors: ['#0f2027', '#2c5364'], tone: 'dark' },
	{ id: 'midnight-blue', label: 'Midnight Blue', colors: ['#020111', '#3a6073'], tone: 'dark' },
	{ id: 'space-gray', label: 'Space Gray', colors: ['#232526', '#414345'], tone: 'dark' },
	{ id: 'deep-ocean', label: 'Deep Ocean', colors: ['#000428', '#004e92'], tone: 'dark' },
	{ id: 'midnight-purple', label: 'Midnight Purple', colors: ['#0f0c29', '#302b63'], tone: 'dark' },
	{ id: 'forest-night', label: 'Forest Night', colors: ['#0c1f1a', '#1d4031'], tone: 'dark' },
	// Soft pastels (light)
	{ id: 'peachy', label: 'Peachy', colors: ['#ffecd2', '#fcb69f'], tone: 'light' },
	{ id: 'soft-pink', label: 'Soft Pink', colors: ['#ffafbd', '#ffc3a0'], tone: 'light' },
	{ id: 'mint-cream', label: 'Mint Cream', colors: ['#a8edea', '#fed6e3'], tone: 'light' },
	{ id: 'lavender-mist', label: 'Lavender Mist', colors: ['#d3cce3', '#e9e4f0'], tone: 'light' },
	{ id: 'morning-sun', label: 'Morning Sun', colors: ['#fff1eb', '#ace0f9'], tone: 'light' }
];

// ============================================================
// Mesh gradients — multi-color radial blobs blended together
// ============================================================

export const MESH = [
	{
		id: 'aurora',
		label: 'Aurora',
		base: '#0d1421',
		blobs: [
			{ x: 0.2, y: 0.2, r: 0.6, color: '#ff006e' },
			{ x: 0.8, y: 0.3, r: 0.5, color: '#3a86ff' },
			{ x: 0.5, y: 0.85, r: 0.6, color: '#8338ec' }
		],
		tone: 'dark'
	},
	{
		id: 'sunset-mesh',
		label: 'Sunset Mesh',
		base: '#1a0a2e',
		blobs: [
			{ x: 0.15, y: 0.25, r: 0.55, color: '#fb5607' },
			{ x: 0.85, y: 0.5, r: 0.5, color: '#ff006e' },
			{ x: 0.4, y: 0.85, r: 0.55, color: '#ffbe0b' }
		],
		tone: 'dark'
	},
	{
		id: 'ocean-mesh',
		label: 'Ocean Mesh',
		base: '#001220',
		blobs: [
			{ x: 0.2, y: 0.3, r: 0.55, color: '#00b4d8' },
			{ x: 0.8, y: 0.2, r: 0.5, color: '#0077b6' },
			{ x: 0.5, y: 0.8, r: 0.6, color: '#48cae4' }
		],
		tone: 'dark'
	},
	{
		id: 'forest-mesh',
		label: 'Forest Mesh',
		base: '#0a1e0f',
		blobs: [
			{ x: 0.2, y: 0.25, r: 0.55, color: '#2d6a4f' },
			{ x: 0.8, y: 0.4, r: 0.5, color: '#52b788' },
			{ x: 0.5, y: 0.85, r: 0.55, color: '#1b4332' }
		],
		tone: 'dark'
	},
	{
		id: 'rose-mesh',
		label: 'Rose Mesh',
		base: '#1a0010',
		blobs: [
			{ x: 0.25, y: 0.3, r: 0.55, color: '#ff4d6d' },
			{ x: 0.75, y: 0.6, r: 0.55, color: '#c9184a' },
			{ x: 0.5, y: 0.85, r: 0.5, color: '#590d22' }
		],
		tone: 'dark'
	},
	{
		id: 'royal-mesh',
		label: 'Royal Mesh',
		base: '#10002b',
		blobs: [
			{ x: 0.2, y: 0.2, r: 0.55, color: '#7209b7' },
			{ x: 0.8, y: 0.5, r: 0.5, color: '#3a0ca3' },
			{ x: 0.5, y: 0.85, r: 0.6, color: '#560bad' }
		],
		tone: 'dark'
	},
	// Light mesh
	{
		id: 'pastel-mesh',
		label: 'Pastel Mesh',
		base: '#fef9f9',
		blobs: [
			{ x: 0.2, y: 0.2, r: 0.6, color: '#ffd6e0' },
			{ x: 0.8, y: 0.3, r: 0.55, color: '#c9e4ff' },
			{ x: 0.5, y: 0.85, r: 0.6, color: '#fff5d6' }
		],
		tone: 'light'
	},
	{
		id: 'cloud-mesh',
		label: 'Cloud Mesh',
		base: '#f0f4f8',
		blobs: [
			{ x: 0.25, y: 0.25, r: 0.55, color: '#bde0fe' },
			{ x: 0.75, y: 0.55, r: 0.5, color: '#cdb4db' },
			{ x: 0.5, y: 0.85, r: 0.55, color: '#ffafcc' }
		],
		tone: 'light'
	},
	{
		id: 'sage-mesh',
		label: 'Sage Mesh',
		base: '#f3f7ee',
		blobs: [
			{ x: 0.25, y: 0.3, r: 0.55, color: '#cce3de' },
			{ x: 0.75, y: 0.5, r: 0.5, color: '#a4c3b2' },
			{ x: 0.5, y: 0.85, r: 0.5, color: '#eaf4f4' }
		],
		tone: 'light'
	}
];

// ============================================================
// Solid presets — flat color with depth overlay
// ============================================================

export const SOLIDS = [
	{ id: 'pure-black', label: 'Pure Black', color: '#000000', tone: 'dark' },
	{ id: 'dark-charcoal', label: 'Dark Charcoal', color: '#1a1a1f', tone: 'dark' },
	{ id: 'navy', label: 'Navy', color: '#0a1628', tone: 'dark' },
	{ id: 'forest-green', label: 'Forest Green', color: '#0a2818', tone: 'dark' },
	{ id: 'deep-purple', label: 'Deep Purple', color: '#1a0a28', tone: 'dark' },
	{ id: 'crimson', label: 'Crimson', color: '#2a0a0a', tone: 'dark' },
	{ id: 'slate', label: 'Slate', color: '#2d3748', tone: 'dark' },
	{ id: 'graphite', label: 'Graphite', color: '#1f2937', tone: 'dark' },
	{ id: 'midnight-indigo', label: 'Midnight Indigo', color: '#1a1a40', tone: 'dark' },
	{ id: 'brand-blue', label: 'Brand Blue', color: '#0066ff', tone: 'dark' },
	{ id: 'brand-purple', label: 'Brand Purple', color: '#6610f2', tone: 'dark' },
	{ id: 'brand-orange', label: 'Brand Orange', color: '#ea580c', tone: 'dark' },
	// Light
	{ id: 'pure-white', label: 'Pure White', color: '#ffffff', tone: 'light' },
	{ id: 'cream', label: 'Cream', color: '#faf3e7', tone: 'light' },
	{ id: 'ivory', label: 'Ivory', color: '#fffff0', tone: 'light' },
	{ id: 'soft-gray', label: 'Soft Gray', color: '#f4f6f8', tone: 'light' },
	{ id: 'beige', label: 'Beige', color: '#f5e6d3', tone: 'light' },
	{ id: 'warm-sand', label: 'Warm Sand', color: '#ede7dd', tone: 'light' }
];

// ============================================================
// Pattern overlays — independent of background
// ============================================================

/**
 * Each pattern has a draw function and default opacity.
 * Patterns are tone-aware: they pick light or dark overlay colors based on background tone.
 */
export const PATTERNS = [
	{ id: 'dots', label: 'Dots', draw: drawDots },
	{ id: 'soft-grid', label: 'Soft Grid', draw: drawSoftGrid },
	{ id: 'topography', label: 'Topography', draw: drawTopography },
	{ id: 'bokeh', label: 'Bokeh', draw: drawBokeh, fixedColors: true },
	{ id: 'aurora-streaks', label: 'Aurora Streaks', draw: drawAuroraStreaks, fixedColors: true },
	{ id: 'diagonal-lines', label: 'Diagonal Lines', draw: drawDiagonalLines },
	{ id: 'hex-grid', label: 'Hex Grid', draw: drawHexGrid },
	{ id: 'noise', label: 'Noise', draw: drawNoise },
	{ id: 'circles', label: 'Circles', draw: drawCircles },
	{ id: 'waves', label: 'Waves', draw: drawWaves },
	{ id: 'crosshatch', label: 'Crosshatch', draw: drawCrosshatch },
	{ id: 'geometric', label: 'Geometric', draw: drawGeometric }
];

// ============================================================
// Combined export
// ============================================================

export const ALL_BACKGROUNDS = {
	gradients: GRADIENTS,
	mesh: MESH,
	solids: SOLIDS
};

// ============================================================
// Lookup helpers
// ============================================================

/** Returns a background preset by type and id (gradient | mesh | solid). */
export function getBackgroundById(type, id) {
	switch (type) {
		case 'gradient':
			return GRADIENTS.find((g) => g.id === id);
		case 'mesh':
			return MESH.find((m) => m.id === id);
		case 'solid':
			return SOLIDS.find((s) => s.id === id);
		default:
			return undefined;
	}
}

/** Returns a pattern preset by id. */
export function getPatternById(id) {
	return PATTERNS.find((p) => p.id === id);
}

/** Compute a tone (light | dark) from a hex color using relative luminance. */
export function getColorTone(hex) {
	if (!hex) return 'dark';
	const c = hex.replace('#', '');
	if (c.length !== 6) return 'dark';
	const r = parseInt(c.slice(0, 2), 16) / 255;
	const g = parseInt(c.slice(2, 4), 16) / 255;
	const b = parseInt(c.slice(4, 6), 16) / 255;
	const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
	return luminance > 0.55 ? 'light' : 'dark';
}

/** Returns the tone (light | dark) for a background, defaults to dark. */
export function getBackgroundTone(background) {
	if (background?.type === 'solid' && background.id === 'custom' && background.color) {
		return getColorTone(background.color);
	}
	const preset = getBackgroundById(background?.type, background?.id);
	return preset?.tone ?? 'dark';
}

// ============================================================
// Rendering
// ============================================================

/**
 * Renders the background (color layer only).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 * @param {{ type: string, id: string }} background
 */
export function renderBackground(ctx, w, h, background) {
	// Custom solid color (no preset)
	if (background?.type === 'solid' && background.id === 'custom' && background.color) {
		_renderSolid(ctx, w, h, background.color, getColorTone(background.color));
		return;
	}

	const preset = getBackgroundById(background?.type, background?.id);
	if (!preset) {
		ctx.fillStyle = '#0f0f11';
		ctx.fillRect(0, 0, w, h);
		return;
	}

	switch (background.type) {
		case 'gradient':
			_renderGradient(ctx, w, h, preset.colors, preset.tone);
			break;
		case 'mesh':
			_renderMesh(ctx, w, h, preset);
			break;
		case 'solid':
			_renderSolid(ctx, w, h, preset.color, preset.tone);
			break;
	}
}

/**
 * Renders a pattern overlay on top of an already-drawn background.
 * The pattern picks an overlay color and opacity based on the background tone.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 * @param {{ id: string, opacity?: number, color?: string }} pattern
 * @param {'light' | 'dark'} tone — tone of the background under this pattern
 */
export function renderPattern(ctx, w, h, pattern, tone = 'dark') {
	if (!pattern || !pattern.id) return;
	const preset = getPatternById(pattern.id);
	if (!preset) return;

	if (preset.fixedColors) {
		// Pattern uses its own colors (e.g. bokeh, aurora-streaks)
		preset.draw(ctx, w, h);
		return;
	}

	const color = pattern.color ?? (tone === 'light' ? '#000000' : '#ffffff');
	const opacity = pattern.opacity ?? (tone === 'light' ? 0.06 : 0.08);

	ctx.save();
	ctx.globalAlpha = opacity;
	preset.draw(ctx, w, h, color);
	ctx.globalAlpha = 1;
	ctx.restore();
}

/**
 * Convenience: render background and pattern in one call.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 * @param {{ type: string, id: string }} background
 * @param {{ id: string, opacity?: number, color?: string } | null} pattern
 */
export function renderBackgroundAndPattern(ctx, w, h, background, pattern) {
	renderBackground(ctx, w, h, background);
	if (pattern && pattern.id) {
		const tone = getBackgroundTone(background);
		renderPattern(ctx, w, h, pattern, tone);
	}
}

// ============================================================
// Internal renderers
// ============================================================

function _renderGradient(ctx, w, h, colors, tone) {
	const grd = ctx.createLinearGradient(0, 0, w, h);
	grd.addColorStop(0, colors[0]);
	grd.addColorStop(1, colors[1]);
	ctx.fillStyle = grd;
	ctx.fillRect(0, 0, w, h);

	if (tone === 'dark') {
		_drawRadialOverlay(ctx, w, h);
		_drawFloatingCircles(ctx, w, h);
	} else {
		_drawRadialOverlayLight(ctx, w, h);
	}
}

function _renderMesh(ctx, w, h, preset) {
	ctx.fillStyle = preset.base;
	ctx.fillRect(0, 0, w, h);

	ctx.save();
	ctx.globalCompositeOperation = preset.tone === 'light' ? 'multiply' : 'lighter';
	for (const blob of preset.blobs) {
		const cx = blob.x * w;
		const cy = blob.y * h;
		const radius = blob.r * Math.max(w, h);
		const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
		grd.addColorStop(0, _hexWithAlpha(blob.color, preset.tone === 'light' ? 0.5 : 0.7));
		grd.addColorStop(0.6, _hexWithAlpha(blob.color, preset.tone === 'light' ? 0.2 : 0.3));
		grd.addColorStop(1, _hexWithAlpha(blob.color, 0));
		ctx.fillStyle = grd;
		ctx.fillRect(0, 0, w, h);
	}
	ctx.restore();
}

function _renderSolid(ctx, w, h, color, tone) {
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, w, h);
	if (tone === 'light') {
		_drawRadialOverlayLight(ctx, w, h);
	} else {
		_drawRadialOverlay(ctx, w, h);
	}
}

// ============================================================
// Shared helpers
// ============================================================

function _drawRadialOverlay(ctx, w, h) {
	const rgrd = ctx.createRadialGradient(w * 0.3, h * 0.2, 100, w * 0.5, h * 0.5, h * 0.8);
	rgrd.addColorStop(0, 'rgba(255,255,255,0.08)');
	rgrd.addColorStop(1, 'rgba(0,0,0,0.15)');
	ctx.fillStyle = rgrd;
	ctx.fillRect(0, 0, w, h);
}

function _drawRadialOverlayLight(ctx, w, h) {
	const rgrd = ctx.createRadialGradient(w * 0.3, h * 0.2, 100, w * 0.5, h * 0.5, h * 0.9);
	rgrd.addColorStop(0, 'rgba(255,255,255,0.4)');
	rgrd.addColorStop(1, 'rgba(0,0,0,0.04)');
	ctx.fillStyle = rgrd;
	ctx.fillRect(0, 0, w, h);
}

function _drawFloatingCircles(ctx, w, h) {
	ctx.save();
	ctx.globalAlpha = 0.06;
	ctx.fillStyle = '#fff';
	ctx.beginPath();
	ctx.arc(w * 0.85, h * 0.12, Math.max(w, h) * 0.18, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(w * 0.1, h * 0.8, Math.max(w, h) * 0.15, 0, Math.PI * 2);
	ctx.fill();
	ctx.globalAlpha = 1;
	ctx.restore();
}

function _hexWithAlpha(hex, alpha) {
	const c = hex.replace('#', '');
	const r = parseInt(c.slice(0, 2), 16);
	const g = parseInt(c.slice(2, 4), 16);
	const b = parseInt(c.slice(4, 6), 16);
	return `rgba(${r},${g},${b},${alpha})`;
}

// ============================================================
// Pattern drawing functions
// Each takes (ctx, w, h, color) where color is the overlay color.
// Patterns with fixedColors: true ignore the color param.
// ============================================================

function drawDots(ctx, w, h, color) {
	const spacing = Math.max(w, h) * 0.025;
	const radius = spacing * 0.08;
	ctx.fillStyle = color;
	for (let x = spacing; x < w; x += spacing) {
		for (let y = spacing; y < h; y += spacing) {
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

function drawSoftGrid(ctx, w, h, color) {
	const spacing = Math.max(w, h) * 0.018;
	const radius = Math.max(0.8, spacing * 0.04);
	ctx.fillStyle = color;
	for (let x = spacing; x < w; x += spacing) {
		for (let y = spacing; y < h; y += spacing) {
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

function drawTopography(ctx, w, h, color) {
	ctx.strokeStyle = color;
	ctx.lineWidth = Math.max(1, w * 0.0008);
	let seed = 13;
	function rand() {
		seed = (seed * 16807) % 2147483647;
		return seed / 2147483647;
	}
	for (let i = 0; i < 22; i++) {
		const cx = rand() * w;
		const cy = rand() * h;
		const baseRadius = Math.max(w, h) * (0.1 + rand() * 0.4);
		const wobble = baseRadius * 0.15;
		const segments = 60;
		ctx.beginPath();
		for (let s = 0; s <= segments; s++) {
			const a = (s / segments) * Math.PI * 2;
			const wobbleAmt = Math.sin(a * (2 + Math.floor(rand() * 4))) * wobble;
			const r = baseRadius + wobbleAmt;
			const x = cx + Math.cos(a) * r;
			const y = cy + Math.sin(a) * r;
			if (s === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.closePath();
		ctx.stroke();
	}
}

function drawBokeh(ctx, w, h) {
	const colors = ['#ff6b9d', '#c44569', '#7367f0', '#48dbfb', '#feca57'];
	let seed = 99;
	function rand() {
		seed = (seed * 16807) % 2147483647;
		return seed / 2147483647;
	}
	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	for (let i = 0; i < 18; i++) {
		const cx = rand() * w;
		const cy = rand() * h;
		const r = (0.05 + rand() * 0.15) * Math.max(w, h);
		const color = colors[Math.floor(rand() * colors.length)];
		const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
		grd.addColorStop(0, _hexWithAlpha(color, 0.4));
		grd.addColorStop(1, _hexWithAlpha(color, 0));
		ctx.fillStyle = grd;
		ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
	}
	ctx.restore();
}

function drawAuroraStreaks(ctx, w, h) {
	const streaks = [
		{ color: '#7c3aed', y: 0.2 },
		{ color: '#ec4899', y: 0.5 },
		{ color: '#06b6d4', y: 0.75 }
	];
	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	for (const streak of streaks) {
		ctx.beginPath();
		const yc = streak.y * h;
		const amp = h * 0.05;
		ctx.moveTo(0, yc - amp);
		for (let x = 0; x <= w; x += 8) {
			const y = yc + Math.sin((x / w) * Math.PI * 2.5 + streak.y * 10) * amp;
			ctx.lineTo(x, y);
		}
		ctx.lineTo(w, yc + amp + h * 0.04);
		for (let x = w; x >= 0; x -= 8) {
			const y = yc + Math.sin((x / w) * Math.PI * 2.5 + streak.y * 10) * amp + h * 0.04;
			ctx.lineTo(x, y);
		}
		ctx.closePath();
		const grd = ctx.createLinearGradient(0, yc - amp, w, yc + amp + h * 0.04);
		grd.addColorStop(0, _hexWithAlpha(streak.color, 0));
		grd.addColorStop(0.5, _hexWithAlpha(streak.color, 0.5));
		grd.addColorStop(1, _hexWithAlpha(streak.color, 0));
		ctx.fillStyle = grd;
		ctx.fill();
	}
	ctx.restore();
}

function drawDiagonalLines(ctx, w, h, color) {
	ctx.strokeStyle = color;
	ctx.lineWidth = Math.max(1, w * 0.001);
	const spacing = Math.max(w, h) * 0.025;
	for (let offset = -h; offset < w + h; offset += spacing) {
		ctx.beginPath();
		ctx.moveTo(offset, 0);
		ctx.lineTo(offset + h, h);
		ctx.stroke();
	}
}

function drawHexGrid(ctx, w, h, color) {
	ctx.strokeStyle = color;
	ctx.lineWidth = Math.max(1, w * 0.0009);
	const size = Math.max(w, h) * 0.04;
	const hexHeight = size * Math.sqrt(3);
	const hexWidth = size * 2;
	const horizSpacing = hexWidth * 0.75;
	for (let row = 0; row * hexHeight < h + hexHeight; row++) {
		for (let col = 0; col * horizSpacing < w + hexWidth; col++) {
			const cx = col * horizSpacing;
			const cy = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
			ctx.beginPath();
			for (let i = 0; i < 6; i++) {
				const a = (Math.PI / 3) * i;
				const x = cx + Math.cos(a) * size;
				const y = cy + Math.sin(a) * size;
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.closePath();
			ctx.stroke();
		}
	}
}

function drawNoise(ctx, w, h, color) {
	ctx.fillStyle = color;
	let seed = 7;
	function rand() {
		seed = (seed * 16807) % 2147483647;
		return seed / 2147483647;
	}
	const count = Math.round((w * h) / 800);
	for (let i = 0; i < count; i++) {
		const x = rand() * w;
		const y = rand() * h;
		const s = 1 + rand() * 3;
		ctx.fillRect(x, y, s, s);
	}
}

function drawCircles(ctx, w, h, color) {
	ctx.strokeStyle = color;
	ctx.lineWidth = Math.max(1, w * 0.001);
	const centers = [
		{ x: w * 0.2, y: h * 0.3 },
		{ x: w * 0.7, y: h * 0.15 },
		{ x: w * 0.5, y: h * 0.65 },
		{ x: w * 0.85, y: h * 0.8 }
	];
	const baseR = Math.min(w, h) * 0.04;
	const step = baseR;
	const maxR = Math.max(w, h) * 0.4;
	for (const c of centers) {
		for (let r = baseR; r < maxR; r += step) {
			ctx.beginPath();
			ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
			ctx.stroke();
		}
	}
}

function drawWaves(ctx, w, h, color) {
	ctx.strokeStyle = color;
	ctx.lineWidth = Math.max(1, w * 0.0015);
	const waveHeight = h * 0.018;
	const waveLength = w * 0.12;
	for (let yOffset = h * 0.04; yOffset < h; yOffset += h * 0.05) {
		ctx.beginPath();
		for (let x = 0; x <= w; x += 4) {
			const y = yOffset + Math.sin((x / waveLength) * Math.PI * 2) * waveHeight;
			if (x === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();
	}
}

function drawCrosshatch(ctx, w, h, color) {
	ctx.strokeStyle = color;
	ctx.lineWidth = 1;
	const spacing = Math.max(w, h) * 0.04;
	for (let offset = -h; offset < w + h; offset += spacing) {
		ctx.beginPath();
		ctx.moveTo(offset, 0);
		ctx.lineTo(offset + h, h);
		ctx.stroke();
	}
	for (let offset = -h; offset < w + h; offset += spacing) {
		ctx.beginPath();
		ctx.moveTo(w - offset, 0);
		ctx.lineTo(w - offset - h, h);
		ctx.stroke();
	}
}

function drawGeometric(ctx, w, h, color) {
	ctx.strokeStyle = color;
	ctx.lineWidth = 2;
	let seed = 42;
	function rand() {
		seed = (seed * 16807) % 2147483647;
		return seed / 2147483647;
	}
	for (let i = 0; i < 30; i++) {
		const cx = rand() * w;
		const cy = rand() * h;
		const size = 20 + rand() * 60;
		if (rand() > 0.5) {
			ctx.beginPath();
			ctx.moveTo(cx, cy - size / 2);
			ctx.lineTo(cx - size / 2, cy + size / 2);
			ctx.lineTo(cx + size / 2, cy + size / 2);
			ctx.closePath();
			ctx.stroke();
		} else {
			ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
		}
	}
}

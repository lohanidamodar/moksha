/**
 * Background preset system for Moksha asset generator.
 *
 * Three categories: gradients, solids, patterns.
 * Ported from mockup.html's drawGradient + extended with solids and patterns.
 */

// ============================================================
// Gradient presets
// ============================================================

/** @type {Array<{ id: string, label: string, colors: [string, string] }>} */
export const GRADIENTS = [
	{ id: 'sunset-pink', label: 'Sunset Pink', colors: ['#ff6a00', '#ee0979'] },
	{ id: 'blue-violet', label: 'Blue Violet', colors: ['#4facfe', '#6a11cb'] },
	{ id: 'emerald', label: 'Emerald', colors: ['#11998e', '#38ef7d'] },
	{ id: 'hot-magenta', label: 'Hot Magenta', colors: ['#f953c6', '#b91d73'] },
	{ id: 'ocean', label: 'Ocean', colors: ['#00b4db', '#0083b0'] },
	{ id: 'indigo-dream', label: 'Indigo Dream', colors: ['#4e54c8', '#8f94fb'] },
	{ id: 'amber', label: 'Amber', colors: ['#f7971e', '#ffd200'] },
	{ id: 'dark-teal', label: 'Dark Teal', colors: ['#0f2027', '#2c5364'] },
	{ id: 'red-orange', label: 'Red Orange', colors: ['#ff4e50', '#f9d423'] },
	{ id: 'midnight-blue', label: 'Midnight Blue', colors: ['#020111', '#3a6073'] }
];

// ============================================================
// Solid presets
// ============================================================

/** @type {Array<{ id: string, label: string, color: string }>} */
export const SOLIDS = [
	{ id: 'pure-black', label: 'Pure Black', color: '#000000' },
	{ id: 'dark-charcoal', label: 'Dark Charcoal', color: '#1a1a1f' },
	{ id: 'navy', label: 'Navy', color: '#0a1628' },
	{ id: 'forest-green', label: 'Forest Green', color: '#0a2818' },
	{ id: 'deep-purple', label: 'Deep Purple', color: '#1a0a28' },
	{ id: 'crimson', label: 'Crimson', color: '#2a0a0a' },
	{ id: 'slate', label: 'Slate', color: '#2d3748' },
	{ id: 'white', label: 'White', color: '#f8f8f8' }
];

// ============================================================
// Pattern presets
// ============================================================

/** @type {Array<{ id: string, label: string, baseGradient: [string, string], pattern: string }>} */
export const PATTERNS = [
	{ id: 'dots', label: 'Dots', baseGradient: ['#1a1a2e', '#16213e'], pattern: 'dots' },
	{ id: 'waves', label: 'Waves', baseGradient: ['#0f2027', '#203a43'], pattern: 'waves' },
	{ id: 'mesh', label: 'Mesh', baseGradient: ['#1a1a2e', '#2d1b69'], pattern: 'mesh' },
	{ id: 'geometric', label: 'Geometric', baseGradient: ['#141e30', '#243b55'], pattern: 'geometric' },
	{ id: 'noise', label: 'Noise', baseGradient: ['#232526', '#414345'], pattern: 'noise' },
	{ id: 'circles', label: 'Circles', baseGradient: ['#0c0c1d', '#1a1a3e'], pattern: 'circles' }
];

// ============================================================
// Combined export
// ============================================================

export const ALL_BACKGROUNDS = {
	gradients: GRADIENTS,
	solids: SOLIDS,
	patterns: PATTERNS
};

// ============================================================
// Lookup helper
// ============================================================

/**
 * Returns a preset by type ('gradient' | 'solid' | 'pattern') and id.
 * @param {'gradient' | 'solid' | 'pattern'} type
 * @param {string} id
 * @returns {object | undefined}
 */
export function getBackgroundById(type, id) {
	switch (type) {
		case 'gradient':
			return GRADIENTS.find((g) => g.id === id);
		case 'solid':
			return SOLIDS.find((s) => s.id === id);
		case 'pattern':
			return PATTERNS.find((p) => p.id === id);
		default:
			return undefined;
	}
}

// ============================================================
// Rendering
// ============================================================

/**
 * Renders the matching background onto the given context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w — canvas width
 * @param {number} h — canvas height
 * @param {{ type: 'gradient' | 'solid' | 'pattern', id: string }} background
 */
export function renderBackground(ctx, w, h, background) {
	const preset = getBackgroundById(background.type, background.id);
	if (!preset) {
		// Fallback: plain dark fill
		ctx.fillStyle = '#0f0f11';
		ctx.fillRect(0, 0, w, h);
		return;
	}

	switch (background.type) {
		case 'gradient':
			_renderGradient(ctx, w, h, preset.colors);
			break;
		case 'solid':
			_renderSolid(ctx, w, h, preset.color);
			break;
		case 'pattern':
			_renderPattern(ctx, w, h, preset.baseGradient, preset.pattern);
			break;
	}
}

// ============================================================
// Internal renderers
// ============================================================

/**
 * Gradient renderer — ported directly from mockup.html's drawGradient.
 * Linear gradient + radial overlay for depth + floating circles.
 */
function _renderGradient(ctx, w, h, colors) {
	// Base linear gradient
	const grd = ctx.createLinearGradient(0, 0, w, h);
	grd.addColorStop(0, colors[0]);
	grd.addColorStop(1, colors[1]);
	ctx.fillStyle = grd;
	ctx.fillRect(0, 0, w, h);

	// Radial overlay for depth
	_drawRadialOverlay(ctx, w, h);

	// Floating circles
	_drawFloatingCircles(ctx, w, h);
}

/**
 * Solid renderer — flat fill + subtle radial overlay for depth.
 */
function _renderSolid(ctx, w, h, color) {
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, w, h);

	// Same radial overlay used for gradients, giving solids a bit of depth
	_drawRadialOverlay(ctx, w, h);
}

/**
 * Pattern renderer — gradient base + canvas-drawn pattern at low opacity.
 */
function _renderPattern(ctx, w, h, baseGradient, pattern) {
	// Draw base gradient
	const grd = ctx.createLinearGradient(0, 0, w, h);
	grd.addColorStop(0, baseGradient[0]);
	grd.addColorStop(1, baseGradient[1]);
	ctx.fillStyle = grd;
	ctx.fillRect(0, 0, w, h);

	// Radial overlay
	_drawRadialOverlay(ctx, w, h);

	// Draw pattern at low opacity
	ctx.save();
	ctx.globalAlpha = 0.08;

	switch (pattern) {
		case 'dots':
			_drawDots(ctx, w, h);
			break;
		case 'waves':
			_drawWaves(ctx, w, h);
			break;
		case 'mesh':
			_drawMesh(ctx, w, h);
			break;
		case 'geometric':
			_drawGeometric(ctx, w, h);
			break;
		case 'noise':
			_drawNoise(ctx, w, h);
			break;
		case 'circles':
			_drawCircles(ctx, w, h);
			break;
	}

	ctx.globalAlpha = 1;
	ctx.restore();
}

// ============================================================
// Shared overlay helpers (ported from mockup.html)
// ============================================================

function _drawRadialOverlay(ctx, w, h) {
	const rgrd = ctx.createRadialGradient(w * 0.3, h * 0.2, 100, w * 0.5, h * 0.5, h * 0.8);
	rgrd.addColorStop(0, 'rgba(255,255,255,0.08)');
	rgrd.addColorStop(1, 'rgba(0,0,0,0.15)');
	ctx.fillStyle = rgrd;
	ctx.fillRect(0, 0, w, h);
}

function _drawFloatingCircles(ctx, w, h) {
	ctx.save();
	ctx.globalAlpha = 0.06;
	ctx.fillStyle = '#fff';
	ctx.beginPath();
	ctx.arc(w * 0.85, h * 0.12, 300, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(w * 0.1, h * 0.8, 250, 0, Math.PI * 2);
	ctx.fill();
	ctx.globalAlpha = 1;
	ctx.restore();
}

// ============================================================
// Pattern drawing functions
// ============================================================

/** Grid of small dots */
function _drawDots(ctx, w, h) {
	const spacing = 40;
	const radius = 3;
	ctx.fillStyle = '#ffffff';
	for (let x = spacing; x < w; x += spacing) {
		for (let y = spacing; y < h; y += spacing) {
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

/** Horizontal sine waves */
function _drawWaves(ctx, w, h) {
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 2;
	const waveHeight = 30;
	const waveLength = 120;
	for (let yOffset = 60; yOffset < h; yOffset += 80) {
		ctx.beginPath();
		for (let x = 0; x <= w; x += 4) {
			const y = yOffset + Math.sin((x / waveLength) * Math.PI * 2) * waveHeight;
			if (x === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();
	}
}

/** Diagonal crosshatch mesh */
function _drawMesh(ctx, w, h) {
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 1;
	const spacing = 60;
	// Diagonal lines (top-left to bottom-right)
	for (let offset = -h; offset < w + h; offset += spacing) {
		ctx.beginPath();
		ctx.moveTo(offset, 0);
		ctx.lineTo(offset + h, h);
		ctx.stroke();
	}
	// Diagonal lines (top-right to bottom-left)
	for (let offset = -h; offset < w + h; offset += spacing) {
		ctx.beginPath();
		ctx.moveTo(w - offset, 0);
		ctx.lineTo(w - offset - h, h);
		ctx.stroke();
	}
}

/** Scattered triangles and rectangles */
function _drawGeometric(ctx, w, h) {
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 2;

	// Seeded pseudo-random for deterministic output
	let seed = 42;
	function rand() {
		seed = (seed * 16807 + 0) % 2147483647;
		return seed / 2147483647;
	}

	for (let i = 0; i < 30; i++) {
		const cx = rand() * w;
		const cy = rand() * h;
		const size = 20 + rand() * 60;

		if (rand() > 0.5) {
			// Triangle
			ctx.beginPath();
			ctx.moveTo(cx, cy - size / 2);
			ctx.lineTo(cx - size / 2, cy + size / 2);
			ctx.lineTo(cx + size / 2, cy + size / 2);
			ctx.closePath();
			ctx.stroke();
		} else {
			// Rectangle
			ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
		}
	}
}

/** Random noise speckle */
function _drawNoise(ctx, w, h) {
	ctx.fillStyle = '#ffffff';
	// Seeded pseudo-random for deterministic output
	let seed = 7;
	function rand() {
		seed = (seed * 16807 + 0) % 2147483647;
		return seed / 2147483647;
	}

	for (let i = 0; i < 3000; i++) {
		const x = rand() * w;
		const y = rand() * h;
		const s = 1 + rand() * 3;
		ctx.fillRect(x, y, s, s);
	}
}

/** Concentric circles from fixed centers */
function _drawCircles(ctx, w, h) {
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 1.5;

	const centers = [
		{ x: w * 0.2, y: h * 0.3 },
		{ x: w * 0.7, y: h * 0.15 },
		{ x: w * 0.5, y: h * 0.65 },
		{ x: w * 0.85, y: h * 0.8 }
	];

	for (const c of centers) {
		for (let r = 40; r < 400; r += 50) {
			ctx.beginPath();
			ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
			ctx.stroke();
		}
	}
}

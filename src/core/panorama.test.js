import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compositionConfig, tileRect, resolveSpan, tileNames } from './panorama.js';
import { getLayout, layoutSpan, SPANNING_LAYOUTS } from './assets/_screenshot-shared.js';

test('a single tile is left exactly as it was', () => {
	const config = { textOverlays: [{ text: 'Hi', fontSize: 0.07 }] };
	assert.equal(compositionConfig(config, 1), config);
});

test('type is scaled down so copy matches the tile beside it', () => {
	// fontSize is a fraction of canvas width, and the composition canvas is
	// `span` times wider — untouched, the copy would come out span times bigger.
	const { textOverlays, span } = compositionConfig(
		{ textOverlays: [{ text: 'Hi', fontSize: 0.08 }, { text: 'No size' }] },
		2
	);
	assert.equal(textOverlays[0].fontSize, 0.04);
	assert.equal(textOverlays[1].fontSize, 0.03); // the 0.06 default, halved
	assert.equal(span, 2);
});

test('tiles cover the composition edge to edge, with no gap or overlap', () => {
	const span = 3;
	let x = 0;
	for (let i = 0; i < span; i++) {
		const rect = tileRect(i, span, 1080, 1920);
		assert.equal(rect.sx, x, `tile ${i} does not start where the last ended`);
		assert.equal(rect.sw, 1080);
		assert.equal(rect.sh, 1920);
		x += rect.sw;
	}
	assert.equal(x, 1080 * span);
});

test('span comes from the asset, else the layout, and is clamped', () => {
	assert.equal(resolveSpan(undefined, 2), 2);
	assert.equal(resolveSpan(3, 2), 3);
	assert.equal(resolveSpan(undefined, undefined), 1);
	// A typo should not try to allocate a canvas a hundred tiles wide.
	assert.equal(resolveSpan(100, 1), 5);
	assert.equal(resolveSpan(0, 1), 1);
	assert.equal(resolveSpan('nonsense', 1), 1);
});

test('one tile keeps the asset id; several are numbered in store order', () => {
	assert.deepEqual(tileNames('home', 1), ['home']);
	assert.deepEqual(tileNames('home', 3), ['home-1', 'home-2', 'home-3']);
});

test('the spanning layouts declare a span, and the others do not', () => {
	assert.ok(SPANNING_LAYOUTS.has('panorama'));
	assert.equal(layoutSpan('panorama'), 2);
	assert.equal(layoutSpan('tilt-right'), 1);
});

test('the device keeps a device shape however wide the strip', () => {
	// The bug this guards: taking the aspect from the composition canvas turned
	// a 2-tile iPhone panorama into a nearly square slab.
	const tile = getLayout('hero-center', 1320, 2868, 1);
	const pano = getLayout('panorama', 1320 * 2, 2868, 2);

	const aspect = (p) => p.h / p.w;
	assert.ok(
		Math.abs(aspect(tile.phone) - aspect(pano.phone)) < 0.01,
		`tile ${aspect(tile.phone).toFixed(3)} vs panorama ${aspect(pano.phone).toFixed(3)}`
	);
});

test('a panorama device is wider than a tile, which is the point of spanning', () => {
	const { phone } = getLayout('panorama', 1320 * 2, 2868, 2);
	assert.ok(phone.w > 0 && phone.h > 0);
	// It has to cross the seam to read as one image.
	assert.ok(phone.x - phone.w / 2 < 1320 && phone.x + phone.w / 2 > 1320,
		'the device does not cross the seam');
});

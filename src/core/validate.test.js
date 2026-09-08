import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateStoreAsset, APPLE_SCREENSHOT_SIZES } from './validate.js';

const ok = (asset) => validateStoreAsset(asset).length === 0;
const messages = (asset) => validateStoreAsset(asset).map((p) => p.message).join(' ');

test('an alpha channel is rejected for every real store asset', () => {
	for (const storeKind of ['screenshot', 'feature-graphic', 'icon']) {
		const problems = validateStoreAsset({
			width: 1024, height: storeKind === 'feature-graphic' ? 500 : 1024,
			platform: 'android', hasAlpha: true, storeKind
		});
		assert.ok(problems.some((p) => /alpha/.test(p.message)), `${storeKind} allowed alpha`);
	}
});

test("Play refuses a phone capture at its own native resolution", () => {
	// 1080x2400 is exactly what a modern Android phone produces, and it is
	// 2.22:1, which is the whole reason raw captures cannot be uploaded.
	assert.match(
		messages({ width: 1080, height: 2400, platform: 'android', hasAlpha: false, storeKind: 'screenshot' }),
		/at most twice the short side/
	);
});

test('Play accepts the 9:16 size Moksha renders', () => {
	assert.ok(ok({ width: 1080, height: 1920, platform: 'android', hasAlpha: false, storeKind: 'screenshot' }));
});

test('Play rejects a side outside its range', () => {
	assert.match(
		messages({ width: 200, height: 300, platform: 'android', hasAlpha: false, storeKind: 'screenshot' }),
		/between 320px and 3840px/
	);
});

test('every size in the Apple table validates, in both orientations', () => {
	for (const [w, h] of APPLE_SCREENSHOT_SIZES) {
		assert.ok(ok({ width: w, height: h, platform: 'ios', hasAlpha: false, storeKind: 'screenshot' }), `${w}x${h}`);
		assert.ok(ok({ width: h, height: w, platform: 'ios', hasAlpha: false, storeKind: 'screenshot' }), `${h}x${w}`);
	}
});

test('Apple rejects a size it does not list', () => {
	assert.match(
		messages({ width: 1080, height: 1920, platform: 'ios', hasAlpha: false, storeKind: 'screenshot' }),
		/not a size App Store Connect accepts/
	);
});

test('a 1024x500 feature graphic passes, despite being 2.05:1', () => {
	// The screenshot aspect limit would reject the one size Play demands here,
	// which is why the rules are keyed on what the asset is.
	assert.ok(ok({ width: 1024, height: 500, platform: 'android', hasAlpha: false, storeKind: 'feature-graphic' }));
});

test('a feature graphic at any other size is rejected', () => {
	assert.match(
		messages({ width: 1024, height: 512, platform: 'android', hasAlpha: false, storeKind: 'feature-graphic' }),
		/must be exactly 1024x500/
	);
});

test('an app icon must be square', () => {
	assert.ok(ok({ width: 512, height: 512, platform: 'general', hasAlpha: false, storeKind: 'icon' }));
	assert.match(
		messages({ width: 512, height: 500, platform: 'general', hasAlpha: false, storeKind: 'icon' }),
		/must be square/
	);
});

test('an asset with no store to answer to is not measured against one', () => {
	// A social card is 1200x630 (1.90:1) and belongs to no store.
	assert.ok(ok({ width: 1200, height: 630, platform: 'web', hasAlpha: true, storeKind: 'none' }));
});

test('storeKind defaults to none rather than guessing a rule', () => {
	assert.ok(ok({ width: 999, height: 1, platform: 'android', hasAlpha: false }));
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerFont, findMissingGlyphs } from './fonts.js';

const NEPALI = String.fromCodePoint(0x092b, 0x0947, 0x0915, 0x20, 0x0910, 0x092a);

/** These cases need a real typeface; without one there is nothing to measure. */
async function typeface(family) {
	const result = await registerFont(family);
	return result.registered ? family : null;
}

test('a Latin font covers Latin and not Devanagari', async (t) => {
	const family = await typeface('Montserrat');
	if (!family) return t.skip('Montserrat unavailable (no network, cold cache)');

	assert.deepEqual(findMissingGlyphs(family, 'Fake App'), []);
	// The exact failure that shipped boxes: registration succeeded, coverage
	// did not, and every dimension check passed.
	assert.equal(findMissingGlyphs(family, NEPALI).length, 5);
});

test('a Devanagari font covers both scripts', async (t) => {
	const family = await typeface('Noto Sans Devanagari');
	if (!family) return t.skip('Noto Sans Devanagari unavailable (no network, cold cache)');

	assert.deepEqual(findMissingGlyphs(family, NEPALI), []);
});

test('whitespace and empty text are never missing glyphs', async (t) => {
	const family = await typeface('Montserrat');
	if (!family) return t.skip('Montserrat unavailable');

	assert.deepEqual(findMissingGlyphs(family, '   \n\t'), []);
	assert.deepEqual(findMissingGlyphs(family, ''), []);
});

test('a family that never registered reports nothing rather than everything', async () => {
	// Its .notdef is whatever the fallback draws, so there is no box shape to
	// compare against. The unregistered family is already reported separately.
	assert.deepEqual(findMissingGlyphs('Definitely Not A Font 9x', 'abc'), []);
});

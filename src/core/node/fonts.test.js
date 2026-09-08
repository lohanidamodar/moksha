import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Each case gets its own cache, and its own module instance to clear the memo. */
async function withCache(fn) {
	const dir = mkdtempSync(join(tmpdir(), 'moksha-fonts-'));
	process.env.MOKSHA_FONT_CACHE = dir;
	const mod = await import(`./fonts.js?cache=${encodeURIComponent(dir)}`);
	return fn(mod, dir);
}

test('the cache location follows MOKSHA_FONT_CACHE', async () => {
	await withCache(({ fontCacheDir }, dir) => assert.equal(fontCacheDir(), dir));
});

test('a family that cannot be fetched is reported, not thrown', async () => {
	// Holds whether the failure is Google's 400 or no network at all, which is
	// the point: the caller always learns the font did not take.
	await withCache(async ({ registerFont }) => {
		const result = await registerFont('Definitely Not A Font 9x');
		assert.equal(result.registered, false);
		assert.ok(result.reason, 'no reason given for the failure');
	});
});

test('registerFonts returns only the families that failed', async () => {
	await withCache(async ({ registerFonts }) => {
		const failures = await registerFonts(['Definitely Not A Font 9x', 'Definitely Not A Font 9x']);
		// Deduplicated, and attempted once.
		assert.equal(failures.length, 1);
		assert.equal(failures[0].family, 'Definitely Not A Font 9x');
	});
});

test('a warm cache registers with no network', async () => {
	await withCache(async ({ registerFont }, dir) => {
		// A file the loader will try and fail to parse: enough to prove the disk
		// path is taken rather than a fetch, without needing a real typeface.
		mkdirSync(join(dir, 'Fake Family'), { recursive: true });
		writeFileSync(join(dir, 'Fake Family', '000.ttf'), Buffer.from('not a font'));
		const result = await registerFont('Fake Family');
		assert.equal(result.fromCache, true, 'went to the network despite a cached face');
	});
});

test('a family with no faces asked for is not a failure', async () => {
	await withCache(async ({ registerFonts }) => {
		assert.deepEqual(await registerFonts([]), []);
	});
});

test('the bundled families are what the package ships', async () => {
	await withCache(({ bundledFamilies }) => {
		const families = bundledFamilies();
		// Inter is the renderer's fallback and Montserrat the studio's default,
		// so a package missing either renders its own defaults over the network.
		assert.ok(families.includes('Inter'), families.join(', '));
		assert.ok(families.includes('Montserrat'), families.join(', '));
		// Devanagari has to be here: it is the script the fetched defaults cannot
		// draw, and the reason a Nepali listing shipped boxes.
		assert.ok(families.includes('Noto Sans Devanagari'), families.join(', '));
	});
});

test('a bundled family registers with no cache and no network', async () => {
	await withCache(async ({ registerFont }) => {
		const result = await registerFont('Inter');
		assert.equal(result.registered, true);
		assert.equal(result.bundled, true);
		assert.equal(result.fromCache, false);
		assert.ok(result.faces > 0);
	});
});

test('a bundled Devanagari family actually covers the script', async () => {
	await withCache(async ({ registerFont, findMissingGlyphs }) => {
		await registerFont('Noto Sans Devanagari');
		const nepali = String.fromCodePoint(0x092b, 0x0947, 0x0915);
		assert.deepEqual(findMissingGlyphs('Noto Sans Devanagari', nepali), []);
	});
});

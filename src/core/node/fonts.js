/**
 * Font registration for the node renderer, with an on-disk cache.
 *
 * Fetching from Google Fonts on every render made offline and CI renders
 * fail in the worst possible way: a family that does not register does not
 * throw, it silently falls back, and the only symptom is boxes in a finished
 * asset that no exit code caught. So faces are cached on disk after the first
 * fetch, and a family that still fails to register is reported to the caller
 * rather than warned about on a console nobody reads.
 *
 * Set MOKSHA_FONT_CACHE to move the cache; it defaults under the user's cache
 * directory so a warm machine renders with no network at all.
 */
import { mkdirSync, readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { GlobalFonts } from '@napi-rs/canvas';

/** Registered this process, so a batch of assets fetches each family once. */
const attempted = new Map();

function cacheRoot() {
	if (process.env.MOKSHA_FONT_CACHE) return process.env.MOKSHA_FONT_CACHE;
	const home = homedir();
	if (!home) return join(tmpdir(), 'moksha-fonts');
	return process.platform === 'darwin'
		? join(home, 'Library', 'Caches', 'moksha', 'fonts')
		: join(process.env.XDG_CACHE_HOME || join(home, '.cache'), 'moksha', 'fonts');
}

/** One directory a family, so a partially-downloaded family is visible as such. */
function familyDir(family) {
	return join(cacheRoot(), family.replace(/[^A-Za-z0-9 _-]/g, '_'));
}

function registerFromDisk(family) {
	const dir = familyDir(family);
	if (!existsSync(dir)) return 0;
	let faces = 0;
	for (const name of readdirSync(dir)) {
		if (!/\.(ttf|otf|woff2)$/i.test(name)) continue;
		GlobalFonts.register(readFileSync(join(dir, name)), family);
		faces++;
	}
	return faces;
}

/** Downloads every face of [family] into the cache. Registration is a separate
 * step, so a cold fetch and a warm start register through the same code. */
async function downloadFaces(family) {
	const encoded = family.replace(/ /g, '+');
	const cssUrl = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700;800;900&display=swap`;

	const cssRes = await fetch(cssUrl, {
		headers: { 'User-Agent': 'Mozilla/5.0' } // Google Fonts requires a browser UA
	});
	if (!cssRes.ok) throw new Error(`Google Fonts returned ${cssRes.status} for "${family}"`);
	const css = await cssRes.text();

	// Google serves woff2 to browsers it recognises and ttf otherwise, and which
	// one you get depends on the User-Agent above. Matching only woff2 meant
	// scripts like Devanagari registered nothing at all and rendered as boxes.
	const urls = [
		...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+\.(?:woff2|ttf|otf))\)/g)
	].map((m) => m[1]);

	const dir = familyDir(family);
	mkdirSync(dir, { recursive: true });

	// Every face, not just the first. A family is split across unicode-range
	// subsets, and the first is usually Latin — so keeping one face gives a font
	// that renders English and nothing else.
	let faces = 0;
	for (const [index, url] of urls.entries()) {
		const res = await fetch(url);
		if (!res.ok) continue;
		const bytes = Buffer.from(await res.arrayBuffer());
		const ext = url.match(/\.(woff2|ttf|otf)$/i)[1].toLowerCase();
		writeFileSync(join(dir, `${String(index).padStart(3, '0')}.${ext}`), bytes);
		faces++;
	}
	return faces;
}

/**
 * Make [family] available to the renderer, from cache if possible.
 *
 * Never throws: a font problem should be reported alongside the asset it
 * affects, not abort a batch halfway through.
 *
 * @param {string} family
 * @returns {Promise<{family: string, registered: boolean, faces: number,
 *                    fromCache: boolean, reason?: string}>}
 */
export async function registerFont(family) {
	if (attempted.has(family)) return attempted.get(family);

	const result = { family, registered: false, faces: 0, fromCache: false };
	try {
		result.faces = registerFromDisk(family);
		result.fromCache = result.faces > 0;
		if (result.faces === 0) {
			await downloadFaces(family);
			result.faces = registerFromDisk(family);
		}

		// Verify rather than assume. GlobalFonts.register does not report a
		// family that failed to take, and the only symptom is boxes.
		result.registered = GlobalFonts.has(family);
		if (!result.registered) {
			result.reason = `${result.faces} face(s) loaded but the family did not register`;
		}
	} catch (e) {
		result.reason = e instanceof Error ? e.message : String(e);
	}

	attempted.set(family, result);
	return result;
}

/** Registers every family, and reports the ones that did not take. */
export async function registerFonts(families) {
	const results = await Promise.all([...new Set(families)].map(registerFont));
	return results.filter((r) => !r.registered);
}

/** Where faces are cached, for `moksha doctor` to report. */
export const fontCacheDir = cacheRoot;

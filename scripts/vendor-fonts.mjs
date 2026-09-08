#!/usr/bin/env node
/**
 * Download the bundled typefaces into assets/fonts/.
 *
 * Run when the bundled set changes, not on install: the files are committed so
 * a fresh clone renders its defaults with no network at all. Every family here
 * must be SIL Open Font License, since the package redistributes it.
 *
 *   node scripts/vendor-fonts.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'fonts');

/**
 * The families worth shipping: the two the studio and renderer default to, a
 * Devanagari face because Montserrat has none and a Nepali listing is a normal
 * thing to want here, and two display faces that make a first render not look
 * like a default.
 */
const FAMILIES = [
	{ family: 'Inter', weights: [400, 700, 800] },
	{ family: 'Montserrat', weights: [400, 700, 800] },
	{ family: 'Noto Sans Devanagari', weights: [400, 700] },
	{ family: 'Lato', weights: [400, 700] },
	{ family: 'Bebas Neue', weights: [400] }
];

/**
 * A User-Agent Google does not recognise, which is what makes it serve one
 * complete TTF per weight instead of a pile of woff2 unicode-range subsets.
 */
const TTF_UA = 'Mozilla/4.0';

async function faceUrls(family, weights) {
	const url =
		`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}` +
		`:wght@${weights.join(';')}&display=swap`;
	const res = await fetch(url, { headers: { 'User-Agent': TTF_UA } });
	if (!res.ok) throw new Error(`Google Fonts returned ${res.status} for ${family}`);
	const css = await res.text();

	// Weight and url come from the same @font-face block, so pair them up
	// rather than assuming the order matches the request.
	const faces = [];
	for (const block of css.split('@font-face')) {
		const weight = block.match(/font-weight:\s*(\d+)/)?.[1];
		const href = block.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/)?.[1];
		if (weight && href) faces.push({ weight: Number(weight), href });
	}
	return faces;
}

function slug(family) {
	return family.replace(/\s+/g, '');
}

const attribution = ['# Bundled fonts', '', 'All under the SIL Open Font License 1.1.', ''];

mkdirSync(OUT, { recursive: true });

for (const { family, weights } of FAMILIES) {
	const faces = await faceUrls(family, weights);
	if (!faces.length) throw new Error(`No faces found for ${family}`);

	const written = [];
	for (const { weight, href } of faces) {
		const res = await fetch(href);
		if (!res.ok) throw new Error(`${href} returned ${res.status}`);
		const extension = href.match(/\.(ttf|otf|woff2)(?:\?|$)/i)?.[1]?.toLowerCase() ?? 'ttf';
		const name = `${slug(family)}-${weight}.${extension}`;
		writeFileSync(join(OUT, name), Buffer.from(await res.arrayBuffer()));
		written.push(name);
	}

	console.log(`${family}: ${written.join(', ')}`);
	attribution.push(
		`- **${family}** — https://fonts.google.com/specimen/${family.replace(/ /g, '+')}`,
		`  Files: ${written.join(', ')}`,
		''
	);
}

attribution.push(
	'The full licence text is at https://openfontlicense.org, and travels with',
	'each family on Google Fonts. These files are redistributed unmodified.',
	''
);
writeFileSync(join(OUT, 'ATTRIBUTION.md'), attribution.join('\n'));
console.log(`\nWrote ${OUT}`);

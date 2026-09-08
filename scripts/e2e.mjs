#!/usr/bin/env node
/**
 * End-to-end check: drive the CLI the way a person does, in a throwaway app
 * repo, and assert on what lands on disk.
 *
 * The unit tests cover the rules; this covers the wiring between them — that
 * `init` writes something `render` can read, that output lands where the
 * README says, that a broken project fails rather than shipping, and that the
 * package would actually contain what it claims.
 *
 *   node scripts/e2e.mjs
 */
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(ROOT, 'src', 'cli.js');

let failures = 0;

function check(label, fn) {
	try {
		fn();
		console.log(`✓ ${label}`);
	} catch (e) {
		failures++;
		console.error(`✗ ${label}\n    ${e instanceof Error ? e.message : e}`);
	}
}

/**
 * Run the CLI in [cwd], returning its output and exit code rather than
 * throwing. Both streams are captured, including on success — several of these
 * checks are about what a *successful* run says, and letting stderr through
 * would bury the report in the output of the runs it is testing.
 */
function moksha(cwd, args) {
	const options = { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] };
	try {
		const out = execFileSync(process.execPath, [CLI, ...args], options);
		return { code: 0, out };
	} catch (e) {
		return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
	}
}

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

/** A stand-in capture at a real phone's resolution. */
function writeCapture(path, width = 1080, height = 2340) {
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = '#1e293b';
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = '#f8fafc';
	ctx.fillRect(width * 0.1, height * 0.1, width * 0.8, height * 0.15);
	writeFileSync(path, canvas.toBuffer('image/png'));
}

const app = mkdtempSync(join(tmpdir(), 'moksha-e2e-'));
console.log(`app repo: ${app}\n`);

// --- init -------------------------------------------------------------------
check('init writes a project', () => {
	const { code } = moksha(app, ['init', 'E2E App']);
	assert(code === 0, 'init failed');
	assert(existsSync(join(app, 'moksha', 'moksha.json')), 'no moksha/moksha.json');
});

check('doctor reports on a fresh project', () => {
	const { out } = moksha(app, ['doctor']);
	assert(/E2E App/.test(out), 'doctor did not name the app');
	assert(/bundled fonts/.test(out), 'doctor did not mention the bundled fonts');
});

check('schema is valid JSON listing every asset type', () => {
	const schema = JSON.parse(moksha(app, ['schema']).out);
	assert(schema.assetTypes.length === 8, `${schema.assetTypes.length} asset types`);
	assert(schema.templates.length > 0, 'no templates in the schema');
	assert(schema.fonts.includes('Noto Sans Devanagari'), 'no Devanagari font offered');
});

check('the scaffold prints Dart the app repo can paste', () => {
	const { out } = moksha(app, ['capture', '--scaffold']);
	assert(/captureScene\(/.test(out), 'no captureScene helper');
	assert(/MOKSHA_CAPTURE_URL/.test(out), 'no handshake url');
	assert(/patrolTest\(/.test(out), 'no patrol test');
});

// --- a real listing ---------------------------------------------------------
mkdirSync(join(app, 'moksha', 'captures'), { recursive: true });
writeCapture(join(app, 'moksha', 'captures', 'home.png'));
writeCapture(join(app, 'moksha', 'captures', 'logo.png'), 512, 512);

const NEPALI = String.fromCodePoint(0x938, 0x92c, 0x948);
writeFileSync(
	join(app, 'moksha', 'moksha.json'),
	`${JSON.stringify(
		{
			version: 1,
			app: { name: 'E2E App' },
			locales: ['en', 'ne'],
			design: {
				background: { type: 'mesh', id: 'aurora' },
				pattern: { id: 'dots' },
				template: 'panoramic',
				font: { en: 'Montserrat', ne: 'Noto Sans Devanagari' }
			},
			assets: [
				{
					id: 'home',
					assetType: 'iphone-screenshot',
					images: { screenshot: 'captures/home.png' },
					text: [{ text: { en: 'Everything here', ne: NEPALI }, anchor: 'top-left', fontSize: 0.06 }]
				},
				{
					id: 'android',
					assetType: 'android-phone-screenshot',
					images: { screenshot: 'captures/home.png' }
				},
				{
					id: 'feature',
					assetType: 'feature-graphic',
					pattern: null,
					images: { logo: 'captures/logo.png' },
					text: [{ text: { en: 'E2E App', ne: NEPALI }, anchor: 'bottom-center', fontSize: 0.1 }]
				}
			]
		},
		null,
		'\t'
	)}\n`
);

check('validate passes a well-formed project', () => {
	const { code, out } = moksha(app, ['validate']);
	assert(code === 0, `validate failed:\n${out}`);
});

check('render produces every asset for every locale, grouped for upload', () => {
	const { code, out } = moksha(app, ['render']);
	assert(code === 0, `render failed:\n${out}`);

	// The panorama template gives the first tile of each strip a two-tile
	// composition, so those assets become two files.
	for (const locale of ['en', 'ne']) {
		for (const path of [
			'ios/screenshots/phone/home-1.png',
			'ios/screenshots/phone/home-2.png',
			'android/screenshots/phone/android-1.png',
			'android/screenshots/phone/android-2.png',
			'android/feature-graphic/feature.png'
		]) {
			const file = join(app, 'moksha', 'out', locale, path);
			assert(existsSync(file), `missing ${locale}/${path}`);
		}
	}
});

check('every rendered asset is a 24-bit PNG, which is what the stores require', () => {
	const files = [
		join(app, 'moksha', 'out', 'en', 'ios', 'screenshots', 'phone', 'home-1.png'),
		join(app, 'moksha', 'out', 'ne', 'android', 'feature-graphic', 'feature.png')
	];
	for (const file of files) {
		const colourType = readFileSync(file)[25];
		assert(colourType === 2, `${file} is colour type ${colourType}, not 2`);
	}
});

check('a font with no glyphs for the script fails the render', () => {
	// The failure that ships a listing full of boxes: Montserrat registers
	// perfectly and has no Devanagari at all.
	const path = join(app, 'moksha', 'moksha.json');
	const project = JSON.parse(readFileSync(path, 'utf8'));
	const good = project.design.font;
	project.design.font = 'Montserrat';
	writeFileSync(path, JSON.stringify(project, null, '\t'));

	const { code, out } = moksha(app, ['render', '--locale', 'ne']);
	assert(code !== 0, 'a listing of boxes was reported as fine');
	assert(/renders as boxes/.test(out), `unexpected failure:\n${out}`);

	project.design.font = good;
	writeFileSync(path, JSON.stringify(project, null, '\t'));
});

check('a broken project is refused rather than half-rendered', () => {
	const path = join(app, 'moksha', 'moksha.json');
	const project = JSON.parse(readFileSync(path, 'utf8'));
	const saved = JSON.stringify(project);
	project.assets.push({ id: 'broken', assetType: 'not-a-type' });
	writeFileSync(path, JSON.stringify(project, null, '\t'));

	const { code, out } = moksha(app, ['render']);
	assert(code !== 0, 'an invalid project rendered anyway');
	assert(/Unknown assetType/.test(out), `unexpected failure:\n${out}`);

	writeFileSync(path, saved);
});

check('capture explains itself when there is no device', () => {
	const { code, out } = moksha(app, ['capture', '--platform', 'ios']);
	assert(code !== 0, 'capture claimed to work with no simulator');
	assert(/macOS host|booted iOS simulator/.test(out), `unhelpful message:\n${out}`);
});

// --- the package ------------------------------------------------------------
check('the published package would contain what it promises', () => {
	const listing = execFileSync('npm', ['pack', '--dry-run', '--json'], {
		cwd: ROOT,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe']
	});
	const files = JSON.parse(listing)[0].files.map((f) => f.path);
	for (const needed of [
		'src/cli.js',
		'assets/fonts/NotoSansDevanagari-400.ttf',
		'skills/moksha/SKILL.md',
		'LICENSE'
	]) {
		assert(files.includes(needed), `${needed} would not ship`);
	}
	// The studio is served by `moksha studio`, so it has to be in the tarball.
	assert(files.some((f) => f.startsWith('build/')), 'the built studio would not ship');
});

rmSync(app, { recursive: true, force: true });
console.log(failures ? `\n${failures} check(s) failed.` : '\nAll end-to-end checks passed.');
process.exit(failures ? 1 : 0);

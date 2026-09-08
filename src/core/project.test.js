import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAssetType } from './assets/index.js';
import { PHONE_FRAMES } from './renderer/phone-frame.js';
import {
	PROJECT_VERSION,
	emptyProject,
	normalizeProject,
	resolveAsset,
	resolveCopy,
	isLocalisedCopy,
	validateProject
} from './project.js';

const registry = { getAssetType, frameIds: new Set(PHONE_FRAMES.map((f) => f.id ?? f)) };
const check = (project) => validateProject(normalizeProject(project), registry);
const errors = (project) => check(project).filter((p) => p.level === 'error');
const messages = (project) => check(project).map((p) => `${p.where}: ${p.message}`).join('\n');

const NEPALI = String.fromCodePoint(0x092b, 0x0947, 0x0915);

test('an empty project is valid apart from having nothing in it', () => {
	const problems = validateProject(emptyProject('App'), registry);
	assert.equal(problems.filter((p) => p.level === 'error').length, 0);
	assert.ok(problems.some((p) => p.where === 'assets'));
});

test('normalising fills defaults and survives a half-written file', () => {
	const project = normalizeProject({ assets: [{ assetType: 'iphone-screenshot' }] });
	assert.equal(project.version, PROJECT_VERSION);
	assert.deepEqual(project.locales, ['en']);
	assert.equal(project.out, 'out');
	// An asset with no id gets a stable one rather than being dropped.
	assert.equal(project.assets[0].id, 'asset-1');
});

test('a project from the future is refused rather than misread', () => {
	assert.match(messages({ version: PROJECT_VERSION + 1 }), /understands up to/);
});

test('resolveCopy takes a plain string, a locale record, or nothing', () => {
	assert.equal(resolveCopy('one language', 'en'), 'one language');
	assert.equal(resolveCopy({ en: 'Hello', ne: NEPALI }, 'ne'), NEPALI);
	assert.equal(resolveCopy(undefined, 'en'), '');
});

test('a missing locale falls back to the first rather than rendering empty', () => {
	// validateProject reports the gap; the fallback keeps it from silently
	// shipping a blank headline in the meantime.
	assert.equal(resolveCopy({ en: 'Hello' }, 'ne'), 'Hello');
});

test('isLocalisedCopy tells a record from a string', () => {
	assert.equal(isLocalisedCopy({ en: 'a' }), true);
	assert.equal(isLocalisedCopy('a'), false);
	assert.equal(isLocalisedCopy(undefined), false);
});

test('an asset inherits the design, and overrides win', () => {
	const project = normalizeProject({
		design: {
			background: { type: 'gradient', id: 'emerald' },
			pattern: { id: 'dots' },
			font: 'Montserrat',
			frames: { 'iphone-screenshot': 'iphone-notch' }
		},
		assets: [
			{ id: 'a', assetType: 'iphone-screenshot', text: [{ text: 'Hi' }] },
			{
				id: 'b',
				assetType: 'iphone-screenshot',
				background: { type: 'solid', id: 'navy' },
				phoneFrame: 'frameless',
				text: [{ text: 'Hi', font: 'Lato' }]
			}
		]
	});
	const module = getAssetType('iphone-screenshot');

	const inherited = resolveAsset(project, project.assets[0], 'en', module);
	assert.deepEqual(inherited.background, { type: 'gradient', id: 'emerald' });
	assert.equal(inherited.phoneFrame, 'iphone-notch');
	assert.equal(inherited.textOverlays[0].font, 'Montserrat');

	const overridden = resolveAsset(project, project.assets[1], 'en', module);
	assert.deepEqual(overridden.background, { type: 'solid', id: 'navy' });
	assert.equal(overridden.phoneFrame, 'frameless');
	assert.equal(overridden.textOverlays[0].font, 'Lato');
});

test('an asset with no frame of its own falls back to the asset type default', () => {
	const project = normalizeProject({ assets: [{ id: 'a', assetType: 'android-phone-screenshot' }] });
	const module = getAssetType('android-phone-screenshot');
	assert.equal(
		resolveAsset(project, project.assets[0], 'en', module).phoneFrame,
		module.defaultPhoneFrame
	);
});

test('pattern null on an asset means no pattern, not "inherit"', () => {
	// The distinction that a plain ?? would lose: a feature graphic wanting a
	// clean background under a project that patterns everything else.
	const project = normalizeProject({
		design: { pattern: { id: 'dots' } },
		assets: [
			{ id: 'plain', assetType: 'feature-graphic', pattern: null },
			{ id: 'inherits', assetType: 'feature-graphic' }
		]
	});
	const module = getAssetType('feature-graphic');
	assert.equal(resolveAsset(project, project.assets[0], 'en', module).pattern, null);
	assert.deepEqual(resolveAsset(project, project.assets[1], 'en', module).pattern, { id: 'dots' });
});

test('the font is chosen per locale, because a script needs a family that covers it', () => {
	const project = normalizeProject({
		locales: ['en', 'ne'],
		design: { font: { en: 'Montserrat', ne: 'Noto Sans Devanagari' } },
		assets: [{ id: 'a', assetType: 'feature-graphic', text: [{ text: { en: 'Hi', ne: NEPALI } }] }]
	});
	const module = getAssetType('feature-graphic');
	assert.equal(resolveAsset(project, project.assets[0], 'en', module).textOverlays[0].font, 'Montserrat');
	assert.equal(
		resolveAsset(project, project.assets[0], 'ne', module).textOverlays[0].font,
		'Noto Sans Devanagari'
	);
});

test('a copy record missing a locale is an error, per field', () => {
	const out = messages({
		locales: ['en', 'ne'],
		assets: [{ id: 'a', assetType: 'feature-graphic', text: [{ text: { en: 'Hi' }, font: { en: 'Lato' } }] }]
	});
	assert.match(out, /assets\.a\.text\[0\]\.text: No "ne" value/);
	assert.match(out, /assets\.a\.text\[0\]\.font: No "ne" value/);
});

test('a project font record missing a locale is an error', () => {
	assert.match(
		messages({ locales: ['en', 'ne'], design: { font: { en: 'Lato' } } }),
		/design\.font: No font for "ne"/
	);
});

test('unknown asset types, sizes and layouts are each reported with the alternatives', () => {
	const out = messages({
		assets: [
			{ id: 'a', assetType: 'nope' },
			{ id: 'b', assetType: 'iphone-screenshot', sizeId: 'ios-99', layout: 'sideways' }
		]
	});
	assert.match(out, /Unknown assetType "nope"/);
	assert.match(out, /"ios-99" is not a size .*ios-6\.9/s);
	assert.match(out, /"sideways" is not a layout .*tilt-right/s);
});

test('duplicate asset ids are reported, since they would overwrite each other', () => {
	assert.match(
		messages({ assets: [{ id: 'same', assetType: 'feature-graphic' }, { id: 'same', assetType: 'feature-graphic' }] }),
		/Duplicate asset id "same"/
	);
});

test('an unknown frame is an error; a mismatched one is only a warning', () => {
	assert.match(
		messages({ assets: [{ id: 'a', assetType: 'iphone-screenshot', phoneFrame: 'not-a-frame' }] }),
		/Unknown phone frame/
	);
	const mismatch = check({
		assets: [{ id: 'a', assetType: 'iphone-screenshot', phoneFrame: 'pixel-black' }]
	}).find((p) => /not one iphone-screenshot is designed for/.test(p.message));
	assert.equal(mismatch.level, 'warning');
});

test('a valid two-locale project has no errors', () => {
	assert.deepEqual(
		errors({
			app: { name: 'App' },
			locales: ['en', 'ne'],
			design: { font: { en: 'Montserrat', ne: 'Noto Sans Devanagari' } },
			assets: [
				{
					id: 'home',
					assetType: 'iphone-screenshot',
					layout: 'tilt-right',
					images: { screenshot: 'captures/home.png' },
					text: [{ text: { en: 'Hi', ne: NEPALI }, anchor: 'top-left' }]
				}
			]
		}),
		[]
	);
});

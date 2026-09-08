import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATES, TEMPLATE_IDS, isTemplateId, templateSequence, templateLayout } from './templates.js';
import { getAssetType } from './assets/index.js';
import { normalizeProject, resolveLayout } from './project.js';

const screenshotLayouts = new Set(getAssetType('iphone-screenshot').layouts.map((l) => l.id));

test('every template names layouts that exist', () => {
	for (const template of Object.values(TEMPLATES)) {
		for (const layout of template.sequence) {
			assert.ok(screenshotLayouts.has(layout), `${template.id} names unknown layout ${layout}`);
		}
	}
});

test('uniform has no sequence, so the project layout decides', () => {
	assert.deepEqual(TEMPLATES.uniform.sequence, []);
	assert.equal(templateLayout('uniform', 0), undefined);
});

test('a sequence shorter than the strip repeats', () => {
	const sequence = templateSequence('editorial');
	assert.equal(templateLayout('editorial', sequence.length), sequence[0]);
	assert.equal(templateLayout('editorial', sequence.length + 2), sequence[2]);
});

test('a project can give its own sequence instead of naming a template', () => {
	assert.deepEqual(templateSequence(['tilt-left', 'hero-center']), ['tilt-left', 'hero-center']);
	assert.equal(templateLayout(['tilt-left', 'hero-center'], 3), 'hero-center');
});

test('isTemplateId knows the built-ins and nothing else', () => {
	for (const id of TEMPLATE_IDS) assert.ok(isTemplateId(id));
	assert.equal(isTemplateId('nope'), false);
});

test('a template gives each asset type its own rhythm, from the start', () => {
	// The iPhone strip and the Android strip are different listings, so the
	// second Android tile is the sequence's second entry, not its fourth.
	const project = normalizeProject({
		design: { template: 'editorial' },
		assets: [
			{ id: 'a', assetType: 'iphone-screenshot' },
			{ id: 'b', assetType: 'iphone-screenshot' },
			{ id: 'c', assetType: 'android-phone-screenshot' },
			{ id: 'd', assetType: 'android-phone-screenshot' }
		]
	});
	const [first, second] = TEMPLATES.editorial.sequence;
	const layoutOf = (id) => {
		const asset = project.assets.find((a) => a.id === id);
		return resolveLayout(project, asset, getAssetType(asset.assetType));
	};
	assert.equal(layoutOf('a'), first);
	assert.equal(layoutOf('b'), second);
	assert.equal(layoutOf('c'), first);
	assert.equal(layoutOf('d'), second);
});

test("an asset's own layout beats the template", () => {
	const project = normalizeProject({
		design: { template: 'editorial' },
		assets: [{ id: 'a', assetType: 'iphone-screenshot', layout: 'perspective' }]
	});
	assert.equal(
		resolveLayout(project, project.assets[0], getAssetType('iphone-screenshot')),
		'perspective'
	);
});

test('a template layout an asset type does not have falls through, rather than rendering nothing', () => {
	// A feature graphic has no "tilt-right"; it should use its own first layout.
	const project = normalizeProject({
		design: { template: 'dynamic' },
		assets: [{ id: 'f', assetType: 'feature-graphic' }]
	});
	const module = getAssetType('feature-graphic');
	assert.equal(resolveLayout(project, project.assets[0], module), module.layouts[0].id);
});

test('with no template, the project layout applies, then the asset type default', () => {
	const withDefault = normalizeProject({
		design: { layout: 'float-up' },
		assets: [{ id: 'a', assetType: 'iphone-screenshot' }]
	});
	assert.equal(
		resolveLayout(withDefault, withDefault.assets[0], getAssetType('iphone-screenshot')),
		'float-up'
	);

	const bare = normalizeProject({ assets: [{ id: 'a', assetType: 'iphone-screenshot' }] });
	assert.equal(
		resolveLayout(bare, bare.assets[0], getAssetType('iphone-screenshot')),
		getAssetType('iphone-screenshot').layouts[0].id
	);
});

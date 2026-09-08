import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findProjectFile, loadProject, saveProject, initProject, displayPath, outputDir } from './project-file.js';
import { emptyProject } from '../project.js';

function repo() {
	const root = mkdtempSync(join(tmpdir(), 'moksha-repo-'));
	mkdirSync(join(root, 'moksha'), { recursive: true });
	mkdirSync(join(root, 'lib', 'src'), { recursive: true });
	return root;
}

test('a project is found from a subdirectory of the app repo', () => {
	const root = repo();
	saveProject(join(root, 'moksha', 'moksha.json'), emptyProject('App'));
	// The point: `moksha render` works from wherever you happen to be in the repo.
	assert.equal(
		findProjectFile({ cwd: join(root, 'lib', 'src'), env: {} }),
		join(root, 'moksha', 'moksha.json')
	);
});

test('a bare moksha.json at the repo root is found too', () => {
	const root = repo();
	saveProject(join(root, 'moksha.json'), emptyProject('App'));
	assert.equal(findProjectFile({ cwd: root, env: {} }), join(root, 'moksha.json'));
});

test('moksha/moksha.json wins over a bare one in the same directory', () => {
	const root = repo();
	saveProject(join(root, 'moksha.json'), emptyProject('bare'));
	saveProject(join(root, 'moksha', 'moksha.json'), emptyProject('nested'));
	assert.equal(findProjectFile({ cwd: root, env: {} }), join(root, 'moksha', 'moksha.json'));
});

test('an explicit path beats the search, and MOKSHA_PROJECT beats the search', () => {
	const root = repo();
	const elsewhere = join(root, 'other.json');
	saveProject(elsewhere, emptyProject('App'));
	assert.equal(findProjectFile({ explicit: elsewhere, cwd: root, env: {} }), elsewhere);
	assert.equal(findProjectFile({ cwd: root, env: { MOKSHA_PROJECT: elsewhere } }), elsewhere);
});

test('no project anywhere is null, not an exception', () => {
	assert.equal(findProjectFile({ cwd: mkdtempSync(join(tmpdir(), 'moksha-empty-')), env: {} }), null);
});

test('a project round-trips through save and load', () => {
	const root = repo();
	const path = join(root, 'moksha', 'moksha.json');
	const project = { ...emptyProject('Round Trip'), locales: ['en', 'ne'] };
	saveProject(path, project);
	const loaded = loadProject(path);
	assert.equal(loaded.project.app.name, 'Round Trip');
	assert.deepEqual(loaded.project.locales, ['en', 'ne']);
	assert.equal(loaded.dir, join(root, 'moksha'));
});

test('a missing image is reported against the asset that names it', () => {
	const root = repo();
	const path = join(root, 'moksha', 'moksha.json');
	saveProject(path, {
		...emptyProject('App'),
		assets: [
			{ id: 'home', assetType: 'iphone-screenshot', images: { screenshot: 'captures/gone.png' } }
		]
	});
	const { problems } = loadProject(path);
	assert.ok(
		problems.some((p) => p.where === 'assets.home.images.screenshot' && /No file at/.test(p.message))
	);
});

test('an image that exists is not reported', () => {
	const root = repo();
	const path = join(root, 'moksha', 'moksha.json');
	mkdirSync(join(root, 'moksha', 'captures'), { recursive: true });
	writeFileSync(join(root, 'moksha', 'captures', 'home.png'), 'not really a png');
	saveProject(path, {
		...emptyProject('App'),
		assets: [
			{ id: 'home', assetType: 'iphone-screenshot', images: { screenshot: 'captures/home.png' } }
		]
	});
	const { problems } = loadProject(path);
	assert.equal(problems.filter((p) => /No file at/.test(p.message)).length, 0);
});

test('unreadable JSON names the file rather than throwing a parser error', () => {
	const root = repo();
	const path = join(root, 'moksha', 'moksha.json');
	writeFileSync(path, '{ not json');
	assert.throws(() => loadProject(path), /is not readable JSON/);
});

test('init refuses to clobber an existing project', () => {
	const root = repo();
	const path = join(root, 'moksha', 'moksha.json');
	initProject(path, 'First');
	assert.throws(() => initProject(path, 'Second'), /already exists/);
	assert.equal(loadProject(path).project.app.name, 'First');
});

test('output is relative to the project file, and overridable', () => {
	const root = repo();
	const dir = join(root, 'moksha');
	assert.equal(outputDir(dir, { out: 'out' }), join(dir, 'out'));
	assert.equal(outputDir(dir, { out: '../build/store' }), join(root, 'build', 'store'));
});

test('displayPath is relative inside the project and absolute outside it', () => {
	const dir = join(tmpdir(), 'proj');
	assert.equal(displayPath(dir, join(dir, 'out', 'a.png')), join('out', 'a.png'));
	assert.equal(displayPath(dir, join(tmpdir(), 'elsewhere.png')), join(tmpdir(), 'elsewhere.png'));
});

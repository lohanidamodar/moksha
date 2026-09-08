/**
 * Reading and writing moksha.json, and resolving the paths inside it.
 *
 * Every path in a project file is relative to the file itself, so a project
 * moves with the repo it belongs to and two people on different machines
 * render the same thing.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve, relative, sep } from 'node:path';
import {
	PROJECT_DIRNAME,
	PROJECT_FILENAME,
	normalizeProject,
	serializeProject,
	validateProject,
	emptyProject
} from '../project.js';
import { assetTypes, getAssetType } from '../assets/index.js';
import { PHONE_FRAMES } from '../renderer/phone-frame.js';

const registry = {
	getAssetType,
	frameIds: new Set(PHONE_FRAMES.map((f) => f.id ?? f))
};

/**
 * Locate a project file, the way a CLI run from an app repo expects.
 *
 * Order: an explicit path, then MOKSHA_PROJECT, then `moksha/moksha.json` and
 * a bare `moksha.json` walking up from [cwd] — so the commands work from a
 * subdirectory of the app repo, not only its root.
 *
 * @param {{explicit?: string, cwd?: string, env?: Record<string, string>}} options
 * @returns {string | null} absolute path, or null when there is no project
 */
export function findProjectFile({ explicit, cwd = process.cwd(), env = process.env } = {}) {
	if (explicit) return resolve(cwd, explicit);
	if (env.MOKSHA_PROJECT) return resolve(cwd, env.MOKSHA_PROJECT);

	let dir = resolve(cwd);
	for (;;) {
		for (const candidate of [join(dir, PROJECT_DIRNAME, PROJECT_FILENAME), join(dir, PROJECT_FILENAME)]) {
			if (existsSync(candidate)) return candidate;
		}
		const parent = dirname(dir);
		if (parent === dir) return null;
		dir = parent;
	}
}

/**
 * Load, normalise and check a project file.
 *
 * @param {string} path
 * @returns {{path: string, dir: string, project: object,
 *            problems: {level: string, where: string, message: string}[]}}
 */
export function loadProject(path) {
	const absolute = resolve(path);
	let raw;
	try {
		raw = JSON.parse(readFileSync(absolute, 'utf8'));
	} catch (e) {
		throw new Error(`${absolute} is not readable JSON: ${e instanceof Error ? e.message : e}`);
	}

	const project = normalizeProject(raw);
	const dir = dirname(absolute);
	const problems = [
		...validateProject(project, registry),
		// Only the node layer can check these, so they are added rather than
		// duplicated into the pure validator.
		...missingImages(project, dir)
	];

	return { path: absolute, dir, project, problems };
}

function missingImages(project, dir) {
	const problems = [];
	for (const asset of project.assets) {
		for (const [input, value] of Object.entries(asset.images ?? {})) {
			if (!value) continue;
			if (!existsSync(imagePath(dir, value))) {
				problems.push({
					level: 'error',
					where: `assets.${asset.id}.images.${input}`,
					message: `No file at "${value}".`
				});
			}
		}
	}
	return problems;
}

/** Resolve an image reference against the project directory. */
export function imagePath(projectDir, reference) {
	return isAbsolute(reference) ? reference : resolve(projectDir, reference);
}

/** Where rendered assets go. */
export function outputDir(projectDir, project) {
	return imagePath(projectDir, project.out ?? 'out');
}

/**
 * Write a project file, formatted the way a human would want to read the diff.
 *
 * @param {string} path
 * @param {object} project
 */
export function saveProject(path, project) {
	const absolute = resolve(path);
	mkdirSync(dirname(absolute), { recursive: true });
	writeFileSync(absolute, `${JSON.stringify(serializeProject(project), null, '\t')}\n`);
	return absolute;
}

/** Create a project file for an app, refusing to clobber one that exists. */
export function initProject(path, appName) {
	const absolute = resolve(path);
	if (existsSync(absolute)) throw new Error(`${absolute} already exists.`);
	return saveProject(absolute, emptyProject(appName));
}

/**
 * A path to show a user: relative when it is inside the project, absolute when
 * it is somewhere else entirely.
 */
export function displayPath(projectDir, target) {
	const rel = relative(projectDir, target);
	return rel && !rel.startsWith(`..${sep}`) && rel !== '..' ? rel : target;
}

/** Every asset type, as the schema output and the studio both need it. */
export function assetSchema() {
	return assetTypes.map((a) => ({
		id: a.id,
		label: a.label,
		platform: a.platform ?? null,
		sizes: a.sizes,
		layouts: a.layouts.map((l) => l.id),
		inputs: (a.inputs ?? []).map((i) => i.id),
		defaultPhoneFrame: a.defaultPhoneFrame ?? null,
		allowedPhoneFrames: a.allowedPhoneFrames ?? null
	}));
}

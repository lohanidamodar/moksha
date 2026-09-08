/**
 * `moksha doctor` — say what is wrong before a render wastes time proving it.
 *
 * Borrowed in spirit from goldie's doctor: every check names the fix, and the
 * exit code is the answer to "can I render right now".
 */
import { existsSync, readdirSync, accessSync, constants } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findProjectFile, loadProject, outputDir, displayPath } from '../core/node/project-file.js';
import { fontCacheDir, bundledFamilies } from '../core/node/fonts.js';
import { PROJECT_DIRNAME, PROJECT_FILENAME } from '../core/project.js';

const MIN_NODE_MAJOR = 20;

export async function doctor({ flags }) {
	const checks = [];
	const add = (ok, label, detail) => checks.push({ ok, label, detail });

	// The toolchain, which is the same for every project.
	const major = Number(process.versions.node.split('.')[0]);
	add(
		major >= MIN_NODE_MAJOR,
		`node ${process.versions.node}`,
		major >= MIN_NODE_MAJOR ? '' : `Moksha needs node ${MIN_NODE_MAJOR} or newer.`
	);

	try {
		const { createCanvas } = await import('@napi-rs/canvas');
		createCanvas(1, 1).getContext('2d');
		add(true, 'renderer (@napi-rs/canvas)', '');
	} catch (e) {
		add(false, 'renderer (@napi-rs/canvas)', `Failed to load: ${e instanceof Error ? e.message : e}`);
	}

	const bundled = bundledFamilies();
	add(
		bundled.length > 0,
		`bundled fonts  ${bundled.length}`,
		bundled.length
			? `${bundled.join(', ')} — these render with no network`
			: 'None bundled. Run `npm run vendor:fonts` in a checkout.'
	);

	const cache = fontCacheDir();
	const cachedFamilies = existsSync(cache) ? readdirSync(cache).length : 0;
	add(
		true,
		`font cache  ${cache}`,
		cachedFamilies
			? `${cachedFamilies} further family(ies) cached`
			: 'empty; any font beyond the bundled ones is fetched once and cached'
	);

	const studioEntry = fileURLToPath(new URL('../../build/index.js', import.meta.url));
	add(
		existsSync(studioEntry),
		'studio build',
		existsSync(studioEntry) ? '' : 'Missing. Run `npm run build` to use `moksha studio`.'
	);

	// The project, if there is one.
	const projectPath = findProjectFile({
		explicit: typeof flags.project === 'string' ? flags.project : undefined
	});

	if (!projectPath) {
		add(
			false,
			'project',
			`No ${PROJECT_FILENAME} here or above. Run \`moksha init <app name>\` to create ` +
				`${PROJECT_DIRNAME}/${PROJECT_FILENAME}.`
		);
		return report(checks);
	}

	let loaded;
	try {
		loaded = loadProject(projectPath);
	} catch (e) {
		add(false, `project  ${projectPath}`, e instanceof Error ? e.message : String(e));
		return report(checks);
	}

	const { dir, project, problems } = loaded;
	add(
		true,
		`project  ${displayPath(process.cwd(), projectPath)}`,
		`${project.app?.name || '(unnamed)'} — ${project.assets.length} asset(s), ` +
			`locales: ${project.locales.join(', ')}`
	);

	const errors = problems.filter((p) => p.level === 'error');
	const warnings = problems.filter((p) => p.level === 'warning');
	add(
		errors.length === 0,
		'project contents',
		[
			...errors.map((p) => `✗ ${p.where}: ${p.message}`),
			...warnings.map((p) => `! ${p.where}: ${p.message}`)
		].join('\n      ') || 'every asset resolves'
	);

	const out = outputDir(dir, project);
	add(writable(out), `output  ${displayPath(dir, out)}`, writable(out) ? '' : 'Not writable.');

	return report(checks);
}

/**
 * Writable if it exists, or if the nearest existing ancestor is — the output
 * directory is created on demand, so a missing one is not a problem.
 */
function writable(target) {
	let dir = target;
	for (;;) {
		if (existsSync(dir)) {
			try {
				accessSync(dir, constants.W_OK);
				return true;
			} catch {
				return false;
			}
		}
		const parent = dirname(dir);
		if (parent === dir) return false;
		dir = parent;
	}
}

function report(checks) {
	for (const check of checks) {
		console.log(`${check.ok ? '✓' : '✗'} ${check.label}`);
		if (check.detail) {
			for (const line of String(check.detail).split('\n')) console.log(`      ${line}`);
		}
	}
	const failed = checks.filter((c) => !c.ok).length;
	console.log(failed ? `\n${failed} check(s) failed.` : '\nReady to render.');
	return failed === 0 ? 0 : 1;
}

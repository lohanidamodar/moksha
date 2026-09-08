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
import { listDevices } from '../core/node/devices.js';
import { run, adb } from '../core/node/screencap.js';
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

	// Capture is optional, so it is only checked when the project asks for it.
	if (Object.keys(project.capture ?? {}).length) await checkCapture(add, project);

	return report(checks);
}

/** The capture toolchain, checked only when a project uses it. */
async function checkCapture(add, project) {
	const patrol = await version('patrol', ['--version']);
	add(
		patrol.ok,
		'patrol_cli',
		patrol.ok
			? patrol.text
			: 'Not on the PATH. Install it with `dart pub global activate patrol_cli`.'
	);

	const adbCheck = await version(adb(), ['version']);
	add(
		adbCheck.ok,
		`adb  ${adb()}`,
		adbCheck.ok
			? adbCheck.text.split('\n')[0]
			: 'Not found. Install the Android SDK platform-tools, or set MOKSHA_ADB.'
	);

	if (process.platform === 'darwin') {
		const xcrun = await version('xcrun', ['simctl', 'help']);
		add(xcrun.ok, 'xcrun simctl', xcrun.ok ? 'available' : 'Not available; iOS captures need Xcode.');
	} else {
		add(true, 'iOS captures', `Not available on ${process.platform}; they need a macOS host.`);
	}

	const devices = await listDevices();
	add(
		devices.length > 0,
		`devices  ${devices.length}`,
		devices.length
			? devices.map((d) => `${d.id}  ${d.name} (${d.platform})`).join('\n      ')
			: 'None attached. Start an emulator or plug in a phone.'
	);

	const test = project.capture?.test;
	add(Boolean(test), 'capture test', test || 'No `capture.test` in the project.');
}

/** Runs a version command, reporting absence rather than throwing. */
async function version(command, args) {
	try {
		const { code, stdout, stderr } = await run(command, args);
		const text = (stdout.toString('utf8') || stderr).trim();
		return { ok: code === 0, text };
	} catch (e) {
		return { ok: false, text: e instanceof Error ? e.message : String(e) };
	}
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

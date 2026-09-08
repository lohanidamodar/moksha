/**
 * `moksha capture` — drive the app and photograph the screens the listing needs.
 *
 * The half that used to be manual. A Patrol test walks the app and asks the
 * host to shoot at each scene; the host answers only once the file is written,
 * so the test cannot move on mid-capture.
 *
 * Output is plain PNGs in the project's captures directory. Nothing else in
 * Moksha depends on capture having produced them, so an app that gets its
 * screenshots some other way loses nothing.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawn } from 'node:child_process';
import { imagePath } from '../core/node/project-file.js';
import { listDevices, chooseDevice } from '../core/node/devices.js';
import { captureScreen, runAdb, reverseArgs, removeReverseArgs } from '../core/node/screencap.js';
import { startCaptureServer } from '../core/node/capture-server.js';
import { patrolTestArgs, captureUrlFor, platformRunsHere } from '../core/node/patrol.js';
import { pinStatusBar, clearStatusBar } from '../core/node/status-bar.js';
import { requireProject, displayPath } from './project-arg.js';
import { scaffold } from './scaffold.js';

export async function capture({ flags }) {
	// The scaffold is about the app repo, not this project, so it works before
	// a project exists.
	if (flags.scaffold) return scaffold();

	const { dir, project } = requireProject(flags);
	const settings = project.capture ?? {};

	const platform = typeof flags.platform === 'string' ? flags.platform : 'android';
	if (!['android', 'ios'].includes(platform)) {
		throw new Error(`--platform must be android or ios; got "${platform}".`);
	}
	if (!platformRunsHere(platform)) {
		throw new Error('iOS captures need a macOS host with a booted simulator.');
	}

	const target = typeof flags.test === 'string' ? flags.test : settings.test;
	if (!target) {
		throw new Error(
			'No capture test. Add `"capture": { "test": "integration_test/store_screenshots.dart" }` ' +
				'to the project, or pass --test.\nRun `moksha capture --scaffold` to see the test to write.'
		);
	}

	const device = chooseDevice(await listDevices(), {
		platform,
		deviceId: typeof flags.device === 'string' ? flags.device : undefined
	});
	console.log(`device  ${device.id}  ${device.name}`);

	const capturesDir = imagePath(dir, settings.dir ?? 'captures');
	const outDir = join(capturesDir, platform);
	mkdirSync(outDir, { recursive: true });

	const expected = new Set(settings.scenes ?? []);
	const seen = [];
	const unexpected = [];

	const server = await startCaptureServer({
		port: Number(flags.port) || 0,
		onCapture: async (scene) => {
			if (expected.size && !expected.has(scene)) unexpected.push(scene);
			const bytes = await captureScreen(device);
			const file = join(outDir, `${sceneFilename(scene)}.png`);
			writeFileSync(file, bytes);
			seen.push(scene);
			console.log(`  ✓ ${scene}  ${displayPath(dir, file)}`);
			return { path: relative(dir, file).split(/[\\/]/).join('/') };
		}
	});

	// The device's localhost is its own, so make the port reach the host's.
	// Works for an emulator and a plugged-in phone alike, unlike 10.0.2.2.
	const needsReverse = platform === 'android';
	if (needsReverse) {
		const { code, stderr } = await runAdb(reverseArgs(device.id, server.port));
		if (code !== 0) {
			await server.close();
			throw new Error(`adb reverse failed, so the test cannot reach the host: ${stderr}`);
		}
	}

	// 9:41, full battery, no notifications — the difference between a
	// screenshot and a store asset.
	const pinned = settings.statusBar === false ? false : await pinStatusBar(device);
	if (settings.statusBar !== false && !pinned) {
		console.warn('!  Could not pin the status bar; captures will show the real clock.');
	}

	console.log(`handshake  http://127.0.0.1:${server.port}\n`);

	let code;
	try {
		code = await runPatrol(dir, {
			target,
			platform,
			deviceId: device.id,
			captureUrl: captureUrlFor(platform, server.port),
			flavor: settings.flavor,
			extraArgs: Array.isArray(settings.patrolArgs) ? settings.patrolArgs : []
		});
	} finally {
		await server.close();
		// Leave the device as it was found: a pinned status bar is sticky.
		if (pinned) await clearStatusBar(device);
		if (needsReverse) await runAdb(removeReverseArgs(device.id, server.port)).catch(() => {});
	}

	return report({ code, seen, expected, unexpected, outDir, dir });
}

function report({ code, seen, expected, unexpected, outDir, dir }) {
	console.log(`\n${seen.length} screen(s) -> ${displayPath(dir, outDir)}`);

	const missing = [...expected].filter((scene) => !seen.includes(scene));
	if (missing.length) {
		console.error(
			`✗ The test never asked for: ${missing.join(', ')}.\n` +
				'  Either the flow did not reach those screens, or the scene names differ.'
		);
	}
	if (unexpected.length) {
		console.warn(
			`! Captured scenes the project does not list: ${[...new Set(unexpected)].join(', ')}.`
		);
	}
	if (code !== 0) console.error(`✗ patrol exited ${code}.`);

	return code === 0 && missing.length === 0 ? 0 : 1;
}

/** A scene name is a filename, so it must not be able to escape the directory. */
function sceneFilename(scene) {
	return scene.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[.-]+/, '') || 'scene';
}

function runPatrol(cwd, options) {
	const args = patrolTestArgs(options);
	console.log(`patrol ${args.join(' ')}\n`);
	return new Promise((resolve, reject) => {
		const child = spawn('patrol', args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
		child.on('error', (e) =>
			reject(
				new Error(
					e.code === 'ENOENT'
						? '`patrol` is not on the PATH. Install it with `dart pub global activate patrol_cli`.'
						: `patrol failed to start: ${e.message}`
				)
			)
		);
		child.on('close', (exit) => resolve(exit ?? 0));
	});
}

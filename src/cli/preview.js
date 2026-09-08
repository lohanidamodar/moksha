/**
 * `moksha preview` — the app preview video.
 *
 * Records the device while a Patrol test drives one short journey, then
 * transcodes it to the size the store wants and checks it. Apple uploads the
 * file and enforces 15-30 seconds; Play takes a YouTube link, so its video is
 * rendered for the user to post and has no bounds worth enforcing.
 *
 * Deliberately not framed or captioned: Apple requires an app preview to be a
 * plain screen recording.
 */
import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { imagePath, outputDir } from '../core/node/project-file.js';
import { listDevices, chooseDevice } from '../core/node/devices.js';
import { runAdb } from '../core/node/screencap.js';
import { startRecording, ffmpeg, ffprobe } from '../core/node/recorder.js';
import { pinStatusBar, clearStatusBar } from '../core/node/status-bar.js';
import { patrolTestArgs, platformRunsHere } from '../core/node/patrol.js';
import { PREVIEW_SIZES, transcodeArgs, probeArgs, parseProbe, validatePreview } from '../core/video.js';
import { requireProject, displayPath } from './project-arg.js';

export async function preview({ flags }) {
	const { dir, project } = requireProject(flags);
	const settings = project.capture ?? {};

	const platform = typeof flags.platform === 'string' ? flags.platform : 'android';
	if (!platformRunsHere(platform)) {
		throw new Error('iOS previews need a macOS host with a booted simulator.');
	}

	const target = typeof flags.test === 'string' ? flags.test : settings.previewTest;
	if (!target) {
		throw new Error(
			'No preview test. Add `"capture": { "previewTest": "integration_test/store_preview.dart" }` ' +
				'to the project, or pass --test.\n' +
				'It should drive one short journey — see one screen, start a core action, finish it.'
		);
	}

	const device = chooseDevice(await listDevices(), {
		platform,
		deviceId: typeof flags.device === 'string' ? flags.device : undefined
	});
	console.log(`device  ${device.id}  ${device.name}`);

	const root = outputDir(dir, project);
	const previewDir = join(root, 'previews', platform);
	mkdirSync(previewDir, { recursive: true });

	const raw = join(previewDir, 'raw.mp4');
	const finished = join(previewDir, 'preview.mp4');

	const pinned = settings.statusBar === false ? false : await pinStatusBar(device);
	const recording = await startRecording(device, raw);

	let code;
	try {
		code = await runPatrol(dir, patrolTestArgs({ target, deviceId: device.id, captureUrl: '' }));
	} finally {
		await recording.stop().catch((e) => console.error(`!  ${e.message}`));
		if (pinned) await clearStatusBar(device);
	}

	if (code !== 0) {
		console.error(`✗ patrol exited ${code}; the recording may be incomplete.`);
	}

	const size = PREVIEW_SIZES[sizeKeyFor(platform, flags)] ?? PREVIEW_SIZES.android;
	console.log(`\ntranscoding to ${size.width}x${size.height}…`);

	const transcode = await ffmpeg(transcodeArgs({ input: raw, output: finished, ...size }));
	if (transcode.code !== 0) {
		throw new Error(`ffmpeg failed:\n${transcode.stderr}`);
	}

	const probe = await ffprobe(probeArgs(finished));
	const info = parseProbe(probe.stdout.toString('utf8') || '{}');
	info.bytes ||= statSync(finished).size;

	const problems = validatePreview({ platform, ...info });
	const shown = displayPath(dir, finished);

	if (problems.length) {
		console.error(`✗ ${shown}  ${info.width}x${info.height}  ${info.seconds.toFixed(1)}s`);
		for (const problem of problems) console.error(`    ${problem.message}`);
		return 1;
	}

	console.log(`✓ ${shown}  ${info.width}x${info.height}  ${info.seconds.toFixed(1)}s`);
	if (platform === 'android') {
		console.log('  Play takes a YouTube link rather than an upload, so post this there yourself.');
	}
	return 0;
}

function sizeKeyFor(platform, flags) {
	if (platform !== 'ios') return 'android';
	return typeof flags.size === 'string' ? flags.size : 'ios-6.9';
}

function runPatrol(cwd, args) {
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

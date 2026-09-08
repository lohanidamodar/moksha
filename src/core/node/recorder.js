/**
 * Recording the device screen while a test drives the app.
 *
 * Both recorders need care on the way out, and both lessons are Patrol's:
 *
 * - `adb screenrecord` only writes the mp4's moov atom when it is signalled on
 *   the device. Killing adb on the host leaves an unplayable file.
 * - `xcrun simctl io recordVideo` finalises on SIGINT specifically, not
 *   SIGTERM, so it must be signalled rather than killed.
 *
 * adb also caps a recording at 180 seconds, which is far longer than any
 * preview Apple accepts, so it is not worth working around.
 */
import { spawn } from 'node:child_process';
import { adb, runAdb, run } from './screencap.js';

/** adb's own limit; a preview must land well under it anyway. */
export const ANDROID_MAX_SECONDS = 180;

const DEVICE_PATH = '/sdcard/moksha-preview.mp4';

/**
 * Start recording. The returned handle's `stop()` finalises the file and
 * leaves it at [outputPath] on the host.
 *
 * @param {{id: string, platform: string}} device
 * @param {string} outputPath
 */
export async function startRecording(device, outputPath) {
	return device.platform === 'android'
		? startAndroid(device, outputPath)
		: startIos(device, outputPath);
}

async function startAndroid(device, outputPath) {
	// Clear a file left by an interrupted run, so a failure here cannot ship
	// last week's recording as this week's preview.
	await runAdb(['-s', device.id, 'shell', 'rm', '-f', DEVICE_PATH]).catch(() => {});

	const child = spawn(adb(), [
		'-s', device.id, 'shell', 'screenrecord',
		'--bit-rate', '8000000',
		'--time-limit', String(ANDROID_MAX_SECONDS),
		DEVICE_PATH
	]);

	return {
		async stop() {
			// Signal screenrecord ON THE DEVICE. Killing the host-side adb
			// leaves the mp4 without its moov atom, and unplayable.
			await runAdb(['-s', device.id, 'shell', 'pkill', '-INT', '-f', 'screenrecord']).catch(() => {});
			await new Promise((resolve) => child.on('close', resolve));
			// The device needs a moment to flush before the pull.
			const { code, stderr } = await runAdb(['-s', device.id, 'pull', DEVICE_PATH, outputPath]);
			if (code !== 0) throw new Error(`Could not pull the recording: ${stderr}`);
			await runAdb(['-s', device.id, 'shell', 'rm', '-f', DEVICE_PATH]).catch(() => {});
			return outputPath;
		}
	};
}

async function startIos(device, outputPath) {
	const child = spawn('xcrun', [
		'simctl', 'io', device.id, 'recordVideo', '--codec=h264', '--force', outputPath
	]);

	return {
		async stop() {
			// SIGINT, not SIGTERM: simctl finalises the mp4 on interrupt and
			// abandons it on terminate.
			child.kill('SIGINT');
			await new Promise((resolve) => child.on('close', resolve));
			return outputPath;
		}
	};
}

/** Run ffmpeg, reporting its absence as advice rather than a stack trace. */
export async function ffmpeg(args) {
	return runTool('ffmpeg', args);
}

export async function ffprobe(args) {
	return runTool('ffprobe', args);
}

async function runTool(tool, args) {
	try {
		return await run(tool, args);
	} catch (e) {
		if (e instanceof Error && /not on the PATH/.test(e.message)) {
			throw new Error(
				`\`${tool}\` is not on the PATH. Preview videos need ffmpeg:\n` +
					'  macOS   brew install ffmpeg\n' +
					'  Windows winget install ffmpeg\n' +
					'  Linux   apt install ffmpeg'
			);
		}
		throw e;
	}
}

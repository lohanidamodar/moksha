/**
 * Taking a screenshot off a device, from the host.
 *
 * Patrol's own in-test call is not the mechanism: `takeNativeScreenshot` is
 * documented Android-only ("a no-op elsewhere") and "never throws if the
 * capture fails", because it exists for a device farm to collect files, not
 * for marketing assets. Using it would produce silence on iOS and swallowed
 * failures on Android.
 *
 * So the host takes the picture, the way patrol_mcp does: `adb exec-out
 * screencap` streamed to stdout, and `xcrun simctl io screenshot` to a file.
 * Native resolution, pixel-exact, nothing to plumb into the app.
 */
import { spawn } from 'node:child_process';
import { findAdb } from './android-sdk.js';
import { readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

/** PNG magic, so a shell error printed where image bytes should be is caught. */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * `adb` args that capture [deviceId]'s screen to stdout.
 *
 * `-s` is not optional: without it a second attached device makes the capture
 * fail, or worse, silently photograph the wrong one.
 */
export function androidCaptureArgs(deviceId) {
	return ['-s', deviceId, 'exec-out', 'screencap', '-p'];
}

/**
 * `xcrun` args that capture [deviceId]'s screen to [outputPath].
 *
 * simctl writes atomically — temp file then rename, in the destination
 * directory — so the path must be a real writable file, never /dev/stdout.
 */
export function iosCaptureArgs(deviceId, outputPath) {
	return ['simctl', 'io', deviceId, 'screenshot', '--type=png', outputPath];
}

/** `adb` args that make the device's own localhost:[port] reach the host's. */
export function reverseArgs(deviceId, port) {
	return ['-s', deviceId, 'reverse', `tcp:${port}`, `tcp:${port}`];
}

export function removeReverseArgs(deviceId, port) {
	return ['-s', deviceId, 'reverse', '--remove', `tcp:${port}`];
}

/**
 * The adb to run: the PATH's when it has one, else the SDK's own copy.
 *
 * Resolved once, because it can involve several filesystem probes and every
 * capture in a run uses the same one.
 */
let adbPath;
export function adb() {
	if (adbPath === undefined) adbPath = findAdb() ?? 'adb';
	return adbPath;
}

/** Run adb, wherever it lives. */
export function runAdb(args, options) {
	return run(adb(), args, options);
}

/**
 * Run a command and collect stdout as bytes.
 *
 * @returns {Promise<{code: number, stdout: Buffer, stderr: string}>}
 */
export function run(command, args, { cwd } = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { cwd });
		const out = [];
		let err = '';
		child.stdout.on('data', (chunk) => out.push(chunk));
		child.stderr.on('data', (chunk) => (err += chunk));
		child.on('error', (e) =>
			reject(
				new Error(
					e.code === 'ENOENT'
						? `\`${command}\` is not on the PATH.`
						: `\`${command}\` failed: ${e.message}`
				)
			)
		);
		child.on('close', (code) =>
			resolve({ code: code ?? 0, stdout: Buffer.concat(out), stderr: err.trim() })
		);
	});
}

/** Throws unless [bytes] really is a PNG, quoting whatever was printed instead. */
export function assertPng(bytes, what) {
	const looksRight =
		bytes.length > PNG_SIGNATURE.length &&
		PNG_SIGNATURE.every((byte, index) => bytes[index] === byte);
	if (looksRight) return bytes;

	const prefix = bytes
		.subarray(0, 400)
		.toString('utf8')
		.replace(/[^\x20-\x7e\n]/g, '')
		.trim();
	throw new Error(`${what} did not return a PNG.${prefix ? `\n  Output: ${prefix}` : ''}`);
}

/**
 * Capture one screen.
 *
 * @param {{id: string, platform: 'android'|'ios'}} device
 * @returns {Promise<Buffer>} PNG bytes at the device's native resolution
 */
export async function captureScreen(device) {
	if (device.platform === 'android') {
		const { code, stdout, stderr } = await runAdb(androidCaptureArgs(device.id));
		if (code !== 0) throw new Error(`adb screencap failed: ${stderr || `exit ${code}`}`);
		return assertPng(stdout, 'adb screencap');
	}

	if (device.platform === 'ios') {
		const path = join(tmpdir(), `moksha-capture-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
		try {
			const { code, stderr } = await run('xcrun', iosCaptureArgs(device.id, path));
			if (code !== 0) throw new Error(`simctl screenshot failed: ${stderr || `exit ${code}`}`);
			return assertPng(await readFile(path), 'simctl screenshot');
		} finally {
			await unlink(path).catch(() => {});
		}
	}

	throw new Error(`Cannot capture from platform "${device.platform}".`);
}

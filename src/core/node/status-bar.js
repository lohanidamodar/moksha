/**
 * Pinning the status bar before a capture.
 *
 * The difference between a screenshot and a store asset: a real device shows
 * 14:23, 47% battery and three notification icons, and a listing full of that
 * looks like someone photographed their phone. Apple's own marketing has read
 * 9:41 since 2007, and Play listings follow the same convention.
 *
 * Both are reversible, and both are reverted after a run — a pinned status bar
 * is sticky and would otherwise outlive the capture and confuse the next
 * person to pick up the device.
 */
import { runAdb, run } from './screencap.js';

/** The time every Apple keynote screenshot shows. */
const MARKETING_TIME = { hour: 9, minute: 41 };

function demoBroadcast(deviceId, args) {
	return ['-s', deviceId, 'shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', ...args];
}

/**
 * The adb calls that put Android's SystemUI into demo mode and dress it.
 *
 * Demo mode has to be allowed first, and it is a global setting, so it is
 * turned back off afterwards.
 */
export function androidPinCommands(deviceId) {
	const hhmm = `${String(MARKETING_TIME.hour).padStart(2, '0')}${String(MARKETING_TIME.minute).padStart(2, '0')}`;
	return [
		['-s', deviceId, 'shell', 'settings', 'put', 'global', 'sysui_demo_allowed', '1'],
		demoBroadcast(deviceId, ['-e', 'command', 'enter']),
		demoBroadcast(deviceId, ['-e', 'command', 'clock', '-e', 'hhmm', hhmm]),
		demoBroadcast(deviceId, ['-e', 'command', 'battery', '-e', 'level', '100', '-e', 'plugged', 'false']),
		demoBroadcast(deviceId, ['-e', 'command', 'network', '-e', 'wifi', 'show', '-e', 'level', '4']),
		demoBroadcast(deviceId, [
			'-e', 'command', 'network', '-e', 'mobile', 'show',
			'-e', 'datatype', 'none', '-e', 'level', '4'
		]),
		demoBroadcast(deviceId, ['-e', 'command', 'notifications', '-e', 'visible', 'false'])
	];
}

export function androidClearCommands(deviceId) {
	return [
		demoBroadcast(deviceId, ['-e', 'command', 'exit']),
		['-s', deviceId, 'shell', 'settings', 'put', 'global', 'sysui_demo_allowed', '0']
	];
}

/** simctl dresses the simulator's status bar in one call. */
export function iosPinArgs(deviceId) {
	return [
		'simctl', 'status_bar', deviceId, 'override',
		'--time', `${MARKETING_TIME.hour}:${String(MARKETING_TIME.minute).padStart(2, '0')}`,
		'--batteryState', 'charged',
		'--batteryLevel', '100',
		'--cellularMode', 'active',
		'--cellularBars', '4',
		'--wifiMode', 'active',
		'--wifiBars', '3',
		'--dataNetwork', 'wifi'
	];
}

export function iosClearArgs(deviceId) {
	return ['simctl', 'status_bar', deviceId, 'clear'];
}

/**
 * Dress the status bar. Never throws: a device that will not cooperate should
 * cost you a tidy clock, not the whole capture run.
 *
 * @returns {Promise<boolean>} whether it took
 */
export async function pinStatusBar(device) {
	try {
		if (device.platform === 'android') {
			for (const args of androidPinCommands(device.id)) {
				const { code } = await runAdb(args);
				if (code !== 0) return false;
			}
			return true;
		}
		const { code } = await run('xcrun', iosPinArgs(device.id));
		return code === 0;
	} catch {
		return false;
	}
}

/** Put it back. A pinned status bar is sticky and outlives the run. */
export async function clearStatusBar(device) {
	try {
		if (device.platform === 'android') {
			for (const args of androidClearCommands(device.id)) await runAdb(args);
			return;
		}
		await run('xcrun', iosClearArgs(device.id));
	} catch {
		// Best effort; the run already produced its assets.
	}
}

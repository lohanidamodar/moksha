/**
 * Finding the device a capture runs against.
 *
 * Android goes through adb, which works on Windows, Linux and macOS. iOS needs
 * a booted simulator and therefore a macOS host — the same limit goldie has,
 * and the reason `moksha capture --platform android` is the one that runs
 * everywhere.
 */
import { run, runAdb } from './screencap.js';

/**
 * Parse `adb devices -l` output.
 *
 * Only devices in the `device` state are usable: `offline` and
 * `unauthorized` are attached but cannot be driven, and reporting them as
 * available produces a confusing failure several steps later.
 */
export function parseAdbDevices(stdout) {
	return stdout
		.split('\n')
		.slice(1) // "List of devices attached"
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const [id, state, ...rest] = line.split(/\s+/);
			const model = rest.find((part) => part.startsWith('model:'))?.slice(6);
			return {
				id,
				state,
				platform: 'android',
				name: model?.replace(/_/g, ' ') ?? id,
				emulator: id.startsWith('emulator-')
			};
		})
		.filter((device) => device.id && device.state === 'device');
}

/**
 * Parse `xcrun simctl list devices booted` output.
 *
 * Only booted simulators: simctl can capture from nothing else.
 */
export function parseSimctlDevices(stdout) {
	const devices = [];
	for (const line of stdout.split('\n')) {
		const match = line.match(/^\s+(.+?)\s+\(([0-9A-F-]{36})\)\s+\(Booted\)/i);
		if (match) devices.push({ id: match[2], platform: 'ios', name: match[1], emulator: true });
	}
	return devices;
}

/** Every device Moksha could capture from right now. */
export async function listDevices() {
	const devices = [];

	try {
		const { code, stdout } = await runAdb(['devices', '-l']);
		if (code === 0) devices.push(...parseAdbDevices(stdout.toString('utf8')));
	} catch {
		// No adb on the PATH is not an error here; doctor is where that is said.
	}

	if (process.platform === 'darwin') {
		try {
			const { code, stdout } = await run('xcrun', ['simctl', 'list', 'devices', 'booted']);
			if (code === 0) devices.push(...parseSimctlDevices(stdout.toString('utf8')));
		} catch {
			// Same: reported by doctor, not thrown from a listing.
		}
	}

	return devices;
}

/**
 * The device a run should use.
 *
 * An explicit id wins. Otherwise the single device of the wanted platform —
 * and if there are several, that is a question for the user rather than a
 * coin toss, because capturing from the wrong phone is not obvious in the
 * output.
 */
export function chooseDevice(devices, { platform, deviceId } = {}) {
	if (deviceId) {
		const found = devices.find((d) => d.id === deviceId);
		if (!found) {
			throw new Error(
				`No attached device with id "${deviceId}". ` +
					`Attached: ${devices.map((d) => d.id).join(', ') || 'none'}.`
			);
		}
		return found;
	}

	const candidates = platform ? devices.filter((d) => d.platform === platform) : devices;

	if (candidates.length === 0) {
		throw new Error(
			platform === 'ios'
				? 'No booted iOS simulator. Boot one in Xcode, or capture Android with --platform android.'
				: 'No device attached. Start an emulator or plug in a phone, then check `adb devices`.'
		);
	}

	if (candidates.length > 1) {
		throw new Error(
			'Several devices are attached; name one with --device.\n' +
				candidates.map((d) => `  ${d.id}  ${d.name} (${d.platform})`).join('\n')
		);
	}

	return candidates[0];
}

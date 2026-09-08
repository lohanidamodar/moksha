/**
 * Driving the app through Patrol.
 *
 * Patrol runs Flutter tests through the native runners — Gradle instrumentation
 * and XCTest — so `$.native` can dismiss the permission sheet that would
 * otherwise be sitting on top of the screen being photographed. That is the
 * reason to use it over integration_test for marketing captures.
 *
 * Moksha never parses Patrol's output for meaning: the test tells the host
 * when to shoot, over the handshake. Patrol's job is to get the app to the
 * right screen and to fail loudly when it cannot.
 */

/**
 * The `patrol test` invocation for one run.
 *
 * MOKSHA_CAPTURE_URL reaches the test as a dart-define, which is how the app
 * side learns where to send the handshake without anything hard-coded.
 */
export function patrolTestArgs({ target, platform, deviceId, captureUrl, flavor, extraArgs = [] }) {
	const args = ['test'];
	if (target) args.push('--target', target);
	if (deviceId) args.push('--device', deviceId);
	if (flavor) args.push('--flavor', flavor);
	args.push('--dart-define', `MOKSHA_CAPTURE_URL=${captureUrl}`);
	// A capture run is a release-ish build by intent: a debug Flutter build
	// paints a DEBUG banner into every screenshot.
	args.push(...extraArgs);
	return args;
}

/**
 * Where the app should send the handshake.
 *
 * Android: the device's own loopback, made to reach the host by `adb reverse`,
 * which works for an emulator and a plugged-in phone alike — unlike 10.0.2.2,
 * which is emulator-only.
 * iOS simulator: shares the host's network stack, so localhost already is the
 * host.
 */
export function captureUrlFor(platform, port) {
	return `http://127.0.0.1:${port}`;
}

/** True when this host can run a capture for [platform] at all. */
export function platformRunsHere(platform) {
	return platform === 'android' || process.platform === 'darwin';
}

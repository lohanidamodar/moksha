import { test } from 'node:test';
import assert from 'node:assert/strict';
import { androidCaptureArgs, iosCaptureArgs, reverseArgs, assertPng } from './screencap.js';
import { parseAdbDevices, parseSimctlDevices, chooseDevice } from './devices.js';
import { startCaptureServer } from './capture-server.js';
import { patrolTestArgs, captureUrlFor, platformRunsHere } from './patrol.js';

test('adb capture always names the device', () => {
	// Without -s, a second attached device makes the capture fail or, worse,
	// silently photograph the wrong phone.
	const args = androidCaptureArgs('emulator-5554');
	assert.deepEqual(args, ['-s', 'emulator-5554', 'exec-out', 'screencap', '-p']);
});

test('simctl capture writes to a real path, never a stream', () => {
	// simctl writes atomically in the destination directory, so /dev/stdout
	// fails there with a permission error.
	const args = iosCaptureArgs('ABC-123', '/tmp/shot.png');
	assert.deepEqual(args, ['simctl', 'io', 'ABC-123', 'screenshot', '--type=png', '/tmp/shot.png']);
	assert.ok(!args.includes('/dev/stdout'));
});

test('adb reverse maps the same port both ways', () => {
	assert.deepEqual(reverseArgs('abc', 4599), ['-s', 'abc', 'reverse', 'tcp:4599', 'tcp:4599']);
});

test('a shell error printed instead of image bytes is caught and quoted', () => {
	const notAnImage = Buffer.from('error: device unauthorized\n');
	assert.throws(() => assertPng(notAnImage, 'adb screencap'), /did not return a PNG/);
	assert.throws(() => assertPng(notAnImage, 'adb screencap'), /device unauthorized/);
});

test('a real PNG passes the check', () => {
	const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
	assert.equal(assertPng(png, 'x'), png);
});

test('adb devices: only usable ones, with their model names', () => {
	const devices = parseAdbDevices(
		[
			'List of devices attached',
			'emulator-5554         device product:sdk_gphone64_x86_64 model:sdk_gphone64_x86_64 device:emu64x',
			'RF8N20ABCDE           device product:a52qnaxx model:SM_A525F device:a52q',
			'0123456789ABCDEF      offline',
			'FEDCBA9876543210      unauthorized'
		].join('\n')
	);
	assert.equal(devices.length, 2, 'offline and unauthorized devices must not be offered');
	assert.equal(devices[0].emulator, true);
	assert.equal(devices[1].name, 'SM A525F');
	assert.equal(devices[1].emulator, false);
});

test('adb devices: an empty list is empty, not a phantom device', () => {
	assert.deepEqual(parseAdbDevices('List of devices attached\n\n'), []);
});

test('simctl: only booted simulators', () => {
	const devices = parseSimctlDevices(
		[
			'== Devices ==',
			'-- iOS 18.2 --',
			'    iPhone 16 Pro Max (A1B2C3D4-1111-2222-3333-444455556666) (Booted)',
			'    iPhone 16 (B1B2C3D4-1111-2222-3333-444455556666) (Shutdown)'
		].join('\n')
	);
	assert.equal(devices.length, 1);
	assert.equal(devices[0].name, 'iPhone 16 Pro Max');
	assert.equal(devices[0].platform, 'ios');
});

test('one device of the wanted platform is chosen; several is a question', () => {
	const devices = [
		{ id: 'a', platform: 'android', name: 'Pixel' },
		{ id: 'b', platform: 'android', name: 'Galaxy' },
		{ id: 'c', platform: 'ios', name: 'iPhone' }
	];
	assert.equal(chooseDevice(devices, { platform: 'ios' }).id, 'c');
	// Capturing from the wrong phone is not obvious in the output, so this
	// asks rather than guessing.
	assert.throws(() => chooseDevice(devices, { platform: 'android' }), /name one with --device/);
	assert.equal(chooseDevice(devices, { deviceId: 'b' }).id, 'b');
	assert.throws(() => chooseDevice(devices, { deviceId: 'z' }), /No attached device with id/);
});

test('no device gives advice, not an empty result', () => {
	assert.throws(() => chooseDevice([], { platform: 'android' }), /adb devices/);
	assert.throws(() => chooseDevice([], { platform: 'ios' }), /Boot one in Xcode/);
});

test('patrol is told where to send the handshake', () => {
	const args = patrolTestArgs({
		target: 'integration_test/store.dart',
		deviceId: 'emulator-5554',
		captureUrl: 'http://127.0.0.1:4599'
	});
	assert.deepEqual(args.slice(0, 3), ['test', '--target', 'integration_test/store.dart']);
	assert.ok(args.includes('--device'));
	const define = args[args.indexOf('--dart-define') + 1];
	assert.equal(define, 'MOKSHA_CAPTURE_URL=http://127.0.0.1:4599');
});

test('the handshake url is loopback on both platforms', () => {
	// Android reaches the host through `adb reverse`, which works for an
	// emulator and a plugged-in phone alike — unlike 10.0.2.2.
	assert.equal(captureUrlFor('android', 4599), 'http://127.0.0.1:4599');
	assert.equal(captureUrlFor('ios', 4599), 'http://127.0.0.1:4599');
});

test('android captures anywhere; ios needs a mac', () => {
	assert.equal(platformRunsHere('android'), true);
	assert.equal(platformRunsHere('ios'), process.platform === 'darwin');
});

test('the server does not answer until the capture is written', async () => {
	const order = [];
	const server = await startCaptureServer({
		onCapture: async (scene) => {
			order.push(`start ${scene}`);
			await new Promise((r) => setTimeout(r, 40));
			order.push(`done ${scene}`);
			return { path: `captures/${scene}.png` };
		}
	});

	try {
		const res = await fetch(`http://127.0.0.1:${server.port}/capture?scene=home`);
		order.push('test resumed');
		assert.equal(res.status, 200);
		assert.deepEqual(await res.json(), { scene: 'home', path: 'captures/home.png' });
		// The whole point: the test cannot navigate away mid-capture.
		assert.deepEqual(order, ['start home', 'done home', 'test resumed']);
		assert.deepEqual(server.captured, [{ scene: 'home', path: 'captures/home.png' }]);
	} finally {
		await server.close();
	}
});

test('a failed capture fails the test rather than passing with nothing written', async () => {
	const server = await startCaptureServer({
		onCapture: async () => {
			throw new Error('device unauthorized');
		}
	});
	try {
		const res = await fetch(`http://127.0.0.1:${server.port}/capture?scene=home`);
		assert.equal(res.status, 500);
		assert.match((await res.json()).error, /device unauthorized/);
	} finally {
		await server.close();
	}
});

test('a request with no scene is refused, and health reports progress', async () => {
	const server = await startCaptureServer({ onCapture: async () => ({ path: 'x.png' }) });
	try {
		assert.equal((await fetch(`http://127.0.0.1:${server.port}/capture`)).status, 400);
		assert.equal((await fetch(`http://127.0.0.1:${server.port}/nope`)).status, 404);

		await fetch(`http://127.0.0.1:${server.port}/capture?scene=a`);
		const health = await (await fetch(`http://127.0.0.1:${server.port}/health`)).json();
		assert.deepEqual(health, { ok: true, captured: 1 });
	} finally {
		await server.close();
	}
});

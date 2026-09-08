import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	PREVIEW_SIZES,
	APPLE_PREVIEW,
	validatePreview,
	transcodeArgs,
	probeArgs,
	parseProbe
} from './video.js';

const apple = (over) => ({
	platform: 'ios',
	seconds: 20,
	width: 886,
	height: 1920,
	bytes: 20 * 1024 * 1024,
	...over
});

test('a preview inside every Apple bound passes', () => {
	assert.deepEqual(validatePreview(apple()), []);
});

test('Apple refuses a preview outside 15-30 seconds', () => {
	// The failure that costs a whole re-record: it is only found at upload.
	const short = validatePreview(apple({ seconds: 12 }));
	const long = validatePreview(apple({ seconds: 31 }));
	assert.match(short[0].message, /15-30 seconds/);
	assert.match(long[0].message, /31\.0s/);
	assert.deepEqual(validatePreview(apple({ seconds: APPLE_PREVIEW.minSeconds })), []);
	assert.deepEqual(validatePreview(apple({ seconds: APPLE_PREVIEW.maxSeconds })), []);
});

test('Apple refuses a size it does not list', () => {
	assert.match(
		validatePreview(apple({ width: 1080, height: 2340 }))[0].message,
		/not a size App Store Connect accepts/
	);
});

test('Apple refuses a file over 500 MB', () => {
	assert.match(
		validatePreview(apple({ bytes: 600 * 1024 * 1024 }))[0].message,
		/over Apple's 500 MB limit/
	);
});

test('Play enforces nothing, because it takes a YouTube link rather than an upload', () => {
	// Saying nothing is the honest answer, not a pass we invented.
	assert.deepEqual(
		validatePreview({ platform: 'android', seconds: 90, width: 1080, height: 1920, bytes: 1e9 }),
		[]
	);
});

test('every listed iOS preview size is one validate accepts', () => {
	for (const [key, size] of Object.entries(PREVIEW_SIZES)) {
		if (!key.startsWith('ios')) continue;
		assert.deepEqual(validatePreview(apple({ ...size })), [], key);
	}
});

test('the transcode crops to fill rather than letterboxing', () => {
	// Black bars in a store preview look like a mistake.
	const args = transcodeArgs({ input: 'raw.mp4', output: 'out.mp4', width: 886, height: 1920 });
	const filter = args[args.indexOf('-vf') + 1];
	assert.match(filter, /force_original_aspect_ratio=increase/);
	assert.match(filter, /crop=886:1920/);
	assert.ok(!filter.includes('pad'), 'letterboxing instead of cropping');
});

test('the transcode produces the H.264 Apple asks for', () => {
	const args = transcodeArgs({ input: 'raw.mp4', output: 'out.mp4', width: 886, height: 1920 });
	assert.equal(args[args.indexOf('-c:v') + 1], 'libx264');
	assert.equal(args[args.indexOf('-pix_fmt') + 1], 'yuv420p');
	assert.equal(args[args.indexOf('-b:v') + 1], APPLE_PREVIEW.videoBitrate);
	assert.equal(args.at(-1), 'out.mp4');
	// -y, or a second run stalls waiting to be told it may overwrite.
	assert.ok(args.includes('-y'));
});

test('the frame rate is Apple`s 30 unless asked otherwise', () => {
	const at30 = transcodeArgs({ input: 'a', output: 'b', width: 886, height: 1920 });
	assert.match(at30[at30.indexOf('-vf') + 1], /fps=30/);
	const at60 = transcodeArgs({ input: 'a', output: 'b', width: 886, height: 1920, fps: 60 });
	assert.match(at60[at60.indexOf('-vf') + 1], /fps=60/);
});

test('probe output is read from the container, which is the reliable duration', () => {
	const info = parseProbe(
		JSON.stringify({
			streams: [{ width: 886, height: 1920 }],
			format: { duration: '21.533', size: '18874368' }
		})
	);
	assert.equal(info.width, 886);
	assert.equal(info.height, 1920);
	assert.ok(Math.abs(info.seconds - 21.533) < 0.001);
	assert.equal(info.bytes, 18874368);
});

test('a probe missing everything degrades to zeros, not NaN', () => {
	assert.deepEqual(parseProbe('{}'), { width: 0, height: 0, seconds: 0, bytes: 0 });
});

test('probe asks for json and the first video stream only', () => {
	const args = probeArgs('in.mp4');
	assert.equal(args[args.indexOf('-of') + 1], 'json');
	assert.equal(args[args.indexOf('-select_streams') + 1], 'v:0');
	assert.equal(args.at(-1), 'in.mp4');
});

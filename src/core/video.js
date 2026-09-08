/**
 * App preview videos: what each store accepts, and the ffmpeg to get there.
 *
 * Apple uploads the file, so its rules are hard: an exact size, H.264, and a
 * duration between 15 and 30 seconds — a 31-second preview is rejected at
 * upload after you have already made it. Play takes a YouTube link instead,
 * so its "spec" is only what YouTube is happy with and the user posts it
 * themselves.
 *
 * Pure here — sizes, rules and argument lists — so the rules are testable
 * without a device, a recording or ffmpeg.
 *
 * Apple: developer.apple.com/help/app-store-connect/reference/app-preview-specifications
 */

/** Upload sizes, portrait. Keyed by the screenshot size the listing uses. */
export const PREVIEW_SIZES = {
	// iPhone 6.9" — the size App Store Connect wants for new submissions.
	'ios-6.9': { width: 886, height: 1920 },
	'ios-6.7': { width: 886, height: 1920 },
	'ios-6.5': { width: 886, height: 1920 },
	'ios-5.5': { width: 1080, height: 1920 },
	// Play takes no upload; this is a YouTube-friendly portrait size.
	android: { width: 1080, height: 1920 }
};

/** What Apple enforces at upload time. */
export const APPLE_PREVIEW = {
	fps: 30,
	minSeconds: 15,
	maxSeconds: 30,
	/** Apple asks for 10-12 Mbps VBR on H.264. */
	videoBitrate: '11M',
	audioBitrate: '256k',
	audioSampleRate: 48000,
	maxBytes: 500 * 1024 * 1024
};

/**
 * Check a finished preview against the store it targets.
 *
 * @param {{platform: string, seconds: number, width: number, height: number, bytes: number}} video
 * @returns {{level: 'error'|'warning', message: string}[]}
 */
export function validatePreview({ platform, seconds, width, height, bytes }) {
	const problems = [];

	if (platform !== 'ios') {
		// The Play promo video is a YouTube link, so none of Apple's bounds
		// apply. Saying nothing is the honest answer.
		return problems;
	}

	if (seconds < APPLE_PREVIEW.minSeconds || seconds > APPLE_PREVIEW.maxSeconds) {
		problems.push({
			level: 'error',
			message:
				`An App Store preview must run ${APPLE_PREVIEW.minSeconds}-${APPLE_PREVIEW.maxSeconds} ` +
				`seconds; this is ${seconds.toFixed(1)}s. Adjust the pacing of the preview test.`
		});
	}

	const accepted = Object.entries(PREVIEW_SIZES).some(
		([key, size]) => key.startsWith('ios') && size.width === width && size.height === height
	);
	if (!accepted) {
		problems.push({
			level: 'error',
			message: `${width}x${height} is not a size App Store Connect accepts for a preview.`
		});
	}

	if (bytes > APPLE_PREVIEW.maxBytes) {
		problems.push({
			level: 'error',
			message: `${(bytes / 1024 / 1024).toFixed(0)} MB is over Apple's 500 MB limit.`
		});
	}

	return problems;
}

/**
 * ffmpeg arguments that turn a raw device recording into an uploadable file.
 *
 * The recording is whatever the device's screen is; the upload size is not,
 * so the frame is scaled to cover and then cropped centrally rather than
 * letterboxed — a preview with black bars looks like a mistake.
 */
export function transcodeArgs({ input, output, width, height, fps = APPLE_PREVIEW.fps }) {
	return [
		'-y',
		'-i', input,
		'-vf', `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},fps=${fps}`,
		'-c:v', 'libx264',
		'-profile:v', 'high',
		'-pix_fmt', 'yuv420p',
		'-b:v', APPLE_PREVIEW.videoBitrate,
		'-maxrate', APPLE_PREVIEW.videoBitrate,
		'-bufsize', '22M',
		// A preview with no audio track is accepted; a broken one is not.
		'-an',
		'-movflags', '+faststart',
		output
	];
}

/** ffprobe arguments that report a file's duration and dimensions as JSON. */
export function probeArgs(input) {
	return [
		'-v', 'error',
		'-select_streams', 'v:0',
		'-show_entries', 'stream=width,height,duration',
		'-show_entries', 'format=duration,size',
		'-of', 'json',
		input
	];
}

/** Pull duration, size and dimensions out of ffprobe's JSON. */
export function parseProbe(json) {
	const data = typeof json === 'string' ? JSON.parse(json) : json;
	const stream = data.streams?.[0] ?? {};
	// The container's duration is the reliable one; a stream may not carry it.
	const seconds = Number(data.format?.duration ?? stream.duration ?? 0);
	return {
		width: Number(stream.width ?? 0),
		height: Number(stream.height ?? 0),
		seconds,
		bytes: Number(data.format?.size ?? 0)
	};
}

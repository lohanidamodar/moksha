/**
 * Store upload rules, checked against what we actually rendered.
 *
 * Borrowed from goldie, which verifies its output against Apple's rules before
 * you find out from a rejection. The failures worth catching here are the ones
 * that produce a perfectly valid image file that a store then refuses: an
 * alpha channel, an aspect ratio outside Play's limit, a dimension Apple does
 * not recognise.
 *
 * Which rules apply depends on what the asset IS, not just which platform it
 * targets: a 1024x500 Play feature graphic is 2.05:1, so the screenshot aspect
 * limit would reject one that is in fact exactly the size Play demands. Every
 * size in the asset registry therefore declares its `storeKind`, and only
 * screenshots are measured as screenshots.
 */

/** Screenshot sizes App Store Connect accepts, portrait and landscape. */
export const APPLE_SCREENSHOT_SIZES = [
	// iPhone 6.9" — required for new iPhone submissions.
	[1320, 2868],
	[1260, 2736],
	// 6.7" / 6.5" / 6.3" / 6.1", still accepted.
	[1290, 2796],
	[1284, 2778],
	[1242, 2688],
	[1206, 2622],
	[1179, 2556],
	[1170, 2532],
	[1125, 2436],
	[1242, 2208],
	// iPad 13" — required for new iPad submissions — then 12.9" and 11".
	[2064, 2752],
	[2048, 2732],
	[1668, 2420],
	[1668, 2224],
	[1536, 2048]
];

const PLAY_MIN_DIMENSION = 320;
const PLAY_MAX_DIMENSION = 3840;

/** Play's feature graphic has one accepted size, and it is not negotiable. */
const FEATURE_GRAPHIC_SIZE = [1024, 500];

function isAppleSize(w, h) {
	return APPLE_SCREENSHOT_SIZES.some(
		([pw, ph]) => (w === pw && h === ph) || (w === ph && h === pw)
	);
}

/**
 * Check one rendered asset against the rules of the store it targets.
 *
 * @param {{width: number, height: number, platform: string,
 *          hasAlpha: boolean, storeKind?: string}} asset
 *   storeKind: 'screenshot' | 'feature-graphic' | 'icon' | 'none'.
 *   Defaults to 'none' — an unrecognised asset is checked for the one rule
 *   that holds everywhere rather than measured against rules it never had.
 * @returns {{level: 'error'|'warning', message: string}[]}
 */
export function validateStoreAsset({ width, height, platform, hasAlpha, storeKind = 'none' }) {
	const problems = [];

	if (hasAlpha && storeKind !== 'none') {
		// Play: "JPEG or 24-bit PNG (no alpha)". Apple: screenshots "cannot
		// include alpha channels or transparencies", and the same holds for
		// the app icon.
		problems.push({
			level: 'error',
			message: 'Image has an alpha channel; both stores reject that.'
		});
	}

	if (storeKind === 'feature-graphic') {
		const [w, h] = FEATURE_GRAPHIC_SIZE;
		if (width !== w || height !== h) {
			problems.push({
				level: 'error',
				message: `A Play feature graphic must be exactly ${w}x${h}; this is ${width}x${height}.`
			});
		}
		return problems;
	}

	if (storeKind === 'icon') {
		if (width !== height) {
			problems.push({
				level: 'error',
				message: `An app icon must be square; this is ${width}x${height}.`
			});
		}
		return problems;
	}

	if (storeKind !== 'screenshot') return problems;

	if (platform === 'android') {
		const min = Math.min(width, height);
		const max = Math.max(width, height);

		if (min < PLAY_MIN_DIMENSION || max > PLAY_MAX_DIMENSION) {
			problems.push({
				level: 'error',
				message:
					`${width}x${height} is outside Play's range — each side must be ` +
					`between ${PLAY_MIN_DIMENSION}px and ${PLAY_MAX_DIMENSION}px.`
			});
		}

		if (max > min * 2) {
			// The one that bites: a 1080x2400 phone capture is 2.22:1 and is
			// refused, even though it is exactly what the device produced.
			problems.push({
				level: 'error',
				message:
					`${width}x${height} is ${(max / min).toFixed(2)}:1. Play requires ` +
					'the long side to be at most twice the short side.'
			});
		}
	}

	if (platform === 'ios' && !isAppleSize(width, height)) {
		problems.push({
			level: 'error',
			message:
				`${width}x${height} is not a size App Store Connect accepts. ` +
				'See APPLE_SCREENSHOT_SIZES.'
		});
	}

	return problems;
}

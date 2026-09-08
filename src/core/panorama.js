/**
 * Panorama compositions: one artwork sliced across several store tiles.
 *
 * A store listing scrolls horizontally, so a device photographed across two or
 * three tiles reads as one image when the tiles sit next to each other. Moksha
 * had a hand-built version of this — `split-left` and `split-right`, two
 * separate assets you had to keep in sync by hand. A spanning layout is the
 * general form: one asset entry, one composition, N tiles that cannot drift.
 *
 * Pure geometry and config here; the canvas work lives with each platform's
 * renderer, because only they can make an offscreen canvas.
 */

/**
 * The config to draw the whole composition with.
 *
 * Text sizes are fractions of the canvas width, and the composition canvas is
 * `span` times wider than a tile — so an untouched fontSize would come out
 * `span` times too large, and copy on a panorama would not match copy on the
 * tile beside it. Scaling by 1/span keeps type the same physical size across
 * the whole strip.
 *
 * @param {object} config — a normal render config
 * @param {number} span
 */
export function compositionConfig(config, span) {
	if (span <= 1) return config;
	return {
		...config,
		// The layout needs to know how wide the strip is, so it can size the
		// device off one tile rather than off the whole composition.
		span,
		textOverlays: (config.textOverlays ?? []).map((overlay) => ({
			...overlay,
			fontSize: (overlay.fontSize ?? 0.06) / span
		}))
	};
}

/**
 * Where tile [index] sits in a composition [span] tiles wide.
 *
 * @returns {{sx: number, sy: number, sw: number, sh: number}} source rectangle
 */
export function tileRect(index, span, tileWidth, tileHeight) {
	return { sx: index * tileWidth, sy: 0, sw: tileWidth, sh: tileHeight };
}

/**
 * How many tiles an asset covers: its own `span` when it sets one, else the
 * layout's. Clamped to a sane range — a typo should not try to allocate a
 * canvas a hundred tiles wide.
 */
export function resolveSpan(assetSpan, layoutSpan) {
	const span = Number(assetSpan ?? layoutSpan ?? 1);
	if (!Number.isFinite(span)) return 1;
	return Math.min(Math.max(Math.trunc(span), 1), 5);
}

/** The filenames a spanning asset produces, in store order. */
export function tileNames(id, span) {
	return span <= 1 ? [id] : Array.from({ length: span }, (_, i) => `${id}-${i + 1}`);
}

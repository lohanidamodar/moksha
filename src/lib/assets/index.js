/**
 * Asset type registry for Moksha.
 * Imports all asset modules and provides lookup helpers.
 */
import screenshotMockup from '$lib/assets/screenshot-mockup.js';
import featureGraphic from '$lib/assets/feature-graphic.js';
import promoBanner from '$lib/assets/promo-banner.js';
import appIconShowcase from '$lib/assets/app-icon-showcase.js';
import socialCard from '$lib/assets/social-card.js';

export const assetTypes = [
	screenshotMockup,
	featureGraphic,
	promoBanner,
	appIconShowcase,
	socialCard
];

/**
 * Find an asset type by its id.
 * @param {string} id
 * @returns {object | undefined}
 */
export function getAssetType(id) {
	return assetTypes.find((a) => a.id === id);
}

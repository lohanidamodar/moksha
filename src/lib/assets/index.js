/**
 * Asset type registry for Moksha.
 */
import iphoneScreenshot from '$lib/assets/iphone-screenshot.js';
import ipadScreenshot from '$lib/assets/ipad-screenshot.js';
import androidPhoneScreenshot from '$lib/assets/android-phone-screenshot.js';
import androidTabletScreenshot from '$lib/assets/android-tablet-screenshot.js';
import galaxyFoldScreenshot from '$lib/assets/galaxy-fold-screenshot.js';
import appleWatch from '$lib/assets/apple-watch.js';
import desktopScreenshot from '$lib/assets/desktop-screenshot.js';
import featureGraphic from '$lib/assets/feature-graphic.js';
import promoBanner from '$lib/assets/promo-banner.js';
import appIconShowcase from '$lib/assets/app-icon-showcase.js';
import socialCard from '$lib/assets/social-card.js';

export const assetTypes = [
	iphoneScreenshot,
	ipadScreenshot,
	appleWatch,
	androidPhoneScreenshot,
	androidTabletScreenshot,
	galaxyFoldScreenshot,
	desktopScreenshot,
	featureGraphic,
	promoBanner,
	appIconShowcase,
	socialCard
];

/** Find an asset type by its id. */
export function getAssetType(id) {
	return assetTypes.find((a) => a.id === id);
}

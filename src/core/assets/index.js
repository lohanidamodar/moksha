/**
 * Asset type registry for Moksha.
 */
import iphoneScreenshot from './iphone-screenshot.js';
import ipadScreenshot from './ipad-screenshot.js';
import androidPhoneScreenshot from './android-phone-screenshot.js';
import androidTabletScreenshot from './android-tablet-screenshot.js';
import featureGraphic from './feature-graphic.js';
import promoBanner from './promo-banner.js';
import appIconShowcase from './app-icon-showcase.js';
import socialCard from './social-card.js';

export const assetTypes = [
	iphoneScreenshot,
	ipadScreenshot,
	androidPhoneScreenshot,
	androidTabletScreenshot,
	featureGraphic,
	promoBanner,
	appIconShowcase,
	socialCard
];

/** Find an asset type by its id. */
export function getAssetType(id) {
	return assetTypes.find((a) => a.id === id);
}

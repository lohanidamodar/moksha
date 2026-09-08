import { renderScreenshot, SCREENSHOT_LAYOUTS, SCREENSHOT_INPUTS } from './_screenshot-shared.js';

export default {
	id: 'iphone-screenshot',
	label: 'iPhone Screenshot',
	icon: '📱',
	platform: 'ios',
	defaultPhoneFrame: 'iphone-dynamic-island',
	allowedPhoneFrames: [
		'iphone-dynamic-island',
		'iphone-dynamic-island-white',
		'iphone-dynamic-island-natural',
		'iphone-dynamic-island-gold',
		'iphone-notch',
		'iphone-notch-white',
		'frameless',
		'frameless-bordered'
	],
	sizes: [
		// 6.9" first: App Store Connect requires it for new iPhone submissions,
		// and the first entry is the default when a config omits sizeId.
		{ id: 'ios-6.9', label: 'iPhone 6.9" (1320x2868)', w: 1320, h: 2868, platform: 'ios', storeKind: 'screenshot' },
		{ id: 'ios-6.9-alt', label: 'iPhone 6.9" (1260x2736)', w: 1260, h: 2736, platform: 'ios', storeKind: 'screenshot' },
		{ id: 'ios-6.7', label: 'iPhone 6.7" (1290x2796)', w: 1290, h: 2796, platform: 'ios', storeKind: 'screenshot' },
		{ id: 'ios-6.5', label: 'iPhone 6.5" (1242x2688)', w: 1242, h: 2688, platform: 'ios', storeKind: 'screenshot' },
		{ id: 'ios-6.1', label: 'iPhone 6.1" (1284x2778)', w: 1284, h: 2778, platform: 'ios', storeKind: 'screenshot' },
		{ id: 'ios-5.5', label: 'iPhone 5.5" (1242x2208)', w: 1242, h: 2208, platform: 'ios', storeKind: 'screenshot' }
	],
	inputs: SCREENSHOT_INPUTS,
	layouts: SCREENSHOT_LAYOUTS,
	render: renderScreenshot
};

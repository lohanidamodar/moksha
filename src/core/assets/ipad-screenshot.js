import { renderScreenshot, SCREENSHOT_LAYOUTS, SCREENSHOT_INPUTS } from './_screenshot-shared.js';

export default {
	id: 'ipad-screenshot',
	label: 'iPad Screenshot',
	icon: '📲',
	platform: 'ios',
	defaultPhoneFrame: 'ipad',
	allowedPhoneFrames: ['ipad', 'ipad-silver', 'ipad-gold', 'frameless', 'frameless-bordered'],
	sizes: [
		// 13" first: required for new iPad submissions.
		{ id: 'ipad-13', label: 'iPad 13" (2064x2752)', w: 2064, h: 2752, platform: 'ios', storeKind: 'screenshot' },
		{ id: 'ipad-12.9', label: 'iPad Pro 12.9" (2048x2732)', w: 2048, h: 2732, platform: 'ios', storeKind: 'screenshot' },
		{ id: 'ipad-10.5', label: 'iPad 10.5" (1668x2224)', w: 1668, h: 2224, platform: 'ios', storeKind: 'screenshot' }
	],
	inputs: SCREENSHOT_INPUTS,
	layouts: SCREENSHOT_LAYOUTS,
	render: renderScreenshot
};

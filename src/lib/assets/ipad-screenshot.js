import { renderScreenshot, SCREENSHOT_LAYOUTS, SCREENSHOT_INPUTS } from './_screenshot-shared.js';

export default {
	id: 'ipad-screenshot',
	label: 'iPad Screenshot',
	icon: '📲',
	platform: 'ios',
	defaultPhoneFrame: 'ipad',
	allowedPhoneFrames: ['ipad', 'frameless'],
	sizes: [
		{ id: 'ipad-12.9', label: 'iPad Pro 12.9" (2048x2732)', w: 2048, h: 2732, platform: 'ios' },
		{ id: 'ipad-10.5', label: 'iPad 10.5" (1668x2224)', w: 1668, h: 2224, platform: 'ios' }
	],
	inputs: SCREENSHOT_INPUTS,
	layouts: SCREENSHOT_LAYOUTS,
	render: renderScreenshot
};

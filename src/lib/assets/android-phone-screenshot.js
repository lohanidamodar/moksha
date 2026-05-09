import { renderScreenshot, SCREENSHOT_LAYOUTS, SCREENSHOT_INPUTS } from './_screenshot-shared.js';

export default {
	id: 'android-phone-screenshot',
	label: 'Android Phone Screenshot',
	icon: '🤖',
	platform: 'android',
	defaultPhoneFrame: 'android-punch-hole',
	allowedPhoneFrames: ['android-punch-hole', 'android-clean', 'frameless'],
	sizes: [
		{ id: 'android-phone', label: 'Android Phone (1080x1920)', w: 1080, h: 1920, platform: 'android' }
	],
	inputs: SCREENSHOT_INPUTS,
	layouts: SCREENSHOT_LAYOUTS,
	render: renderScreenshot
};

import { renderScreenshot, SCREENSHOT_LAYOUTS, SCREENSHOT_INPUTS } from './_screenshot-shared.js';

export default {
	id: 'android-phone-screenshot',
	label: 'Android Phone Screenshot',
	icon: '🤖',
	platform: 'android',
	defaultPhoneFrame: 'android-punch-hole',
	allowedPhoneFrames: [
		'pixel',
		'pixel-black',
		'pixel-white',
		'galaxy',
		'galaxy-black',
		'galaxy-white',
		'oneplus',
		'android-waterdrop',
		'android-punch-hole',
		'android-clean',
		'floating',
		'frameless'
	],
	sizes: [
		{ id: 'android-phone', label: 'Android Phone (1080x1920)', w: 1080, h: 1920, platform: 'android' }
	],
	inputs: SCREENSHOT_INPUTS,
	layouts: SCREENSHOT_LAYOUTS,
	render: renderScreenshot
};

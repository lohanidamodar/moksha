import { renderScreenshot, getScreenshotPhoneRect, SCREENSHOT_LAYOUTS, SCREENSHOT_INPUTS } from './_screenshot-shared.js';

export default {
	id: 'android-tablet-screenshot',
	label: 'Android Tablet Screenshot',
	icon: '🟢',
	platform: 'android',
	defaultPhoneFrame: 'android-clean',
	allowedPhoneFrames: ['android-clean', 'android-punch-hole', 'galaxy', 'galaxy-black', 'galaxy-white', 'frameless', 'frameless-bordered'],
	sizes: [
		{ id: 'android-7inch', label: 'Android 7" Tablet (1200x1920)', w: 1200, h: 1920, platform: 'android' },
		{ id: 'android-10inch', label: 'Android 10" Tablet (1600x2560)', w: 1600, h: 2560, platform: 'android' }
	],
	inputs: SCREENSHOT_INPUTS,
	layouts: SCREENSHOT_LAYOUTS,
	render: renderScreenshot,
	getPhoneRect: getScreenshotPhoneRect
};

import { renderScreenshot, getScreenshotPhoneRect, SCREENSHOT_LAYOUTS, SCREENSHOT_INPUTS } from './_screenshot-shared.js';

export default {
	id: 'galaxy-fold-screenshot',
	label: 'Galaxy Z Fold Screenshot',
	icon: '📓',
	platform: 'android',
	defaultPhoneFrame: 'galaxy-fold',
	allowedPhoneFrames: ['galaxy-fold', 'frameless', 'frameless-bordered'],
	sizes: [
		{ id: 'fold-open', label: 'Z Fold Open (2208x1768)', w: 2208, h: 1768, platform: 'android' }
	],
	inputs: SCREENSHOT_INPUTS,
	layouts: SCREENSHOT_LAYOUTS,
	render: renderScreenshot,
	getPhoneRect: getScreenshotPhoneRect
};

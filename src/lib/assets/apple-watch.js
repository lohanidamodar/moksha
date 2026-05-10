import { renderScreenshot, getScreenshotPhoneRect, SCREENSHOT_LAYOUTS, SCREENSHOT_INPUTS } from './_screenshot-shared.js';

export default {
	id: 'apple-watch',
	label: 'Apple Watch Screenshot',
	icon: '⌚',
	platform: 'ios',
	defaultPhoneFrame: 'apple-watch',
	allowedPhoneFrames: ['apple-watch', 'apple-watch-titanium', 'frameless', 'frameless-bordered'],
	sizes: [
		{ id: 'watch-ultra-49', label: 'Watch Ultra 2 / S10 49mm (820x1004)', w: 820, h: 1004, platform: 'ios' },
		{ id: 'watch-46', label: 'Watch S10 46mm (792x968)', w: 792, h: 968, platform: 'ios' },
		{ id: 'watch-42', label: 'Watch S10 42mm (736x896)', w: 736, h: 896, platform: 'ios' }
	],
	inputs: SCREENSHOT_INPUTS,
	layouts: SCREENSHOT_LAYOUTS,
	render: renderScreenshot,
	getPhoneRect: getScreenshotPhoneRect
};

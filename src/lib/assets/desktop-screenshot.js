import { renderScreenshot, getScreenshotPhoneRect, SCREENSHOT_LAYOUTS, SCREENSHOT_INPUTS } from './_screenshot-shared.js';

export default {
	id: 'desktop-screenshot',
	label: 'Desktop Screenshot',
	icon: '💻',
	platform: 'desktop',
	defaultPhoneFrame: 'desktop-mac',
	allowedPhoneFrames: ['desktop-mac', 'desktop-windows', 'frameless', 'frameless-bordered'],
	sizes: [
		{ id: 'desktop-1280', label: 'Laptop 1280x800', w: 1280, h: 800, platform: 'desktop' },
		{ id: 'desktop-1440', label: 'MacBook Air 1440x900', w: 1440, h: 900, platform: 'desktop' },
		{ id: 'desktop-1920', label: 'Desktop 1920x1080', w: 1920, h: 1080, platform: 'desktop' },
		{ id: 'desktop-2560', label: 'Desktop 2560x1600', w: 2560, h: 1600, platform: 'desktop' }
	],
	inputs: SCREENSHOT_INPUTS,
	layouts: SCREENSHOT_LAYOUTS,
	render: renderScreenshot,
	getPhoneRect: getScreenshotPhoneRect
};

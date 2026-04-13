/**
 * App Store Preview — iOS-specific screenshot sizes, reuses screenshot-mockup rendering.
 */
import { renderScreenshotMockup } from '$lib/assets/screenshot-mockup.js';

export default {
	id: 'app-store-preview',
	label: 'App Store Preview',
	icon: '\ud83c\udf4e',
	sizes: [
		{ id: 'ios-6.7', label: 'iOS 6.7" (1290x2796)', w: 1290, h: 2796, platform: 'ios' },
		{ id: 'ios-6.5', label: 'iOS 6.5" (1242x2688)', w: 1242, h: 2688, platform: 'ios' },
		{ id: 'ios-6.1', label: 'iOS 6.1" (1284x2778)', w: 1284, h: 2778, platform: 'ios' }
	],
	inputs: [
		{ id: 'screenshot', type: 'image', label: 'Screenshot', placeholder: 'Upload a screenshot' },
		{ id: 'title', type: 'text', label: 'Title', placeholder: 'Your App Name' },
		{ id: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Subtitle text' }
	],
	layouts: [
		{ id: 'tilt-right', label: 'Tilt Right' },
		{ id: 'left-title', label: 'Left Title' },
		{ id: 'float-up', label: 'Float Up' },
		{ id: 'tilt-left', label: 'Tilt Left' },
		{ id: 'right-title', label: 'Right Title' },
		{ id: 'bottom-emerge', label: 'Bottom Emerge' },
		{ id: 'perspective', label: 'Perspective' },
		{ id: 'hero-center', label: 'Hero Center' }
	],
	render: renderScreenshotMockup
};

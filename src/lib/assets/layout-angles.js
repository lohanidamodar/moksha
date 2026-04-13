/**
 * Returns the default phone angle for a given screenshot-mockup layout.
 * Used by TransformControls to show the actual rotation value.
 */
const LAYOUT_ANGLES = {
	'tilt-right': 12,
	'left-title': 0,
	'float-up': 0,
	'tilt-left': -12,
	'right-title': 0,
	'bottom-emerge': 0,
	'perspective': 5,
	'hero-center': 0,
	'split-left': 0,
	'split-right': 0
};

export function getDefaultPhoneAngle(layoutId) {
	return LAYOUT_ANGLES[layoutId] ?? 0;
}

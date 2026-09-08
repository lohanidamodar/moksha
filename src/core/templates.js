/**
 * Templates: the rhythm of a whole strip, rather than a choice per tile.
 *
 * A store listing is read by scrolling, and five tiles in the same layout read
 * as a spreadsheet. A template is a sequence of layouts applied to an asset
 * type's assets in order, so the set has a shape without anyone choosing one
 * tile at a time. Shorter than the set, it repeats.
 *
 * Applied per asset type: the iPhone strip and the Android strip are separate
 * listings in separate stores, so each starts the rhythm from the beginning.
 */

export const TEMPLATES = {
	uniform: {
		id: 'uniform',
		label: 'Uniform',
		description: 'Every tile in the project’s one layout.',
		sequence: []
	},
	editorial: {
		id: 'editorial',
		label: 'Editorial',
		description: 'A hero opener, then a tilt, a left-titled tile, a breather and a counter-tilt.',
		sequence: ['hero-center', 'tilt-right', 'left-title', 'float-up', 'tilt-left']
	},
	showcase: {
		id: 'showcase',
		label: 'Showcase',
		description: 'Hero first, then alternating tilts around a right-titled tile.',
		sequence: ['hero-center', 'tilt-right', 'right-title', 'tilt-left', 'bottom-emerge']
	},
	magazine: {
		id: 'magazine',
		label: 'Magazine',
		description: 'Titled tiles alternating with big devices.',
		sequence: ['left-title', 'bottom-emerge', 'right-title', 'hero-center', 'float-up']
	},
	dynamic: {
		id: 'dynamic',
		label: 'Dynamic',
		description: 'Everything in motion: tilts and perspective, resolving on a hero.',
		sequence: ['tilt-right', 'perspective', 'tilt-left', 'bottom-emerge', 'hero-center']
	},
	panoramic: {
		id: 'panoramic',
		label: 'Panoramic',
		description: 'Opens on a two-tile panorama, then settles into single tiles.',
		// The opener covers two store tiles from one composition.
		sequence: ['panorama', 'hero-center', 'tilt-right', 'float-up']
	}
};

export const TEMPLATE_IDS = Object.keys(TEMPLATES);

export function isTemplateId(id) {
	return Object.hasOwn(TEMPLATES, id);
}

/**
 * The layout sequence a template choice means.
 *
 * A choice is either a built-in id or an explicit array of layout ids, so a
 * project that wants its own rhythm does not need one added here.
 *
 * @param {string | string[] | undefined} choice
 * @returns {string[]}
 */
export function templateSequence(choice) {
	if (!choice) return [];
	if (Array.isArray(choice)) return choice;
	return TEMPLATES[choice]?.sequence ?? [];
}

/**
 * The layout the template gives the asset at [position] within its type.
 *
 * @returns {string | undefined} undefined when no template applies, so the
 *   caller falls through to the project default and then the asset type's own.
 */
export function templateLayout(choice, position) {
	const sequence = templateSequence(choice);
	return sequence.length ? sequence[position % sequence.length] : undefined;
}

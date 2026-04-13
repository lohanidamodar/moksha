import { customLayouts } from '$lib/stores/customLayouts.svelte.js';

const DEFAULT_TRANSFORM = { phone: { x: 0, y: 0, scale: 1, rotation: null }, logo: { x: 0, y: 0, scale: 1, rotation: null } };

/**
 * Resolves a layout id to { baseLayout, transforms }.
 * For built-in layouts, baseLayout is the id itself and transforms come from the editor.
 * For custom layouts, baseLayout is the saved base, and transforms merge saved + editor overrides.
 */
export function resolveLayout(layoutId, editorTransforms) {
	if (layoutId.startsWith('custom_')) {
		const custom = customLayouts.getById(layoutId);
		if (custom) {
			const saved = custom.transforms ?? DEFAULT_TRANSFORM;
			return {
				baseLayout: custom.baseLayout,
				transforms: {
					phone: {
						x: saved.phone.x + (editorTransforms?.phone?.x ?? 0),
						y: saved.phone.y + (editorTransforms?.phone?.y ?? 0),
						scale: saved.phone.scale * (editorTransforms?.phone?.scale ?? 1),
						rotation: editorTransforms?.phone?.rotation ?? saved.phone.rotation ?? null
					},
					logo: {
						x: saved.logo.x + (editorTransforms?.logo?.x ?? 0),
						y: saved.logo.y + (editorTransforms?.logo?.y ?? 0),
						scale: saved.logo.scale * (editorTransforms?.logo?.scale ?? 1),
						rotation: editorTransforms?.logo?.rotation ?? saved.logo.rotation ?? null
					}
				}
			};
		}
	}
	return {
		baseLayout: layoutId,
		transforms: editorTransforms ?? DEFAULT_TRANSFORM
	};
}

const DEFAULT_TRANSFORM = { phone: { x: 0, y: 0, scale: 1, rotation: null }, logo: { x: 0, y: 0, scale: 1, rotation: null } };

const DEFAULTS = {
	assetType: 'iphone-screenshot',
	sizeId: null,
	layout: 'tilt-right',
	background: { type: 'gradient', id: 'sunset-pink' },
	pattern: null,
	texts: { title: '', subtitle: '' },
	fonts: { title: 'Montserrat', subtitle: 'Open Sans' },
	phoneFrame: 'iphone-dynamic-island',
	images: { screenshot: null },
	editingQueueId: null
};

/** Build a key for the transforms map that combines layout and size */
export function transformKey(layout, sizeId) {
	return `${layout}::${sizeId ?? '_default_'}`;
}

class EditorState {
	assetType = $state(DEFAULTS.assetType);
	sizeId = $state(DEFAULTS.sizeId);
	layout = $state(DEFAULTS.layout);
	background = $state({ ...DEFAULTS.background });
	pattern = $state(DEFAULTS.pattern);
	texts = $state({ ...DEFAULTS.texts });
	fonts = $state({ ...DEFAULTS.fonts });
	phoneFrame = $state(DEFAULTS.phoneFrame);
	// Keyed by `${layout}::${sizeId}` — each layout+size combo has its own transforms
	layoutTransforms = $state({});
	images = $state({ ...DEFAULTS.images });
	editingQueueId = $state(DEFAULTS.editingQueueId);

	/** Get transforms for a specific layout + size combination */
	getTransforms(layoutId, sizeId = this.sizeId) {
		return this.layoutTransforms[transformKey(layoutId, sizeId)] ?? DEFAULT_TRANSFORM;
	}

	/** Set a transform value for the current layout + size */
	setTransform(element, prop, value) {
		const key = transformKey(this.layout, this.sizeId);
		if (!this.layoutTransforms[key]) {
			this.layoutTransforms[key] = structuredClone(DEFAULT_TRANSFORM);
		}
		this.layoutTransforms[key][element][prop] = value;
	}

	/** Reset transforms for the current layout + size only */
	resetCurrentTransforms() {
		const key = transformKey(this.layout, this.sizeId);
		this.layoutTransforms[key] = structuredClone(DEFAULT_TRANSFORM);
	}

	/** Reset all transforms */
	resetAllTransforms() {
		this.layoutTransforms = {};
	}

	reset() {
		this.assetType = DEFAULTS.assetType;
		this.sizeId = DEFAULTS.sizeId;
		this.layout = DEFAULTS.layout;
		this.background = { ...DEFAULTS.background };
		this.pattern = DEFAULTS.pattern;
		this.texts = { ...DEFAULTS.texts };
		this.fonts = { ...DEFAULTS.fonts };
		this.phoneFrame = DEFAULTS.phoneFrame;
		this.layoutTransforms = {};
		this.images = { ...DEFAULTS.images };
		this.editingQueueId = DEFAULTS.editingQueueId;
	}

	loadFromQueue(item) {
		this.assetType = item.assetType;
		this.sizeId = item.sizeId ?? null;
		this.layout = item.layout;
		this.background = { ...item.background };
		this.pattern = item.pattern ? { ...item.pattern } : null;
		this.texts = { ...item.texts };
		this.fonts = { ...(item.fonts ?? DEFAULTS.fonts) };
		this.phoneFrame = item.phoneFrame ?? DEFAULTS.phoneFrame;
		// Restore layoutTransforms — handle both old (per-layout) and new (per-layout+size) shapes
		if (item.layoutTransforms) {
			this.layoutTransforms = structuredClone(item.layoutTransforms);
		} else if (item.transforms) {
			this.layoutTransforms = { [transformKey(item.layout, item.sizeId)]: structuredClone(item.transforms) };
		} else {
			this.layoutTransforms = {};
		}
		this.images = { ...item.images };
		this.editingQueueId = item.id;
	}
}

export const editor = new EditorState();

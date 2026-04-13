const DEFAULT_TRANSFORM = { phone: { x: 0, y: 0, scale: 1 }, logo: { x: 0, y: 0, scale: 1 } };

const DEFAULTS = {
	assetType: 'screenshot-mockup',
	sizeId: null,
	layout: 'tilt-right',
	background: { type: 'gradient', id: 'sunset-pink' },
	texts: { title: '', subtitle: '' },
	fonts: { title: 'Montserrat', subtitle: 'Open Sans' },
	images: { screenshot: null },
	editingQueueId: null
};

class EditorState {
	assetType = $state(DEFAULTS.assetType);
	sizeId = $state(DEFAULTS.sizeId);
	layout = $state(DEFAULTS.layout);
	background = $state({ ...DEFAULTS.background });
	texts = $state({ ...DEFAULTS.texts });
	fonts = $state({ ...DEFAULTS.fonts });
	layoutTransforms = $state({});
	images = $state({ ...DEFAULTS.images });
	editingQueueId = $state(DEFAULTS.editingQueueId);

	/** Get transforms for a specific layout */
	getTransforms(layoutId) {
		return this.layoutTransforms[layoutId] ?? DEFAULT_TRANSFORM;
	}

	/** Set a transform value for the current layout */
	setTransform(element, prop, value) {
		if (!this.layoutTransforms[this.layout]) {
			this.layoutTransforms[this.layout] = structuredClone(DEFAULT_TRANSFORM);
		}
		this.layoutTransforms[this.layout][element][prop] = value;
	}

	/** Reset transforms for the current layout only */
	resetCurrentTransforms() {
		this.layoutTransforms[this.layout] = structuredClone(DEFAULT_TRANSFORM);
	}

	/** Reset all layout transforms */
	resetAllTransforms() {
		this.layoutTransforms = {};
	}

	reset() {
		this.assetType = DEFAULTS.assetType;
		this.sizeId = DEFAULTS.sizeId;
		this.layout = DEFAULTS.layout;
		this.background = { ...DEFAULTS.background };
		this.texts = { ...DEFAULTS.texts };
		this.fonts = { ...DEFAULTS.fonts };
		this.layoutTransforms = {};
		this.images = { ...DEFAULTS.images };
		this.editingQueueId = DEFAULTS.editingQueueId;
	}

	loadFromQueue(item) {
		this.assetType = item.assetType;
		this.sizeId = item.sizeId ?? null;
		this.layout = item.layout;
		this.background = { ...item.background };
		this.texts = { ...item.texts };
		this.fonts = { ...(item.fonts ?? DEFAULTS.fonts) };
		this.layoutTransforms = item.layoutTransforms
			? structuredClone(item.layoutTransforms)
			: (item.transforms ? { [item.layout]: structuredClone(item.transforms) } : {});
		this.images = { ...item.images };
		this.editingQueueId = item.id;
	}
}

export const editor = new EditorState();

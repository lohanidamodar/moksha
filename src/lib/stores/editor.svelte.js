const DEFAULTS = {
	assetType: 'screenshot-mockup',
	sizeId: null,  // null = use first size of the asset type
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
	images = $state({ ...DEFAULTS.images });
	editingQueueId = $state(DEFAULTS.editingQueueId);

	reset() {
		this.assetType = DEFAULTS.assetType;
		this.sizeId = DEFAULTS.sizeId;
		this.layout = DEFAULTS.layout;
		this.background = { ...DEFAULTS.background };
		this.texts = { ...DEFAULTS.texts };
		this.fonts = { ...DEFAULTS.fonts };
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
		this.images = { ...item.images };
		this.editingQueueId = item.id;
	}
}

export const editor = new EditorState();

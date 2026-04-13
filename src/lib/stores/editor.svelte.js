const DEFAULTS = {
	assetType: 'screenshot-mockup',
	layout: 'tilt-right',
	background: { type: 'gradient', id: 'sunset-pink' },
	texts: { title: '', subtitle: '' },
	images: { screenshot: null },
	editingQueueId: null
};

class EditorState {
	assetType = $state(DEFAULTS.assetType);
	layout = $state(DEFAULTS.layout);
	background = $state({ ...DEFAULTS.background });
	texts = $state({ ...DEFAULTS.texts });
	images = $state({ ...DEFAULTS.images });
	editingQueueId = $state(DEFAULTS.editingQueueId);

	reset() {
		this.assetType = DEFAULTS.assetType;
		this.layout = DEFAULTS.layout;
		this.background = { ...DEFAULTS.background };
		this.texts = { ...DEFAULTS.texts };
		this.images = { ...DEFAULTS.images };
		this.editingQueueId = DEFAULTS.editingQueueId;
	}

	loadFromQueue(item) {
		this.assetType = item.assetType;
		this.layout = item.layout;
		this.background = { ...item.background };
		this.texts = { ...item.texts };
		this.images = { ...item.images };
		this.editingQueueId = item.id;
	}
}

export const editor = new EditorState();

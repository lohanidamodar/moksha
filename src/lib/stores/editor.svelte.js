const DEFAULT_TRANSFORM = { phone: { x: 0, y: 0, scale: 1, rotation: null }, logo: { x: 0, y: 0, scale: 1, rotation: null } };

const DEFAULTS = {
	assetType: 'iphone-screenshot',
	sizeId: null,
	layout: 'tilt-right',
	background: { type: 'gradient', id: 'sunset-pink' },
	pattern: null,
	phoneFrame: 'iphone-dynamic-island',
	images: { screenshot: null },
	textOverlays: [],
	selectedOverlayId: null,
	editingQueueId: null
};

const HISTORY_LIMIT = 50;
const HISTORY_FIELDS = [
	'assetType', 'sizeId', 'layout', 'background', 'pattern',
	'phoneFrame', 'layoutTransforms', 'images', 'textOverlays',
	'selectedOverlayId', 'editingQueueId'
];

let _overlayCounter = 0;
function nextOverlayId() {
	_overlayCounter += 1;
	return `t_${Date.now().toString(36)}_${_overlayCounter}`;
}

/** Default overlay shape — x/y are 0..1 fractions of canvas; fontSize is fraction of canvas width. */
function defaultOverlay(overrides = {}) {
	return {
		id: nextOverlayId(),
		text: 'Text',
		x: 0.5,
		y: 0.5,
		fontSize: 0.06,
		font: 'Montserrat',
		weight: 700,
		color: null,
		align: 'center',
		rotation: 0,
		shadow: true,
		...overrides
	};
}

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
	phoneFrame = $state(DEFAULTS.phoneFrame);
	// Keyed by `${layout}::${sizeId}` — each layout+size combo has its own transforms
	layoutTransforms = $state({});
	images = $state({ ...DEFAULTS.images });
	textOverlays = $state([]);
	selectedOverlayId = $state(null);
	editingQueueId = $state(DEFAULTS.editingQueueId);
	// Selection target on canvas: 'phone' or null (text uses selectedOverlayId)
	selectedElement = $state(null);

	canUndo = $state(false);
	canRedo = $state(false);
	#history = [];
	#historyIndex = -1;
	#applying = false;

	constructor() {
		this.commit();
	}

	addOverlay(overrides = {}) {
		const overlay = defaultOverlay(overrides);
		this.textOverlays.push(overlay);
		this.selectedOverlayId = overlay.id;
		this.selectedElement = null;
		return overlay;
	}

	updateOverlay(id, patch) {
		const idx = this.textOverlays.findIndex((o) => o.id === id);
		if (idx === -1) return;
		this.textOverlays[idx] = { ...this.textOverlays[idx], ...patch };
	}

	removeOverlay(id) {
		this.textOverlays = this.textOverlays.filter((o) => o.id !== id);
		if (this.selectedOverlayId === id) this.selectedOverlayId = null;
	}

	duplicateOverlay(id) {
		const src = this.textOverlays.find((o) => o.id === id);
		if (!src) return null;
		const copy = { ...structuredClone(src), id: nextOverlayId(), x: (src.x ?? 0.5) + 0.04, y: (src.y ?? 0.5) + 0.04, anchor: undefined };
		this.textOverlays.push(copy);
		this.selectedOverlayId = copy.id;
		return copy;
	}

	getSelectedOverlay() {
		return this.textOverlays.find((o) => o.id === this.selectedOverlayId) ?? null;
	}

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
		this.phoneFrame = DEFAULTS.phoneFrame;
		this.layoutTransforms = {};
		this.images = { ...DEFAULTS.images };
		this.textOverlays = [];
		this.selectedOverlayId = null;
		this.selectedElement = null;
		this.editingQueueId = DEFAULTS.editingQueueId;
	}

	loadFromQueue(item) {
		this.assetType = item.assetType;
		this.sizeId = item.sizeId ?? null;
		this.layout = item.layout;
		this.background = { ...item.background };
		this.pattern = item.pattern ? { ...item.pattern } : null;
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
		this.textOverlays = item.textOverlays ? structuredClone(item.textOverlays) : [];
		this.selectedOverlayId = null;
		this.selectedElement = null;
		this.editingQueueId = item.id;
	}

	#snapshot() {
		const out = {};
		for (const k of HISTORY_FIELDS) out[k] = $state.snapshot(this[k]);
		return out;
	}

	#restore(snap) {
		this.#applying = true;
		try {
			for (const k of HISTORY_FIELDS) this[k] = structuredClone(snap[k]);
		} finally {
			this.#applying = false;
		}
	}

	/**
	 * Record the current state as an undo checkpoint.
	 * Call this AFTER a user-meaningful change (drag end, slider commit, click pick).
	 * No-op while undo/redo is replaying state.
	 */
	commit() {
		if (this.#applying) return;
		const snap = this.#snapshot();
		const top = this.#history[this.#historyIndex];
		if (top && JSON.stringify(top) === JSON.stringify(snap)) return;
		// Drop the redo branch
		if (this.#historyIndex < this.#history.length - 1) {
			this.#history.length = this.#historyIndex + 1;
		}
		this.#history.push(snap);
		this.#historyIndex = this.#history.length - 1;
		// Cap history size from the bottom
		if (this.#history.length > HISTORY_LIMIT) {
			this.#history.shift();
			this.#historyIndex--;
		}
		this.#updateFlags();
	}

	undo() {
		if (this.#historyIndex <= 0) return;
		this.#historyIndex--;
		this.#restore(this.#history[this.#historyIndex]);
		this.#updateFlags();
	}

	redo() {
		if (this.#historyIndex >= this.#history.length - 1) return;
		this.#historyIndex++;
		this.#restore(this.#history[this.#historyIndex]);
		this.#updateFlags();
	}

	#updateFlags() {
		this.canUndo = this.#historyIndex > 0;
		this.canRedo = this.#historyIndex < this.#history.length - 1;
	}
}

export const editor = new EditorState();

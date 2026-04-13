const STORAGE_KEY = 'moksha_custom_layouts';

function loadFromStorage() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveToStorage(items) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	} catch {
		// storage full or unavailable
	}
}

/**
 * Custom layout shape:
 * {
 *   id: 'custom_123',
 *   label: 'My Layout',
 *   assetType: 'screenshot-mockup',
 *   baseLayout: 'tilt-right',
 *   transforms: { phone: { x, y, scale }, logo: { x, y, scale } }
 * }
 */
class CustomLayoutsState {
	items = $state([]);

	constructor() {
		if (typeof window !== 'undefined') {
			this.items = loadFromStorage();
		}
	}

	_save() {
		saveToStorage(this.items);
	}

	/** Get custom layouts for a specific asset type */
	getByAssetType(assetTypeId) {
		return this.items.filter((l) => l.assetType === assetTypeId);
	}

	/** Get a custom layout by id */
	getById(id) {
		return this.items.find((l) => l.id === id);
	}

	/** Duplicate an existing layout (built-in or custom) with current transforms */
	duplicate(label, assetType, baseLayout, transforms) {
		const item = {
			id: `custom_${Date.now()}`,
			label,
			assetType,
			baseLayout,
			transforms: structuredClone(transforms)
		};
		this.items.push(item);
		this._save();
		return item.id;
	}

	/** Update a custom layout's label or transforms */
	update(id, changes) {
		const idx = this.items.findIndex((l) => l.id === id);
		if (idx !== -1) {
			this.items[idx] = { ...this.items[idx], ...changes };
			this._save();
		}
	}

	/** Remove a custom layout */
	remove(id) {
		this.items = this.items.filter((l) => l.id !== id);
		this._save();
	}
}

export const customLayouts = new CustomLayoutsState();

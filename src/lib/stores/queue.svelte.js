class QueueState {
	items = $state([]);
	count = $derived(this.items.length);

	add(item) {
		this.items.push({
			id: `q_${Date.now()}`,
			assetType: item.assetType,
			layout: item.layout,
			background: { ...item.background },
			texts: { ...item.texts },
			images: { ...item.images },
			thumbnail: item.thumbnail ?? null,
			createdAt: new Date()
		});
	}

	remove(id) {
		this.items = this.items.filter((item) => item.id !== id);
	}

	update(id, config) {
		const idx = this.items.findIndex((item) => item.id === id);
		if (idx !== -1) {
			this.items[idx] = { ...this.items[idx], ...config };
		}
	}

	duplicate(id) {
		const source = this.getById(id);
		if (!source) return;
		this.items.push({
			...source,
			id: `q_${Date.now()}`,
			background: { ...source.background },
			texts: { ...source.texts },
			images: { ...source.images },
			createdAt: new Date()
		});
	}

	clear() {
		this.items = [];
	}

	getById(id) {
		return this.items.find((item) => item.id === id);
	}
}

export const queue = new QueueState();

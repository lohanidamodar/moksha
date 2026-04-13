class ImageLibraryState {
	/** @type {Array<{ id: string, name: string, src: string, img: HTMLImageElement, category: string }>} */
	items = $state([]);

	screenshots = $derived(this.items.filter((i) => i.category === 'screenshot'));
	logos = $derived(this.items.filter((i) => i.category === 'logo' || i.category === 'icon'));

	/**
	 * Add one or more image files to the library.
	 * @param {FileList | File[]} files
	 * @param {string} category - 'screenshot' | 'logo' | 'icon'
	 * @returns {Promise<Array<{ id: string, img: HTMLImageElement }>>}
	 */
	async addFiles(files, category) {
		const results = [];
		for (const file of files) {
			const entry = await this._loadFile(file, category);
			if (entry) {
				this.items.push(entry);
				results.push({ id: entry.id, img: entry.img });
			}
		}
		return results;
	}

	/** @param {string} id */
	remove(id) {
		const item = this.items.find((i) => i.id === id);
		if (item) URL.revokeObjectURL(item.src);
		this.items = this.items.filter((i) => i.id !== id);
	}

	/** @param {string} id */
	getById(id) {
		return this.items.find((i) => i.id === id);
	}

	/**
	 * Get all items matching a category.
	 * @param {string} category
	 */
	getByCategory(category) {
		// logo and icon share the same pool
		if (category === 'logo' || category === 'icon') {
			return this.items.filter((i) => i.category === 'logo' || i.category === 'icon');
		}
		return this.items.filter((i) => i.category === category);
	}

	/** @param {File} file @param {string} category */
	_loadFile(file, category) {
		return new Promise((resolve) => {
			const src = URL.createObjectURL(file);
			const img = new Image();
			img.onload = () => {
				resolve({
					id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
					name: file.name,
					src,
					img,
					category
				});
			};
			img.onerror = () => {
				URL.revokeObjectURL(src);
				resolve(null);
			};
			img.src = src;
		});
	}
}

export const imageLibrary = new ImageLibraryState();

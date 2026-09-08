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
				results.push(entry);
			}
		}
		return results;
	}

	/**
	 * Record where an entry lives in the project.
	 *
	 * A picked file is a blob the browser owns and the CLI cannot see; once it
	 * has been written into the project, the entry carries the path so
	 * selecting it can put that path in the asset.
	 */
	setRef(id, ref) {
		const item = this.items.find((i) => i.id === id);
		if (item) item.ref = ref;
	}

	/**
	 * Add an image the project already references, by URL.
	 *
	 * Reuses an entry already loaded from the same URL, so re-opening an asset
	 * or switching locale does not pile up duplicates of the same capture.
	 *
	 * @param {string} url
	 * @param {string} name
	 * @param {string} category
	 */
	async addFromUrl(url, name, category, ref = name) {
		const existing = this.items.find((i) => i.src === url);
		if (existing) return existing;

		const entry = await new Promise((resolve) => {
			const img = new Image();
			img.onload = () =>
				resolve({
					id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
					name,
					src: url,
					img,
					category,
					ref
				});
			img.onerror = () => resolve(null);
			img.src = url;
		});

		if (entry) this.items.push(entry);
		return entry;
	}

	/** @param {string} id */
	remove(id) {
		const item = this.items.find((i) => i.id === id);
		// Only blob URLs this store made need revoking; a project image is a
		// plain URL the server serves.
		if (item?.src.startsWith('blob:')) URL.revokeObjectURL(item.src);
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

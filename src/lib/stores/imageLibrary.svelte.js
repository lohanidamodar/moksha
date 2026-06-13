import { ID, Permission, Role, Query } from 'appwrite';
import {
	getDatabases,
	getStorage,
	getFileViewURL,
	DATABASE_ID,
	ASSETS_COLLECTION,
	BUCKET_ID
} from '$lib/appwrite/client.js';
import { auth } from './auth.svelte.js';

class ImageLibraryState {
	/** @type {Array<{ id: string, name: string, src: string, img: HTMLImageElement, category: string, fileId?: string, projectId?: string, _objectUrl?: boolean }>} */
	items = $state([]);

	screenshots = $derived(this.items.filter((i) => i.category === 'screenshot'));
	logos = $derived(this.items.filter((i) => i.category === 'logo' || i.category === 'icon'));

	/**
	 * Add one or more image files to the library. If a project is active and the user
	 * is signed in, uploads them to Appwrite Storage and creates asset records.
	 *
	 * @param {FileList | File[]} files
	 * @param {string} category - 'screenshot' | 'logo' | 'icon'
	 * @param {string|null} projectId - if set, persist to Appwrite under this project
	 * @returns {Promise<Array<{ id: string, img: HTMLImageElement }>>}
	 */
	async addFiles(files, category, projectId = null) {
		const results = [];
		const persist = !!(projectId && auth.user);
		for (const file of files) {
			const entry = await this._loadFile(file, category);
			if (!entry) continue;

			if (persist) {
				try {
					const userId = auth.user.$id;
					const fileRes = await getStorage().createFile(BUCKET_ID, ID.unique(), file, [
						Permission.read(Role.user(userId)),
						Permission.update(Role.user(userId)),
						Permission.delete(Role.user(userId))
					]);
					const doc = await getDatabases().createDocument(
						DATABASE_ID,
						ASSETS_COLLECTION,
						ID.unique(),
						{
							projectId,
							ownerId: userId,
							category,
							fileId: fileRes.$id,
							name: file.name,
							mimeType: file.type
						},
						[
							Permission.read(Role.user(userId)),
							Permission.update(Role.user(userId)),
							Permission.delete(Role.user(userId))
						]
					);
					entry.id = doc.$id;
					entry.fileId = fileRes.$id;
					entry.projectId = projectId;
				} catch (err) {
					console.error('Failed to persist image to Appwrite', err);
				}
			}

			this.items.push(entry);
			results.push({ id: entry.id, img: entry.img });
		}
		return results;
	}

	/** @param {string} id */
	async remove(id) {
		const item = this.items.find((i) => i.id === id);
		if (!item) return;
		if (item._objectUrl) URL.revokeObjectURL(item.src);
		this.items = this.items.filter((i) => i.id !== id);
		if (item.fileId && auth.user) {
			try {
				await getDatabases().deleteDocument(DATABASE_ID, ASSETS_COLLECTION, id);
				await getStorage().deleteFile(BUCKET_ID, item.fileId);
			} catch (err) {
				console.error('Failed to delete image from Appwrite', err);
			}
		}
	}

	/** @param {string} id */
	getById(id) {
		return this.items.find((i) => i.id === id);
	}

	/** Lookup the library entry id for a given HTMLImageElement (used when persisting). */
	getIdByImg(img) {
		if (!img) return null;
		const found = this.items.find((i) => i.img === img);
		return found ? found.id : null;
	}

	/** Get all items matching a category. */
	getByCategory(category) {
		// logo and icon share the same pool
		if (category === 'logo' || category === 'icon') {
			return this.items.filter((i) => i.category === 'logo' || i.category === 'icon');
		}
		return this.items.filter((i) => i.category === category);
	}

	/** Replace local image entries with the assets stored for this project. */
	async loadFromProject(projectId) {
		if (!auth.user || !projectId) return;
		try {
			const res = await getDatabases().listDocuments(DATABASE_ID, ASSETS_COLLECTION, [
				Query.equal('projectId', projectId),
				Query.equal('ownerId', auth.user.$id),
				Query.orderAsc('$createdAt'),
				Query.limit(500)
			]);
			const loaded = await Promise.all(
				res.documents.map((doc) => this._loadRemote(doc))
			);
			for (const entry of loaded) {
				if (entry) this.items.push(entry);
			}
		} catch (err) {
			console.error('Failed to load project assets', err);
		}
	}

	clear() {
		for (const item of this.items) {
			if (item._objectUrl) URL.revokeObjectURL(item.src);
		}
		this.items = [];
	}

	/** @param {File} file @param {string} category */
	_loadFile(file, category) {
		return new Promise((resolve) => {
			const src = URL.createObjectURL(file);
			const img = new Image();
			img.onload = () => {
				resolve({
					id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
					name: file.name,
					src,
					img,
					category,
					_objectUrl: true
				});
			};
			img.onerror = () => {
				URL.revokeObjectURL(src);
				resolve(null);
			};
			img.src = src;
		});
	}

	_loadRemote(doc) {
		return new Promise((resolve) => {
			const src = getFileViewURL(doc.fileId);
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => {
				resolve({
					id: doc.$id,
					name: doc.name,
					src,
					img,
					category: doc.category,
					fileId: doc.fileId,
					projectId: doc.projectId,
					_objectUrl: false
				});
			};
			img.onerror = () => resolve(null);
			img.src = src;
		});
	}
}

export const imageLibrary = new ImageLibraryState();

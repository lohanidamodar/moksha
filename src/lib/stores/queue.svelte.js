import { ID, Permission, Role, Query } from 'appwrite';
import {
	getDatabases,
	DATABASE_ID,
	DESIGNS_COLLECTION
} from '$lib/appwrite/client.js';
import { auth } from './auth.svelte.js';
import { imageLibrary } from './imageLibrary.svelte.js';

/**
 * Build the JSON config blob for an item — everything except project / asset / layout
 * top-level fields (which we store as separate columns for nicer queries / sort).
 */
function configForItem(item) {
	return {
		background: item.background,
		pattern: item.pattern ?? null,
		phoneFrame: item.phoneFrame,
		layoutTransforms: item.layoutTransforms ?? null,
		transforms: item.transforms ?? null,
		imageRefs: item.imageRefs ?? {},
		textOverlays: item.textOverlays ?? []
	};
}

/** Convert editor.images (HTMLImageElement values) into refs by image library id. */
function imagesToRefs(images) {
	const refs = {};
	for (const [key, img] of Object.entries(images || {})) {
		if (!img) continue;
		const id = imageLibrary.getIdByImg(img);
		if (id) refs[key] = id;
	}
	return refs;
}

/** Reverse of imagesToRefs: resolve refs back to HTMLImageElement objects via the library. */
function refsToImages(refs) {
	const out = {};
	for (const [key, id] of Object.entries(refs || {})) {
		const entry = imageLibrary.getById(id);
		if (entry) out[key] = entry.img;
	}
	return out;
}

class QueueState {
	items = $state([]);
	count = $derived(this.items.length);
	loading = $state(false);

	add(item) {
		const imageRefs = item.imageRefs ?? imagesToRefs(item.images);
		const local = {
			id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
			assetType: item.assetType,
			sizeId: item.sizeId ?? null,
			layout: item.layout,
			background: { ...item.background },
			pattern: item.pattern ? { ...item.pattern } : null,
			phoneFrame: item.phoneFrame ?? 'iphone-dynamic-island',
			transforms: item.transforms ?? undefined,
			layoutTransforms: item.layoutTransforms ?? undefined,
			images: { ...item.images },
			imageRefs,
			textOverlays: item.textOverlays ? structuredClone(item.textOverlays) : [],
			thumbnail: item.thumbnail ?? null,
			createdAt: new Date()
		};
		this.items.push(local);
		this._persistAdd(local);
	}

	remove(id) {
		this.items = this.items.filter((item) => item.id !== id);
		this._persistRemove(id);
	}

	update(id, config) {
		const idx = this.items.findIndex((item) => item.id === id);
		if (idx === -1) return;
		const merged = {
			...this.items[idx],
			...config,
			imageRefs: config.imageRefs ?? imagesToRefs(config.images ?? this.items[idx].images)
		};
		this.items[idx] = merged;
		this._persistUpdate(merged);
	}

	duplicate(id) {
		const source = this.getById(id);
		if (!source) return;
		const copy = {
			...source,
			id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
			background: { ...source.background },
			images: { ...source.images },
			imageRefs: { ...(source.imageRefs ?? {}) },
			textOverlays: source.textOverlays ? structuredClone(source.textOverlays) : [],
			createdAt: new Date()
		};
		this.items.push(copy);
		this._persistAdd(copy);
	}

	clear() {
		this.items = [];
	}

	getById(id) {
		return this.items.find((item) => item.id === id);
	}

	/** Load all designs for a project from Appwrite. */
	async loadFromProject(projectId) {
		if (!auth.user || !projectId) return;
		this.loading = true;
		try {
			const res = await getDatabases().listDocuments(DATABASE_ID, DESIGNS_COLLECTION, [
				Query.equal('projectId', projectId),
				Query.equal('ownerId', auth.user.$id),
				Query.orderAsc('$createdAt'),
				Query.limit(500)
			]);
			this.items = res.documents.map((doc) => {
				let cfg = {};
				try {
					cfg = doc.config ? JSON.parse(doc.config) : {};
				} catch {
					cfg = {};
				}
				return {
					id: doc.$id,
					_remote: true,
					assetType: doc.assetType,
					sizeId: doc.sizeId ?? null,
					layout: doc.layout,
					background: cfg.background ?? { type: 'gradient', id: 'sunset-pink' },
					pattern: cfg.pattern ?? null,
					phoneFrame: cfg.phoneFrame ?? 'iphone-dynamic-island',
					transforms: cfg.transforms ?? undefined,
					layoutTransforms: cfg.layoutTransforms ?? undefined,
					imageRefs: cfg.imageRefs ?? {},
					images: refsToImages(cfg.imageRefs),
					textOverlays: cfg.textOverlays ?? [],
					thumbnail: doc.thumbnail ?? null,
					createdAt: new Date(doc.$createdAt)
				};
			});
		} catch (err) {
			console.error('Failed to load queue from project', err);
		} finally {
			this.loading = false;
		}
	}

	async _persistAdd(item) {
		const projectId = currentProjectId();
		if (!projectId || !auth.user) return;
		try {
			const userId = auth.user.$id;
			const doc = await getDatabases().createDocument(
				DATABASE_ID,
				DESIGNS_COLLECTION,
				ID.unique(),
				{
					projectId,
					ownerId: userId,
					assetType: item.assetType,
					sizeId: item.sizeId ?? null,
					layout: item.layout,
					config: JSON.stringify(configForItem(item)),
					thumbnail: item.thumbnail ?? null
				},
				[
					Permission.read(Role.user(userId)),
					Permission.update(Role.user(userId)),
					Permission.delete(Role.user(userId))
				]
			);
			// Swap local id for the server-assigned id so future updates target the right doc.
			const idx = this.items.findIndex((i) => i.id === item.id);
			if (idx !== -1) {
				this.items[idx] = { ...this.items[idx], id: doc.$id, _remote: true };
			}
		} catch (err) {
			console.error('Failed to persist queue item', err);
		}
	}

	async _persistUpdate(item) {
		if (!item._remote) return;
		const projectId = currentProjectId();
		if (!projectId || !auth.user) return;
		try {
			await getDatabases().updateDocument(DATABASE_ID, DESIGNS_COLLECTION, item.id, {
				assetType: item.assetType,
				sizeId: item.sizeId ?? null,
				layout: item.layout,
				config: JSON.stringify(configForItem(item)),
				thumbnail: item.thumbnail ?? null
			});
		} catch (err) {
			console.error('Failed to update queue item', err);
		}
	}

	async _persistRemove(id) {
		if (!auth.user) return;
		// Local-only ids start with q_; remote items use Appwrite doc ids.
		if (typeof id === 'string' && id.startsWith('q_')) return;
		try {
			await getDatabases().deleteDocument(DATABASE_ID, DESIGNS_COLLECTION, id);
		} catch (err) {
			// Doc may not exist yet (queued before persistAdd resolved) — safe to ignore.
		}
	}
}

// Indirection to avoid an import cycle with projects.svelte.js
function currentProjectId() {
	if (typeof window === 'undefined') return null;
	try {
		return localStorage.getItem('moksha_current_project_id');
	} catch {
		return null;
	}
}

export const queue = new QueueState();

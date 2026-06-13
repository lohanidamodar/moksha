import { ID, Permission, Role, Query } from 'appwrite';
import {
	getDatabases,
	DATABASE_ID,
	PROJECTS_COLLECTION
} from '$lib/appwrite/client.js';
import { auth } from './auth.svelte.js';
import { imageLibrary } from './imageLibrary.svelte.js';
import { queue } from './queue.svelte.js';
import { editor } from './editor.svelte.js';

const STORAGE_KEY = 'moksha_current_project_id';

class ProjectsState {
	items = $state([]);
	currentId = $state(null);
	loading = $state(false);
	saving = $state(false);
	error = $state(null);

	get current() {
		return this.items.find((p) => p.$id === this.currentId) ?? null;
	}

	async loadAll() {
		if (!auth.user) {
			this.items = [];
			return;
		}
		this.loading = true;
		this.error = null;
		try {
			const res = await getDatabases().listDocuments(DATABASE_ID, PROJECTS_COLLECTION, [
				Query.equal('ownerId', auth.user.$id),
				Query.orderDesc('$updatedAt'),
				Query.limit(100)
			]);
			this.items = res.documents;
			const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
			if (stored && this.items.some((p) => p.$id === stored)) {
				await this.select(stored);
			} else if (!this.currentId && this.items.length > 0) {
				await this.select(this.items[0].$id);
			} else if (!this.items.length) {
				this.currentId = null;
			}
		} catch (err) {
			this.error = err?.message || 'Failed to load projects';
		} finally {
			this.loading = false;
		}
	}

	async create(name, description = '') {
		if (!auth.user) throw new Error('Must be signed in to create a project');
		const userId = auth.user.$id;
		this.saving = true;
		this.error = null;
		try {
			const doc = await getDatabases().createDocument(
				DATABASE_ID,
				PROJECTS_COLLECTION,
				ID.unique(),
				{ name, description, ownerId: userId },
				[
					Permission.read(Role.user(userId)),
					Permission.update(Role.user(userId)),
					Permission.delete(Role.user(userId))
				]
			);
			this.items = [doc, ...this.items];
			await this.select(doc.$id);
			return doc;
		} catch (err) {
			this.error = err?.message || 'Failed to create project';
			throw err;
		} finally {
			this.saving = false;
		}
	}

	async rename(id, name, description) {
		const patch = { name };
		if (description !== undefined) patch.description = description;
		const doc = await getDatabases().updateDocument(
			DATABASE_ID,
			PROJECTS_COLLECTION,
			id,
			patch
		);
		const idx = this.items.findIndex((p) => p.$id === id);
		if (idx !== -1) this.items[idx] = doc;
	}

	async remove(id) {
		await getDatabases().deleteDocument(DATABASE_ID, PROJECTS_COLLECTION, id);
		this.items = this.items.filter((p) => p.$id !== id);
		if (this.currentId === id) {
			this.currentId = null;
			imageLibrary.clear();
			queue.clear();
			if (this.items.length > 0) {
				await this.select(this.items[0].$id);
			} else if (typeof window !== 'undefined') {
				localStorage.removeItem(STORAGE_KEY);
			}
		}
	}

	async select(id) {
		editor.editingQueueId = null;
		editor.images = {};
		if (!id) {
			this.currentId = null;
			imageLibrary.clear();
			queue.clear();
			if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
			return;
		}
		this.currentId = id;
		if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, id);
		imageLibrary.clear();
		queue.clear();
		await imageLibrary.loadFromProject(id);
		await queue.loadFromProject(id);
	}

	clearLocal() {
		this.items = [];
		this.currentId = null;
		this.error = null;
	}
}

export const projects = new ProjectsState();

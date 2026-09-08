/**
 * The project the studio is editing.
 *
 * moksha.json is the source of truth, not this store: the store holds what was
 * loaded, hands assets to the editor, takes them back, and writes the file.
 * Anything the studio does not understand is carried through untouched, so a
 * hand-written field survives a save.
 */
import { editor, transformKey } from './editor.svelte.js';
import { imageLibrary } from './imageLibrary.svelte.js';
import { getAssetType } from '$core/assets/index.js';
import { resolveCopy, isLocalisedCopy } from '$core/project.js';

class ProjectState {
	loaded = $state(false);
	/** Absolute path, and a short label for the header. */
	path = $state(null);
	label = $state('');
	/** @type {object | null} */
	project = $state(null);
	problems = $state([]);
	/** @type {object | null} */
	options = $state(null);
	locale = $state('en');
	saving = $state(false);
	error = $state('');
	/** The asset currently open in the editor, by project id. */
	openAssetId = $state(null);
	dirty = $state(false);
	/**
	 * Images uploaded into the project while the open asset is being edited,
	 * by input id. The browser holds an upload as a blob the CLI cannot see, so
	 * it becomes a file in the project and the asset references it by path.
	 */
	pendingImages = $state({});

	locales = $derived(this.project?.locales ?? ['en']);
	assets = $derived(this.project?.assets ?? []);
	errors = $derived(this.problems.filter((p) => p.level === 'error'));
	warnings = $derived(this.problems.filter((p) => p.level === 'warning'));

	async load() {
		this.error = '';
		try {
			const res = await fetch('/api/project');
			if (res.status === 404) {
				const body = await res.json().catch(() => ({}));
				this.error = body.reason ?? 'No project.';
				this.loaded = true;
				return;
			}
			if (!res.ok) throw new Error(`The studio server returned ${res.status}.`);

			const body = await res.json();
			this.path = body.path;
			this.label = body.label;
			this.project = body.project;
			this.problems = body.problems ?? [];
			this.options = body.options;
			this.locale = this.project.locales?.[0] ?? 'en';
			this.loaded = true;
			this.dirty = false;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			this.loaded = true;
		}
	}

	async save() {
		if (!this.project || this.saving) return false;
		this.saving = true;
		this.error = '';
		try {
			const res = await fetch('/api/project', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(this.project)
			});
			if (!res.ok) throw new Error((await res.text()) || `The server returned ${res.status}.`);
			this.dirty = false;
			// Re-read, so the problem list reflects what is now on disk.
			await this.load();
			return true;
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			return false;
		} finally {
			this.saving = false;
		}
	}

	/** Upload an image into the project, and return the reference to store. */
	async uploadImage(file) {
		const form = new FormData();
		form.append('file', file);
		const res = await fetch('/api/project/image', { method: 'POST', body: form });
		if (!res.ok) throw new Error((await res.text()) || `Upload failed (${res.status}).`);
		return (await res.json()).ref;
	}

	imageUrl(ref) {
		return `/api/project/image?ref=${encodeURIComponent(ref)}`;
	}

	/** Load one project asset into the editor, resolved for the active locale. */
	async openAsset(id) {
		const asset = this.assets.find((a) => a.id === id);
		if (!asset) return;
		const module = getAssetType(asset.assetType);

		editor.assetType = asset.assetType;
		editor.sizeId = asset.sizeId ?? null;
		editor.layout = asset.layout ?? module?.layouts?.[0]?.id ?? '';
		editor.background = { ...(asset.background ?? this.project.design?.background ?? {}) };
		editor.pattern =
			asset.pattern !== undefined && asset.pattern !== null
				? { ...asset.pattern }
				: asset.pattern === null
					? null
					: (this.project.design?.pattern ?? null);
		editor.phoneFrame =
			asset.phoneFrame ??
			this.project.design?.frames?.[asset.assetType] ??
			module?.defaultPhoneFrame ??
			'';
		editor.layoutTransforms = asset.transforms
			? { [transformKey(editor.layout, editor.sizeId)]: structuredClone(asset.transforms) }
			: {};
		editor.textOverlays = (asset.text ?? []).map((overlay, index) => ({
			...overlay,
			id: `t_${id}_${index}`,
			text: resolveCopy(overlay.text, this.locale),
			font: resolveCopy(overlay.font, this.locale) || resolveCopy(this.project.design?.font, this.locale)
		}));
		editor.selectedOverlayId = null;
		editor.editingQueueId = null;

		editor.images = {};
		for (const [input, ref] of Object.entries(asset.images ?? {})) {
			if (!ref) continue;
			const entry = await imageLibrary.addFromUrl(this.imageUrl(ref), ref, input, ref);
			if (entry) editor.images[input] = entry.img;
		}

		this.openAssetId = id;
		this.pendingImages = {};
	}

	/**
	 * Note which file in the project an input now uses, so committing the open
	 * asset records it. Null clears the input.
	 */
	setImageRef(inputId, ref) {
		if (!this.project || !this.openAssetId) return;
		this.pendingImages = { ...this.pendingImages, [inputId]: ref };
		this.dirty = true;
	}

	/**
	 * Write the editor's state back into the open asset.
	 *
	 * Text is merged rather than replaced: editing the English strings must not
	 * drop the Nepali ones, so a localised value keeps every other locale.
	 */
	commitOpenAsset(imageRefs = {}) {
		imageRefs = { ...this.pendingImages, ...imageRefs };
		const index = this.assets.findIndex((a) => a.id === this.openAssetId);
		if (index === -1) return;
		const previous = this.assets[index];

		this.project.assets[index] = {
			...previous,
			assetType: editor.assetType,
			sizeId: editor.sizeId ?? null,
			layout: editor.layout ?? null,
			background: editor.background,
			pattern: editor.pattern,
			phoneFrame: editor.phoneFrame || null,
			transforms: editor.getTransforms(editor.layout, editor.sizeId),
			images: prunedImages({ ...previous.images, ...imageRefs }),
			text: editor.textOverlays.map((overlay, i) => mergeCopy(previous.text?.[i], overlay, this.locale))
		};
		this.dirty = true;
	}

	/**
	 * A readable, unique id for a new asset: the asset type without its
	 * "-screenshot" tail, numbered. The id names the output file, so it wants
	 * to mean something.
	 */
	nextAssetId(assetType) {
		const base = assetType.replace(/-screenshot$/, '').replace(/-showcase$/, '');
		const taken = new Set(this.assets.map((a) => a.id));
		if (!taken.has(base)) return base;
		for (let n = 2; ; n++) {
			if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
		}
	}

	/** Add an asset of [assetType] and open it. */
	async addAsset(assetType) {
		if (!this.project) return null;
		const id = this.nextAssetId(assetType);
		this.project.assets = [...this.assets, { id, assetType, images: {}, text: [] }];
		this.dirty = true;
		await this.openAsset(id);
		return id;
	}

	/** Copy an asset, so a second tile starts from one that already works. */
	async duplicateAsset(id) {
		const index = this.assets.findIndex((a) => a.id === id);
		if (index === -1) return null;
		const copy = structuredClone($state.snapshot(this.assets[index]));
		copy.id = this.nextAssetId(copy.assetType);
		const assets = [...this.assets];
		assets.splice(index + 1, 0, copy);
		this.project.assets = assets;
		this.dirty = true;
		await this.openAsset(copy.id);
		return copy.id;
	}

	removeAsset(id) {
		this.project.assets = this.assets.filter((a) => a.id !== id);
		this.dirty = true;
		if (this.openAssetId === id) this.openAssetId = null;
	}

	/** Move an asset within its strip. Order is store order, so it is meaningful. */
	moveAsset(id, delta) {
		const from = this.assets.findIndex((a) => a.id === id);
		const to = from + delta;
		if (from === -1 || to < 0 || to >= this.assets.length) return;
		const assets = [...this.assets];
		const [moved] = assets.splice(from, 1);
		assets.splice(to, 0, moved);
		this.project.assets = assets;
		this.dirty = true;
	}

	/** Rename an asset, which renames the file it renders to. */
	renameAsset(id, next) {
		const clean = String(next).trim().replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[.-]+/, '');
		if (!clean || clean === id) return id;
		if (this.assets.some((a) => a.id === clean)) {
			this.error = `There is already an asset called "${clean}".`;
			return id;
		}
		this.project.assets = this.assets.map((a) => (a.id === id ? { ...a, id: clean } : a));
		if (this.openAssetId === id) this.openAssetId = clean;
		this.dirty = true;
		return clean;
	}

	/** Change the project-wide design, which every asset inherits. */
	setDesign(patch) {
		if (!this.project) return;
		this.project.design = { ...this.project.design, ...patch };
		this.dirty = true;
	}

	async setLocale(locale) {
		this.locale = locale;
		if (this.openAssetId) await this.openAsset(this.openAssetId);
	}
}

/** Inputs cleared in the editor are dropped rather than left pointing at the old file. */
function prunedImages(images) {
	return Object.fromEntries(Object.entries(images).filter(([, ref]) => ref));
}

/**
 * One overlay, merged back into whatever the file held for it.
 *
 * A field that was localised stays localised, with only the active locale's
 * value replaced.
 */
function mergeCopy(previous, overlay, locale) {
	const { id: _id, ...rest } = overlay;
	const merged = { ...previous, ...rest };

	merged.text = isLocalisedCopy(previous?.text)
		? { ...previous.text, [locale]: overlay.text }
		: overlay.text;

	if (isLocalisedCopy(previous?.font)) {
		merged.font = { ...previous.font, [locale]: overlay.font };
	} else if (previous?.font === undefined) {
		// It inherited the project font; do not pin it just because the editor
		// resolved one to draw with.
		delete merged.font;
	}

	return merged;
}

export const project = new ProjectState();

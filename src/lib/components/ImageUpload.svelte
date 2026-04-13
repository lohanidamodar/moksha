<script>
	import { editor } from '$lib/stores/editor.svelte.js';
	import { imageLibrary } from '$lib/stores/imageLibrary.svelte.js';

	let { inputId, label, placeholder } = $props();

	let fileInput = $state(null);
	let showLibrary = $state(false);

	// Map inputId to library category
	let category = $derived(
		inputId === 'logo' ? 'logo' : inputId === 'icon' ? 'icon' : 'screenshot'
	);

	let libraryItems = $derived(imageLibrary.getByCategory(category));
	let hasImage = $derived(!!editor.images[inputId]);

	// Find the library entry for the currently selected image to show its preview
	let selectedEntry = $derived.by(() => {
		const img = editor.images[inputId];
		if (!img) return null;
		return imageLibrary.items.find((i) => i.img === img) ?? null;
	});

	function handleClick() {
		if (libraryItems.length > 0) {
			showLibrary = !showLibrary;
		} else {
			fileInput?.click();
		}
	}

	async function handleFileChange(e) {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const results = await imageLibrary.addFiles(files, category);
		// Auto-select the first uploaded image
		if (results.length > 0) {
			editor.images[inputId] = results[0].img;
		}
		showLibrary = results.length > 1;
		if (fileInput) fileInput.value = '';
	}

	function selectFromLibrary(entry) {
		editor.images[inputId] = entry.img;
		showLibrary = false;
	}

	function clear() {
		editor.images[inputId] = null;
	}

	function removeFromLibrary(e, entry) {
		e.stopPropagation();
		// If this was the selected image, clear it
		if (editor.images[inputId] === entry.img) {
			editor.images[inputId] = null;
		}
		imageLibrary.remove(entry.id);
	}
</script>

<div class="image-upload">
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		multiple
		onchange={handleFileChange}
		hidden
	/>

	{#if hasImage && selectedEntry}
		<div class="selected">
			<img src={selectedEntry.src} alt="Selected" class="selected-img" />
			<div class="selected-info">
				<span class="selected-name">{selectedEntry.name}</span>
				<div class="selected-actions">
					{#if libraryItems.length > 1}
						<button class="action-btn" onclick={() => (showLibrary = !showLibrary)} title="Change image">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
						</button>
					{/if}
					<button class="action-btn" onclick={() => fileInput?.click()} title="Upload more">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
					</button>
					<button class="action-btn action-btn--danger" onclick={clear} aria-label="Clear selection" title="Deselect">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
					</button>
				</div>
			</div>
		</div>
	{:else if hasImage}
		<!-- Image set but not from library (e.g. loaded from queue) -->
		<div class="selected">
			<div class="selected-placeholder">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
			</div>
			<div class="selected-info">
				<span class="selected-name">Image selected</span>
				<div class="selected-actions">
					<button class="action-btn" onclick={() => fileInput?.click()} title="Upload more">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
					</button>
					<button class="action-btn action-btn--danger" onclick={clear} aria-label="Clear image">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
					</button>
				</div>
			</div>
		</div>
	{:else}
		<button class="drop-zone" onclick={handleClick}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
				<circle cx="8.5" cy="8.5" r="1.5"></circle>
				<polyline points="21 15 16 10 5 21"></polyline>
			</svg>
			<span class="drop-text">{placeholder || 'Upload image'}</span>
			{#if libraryItems.length > 0}
				<span class="drop-hint">{libraryItems.length} in library — click to choose</span>
			{:else}
				<span class="drop-hint">Supports multiple files</span>
			{/if}
		</button>
	{/if}

	{#if showLibrary}
		<div class="library">
			<div class="library-header">
				<span class="library-title">{category}s ({libraryItems.length})</span>
				<button class="action-btn" onclick={() => fileInput?.click()} title="Upload more">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
				</button>
			</div>
			<div class="library-grid">
				{#each libraryItems as entry (entry.id)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="library-item"
						class:library-item--selected={editor.images[inputId] === entry.img}
						onclick={() => selectFromLibrary(entry)}
						title={entry.name}
					>
						<img src={entry.src} alt={entry.name} />
						<button
							class="library-item-remove"
							onclick={(e) => removeFromLibrary(e, entry)}
							aria-label="Remove {entry.name}"
						>
							<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.image-upload {
		width: 100%;
	}

	.drop-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		width: 100%;
		padding: 16px;
		border: 2px dashed var(--border, #2e2e36);
		border-radius: 8px;
		background: var(--bg-surface, #1a1a1f);
		color: var(--text-secondary, #9d9baa);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 13px;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
	}

	.drop-zone:hover {
		border-color: var(--accent, #f97316);
		color: var(--text-primary, #f0eff4);
	}

	.drop-text {
		font-size: 12px;
	}

	.drop-hint {
		font-size: 10px;
		opacity: 0.5;
	}

	.selected {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 8px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 8px;
		background: var(--bg-surface, #1a1a1f);
	}

	.selected-img {
		width: 40px;
		height: 40px;
		object-fit: cover;
		border-radius: 6px;
		flex-shrink: 0;
	}

	.selected-placeholder {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		background: var(--bg-card, #222228);
		color: var(--text-secondary, #9d9baa);
		flex-shrink: 0;
	}

	.selected-info {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 1;
		min-width: 0;
	}

	.selected-name {
		flex: 1;
		font-size: 11px;
		color: var(--text-secondary, #9d9baa);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.selected-actions {
		display: flex;
		gap: 2px;
		flex-shrink: 0;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.action-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: var(--text-primary, #f0eff4);
	}

	.action-btn--danger:hover {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}

	/* Library gallery */
	.library {
		margin-top: 8px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 8px;
		background: var(--bg-card, #222228);
		overflow: hidden;
	}

	.library-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 10px;
		border-bottom: 1px solid var(--border, #2e2e36);
	}

	.library-title {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-secondary, #9d9baa);
	}

	.library-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px;
		padding: 6px;
		max-height: 180px;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--border, #2e2e36) transparent;
	}

	.library-item {
		position: relative;
		aspect-ratio: 1;
		border: 2px solid transparent;
		border-radius: 6px;
		overflow: hidden;
		cursor: pointer;
		padding: 0;
		background: var(--bg-surface, #1a1a1f);
		transition: border-color 0.15s;
	}

	.library-item:hover {
		border-color: rgba(255, 255, 255, 0.2);
	}

	.library-item--selected {
		border-color: var(--accent, #f97316);
	}

	.library-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.library-item-remove {
		position: absolute;
		top: 2px;
		right: 2px;
		width: 18px;
		height: 18px;
		border: none;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.7);
		color: #fff;
		display: none;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
	}

	.library-item:hover .library-item-remove {
		display: flex;
	}

	.library-item-remove:hover {
		background: #ef4444;
	}
</style>

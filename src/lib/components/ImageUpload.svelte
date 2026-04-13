<script>
	import { editor } from '$lib/stores/editor.svelte.js';

	let { inputId, label, placeholder } = $props();

	let fileInput = $state(null);
	let filename = $state('');
	let previewSrc = $state('');

	let hasImage = $derived(!!editor.images[inputId]);

	function handleClick() {
		fileInput?.click();
	}

	function handleFileChange(e) {
		const file = e.target.files?.[0];
		if (!file) return;

		filename = file.name;

		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			editor.images[inputId] = img;
			previewSrc = url;
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			filename = '';
		};
		img.src = url;
	}

	function clear() {
		if (previewSrc) {
			URL.revokeObjectURL(previewSrc);
		}
		editor.images[inputId] = null;
		filename = '';
		previewSrc = '';
		if (fileInput) {
			fileInput.value = '';
		}
	}
</script>

<div class="image-upload">
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		onchange={handleFileChange}
		hidden
	/>

	{#if hasImage && previewSrc}
		<div class="preview">
			<img src={previewSrc} alt="Preview" class="preview-img" />
			<div class="preview-info">
				<span class="preview-filename">{filename}</span>
				<button class="clear-btn" onclick={clear} aria-label="Clear image">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
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
		</button>
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
		gap: 8px;
		width: 100%;
		padding: 20px;
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

	.preview {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 8px;
		background: var(--bg-surface, #1a1a1f);
	}

	.preview-img {
		width: 48px;
		height: 48px;
		object-fit: cover;
		border-radius: 6px;
	}

	.preview-info {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
		min-width: 0;
	}

	.preview-filename {
		flex: 1;
		font-size: 12px;
		color: var(--text-secondary, #9d9baa);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.clear-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.15s, color 0.15s;
	}

	.clear-btn:hover {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}
</style>

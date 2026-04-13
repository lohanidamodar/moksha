<script>
	import { editor } from '$lib/stores/editor.svelte.js';
	import { imageLibrary } from '$lib/stores/imageLibrary.svelte.js';

	let { inputId } = $props();

	let category = $derived(
		inputId === 'logo' ? 'logo' : inputId === 'icon' ? 'icon' : 'screenshot'
	);

	let libraryItems = $derived(imageLibrary.getByCategory(category));
	let currentImg = $derived(editor.images[inputId]);

	function select(entry) {
		editor.images[inputId] = entry.img;
	}

	function clear() {
		editor.images[inputId] = null;
	}
</script>

{#if libraryItems.length > 0}
	<div class="selector">
		<div class="selector-grid">
			{#each libraryItems as entry (entry.id)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="selector-thumb"
					class:selector-thumb--selected={currentImg === entry.img}
					onclick={() => select(entry)}
					title={entry.name}
				>
					<img src={entry.src} alt={entry.name} />
				</div>
			{/each}
		</div>
		{#if currentImg}
			<button class="clear-btn" onclick={clear}>Deselect</button>
		{/if}
	</div>
{:else}
	<div class="empty">Upload {category}s in the Assets section above</div>
{/if}

<style>
	.selector {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.selector-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 4px;
	}

	.selector-thumb {
		aspect-ratio: 1;
		border: 2px solid transparent;
		border-radius: 5px;
		overflow: hidden;
		cursor: pointer;
		background: var(--bg-card, #222228);
		transition: border-color 0.15s;
	}

	.selector-thumb:hover {
		border-color: rgba(255, 255, 255, 0.2);
	}

	.selector-thumb--selected {
		border-color: var(--accent, #f97316);
	}

	.selector-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.empty {
		font-size: 11px;
		color: var(--text-secondary, #9d9baa);
		opacity: 0.6;
		padding: 6px 0;
	}

	.clear-btn {
		align-self: flex-start;
		border: none;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 10px;
		cursor: pointer;
		padding: 2px 0;
		transition: color 0.15s;
	}

	.clear-btn:hover {
		color: var(--accent, #f97316);
	}
</style>

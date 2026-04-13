<script>
	import { editor } from '$lib/stores/editor.svelte.js';
	import { getAssetType } from '$lib/assets/index.js';

	let module = $derived(getAssetType(editor.assetType));
	let layouts = $derived(module?.layouts ?? []);
</script>

<div class="layout-picker">
	{#each layouts as layout}
		<button
			class="layout-option"
			class:selected={editor.layout === layout.id}
			onclick={() => editor.layout = layout.id}
		>
			<span class="layout-label">{layout.label}</span>
		</button>
	{/each}
</div>

<style>
	.layout-picker {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
	}

	.layout-option {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 10px 4px;
		border: 2px solid var(--border, #2e2e36);
		border-radius: 8px;
		background: var(--bg-surface, #1a1a1f);
		color: var(--text-secondary, #9d9baa);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 11px;
		font-weight: 500;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s, background 0.15s;
		text-align: center;
	}

	.layout-option:hover {
		border-color: var(--text-secondary, #9d9baa);
		color: var(--text-primary, #f0eff4);
	}

	.layout-option.selected {
		border-color: var(--accent, #f97316);
		color: var(--text-primary, #f0eff4);
		background: var(--bg-card, #222228);
	}

	.layout-label {
		line-height: 1.2;
	}
</style>

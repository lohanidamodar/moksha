<script>
	import { editor } from '$lib/stores/editor.svelte.js';
	import { getAssetType } from '$lib/assets/index.js';
	import { customLayouts } from '$lib/stores/customLayouts.svelte.js';

	let module = $derived(getAssetType(editor.assetType));
	let builtInLayouts = $derived(module?.layouts ?? []);
	let customList = $derived(customLayouts.getByAssetType(editor.assetType));

	let renaming = $state(null);
	let renameValue = $state('');

	function selectLayout(id) {
		editor.layout = id;
	}

	function duplicateCurrent() {
		const currentId = editor.layout;
		const isCustom = currentId.startsWith('custom_');
		const baseLayout = isCustom
			? (customLayouts.getById(currentId)?.baseLayout ?? currentId)
			: currentId;

		const currentLabel = isCustom
			? (customLayouts.getById(currentId)?.label ?? 'Custom')
			: (builtInLayouts.find((l) => l.id === currentId)?.label ?? 'Custom');

		const transforms = editor.getTransforms(editor.layout);
		const newId = customLayouts.duplicate(
			currentLabel + ' Copy',
			editor.assetType,
			baseLayout,
			transforms
		);
		editor.layout = newId;
	}

	function startRename(item) {
		renaming = item.id;
		renameValue = item.label;
	}

	function finishRename() {
		if (renaming && renameValue.trim()) {
			customLayouts.update(renaming, { label: renameValue.trim() });
		}
		renaming = null;
		renameValue = '';
	}

	function deleteCustom(id) {
		customLayouts.remove(id);
		if (editor.layout === id) {
			editor.layout = builtInLayouts[0]?.id ?? '';
		}
	}

	let toast = $state('');
	let toastTimeout = $state(null);

	function showToast(msg) {
		toast = msg;
		if (toastTimeout) clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => { toast = ''; }, 1500);
	}

	function saveTransforms(id) {
		const transforms = editor.getTransforms(editor.layout);
		customLayouts.update(id, { transforms: structuredClone(transforms) });
		showToast('Saved');
	}
</script>

<div class="layout-picker">
	{#each builtInLayouts as layout}
		<button
			class="layout-option"
			class:selected={editor.layout === layout.id}
			onclick={() => selectLayout(layout.id)}
		>
			<span class="layout-label">{layout.label}</span>
		</button>
	{/each}

	{#each customList as layout (layout.id)}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="layout-option custom"
			class:selected={editor.layout === layout.id}
			onclick={() => selectLayout(layout.id)}
		>
			{#if renaming === layout.id}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<input
					class="rename-input"
					type="text"
					bind:value={renameValue}
					onclick={(e) => e.stopPropagation()}
					onkeydown={(e) => { if (e.key === 'Enter') finishRename(); if (e.key === 'Escape') { renaming = null; } }}
					onblur={finishRename}
				/>
			{:else}
				<span class="layout-label">{layout.label}</span>
				<div class="custom-actions" onclick={(e) => e.stopPropagation()}>
					{#if editor.layout === layout.id}
						<button class="tiny-btn" title="Save transforms" onclick={() => saveTransforms(layout.id)}>
							<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
						</button>
					{/if}
					<button class="tiny-btn" title="Rename" onclick={() => startRename(layout)}>
						<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
					</button>
					<button class="tiny-btn delete" title="Delete" onclick={() => deleteCustom(layout.id)}>
						<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
					</button>
				</div>
			{/if}
		</div>
	{/each}

	<button class="layout-option add-btn" onclick={duplicateCurrent}>
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
		<span class="layout-label">Duplicate</span>
	</button>
</div>

{#if toast}
	<div class="toast">{toast}</div>
{/if}

<style>
	.toast {
		position: fixed;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--accent, #f97316);
		color: #fff;
		padding: 6px 16px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		font-family: var(--font, 'Inter'), sans-serif;
		z-index: 999;
		pointer-events: none;
		animation: toast-in 0.2s ease;
	}

	@keyframes toast-in {
		from { opacity: 0; transform: translateX(-50%) translateY(8px); }
		to { opacity: 1; transform: translateX(-50%) translateY(0); }
	}

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

	.layout-option.custom {
		flex-direction: column;
		gap: 3px;
		padding: 6px 4px;
		position: relative;
		border-style: dashed;
	}

	.layout-option.custom.selected {
		border-style: solid;
	}

	.custom-actions {
		display: flex;
		gap: 2px;
	}

	.tiny-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border: none;
		border-radius: 4px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		cursor: pointer;
		padding: 0;
		transition: all 0.15s;
	}

	.tiny-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--text-primary, #f0eff4);
	}

	.tiny-btn.delete:hover {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}

	.rename-input {
		width: 100%;
		padding: 2px 4px;
		border: 1px solid var(--accent, #f97316);
		border-radius: 4px;
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 10px;
		outline: none;
		text-align: center;
		box-sizing: border-box;
	}

	.add-btn {
		border-style: dashed;
		gap: 4px;
		opacity: 0.6;
	}

	.add-btn:hover {
		opacity: 1;
	}

	.layout-label {
		line-height: 1.2;
	}
</style>

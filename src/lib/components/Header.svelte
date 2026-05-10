<script>
	import { APP_NAME } from '$lib/config.js';
	import { assetTypes, getAssetType } from '$lib/assets/index.js';
	import { editor } from '$lib/stores/editor.svelte.js';

	let currentModule = $derived(getAssetType(editor.assetType));

	function handleAssetChange(e) {
		const id = e.target.value;
		const mod = getAssetType(id);
		editor.assetType = id;
		editor.sizeId = null;
		editor.layout = mod?.layouts[0]?.id ?? '';
		// Reset phone frame to the asset's default if defined
		if (mod?.defaultPhoneFrame) {
			editor.phoneFrame = mod.defaultPhoneFrame;
		}
		// Clear any selection that may not apply to the new asset type
		editor.selectedOverlayId = null;
		editor.selectedElement = null;
		editor.commit();
	}
</script>

<header class="header">
	<div class="header-left">
		<span class="app-name">{APP_NAME}</span>
	</div>

	<div class="header-center">
		<select class="asset-select" value={editor.assetType} onchange={handleAssetChange}>
			{#each assetTypes as assetType}
				<option value={assetType.id}>{assetType.icon}  {assetType.label}</option>
			{/each}
		</select>
	</div>

	<div class="header-right">
		<button
			class="icon-btn"
			disabled={!editor.canUndo}
			onclick={() => editor.undo()}
			title="Undo (⌘Z)"
			aria-label="Undo"
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
		</button>
		<button
			class="icon-btn"
			disabled={!editor.canRedo}
			onclick={() => editor.redo()}
			title="Redo (⌘⇧Z)"
			aria-label="Redo"
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.13-9.36L23 10"/></svg>
		</button>
	</div>
</header>

<style>
	.header {
		display: flex;
		align-items: center;
		padding: 0 20px;
		height: 50px;
		background: var(--bg-surface, #1a1a1f);
		border-bottom: 1px solid var(--border, #2e2e36);
		position: relative;
		z-index: 100;
		gap: 16px;
	}

	.header-left {
		flex-shrink: 0;
	}

	.app-name {
		font-size: 20px;
		font-weight: 800;
		color: var(--accent, #f97316);
		letter-spacing: -0.5px;
	}

	.header-center {
		flex: 1;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 7px;
		background: var(--bg-card, #222228);
		color: var(--text-secondary, #9d9baa);
		cursor: pointer;
		transition: all 0.15s;
		padding: 0;
	}

	.icon-btn:hover:not(:disabled) {
		border-color: var(--border-hover, #444);
		color: var(--text-primary, #f0eff4);
	}

	.icon-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.asset-select {
		padding: 7px 32px 7px 12px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 8px;
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		outline: none;
		transition: border-color 0.15s;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239d9baa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 10px center;
	}

	.asset-select:hover {
		border-color: var(--border-hover, #444);
	}

	.asset-select:focus {
		border-color: var(--accent, #f97316);
	}

	.asset-select option {
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
	}
</style>

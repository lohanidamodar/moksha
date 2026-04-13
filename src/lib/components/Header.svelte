<script>
	import { APP_NAME } from '$lib/config.js';
	import { assetTypes, getAssetType } from '$lib/assets/index.js';
	import { editor } from '$lib/stores/editor.svelte.js';
	import { queue } from '$lib/stores/queue.svelte.js';

	let { onToggleQueue, queueOpen, onExport } = $props();
</script>

<header class="header">
	<div class="header-left">
		<span class="app-name">{APP_NAME}</span>
	</div>

	<nav class="header-center">
		{#each assetTypes as assetType}
			<button
				class="tab"
				class:active={editor.assetType === assetType.id}
				onclick={() => {
					editor.assetType = assetType.id;
					editor.layout = assetType.layouts[0].id;
				}}
			>
				<span class="tab-icon">{assetType.icon}</span>
				<span class="tab-label">{assetType.label}</span>
			</button>
		{/each}
	</nav>

	<div class="header-right">
		<button class="queue-btn" onclick={onToggleQueue}>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3" y="3" width="7" height="7"></rect>
				<rect x="14" y="3" width="7" height="7"></rect>
				<rect x="3" y="14" width="7" height="7"></rect>
				<rect x="14" y="14" width="7" height="7"></rect>
			</svg>
			Queue
			{#if queue.count > 0}
				<span class="badge">{queue.count}</span>
			{/if}
		</button>
		<button class="export-btn" onclick={onExport} disabled={queue.count === 0}>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
				<polyline points="7 10 12 15 17 10"></polyline>
				<line x1="12" y1="15" x2="12" y2="3"></line>
			</svg>
			Export ZIP
		</button>
	</div>
</header>

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 20px;
		height: 56px;
		background: var(--bg-surface, #1a1a1f);
		border-bottom: 1px solid var(--border, #2e2e36);
		position: relative;
		z-index: 100;
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
		display: flex;
		gap: 2px;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.header-center::-webkit-scrollbar {
		display: none;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: background 0.15s, color 0.15s;
	}

	.tab:hover {
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
	}

	.tab.active {
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
		box-shadow: inset 0 -2px 0 var(--accent, #f97316);
	}

	.tab-icon {
		font-size: 15px;
	}

	.tab-label {
		font-size: 13px;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.queue-btn,
	.export-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 7px 14px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 8px;
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}

	.queue-btn:hover,
	.export-btn:hover {
		background: var(--border, #2e2e36);
	}

	.export-btn {
		background: var(--accent, #f97316);
		border-color: var(--accent, #f97316);
		color: #fff;
	}

	.export-btn:hover {
		background: #ea6c10;
		border-color: #ea6c10;
	}

	.export-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.export-btn:disabled:hover {
		background: var(--accent, #f97316);
	}

	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		border-radius: 9px;
		background: var(--accent, #f97316);
		color: #fff;
		font-size: 11px;
		font-weight: 700;
		line-height: 1;
	}
</style>

<script>
	import { editor } from '$lib/stores/editor.svelte.js';
	import { queue } from '$lib/stores/queue.svelte.js';
	import { getAssetType } from '$lib/assets/index.js';
	import { exportZip, downloadIndividual } from '$lib/renderer/export.js';

	let exporting = $state(false);
	let exportProgress = $state('');

	function getAssetLabel(assetTypeId) {
		return getAssetType(assetTypeId)?.label ?? assetTypeId;
	}

	function getLayoutLabel(assetTypeId, layoutId) {
		const mod = getAssetType(assetTypeId);
		return mod?.layouts.find((l) => l.id === layoutId)?.label ?? layoutId;
	}

	function handleEdit(item) {
		editor.loadFromQueue(item);
	}

	async function handleExportZip() {
		if (queue.count === 0 || exporting) return;
		exporting = true;
		exportProgress = 'Starting...';
		try {
			await exportZip(queue.items, (current, total, label) => {
				exportProgress = `${current}/${total}: ${label}`;
			});
		} catch (err) {
			console.error('Export failed:', err);
		} finally {
			exporting = false;
			exportProgress = '';
		}
	}
</script>

<div class="queue-strip">
	<div class="strip-header">
		<span class="strip-title">Queue ({queue.count})</span>
		{#if queue.count > 0}
			<div class="strip-actions">
				{#if exporting}
					<span class="export-progress">{exportProgress}</span>
				{/if}
				<button class="strip-btn" onclick={() => queue.clear()}>Clear</button>
				<button class="strip-btn primary" onclick={handleExportZip} disabled={exporting}>
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
					ZIP
				</button>
			</div>
		{/if}
	</div>

	{#if queue.count > 0}
		<div class="strip-scroll">
			{#each queue.items as item (item.id)}
				<div class="queue-card" class:editing={editor.editingQueueId === item.id}>
					<div class="card-thumb">
						{#if item.thumbnail}
							<img src={item.thumbnail} alt="Thumbnail" />
						{:else}
							<div class="thumb-placeholder"></div>
						{/if}
					</div>
					<div class="card-label">
						<span class="card-type">{getAssetLabel(item.assetType)}</span>
						<span class="card-layout">{getLayoutLabel(item.assetType, item.layout)}</span>
					</div>
					<div class="card-actions">
						<button class="action-btn edit" title="Edit" onclick={() => handleEdit(item)}>
							<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
						</button>
						<button class="action-btn duplicate" title="Duplicate" onclick={() => queue.duplicate(item.id)}>
							<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
						</button>
						<button class="action-btn download" title="Download" onclick={() => downloadIndividual(item)}>
							<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
						</button>
						<button class="action-btn delete" title="Delete" onclick={() => queue.remove(item.id)}>
							<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
						</button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty">Add items from the editor to build your export</div>
	{/if}
</div>

<style>
	.queue-strip {
		border-top: 1px solid var(--border, #2e2e36);
		background: var(--bg-surface, #1a1a1f);
		flex-shrink: 0;
	}

	.strip-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 12px;
	}

	.strip-title {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-secondary, #9d9baa);
	}

	.strip-actions {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.export-progress {
		font-size: 10px;
		color: var(--text-secondary, #9d9baa);
	}

	.strip-btn {
		padding: 4px 10px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 5px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 11px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.strip-btn:hover {
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
	}

	.strip-btn.primary {
		background: var(--accent, #f97316);
		border-color: var(--accent, #f97316);
		color: #fff;
	}

	.strip-btn.primary:hover {
		background: #ea6c10;
	}

	.strip-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.strip-scroll {
		display: flex;
		gap: 8px;
		padding: 0 12px 10px;
		overflow-x: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--border, #2e2e36) transparent;
	}

	.queue-card {
		flex-shrink: 0;
		width: 140px;
		background: var(--bg-card, #222228);
		border: 1px solid var(--border, #2e2e36);
		border-radius: 8px;
		overflow: hidden;
		transition: border-color 0.15s;
	}

	.queue-card:hover {
		border-color: #444;
	}

	.queue-card.editing {
		border-color: var(--accent, #f97316);
	}

	.card-thumb {
		width: 100%;
		height: 90px;
		background: #111114;
		overflow: hidden;
	}

	.card-thumb img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.thumb-placeholder {
		width: 100%;
		height: 100%;
		background: var(--bg-card, #222228);
	}

	.card-label {
		padding: 6px 8px 4px;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.card-type {
		font-size: 10px;
		font-weight: 600;
		color: var(--text-primary, #f0eff4);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.card-layout {
		font-size: 9px;
		color: var(--text-secondary, #9d9baa);
	}

	.card-actions {
		display: flex;
		padding: 0 4px 6px;
		gap: 1px;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 22px;
		border: none;
		border-radius: 4px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.action-btn.edit:hover { background: rgba(59, 130, 246, 0.15); color: var(--blue, #3b82f6); }
	.action-btn.duplicate:hover { background: rgba(34, 197, 94, 0.15); color: var(--green, #22c55e); }
	.action-btn.download:hover { background: rgba(249, 115, 22, 0.15); color: var(--accent, #f97316); }
	.action-btn.delete:hover { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

	.empty {
		padding: 4px 12px 10px;
		font-size: 11px;
		color: var(--text-secondary, #9d9baa);
		opacity: 0.6;
	}
</style>

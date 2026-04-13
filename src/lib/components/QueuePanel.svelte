<script>
	import { editor } from '$lib/stores/editor.svelte.js';
	import { queue } from '$lib/stores/queue.svelte.js';
	import { getAssetType } from '$lib/assets/index.js';
	import { exportZip } from '$lib/renderer/export.js';

	let { onClose } = $props();

	let exporting = $state(false);
	let exportProgress = $state('');

	function getAssetLabel(assetTypeId) {
		const mod = getAssetType(assetTypeId);
		return mod?.label ?? assetTypeId;
	}

	function getLayoutLabel(assetTypeId, layoutId) {
		const mod = getAssetType(assetTypeId);
		if (!mod) return layoutId;
		const layout = mod.layouts.find((l) => l.id === layoutId);
		return layout?.label ?? layoutId;
	}

	function handleEdit(item) {
		editor.loadFromQueue(item);
		onClose?.();
	}

	function handleDuplicate(id) {
		queue.duplicate(id);
	}

	function handleDelete(id) {
		queue.remove(id);
	}

	function handleClear() {
		queue.clear();
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

<div class="queue-overlay" onclick={onClose} role="presentation"></div>
<div class="queue-panel">
	<div class="queue-header">
		<h3 class="queue-title">Queue ({queue.count})</h3>
		<button class="close-btn" onclick={onClose} aria-label="Close queue">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		</button>
	</div>

	<div class="queue-list">
		{#if queue.count === 0}
			<div class="empty-state">
				<span class="empty-icon">
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="3" width="7" height="7"></rect>
						<rect x="14" y="3" width="7" height="7"></rect>
						<rect x="3" y="14" width="7" height="7"></rect>
						<rect x="14" y="14" width="7" height="7"></rect>
					</svg>
				</span>
				<p class="empty-text">Queue is empty</p>
				<p class="empty-hint">Add items from the editor</p>
			</div>
		{:else}
			{#each queue.items as item (item.id)}
				<div class="queue-item" class:editing={editor.editingQueueId === item.id}>
					<div class="item-thumb">
						{#if item.thumbnail}
							<img src={item.thumbnail} alt="Thumbnail" />
						{:else}
							<div class="thumb-placeholder"></div>
						{/if}
					</div>
					<div class="item-info">
						<span class="item-type">{getAssetLabel(item.assetType)}</span>
						<span class="item-layout">{getLayoutLabel(item.assetType, item.layout)}</span>
					</div>
					<div class="item-actions">
						<button class="action-btn edit" title="Edit" onclick={() => handleEdit(item)}>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
								<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
							</svg>
						</button>
						<button class="action-btn duplicate" title="Duplicate" onclick={() => handleDuplicate(item.id)}>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
								<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
							</svg>
						</button>
						<button class="action-btn delete" title="Delete" onclick={() => handleDelete(item.id)}>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="3 6 5 6 21 6"></polyline>
								<path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
							</svg>
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	{#if queue.count > 0}
		<div class="queue-footer">
			{#if exporting}
				<p class="export-status">{exportProgress}</p>
			{/if}
			<div class="footer-actions">
				<button class="footer-btn clear-btn" onclick={handleClear}>Clear All</button>
				<button class="footer-btn zip-btn" onclick={handleExportZip} disabled={exporting}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
						<polyline points="7 10 12 15 17 10"></polyline>
						<line x1="12" y1="15" x2="12" y2="3"></line>
					</svg>
					Download ZIP
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.queue-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 200;
	}

	.queue-panel {
		position: fixed;
		top: 56px;
		right: 0;
		bottom: 0;
		width: 360px;
		background: var(--bg-surface, #1a1a1f);
		border-left: 1px solid var(--border, #2e2e36);
		z-index: 210;
		display: flex;
		flex-direction: column;
		box-shadow: -8px 0 32px rgba(0, 0, 0, 0.3);
	}

	.queue-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 16px;
		border-bottom: 1px solid var(--border, #2e2e36);
	}

	.queue-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-primary, #f0eff4);
		margin: 0;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		cursor: pointer;
		transition: background 0.15s;
	}

	.close-btn:hover {
		background: var(--bg-card, #222228);
	}

	.queue-list {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
		scrollbar-width: thin;
		scrollbar-color: var(--border, #2e2e36) transparent;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 48px 16px;
		gap: 8px;
	}

	.empty-icon {
		color: var(--border, #2e2e36);
	}

	.empty-text {
		font-size: 14px;
		font-weight: 500;
		color: var(--text-secondary, #9d9baa);
		margin: 0;
	}

	.empty-hint {
		font-size: 12px;
		color: var(--text-secondary, #9d9baa);
		opacity: 0.6;
		margin: 0;
	}

	.queue-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px;
		border-radius: 8px;
		transition: background 0.15s;
	}

	.queue-item:hover {
		background: var(--bg-card, #222228);
	}

	.queue-item.editing {
		background: var(--bg-card, #222228);
		outline: 1px solid var(--accent, #f97316);
	}

	.item-thumb {
		width: 48px;
		height: 72px;
		border-radius: 6px;
		overflow: hidden;
		flex-shrink: 0;
		background: #111114;
	}

	.item-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.thumb-placeholder {
		width: 100%;
		height: 100%;
		background: var(--bg-card, #222228);
	}

	.item-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.item-type {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-primary, #f0eff4);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-layout {
		font-size: 11px;
		color: var(--text-secondary, #9d9baa);
	}

	.item-actions {
		display: flex;
		gap: 2px;
		flex-shrink: 0;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.action-btn.edit:hover {
		background: rgba(59, 130, 246, 0.15);
		color: var(--blue, #3b82f6);
	}

	.action-btn.duplicate:hover {
		background: rgba(34, 197, 94, 0.15);
		color: var(--green, #22c55e);
	}

	.action-btn.delete:hover {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}

	.queue-footer {
		padding: 12px 16px;
		border-top: 1px solid var(--border, #2e2e36);
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.export-status {
		font-size: 11px;
		color: var(--text-secondary, #9d9baa);
		margin: 0;
		text-align: center;
	}

	.footer-actions {
		display: flex;
		gap: 8px;
	}

	.footer-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 9px 12px;
		border: none;
		border-radius: 8px;
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}

	.clear-btn {
		background: var(--bg-card, #222228);
		color: var(--text-secondary, #9d9baa);
		border: 1px solid var(--border, #2e2e36);
	}

	.clear-btn:hover {
		background: var(--border, #2e2e36);
		color: var(--text-primary, #f0eff4);
	}

	.zip-btn {
		background: var(--accent, #f97316);
		color: #fff;
	}

	.zip-btn:hover {
		background: #ea6c10;
	}

	.zip-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>

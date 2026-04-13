<script>
	import { imageLibrary } from '$lib/stores/imageLibrary.svelte.js';

	let screenshotInput = $state(null);
	let logoInput = $state(null);

	async function handleUpload(e, category) {
		const files = e.target.files;
		if (!files || files.length === 0) return;
		await imageLibrary.addFiles(files, category);
		e.target.value = '';
	}

	function remove(entry) {
		imageLibrary.remove(entry.id);
	}
</script>

<div class="asset-library">
	<!-- Screenshots -->
	<div class="library-group">
		<div class="group-header">
			<span class="group-title">Screenshots ({imageLibrary.screenshots.length})</span>
			<button class="upload-btn" onclick={() => screenshotInput?.click()} title="Upload screenshots">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
			</button>
			<input bind:this={screenshotInput} type="file" accept="image/*" multiple onchange={(e) => handleUpload(e, 'screenshot')} hidden />
		</div>
		{#if imageLibrary.screenshots.length > 0}
			<div class="thumb-grid">
				{#each imageLibrary.screenshots as entry (entry.id)}
					<div class="thumb" title={entry.name}>
						<img src={entry.src} alt={entry.name} />
						<button class="thumb-remove" onclick={() => remove(entry)} aria-label="Remove {entry.name}">
							<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
						</button>
					</div>
				{/each}
			</div>
		{:else}
			<button class="empty-drop" onclick={() => screenshotInput?.click()}>
				Upload screenshots
			</button>
		{/if}
	</div>

	<!-- Logos / Icons -->
	<div class="library-group">
		<div class="group-header">
			<span class="group-title">Logos / Icons ({imageLibrary.logos.length})</span>
			<button class="upload-btn" onclick={() => logoInput?.click()} title="Upload logos or icons">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
			</button>
			<input bind:this={logoInput} type="file" accept="image/*" multiple onchange={(e) => handleUpload(e, 'logo')} hidden />
		</div>
		{#if imageLibrary.logos.length > 0}
			<div class="thumb-grid">
				{#each imageLibrary.logos as entry (entry.id)}
					<div class="thumb" title={entry.name}>
						<img src={entry.src} alt={entry.name} />
						<button class="thumb-remove" onclick={() => remove(entry)} aria-label="Remove {entry.name}">
							<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
						</button>
					</div>
				{/each}
			</div>
		{:else}
			<button class="empty-drop" onclick={() => logoInput?.click()}>
				Upload logos or icons
			</button>
		{/if}
	</div>
</div>

<style>
	.asset-library {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.library-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.group-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.group-title {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-secondary, #9d9baa);
	}

	.upload-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		cursor: pointer;
		transition: all 0.15s;
	}

	.upload-btn:hover {
		border-color: var(--accent, #f97316);
		color: var(--accent, #f97316);
	}

	.thumb-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 4px;
	}

	.thumb {
		position: relative;
		aspect-ratio: 1;
		border-radius: 5px;
		overflow: hidden;
		background: var(--bg-card, #222228);
	}

	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.thumb-remove {
		position: absolute;
		top: 1px;
		right: 1px;
		width: 16px;
		height: 16px;
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

	.thumb:hover .thumb-remove {
		display: flex;
	}

	.thumb-remove:hover {
		background: #ef4444;
	}

	.empty-drop {
		padding: 8px;
		border: 1px dashed var(--border, #2e2e36);
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 11px;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
		text-align: center;
	}

	.empty-drop:hover {
		border-color: var(--accent, #f97316);
		color: var(--text-primary, #f0eff4);
	}
</style>

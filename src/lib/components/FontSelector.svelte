<script>
	import { GOOGLE_FONTS, loadFont } from '$lib/fonts.js';

	let { value, onchange } = $props();

	let open = $state(false);
	let search = $state('');
	let inputEl = $state(null);

	let filtered = $derived.by(() => {
		if (!search) return GOOGLE_FONTS;
		const q = search.toLowerCase();
		return GOOGLE_FONTS.filter((f) => f.family.toLowerCase().includes(q));
	});

	function toggle() {
		open = !open;
		if (open) {
			search = '';
			// Focus the search input after it renders
			requestAnimationFrame(() => inputEl?.focus());
		}
	}

	function close() {
		open = false;
		search = '';
	}

	async function select(font) {
		await loadFont(font.family);
		onchange?.(font.family);
		close();
	}

	// Load the currently selected font on mount
	$effect(() => {
		if (value) loadFont(value);
	});
</script>

<div class="font-selector">
	<button class="selected-font" onclick={toggle}>
		<span class="font-preview" style="font-family: '{value}', sans-serif;">{value}</span>
		<svg class="chevron" class:open width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
	</button>

	{#if open}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="backdrop" onclick={close}></div>
		<div class="dropdown">
			<div class="search-box">
				<input
					bind:this={inputEl}
					class="search-input"
					type="text"
					placeholder="Search fonts..."
					bind:value={search}
				/>
			</div>
			<div class="font-list">
				{#each filtered as font (font.family)}
					<button
						class="font-option"
						class:active={font.family === value}
						onclick={() => select(font)}
						onmouseenter={() => loadFont(font.family)}
					>
						<span class="font-name" style="font-family: '{font.family}', {font.category};">{font.family}</span>
						<span class="font-cat">{font.category}</span>
					</button>
				{/each}
				{#if filtered.length === 0}
					<div class="no-results">No fonts found</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.font-selector {
		position: relative;
	}

	.selected-font {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 7px 10px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 7px;
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 12px;
		cursor: pointer;
		transition: border-color 0.15s;
	}

	.selected-font:hover {
		border-color: #444;
	}

	.font-preview {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chevron {
		flex-shrink: 0;
		transition: transform 0.15s;
		color: var(--text-secondary, #9d9baa);
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		background: var(--bg-card, #222228);
		border: 1px solid var(--border, #2e2e36);
		border-radius: 8px;
		z-index: 60;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		overflow: hidden;
	}

	.search-box {
		padding: 6px;
		border-bottom: 1px solid var(--border, #2e2e36);
	}

	.search-input {
		width: 100%;
		padding: 6px 8px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 5px;
		background: var(--bg-surface, #1a1a1f);
		color: var(--text-primary, #f0eff4);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 12px;
		outline: none;
		box-sizing: border-box;
	}

	.search-input:focus {
		border-color: var(--accent, #f97316);
	}

	.search-input::placeholder {
		color: var(--text-secondary, #9d9baa);
		opacity: 0.5;
	}

	.font-list {
		max-height: 220px;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--border, #2e2e36) transparent;
	}

	.font-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 7px 10px;
		border: none;
		background: transparent;
		color: var(--text-primary, #f0eff4);
		cursor: pointer;
		transition: background 0.1s;
		text-align: left;
	}

	.font-option:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.font-option.active {
		background: rgba(249, 115, 22, 0.1);
	}

	.font-name {
		font-size: 13px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.font-cat {
		font-size: 9px;
		color: var(--text-secondary, #9d9baa);
		flex-shrink: 0;
		margin-left: 8px;
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}

	.no-results {
		padding: 16px;
		text-align: center;
		font-size: 12px;
		color: var(--text-secondary, #9d9baa);
	}
</style>

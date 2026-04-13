<script>
	import { editor } from '$lib/stores/editor.svelte.js';
	import { ALL_BACKGROUNDS } from '$lib/renderer/backgrounds.js';

	let activeTab = $state('gradient');

	const tabs = [
		{ id: 'gradient', label: 'Gradient' },
		{ id: 'solid', label: 'Solid' },
		{ id: 'pattern', label: 'Pattern' }
	];

	function isSelected(type, id) {
		return editor.background.type === type && editor.background.id === id;
	}

	function select(type, id) {
		editor.background = { type, id };
	}
</script>

<div class="bg-picker">
	<div class="tabs">
		{#each tabs as tab}
			<button
				class="tab"
				class:active={activeTab === tab.id}
				onclick={() => (activeTab = tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<div class="swatches">
		{#if activeTab === 'gradient'}
			{#each ALL_BACKGROUNDS.gradients as g}
				<button
					class="swatch"
					class:selected={isSelected('gradient', g.id)}
					style="background: linear-gradient(135deg, {g.colors[0]}, {g.colors[1]})"
					title={g.label}
					onclick={() => select('gradient', g.id)}
				></button>
			{/each}
		{:else if activeTab === 'solid'}
			{#each ALL_BACKGROUNDS.solids as s}
				<button
					class="swatch"
					class:selected={isSelected('solid', s.id)}
					style="background: {s.color}"
					title={s.label}
					onclick={() => select('solid', s.id)}
				></button>
			{/each}
		{:else if activeTab === 'pattern'}
			{#each ALL_BACKGROUNDS.patterns as p}
				<button
					class="swatch"
					class:selected={isSelected('pattern', p.id)}
					style="background: linear-gradient(135deg, {p.baseGradient[0]}, {p.baseGradient[1]})"
					title={p.label}
					onclick={() => select('pattern', p.id)}
				></button>
			{/each}
		{/if}
	</div>
</div>

<style>
	.bg-picker {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.tabs {
		display: flex;
		gap: 2px;
		background: var(--bg-surface, #1a1a1f);
		border-radius: 8px;
		padding: 3px;
	}

	.tab {
		flex: 1;
		padding: 6px 0;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.tab:hover {
		color: var(--text-primary, #f0eff4);
	}

	.tab.active {
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
	}

	.swatches {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 6px;
	}

	.swatch {
		aspect-ratio: 1;
		border: 2px solid transparent;
		border-radius: 8px;
		cursor: pointer;
		transition: border-color 0.15s, transform 0.1s;
		padding: 0;
	}

	.swatch:hover {
		transform: scale(1.08);
	}

	.swatch.selected {
		border-color: var(--accent, #f97316);
		box-shadow: 0 0 0 1px var(--accent, #f97316);
	}
</style>

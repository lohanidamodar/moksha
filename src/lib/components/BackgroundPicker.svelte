<script>
	import { editor } from '$lib/stores/editor.svelte.js';
	import { ALL_BACKGROUNDS } from '$lib/renderer/backgrounds.js';

	let activeTab = $state('gradient');

	const tabs = [
		{ id: 'gradient', label: 'Gradient' },
		{ id: 'mesh', label: 'Mesh' },
		{ id: 'solid', label: 'Solid' }
	];

	function isSelected(type, id) {
		return editor.background.type === type && editor.background.id === id;
	}

	function select(type, id) {
		editor.background = { type, id };
		editor.commit();
	}

	let customColor = $derived(
		editor.background.type === 'solid' && editor.background.id === 'custom' && editor.background.color
			? editor.background.color
			: '#3b82f6'
	);

	let _customColorTimer = null;
	function selectCustomColor(color) {
		editor.background = { type: 'solid', id: 'custom', color };
		// Coalesce rapid color-picker drags into one history entry
		if (_customColorTimer) clearTimeout(_customColorTimer);
		_customColorTimer = setTimeout(() => editor.commit(), 250);
	}

	function meshSwatchStyle(m) {
		// Build a CSS approximation of the mesh: base + radial gradients
		const radials = m.blobs
			.map(
				(b) =>
					`radial-gradient(circle at ${b.x * 100}% ${b.y * 100}%, ${b.color}${m.tone === 'light' ? '99' : 'cc'} 0%, transparent ${b.r * 100}%)`
			)
			.join(', ');
		return `background: ${radials}, ${m.base}; background-blend-mode: ${m.tone === 'light' ? 'multiply' : 'screen'};`;
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
		{:else if activeTab === 'mesh'}
			{#each ALL_BACKGROUNDS.mesh as m}
				<button
					class="swatch"
					class:selected={isSelected('mesh', m.id)}
					style={meshSwatchStyle(m)}
					title={m.label}
					onclick={() => select('mesh', m.id)}
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
			<!-- Custom color swatch -->
			<label
				class="swatch custom-swatch"
				class:selected={isSelected('solid', 'custom')}
				style="background: {customColor}"
				title="Custom color"
			>
				<input
					type="color"
					value={customColor}
					oninput={(e) => selectCustomColor(e.target.value)}
				/>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 19l7-7 3 3-7 7-3-3z"/>
					<path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
					<path d="M2 2l7.586 7.586"/>
					<circle cx="11" cy="11" r="2"/>
				</svg>
			</label>
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

	.custom-swatch {
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.85);
		mix-blend-mode: normal;
		position: relative;
		filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.4));
	}

	.custom-swatch input[type="color"] {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
		border: none;
		padding: 0;
	}

	.custom-swatch svg {
		width: 50%;
		height: 50%;
		pointer-events: none;
	}
</style>

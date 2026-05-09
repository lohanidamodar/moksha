<script>
	import { editor } from '$lib/stores/editor.svelte.js';
	import { PATTERNS } from '$lib/renderer/backgrounds.js';

	let currentId = $derived(editor.pattern?.id ?? null);

	function select(id) {
		editor.pattern = id ? { id } : null;
	}

	// CSS hint for pattern preview swatches (rough visual approximation)
	function patternStyle(id) {
		switch (id) {
			case 'dots':
				return 'background-image: radial-gradient(circle, rgba(255,255,255,0.4) 15%, transparent 16%); background-size: 8px 8px; background-color: #2a2a2e;';
			case 'soft-grid':
				return 'background-image: radial-gradient(circle, rgba(255,255,255,0.25) 10%, transparent 11%); background-size: 5px 5px; background-color: #2a2a2e;';
			case 'topography':
				return 'background-image: repeating-radial-gradient(circle at 30% 30%, transparent 0, transparent 5px, rgba(255,255,255,0.2) 5px, rgba(255,255,255,0.2) 6px); background-color: #1f2937;';
			case 'bokeh':
				return 'background: radial-gradient(circle at 30% 40%, rgba(124,58,237,0.5), transparent 50%), radial-gradient(circle at 70% 60%, rgba(236,72,153,0.5), transparent 50%), radial-gradient(circle at 50% 80%, rgba(6,182,212,0.5), transparent 50%), #10002b;';
			case 'aurora-streaks':
				return 'background: linear-gradient(180deg, transparent 30%, rgba(124,58,237,0.5) 40%, transparent 50%, rgba(236,72,153,0.4) 60%, transparent 70%, rgba(6,182,212,0.4) 80%, transparent 90%), #0a0a1a;';
			case 'diagonal-lines':
				return 'background-image: repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.18) 4px, rgba(255,255,255,0.18) 5px); background-color: #2a2a2e;';
			case 'hex-grid':
				return 'background: #1a1a2e; background-image: radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1.5px); background-size: 12px 12px;';
			case 'noise':
				return 'background: #2a2a2e;';
			case 'circles':
				return 'background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 6px, rgba(255,255,255,0.15) 6px, rgba(255,255,255,0.15) 7px); background-color: #1a1a2e;';
			case 'waves':
				return 'background-image: repeating-linear-gradient(180deg, transparent, transparent 4px, rgba(255,255,255,0.18) 4px, rgba(255,255,255,0.18) 5px); background-color: #2a2a2e;';
			case 'crosshatch':
				return 'background-image: repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 5px), repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 5px); background-color: #1a1a2e;';
			case 'geometric':
				return 'background: #1f2937; background-image: linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%); background-size: 12px 12px;';
			default:
				return 'background: #2a2a2e;';
		}
	}
</script>

<div class="pattern-picker">
	<div class="swatches">
		<button
			class="swatch none"
			class:selected={currentId === null}
			title="No pattern"
			onclick={() => select(null)}
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="5" y1="19" x2="19" y2="5"/>
			</svg>
		</button>
		{#each PATTERNS as p}
			<button
				class="swatch"
				class:selected={currentId === p.id}
				style={patternStyle(p.id)}
				title={p.label}
				onclick={() => select(p.id)}
			></button>
		{/each}
	</div>
</div>

<style>
	.pattern-picker {
		display: flex;
		flex-direction: column;
		gap: 8px;
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
		overflow: hidden;
	}

	.swatch:hover {
		transform: scale(1.08);
	}

	.swatch.selected {
		border-color: var(--accent, #f97316);
		box-shadow: 0 0 0 1px var(--accent, #f97316);
	}

	.swatch.none {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-card, #222228);
		color: var(--text-secondary, #9d9baa);
	}
</style>

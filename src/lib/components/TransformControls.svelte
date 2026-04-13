<script>
	import { editor } from '$lib/stores/editor.svelte.js';
	import { getAssetType } from '$lib/assets/index.js';
	import { getDefaultPhoneAngle } from '$lib/assets/layout-angles.js';
	import { customLayouts } from '$lib/stores/customLayouts.svelte.js';

	let module = $derived(getAssetType(editor.assetType));
	let inputs = $derived(module?.inputs ?? []);
	let hasPhone = $derived(inputs.some((i) => i.id === 'screenshot'));
	let hasLogo = $derived(inputs.some((i) => i.id === 'logo' || i.id === 'icon'));

	let t = $derived(editor.getTransforms(editor.layout));

	// Resolve the base layout id for angle lookup (custom layouts point to a base)
	let baseLayoutId = $derived.by(() => {
		const id = editor.layout;
		if (id.startsWith('custom_')) {
			return customLayouts.getById(id)?.baseLayout ?? id;
		}
		return id;
	});

	let defaultPhoneAngle = $derived(getDefaultPhoneAngle(baseLayoutId));
	let effectivePhoneRotation = $derived(t.phone.rotation != null ? t.phone.rotation : defaultPhoneAngle);
	let effectiveLogoRotation = $derived(t.logo.rotation != null ? t.logo.rotation : 0);
</script>

<div class="transform-controls">
	{#if hasPhone}
		<div class="control-group">
			<div class="group-label">Phone Frame</div>
			<div class="slider-row">
				<span class="slider-label">X</span>
				<input type="range" class="slider" min="-50" max="50" step="1"
					value={t.phone.x}
					oninput={(e) => editor.setTransform('phone', 'x', +e.target.value)} />
				<span class="slider-value">{t.phone.x}</span>
			</div>
			<div class="slider-row">
				<span class="slider-label">Y</span>
				<input type="range" class="slider" min="-50" max="50" step="1"
					value={t.phone.y}
					oninput={(e) => editor.setTransform('phone', 'y', +e.target.value)} />
				<span class="slider-value">{t.phone.y}</span>
			</div>
			<div class="slider-row">
				<span class="slider-label">Size</span>
				<input type="range" class="slider" min="0.3" max="2" step="0.05"
					value={t.phone.scale}
					oninput={(e) => editor.setTransform('phone', 'scale', +e.target.value)} />
				<span class="slider-value">{Math.round(t.phone.scale * 100)}%</span>
			</div>
			<div class="slider-row">
				<span class="slider-label">Rotate</span>
				<input type="range" class="slider" min="-45" max="45" step="1"
					value={effectivePhoneRotation}
					oninput={(e) => editor.setTransform('phone', 'rotation', +e.target.value)} />
				<span class="slider-value">{effectivePhoneRotation}°</span>
			</div>
		</div>
	{/if}

	{#if hasLogo}
		<div class="control-group">
			<div class="group-label">Logo / Icon</div>
			<div class="slider-row">
				<span class="slider-label">X</span>
				<input type="range" class="slider" min="-50" max="50" step="1"
					value={t.logo.x}
					oninput={(e) => editor.setTransform('logo', 'x', +e.target.value)} />
				<span class="slider-value">{t.logo.x}</span>
			</div>
			<div class="slider-row">
				<span class="slider-label">Y</span>
				<input type="range" class="slider" min="-50" max="50" step="1"
					value={t.logo.y}
					oninput={(e) => editor.setTransform('logo', 'y', +e.target.value)} />
				<span class="slider-value">{t.logo.y}</span>
			</div>
			<div class="slider-row">
				<span class="slider-label">Size</span>
				<input type="range" class="slider" min="0.3" max="2" step="0.05"
					value={t.logo.scale}
					oninput={(e) => editor.setTransform('logo', 'scale', +e.target.value)} />
				<span class="slider-value">{Math.round(t.logo.scale * 100)}%</span>
			</div>
			<div class="slider-row">
				<span class="slider-label">Rotate</span>
				<input type="range" class="slider" min="-45" max="45" step="1"
					value={effectiveLogoRotation}
					oninput={(e) => editor.setTransform('logo', 'rotation', +e.target.value)} />
				<span class="slider-value">{effectiveLogoRotation}°</span>
			</div>
		</div>
	{/if}

	{#if hasPhone || hasLogo}
		<div class="reset-row">
			<button class="reset-btn" onclick={() => editor.resetCurrentTransforms()}>Reset Layout</button>
			<button class="reset-btn" onclick={() => editor.resetAllTransforms()}>Reset All</button>
		</div>
	{/if}
</div>

<style>
	.transform-controls {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.group-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-secondary, #9d9baa);
	}

	.slider-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.slider-label {
		font-size: 10px;
		font-weight: 600;
		color: var(--text-secondary, #9d9baa);
		width: 28px;
		flex-shrink: 0;
	}

	.slider {
		flex: 1;
		height: 4px;
		appearance: none;
		background: var(--border, #2e2e36);
		border-radius: 2px;
		outline: none;
		cursor: pointer;
	}

	.slider::-webkit-slider-thumb {
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--accent, #f97316);
		cursor: pointer;
		border: 2px solid var(--bg-surface, #1a1a1f);
	}

	.slider::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--accent, #f97316);
		cursor: pointer;
		border: 2px solid var(--bg-surface, #1a1a1f);
	}

	.slider-value {
		font-size: 10px;
		font-weight: 600;
		color: var(--text-secondary, #9d9baa);
		width: 34px;
		text-align: right;
		flex-shrink: 0;
		font-family: monospace;
	}

	.reset-row {
		display: flex;
		gap: 6px;
	}

	.reset-btn {
		padding: 5px 10px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 11px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.reset-btn:hover {
		border-color: #444;
		color: var(--text-primary, #f0eff4);
	}
</style>

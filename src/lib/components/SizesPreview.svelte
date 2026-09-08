<script>
	import { editor, transformKey } from '$lib/stores/editor.svelte.js';
	import { getAssetType } from '$core/assets/index.js';
	import { resolveLayout } from '$lib/layoutResolver.js';

	let module = $derived(getAssetType(editor.assetType));
	let sizes = $derived(module?.sizes ?? []);
	let activeSizeId = $derived(editor.sizeId || sizes[0]?.id);

	const DEFAULT_TRANSFORM = { phone: { x: 0, y: 0, scale: 1, rotation: null }, logo: { x: 0, y: 0, scale: 1, rotation: null } };

	let canvasMap = $state({});

	function renderAll() {
		if (!module) return;
		for (const size of sizes) {
			const canvas = canvasMap[size.id];
			if (!canvas) continue;
			canvas.width = size.w;
			canvas.height = size.h;

			const ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, size.w, size.h);

			const sizeTransforms =
				editor.layoutTransforms[transformKey(editor.layout, size.id)] ?? DEFAULT_TRANSFORM;
			const resolved = resolveLayout(editor.layout, sizeTransforms);

			module.render(ctx, {
				layout: resolved.baseLayout,
				background: editor.background,
				pattern: editor.pattern,
				phoneFrame: editor.phoneFrame,
				transforms: resolved.transforms,
				images: { ...editor.images },
				textOverlays: editor.textOverlays.map((o) => ({ ...o }))
			}, size.w, size.h);
		}
	}

	$effect(() => {
		// Track all reactive state we care about
		void editor.layout;
		void editor.background;
		void editor.pattern;
		void editor.phoneFrame;
		void editor.images;
		void editor.layoutTransforms;
		void editor.assetType;
		void editor.textOverlays;
		void sizes;
		renderAll();
	});

	function setActive(sizeId) {
		editor.sizeId = sizeId;
	}

	function thumbDims(size) {
		const cssH = 120;
		const aspect = size.w / size.h;
		let w = Math.round(cssH * aspect);
		let h = cssH;
		if (w > 160) {
			w = 160;
			h = Math.round(w / aspect);
		}
		return { w, h };
	}
</script>

{#if sizes.length > 1}
	<div class="sizes-preview">
		<div class="sizes-grid">
			{#each sizes as size (size.id)}
				{@const dims = thumbDims(size)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="size-card"
					class:active={size.id === activeSizeId}
					onclick={() => setActive(size.id)}
					title={size.label}
				>
					<canvas
						bind:this={canvasMap[size.id]}
						style="width: {dims.w}px; height: {dims.h}px;"
					></canvas>
					<div class="size-label">{size.label}</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.sizes-preview {
		border-bottom: 1px solid var(--border, #2e2e36);
		background: var(--bg-surface, #1a1a1f);
		padding: 8px 12px;
	}

	.sizes-grid {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--border, #2e2e36) transparent;
	}

	.size-card {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 6px;
		border: 2px solid var(--border, #2e2e36);
		border-radius: 6px;
		background: #111114;
		cursor: pointer;
		transition: border-color 0.15s;
	}

	.size-card:hover {
		border-color: #444;
	}

	.size-card.active {
		border-color: var(--accent, #f97316);
	}

	.size-card canvas {
		display: block;
		border-radius: 4px;
	}

	.size-label {
		font-size: 9px;
		color: var(--text-secondary, #9d9baa);
		font-weight: 500;
		max-width: 100px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>

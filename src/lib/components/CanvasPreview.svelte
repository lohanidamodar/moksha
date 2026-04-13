<script>
	import { editor } from '$lib/stores/editor.svelte.js';
	import { getAssetType } from '$lib/assets/index.js';

	let canvas = $state(null);
	let container = $state(null);
	let zoom = $state(1);

	const MIN_ZOOM = 0.25;
	const MAX_ZOOM = 3;
	const ZOOM_STEP = 0.1;

	let module = $derived(getAssetType(editor.assetType));

	// Render at a fixed base size derived from the asset's first output size
	let baseDimensions = $derived.by(() => {
		if (!module || !module.sizes[0]) return { w: 400, h: 600 };
		const size = module.sizes[0];
		const aspect = size.w / size.h;
		// Base render: fit within 560x640
		let w, h;
		if (aspect > 1) {
			w = Math.min(560, size.w);
			h = w / aspect;
			if (h > 640) { h = 640; w = h * aspect; }
		} else {
			h = Math.min(640, size.h);
			w = h * aspect;
			if (w > 560) { w = 560; h = w / aspect; }
		}
		return { w: Math.round(w), h: Math.round(h) };
	});

	let zoomPercent = $derived(Math.round(zoom * 100));

	$effect(() => {
		if (!canvas || !module) return;

		const dims = baseDimensions;
		canvas.width = dims.w;
		canvas.height = dims.h;

		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, dims.w, dims.h);

		const config = {
			layout: editor.layout,
			background: editor.background,
			texts: { ...editor.texts },
			images: { ...editor.images }
		};

		module.render(ctx, config, dims.w, dims.h);
	});

	function zoomIn() {
		zoom = Math.min(MAX_ZOOM, +(zoom + ZOOM_STEP).toFixed(2));
	}

	function zoomOut() {
		zoom = Math.max(MIN_ZOOM, +(zoom - ZOOM_STEP).toFixed(2));
	}

	function zoomFit() {
		zoom = 1;
	}

	function zoomToFit() {
		if (!container || !baseDimensions) { zoom = 1; return; }
		const padding = 40;
		const availW = container.clientWidth - padding * 2;
		const availH = container.clientHeight - padding * 2;
		const fitZoom = Math.min(availW / baseDimensions.w, availH / baseDimensions.h, MAX_ZOOM);
		zoom = Math.max(MIN_ZOOM, +fitZoom.toFixed(2));
	}

	function handleWheel(e) {
		e.preventDefault();
		if (e.deltaY < 0) zoomIn();
		else zoomOut();
	}

	export function generateThumbnail() {
		if (!module) return null;

		const thumbW = 160;
		const size = module.sizes[0];
		const aspect = size.w / size.h;
		const thumbH = Math.round(thumbW / aspect);

		const offscreen = document.createElement('canvas');
		offscreen.width = thumbW;
		offscreen.height = thumbH;
		const ctx = offscreen.getContext('2d');

		const config = {
			layout: editor.layout,
			background: editor.background,
			texts: { ...editor.texts },
			images: { ...editor.images }
		};

		module.render(ctx, config, thumbW, thumbH);
		return offscreen.toDataURL('image/png');
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="canvas-container" bind:this={container} onwheel={handleWheel}>
	<div class="canvas-wrapper" style="transform: scale({zoom});">
		<canvas bind:this={canvas}></canvas>
	</div>

	<div class="zoom-controls">
		<button class="zoom-btn" onclick={zoomOut} aria-label="Zoom out">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
		</button>
		<button class="zoom-label" onclick={zoomFit} title="Reset to 100%">{zoomPercent}%</button>
		<button class="zoom-btn" onclick={zoomIn} aria-label="Zoom in">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
		</button>
		<span class="zoom-divider"></span>
		<button class="zoom-btn" onclick={zoomToFit} aria-label="Fit to screen" title="Fit to screen">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 00-2 2v3"/><path d="M21 8V5a2 2 0 00-2-2h-3"/><path d="M3 16v3a2 2 0 002 2h3"/><path d="M16 21h3a2 2 0 002-2v-3"/></svg>
		</button>
	</div>
</div>

<style>
	.canvas-container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #111114;
		overflow: auto;
		min-height: 0;
		position: relative;
	}

	.canvas-wrapper {
		transition: transform 0.15s ease;
		transform-origin: center center;
		flex-shrink: 0;
	}

	canvas {
		border-radius: 8px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		display: block;
	}

	.zoom-controls {
		position: absolute;
		bottom: 12px;
		right: 12px;
		display: flex;
		align-items: center;
		gap: 2px;
		background: var(--bg-card, #222228);
		border: 1px solid var(--border, #2e2e36);
		border-radius: 8px;
		padding: 3px;
	}

	.zoom-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		cursor: pointer;
		transition: all 0.15s;
	}

	.zoom-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: var(--text-primary, #f0eff4);
	}

	.zoom-label {
		padding: 0 8px;
		height: 28px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 11px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
		min-width: 44px;
	}

	.zoom-label:hover {
		background: rgba(255, 255, 255, 0.08);
		color: var(--text-primary, #f0eff4);
	}

	.zoom-divider {
		width: 1px;
		height: 16px;
		background: var(--border, #2e2e36);
		margin: 0 2px;
	}
</style>

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

	// Render resolution — use the selected size or first size entry
	let renderSize = $derived.by(() => {
		if (!module || !module.sizes[0]) return { w: 1080, h: 1920 };
		if (editor.sizeId) {
			const found = module.sizes.find((s) => s.id === editor.sizeId);
			if (found) return { w: found.w, h: found.h };
		}
		return { w: module.sizes[0].w, h: module.sizes[0].h };
	});

	// Base display size (how big the canvas appears at zoom=1)
	let displaySize = $derived.by(() => {
		const maxW = 420;
		const maxH = 560;
		const aspect = renderSize.w / renderSize.h;
		let w, h;
		if (aspect > 1) {
			w = Math.min(maxW, renderSize.w);
			h = w / aspect;
			if (h > maxH) { h = maxH; w = h * aspect; }
		} else {
			h = Math.min(maxH, renderSize.h);
			w = h * aspect;
			if (w > maxW) { w = maxW; h = w / aspect; }
		}
		return { w: Math.round(w), h: Math.round(h) };
	});

	let zoomPercent = $derived(Math.round(zoom * 100));

	// Render at full resolution, display via CSS sizing
	$effect(() => {
		if (!canvas || !module) return;

		canvas.width = renderSize.w;
		canvas.height = renderSize.h;

		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, renderSize.w, renderSize.h);

		const config = {
			layout: editor.layout,
			background: editor.background,
			texts: { ...editor.texts },
			fonts: { ...editor.fonts },
			transforms: editor.getTransforms(editor.layout),
			images: { ...editor.images }
		};

		module.render(ctx, config, renderSize.w, renderSize.h);
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
		if (!container) { zoom = 1; return; }
		const padding = 40;
		const availW = container.clientWidth - padding * 2;
		const availH = container.clientHeight - padding * 2;
		const fitZoom = Math.min(availW / displaySize.w, availH / displaySize.h, MAX_ZOOM);
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
		const aspect = renderSize.w / renderSize.h;
		const thumbH = Math.round(thumbW / aspect);

		const offscreen = document.createElement('canvas');
		offscreen.width = thumbW;
		offscreen.height = thumbH;
		const ctx = offscreen.getContext('2d');

		// Draw from the already-rendered full-res canvas
		if (canvas) {
			ctx.drawImage(canvas, 0, 0, thumbW, thumbH);
		}
		return offscreen.toDataURL('image/png');
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="canvas-container" bind:this={container} onwheel={handleWheel}>
	<div
		class="canvas-wrapper"
		style="width: {displaySize.w * zoom}px; height: {displaySize.h * zoom}px;"
	>
		<canvas bind:this={canvas}></canvas>
	</div>

	<div class="size-badge">{renderSize.w} x {renderSize.h}</div>

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
		flex-shrink: 0;
	}

	canvas {
		width: 100%;
		height: 100%;
		border-radius: 8px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		display: block;
	}

	.size-badge {
		position: absolute;
		bottom: 12px;
		left: 12px;
		background: var(--bg-card, #222228);
		border: 1px solid var(--border, #2e2e36);
		border-radius: 6px;
		padding: 4px 10px;
		font-size: 11px;
		font-weight: 600;
		color: var(--text-secondary, #9d9baa);
		z-index: 10;
		font-family: var(--font, 'Inter'), monospace;
		letter-spacing: 0.3px;
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
		z-index: 10;
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

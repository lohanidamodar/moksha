<script>
	import { editor } from '$lib/stores/editor.svelte.js';
	import { getAssetType } from '$lib/assets/index.js';
	import { resolveLayout } from '$lib/layoutResolver.js';
	import { measureOverlay, hitTestOverlay } from '$lib/renderer/text-overlays.js';

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

		const resolved = resolveLayout(editor.layout, editor.getTransforms(editor.layout));
		const config = {
			layout: resolved.baseLayout,
			background: editor.background,
			pattern: editor.pattern,
			phoneFrame: editor.phoneFrame,
			transforms: resolved.transforms,
			images: { ...editor.images },
			textOverlays: editor.textOverlays.map((o) => ({ ...o }))
		};

		module.render(ctx, config, renderSize.w, renderSize.h);
	});

	// Selected overlay box in *displayed* coordinates (CSS pixels relative to wrapper)
	let selectionBox = $derived.by(() => {
		const sel = editor.textOverlays.find((o) => o.id === editor.selectedOverlayId);
		if (!sel || !canvas) return null;
		const ctx = canvas.getContext('2d');
		const box = measureOverlay(ctx, sel, renderSize.w, renderSize.h);
		const sx = (displaySize.w * zoom) / renderSize.w;
		const sy = (displaySize.h * zoom) / renderSize.h;
		// expand a touch for visual breathing room
		const padX = 8, padY = 6;
		return {
			x: box.x * sx - padX,
			y: box.y * sy - padY,
			w: box.w * sx + padX * 2,
			h: box.h * sy + padY * 2,
			anchorX: box.anchorX * sx,
			anchorY: box.anchorY * sy,
			rotation: sel.rotation ?? 0
		};
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

	/** Convert a pointer event's clientX/Y to canvas (render-resolution) pixels. */
	function pointerToCanvas(e) {
		const rect = canvas.getBoundingClientRect();
		const px = ((e.clientX - rect.left) / rect.width) * renderSize.w;
		const py = ((e.clientY - rect.top) / rect.height) * renderSize.h;
		return { px, py };
	}

	let drag = null; // { mode: 'move' | 'resize', id, startPx, startPy, startX, startY, startSize }

	function handleCanvasPointerDown(e) {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		const { px, py } = pointerToCanvas(e);

		// Hit-test overlays in reverse z-order (last drawn = top)
		let hit = null;
		for (let i = editor.textOverlays.length - 1; i >= 0; i--) {
			const o = editor.textOverlays[i];
			if (hitTestOverlay(ctx, o, renderSize.w, renderSize.h, px, py)) {
				hit = o;
				break;
			}
		}

		if (hit) {
			editor.selectedOverlayId = hit.id;
			drag = {
				mode: 'move',
				id: hit.id,
				startPx: px,
				startPy: py,
				startX: hit.x ?? 0.5,
				startY: hit.y ?? 0.5
			};
			canvas.setPointerCapture(e.pointerId);
			e.preventDefault();
		} else {
			// Empty space → add new text at click position, select it
			const overlay = editor.addOverlay({
				text: 'New Text',
				x: px / renderSize.w,
				y: py / renderSize.h,
				align: 'center',
				anchor: undefined
			});
			drag = {
				mode: 'move',
				id: overlay.id,
				startPx: px,
				startPy: py,
				startX: overlay.x,
				startY: overlay.y
			};
			canvas.setPointerCapture(e.pointerId);
			e.preventDefault();
		}
	}

	function handleCanvasPointerMove(e) {
		if (!drag) return;
		const { px, py } = pointerToCanvas(e);

		if (drag.mode === 'move') {
			const dx = (px - drag.startPx) / renderSize.w;
			const dy = (py - drag.startPy) / renderSize.h;
			let nx = drag.startX + dx;
			let ny = drag.startY + dy;
			nx = Math.max(0, Math.min(1, nx));
			ny = Math.max(0, Math.min(1, ny));
			// Once dragged, an explicit position overrides any anchor preset
			editor.updateOverlay(drag.id, { x: nx, y: ny, anchor: undefined });
		} else if (drag.mode === 'resize') {
			const overlay = editor.textOverlays.find((o) => o.id === drag.id);
			if (!overlay) return;
			// Resize by distance from anchor — proportional to diagonal change
			const ax = (overlay.x ?? 0.5) * renderSize.w;
			const ay = (overlay.y ?? 0.5) * renderSize.h;
			const startDist = Math.hypot(drag.startPx - ax, drag.startPy - ay);
			const curDist = Math.hypot(px - ax, py - ay);
			if (startDist < 1) return;
			const ratio = curDist / startDist;
			const newSize = Math.max(0.01, Math.min(0.5, drag.startSize * ratio));
			editor.updateOverlay(drag.id, { fontSize: newSize });
		}
	}

	function handleCanvasPointerUp(e) {
		if (drag && canvas?.hasPointerCapture?.(e.pointerId)) {
			canvas.releasePointerCapture(e.pointerId);
		}
		drag = null;
	}

	function handleResizeHandlePointerDown(e) {
		if (!canvas) return;
		const sel = editor.textOverlays.find((o) => o.id === editor.selectedOverlayId);
		if (!sel) return;
		const { px, py } = pointerToCanvas(e);
		drag = {
			mode: 'resize',
			id: sel.id,
			startPx: px,
			startPy: py,
			startSize: sel.fontSize ?? 0.06
		};
		// Capture on the canvas so move/up keep firing even if pointer leaves the handle
		canvas.setPointerCapture(e.pointerId);
		e.stopPropagation();
		e.preventDefault();
	}

	function handleKeyDown(e) {
		if (!editor.selectedOverlayId) return;
		// Don't intercept while typing in an input/textarea
		const tag = e.target?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
		if (e.key === 'Delete' || e.key === 'Backspace') {
			editor.removeOverlay(editor.selectedOverlayId);
			e.preventDefault();
		} else if (e.key === 'Escape') {
			editor.selectedOverlayId = null;
		}
	}

	$effect(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});

	export function generateThumbnail() {
		if (!module) return null;

		const thumbW = 160;
		const aspect = renderSize.w / renderSize.h;
		const thumbH = Math.round(thumbW / aspect);

		const offscreen = document.createElement('canvas');
		offscreen.width = thumbW;
		offscreen.height = thumbH;
		const ctx = offscreen.getContext('2d');

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
		<canvas
			bind:this={canvas}
			onpointerdown={handleCanvasPointerDown}
			onpointermove={handleCanvasPointerMove}
			onpointerup={handleCanvasPointerUp}
			onpointercancel={handleCanvasPointerUp}
		></canvas>

		{#if selectionBox}
			<div
				class="selection-box"
				style="left: {selectionBox.x}px; top: {selectionBox.y}px; width: {selectionBox.w}px; height: {selectionBox.h}px; transform: rotate({selectionBox.rotation}deg); transform-origin: {selectionBox.anchorX - selectionBox.x}px {selectionBox.anchorY - selectionBox.y}px;"
			>
				<button
					class="resize-handle"
					aria-label="Resize text"
					onpointerdown={handleResizeHandlePointerDown}
				></button>
			</div>
		{/if}
	</div>

	<div class="size-badge">{renderSize.w} x {renderSize.h}</div>

	{#if editor.textOverlays.length === 0}
		<div class="hint-badge">Click anywhere to add text</div>
	{/if}

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
		position: relative;
	}

	canvas {
		width: 100%;
		height: 100%;
		border-radius: 8px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		display: block;
		touch-action: none;
		cursor: text;
	}

	.selection-box {
		position: absolute;
		pointer-events: none;
		border: 1.5px dashed var(--accent, #f97316);
		border-radius: 4px;
		box-sizing: border-box;
	}

	.resize-handle {
		position: absolute;
		right: -7px;
		bottom: -7px;
		width: 14px;
		height: 14px;
		border: 2px solid var(--bg, #0f0f11);
		border-radius: 50%;
		background: var(--accent, #f97316);
		cursor: nwse-resize;
		padding: 0;
		pointer-events: auto;
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

	.hint-badge {
		position: absolute;
		top: 12px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--bg-card, #222228);
		border: 1px solid var(--border, #2e2e36);
		border-radius: 6px;
		padding: 5px 12px;
		font-size: 11px;
		font-weight: 500;
		color: var(--text-secondary, #9d9baa);
		z-index: 10;
		font-family: var(--font, 'Inter'), sans-serif;
		opacity: 0.85;
		pointer-events: none;
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

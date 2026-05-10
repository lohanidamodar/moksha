<script>
	import { editor } from '$lib/stores/editor.svelte.js';
	import { getAssetType } from '$lib/assets/index.js';
	import { resolveLayout } from '$lib/layoutResolver.js';
	import { measureOverlay, hitTestOverlay } from '$lib/renderer/text-overlays.js';
	import { tick } from 'svelte';

	let canvas = $state(null);
	let container = $state(null);
	let zoom = $state(1);
	let editingOverlayId = $state(null);
	let editingOriginalText = $state('');
	let editingTextarea = $state(null);

	const MIN_ZOOM = 0.25;
	const MAX_ZOOM = 3;
	const ZOOM_STEP = 0.1;
	const PHONE_SCALE_MIN = 0.3;
	const PHONE_SCALE_MAX = 2;

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
	let scaleX = $derived((displaySize.w * zoom) / renderSize.w);
	let scaleY = $derived((displaySize.h * zoom) / renderSize.h);

	// Build the resolved render config once per state change
	let renderConfig = $derived.by(() => {
		const resolved = resolveLayout(editor.layout, editor.getTransforms(editor.layout));
		return {
			layout: resolved.baseLayout,
			background: editor.background,
			pattern: editor.pattern,
			phoneFrame: editor.phoneFrame,
			transforms: resolved.transforms,
			images: { ...editor.images },
			textOverlays: editor.textOverlays.map((o) => ({ ...o }))
		};
	});

	// Render at full resolution, display via CSS sizing
	$effect(() => {
		if (!canvas || !module) return;

		canvas.width = renderSize.w;
		canvas.height = renderSize.h;

		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, renderSize.w, renderSize.h);

		module.render(ctx, renderConfig, renderSize.w, renderSize.h);
	});

	// Selected text overlay box in *displayed* coordinates (CSS pixels relative to wrapper)
	let selectionBox = $derived.by(() => {
		const sel = editor.textOverlays.find((o) => o.id === editor.selectedOverlayId);
		if (!sel || !canvas) return null;
		const ctx = canvas.getContext('2d');
		const box = measureOverlay(ctx, sel, renderSize.w, renderSize.h);
		// expand a touch for visual breathing room
		const padX = 8, padY = 6;
		return {
			x: box.x * scaleX - padX,
			y: box.y * scaleY - padY,
			w: box.w * scaleX + padX * 2,
			h: box.h * scaleY + padY * 2,
			anchorX: box.anchorX * scaleX,
			anchorY: box.anchorY * scaleY,
			rotation: sel.rotation ?? 0,
			fontPx: box.fontPx * scaleX
		};
	});

	// Phone selection box in displayed coordinates (only present for screenshot asset types)
	let phoneRect = $derived.by(() => {
		if (!module?.getPhoneRect) return null;
		const r = module.getPhoneRect(renderConfig, renderSize.w, renderSize.h);
		return r;
	});

	let phoneSelectionBox = $derived.by(() => {
		if (!phoneRect || editor.selectedElement !== 'phone') return null;
		return {
			cx: phoneRect.x * scaleX,
			cy: phoneRect.y * scaleY,
			w: phoneRect.w * scaleX,
			h: phoneRect.h * scaleY,
			rotation: phoneRect.angle
		};
	});

	function zoomIn()  { zoom = Math.min(MAX_ZOOM, +(zoom + ZOOM_STEP).toFixed(2)); }
	function zoomOut() { zoom = Math.max(MIN_ZOOM, +(zoom - ZOOM_STEP).toFixed(2)); }
	function zoomFit() { zoom = 1; }

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

	/** Hit-test phone in canvas coordinates, accounting for rotation. */
	function hitTestPhone(px, py) {
		if (!phoneRect) return false;
		const { x: cx, y: cy, w, h, angle } = phoneRect;
		const rad = (-angle * Math.PI) / 180;
		const dx = px - cx;
		const dy = py - cy;
		const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
		const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
		return Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2;
	}

	let drag = null; // see drag.mode below

	function handleCanvasPointerDown(e) {
		if (!canvas || editingOverlayId) return;
		const ctx = canvas.getContext('2d');
		const { px, py } = pointerToCanvas(e);

		// 1) Hit-test text overlays (top-most first)
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
			editor.selectedElement = null;
			drag = {
				mode: 'overlay-move',
				id: hit.id,
				startPx: px,
				startPy: py,
				startX: hit.x ?? 0.5,
				startY: hit.y ?? 0.5
			};
			canvas.setPointerCapture(e.pointerId);
			e.preventDefault();
			return;
		}

		// 2) Hit-test phone (screenshot asset types only)
		if (hitTestPhone(px, py)) {
			editor.selectedElement = 'phone';
			editor.selectedOverlayId = null;
			const t = editor.getTransforms(editor.layout);
			drag = {
				mode: 'phone-move',
				startPx: px,
				startPy: py,
				startTx: t.phone.x,
				startTy: t.phone.y
			};
			canvas.setPointerCapture(e.pointerId);
			e.preventDefault();
			return;
		}

		// 3) Empty space → add a new text overlay at click position, select it
		const overlay = editor.addOverlay({
			text: 'New Text',
			x: px / renderSize.w,
			y: py / renderSize.h,
			align: 'center',
			anchor: undefined
		});
		drag = {
			mode: 'overlay-move',
			id: overlay.id,
			startPx: px,
			startPy: py,
			startX: overlay.x,
			startY: overlay.y,
			created: true
		};
		canvas.setPointerCapture(e.pointerId);
		e.preventDefault();
	}

	function handleCanvasPointerMove(e) {
		if (!drag) return;
		const { px, py } = pointerToCanvas(e);

		if (drag.mode === 'overlay-move') {
			const dx = (px - drag.startPx) / renderSize.w;
			const dy = (py - drag.startPy) / renderSize.h;
			let nx = clamp(drag.startX + dx, 0, 1);
			let ny = clamp(drag.startY + dy, 0, 1);
			editor.updateOverlay(drag.id, { x: nx, y: ny, anchor: undefined });
		} else if (drag.mode === 'overlay-resize') {
			const overlay = editor.textOverlays.find((o) => o.id === drag.id);
			if (!overlay) return;
			const ax = (overlay.x ?? 0.5) * renderSize.w;
			const ay = (overlay.y ?? 0.5) * renderSize.h;
			const startDist = Math.hypot(drag.startPx - ax, drag.startPy - ay);
			const curDist = Math.hypot(px - ax, py - ay);
			if (startDist < 1) return;
			const ratio = curDist / startDist;
			const newSize = clamp(drag.startSize * ratio, 0.01, 0.5);
			editor.updateOverlay(drag.id, { fontSize: newSize });
		} else if (drag.mode === 'phone-move') {
			const dx = ((px - drag.startPx) / renderSize.w) * 100;
			const dy = ((py - drag.startPy) / renderSize.h) * 100;
			const nx = clamp(drag.startTx + dx, -50, 50);
			const ny = clamp(drag.startTy + dy, -50, 50);
			editor.setTransform('phone', 'x', Math.round(nx));
			editor.setTransform('phone', 'y', Math.round(ny));
		} else if (drag.mode === 'phone-scale') {
			if (!phoneRect) return;
			const ax = phoneRect.x;
			const ay = phoneRect.y;
			const startDist = Math.hypot(drag.startPx - ax, drag.startPy - ay);
			const curDist = Math.hypot(px - ax, py - ay);
			if (startDist < 1) return;
			const ratio = curDist / startDist;
			const newScale = clamp(drag.startScale * ratio, PHONE_SCALE_MIN, PHONE_SCALE_MAX);
			editor.setTransform('phone', 'scale', +newScale.toFixed(2));
		} else if (drag.mode === 'phone-rotate') {
			if (!phoneRect) return;
			const ax = phoneRect.x;
			const ay = phoneRect.y;
			const startAngle = Math.atan2(drag.startPy - ay, drag.startPx - ax);
			const curAngle = Math.atan2(py - ay, px - ax);
			let deltaDeg = ((curAngle - startAngle) * 180) / Math.PI;
			let next = drag.startRotation + deltaDeg;
			// Snap to 5° increments while holding Shift; clamp slider range -45..45
			next = clamp(Math.round(next), -45, 45);
			editor.setTransform('phone', 'rotation', next);
		} else if (drag.mode === 'overlay-rotate') {
			const overlay = editor.textOverlays.find((o) => o.id === drag.id);
			if (!overlay) return;
			const ax = (overlay.x ?? 0.5) * renderSize.w;
			const ay = (overlay.y ?? 0.5) * renderSize.h;
			const startAngle = Math.atan2(drag.startPy - ay, drag.startPx - ax);
			const curAngle = Math.atan2(py - ay, px - ax);
			let deltaDeg = ((curAngle - startAngle) * 180) / Math.PI;
			let next = drag.startRotation + deltaDeg;
			// Normalize to -180..180
			while (next > 180) next -= 360;
			while (next < -180) next += 360;
			editor.updateOverlay(drag.id, { rotation: Math.round(next) });
		}
	}

	function handleCanvasPointerUp(e) {
		if (drag && canvas?.hasPointerCapture?.(e.pointerId)) {
			canvas.releasePointerCapture(e.pointerId);
		}
		if (drag) editor.commit();
		drag = null;
	}

	function handleResizeHandlePointerDown(e) {
		if (!canvas) return;
		const sel = editor.textOverlays.find((o) => o.id === editor.selectedOverlayId);
		if (!sel) return;
		const { px, py } = pointerToCanvas(e);
		drag = {
			mode: 'overlay-resize',
			id: sel.id,
			startPx: px,
			startPy: py,
			startSize: sel.fontSize ?? 0.06
		};
		canvas.setPointerCapture(e.pointerId);
		e.stopPropagation();
		e.preventDefault();
	}

	function handlePhoneScaleHandlePointerDown(e) {
		if (!canvas || !phoneRect) return;
		const { px, py } = pointerToCanvas(e);
		const t = editor.getTransforms(editor.layout);
		drag = {
			mode: 'phone-scale',
			startPx: px,
			startPy: py,
			startScale: t.phone.scale ?? 1
		};
		canvas.setPointerCapture(e.pointerId);
		e.stopPropagation();
		e.preventDefault();
	}

	function handlePhoneRotateHandlePointerDown(e) {
		if (!canvas || !phoneRect) return;
		const { px, py } = pointerToCanvas(e);
		const t = editor.getTransforms(editor.layout);
		drag = {
			mode: 'phone-rotate',
			startPx: px,
			startPy: py,
			startRotation: t.phone.rotation != null ? t.phone.rotation : (phoneRect.angle ?? 0)
		};
		canvas.setPointerCapture(e.pointerId);
		e.stopPropagation();
		e.preventDefault();
	}

	function handleOverlayRotateHandlePointerDown(e) {
		if (!canvas) return;
		const sel = editor.textOverlays.find((o) => o.id === editor.selectedOverlayId);
		if (!sel) return;
		const { px, py } = pointerToCanvas(e);
		drag = {
			mode: 'overlay-rotate',
			id: sel.id,
			startPx: px,
			startPy: py,
			startRotation: sel.rotation ?? 0
		};
		canvas.setPointerCapture(e.pointerId);
		e.stopPropagation();
		e.preventDefault();
	}

	async function handleCanvasDoubleClick(e) {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		const { px, py } = pointerToCanvas(e);
		for (let i = editor.textOverlays.length - 1; i >= 0; i--) {
			const o = editor.textOverlays[i];
			if (hitTestOverlay(ctx, o, renderSize.w, renderSize.h, px, py)) {
				editor.selectedOverlayId = o.id;
				editor.selectedElement = null;
				editingOriginalText = o.text ?? '';
				editingOverlayId = o.id;
				await tick();
				editingTextarea?.focus();
				editingTextarea?.select();
				e.preventDefault();
				return;
			}
		}
	}

	function commitInlineEdit() {
		editingOverlayId = null;
		editor.commit();
	}

	function cancelInlineEdit(originalText, id) {
		editor.updateOverlay(id, { text: originalText });
		editingOverlayId = null;
	}

	function handleInlineKeyDown(e, originalText, id) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			commitInlineEdit();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			cancelInlineEdit(originalText, id);
		}
	}

	function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

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

	export function zoomInExt() { zoomIn(); }
	export function zoomOutExt() { zoomOut(); }
	export function zoomResetExt() { zoomFit(); }
	export function zoomFitExt() { zoomToFit(); }

	// Cached for the inline editor
	let editingOverlay = $derived(
		editingOverlayId
			? editor.textOverlays.find((o) => o.id === editingOverlayId) ?? null
			: null
	);

	let editingBox = $derived.by(() => {
		if (!editingOverlay || !canvas) return null;
		const ctx = canvas.getContext('2d');
		const box = measureOverlay(ctx, editingOverlay, renderSize.w, renderSize.h);
		const pad = 4;
		return {
			x: box.x * scaleX - pad,
			y: box.y * scaleY - pad,
			w: box.w * scaleX + pad * 2,
			h: box.h * scaleY + pad * 2,
			anchorX: box.anchorX * scaleX,
			anchorY: box.anchorY * scaleY,
			rotation: editingOverlay.rotation ?? 0,
			fontPx: box.fontPx * scaleX,
			lineHeight: box.lineHeight * scaleY,
			align: box.align,
			weight: editingOverlay.weight ?? 700,
			font: editingOverlay.font ?? 'Inter'
		};
	});
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
			ondblclick={handleCanvasDoubleClick}
		></canvas>

		{#if phoneSelectionBox}
			<div
				class="phone-selection"
				style="left: {phoneSelectionBox.cx - phoneSelectionBox.w / 2}px; top: {phoneSelectionBox.cy - phoneSelectionBox.h / 2}px; width: {phoneSelectionBox.w}px; height: {phoneSelectionBox.h}px; transform: rotate({phoneSelectionBox.rotation}deg);"
			>
				<button
					class="rotate-handle"
					aria-label="Rotate phone"
					onpointerdown={handlePhoneRotateHandlePointerDown}
				>
					<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-3-6.7"/><polyline points="21 4 21 10 15 10"/></svg>
				</button>
				<button
					class="scale-handle"
					aria-label="Resize phone"
					onpointerdown={handlePhoneScaleHandlePointerDown}
				></button>
			</div>
		{/if}

		{#if selectionBox && !editingOverlayId}
			<div
				class="selection-box"
				style="left: {selectionBox.x}px; top: {selectionBox.y}px; width: {selectionBox.w}px; height: {selectionBox.h}px; transform: rotate({selectionBox.rotation}deg); transform-origin: {selectionBox.anchorX - selectionBox.x}px {selectionBox.anchorY - selectionBox.y}px;"
			>
				<button
					class="rotate-handle"
					aria-label="Rotate text"
					onpointerdown={handleOverlayRotateHandlePointerDown}
				>
					<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-3-6.7"/><polyline points="21 4 21 10 15 10"/></svg>
				</button>
				<button
					class="resize-handle"
					aria-label="Resize text"
					onpointerdown={handleResizeHandlePointerDown}
				></button>
			</div>
		{/if}

		{#if editingOverlay && editingBox}
			<textarea
				class="inline-editor"
				bind:this={editingTextarea}
				value={editingOverlay.text}
				oninput={(e) => editor.updateOverlay(editingOverlay.id, { text: e.target.value })}
				onblur={commitInlineEdit}
				onkeydown={(e) => handleInlineKeyDown(e, editingOriginalText, editingOverlay.id)}
				style="left: {editingBox.x}px; top: {editingBox.y}px; min-width: {editingBox.w}px; min-height: {editingBox.h}px; transform: rotate({editingBox.rotation}deg); transform-origin: {editingBox.anchorX - editingBox.x}px {editingBox.anchorY - editingBox.y}px; font: {editingBox.weight} {editingBox.fontPx}px '{editingBox.font}', sans-serif; line-height: {editingBox.lineHeight}px; text-align: {editingBox.align};"
			></textarea>
		{/if}
	</div>

	<div class="size-badge">{renderSize.w} x {renderSize.h}</div>

	{#if editor.textOverlays.length === 0 && !editor.selectedElement}
		<div class="hint-badge">Click anywhere to add text · double-click to edit · drag the phone to move</div>
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
		background: var(--bg-canvas, #111114);
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

	.phone-selection {
		position: absolute;
		pointer-events: none;
		border: 1.5px solid var(--accent, #f97316);
		border-radius: 4px;
		box-sizing: border-box;
	}

	.scale-handle {
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

	.rotate-handle {
		position: absolute;
		top: -28px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border: 2px solid var(--bg, #0f0f11);
		border-radius: 50%;
		background: var(--accent, #f97316);
		color: #fff;
		cursor: grab;
		padding: 0;
		pointer-events: auto;
	}

	.rotate-handle:active {
		cursor: grabbing;
	}

	.inline-editor {
		position: absolute;
		background: rgba(0, 0, 0, 0.5);
		color: #fff;
		border: 1.5px dashed var(--accent, #f97316);
		border-radius: 4px;
		outline: none;
		padding: 0;
		margin: 0;
		resize: none;
		overflow: hidden;
		font-family: inherit;
		caret-color: var(--accent, #f97316);
		box-sizing: border-box;
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

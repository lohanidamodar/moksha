<script>
	import Header from './Header.svelte';
	import CanvasPreview from './CanvasPreview.svelte';
	import OptionsPanel from './OptionsPanel.svelte';
	import QueueStrip from './QueueStrip.svelte';
	import SizesPreview from './SizesPreview.svelte';
	import { editor } from '$lib/stores/editor.svelte.js';

	let canvasPreview = $state(null);

	function generateThumbnail() {
		return canvasPreview?.generateThumbnail() ?? null;
	}

	function isTextField(target) {
		const tag = target?.tagName;
		return tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable;
	}

	function nudgeSelection(dx, dy, shiftStep) {
		// dx/dy are in pixels; convert to fraction of canvas based on the editor's render size.
		// We don't know the size here, so use a sane default of 1080x1920 — the slider/transform
		// units already work at fractions, and this just provides a comfortable nudge feel.
		const pxStep = shiftStep ? 10 : 1;
		if (editor.selectedOverlayId) {
			const o = editor.getSelectedOverlay();
			if (!o) return;
			// 1px ≈ 1/W of canvas; for a 1080-wide canvas that's ~0.000926. We use a constant
			// fraction so behavior is consistent regardless of asset.
			const frac = 0.001 * pxStep;
			const nx = Math.max(0, Math.min(1, (o.x ?? 0.5) + dx * frac));
			const ny = Math.max(0, Math.min(1, (o.y ?? 0.5) + dy * frac));
			editor.updateOverlay(o.id, { x: nx, y: ny, anchor: undefined });
			editor.commit();
		} else if (editor.selectedElement === 'phone') {
			const t = editor.getTransforms(editor.layout);
			const nx = Math.max(-50, Math.min(50, (t.phone.x ?? 0) + dx * pxStep));
			const ny = Math.max(-50, Math.min(50, (t.phone.y ?? 0) + dy * pxStep));
			editor.setTransform('phone', 'x', nx);
			editor.setTransform('phone', 'y', ny);
			editor.commit();
		}
	}

	function handleKeyDown(e) {
		if (isTextField(e.target)) return;
		const mod = e.ctrlKey || e.metaKey;

		// Undo / redo
		if (mod && e.key.toLowerCase() === 'z') {
			e.preventDefault();
			if (e.shiftKey) editor.redo();
			else editor.undo();
			return;
		}
		if (mod && e.key.toLowerCase() === 'y') {
			e.preventDefault();
			editor.redo();
			return;
		}

		// Duplicate selected text overlay
		if (mod && e.key.toLowerCase() === 'd') {
			if (editor.selectedOverlayId) {
				e.preventDefault();
				editor.duplicateOverlay(editor.selectedOverlayId);
				editor.commit();
			}
			return;
		}

		// Zoom
		if (e.key === '+' || e.key === '=') {
			e.preventDefault();
			canvasPreview?.zoomInExt();
			return;
		}
		if (e.key === '-' || e.key === '_') {
			e.preventDefault();
			canvasPreview?.zoomOutExt();
			return;
		}
		if (e.key === '0') {
			e.preventDefault();
			canvasPreview?.zoomResetExt();
			return;
		}

		// Selection-scoped shortcuts
		if (e.key === 'Delete' || e.key === 'Backspace') {
			if (editor.selectedOverlayId) {
				e.preventDefault();
				editor.removeOverlay(editor.selectedOverlayId);
				editor.commit();
			}
			return;
		}
		if (e.key === 'Escape') {
			editor.selectedOverlayId = null;
			editor.selectedElement = null;
			return;
		}
		if (e.key === 'ArrowLeft')  { e.preventDefault(); nudgeSelection(-1, 0, e.shiftKey); return; }
		if (e.key === 'ArrowRight') { e.preventDefault(); nudgeSelection( 1, 0, e.shiftKey); return; }
		if (e.key === 'ArrowUp')    { e.preventDefault(); nudgeSelection(0, -1, e.shiftKey); return; }
		if (e.key === 'ArrowDown')  { e.preventDefault(); nudgeSelection(0,  1, e.shiftKey); return; }
	}

	$effect(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});
</script>

<div class="editor-shell">
	<Header />

	<div class="editor-body">
		<div class="editor-left">
			<CanvasPreview bind:this={canvasPreview} />
			<SizesPreview />
			<QueueStrip />
		</div>
		<OptionsPanel {generateThumbnail} />
	</div>
</div>

<style>
	.editor-shell {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: var(--bg, #0f0f11);
		color: var(--text-primary, #f0eff4);
		font-family: var(--font, 'Inter'), sans-serif;
	}

	.editor-body {
		display: flex;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.editor-left {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
</style>

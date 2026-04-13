<script>
	import { queue } from '$lib/stores/queue.svelte.js';
	import { exportZip } from '$lib/renderer/export.js';
	import Header from './Header.svelte';
	import CanvasPreview from './CanvasPreview.svelte';
	import OptionsPanel from './OptionsPanel.svelte';
	import QueuePanel from './QueuePanel.svelte';

	let queueOpen = $state(false);
	let canvasPreview = $state(null);
	let exporting = $state(false);

	function toggleQueue() {
		queueOpen = !queueOpen;
	}

	function closeQueue() {
		queueOpen = false;
	}

	function generateThumbnail() {
		return canvasPreview?.generateThumbnail() ?? null;
	}

	async function handleExport() {
		if (queue.count === 0 || exporting) return;
		exporting = true;

		try {
			await exportZip(queue.items);
		} catch (err) {
			console.error('Export failed:', err);
		} finally {
			exporting = false;
		}
	}
</script>

<div class="editor-shell">
	<Header onToggleQueue={toggleQueue} {queueOpen} onExport={handleExport} />

	<div class="editor-body">
		<CanvasPreview bind:this={canvasPreview} />
		<OptionsPanel {generateThumbnail} />
	</div>

	{#if queueOpen}
		<QueuePanel onClose={closeQueue} />
	{/if}
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
</style>

<script>
	import Header from './Header.svelte';
	import CanvasPreview from './CanvasPreview.svelte';
	import OptionsPanel from './OptionsPanel.svelte';
	import QueueStrip from './QueueStrip.svelte';

	let canvasPreview = $state(null);

	function generateThumbnail() {
		return canvasPreview?.generateThumbnail() ?? null;
	}
</script>

<div class="editor-shell">
	<Header />

	<div class="editor-body">
		<div class="editor-left">
			<CanvasPreview bind:this={canvasPreview} />
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

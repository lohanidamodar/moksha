<script>
	import { editor } from '$lib/stores/editor.svelte.js';
	import { queue } from '$lib/stores/queue.svelte.js';
	import { getAssetType } from '$lib/assets/index.js';
	import LayoutPicker from './LayoutPicker.svelte';
	import BackgroundPicker from './BackgroundPicker.svelte';
	import ImageUpload from './ImageUpload.svelte';

	let { generateThumbnail } = $props();

	let module = $derived(getAssetType(editor.assetType));
	let inputs = $derived(module?.inputs ?? []);
	let isEditing = $derived(!!editor.editingQueueId);

	function handleAddToQueue() {
		const thumbnail = generateThumbnail?.() ?? null;

		const config = {
			assetType: editor.assetType,
			layout: editor.layout,
			background: { ...editor.background },
			texts: { ...editor.texts },
			images: { ...editor.images },
			thumbnail
		};

		if (isEditing) {
			queue.update(editor.editingQueueId, config);
			editor.editingQueueId = null;
		} else {
			queue.add(config);
		}
	}

	function handleTextInput(inputId, e) {
		editor.texts[inputId] = e.target.value;
	}
</script>

<aside class="options-panel">
	<div class="panel-scroll">
		<section class="section">
			<h3 class="section-title">Layout</h3>
			<LayoutPicker />
		</section>

		<section class="section">
			<h3 class="section-title">Background</h3>
			<BackgroundPicker />
		</section>

		<section class="section">
			<h3 class="section-title">Content</h3>
			<div class="inputs">
				{#each inputs as input}
					<div class="input-group">
						<label class="input-label" for="input-{input.id}">{input.label}</label>

						{#if input.type === 'image'}
							<ImageUpload
								inputId={input.id}
								label={input.label}
								placeholder={input.placeholder}
							/>
						{:else if input.type === 'textarea'}
							<textarea
								id="input-{input.id}"
								class="text-input textarea"
								placeholder={input.placeholder}
								value={editor.texts[input.id] ?? ''}
								oninput={(e) => handleTextInput(input.id, e)}
								rows="3"
							></textarea>
						{:else}
							<input
								id="input-{input.id}"
								class="text-input"
								type="text"
								placeholder={input.placeholder}
								value={editor.texts[input.id] ?? ''}
								oninput={(e) => handleTextInput(input.id, e)}
							/>
						{/if}
					</div>
				{/each}
			</div>
		</section>
	</div>

	<div class="panel-footer">
		<button class="add-queue-btn" onclick={handleAddToQueue}>
			{#if isEditing}
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="20 6 9 17 4 12"></polyline>
				</svg>
				Update in Queue
			{:else}
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="12" y1="5" x2="12" y2="19"></line>
					<line x1="5" y1="12" x2="19" y2="12"></line>
				</svg>
				Add to Queue
			{/if}
		</button>
	</div>
</aside>

<style>
	.options-panel {
		width: 320px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		background: var(--bg-surface, #1a1a1f);
		border-left: 1px solid var(--border, #2e2e36);
		height: 100%;
	}

	.panel-scroll {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		scrollbar-width: thin;
		scrollbar-color: var(--border, #2e2e36) transparent;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.section-title {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.8px;
		color: var(--text-secondary, #9d9baa);
		margin: 0;
	}

	.inputs {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.input-label {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-secondary, #9d9baa);
	}

	.text-input {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 8px;
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 13px;
		outline: none;
		transition: border-color 0.15s;
		box-sizing: border-box;
	}

	.text-input::placeholder {
		color: var(--text-secondary, #9d9baa);
		opacity: 0.5;
	}

	.text-input:focus {
		border-color: var(--accent, #f97316);
	}

	.textarea {
		resize: vertical;
		min-height: 60px;
	}

	.panel-footer {
		padding: 12px 16px;
		border-top: 1px solid var(--border, #2e2e36);
	}

	.add-queue-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		padding: 10px 16px;
		border: none;
		border-radius: 8px;
		background: var(--accent, #f97316);
		color: #fff;
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}

	.add-queue-btn:hover {
		background: #ea6c10;
	}
</style>

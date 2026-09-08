<script>
	import { editor } from '$lib/stores/editor.svelte.js';
	import { queue } from '$lib/stores/queue.svelte.js';
	import { getAssetType } from '$core/assets/index.js';
	import LayoutPicker from './LayoutPicker.svelte';
	import BackgroundPicker from './BackgroundPicker.svelte';
	import PatternPicker from './PatternPicker.svelte';
	import AssetLibrary from './AssetLibrary.svelte';
	import ImageSelector from './ImageSelector.svelte';
	import TransformControls from './TransformControls.svelte';
	import TextOverlaysPanel from './TextOverlaysPanel.svelte';
	import { PHONE_FRAMES } from '$core/renderer/phone-frame.js';
	import { GRADIENTS, MESH, SOLIDS, PATTERNS } from '$core/renderer/backgrounds.js';

	let { generateThumbnail } = $props();

	let module = $derived(getAssetType(editor.assetType));
	let sizes = $derived(module?.sizes ?? []);
	let currentSizeId = $derived(editor.sizeId || sizes[0]?.id);
	let inputs = $derived(module?.inputs ?? []);
	let imageInputs = $derived(inputs.filter((i) => i.type === 'image'));
	let isEditing = $derived(!!editor.editingQueueId);
	let availableFrames = $derived(
		module?.allowedPhoneFrames
			? PHONE_FRAMES.filter((f) => module.allowedPhoneFrames.includes(f.id))
			: PHONE_FRAMES
	);

	function deepCopy(obj) {
		return JSON.parse(JSON.stringify(obj));
	}

	function pickRandom(arr) {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	function randomize() {
		// Roll a random background type weighted toward gradient/mesh
		const r = Math.random();
		if (r < 0.4) {
			const g = pickRandom(GRADIENTS);
			editor.background = { type: 'gradient', id: g.id };
		} else if (r < 0.75) {
			const m = pickRandom(MESH);
			editor.background = { type: 'mesh', id: m.id };
		} else {
			const s = pickRandom(SOLIDS);
			editor.background = { type: 'solid', id: s.id };
		}
		// 60% chance of having a pattern overlay
		if (Math.random() < 0.6) {
			const p = pickRandom(PATTERNS);
			editor.pattern = { id: p.id };
		} else {
			editor.pattern = null;
		}
	}

	function handleAddToQueue() {
		const thumbnail = generateThumbnail?.() ?? null;

		const config = {
			assetType: editor.assetType,
			sizeId: editor.sizeId,
			layout: editor.layout,
			background: deepCopy(editor.background),
			pattern: editor.pattern ? deepCopy(editor.pattern) : null,
			phoneFrame: editor.phoneFrame,
			layoutTransforms: deepCopy(editor.layoutTransforms),
			images: { ...editor.images },
			textOverlays: deepCopy(editor.textOverlays),
			thumbnail
		};

		if (isEditing) {
			queue.update(editor.editingQueueId, config);
			editor.editingQueueId = null;
		} else {
			queue.add(config);
		}
	}
</script>

<aside class="options-panel">
	<div class="panel-scroll">
		<section class="section">
			<h3 class="section-title">Assets</h3>
			<AssetLibrary />
		</section>

		{#if sizes.length > 1}
			<section class="section">
				<h3 class="section-title">Format</h3>
				<select
					class="format-select"
					value={currentSizeId}
					onchange={(e) => editor.sizeId = e.target.value}
				>
					{#each sizes as size (size.id)}
						<option value={size.id}>{size.label}</option>
					{/each}
				</select>
			</section>
		{/if}

		<section class="section">
			<h3 class="section-title">Layout</h3>
			<LayoutPicker />
		</section>

		<section class="section">
			<div class="section-header">
				<h3 class="section-title">Background</h3>
				<button class="randomize-btn" onclick={randomize} title="Random background + pattern">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="16 3 21 3 21 8"/>
						<line x1="4" y1="20" x2="21" y2="3"/>
						<polyline points="21 16 21 21 16 21"/>
						<line x1="15" y1="15" x2="21" y2="21"/>
						<line x1="4" y1="4" x2="9" y2="9"/>
					</svg>
					Randomize
				</button>
			</div>
			<BackgroundPicker />
		</section>

		<section class="section">
			<h3 class="section-title">Pattern</h3>
			<PatternPicker />
		</section>

		{#if imageInputs.some((i) => i.id === 'screenshot')}
			<section class="section">
				<h3 class="section-title">Phone Frame</h3>
				<select
					class="format-select"
					value={editor.phoneFrame}
					onchange={(e) => editor.phoneFrame = e.target.value}
				>
					{#each availableFrames as frame}
						<option value={frame.id}>{frame.label}</option>
					{/each}
				</select>
			</section>
		{/if}

		<section class="section">
			<h3 class="section-title">Transform</h3>
			<TransformControls />
		</section>

		{#if imageInputs.length > 0}
			<section class="section">
				<h3 class="section-title">Images</h3>
				<div class="inputs">
					{#each imageInputs as input}
						<div class="input-group">
							<label class="input-label">{input.label}</label>
							<ImageSelector inputId={input.id} />
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<section class="section">
			<h3 class="section-title">Text</h3>
			<TextOverlaysPanel />
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

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.randomize-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 10px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.randomize-btn:hover {
		border-color: var(--accent, #f97316);
		color: var(--accent, #f97316);
	}

	.format-select {
		width: 100%;
		padding: 7px 10px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 7px;
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 12px;
		cursor: pointer;
		outline: none;
		transition: border-color 0.15s;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239d9baa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 10px center;
		padding-right: 30px;
	}

	.format-select:hover {
		border-color: #444;
	}

	.format-select:focus {
		border-color: var(--accent, #f97316);
	}

	.format-select option {
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
	}

	.inputs {
		display: flex;
		flex-direction: column;
		gap: 12px;
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

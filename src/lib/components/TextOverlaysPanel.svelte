<script>
	import { editor } from '$lib/stores/editor.svelte.js';
	import { ANCHOR_IDS } from '$lib/renderer/text-overlays.js';
	import FontSelector from './FontSelector.svelte';

	let selected = $derived(editor.textOverlays.find((o) => o.id === editor.selectedOverlayId) ?? null);

	function addAtCenter() {
		editor.addOverlay({ text: 'New Text', x: 0.5, y: 0.5, align: 'center' });
	}

	function selectOverlay(id) {
		editor.selectedOverlayId = id;
	}

	function updateField(field, value) {
		if (!selected) return;
		const patch = { [field]: value };
		// If the user picks an anchor, drop x/y so the anchor takes effect
		if (field === 'anchor' && value) {
			patch.x = undefined;
			patch.y = undefined;
		}
		// If the user nudges x or y manually, drop the anchor
		if (field === 'x' || field === 'y') {
			patch.anchor = undefined;
		}
		editor.updateOverlay(selected.id, patch);
	}

	function removeSelected() {
		if (selected) editor.removeOverlay(selected.id);
	}

	const ALIGNS = [
		{ id: 'left', label: 'L' },
		{ id: 'center', label: 'C' },
		{ id: 'right', label: 'R' }
	];
</script>

<div class="overlays-panel">
	<div class="header-row">
		<button class="add-btn" onclick={addAtCenter}>
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
			Add Text
		</button>
		<span class="hint">Click canvas to place</span>
	</div>

	{#if editor.textOverlays.length > 0}
		<ul class="overlay-list">
			{#each editor.textOverlays as o (o.id)}
				<li>
					<button
						class="overlay-row"
						class:active={o.id === editor.selectedOverlayId}
						onclick={() => selectOverlay(o.id)}
					>
						<span class="overlay-label">{(o.text || '(empty)').slice(0, 28)}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if selected}
		<div class="editor-block">
			<label class="field">
				<span class="field-label">Text</span>
				<textarea
					class="text-input textarea"
					rows="2"
					value={selected.text}
					oninput={(e) => updateField('text', e.target.value)}
				></textarea>
			</label>

			<label class="field">
				<span class="field-label">Font</span>
				<FontSelector value={selected.font} onchange={(f) => updateField('font', f)} />
			</label>

			<div class="row-2">
				<label class="field">
					<span class="field-label">Weight</span>
					<select
						class="select"
						value={selected.weight}
						onchange={(e) => updateField('weight', +e.target.value)}
					>
						{#each [400, 500, 600, 700, 800, 900] as w}
							<option value={w}>{w}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span class="field-label">Color</span>
					<div class="color-row">
						<input
							type="color"
							class="color-input"
							value={selected.color || '#ffffff'}
							oninput={(e) => updateField('color', e.target.value)}
						/>
						<button class="auto-btn" class:active={!selected.color} onclick={() => updateField('color', null)}>Auto</button>
					</div>
				</label>
			</div>

			<div class="slider-row">
				<span class="slider-label">Size</span>
				<input
					type="range"
					class="slider"
					min="0.015"
					max="0.25"
					step="0.005"
					value={selected.fontSize}
					oninput={(e) => updateField('fontSize', +e.target.value)}
				/>
				<span class="slider-value">{Math.round(selected.fontSize * 1000) / 10}%</span>
			</div>

			<div class="slider-row">
				<span class="slider-label">Rotate</span>
				<input
					type="range"
					class="slider"
					min="-180"
					max="180"
					step="1"
					value={selected.rotation}
					oninput={(e) => updateField('rotation', +e.target.value)}
				/>
				<span class="slider-value">{selected.rotation}°</span>
			</div>

			<div class="field">
				<span class="field-label">Align</span>
				<div class="align-row">
					{#each ALIGNS as a}
						<button
							class="align-btn"
							class:active={selected.align === a.id}
							onclick={() => updateField('align', a.id)}
						>{a.label}</button>
					{/each}
				</div>
			</div>

			<label class="field">
				<span class="field-label">Anchor preset</span>
				<select
					class="select"
					value={selected.anchor || ''}
					onchange={(e) => updateField('anchor', e.target.value || undefined)}
				>
					<option value="">— custom —</option>
					{#each ANCHOR_IDS as a}
						<option value={a}>{a.replace(/-/g, ' ')}</option>
					{/each}
				</select>
			</label>

			<label class="checkbox-row">
				<input
					type="checkbox"
					checked={selected.shadow !== false}
					onchange={(e) => updateField('shadow', e.target.checked)}
				/>
				<span>Drop shadow</span>
			</label>

			<button class="delete-btn" onclick={removeSelected}>Delete text</button>
		</div>
	{/if}
</div>

<style>
	.overlays-panel { display: flex; flex-direction: column; gap: 10px; }

	.header-row { display: flex; align-items: center; justify-content: space-between; }

	.add-btn {
		display: flex; align-items: center; gap: 6px;
		padding: 6px 10px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 7px;
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 12px; font-weight: 600;
		cursor: pointer;
	}
	.add-btn:hover { border-color: var(--accent, #f97316); color: var(--accent, #f97316); }

	.hint { font-size: 10.5px; color: var(--text-secondary, #9d9baa); opacity: 0.8; }

	.overlay-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }

	.overlay-row {
		width: 100%; text-align: left;
		padding: 6px 10px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 12px;
		cursor: pointer;
		display: flex; align-items: center; gap: 8px;
	}
	.overlay-row:hover { border-color: var(--border-hover, #444); }
	.overlay-row.active { border-color: var(--accent, #f97316); color: var(--text-primary, #f0eff4); }

	.overlay-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

	.editor-block {
		display: flex; flex-direction: column; gap: 10px;
		padding: 10px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 8px;
		background: var(--bg-card, #222228);
	}

	.field { display: flex; flex-direction: column; gap: 5px; }
	.field-label { font-size: 11px; font-weight: 600; color: var(--text-secondary, #9d9baa); }

	.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

	.text-input, .select {
		padding: 7px 10px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 7px;
		background: var(--bg-surface, #1a1a1f);
		color: var(--text-primary, #f0eff4);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 12px;
		outline: none;
		box-sizing: border-box;
		width: 100%;
	}
	.textarea { resize: vertical; min-height: 50px; }
	.text-input:focus, .select:focus { border-color: var(--accent, #f97316); }

	.slider-row { display: flex; align-items: center; gap: 8px; }
	.slider-label { font-size: 10px; font-weight: 600; color: var(--text-secondary, #9d9baa); width: 38px; flex-shrink: 0; }
	.slider { flex: 1; height: 4px; appearance: none; background: var(--border, #2e2e36); border-radius: 2px; outline: none; cursor: pointer; }
	.slider::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--accent, #f97316); cursor: pointer; border: 2px solid var(--bg-surface, #1a1a1f); }
	.slider::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--accent, #f97316); cursor: pointer; border: 2px solid var(--bg-surface, #1a1a1f); }
	.slider-value { font-size: 10px; font-weight: 600; color: var(--text-secondary, #9d9baa); width: 40px; text-align: right; flex-shrink: 0; font-family: monospace; }

	.align-row { display: flex; gap: 4px; }
	.align-btn {
		flex: 1; padding: 5px 0;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 11px; font-weight: 600;
		cursor: pointer;
	}
	.align-btn:hover { border-color: var(--border-hover, #444); }
	.align-btn.active { border-color: var(--accent, #f97316); color: var(--accent, #f97316); }

	.color-row { display: flex; align-items: center; gap: 6px; }
	.color-input {
		width: 32px; height: 28px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 6px;
		background: transparent; padding: 2px;
		cursor: pointer;
	}
	.auto-btn {
		flex: 1; padding: 5px 8px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 11px; font-weight: 600;
		cursor: pointer;
	}
	.auto-btn.active { border-color: var(--accent, #f97316); color: var(--accent, #f97316); }

	.checkbox-row { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary, #9d9baa); cursor: pointer; }
	.checkbox-row input { accent-color: var(--accent, #f97316); }

	.delete-btn {
		padding: 6px 10px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 6px;
		background: transparent;
		color: var(--danger, #ef4444);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 11px; font-weight: 600;
		cursor: pointer;
	}
	.delete-btn:hover { border-color: var(--danger, #ef4444); }
</style>

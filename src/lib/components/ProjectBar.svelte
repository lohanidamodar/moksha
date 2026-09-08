<script>
	/**
	 * The project strip: which project is open, its assets, the locale being
	 * edited, the shared design, and saving back to moksha.json.
	 *
	 * Only shown when the studio was opened on a project. Without one the
	 * editor still works as a scratchpad, with the queue below.
	 */
	import { onMount } from 'svelte';
	import { project } from '$lib/stores/project.svelte.js';
	import { assetTypes } from '$core/assets/index.js';
	import ProjectDesignPanel from './ProjectDesignPanel.svelte';

	let busy = $state(false);
	let showDesign = $state(false);
	let renaming = $state(null);

	onMount(() => {
		project.load();
	});

	async function guard(work) {
		busy = true;
		try {
			await work();
		} finally {
			busy = false;
		}
	}

	const open = (id) => guard(() => project.openAsset(id));
	const add = (assetType) => guard(() => project.addAsset(assetType));
	const duplicate = (id) => guard(() => project.duplicateAsset(id));

	function commit() {
		project.commitOpenAsset();
	}

	function remove(id) {
		// The file is on disk and in git; an undo stack here would be a second
		// source of truth for something the user can already recover.
		if (!confirm(`Remove "${id}" from the project?`)) return;
		project.removeAsset(id);
	}

	function finishRename(id, value) {
		renaming = null;
		project.renameAsset(id, value);
	}

	async function save() {
		if (project.openAssetId) commit();
		await project.save();
	}
</script>

{#if project.loaded && project.project}
	<div class="project-bar">
		<div class="row">
			<span class="app-name" title={project.path}>{project.project.app?.name || 'Untitled'}</span>
			<code class="path">{project.label}</code>

			{#if project.locales.length > 1}
				<label class="locale">
					Locale
					<select
						value={project.locale}
						onchange={(e) => project.setLocale(e.currentTarget.value)}
						disabled={busy}
					>
						{#each project.locales as locale (locale)}
							<option value={locale}>{locale}</option>
						{/each}
					</select>
				</label>
			{/if}

			<button class="ghost" class:on={showDesign} onclick={() => (showDesign = !showDesign)}>
				Design {showDesign ? '▾' : '▸'}
			</button>

			<div class="spacer"></div>

			{#if project.dirty}<span class="dirty">unsaved</span>{/if}
			<a class="ghost" href="/preview">Store preview</a>
			<button class="save" onclick={save} disabled={project.saving || !project.dirty}>
				{project.saving ? 'Saving…' : 'Save project'}
			</button>
		</div>

		{#if showDesign}
			<ProjectDesignPanel />
		{/if}

		<div class="row assets">
			{#each project.assets as asset, index (asset.id)}
				<div class="chip-group" class:open={project.openAssetId === asset.id}>
					{#if renaming === asset.id}
						<!-- svelte-ignore a11y_autofocus -->
						<input
							class="rename"
							value={asset.id}
							autofocus
							onblur={(e) => finishRename(asset.id, e.currentTarget.value)}
							onkeydown={(e) => {
								if (e.key === 'Enter') e.currentTarget.blur();
								if (e.key === 'Escape') renaming = null;
							}}
						/>
					{:else}
						<button
							class="chip"
							disabled={busy}
							onclick={() => open(asset.id)}
							ondblclick={() => (renaming = asset.id)}
							title={`${asset.assetType} — double-click to rename`}
						>
							{asset.id}
						</button>
					{/if}

					{#if project.openAssetId === asset.id}
						<span class="tools">
							<button title="Move earlier" disabled={index === 0} onclick={() => project.moveAsset(asset.id, -1)}>◀</button>
							<button
								title="Move later"
								disabled={index === project.assets.length - 1}
								onclick={() => project.moveAsset(asset.id, 1)}>▶</button
							>
							<button title="Duplicate" onclick={() => duplicate(asset.id)}>⧉</button>
							<button title="Remove" class="danger" onclick={() => remove(asset.id)}>✕</button>
						</span>
					{/if}
				</div>
			{/each}

			<label class="add">
				<span>+ Add</span>
				<select
					value=""
					disabled={busy}
					onchange={(e) => {
						const type = e.currentTarget.value;
						e.currentTarget.value = '';
						if (type) add(type);
					}}
				>
					<option value="">asset…</option>
					{#each assetTypes as type (type.id)}
						<option value={type.id}>{type.label}</option>
					{/each}
				</select>
			</label>

			{#if project.openAssetId}
				<button class="apply" onclick={commit}>Apply edits to “{project.openAssetId}”</button>
			{/if}
		</div>

		{#if project.errors.length || project.warnings.length}
			<ul class="problems">
				{#each project.errors as problem (problem.where + problem.message)}
					<li class="error"><code>{problem.where}</code> {problem.message}</li>
				{/each}
				{#each project.warnings as problem (problem.where + problem.message)}
					<li class="warning"><code>{problem.where}</code> {problem.message}</li>
				{/each}
			</ul>
		{/if}
	</div>
{:else if project.loaded && project.error}
	<p class="project-bar note">{project.error}</p>
{/if}

<style>
	.project-bar {
		background: var(--bg-surface, #1a1a1f);
		border-bottom: 1px solid var(--border, #2e2e36);
		padding: 8px 20px;
		font-size: 12px;
	}

	.note {
		margin: 0;
		color: var(--text-secondary, #9d9baa);
	}

	.row {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 26px;
	}

	.row.assets {
		flex-wrap: wrap;
		margin-top: 6px;
	}

	.app-name {
		font-weight: 700;
		color: var(--text-primary, #f0eff4);
	}

	.path {
		color: var(--text-secondary, #9d9baa);
		font-family: ui-monospace, monospace;
	}

	.spacer {
		flex: 1;
	}

	.locale,
	.add {
		display: flex;
		align-items: center;
		gap: 5px;
		color: var(--text-secondary, #9d9baa);
	}

	select,
	.chip,
	.save,
	.ghost,
	.apply,
	.rename {
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
		border: 1px solid var(--border, #2e2e36);
		border-radius: 6px;
		padding: 4px 9px;
		font-size: 12px;
		font-family: inherit;
		cursor: pointer;
	}

	.ghost {
		text-decoration: none;
		color: var(--accent, #f97316);
		font-weight: 600;
		background: transparent;
		border-color: transparent;
	}

	.ghost.on {
		border-color: var(--border, #2e2e36);
		background: var(--bg-card, #222228);
	}

	.chip-group {
		display: inline-flex;
		align-items: center;
		gap: 2px;
	}

	.chip-group.open .chip {
		border-color: var(--accent, #f97316);
		color: var(--accent, #f97316);
	}

	.rename {
		width: 130px;
		cursor: text;
	}

	.tools {
		display: inline-flex;
		gap: 1px;
	}

	.tools button {
		background: transparent;
		border: 1px solid transparent;
		color: var(--text-secondary, #9d9baa);
		border-radius: 4px;
		padding: 3px 5px;
		font-size: 11px;
		line-height: 1;
		cursor: pointer;
		font-family: inherit;
	}

	.tools button:hover:not(:disabled) {
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
	}

	.tools button.danger:hover {
		color: #fca5a5;
	}

	.tools button:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.apply {
		border-style: dashed;
	}

	.chip:disabled,
	.save:disabled,
	select:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.dirty {
		color: var(--accent, #f97316);
	}

	.problems {
		margin: 8px 0 0;
		padding-left: 18px;
		line-height: 1.5;
	}

	.problems .error {
		color: #fca5a5;
	}

	.problems .warning {
		color: #fcd34d;
	}

	.problems code {
		font-family: ui-monospace, monospace;
	}
</style>

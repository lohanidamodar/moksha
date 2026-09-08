<script>
	/**
	 * The project strip: which project is open, its assets, the locale being
	 * edited, and saving back to moksha.json.
	 *
	 * Only shown when the studio was opened on a project. Without one the
	 * editor still works as a scratchpad, with the queue below.
	 */
	import { onMount } from 'svelte';
	import { project } from '$lib/stores/project.svelte.js';

	let busy = $state(false);

	onMount(() => {
		project.load();
	});

	async function open(id) {
		busy = true;
		try {
			await project.openAsset(id);
		} finally {
			busy = false;
		}
	}

	function commit() {
		project.commitOpenAsset();
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

			<div class="spacer"></div>

			{#if project.dirty}
				<span class="dirty">unsaved</span>
			{/if}
			<button class="save" onclick={save} disabled={project.saving || !project.dirty}>
				{project.saving ? 'Saving…' : 'Save project'}
			</button>
		</div>

		<div class="row assets">
			{#each project.assets as asset (asset.id)}
				<button
					class="chip"
					class:open={project.openAssetId === asset.id}
					disabled={busy}
					onclick={() => open(asset.id)}
					title={asset.assetType}
				>
					{asset.id}
				</button>
			{/each}
			{#if project.assets.length === 0}
				<span class="empty">No assets yet — add them to <code>{project.label}</code>.</span>
			{/if}
			{#if project.openAssetId}
				<button class="chip apply" onclick={commit}>Apply edits to “{project.openAssetId}”</button>
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

	.path,
	.empty code {
		color: var(--text-secondary, #9d9baa);
		font-family: ui-monospace, monospace;
	}

	.spacer {
		flex: 1;
	}

	.locale select,
	.chip,
	.save {
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
		border: 1px solid var(--border, #2e2e36);
		border-radius: 6px;
		padding: 4px 9px;
		font-size: 12px;
		font-family: inherit;
		cursor: pointer;
	}

	.locale {
		display: flex;
		align-items: center;
		gap: 5px;
		color: var(--text-secondary, #9d9baa);
	}

	.chip.open {
		border-color: var(--accent, #f97316);
		color: var(--accent, #f97316);
	}

	.chip.apply {
		border-style: dashed;
	}

	.chip:disabled,
	.save:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.dirty {
		color: var(--accent, #f97316);
	}

	.empty {
		color: var(--text-secondary, #9d9baa);
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

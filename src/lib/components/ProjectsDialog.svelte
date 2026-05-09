<script>
	import { projects } from '$lib/stores/projects.svelte.js';

	let { open = $bindable(false) } = $props();

	let newName = $state('');
	let newDesc = $state('');
	let busy = $state(false);
	let editingId = $state(null);
	let editName = $state('');

	async function create(e) {
		e?.preventDefault();
		if (!newName.trim() || busy) return;
		busy = true;
		try {
			await projects.create(newName.trim(), newDesc.trim());
			newName = '';
			newDesc = '';
		} catch {
			// projects.error is set; surfaced below
		} finally {
			busy = false;
		}
	}

	async function pick(id) {
		if (id === projects.currentId) return;
		await projects.select(id);
		open = false;
	}

	function startRename(p) {
		editingId = p.$id;
		editName = p.name;
	}

	async function commitRename() {
		if (!editingId || !editName.trim()) {
			editingId = null;
			return;
		}
		try {
			await projects.rename(editingId, editName.trim());
		} catch (err) {
			console.error(err);
		}
		editingId = null;
	}

	async function remove(p) {
		if (!confirm(`Delete project "${p.name}"? Designs and uploaded assets stay in storage.`)) return;
		try {
			await projects.remove(p.$id);
		} catch (err) {
			console.error(err);
		}
	}

	function close() {
		open = false;
	}

	function backdropClick(e) {
		if (e.target === e.currentTarget) close();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="dialog-backdrop" onclick={backdropClick}>
		<div class="dialog">
			<div class="dialog-header">
				<h2>Projects</h2>
				<button class="close-btn" onclick={close} aria-label="Close">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
				</button>
			</div>

			<div class="dialog-body">
				<form class="create-row" onsubmit={create}>
					<input
						type="text"
						placeholder="New project name"
						bind:value={newName}
						required
					/>
					<button class="primary-btn" type="submit" disabled={busy || !newName.trim()}>
						{busy ? 'Creating...' : 'Create'}
					</button>
				</form>

				{#if projects.error}
					<div class="error">{projects.error}</div>
				{/if}

				{#if projects.loading}
					<div class="empty">Loading projects...</div>
				{:else if projects.items.length === 0}
					<div class="empty">No projects yet. Create one above to start saving your work.</div>
				{:else}
					<ul class="project-list">
						{#each projects.items as p (p.$id)}
							<li class="project-item" class:active={p.$id === projects.currentId}>
								{#if editingId === p.$id}
									<input
										class="rename-input"
										bind:value={editName}
										onblur={commitRename}
										onkeydown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') editingId = null; }}
										autofocus
									/>
								{:else}
									<button class="project-pick" onclick={() => pick(p.$id)}>
										<span class="project-name">{p.name}</span>
										{#if p.description}
											<span class="project-desc">{p.description}</span>
										{/if}
									</button>
								{/if}
								<div class="project-actions">
									<button class="icon-btn" title="Rename" onclick={() => startRename(p)}>
										<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
									</button>
									<button class="icon-btn danger" title="Delete" onclick={() => remove(p)}>
										<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
									</button>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.dialog-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.dialog {
		width: 100%;
		max-width: 460px;
		background: var(--bg-surface, #1a1a1f);
		border: 1px solid var(--border, #2e2e36);
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		max-height: 90vh;
		overflow: hidden;
	}

	.dialog-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 18px;
		border-bottom: 1px solid var(--border, #2e2e36);
	}

	.dialog-header h2 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		color: var(--text-primary, #f0eff4);
	}

	.close-btn {
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
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: var(--text-primary, #f0eff4);
	}

	.dialog-body {
		padding: 14px 18px 18px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		overflow-y: auto;
	}

	.create-row {
		display: flex;
		gap: 8px;
	}

	.create-row input {
		flex: 1;
		padding: 8px 12px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 7px;
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
		font-family: inherit;
		font-size: 13px;
		outline: none;
	}

	.create-row input:focus {
		border-color: var(--accent, #f97316);
	}

	.primary-btn {
		padding: 8px 14px;
		border: none;
		border-radius: 8px;
		background: var(--accent, #f97316);
		color: #fff;
		font-family: inherit;
		font-weight: 600;
		font-size: 13px;
		cursor: pointer;
	}

	.primary-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error {
		padding: 8px 10px;
		background: rgba(239, 68, 68, 0.12);
		border: 1px solid rgba(239, 68, 68, 0.4);
		border-radius: 6px;
		color: #fca5a5;
		font-size: 12px;
	}

	.empty {
		padding: 18px 0;
		text-align: center;
		color: var(--text-secondary, #9d9baa);
		font-size: 12px;
		opacity: 0.8;
	}

	.project-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.project-item {
		display: flex;
		align-items: center;
		gap: 6px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 8px;
		background: var(--bg-card, #222228);
		padding: 6px 8px;
	}

	.project-item.active {
		border-color: var(--accent, #f97316);
	}

	.project-pick {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		border: none;
		background: transparent;
		color: var(--text-primary, #f0eff4);
		font-family: inherit;
		text-align: left;
		cursor: pointer;
		padding: 6px 4px;
	}

	.project-name {
		font-size: 13px;
		font-weight: 600;
	}

	.project-desc {
		font-size: 11px;
		color: var(--text-secondary, #9d9baa);
	}

	.rename-input {
		flex: 1;
		padding: 6px 8px;
		border: 1px solid var(--accent, #f97316);
		border-radius: 6px;
		background: var(--bg, #0f0f11);
		color: var(--text-primary, #f0eff4);
		font-family: inherit;
		font-size: 13px;
		outline: none;
	}

	.project-actions {
		display: flex;
		gap: 2px;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		cursor: pointer;
	}

	.icon-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: var(--text-primary, #f0eff4);
	}

	.icon-btn.danger:hover {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}
</style>

<script>
	import { APP_NAME } from '$lib/config.js';
	import { assetTypes, getAssetType } from '$lib/assets/index.js';
	import { editor } from '$lib/stores/editor.svelte.js';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { projects } from '$lib/stores/projects.svelte.js';
	import AuthDialog from './AuthDialog.svelte';
	import ProjectsDialog from './ProjectsDialog.svelte';

	let authOpen = $state(false);
	let projectsOpen = $state(false);
	let userMenuOpen = $state(false);

	let currentModule = $derived(getAssetType(editor.assetType));

	function handleAssetChange(e) {
		const id = e.target.value;
		const mod = getAssetType(id);
		editor.assetType = id;
		editor.sizeId = null;
		editor.layout = mod?.layouts[0]?.id ?? '';
		if (mod?.defaultPhoneFrame) {
			editor.phoneFrame = mod.defaultPhoneFrame;
		}
	}

	async function handleSignOut() {
		userMenuOpen = false;
		await auth.logout();
		projects.clearLocal();
	}

	function openProjects() {
		if (!auth.user) {
			authOpen = true;
		} else {
			projectsOpen = true;
		}
	}

	function userInitial() {
		const n = auth.user?.name || auth.user?.email || '?';
		return n.charAt(0).toUpperCase();
	}
</script>

<header class="header">
	<div class="header-left">
		<span class="app-name">{APP_NAME}</span>
	</div>

	<div class="header-center">
		<select class="asset-select" value={editor.assetType} onchange={handleAssetChange}>
			{#each assetTypes as assetType}
				<option value={assetType.id}>{assetType.icon}  {assetType.label}</option>
			{/each}
		</select>
	</div>

	<div class="header-right">
		<button class="project-btn" onclick={openProjects} title="Projects">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
			<span class="project-label">
				{#if !auth.user}
					Sign in to save
				{:else if projects.current}
					{projects.current.name}
				{:else}
					Choose project
				{/if}
			</span>
		</button>

		{#if auth.loading}
			<span class="loading">…</span>
		{:else if auth.user}
			<div class="user-menu">
				<button class="user-btn" onclick={() => (userMenuOpen = !userMenuOpen)} title={auth.user.email}>
					{userInitial()}
				</button>
				{#if userMenuOpen}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="user-popover" onmouseleave={() => (userMenuOpen = false)}>
						<div class="user-info">
							<div class="user-name">{auth.user.name || auth.user.email}</div>
							{#if auth.user.name}
								<div class="user-email">{auth.user.email}</div>
							{/if}
						</div>
						<button class="popover-item" onclick={() => { userMenuOpen = false; projectsOpen = true; }}>
							Manage projects
						</button>
						<button class="popover-item danger" onclick={handleSignOut}>Sign out</button>
					</div>
				{/if}
			</div>
		{:else}
			<button class="signin-btn" onclick={() => (authOpen = true)}>Sign in</button>
		{/if}
	</div>
</header>

<AuthDialog bind:open={authOpen} />
<ProjectsDialog bind:open={projectsOpen} />

<style>
	.header {
		display: flex;
		align-items: center;
		padding: 0 20px;
		height: 50px;
		background: var(--bg-surface, #1a1a1f);
		border-bottom: 1px solid var(--border, #2e2e36);
		position: relative;
		z-index: 100;
		gap: 16px;
	}

	.header-left {
		flex-shrink: 0;
	}

	.app-name {
		font-size: 20px;
		font-weight: 800;
		color: var(--accent, #f97316);
		letter-spacing: -0.5px;
	}

	.header-center {
		flex: 1;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 8px;
		position: relative;
	}

	.asset-select {
		padding: 7px 32px 7px 12px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 8px;
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
		font-family: var(--font, 'Inter'), sans-serif;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		outline: none;
		transition: border-color 0.15s;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239d9baa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 10px center;
	}

	.asset-select:hover {
		border-color: #444;
	}

	.asset-select:focus {
		border-color: var(--accent, #f97316);
	}

	.asset-select option {
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
	}

	.project-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 7px 12px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 8px;
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
		font-family: inherit;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: border-color 0.15s;
		max-width: 220px;
	}

	.project-btn:hover {
		border-color: var(--accent, #f97316);
	}

	.project-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.signin-btn {
		padding: 7px 14px;
		border: none;
		border-radius: 8px;
		background: var(--accent, #f97316);
		color: #fff;
		font-family: inherit;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
	}

	.signin-btn:hover {
		background: #ea6c10;
	}

	.user-btn {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 1px solid var(--border, #2e2e36);
		background: var(--bg-card, #222228);
		color: var(--accent, #f97316);
		font-family: inherit;
		font-weight: 700;
		font-size: 13px;
		cursor: pointer;
	}

	.user-btn:hover {
		border-color: var(--accent, #f97316);
	}

	.user-menu {
		position: relative;
	}

	.user-popover {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		min-width: 200px;
		background: var(--bg-surface, #1a1a1f);
		border: 1px solid var(--border, #2e2e36);
		border-radius: 8px;
		padding: 6px;
		z-index: 200;
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
	}

	.user-info {
		padding: 8px 10px;
		border-bottom: 1px solid var(--border, #2e2e36);
		margin-bottom: 4px;
	}

	.user-name {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-primary, #f0eff4);
	}

	.user-email {
		font-size: 11px;
		color: var(--text-secondary, #9d9baa);
	}

	.popover-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 8px 10px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-primary, #f0eff4);
		font-family: inherit;
		font-size: 12px;
		cursor: pointer;
	}

	.popover-item:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.popover-item.danger {
		color: #fca5a5;
	}

	.popover-item.danger:hover {
		background: rgba(239, 68, 68, 0.12);
	}

	.loading {
		font-size: 12px;
		color: var(--text-secondary, #9d9baa);
	}
</style>
